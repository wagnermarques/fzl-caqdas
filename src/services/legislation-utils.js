/**
 * Utilitários puros para parsing de URLs, busca e estruturação de legislação federal brasileira
 * em blocos legíveis pelo `<fzl-document-reader>`.
 *
 * Sem dependências de DOM do navegador (executável também em `node --test`).
 */

const TIPO_MAP = new Map([
  ['lei', 'LEI'],
  ['lei-n', 'LEI'],
  ['l', 'LEI'],
  ['lcp', 'LCP'],
  ['leicom', 'LCP'],
  ['lei.complementar', 'LCP'],
  ['lei complementar', 'LCP'],
  ['dec', 'DEC'],
  ['dec-n', 'DEC'],
  ['decreto', 'DEC'],
  ['decret', 'DEC'],
  ['d', 'DEC'],
  ['del', 'DEL'],
  ['decreto-lei', 'DEL'],
  ['decreto.lei', 'DEL'],
  ['decreto lei', 'DEL'],
  ['emc', 'EMC'],
  ['emenda constitucional', 'EMC'],
  ['emenda.constitucional', 'EMC'],
  ['mpv', 'MPV'],
  ['medida provisoria', 'MPV'],
  ['medida provisória', 'MPV'],
  ['medida.provisoria', 'MPV'],
  ['cf', 'CF'],
  ['constituicao', 'CF'],
  ['constituição', 'CF']
])

