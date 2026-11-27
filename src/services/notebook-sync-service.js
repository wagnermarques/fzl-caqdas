import { authService } from 'fzl-fund-appshell--lit'
import { researchStorage } from './storage-service.js'
import { userData } from './user-data-service.js'
import { CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import {
  NOTEBOOK_OAUTH_SCOPE,
  NOTEBOOK_API_BASE,
  NOTEBOOK_UPLOAD_BASE,
  sanitizeNotebookName,
  buildNotebookWebUrl,
  buildCorpusExcerptsSummaryMarkdown,
  buildFullCorpusMarkdownBundle,
  planNotebookSourceUploads
} from './notebook-utils.js'

const NOTEBOOK_STATE_KEY = 'notebook_sync_v1'
const NOTEBOOK_TOKEN_KEY = 'fzl-caqdas:notebook-session-token'
const NOTEBOOK_API_ENABLE_URL = 'https://console.cloud.google.com/apis/library/notebook.googleapis.com'

export class NotebookError extends Error {
  constructor(message, { status = 0, isApiDisabled = false, isInsufficientScope = false, activationUrl = '' } = {}) {
    super(message)
    this.status = status
    this.isApiDisabled = isApiDisabled
    this.isInsufficientScope = isInsufficientScope
    this.activationUrl = activationUrl
  }
}

export function getNotebookSyncState() {
  try {
    const raw = userData.getItem(NOTEBOOK_STATE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveNotebookSyncState(state) {
  const next = { ...(getNotebookSyncState() || {}), ...state }
  userData.setItem(NOTEBOOK_STATE_KEY, JSON.stringify(next))
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('caqdas-notebook-changed', { detail: next }))
  }
  return next
}

function getCachedNotebookToken(email = '') {
  try {
    const raw = sessionStorage.getItem(NOTEBOOK_TOKEN_KEY)
    if (!raw) return ''
    const parsed = JSON.parse(raw)
    if (parsed?.email === email && parsed?.token && Number(parsed.expiresAt || 0) > Date.now() + 60_000) {
      return parsed.token
    }
  } catch {
    // Ignore storage errors
  }
  return ''
}

function saveCachedNotebookToken(email = '', token = '', expiresInSec = 3500) {
  if (!token) return
  try {
    const ttlMs = Math.max(120, Number(expiresInSec) || 3500) * 1000
    sessionStorage.setItem(
      NOTEBOOK_TOKEN_KEY,
      JSON.stringify({ email, token, expiresAt: Date.now() + ttlMs })
    )
  } catch {
    // Ignore storage errors
  }
}

export function clearNotebookSessionToken() {
  try {
    sessionStorage.removeItem(NOTEBOOK_TOKEN_KEY)
  } catch {
    // Ignore storage errors
  }
}

function getGoogleClientId() {
  const cloudCfg = researchStorage.getCloudSyncConfig()
  const socialCfg = authService.getSocialAuthConfig?.() || {}
  return String(cloudCfg.googleClientId || socialCfg.googleClientId || '').trim()
}

async function ensureGoogleGsiLoaded() {
  if (typeof window === 'undefined') throw new NotebookError('Ambiente sem navegador.')
  if (window.google?.accounts?.oauth2?.initTokenClient) return
  await new Promise((resolve, reject) => {
    const existing = document.getElementById('fzl-google-gsi-sdk')
    if (existing) {
      const check = () => {
        if (window.google?.accounts?.oauth2?.initTokenClient) resolve()
        else setTimeout(check, 100)
      }
      setTimeout(check, 50)
      setTimeout(() => reject(new NotebookError('Google Identity Services não carregou a tempo.')), 8000)
      return
    }
    const script = document.createElement('script')
    script.id = 'fzl-google-gsi-sdk'
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new NotebookError('Falha ao carregar Google Identity Services.'))
    document.head.appendChild(script)
  })
}

/**
 * Obtém token OAuth2 do Google com o escopo `https://www.googleapis.com/auth/notebook`.
 */
export async function authorizeNotebookAccess({ forceRefresh = false } = {}) {
  const user = authService.getCurrentUser?.() || null
  const email = user?.email || ''
  if (!forceRefresh) {
    const cached = getCachedNotebookToken(email)
    if (cached) return cached
  }

  const clientId = getGoogleClientId()
  if (!clientId) {
    throw new NotebookError(
      'Google Client ID não configurado. Informe-o em Persistência & Sincronização antes de conectar ao NotebookLM.'
    )
  }

  await ensureGoogleGsiLoaded()

  return await new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: NOTEBOOK_OAUTH_SCOPE,
      hint: email || undefined,
      callback: (resp) => {
        if (resp?.error) {
          reject(
            new NotebookError(
              resp.error === 'access_denied'
                ? 'Permissão ao Gemini Notebook (escopo notebook) recusada na tela do Google.'
                : `Erro OAuth2 do Google: ${resp.error_description || resp.error}`
            )
          )
          return
        }
        if (!resp?.access_token) {
          reject(new NotebookError('O Google não retornou um token de acesso para o NotebookLM.'))
          return
        }
        saveCachedNotebookToken(email, resp.access_token, resp.expires_in)
        resolve(resp.access_token)
      },
      error_callback: (err) => {
        reject(
          new NotebookError(
            err?.type === 'popup_closed'
              ? 'Janela de autorização fechada antes da conclusão.'
              : `Falha ao abrir autorização do Google (${err?.type || 'erro'}).`
          )
        )
      }
    })
    client.requestAccessToken({ prompt: forceRefresh ? 'consent' : '' })
  })
}

