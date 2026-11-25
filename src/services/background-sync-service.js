import { authService } from 'fzl-fund-appshell--lit'
import { userData } from './user-data-service.js'
import { getGithubConfig, isGithubConfigured, pullFromGithub } from './github-sync-service.js'
import { isPersonalCloudSyncReady, syncWithPersonalCloud } from './cloud-excerpts-sync-service.js'

const AUTO_COOLDOWN_MS = 60_000
const CLOUD_PUSH_DEBOUNCE_MS = 2_000

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
let isPulling = false
let dataPushTimer = null

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

function formatSyncMessage(cloudRes, ghRes) {
  const sources = []
  if (cloudRes && !cloudRes.skipped && !cloudRes.error && !cloudRes.aborted) {
    sources.push(cloudRes.provider === 'onedrive' ? 'OneDrive' : 'Google Drive')
  }
  if (ghRes && !ghRes.skipped && !ghRes.error && !ghRes.aborted && ghRes.found) {
    sources.push('GitHub')
  }

  const added = (cloudRes?.added || 0) + (ghRes?.added || 0)
  const updated = (cloudRes?.updated || 0) + (ghRes?.updated || 0)
  const removed = (cloudRes?.removed || 0) + (ghRes?.removed || 0)
  const docsAdded = (cloudRes?.docsAdded || 0) + (ghRes?.docsAdded || 0)
  const graphAdded = (cloudRes?.graphAdded || 0) + (ghRes?.graphAdded || 0)
  const graphUpdated = (cloudRes?.graphUpdated || 0) + (ghRes?.graphUpdated || 0)

  const parts = [
    docsAdded && `${docsAdded} documento(s)`,
    added && `${added} marcação(ões) nova(s)`,
    updated && `${updated} atualizada(s)`,
    removed && `${removed} removida(s)`,
    graphAdded && `${graphAdded} relação(ões) do grafo`,
    graphUpdated && `${graphUpdated} relação(ões) atualizada(s)`
  ].filter(Boolean)

  if (!sources.length) {
    if (cloudRes?.reason === 'sem-token') {
      return 'Conectado: abra Fontes ou autorize o Drive para sincronizar as marcações.'
    }
    if (ghRes && !ghRes.found && !ghRes.error) {
      return 'Repositório conectado (ainda sem arquivos do projeto).'
    }
    return 'Sincronização em dia.'
  }

  const label = sources.join(' + ')
  return parts.length
    ? `Marcações sincronizadas (${label}): ${parts.join(', ')}.`
    : `Marcações em dia com ${label}.`
}

async function runPull({ force = false, interactive = false } = {}) {
  await userData.whenReady()
  const scope = userData.scope
  const cloudReady = isPersonalCloudSyncReady()
  const ghReady = isGithubConfigured()

  if (!cloudReady && !ghReady) {
    emitState({
      state: 'unconfigured',
      message: 'Faça login com Google/Microsoft ou configure o GitHub para sincronizar marcações.',
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
    message: 'Sincronizando marcações em segundo plano…',
    error: '',
    scope
  })

  isPulling = true
  let cloudRes = null
  let ghRes = null
  const errors = []

  try {
    if (cloudReady) {
      try {
        cloudRes = await syncWithPersonalCloud({ interactive, push: true })
      } catch (err) {
        const msg = err?.message || String(err)
        console.warn('[FZL CAQDAS] Falha na sincronização em background da nuvem:', msg)
        errors.push(msg)
        cloudRes = { error: msg }
      }
    }

    if (ghReady) {
      try {
        ghRes = await pullFromGithub()
      } catch (err) {
        const msg = err?.message || String(err)
        console.warn('[FZL CAQDAS] Falha na sincronização em background do GitHub:', msg)
        errors.push(msg)
        ghRes = { error: msg }
      }
    }

    if (userData.scope !== scope || cloudRes?.aborted || ghRes?.aborted) {
      return { aborted: true }
    }

    const anyOk =
      (cloudRes && !cloudRes.error && !cloudRes.skipped) ||
      (ghRes && !ghRes.error && !ghRes.skipped)

    if (!anyOk && errors.length > 0) {
      const msg = errors.join(' | ')
      emitState({
        state: 'error',
        message: `Não foi possível sincronizar em background: ${msg}`,
        error: msg,
        scope
      })
      return { error: msg }
    }

    const summary = {
      found: Boolean(cloudRes?.found || ghRes?.found),
      docsAdded: (cloudRes?.docsAdded || 0) + (ghRes?.docsAdded || 0),
      added: (cloudRes?.added || 0) + (ghRes?.added || 0),
      updated: (cloudRes?.updated || 0) + (ghRes?.updated || 0),
      removed: (cloudRes?.removed || 0) + (ghRes?.removed || 0),
      graphAdded: (cloudRes?.graphAdded || 0) + (ghRes?.graphAdded || 0),
      graphUpdated: (cloudRes?.graphUpdated || 0) + (ghRes?.graphUpdated || 0),
      cloud: cloudRes,
      github: ghRes
    }

    emitState({
      state: 'synced',
      message: formatSyncMessage(cloudRes, ghRes),
      lastPullAt: new Date().toISOString(),
      summary,
      error: '',
      scope
    })
    return summary
  } finally {
    isPulling = false
  }
}

/**
 * Executa sincronização em segundo plano (Google Drive/OneDrive + GitHub se configurado).
 * Deduplica execuções simultâneas e aplica cooldown para gatilhos automáticos.
 */
export function triggerBackgroundPull({ force = false, interactive = false, reason = 'manual' } = {}) {
  if (inflightPromise) {
    if (!force) return inflightPromise
    return inflightPromise.catch(() => null).then(() => triggerBackgroundPull({ force: true, interactive, reason }))
  }
  const task = runPull({ force, interactive, reason }).finally(() => {
    if (inflightPromise === task) inflightPromise = null
  })
  inflightPromise = task
  return task
}

function scheduleCloudPush() {
  if (isPulling || !isPersonalCloudSyncReady()) return
  if (dataPushTimer) clearTimeout(dataPushTimer)
  dataPushTimer = setTimeout(() => {
    dataPushTimer = null
    if (isPulling || !isPersonalCloudSyncReady()) return
    void syncWithPersonalCloud({ interactive: false, push: true }).catch((err) => {
      console.warn('[FZL CAQDAS] Falha ao enviar marcações para a nuvem:', err?.message || err)
    })
  }, CLOUD_PUSH_DEBOUNCE_MS)
}

/**
 * Inicia a sincronização automática em background para restaurar marcações, documentos e grafo
 * ao abrir o aplicativo, autenticar/trocar de conta, configurar o GitHub/nuvem ou voltar à aba.
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

  authService.subscribe((user, reason) => {
    if (reason === 'socialAuthConfig' || !user) return
    setTimeout(() => {
      lastAttemptAt = 0
      void triggerBackgroundPull({ force: true, reason: 'auth-login' })
    }, 400)
  })

  window.addEventListener('caqdas-github-changed', () => {
    const nextSig = currentGithubSignature()
    if (nextSig === lastGithubSignature) return
    lastGithubSignature = nextSig
    lastAttemptAt = 0
    void triggerBackgroundPull({ force: true, reason: 'config-saved' })
  })

  window.addEventListener('caqdas-cloud-sync-changed', () => {
    if (isPersonalCloudSyncReady()) {
      void triggerBackgroundPull({ force: false, reason: 'cloud-config-changed' })
    }
  })

  window.addEventListener('caqdas-data-changed', () => {
    scheduleCloudPush()
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
