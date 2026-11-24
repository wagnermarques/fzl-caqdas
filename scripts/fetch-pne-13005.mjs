import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { decodeHtmlBytes, parseLegislationHtmlToBlocks } from '../src/services/legislation-utils.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
const OUT_PATH = resolve(ROOT, 'public/data/legislacao/lei-13005-2014.json')

const PLANALTO_URL = 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm'
const CAMARA_URL =
  'https://www2.camara.leg.br/legin/fed/lei/2014/lei-13005-25-junho-2014-778970-normaatualizada-pl.html'
const NORMAS_URL = 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2014-06-25;13005'

const CHROME_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

async function fetchWithRetry(url, attempts = 3) {
  let lastErr = null
  for (let i = 1; i <= attempts; i++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 20000)
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': CHROME_UA,
          Accept: 'text/html,application/xhtml+xml'
        },
        signal: controller.signal
      })
      clearTimeout(timer)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const buf = new Uint8Array(await res.arrayBuffer())
      if (buf.byteLength < 10000) throw new Error(`Corpo inesperado (${buf.byteLength} bytes)`)
      return buf
    } catch (err) {
      clearTimeout(timer)
      lastErr = err
      console.warn(`Tentativa ${i}/${attempts} em ${url} falhou (${err.message}).`)
      if (i < attempts) await new Promise((r) => setTimeout(r, 3000))
    }
  }
  throw lastErr
}

async function fetchOfficialSource() {
  const candidates = [
    {
      url: PLANALTO_URL,
      label: 'Planalto — Presidência da República (texto oficial, domínio público)'
    },
    {
      url: CAMARA_URL,
      label: 'Câmara dos Deputados — Legislação Informatizada (texto consolidado, domínio público)'
    }
  ]

  let lastErr = null
  for (const candidate of candidates) {
    try {
      console.log(`Baixando Lei nº 13.005/2014 de ${candidate.url}...`)
      const bytes = await fetchWithRetry(candidate.url, 3)
      return { ...candidate, bytes }
    } catch (err) {
      lastErr = err
    }
  }
  throw lastErr
}

async function main() {
  const { url: usedUrl, label: sourceLabel, bytes } = await fetchOfficialSource()
  const html = decodeHtmlBytes(bytes)
  const { blocks } = parseLegislationHtmlToBlocks(html)

  if (!blocks.some((b) => /LEI N[º°o]\s*13\.005,\s*DE 25 DE JUNHO DE 2014/i.test(b.text))) {
    throw new Error('Cabeçalho da LEI Nº 13.005, DE 25 DE JUNHO DE 2014 não encontrado nos blocos extraídos.')
  }

  for (let i = 1; i <= 14; i++) {
    const re = new RegExp(`^Art\\.\\s*${i}(?:º|\\b)`, 'i')
    if (!blocks.some((b) => re.test(b.text))) {
      throw new Error(`Art. ${i} não encontrado nos blocos extraídos.`)
    }
  }

  for (let i = 1; i <= 20; i++) {
    const re = new RegExp(`^Meta\\s+${i}\\s*[:.\\-–—]`, 'i')
    if (!blocks.some((b) => re.test(b.text))) {
      throw new Error(`Meta ${i} não encontrada nos blocos extraídos.`)
    }
  }

  if (!blocks.some((b) => /^8\.7\)/.test(b.text))) {
    throw new Error('Estratégia 8.7) (Lei 14.627/2023) não encontrada — texto pode não ser a versão consolidada.')
  }
  if (!blocks.some((b) => /^20\.12\)/.test(b.text))) {
    throw new Error('Estratégia 20.12) não encontrada.')
  }

  const payload = {
    schema: 'caqdas-legislacao/v1',
    id: 'lei-13005-2014',
    docId: 'doc-lei-13005-2014',
    tipo: 'LEI',
    numero: '13005',
    ano: '2014',
    title: 'Lei nº 13.005/2014 — Plano Nacional de Educação (PNE)',
    ementa: 'Aprova o Plano Nacional de Educação - PNE e dá outras providências.',
    dataAssinatura: '25/06/2014',
    planaltoUrl: PLANALTO_URL,
    camaraUrl: CAMARA_URL,
    normasUrl: NORMAS_URL,
    sourceUrl: usedUrl,
    sourceLabel,
    fetchedAt: new Date().toISOString(),
    blockCount: blocks.length,
    blocks
  }

  mkdirSync(dirname(OUT_PATH), { recursive: true })
  writeFileSync(OUT_PATH, `${JSON.stringify(payload, null, 2)}\n`, 'utf-8')
  console.log(`Sucesso! ${blocks.length} blocos gravados em ${OUT_PATH} (fonte: ${usedUrl})`)
}

main().catch((err) => {
  console.error('Erro ao gerar lei-13005-2014.json:', err)
  process.exit(1)
})
