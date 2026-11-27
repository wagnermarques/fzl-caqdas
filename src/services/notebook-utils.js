/**
 * Utilitários puros para integração do corpus CAQDAS com o Gemini Notebook (NotebookLM).
 * Sem dependências de DOM (testável em `node --test`).
 */

export const DEFAULT_NOTEBOOK_NAME = 'APP-CAQDAS-HOME-NOTEBOOK'
export const NOTEBOOK_OAUTH_SCOPE = 'https://www.googleapis.com/auth/notebook'
export const NOTEBOOK_API_BASE = 'https://notebook.googleapis.com/v1'
export const NOTEBOOK_UPLOAD_BASE = 'https://notebook.googleapis.com/upload/v1'

export function sanitizeNotebookName(rawName) {
  const clean = String(rawName || '')
    .trim()
    .replace(/\s+/g, ' ')
  return clean || DEFAULT_NOTEBOOK_NAME
}

export function extractNotebookId(nameOrId) {
  const raw = String(nameOrId || '').trim()
  if (!raw) return ''
  const m = raw.match(/notebooks\/([^/?#]+)/i)
  return m ? m[1] : raw
}

export function buildNotebookWebUrl(nameOrId) {
  const id = extractNotebookId(nameOrId)
  return id ? `https://notebooklm.google.com/notebook/${encodeURIComponent(id)}` : 'https://notebooklm.google.com/'
}

export function formatSourceDisplayName(doc) {
  const title = String(doc?.title || doc?.id || 'Documento sem título').trim()
  return title.slice(0, 200)
}

/**
 * Divide textos muito longos em partes menores que `maxBytes` (limite inline da API = 1 MB),
 * quebrando preferencialmente em fronteiras de parágrafo.
 */
export function splitTextIntoNotebookChunks(text, maxBytes = 850_000) {
  const raw = String(text || '').trim()
  if (!raw) return []
  const encoder = new TextEncoder()
  if (encoder.encode(raw).byteLength <= maxBytes) return [raw]

  const paragraphs = raw.split(/\n{2,}/)
  const chunks = []
  let current = ''
  let currentBytes = 0

  for (const para of paragraphs) {
    const piece = para.trim()
    if (!piece) continue
    const pieceBytes = encoder.encode(piece).byteLength
    if (pieceBytes > maxBytes) {
      if (current) {
        chunks.push(current)
        current = ''
        currentBytes = 0
      }
      // Quebra rígida por caracteres se um único parágrafo exceder maxBytes
      const avgStep = Math.max(1000, Math.floor((piece.length * maxBytes) / pieceBytes) - 200)
      for (let i = 0; i < piece.length; i += avgStep) {
        chunks.push(piece.slice(i, i + avgStep))
      }
      continue
    }
    const sepBytes = current ? 2 : 0
    if (currentBytes + sepBytes + pieceBytes > maxBytes) {
      chunks.push(current)
      current = piece
      currentBytes = pieceBytes
    } else {
      current = current ? `${current}\n\n${piece}` : piece
      currentBytes += sepBytes + pieceBytes
    }
  }
  if (current) chunks.push(current)
  return chunks
}

/**
 * Gera um documento Markdown consolidado com o Codebook, marcações codificadas e relações do grafo
 * para que o NotebookLM também conheça as interpretações do pesquisador.
 */
export function buildCorpusExcerptsSummaryMarkdown({
  project = {},
  documents = [],
  codes = [],
  categories = [],
  graph = { relations: [] }
} = {}) {
  const lines = []
  const projectName = project?.name || 'Projeto de Pesquisa Qualitativa'
  lines.push(`# ${projectName} — Marcações, Códigos e Grafo de Relações (Bardin)`)
  if (project?.description) {
    lines.push('', project.description)
  }

  const catMap = new Map((Array.isArray(categories) ? categories : []).map((c) => [c.id, c]))
  const codeMap = new Map((Array.isArray(codes) ? codes : []).map((c) => [c.id, c]))
  const excerptById = new Map()

  if (codeMap.size > 0) {
    lines.push('', '## Livro de Códigos (Codebook)')
    for (const code of codeMap.values()) {
      const cat = code.categoryId ? catMap.get(code.categoryId) : null
      lines.push(`- **${code.name}**${cat ? ` (Categoria: ${cat.name})` : ''}`)
    }
  }

  lines.push('', '## Trechos Marcados por Documento')
  let totalExcerpts = 0
  for (const doc of Array.isArray(documents) ? documents : []) {
    const quotes = Array.isArray(doc?.quotations) ? doc.quotations : []
    if (!quotes.length) continue
    lines.push('', `### ${doc.title || doc.id}`)
    for (const q of quotes) {
      totalExcerpts++
      excerptById.set(q.id, { q, doc })
      const code = q.codeId ? codeMap.get(q.codeId) : null
      const meta = [
        code ? `Código: ${code.name}` : 'Sem código',
        q.page ? `p. ${q.page}` : ''
      ]
        .filter(Boolean)
        .join(' | ')
      lines.push(`- **${q.title || 'Trecho'}** (${meta})`)
      lines.push(`  > "${q.text}"`)
      if (q.note) lines.push(`  - *Nota:* ${q.note}`)
    }
  }
  if (totalExcerpts === 0) {
    lines.push('', '_Nenhuma marcação registrada ainda._')
  }

  const relations = Array.isArray(graph?.relations) ? graph.relations : []
  if (relations.length > 0) {
    lines.push('', '## Relações Temáticas no Grafo (Bardin)')
    for (const rel of relations) {
      const src = excerptById.get(rel.sourceId)
      const dst = excerptById.get(rel.targetId)
      const srcLabel = src ? `"${src.q.title || src.q.id}" (${src.doc.title})` : rel.sourceId
      const dstLabel = dst ? `"${dst.q.title || dst.q.id}" (${dst.doc.title})` : rel.targetId
      lines.push(`- ${srcLabel} **[${rel.label || rel.type}]** → ${dstLabel}`)
      if (rel.note) lines.push(`  - *Nota inferencial:* ${rel.note}`)
    }
  }

  return lines.join('\n')
}

/**
 * Gera um pacote Markdown completo com todos os textos do corpus + marcações
 * para download/importação manual no NotebookLM quando a API não estiver habilitada.
 */
export function buildFullCorpusMarkdownBundle({
  project = {},
  documents = [],
  codes = [],
  categories = [],
  graph = { relations: [] }
} = {}) {
  const parts = [buildCorpusExcerptsSummaryMarkdown({ project, documents, codes, categories, graph })]
  parts.push('', '---', '', '# Documentos Integrais do Corpus')
  for (const doc of Array.isArray(documents) ? documents : []) {
    const content = String(doc?.content || '').trim()
    parts.push('', `## ${doc?.title || doc?.id || 'Documento'}`)
    if (doc?.participant) parts.push(`*Participante / Origem:* ${doc.participant}`)
    parts.push('', content || '_Conteúdo textual ainda não extraído neste dispositivo._')
  }
  return parts.join('\n')
}

/**
 * Planeja o envio de fontes ao NotebookLM evitando duplicar fontes já existentes no notebook.
 */
export function planNotebookSourceUploads({
  existingSources = [],
  documents = [],
  summaryMarkdown = '',
  summaryTitle = ''
} = {}) {
  const existingNames = new Set(
    (Array.isArray(existingSources) ? existingSources : [])
      .map((s) => String(s?.displayName || '').trim().toLowerCase())
      .filter(Boolean)
  )

  const toUpload = []
  const alreadyPresent = []
  const skippedEmpty = []

  for (const doc of Array.isArray(documents) ? documents : []) {
    const baseName = formatSourceDisplayName(doc)
    const content = String(doc?.content || '').trim()

    if (content) {
      const chunks = splitTextIntoNotebookChunks(content)
      if (chunks.length === 1) {
        if (existingNames.has(baseName.toLowerCase())) {
          alreadyPresent.push({ doc, displayName: baseName })
        } else {
          toUpload.push({ kind: 'text', doc, displayName: baseName, content: chunks[0], mimeType: 'text/plain' })
          existingNames.add(baseName.toLowerCase())
        }
      } else {
        chunks.forEach((chunk, idx) => {
          const partName = `${baseName} (parte ${idx + 1}/${chunks.length})`
          if (existingNames.has(partName.toLowerCase())) {
            alreadyPresent.push({ doc, displayName: partName })
          } else {
            toUpload.push({ kind: 'text', doc, displayName: partName, content: chunk, mimeType: 'text/plain' })
            existingNames.add(partName.toLowerCase())
          }
        })
      }
      continue
    }

    // Sem texto extraído ainda: marca como possível upload binário (ex.: PDF em cache) ou vazio
    if (existingNames.has(baseName.toLowerCase())) {
      alreadyPresent.push({ doc, displayName: baseName })
    } else {
      toUpload.push({ kind: 'binary-or-skip', doc, displayName: baseName })
      existingNames.add(baseName.toLowerCase())
    }
  }

  if (summaryMarkdown && summaryTitle) {
    if (existingNames.has(summaryTitle.toLowerCase())) {
      alreadyPresent.push({ doc: null, displayName: summaryTitle })
    } else {
      toUpload.push({
        kind: 'text',
        doc: null,
        displayName: summaryTitle,
        content: summaryMarkdown,
        mimeType: 'text/markdown'
      })
    }
  }

  return { toUpload, alreadyPresent, skippedEmpty }
}
