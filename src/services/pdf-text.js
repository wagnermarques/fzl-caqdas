/**
 * Texto de PDF para o leitor de trechos (extractPdfBlocks do fzl-fund-ui + pdf.js).
 * O pdf.js (~1 MB) só é baixado quando um PDF é importado ou aberto pela primeira vez.
 */
import { extractPdfBlocks } from '@fzl/webcomponents-lit/document-reader'

let pdfjsPromise = null

export function loadPdfjs() {
  pdfjsPromise ??= Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url')
  ])
    .then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default
      return pdfjs
    })
    .catch((err) => {
      pdfjsPromise = null
      throw err
    })
  return pdfjsPromise
}

/**
 * Extrai o texto de um PDF em blocos com página.
 * @returns {Promise<{ blocks, text, pageCount, needsOcr, title }>}
 */
export async function extractPdfText(file, options = {}) {
  const pdfjs = await loadPdfjs()
  return extractPdfBlocks(file, { pdfjs, ...options })
}

/** Extrator no formato esperado pelo <fzl-document-picker> (picker.pdfTextExtractor). */
export const pdfTextExtractor = (file) => extractPdfText(file)

/** Campos do documento do corpus a partir do resultado da extração. */
export function pdfDocumentFields(result) {
  const blocks = Array.isArray(result?.blocks) ? result.blocks : []
  return {
    content: result?.text || blocks.map((b) => b.text).join('\n\n'),
    docxBlocks: blocks.length ? blocks : undefined,
    pageCount: result?.pageCount || undefined,
    pdfNeedsOcr: Boolean(result?.needsOcr),
    textExtractedAt: new Date().toISOString()
  }
}
