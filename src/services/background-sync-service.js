import { userData } from './user-data-service.js'
import { getGithubConfig, isGithubConfigured, pullFromGithub } from './github-sync-service.js'

const AUTO_COOLDOWN_MS = 60_000

let bgState = {
  state: 'idle',
  message: '',
  lastPullAt: '',
  summary: null,
  error: '',
  scope: ''
}

let started = false
let inflightPromise = null
let lastAttemptAt = 0
let lastKnownScope = ''
let lastGithubSignature = ''

function emitState(patch) {
  bgState = { ...bgState, ...patch }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('caqdas-bg-sync-changed', { detail: { ...bgState } }))
  }
}

export function getBackgroundSyncState() {
  return { ...bgState }
}

function currentGithubSignature() {
  const cfg = getGithubConfig()
  return `${userData.scope}|${cfg.repo}|${Boolean(cfg.token)}`
}

function formatPullMessage(res) {
  if (!res || res.aborted) return ''
  if (!res.found) return 'Repositório conectado (ainda sem arquivos do projeto).'
  const parts = [
    res.docsAdded && `${res.docsAdded} documento(s)`,
    res.added && `${res.added} marcação(ões) nova(s)`,
    res.updated && `${res.updated} atualizada(s)`,
    res.removed && `${res.removed} removida(s)`,
    res.graphAdded && `${res.graphAdded} relação(ões) do grafo`,
    res.graphUpdated && `${res.graphUpdated} relação(ões) atualizada(s)`
  ].filter(Boolean)
  return parts.length
    ? `Marcações baixadas do GitHub: ${parts.join(', ')}.`
    : 'Marcações em dia com o GitHub.'
}

async function runPull({ force = false } = {}) {
  await userData.whenReady()
  const scope = userData.scope

  if (!isGithubConfigured()) {
    emitState({
      state: 'unconfigured',
      message: 'Repositório privado do GitHub não configurado neste dispositivo.',
      summary: null,
      error: '',
      scope
    })
    return { skipped: true, reason: 'unconfigured' }
  }

  if (!force && typeof navigator !== 'undefined' && navigator.onLine === false) {
    return { skipped: true, reason: 'offline' }
  }

  const now = Date.now()
  if (!force && bgState.scope === scope && now - lastAttemptAt < AUTO_COOLDOWN_MS) {
    return { skipped: true, reason: 'cooldown' }
  }

  lastAttemptAt = now
  emitState({
    state: 'syncing',
    message: 'Sincronizando marcações do GitHub em segundo plano…',
    error: '',
    scope
  })

  try {
    const res = await pullFromGithub()
    if (res?.aborted || userData.scope !== scope) {
      return res
    }
    const lastPullAt = new Date().toISOString()
    emitState({
      state: 'synced',
      message: formatPullMessage(res),
      lastPullAt,
      summary: res,
      error: '',
      scope
    })
    return res
  } catch (err) {
    const msg = err?.message || String(err)
    console.warn('[FZL CAQDAS] Falha na sincronização em background do GitHub:', msg)
    emitState({
      state: 'error',
      message: `Não foi possível sincronizar em background: ${msg}`,
      error: msg,
      scope: userData.scope
    })
    return { error: msg }
  }
}

/**
 * Executa pull em segundo plano do repositório privado do GitHub (somente leitura + mesclagem local).
 * Deduplica execuções simultâneas e aplica cooldown para gatilhos automáticos.
 */
export function triggerBackgroundPull({ force = false, reason = 'manual' } = {}) {
  if (inflightPromise) {
    if (!force) return inflightPromise
    return inflightPromise.catch(() => null).then(() => triggerBackgroundPull({ force: true, reason }))
  }
  const task = runPull({ force, reason }).finally(() => {
    if (inflightPromise === task) inflightPromise = null
  })
  inflightPromise = task
  return task
}

/**
 * Inicia a sincronização automática em background para restaurar marcações, documentos e grafo
 * ao abrir o aplicativo, autenticar/trocar de conta, configurar o GitHub ou voltar à aba.
 */
export function startBackgroundSync() {
  if (started || typeof window === 'undefined') return
  started = true
  lastKnownScope = userData.scope
  lastGithubSignature = currentGithubSignature()

  userData.subscribe(() => {
    const nextScope = userData.scope
    if (nextScope === lastKnownScope) return
    lastKnownScope = nextScope
    lastGithubSignature = currentGithubSignature()
    lastAttemptAt = 0
    void triggerBackgroundPull({ force: true, reason: 'scope-change' })
  })

  window.addEventListener('caqdas-github-changed', () => {
    const nextSig = currentGithubSignature()
    if (nextSig === lastGithubSignature) return
    lastGithubSignature = nextSig
    lastAttemptAt = 0
    void triggerBackgroundPull({ force: true, reason: 'config-saved' })
  })

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void triggerBackgroundPull({ force: false, reason: 'visibility' })
      }
    })
  }

  window.addEventListener('online', () => {
    void triggerBackgroundPull({ force: false, reason: 'online' })
  })

  void triggerBackgroundPull({ force: true, reason: 'startup' })
}
