import { researchStorage } from './storage-service.js'
import {
  normalizeTipo,
  tipoLabel,
  formatLawNumber,
  buildLegislationDocId,
  parseLegislationUrl,
  parseSearchQuery,
  decodeHtmlBytes,
  parseLegislationHtmlToBlocks,
  parseLegislationTextToBlocks,
  extractCamaraFullTextUrl
} from './legislation-utils.js'
import { LEGISLATION_CATALOG, findCatalogEntry, searchCatalog } from './legislation-catalog.js'

const SENADO_LIST_URL = 'https://legis.senado.leg.br/dadosabertos/legislacao/lista.json'

const URN_TYPE_BY_CODE = {
  LEI: 'lei',
  LCP: 'lei.complementar',
  DEC: 'decreto',
  DEL: 'decreto.lei',
  EMC: 'emenda.constitucional',
  MPV: 'medida.provisoria'
}

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function buildNormasUrl(tipo, numero, dataAssinatura, ano) {
  const urnType = URN_TYPE_BY_CODE[normalizeTipo(tipo)]
  const cleanNum = String(numero || '').replace(/\D+/g, '')
  if (!urnType || !cleanNum) return ''
  const dateParts = String(dataAssinatura || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/)
  const dateSegment = dateParts ? `${dateParts[3]}-${dateParts[2]}-${dateParts[1]}` : String(ano || '')
  if (!dateSegment) return ''
  return `https://normas.leg.br/?urn=urn:lex:br:federal:${urnType}:${dateSegment};${cleanNum}`
}

function mapSenadoDocToEntry(raw) {
  if (!raw) return null
  const tipo = normalizeTipo(raw.tipo)
  const numero = raw.numero ? String(Number.parseInt(String(raw.numero).replace(/\D+/g, ''), 10) || raw.numero) : ''
  const ano = String(raw.anoassinatura || '').trim() || (raw.dataassinatura?.match(/(\d{4})$/)?.[1] || '')
  const catalogMatch = findCatalogEntry({ tipo, numero, ano })

  const formattedNum = numero ? formatLawNumber(numero) : ''
  const defaultTitle =
    raw.normaNome ||
    `${tipoLabel(tipo)}${formattedNum ? ` nº ${formattedNum}` : ''}${ano ? `/${ano}` : ''}`
  const normasUrl = buildNormasUrl(tipo, numero, raw.dataassinatura, ano)

  if (catalogMatch) {
    return {
      ...catalogMatch,
      ementa: catalogMatch.ementa || raw.ementa || '',
      dataAssinatura: catalogMatch.dataAssinatura || raw.dataassinatura || '',
      normasUrl: catalogMatch.normasUrl || normasUrl,
      source: 'catalog+senado'
    }
  }

  return {
    id: `${tipo.toLowerCase() || 'norma'}-${numero || 'sn'}-${ano || 'sa'}`,
    docId: buildLegislationDocId({ tipo, numero, ano, slug: raw.norma || raw.id }),
    tipo,
    numero,
    ano,
    dataAssinatura: String(raw.dataassinatura || ''),
    shortName: `${tipoLabel(tipo)}${formattedNum ? ` nº ${formattedNum}` : ''}${ano ? `/${ano}` : ''}`,
    title: raw.ementa ? `${defaultTitle} — ${String(raw.ementa).slice(0, 80)}${raw.ementa.length > 80 ? '…' : ''}` : defaultTitle,
    ementa: String(raw.ementa || ''),
    tags: [],
    bundledPath: '',
    planaltoUrl: '',
    camaraUrl: '',
    normasUrl,
    senadoId: String(raw.id || ''),
    source: 'senado'
  }
}

async function fetchJsonWithTimeout(url, timeoutMs = 12000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return await res.json()
  } finally {
    clearTimeout(timer)
  }
}