async function parseNotebookApiError(res) {
  const text = await res.text().catch(() => '')
  let parsed = null
  try {
    parsed = JSON.parse(text)
  } catch {
    parsed = null
  }
  const errObj = parsed?.error || {}
  const msg = String(errObj.message || text || `HTTP ${res.status}`)
  const reasons = [
    ...(Array.isArray(errObj.errors) ? errObj.errors.map((e) => e?.reason) : []),
    ...(Array.isArray(errObj.details) ? errObj.details.map((d) => d?.reason) : []),
    errObj.status
  ].filter(Boolean)

  let activationUrl = ''
  if (Array.isArray(errObj.details)) {
    for (const d of errObj.details) {
      if (d?.metadata?.activationUrl) {
        activationUrl = String(d.metadata.activationUrl)
        break
      }
    }
  }

  const isApiDisabled =
    reasons.some((r) => r === 'accessNotConfigured' || r === 'SERVICE_DISABLED') ||
    /has not been used in project|SERVICE_DISABLED|Enable it by visiting/i.test(msg)
  const isInsufficientScope =
    res.status === 401 ||
    reasons.some((r) => r === 'insufficientPermissions' || r === 'ACCESS_TOKEN_SCOPE_INSUFFICIENT') ||
    /insufficient.*(permission|scope)|ACCESS_TOKEN_SCOPE_INSUFFICIENT/i.test(msg)

  if (isApiDisabled) {
    return new NotebookError(
      'A Gemini Notebook API (notebook.googleapis.com) ainda não está ativada no projeto Google Cloud deste Client ID.',
      {
        status: res.status,
        isApiDisabled: true,
        activationUrl: activationUrl || NOTEBOOK_API_ENABLE_URL
      }
    )
  }
  if (isInsufficientScope) {
    return new NotebookError(
      'Sessão sem permissão de acesso ao Gemini Notebook. Autorize novamente a conexão.',
      { status: res.status, isInsufficientScope: true }
    )
  }
  if (res.status === 429) {
    return new NotebookError(
      'Limite temporário de requisições da Gemini Notebook API atingido (20/min). Aguarde alguns segundos e tente novamente.',
      { status: res.status }
    )
  }
  return new NotebookError(msg, { status: res.status })
}

async function notebookFetch(token, path, { method = 'GET', body, base = NOTEBOOK_API_BASE, headers = {} } = {}) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body && typeof body === 'string' && !headers['Content-Type'] ? { 'Content-Type': 'application/json' } : {}),
      ...headers
    },
    body
  })
  if (!res.ok) {
    throw await parseNotebookApiError(res)
  }
  return res.json()
}

export async function listNotebooks(token) {
  const notebooks = []
  let pageToken = ''
  do {
    const qs = new URLSearchParams({ pageSize: '100', ...(pageToken ? { pageToken } : {}) })
    const data = await notebookFetch(token, `/notebooks?${qs.toString()}`)
    if (Array.isArray(data?.notebooks)) notebooks.push(...data.notebooks)
    pageToken = data?.nextPageToken || ''
  } while (pageToken)
  return notebooks
}

export async function findOrCreateNotebook(token, displayName = researchStorage.getNotebookName()) {
  const targetName = sanitizeNotebookName(displayName)
  const existing = await listNotebooks(token)
  const found = existing.find(
    (n) => String(n?.displayName || '').trim().toLowerCase() === targetName.toLowerCase()
  )
  if (found) return { notebook: found, created: false }

  const created = await notebookFetch(token, '/notebooks', {
    method: 'POST',
    body: JSON.stringify({ displayName: targetName })
  })
  return { notebook: created, created: true }
}

export async function listNotebookSources(token, notebookName) {
  const sources = []
  let pageToken = ''
  do {
    const qs = new URLSearchParams({ pageSize: '100', ...(pageToken ? { pageToken } : {}) })
    const data = await notebookFetch(token, `/${notebookName}/sources?${qs.toString()}`)
    if (Array.isArray(data?.sources)) sources.push(...data.sources)
    pageToken = data?.nextPageToken || ''
  } while (pageToken)
  return sources
}

export async function createTextSource(token, notebookName, { displayName, content, mimeType = 'text/plain' }) {
  return notebookFetch(token, `/${notebookName}/sources`, {
    method: 'POST',
    body: JSON.stringify({
      displayName,
      mimeType,
      textContent: { content }
    })
  })
}