export function normalizeTipo(rawTipo) {
  const key = String(rawTipo || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
  return TIPO_MAP.get(key) || (key ? key.toUpperCase() : '')
}

export function tipoLabel(rawTipo) {
  const tipo = normalizeTipo(rawTipo)
  switch (tipo) {
    case 'LEI':
      return 'Lei'
    case 'LCP':
      return 'Lei Complementar'
    case 'DEC':
      return 'Decreto'
    case 'DEL':
      return 'Decreto-Lei'
    case 'EMC':
      return 'Emenda Constitucional'
    case 'MPV':
      return 'Medida Provisória'
    case 'CF':
      return 'Constituição Federal'
    default:
      return tipo || 'Norma'
  }
}

export function formatLawNumber(numero) {
  const digits = String(numero || '').replace(/\D+/g, '')
  if (!digits) return ''
  const num = Number.parseInt(digits, 10)
  if (!Number.isFinite(num)) return digits
  return num >= 1000 ? num.toLocaleString('pt-BR') : String(num)
}

export function buildLegislationDocId({ catalogId, tipo, numero, ano, slug } = {}) {
  if (catalogId) {
    return String(catalogId).startsWith('doc-') ? String(catalogId) : `doc-${catalogId}`
  }
  const normTipo = normalizeTipo(tipo)
  const cleanNum = String(numero || '').replace(/\D+/g, '')
  const cleanAno = String(ano || '').replace(/\D+/g, '')
  if (normTipo && cleanNum) {
    return `doc-${normTipo.toLowerCase()}-${cleanNum}${cleanAno ? `-${cleanAno}` : ''}`
  }
  const safeSlug = String(slug || 'norma')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
  return `doc-leg-${safeSlug || 'norma'}`
}

function normalizeUrlInput(rawUrl) {
  const trimmed = String(rawUrl || '').trim()
  if (!trimmed) return ''
  if (/^urn:lex:/i.test(trimmed)) {
    return `https://normas.leg.br/?urn=${trimmed}`
  }
  if (/^[a-z0-9.-]+\.[a-z]{2,}(\/|$|\?)/i.test(trimmed) && !/^[a-z]+:\/\//i.test(trimmed)) {
    return `https://${trimmed}`
  }
  return trimmed
}

/**
 * Interpreta uma URL oficial do Planalto, Câmara dos Deputados (LEGIN), Normas.leg.br ou genérica.
 */
export function parseLegislationUrl(rawUrl) {
  const normalizedInput = normalizeUrlInput(rawUrl)
  if (!normalizedInput) {
    return {
      ok: false,
      error: 'Informe uma URL válida (ex.: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm).'
    }
  }

  let parsed
  try {
    parsed = new URL(normalizedInput)
  } catch {
    return {
      ok: false,
      error: 'Informe uma URL válida (ex.: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm).'
    }
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      ok: false,
      error: 'A URL deve começar com http:// ou https://.'
    }
  }

  const host = parsed.hostname.toLowerCase()
  const pathname = parsed.pathname
  const cleanUrl = parsed.toString()

  // Portal da Legislação — Planalto
  if (host === 'planalto.gov.br' || host.endsWith('.planalto.gov.br')) {
    const file = pathname.split('/').filter(Boolean).pop() || ''
    const base = file.replace(/\.html?$/i, '')
    const yearMatch = pathname.match(/(?:^|\/)(19\d{2}|20\d{2})(?:\/|$)/)
    const ano = yearMatch ? yearMatch[1] : null

    if (/^constituic/i.test(base) || /constituicao\.htm$/i.test(file)) {
      return {
        ok: true,
        source: 'planalto',
        url: cleanUrl,
        tipo: 'CF',
        numero: '1988',
        ano: '1988'
      }
    }

    const m = base.match(/^(lcp|del|emc|mpv|l|d)0*(\d+)/i)
    if (m) {
      return {
        ok: true,
        source: 'planalto',
        url: cleanUrl,
        tipo: normalizeTipo(m[1]),
        numero: String(Number.parseInt(m[2], 10)),
        ano
      }
    }

    return {
      ok: true,
      source: 'planalto',
      url: cleanUrl,
      tipo: null,
      numero: null,
      ano
    }
  }

  // Portal LEGIN — Câmara dos Deputados
  if (host === 'camara.leg.br' || host.endsWith('.camara.leg.br')) {
    const camaraHttps = cleanUrl.replace(/^http:\/\//i, 'https://')
    const m = pathname.match(/\/legin\/fed\/(lei|leicom|decreto|decret|del|emc|mpv)\/(\d{4})\/[^/]+?-(\d+)-/i)
    if (m) {
      return {
        ok: true,
        source: 'camara',
        url: camaraHttps,
        tipo: normalizeTipo(m[1]),
        numero: String(Number.parseInt(m[3], 10)),
        ano: m[2],
        isNormaIndex: /-norma-pl\.html?$/i.test(pathname)
      }
    }
    return {
      ok: true,
      source: 'camara',
      url: camaraHttps,
      tipo: null,
      numero: null,
      ano: null,
      isNormaIndex: /-norma-pl\.html?$/i.test(pathname)
    }
  }

  // Portal Normas.leg.br / URN LexML
  if (host === 'normas.leg.br' || host.endsWith('.normas.leg.br')) {
    const urnParam = parsed.searchParams.get('urn') || cleanUrl
    const decodedUrn = decodeURIComponent(urnParam)
    const urnMatch = decodedUrn.match(
      /urn:lex:br:federal:(lei\.complementar|lei|decreto\.lei|decreto|emenda\.constitucional|medida\.provisoria):(\d{4})(?:-\d{2}-\d{2})?;(\d+)/i
    )
    if (urnMatch) {
      return {
        ok: true,
        source: 'normas',
        url: cleanUrl.replace(/^http:\/\//i, 'https://'),
        tipo: normalizeTipo(urnMatch[1]),
        numero: String(Number.parseInt(urnMatch[3], 10)),
        ano: urnMatch[2],
        urn: urnMatch[0]
      }
    }
    return {
      ok: true,
      source: 'normas',
      url: cleanUrl.replace(/^http:\/\//i, 'https://'),
      tipo: null,
      numero: null,
      ano: null,
      urn: parsed.searchParams.get('urn') || ''
    }
  }

  return {
    ok: true,
    source: 'other',
    url: cleanUrl,
    tipo: null,
    numero: null,
    ano: null
  }
}

/**
 * Interpreta termos de pesquisa livre (ex.: "13005", "13.005/2014", "Lei 9.394/1996", "PNE", ou URL).
 */
export function parseSearchQuery(rawQuery, { tipo = '', ano = '' } = {}) {
  const original = String(rawQuery || '').trim()
  if (/^(https?:\/\/|www\.|planalto\.gov\.br|normas\.leg\.br|www2\.camara\.leg\.br|urn:lex:)/i.test(original)) {
    return {
      isUrl: true,
      urlInfo: parseLegislationUrl(original),
      tipo: normalizeTipo(tipo),
      numero: '',
      ano: String(ano || '').trim(),
      keywords: original
    }
  }

  let resolvedTipo = normalizeTipo(tipo)
  let work = original

  const tipoPatterns = [
    [/\b(?:lei\s+complementar|lcp)\b/gi, 'LCP'],
    [/\b(?:decreto[- ]lei|del)\b/gi, 'DEL'],
    [/\b(?:emenda\s+constitucional|emc|ec)\b/gi, 'EMC'],
    [/\b(?:medida\s+provis[oó]ria|mpv|mp)\b/gi, 'MPV'],
    [/\b(?:decreto|dec)\b/gi, 'DEC'],
    [/\blei\b/gi, 'LEI']
  ]
  for (const [re, code] of tipoPatterns) {
    if (re.test(work)) {
      if (!resolvedTipo) resolvedTipo = code
      work = work.replace(re, ' ')
    }
  }

  work = work.replace(/\bn[º°o.]*\b/gi, ' ').trim()

  let numero = ''
  let resolvedAno = String(ano || '').replace(/\D+/g, '')
  if (resolvedAno.length !== 4) resolvedAno = ''

  // Ex.: "13.005/2014" ou "13005/2014" ou "9.394 de 1996"
  const numSlashYear = work.match(/\b(\d{1,3}(?:\.\d{3})*|\d+)\s*(?:\/|\s+de\s+)\s*((?:19|20)\d{2})\b/i)
  if (numSlashYear) {
    numero = numSlashYear[1].replace(/\D+/g, '')
    if (!resolvedAno) resolvedAno = numSlashYear[2]
    work = work.replace(numSlashYear[0], ' ')
  } else {
    // Ex.: apenas "13005" ou "13.005" ou "9394"
    const onlyNum = work.match(/\b(\d{1,3}\.\d{3}|\d{3,6})\b/)
    if (onlyNum) {
      const digits = onlyNum[1].replace(/\D+/g, '')
      if (!resolvedAno && /^(19|20)\d{2}$/.test(digits) && /^\d{4}$/.test(work.trim())) {
        resolvedAno = digits
      } else {
        numero = String(Number.parseInt(digits, 10))
      }
      work = work.replace(onlyNum[0], ' ')
    }
  }

  const keywords = work.replace(/\s+/g, ' ').trim()
  return {
    isUrl: false,
    tipo: resolvedTipo,
    numero,
    ano: resolvedAno,
    keywords
  }
}

const HTML_ENTITIES = new Map([
  ['nbsp', ' '],
  ['amp', '&'],
  ['lt', '<'],
  ['gt', '>'],
  ['quot', '"'],
  ['apos', "'"],
  ['rsquo', '’'],
  ['lsquo', '‘'],
  ['rdquo', '”'],
  ['ldquo', '“'],
  ['ndash', '–'],
  ['mdash', '—'],
  ['hellip', '…'],
  ['ordm', 'º'],
  ['ordf', 'ª'],
  ['deg', '°'],
  ['sect', '§'],
  ['copy', '©'],
  ['reg', '®'],
  ['laquo', '«'],
  ['raquo', '»'],
  ['aacute', 'á'],
  ['Aacute', 'Á'],
  ['agrave', 'à'],
  ['Agrave', 'À'],
  ['acirc', 'â'],
  ['Acirc', 'Â'],
  ['atilde', 'ã'],
  ['Atilde', 'Ã'],
  ['auml', 'ä'],
  ['Auml', 'Ä'],
  ['eacute', 'é'],
  ['Eacute', 'É'],
  ['egrave', 'è'],
  ['Egrave', 'È'],
  ['ecirc', 'ê'],
  ['Ecirc', 'Ê'],
  ['iacute', 'í'],
  ['Iacute', 'Í'],
  ['igrave', 'ì'],
  ['Igrave', 'Ì'],
  ['icirc', 'î'],
  ['Icirc', 'Î'],
  ['oacute', 'ó'],
  ['Oacute', 'Ó'],
  ['ograve', 'ò'],
  ['Ograve', 'Ò'],
  ['ocirc', 'ô'],
  ['Ocirc', 'Ô'],
  ['otilde', 'õ'],
  ['Otilde', 'Õ'],
  ['uacute', 'ú'],
  ['Uacute', 'Ú'],
  ['ugrave', 'ù'],
  ['Ugrave', 'Ù'],
  ['ucirc', 'û'],
  ['Ucirc', 'Û'],
  ['uuml', 'ü'],
  ['Uuml', 'Ü'],
  ['ccedil', 'ç'],
  ['Ccedil', 'Ç'],
  ['ntilde', 'ñ'],
  ['Ntilde', 'Ñ']
])

export function decodeHtmlEntities(str) {
  return String(str || '').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (full, entity) => {
    if (entity.startsWith('#x') || entity.startsWith('#X')) {
      const cp = Number.parseInt(entity.slice(2), 16)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : full
    }
    if (entity.startsWith('#')) {
      const cp = Number.parseInt(entity.slice(1), 10)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : full
    }
    return HTML_ENTITIES.get(entity) ?? HTML_ENTITIES.get(entity.toLowerCase()) ?? full
  })
}

export function decodeHtmlBytes(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  let head = ''
  const limit = Math.min(bytes.length, 2048)
  for (let i = 0; i < limit; i++) {
    head += String.fromCharCode(bytes[i])
  }
  const charsetMatch = head.match(/charset\s*=\s*["']?\s*(iso-8859-1|windows-1252|latin1)\b/i)
  if (charsetMatch) {
    return new TextDecoder('windows-1252').decode(bytes)
  }
  const utf8 = new TextDecoder('utf-8').decode(bytes)
  if (utf8.includes('\uFFFD')) {
    return new TextDecoder('windows-1252').decode(bytes)
  }
  return utf8
}

export function classifyLawParagraph(rawText) {
  const text = String(rawText || '').trim()
  if (!text) return null

  if (
    /^(LEI(\s+COMPLEMENTAR)?|DECRETO(-LEI)?|EMENDA CONSTITUCIONAL|MEDIDA PROVIS[ÓO]RIA)\s+N[º°o]/i.test(text) ||
    /^CONSTITUI[ÇC][ÃA]O\b/i.test(text) ||
    /^ANEXO(\s+[IVX\d]+|\s+[ÚU]NICO)?$/i.test(text) ||
    /^METAS E ESTRAT[ÉE]GIAS$/i.test(text)
  ) {
    return { type: 'heading', level: 1, text }
  }

  if (
    /^(T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O|LIVRO|PARTE)\s+[IVX\d]+/i.test(text) ||
    /^Meta\s+\d+\s*[:.\-–—]/i.test(text)
  ) {
    return { type: 'heading', level: 2, text }
  }

  if (/^Estrat[ée]gias?\s*:?$/i.test(text)) {
    return { type: 'heading', level: 3, text }
  }

  if (
    /^[IVXLCDM]+\s*[-–—]\s+/.test(text) ||
    /^[a-z]\)\s+/.test(text) ||
    /^\d+\.\d+\)\s+/.test(text)
  ) {
    return { type: 'list-item', text }
  }

  return { type: 'paragraph', text }
}

const BOILERPLATE_HEADER_RE =
  /^(câmara dos deputados|centro de documentação e informação|presidência da república|casa civil|secretaria-geral|secretaria especial para assuntos jurídicos|subchefia para assuntos jurídicos|texto compilado|texto original|este texto não substitui.*)$/i

function stripTopBoilerplate(lines) {
  const result = []
  let foundSubstantive = false
  for (const line of lines) {
    if (!foundSubstantive && BOILERPLATE_HEADER_RE.test(line)) {
      continue
    }
    foundSubstantive = true
    result.push(line)
  }
  return result
}

function normalizeLegalLine(rawLine) {
  return String(rawLine || '')
    .replace(/[\s\u00A0]+/g, ' ')
    .replace(/\s+([,.;:!?)])/g, '$1')
    .trim()
}

function finalizeParsedBlocks(rawLines) {
  const withoutDecorative = rawLines.filter((line) => line && !/^[*•·_\-=]+$/.test(line))
  const cleaned = stripTopBoilerplate(withoutDecorative)
  const blocks = cleaned.map(classifyLawParagraph).filter(Boolean)
  const plainText = blocks.map((b) => b.text).join('\n\n')
  return { blocks, plainText }
}

export function parseLegislationHtmlToBlocks(html) {
  const raw = String(html || '')
  const bodyMatch = raw.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)
  let work = bodyMatch ? bodyMatch[1] : raw

  work = work
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(head|style|script|noscript|iframe)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<(strike|s|del)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/[\r\n]+/g, ' ')
    .replace(/<(img|br)\b[^>]*>/gi, ' ')
    .replace(/<\/?(td|th)\b[^>]*>/gi, ' ')
    .replace(/<\/?(p|div|h[1-6]|li|tr|blockquote|section|article|header|footer|pre|table|ul|ol|hr)\b[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')

  const decoded = decodeHtmlEntities(work)
  const rawLines = decoded.split('\n').map(normalizeLegalLine)
  return finalizeParsedBlocks(rawLines)
}

const LEGAL_LINE_START_RE =
  /^(?:Art\.\s*\d|§\s*\d|Parágrafo\s+único\b|Meta\s+\d+\s*[:.\-–—]|\d+\.\d+\)\s|[IVXLCDM]+\s*[-–—]\s|[a-z]\)\s|(?:T[ÍI]TULO|CAP[ÍI]TULO|SE[ÇC][ÃA]O|SUBSE[ÇC][ÃA]O|LIVRO|PARTE)\s+[IVX\d]|ANEXO\b|METAS\s+E\s+ESTRAT[ÉE]GIAS|Estrat[ée]gias?\s*:?$|(?:LEI(?:\s+COMPLEMENTAR)?|DECRETO(?:-LEI)?|EMENDA\s+CONSTITUCIONAL|MEDIDA\s+PROVIS[ÓO]RIA)\s+N[º°o]|CONSTITUI[ÇC][ÃA]O\b)/i