async function fetchBufferWithRetry(url, { timeoutMs = 15000, retries = 1 } = {}) {
  let lastErr = null
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(url, { signal: controller.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = new Uint8Array(await res.arrayBuffer())
      return { buf, contentType: res.headers.get('content-type') || '', url: res.url || url }
    } catch (err) {
      lastErr = err
      if (attempt < retries) {
        await new Promise((r) => setTimeout(r, 800))
      }
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr
}

async function querySenadoLista({ tipo = '', numero = '', ano = '' } = {}) {
  const params = new URLSearchParams()
  if (tipo && tipo !== 'CF') params.set('tipo', tipo)
  if (numero) params.set('numero', String(numero))
  if (ano) params.set('ano', String(ano))
  if ([...params.keys()].length === 0) return []

  const json = await fetchJsonWithTimeout(`${SENADO_LIST_URL}?${params.toString()}`, 12000)
  const rawDocs = json?.ListaDocumento?.documentos?.documento
  const list = Array.isArray(rawDocs) ? rawDocs : rawDocs ? [rawDocs] : []
  return list.slice(0, 30).map(mapSenadoDocToEntry).filter(Boolean)
}

/**
 * Pesquisa legislação federal combinando o catálogo curado local com a API de Dados Abertos do Senado Federal.
 */
export async function searchFederalLegislation(query = '', { tipo = '', ano = '' } = {}) {
  const parsed = parseSearchQuery(query, { tipo, ano })
  const catalogResults = searchCatalog(query, { tipo, ano })

  const hasStructuredSenadoFilter =
    Boolean(parsed.numero) ||
    (Boolean(parsed.tipo) && Boolean(parsed.ano)) ||
    (Boolean(parsed.ano) && Number.parseInt(parsed.ano, 10) >= 1800)

  if (parsed.isUrl || !hasStructuredSenadoFilter) {
    return {
      results: catalogResults,
      senadoQueried: false,
      senadoError: '',
      parsedQuery: parsed
    }
  }

  let senadoResults = []
  let senadoError = ''
  try {
    senadoResults = await querySenadoLista({
      tipo: parsed.tipo,
      numero: parsed.numero,
      ano: parsed.ano
    })
  } catch (err) {
    senadoError =
      err?.name === 'AbortError'
        ? 'Tempo limite excedido ao consultar a API do Senado Federal.'
        : 'Não foi possível consultar a API do Senado Federal agora.'
  }

  const terms = stripAccents(parsed.keywords)
    .split(/\s+/)
    .filter(Boolean)

  if (terms.length && senadoResults.length) {
    senadoResults.sort((a, b) => {
      const ha = stripAccents(`${a.title} ${a.ementa}`)
      const hb = stripAccents(`${b.title} ${b.ementa}`)
      const scoreA = terms.filter((t) => ha.includes(t)).length
      const scoreB = terms.filter((t) => hb.includes(t)).length
      return scoreB - scoreA
    })
  }

  const seenKeys = new Set()
  const merged = []
  const keyOf = (item) =>
    item.id || `${normalizeTipo(item.tipo)}:${item.numero || ''}:${item.ano || ''}`

  for (const item of [...catalogResults, ...senadoResults]) {
    const key = keyOf(item)
    if (seenKeys.has(key)) continue
    seenKeys.add(key)
    merged.push(item)
  }

  return {
    results: merged,
    senadoQueried: true,
    senadoError,
    parsedQuery: parsed
  }
}

/**
 * Resolve metadados oficiais a partir de uma URL (Planalto, Câmara LEGIN, Normas.leg.br ou genérica).
 */
export async function resolveLegislationByUrl(rawUrl) {
  const parsed = parseLegislationUrl(rawUrl)
  if (!parsed.ok) {
    return { ok: false, error: parsed.error }
  }

  const catalogMatch = findCatalogEntry({
    url: parsed.url,
    tipo: parsed.tipo,
    numero: parsed.numero,
    ano: parsed.ano
  })

  if (catalogMatch) {
    return {
      ok: true,
      parsed,
      entry: {
        ...catalogMatch,
        ...(parsed.source === 'planalto' ? { planaltoUrl: parsed.url } : {}),
        ...(parsed.source === 'camara' ? { camaraUrl: parsed.url } : {}),
        ...(parsed.source === 'normas' ? { normasUrl: parsed.url } : {}),
        sourceUrl: parsed.url
      }
    }
  }

  let senadoMatch = null
  if (parsed.tipo && parsed.numero && parsed.tipo !== 'CF') {
    try {
      const list = await querySenadoLista({
        tipo: parsed.tipo,
        numero: parsed.numero,
        ano: parsed.ano || ''
      })
      senadoMatch = list[0] || null
    } catch {
      // Melhor esforço: segue sem travar caso Senado esteja indisponível
    }
  }

  const formattedNum = parsed.numero ? formatLawNumber(parsed.numero) : ''
  const fallbackTitle = parsed.tipo && formattedNum
    ? `${tipoLabel(parsed.tipo)} nº ${formattedNum}${parsed.ano ? `/${parsed.ano}` : ''}`
    : `Legislação (${new URL(parsed.url).hostname})`

  const entry = {
    ...(senadoMatch || {}),
    id: senadoMatch?.id || '',
    docId:
      senadoMatch?.docId ||
      buildLegislationDocId({
        tipo: parsed.tipo,
        numero: parsed.numero,
        ano: parsed.ano,
        slug: new URL(parsed.url).pathname
      }),
    tipo: senadoMatch?.tipo || parsed.tipo || 'LEI',
    numero: senadoMatch?.numero || parsed.numero || '',
    ano: senadoMatch?.ano || parsed.ano || '',
    title: senadoMatch?.title || fallbackTitle,
    ementa: senadoMatch?.ementa || '',
    dataAssinatura: senadoMatch?.dataAssinatura || '',
    bundledPath: '',
    planaltoUrl: parsed.source === 'planalto' ? parsed.url : senadoMatch?.planaltoUrl || '',
    camaraUrl: parsed.source === 'camara' ? parsed.url : senadoMatch?.camaraUrl || '',
    normasUrl: parsed.source === 'normas' ? parsed.url : senadoMatch?.normasUrl || '',
    sourceUrl: parsed.url
  }

  return { ok: true, parsed, entry }
}

/**
 * Obtém os blocos estruturados e texto canônico de uma norma (bundle offline -> Câmara -> URL direta).
 */
export async function loadLegislationFullText(entryOrUrl) {
  let entry = entryOrUrl
  if (typeof entryOrUrl === 'string') {
    const resolved = await resolveLegislationByUrl(entryOrUrl)
    if (!resolved.ok) {
      return { ok: false, reason: 'invalid-url', message: resolved.error }
    }
    entry = resolved.entry
  }
  if (!entry || typeof entry !== 'object') {
    return { ok: false, reason: 'invalid-entry', message: 'Norma não informada.' }
  }

  // Prioridade 1: texto oficial embutido offline no app (ex.: Lei nº 13.005/2014 - PNE)
  if (entry.bundledPath) {
    try {
      const json = await fetchJsonWithTimeout(entry.bundledPath, 10000)
      const blocks = Array.isArray(json?.blocks) ? json.blocks : []
      if (blocks.length > 0) {
        const plainText = blocks.map((b) => b.text).join('\n\n')
        return { ok: true, entry, blocks, plainText, loadedFrom: 'bundled' }
      }
    } catch {
      // Continua para Câmara caso o JSON local falhe
    }
  }

  // Prioridade 2: texto integral oficial via Câmara dos Deputados (LEGIN, com CORS liberado)
  if (entry.camaraUrl) {
    try {
      let targetUrl = entry.camaraUrl
      let fetched = await fetchBufferWithRetry(targetUrl, { timeoutMs: 15000, retries: 1 })
      let html = decodeHtmlBytes(fetched.buf)

      if (/-norma-pl\.html?$/i.test(targetUrl)) {
        const deepUrl = extractCamaraFullTextUrl(html, targetUrl)
        if (deepUrl) {
          targetUrl = deepUrl
          fetched = await fetchBufferWithRetry(targetUrl, { timeoutMs: 15000, retries: 1 })
          html = decodeHtmlBytes(fetched.buf)
        }
      }

      const { blocks, plainText } = parseLegislationHtmlToBlocks(html)
      if (blocks.length > 0) {
        return {
          ok: true,
          entry: { ...entry, camaraUrl: targetUrl },
          blocks,
          plainText,
          loadedFrom: 'camara'
        }
      }
    } catch {
      // Cai para fallback guiado
    }
  }

  // Prioridade 3: URL direta externa (exceto Planalto/Normas, que bloqueiam CORS no navegador)
  const directUrl = entry.sourceUrl || ''
  if (directUrl) {
    const parsedDirect = parseLegislationUrl(directUrl)
    if (
      parsedDirect.ok &&
      parsedDirect.source !== 'planalto' &&
      parsedDirect.source !== 'normas' &&
      directUrl !== entry.camaraUrl
    ) {
      try {
        const fetched = await fetchBufferWithRetry(directUrl, { timeoutMs: 12000, retries: 0 })
        const rawText = decodeHtmlBytes(fetched.buf)
        const isPlain = /text\/plain/i.test(fetched.contentType) || /\.txt$/i.test(directUrl)
        const parsedBody = isPlain ? parseLegislationTextToBlocks(rawText) : parseLegislationHtmlToBlocks(rawText)
        if (parsedBody.blocks.length > 0) {
          return {
            ok: true,
            entry,
            blocks: parsedBody.blocks,
            plainText: parsedBody.plainText,
            loadedFrom: 'url'
          }
        }
      } catch {
        // Fallback guiado
      }
    }
  }

  const isPlanalto = /planalto\.gov\.br/i.test(entry.planaltoUrl || entry.sourceUrl || '')
  return {
    ok: false,
    reason: 'cors-fallback',
    entry,
    message: isPlanalto
      ? 'O portal do Planalto bloqueia a leitura automática pelo navegador (CORS). Abra o link oficial, copie o texto ou salve o HTML da página e conclua abaixo em 1 passo.'
      : 'Não foi possível baixar o texto integral automaticamente neste navegador. Abra o texto oficial no link abaixo e cole o conteúdo ou envie o arquivo .htm/.html.'
  }
}

/**
 * Insere ou atualiza a legislação no corpus do usuário preservando marcações existentes.
 */
export function insertLegislationIntoCorpus({ entry, blocks, plainText, loadedFrom = 'bundled' }) {
  if (!entry || !Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('Não há conteúdo estruturado válido para inserir no corpus.')
  }
  const canonicalPlainText = plainText || blocks.map((b) => b.text).join('\n\n')
  const docId = entry.docId || buildLegislationDocId(entry)

  const existing = researchStorage.getDocuments().find(
    (d) =>
      d.id === docId ||
      (entry.planaltoUrl && d.legislation?.planaltoUrl === entry.planaltoUrl) ||
      (entry.numero &&
        entry.tipo &&
        d.legislation?.numero === String(entry.numero) &&
        d.legislation?.tipo === normalizeTipo(entry.tipo) &&
        (!entry.ano || d.legislation?.ano === String(entry.ano)))
  )

  const legislationMeta = {
    catalogId: entry.id || '',
    tipo: normalizeTipo(entry.tipo) || '',
    numero: String(entry.numero || ''),
    ano: String(entry.ano || ''),
    ementa: String(entry.ementa || ''),
    dataAssinatura: String(entry.dataAssinatura || ''),
    planaltoUrl: String(entry.planaltoUrl || ''),
    camaraUrl: String(entry.camaraUrl || ''),
    normasUrl: String(entry.normasUrl || ''),
    sourceUrl: String(entry.sourceUrl || entry.planaltoUrl || entry.camaraUrl || entry.normasUrl || ''),
    loadedFrom
  }

  if (existing) {
    const updated = researchStorage.updateDocument(existing.id, {
      title: entry.title || existing.title,
      type: existing.type || 'legislation',
      extension: existing.extension || '.txt',
      mimeType: existing.mimeType || 'text/plain',
      size: canonicalPlainText.length,
      content: canonicalPlainText,
      docxBlocks: blocks,
      legislation: { ...(existing.legislation || {}), ...legislationMeta }
    })
    return { doc: updated, updatedExisting: true }
  }

  const tags = Array.from(
    new Set([
      'legislacao',
      String(legislationMeta.tipo || 'lei').toLowerCase(),
      ...(legislationMeta.numero && legislationMeta.ano ? [`${legislationMeta.numero}-${legislationMeta.ano}`] : []),
      ...(Array.isArray(entry.tags) ? entry.tags : [])
    ])
  )

  const created = researchStorage.addDocument({
    id: docId,
    title: entry.title || `Lei nº ${formatLawNumber(legislationMeta.numero) || 'S/N'}`,
    participant: 'Legislação Federal',
    group: 'Legislação',
    folder: researchStorage.formatPersistenceFolder('legislacao'),
    type: 'legislation',
    extension: '.txt',
    mimeType: 'text/plain',
    size: canonicalPlainText.length,
    uploadedAt: Date.now(),
    status: 'local',
    storageProvider: 'local',
    tags,
    content: canonicalPlainText,
    docxBlocks: blocks,
    legislation: legislationMeta,
    quotations: []
  })

  return { doc: created, updatedExisting: false }
}

/**
 * Reidrata em outro dispositivo o conteúdo completo de uma lei restaurada via sincronização GitHub.
 */
export async function hydrateLegislationDocument(doc) {
  if (!doc) return { ok: false, reason: 'missing-doc', message: 'Documento não encontrado.' }
  if (String(doc.content || '').trim()) {
    return { ok: true, doc }
  }

  const meta = doc.legislation || {}
  const catalogMatch = findCatalogEntry({
    catalogId: meta.catalogId,
    id: doc.id,
    docId: doc.id,
    url: meta.planaltoUrl || meta.camaraUrl || meta.normasUrl || meta.sourceUrl,
    tipo: meta.tipo,
    numero: meta.numero,
    ano: meta.ano
  })

  const entry = {
    ...(catalogMatch || {}),
    ...meta,
    id: catalogMatch?.id || meta.catalogId || doc.id,
    docId: doc.id,
    title: doc.title || catalogMatch?.title || 'Legislação',
    bundledPath: catalogMatch?.bundledPath || '',
    camaraUrl: catalogMatch?.camaraUrl || meta.camaraUrl || '',
    planaltoUrl: meta.planaltoUrl || catalogMatch?.planaltoUrl || '',
    normasUrl: meta.normasUrl || catalogMatch?.normasUrl || ''
  }

  const loaded = await loadLegislationFullText(entry)
  if (!loaded.ok) {
    return loaded
  }

  const updated = researchStorage.updateDocument(doc.id, {
    size: loaded.plainText.length,
    content: loaded.plainText,
    docxBlocks: loaded.blocks,
    legislation: {
      ...meta,
      catalogId: entry.id || meta.catalogId || '',
      camaraUrl: loaded.entry?.camaraUrl || entry.camaraUrl || '',
      loadedFrom: loaded.loadedFrom
    }
  })

  return { ok: true, doc: updated }
}

export { LEGISLATION_CATALOG }
