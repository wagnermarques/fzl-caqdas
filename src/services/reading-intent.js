/**
 * Pedido de leitura entre telas: "Continuar Leitura" (Fontes) → Área de Codificação,
 * já com o documento escolhido e o leitor em tela cheia.
 */
let pending = null

/** Registra o documento a abrir e navega para a Área de Codificação. */
export function openForReading(docId, { fullscreen = true } = {}) {
  if (!docId) return
  pending = { docId: String(docId), fullscreen, at: Date.now() }
  if (window.location.hash.startsWith('#/codificacao')) {
    window.dispatchEvent(new CustomEvent('caqdas-reading-request'))
  } else {
    window.location.hash = '#/codificacao'
  }
}

/** Retira o pedido pendente (válido por 30 s, para não reabrir em visitas futuras). */
export function takeReadingRequest() {
  const request = pending
  pending = null
  return request && Date.now() - request.at < 30_000 ? request : null
}