export function parseLegislationTextToBlocks(rawText) {
  const normalized = String(rawText || '').replace(/\r\n?/g, '\n')
  const rawLines = normalized.split('\n').map(normalizeLegalLine)
  const paragraphs = []
  let current = ''
  let foundSubstantive = false

  for (const line of rawLines) {
    if (!line) {
      if (current) {
        paragraphs.push(current)
        current = ''
      }
      continue
    }
    if (!foundSubstantive && BOILERPLATE_HEADER_RE.test(line)) {
      continue
    }
    foundSubstantive = true
    if (!current) {
      current = line
    } else if (LEGAL_LINE_START_RE.test(line)) {
      paragraphs.push(current)
      current = line
    } else {
      current = normalizeLegalLine(`${current} ${line}`)
    }
  }
  if (current) paragraphs.push(current)

  return finalizeParsedBlocks(paragraphs)
}

/**
 * Em páginas de índice `-norma-pl.html` da Câmara dos Deputados, localiza a URL do
 * texto atualizado (`-normaatualizada-pl.html`) ou publicação original (`-publicacaooriginal-...-pl.html`).
 */
export function extractCamaraFullTextUrl(normaPageHtml, baseUrl) {
  const html = String(normaPageHtml || '')
  const resolveHref = (href) => {
    try {
      return new URL(href, baseUrl).toString().replace(/^http:\/\//i, 'https://')
    } catch {
      return href
    }
  }
  const updatedMatch = html.match(/href\s*=\s*["']([^"']*-normaatualizada-pl\.html?)["']/i)
  if (updatedMatch) return resolveHref(updatedMatch[1])

  const originalMatch = html.match(/href\s*=\s*["']([^"']*-publicacaooriginal[^"']*-pl\.html?)["']/i)
  if (originalMatch) return resolveHref(originalMatch[1])

  return ''
}