export async function uploadBinarySource(token, notebookName, { displayName, file }) {
  const boundary = `caqdas_nb_${Date.now().toString(36)}`
  const metaJson = JSON.stringify({ source: { displayName } })
  const fileBuffer = await file.arrayBuffer()
  const headerPart = new TextEncoder().encode(
    `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${metaJson}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: ${file.type || 'application/octet-stream'}\r\n\r\n`
  )
  const footerPart = new TextEncoder().encode(`\r\n--${boundary}--`)
  const combined = new Uint8Array(headerPart.byteLength + fileBuffer.byteLength + footerPart.byteLength)
  combined.set(headerPart, 0)
  combined.set(new Uint8Array(fileBuffer), headerPart.byteLength)
  combined.set(footerPart, headerPart.byteLength + fileBuffer.byteLength)

  return notebookFetch(token, `/${notebookName}/sources:upload?uploadType=multipart`, {
    method: 'POST',
    base: NOTEBOOK_UPLOAD_BASE,
    headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
    body: combined
  })
}

/**
 * Cria ou localiza o notebook configurado (padrão `APP-CAQDAS-HOME-NOTEBOOK`) e envia
 * todos os textos do corpus (mais o resumo de marcações/códigos/grafo) como fontes de leitura.
 */
export async function syncCorpusToNotebook({ includeSummary = true, onProgress } = {}) {
  const displayName = researchStorage.getNotebookName()
  let token = await authorizeNotebookAccess({ forceRefresh: false })

  let notebookRes
  try {
    notebookRes = await findOrCreateNotebook(token, displayName)
  } catch (err) {
    if (err?.isInsufficientScope) {
      clearNotebookSessionToken()
      token = await authorizeNotebookAccess({ forceRefresh: true })
      notebookRes = await findOrCreateNotebook(token, displayName)
    } else {
      throw err
    }
  }

  const { notebook, created } = notebookRes
  const existingSources = await listNotebookSources(token, notebook.name)

  const documents = researchStorage.getDocuments()
  const codes = researchStorage.getCodes()
  const categories = researchStorage.getCategories()
  const graph = researchStorage.getExcerptGraph()
  const project = researchStorage.getProject() || {}

  const totalExcerpts = documents.reduce((acc, d) => acc + (d.quotations?.length || 0), 0)
  const totalRelations = graph?.relations?.length || 0
  const summaryTitle = includeSummary
    ? `CAQDAS — Marcações e Grafo (${totalExcerpts} trechos, ${totalRelations} relações).md`
    : ''
  const summaryMarkdown = includeSummary
    ? buildCorpusExcerptsSummaryMarkdown({ project, documents, codes, categories, graph })
    : ''

  const plan = planNotebookSourceUploads({
    existingSources,
    documents,
    summaryMarkdown,
    summaryTitle
  })

  let cloudCtrl = null
  let uploadedCount = 0
  let skippedEmptyCount = plan.skippedEmpty.length

  for (let i = 0; i < plan.toUpload.length; i++) {
    const item = plan.toUpload[i]
    onProgress?.({ current: i + 1, total: plan.toUpload.length, displayName: item.displayName })

    if (item.kind === 'text') {
      await createTextSource(token, notebook.name, {
        displayName: item.displayName,
        content: item.content,
        mimeType: item.mimeType
      })
      uploadedCount++
      continue
    }

    // Sem texto extraído: tenta enviar o arquivo binário (IndexedDB ou nuvem)
    let file = await researchStorage.getBinaryFileAsync(item.doc.id)
    if (!file && item.doc?.googleDriveFileId) {
      cloudCtrl ??= new CaqdasPersonalCloudDocsController(null)
      file = await cloudCtrl.downloadCloudFile(item.doc).catch(() => null)
      if (file) await researchStorage.saveBinaryFile(item.doc.id, file)
    }
    if (file) {
      await uploadBinarySource(token, notebook.name, { displayName: item.displayName, file })
      uploadedCount++
    } else {
      skippedEmptyCount++
    }
  }

  const webUrl = buildNotebookWebUrl(notebook.name)
  const totalSources = existingSources.length + uploadedCount
  saveNotebookSyncState({
    notebookName: notebook.name,
    displayName: notebook.displayName || displayName,
    webUrl,
    lastSyncAt: new Date().toISOString(),
    totalSources
  })

  return {
    notebook,
    created,
    webUrl,
    uploadedCount,
    alreadyPresentCount: plan.alreadyPresent.length,
    skippedEmptyCount,
    totalSources
  }
}

/**
 * Gera e baixa localmente um único arquivo `.md` com todo o corpus + marcações
 * para importação manual no NotebookLM quando a API não estiver habilitada no GCP.
 */
export function downloadCorpusMarkdownBundle() {
  const documents = researchStorage.getDocuments()
  const codes = researchStorage.getCodes()
  const categories = researchStorage.getCategories()
  const graph = researchStorage.getExcerptGraph()
  const project = researchStorage.getProject() || {}

  const markdown = buildFullCorpusMarkdownBundle({ project, documents, codes, categories, graph })
  const baseName = sanitizeNotebookName(researchStorage.getNotebookName())
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${baseName}-corpus.md`
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10_000)
  return { fileName: `${baseName}-corpus.md`, bytes: blob.size }
}
