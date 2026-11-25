import { INITIAL_RESEARCH_DATA, LEGACY_SAMPLE_DOCUMENTS } from './sample-data.js'
import { BARDIN_OPEN_ACCESS_SOURCES, INITIAL_STUDY_NOTES } from './bardin-theory-data.js'
import { userData, corpusFiles } from './user-data-service.js'
import {
  GRAPH_SCHEMA,
  normalizeRelation,
  normalizeExcerptGraph,
  mergeExcerptGraphs
} from './excerpt-graph-utils.js'
import { mergeRemoteDocuments, mergeRemoteCodes } from './corpus-sync-utils.js'

export { GRAPH_SCHEMA }

// Pesquisa e estudo teórico ficam no escopo do usuário (userData.getItem/setItem).
const STORAGE_KEY = 'research_data_v1'
const STORAGE_THEORY_KEY = 'theory_study_v1'
// Configuração de nuvem (Client IDs, provedor) continua global ao navegador.
const STORAGE_CLOUD_KEY = 'fzl_caqdas_cloud_sync_v1'

export const DEFAULT_HOME_DIR = 'APP-CAQDAS-HOME-DIR'
const LEGACY_HOME_DIR = 'APP-CADDAS-HOME-DIR'

const PROVIDER_LABELS = {
  'google-drive': 'Google Drive & Docs',
  onedrive: 'Microsoft OneDrive',
  local: 'Armazenamento Local (Navegador)',
  rest: 'Servidor REST Customizado'
}

export function getPersistenceProviderLabel(provider) {
  return PROVIDER_LABELS[provider] || provider || PROVIDER_LABELS.local
}

const DEFAULT_CLOUD_CONFIG = {
  provider: 'local',
  autoConfigureByAuthProvider: true,
  homeDirName: DEFAULT_HOME_DIR,
  googleClientId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || '',
  microsoftClientId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MICROSOFT_CLIENT_ID) || '',
  microsoftTenantId: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_MICROSOFT_TENANT_ID) || 'common',
  googleDriveFolderId: '',
  googleDriveConvertToDocs: false,
  googleAuthToken: '',
  oneDriveFolderId: '',
  oneDriveAuthToken: '',
  autoSyncToCloud: true
}

// --- Modelo do trecho selecionado ---------------------------------------------------
export const EXCERPT_SCHEMA = 'caqdas-trechos/v1'

function newRandomId(prefix) {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
  return `${prefix}-${rand}`
}

function newExcerptId() {
  return newRandomId('quote')
}

const toInt = (value) => (Number.isInteger(value) && value >= 0 ? value : null)

/**
 * Formato canônico de um trecho. Aceita os excertos antigos ({ codeId, text,
 * startOffset, endOffset }) e devolve sempre todos os campos:
 * - docId / docTitle: material de origem (o título é uma cópia para leitura do JSON);
 * - title: do que se trata o trecho (escrito pelo pesquisador);
 * - text: o texto selecionado;
 * - start / end: posição em caracteres no texto do documento (TextPositionSelector);
 * - prefix / suffix: contexto antes/depois, para reencontrar o trecho se o texto mudar (TextQuoteSelector);
 * - blockIndex: parágrafo/bloco de origem, quando o leitor informar;
 * - page / endPage: página de início/fim (PDF), quando houver;
 * - codeId: código aplicado (opcional); note: anotação livre;
 * - createdAt / updatedAt: ISO 8601.
 */
export function normalizeExcerpt(raw, doc = null) {
  const q = raw || {}
  const start = toInt(q.start ?? q.startOffset)
  const end = toInt(q.end ?? q.endOffset)
  // Excertos antigos gravavam sempre 0..text.length; só vale se o documento começar mesmo pelo trecho.
  const text = String(q.text || '').trim()
  const legacyFakeRange =
    start === 0 && end === String(q.text || '').length && !q.prefix && !q.suffix &&
    !String(doc?.content || '').startsWith(text)
  const createdAt = typeof q.createdAt === 'string' ? q.createdAt : new Date(0).toISOString()
  return {
    id: String(q.id || ''),
    docId: String(doc?.id || q.docId || ''),
    docTitle: String(doc?.title || q.docTitle || ''),
    title: String(q.title || '').trim(),
    text,
    start: legacyFakeRange ? null : start,
    end: legacyFakeRange ? null : end,
    prefix: String(q.prefix || ''),
    suffix: String(q.suffix || ''),
    blockIndex: toInt(q.blockIndex),
    page: toInt(q.page) || null,
    endPage: toInt(q.endPage) || null,
    codeId: q.codeId ? String(q.codeId) : null,
    color: q.color ? String(q.color) : null,
    rects: Array.isArray(q.rects) ? q.rects : undefined,
    note: String(q.note || ''),
    createdAt,
    updatedAt: typeof q.updatedAt === 'string' ? q.updatedAt : createdAt
  }
}

class ResearchStorageService {
  constructor() {
    this._binaryFiles = new Map()
    this._objectUrls = new Map()
    this._scope = userData.scope
    this._data = this._loadData()
    this._theoryData = this._loadTheoryData()

    // Arquivos binários: espelha os registros do FzlCrudBaseController (IndexedDB do usuário).
    corpusFiles.subscribe(() => this._hydrateBinaryFiles())
    this._hydrateBinaryFiles()

    // Troca de usuário: recarrega os dados do novo escopo.
    userData.subscribe(() => {
      if (userData.scope === this._scope) return
      this._scope = userData.scope
      this._reloadForScope()
    })
    // Escopo apagado no logout: a memória também é limpa.
    userData.registerParticipant({
      purge: (scope) => {
        if (scope === this._scope) this._clearBinaryCache()
      }
    })
  }

  _reloadForScope() {
    this._clearBinaryCache()
    this._data = this._loadData()
    this._theoryData = this._loadTheoryData()
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caqdas-data-changed', { detail: this._data }))
      window.dispatchEvent(new CustomEvent('caqdas-theory-changed', { detail: this._theoryData }))
    }
  }

  _revokeUrl(docId) {
    const prevUrl = this._objectUrls.get(docId)
    if (prevUrl && typeof URL?.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(prevUrl)
      } catch {
        // Ignore revoke failures
      }
    }
    this._objectUrls.delete(docId)
  }

  _clearBinaryCache() {
    for (const docId of [...this._objectUrls.keys()]) this._revokeUrl(docId)
    this._binaryFiles.clear()
  }

  _cacheBinaryInMemory(docId, file) {
    if (!docId || !file) return
    if (this._binaryFiles.get(docId) === file) return
    this._revokeUrl(docId)
    this._binaryFiles.set(docId, file)
  }

  async saveBinaryFile(docId, file) {
    if (!docId || !file) return
    this._cacheBinaryInMemory(docId, file)
    try {
      await corpusFiles.putFile(docId, file)
    } catch (err) {
      console.warn('[FZL CAQDAS] Falha ao salvar arquivo no navegador:', err)
    }
  }

  getBinaryFile(docId) {
    return docId ? this._binaryFiles.get(docId) || null : null
  }

  getFileObjectUrl(docId) {
    if (!docId) return ''
    const existing = this._objectUrls.get(docId)
    if (existing) return existing
    const file = this._binaryFiles.get(docId)
    if (!file || typeof URL?.createObjectURL !== 'function') return ''
    const isPreviewable =
      file.type === 'application/pdf' ||
      String(file.type || '').startsWith('image/') ||
      /\.(pdf|png|jpe?g|webp|gif)$/i.test(file.name || '')
    if (!isPreviewable) return ''
    try {
      const url = URL.createObjectURL(file)
      this._objectUrls.set(docId, url)
      return url
    } catch {
      return ''
    }
  }

  async getBinaryFileAsync(docId) {
    if (!docId) return null
    const cached = this._binaryFiles.get(docId)
    if (cached) return cached
    await corpusFiles.whenLoaded()
    const file = corpusFiles.get(docId)?.data?.file
    if (!file) return null
    this._cacheBinaryInMemory(docId, file)
    return file
  }

  _hydrateBinaryFiles() {
    const present = new Set()
    let loadedAny = false
    for (const record of corpusFiles.items) {
      const file = record?.data?.file
      if (!file) continue
      present.add(record.id)
      if (this._binaryFiles.get(record.id) !== file) {
        this._cacheBinaryInMemory(record.id, file)
        loadedAny = true
      }
    }
    // Remove da memória o que saiu do armazenamento (exclusão, troca de usuário).
    for (const docId of [...this._binaryFiles.keys()]) {
      if (!present.has(docId) && corpusFiles.isLoaded) {
        this._revokeUrl(docId)
        this._binaryFiles.delete(docId)
      }
    }
    if (loadedAny && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caqdas-data-changed', { detail: this._data }))
    }
  }

  /** Referência remota (Drive/OneDrive) registrada no documento, se houver. */
  _remoteRefOf(doc) {
    if (!doc?.googleDriveFileId) return null
    return {
      provider: doc.storageProvider === 'onedrive' ? 'onedrive' : 'google-drive',
      remoteId: doc.googleDriveFileId,
      url: doc.externalViewerUrl || undefined,
      syncedAt: typeof doc.syncedAt === 'number' ? doc.syncedAt : undefined
    }
  }

  /** Mantém o registro do arquivo ciente da cópia na nuvem (para a exclusão alcançá-la). */
  _linkRemoteOf(doc) {
    const ref = this._remoteRefOf(doc)
    if (!ref) return Promise.resolve()
    return corpusFiles.linkRemote(doc.id, ref, doc.title).catch((err) => {
      console.warn('[FZL CAQDAS] Falha ao registrar a cópia remota:', err)
    })
  }

  /**
   * Remove um documento do corpus em todas as fontes: nuvem (lixeira do Drive/OneDrive)
   * e navegador. Pede confirmação. Se a nuvem falhar, a exclusão fica pendente e é
   * repetida automaticamente; o documento sai do corpus de qualquer forma.
   * @returns {Promise<{ cancelled: boolean, pending: boolean, error?: string }>}
   */
  async deleteDocument(docId) {
    const doc = this.getDocuments().find((d) => d.id === docId)
    if (!doc) return { cancelled: true, pending: false }

    await corpusFiles.whenLoaded()
    await this._linkRemoteOf(doc)

    let pending = false
    let error = ''
    if (corpusFiles.get(docId)) {
      const result = await corpusFiles.delete(docId)
      if (result.cancelled) return { cancelled: true, pending: false }
      pending = result.pending.length > 0
      error = result.pending.flatMap((p) => p.failures.map((f) => f.error)).join('; ')
    } else if (!confirm(`Deseja remover "${doc.title}" do corpus da pesquisa?`)) {
      return { cancelled: true, pending: false }
    }

    this._revokeUrl(docId)
    this._binaryFiles.delete(docId)
    this._data.documents = this.getDocuments().filter((d) => d.id !== docId)
    this._saveData(this._data)
    return { cancelled: false, pending, error }
  }

  isBinaryDocumentMeta(doc) {
    if (!doc) return false
    const title = String(doc.title || doc.name || '').toLowerCase()
    const ext = String(doc.extension || (title.includes('.') ? title.slice(title.lastIndexOf('.')) : '')).toLowerCase()
    if (['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.webp', '.gif', '.webm', '.mp4', '.mp3', '.ogg', '.wav'].includes(ext)) {
      return true
    }
    return ['pdf', 'docx', 'image', 'video', 'audio'].includes(String(doc.type || '').toLowerCase())
  }

  hasLocalDocument(doc) {
    if (!doc) return false
    if (this._binaryFiles.has(doc.id)) return true
    if (this.isBinaryDocumentMeta(doc)) return false
    return typeof doc.content === 'string' && doc.content.trim().length > 0
  }

  async openLocalDocument(doc) {
    if (!doc) return { ok: false, reason: 'missing-doc' }
    let file = await this.getBinaryFileAsync(doc.id)
    if (!file && !this.isBinaryDocumentMeta(doc) && typeof doc.content === 'string' && doc.content.trim()) {
      const title = String(doc.title || 'documento')
      const fileName = /\.[a-z0-9]{2,5}$/i.test(title) ? title : `${title}${doc.extension || '.txt'}`
      file = new File([doc.content], fileName, { type: 'text/plain;charset=utf-8' })
    }
    if (!file) {
      return { ok: false, reason: 'not-present' }
    }

    const blobUrl = URL.createObjectURL(file)
    const name = String(file.name || doc.title || 'arquivo')
    const mime = String(file.type || '').toLowerCase()
    const previewable =
      mime === 'application/pdf' ||
      mime.startsWith('text/') ||
      mime.startsWith('image/') ||
      mime.startsWith('video/') ||
      mime.startsWith('audio/') ||
      /\.(pdf|txt|md|csv|json|png|jpe?g|webp|gif|mp4|webm|mp3|ogg|wav)$/i.test(name)

    if (previewable) {
      const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer')
      if (!opened) {
        const a = document.createElement('a')
        a.href = blobUrl
        a.target = '_blank'
        a.rel = 'noopener noreferrer'
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } else {
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = name
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
    }

    setTimeout(() => {
      try {
        URL.revokeObjectURL(blobUrl)
      } catch {
        // Ignore revoke errors
      }
    }, 60_000)

    return { ok: true, file }
  }

  _loadTheoryData() {
    const raw = userData.getItem(STORAGE_THEORY_KEY)
    if (raw) {
      try {
        return JSON.parse(raw)
      } catch (e) {
        console.error('Error parsing stored theory study data:', e)
      }
    }
    const initial = {
      sources: JSON.parse(JSON.stringify(BARDIN_OPEN_ACCESS_SOURCES)),
      notes: JSON.parse(JSON.stringify(INITIAL_STUDY_NOTES))
    }
    this._saveTheoryData(initial)
    return initial
  }

  _saveTheoryData(data) {
    userData.setItem(STORAGE_THEORY_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('caqdas-theory-changed', { detail: data }))
  }

  _loadData() {
    const raw = userData.getItem(STORAGE_KEY)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed?.documents)) {
          let sanitized = false
          const withoutSamples = parsed.documents.filter(
            (doc) => LEGACY_SAMPLE_DOCUMENTS[doc?.id] === undefined || LEGACY_SAMPLE_DOCUMENTS[doc.id] !== doc.content
          )
          if (withoutSamples.length !== parsed.documents.length) {
            parsed.documents = withoutSamples
            sanitized = true
          }
          for (const doc of parsed.documents) {
            if (doc.status === 'synced' && !this.hasRemoteSync(doc)) {
              doc.status = 'local'
              sanitized = true
            }
            if (typeof doc.folder === 'string' && doc.folder.includes(LEGACY_HOME_DIR)) {
              doc.folder = doc.folder.replaceAll(LEGACY_HOME_DIR, DEFAULT_HOME_DIR)
              sanitized = true
            }
          }
          if (sanitized) {
            userData.setItem(STORAGE_KEY, JSON.stringify(parsed))
          }
        }
        return parsed
      } catch (e) {
        console.error('Error parsing stored research data:', e)
      }
    }
    this._saveData(INITIAL_RESEARCH_DATA)
    return JSON.parse(JSON.stringify(INITIAL_RESEARCH_DATA))
  }

  /**
   * Retorna true se o documento possui vínculo remoto confirmado na nuvem.
   */
  hasRemoteSync(doc) {
    return Boolean(doc && (doc.externalViewerUrl || doc.googleDriveFileId || doc.syncedAt))
  }

  /**
   * Retorna o estado real do documento: 'syncing' | 'synced' | 'local'.
   */
  getDocumentSyncState(doc, syncingIds = null) {
    if (!doc) return 'local'
    if ((syncingIds && syncingIds.has?.(doc.id)) || doc.status === 'syncing') {
      return 'syncing'
    }
    if (this.hasRemoteSync(doc)) {
      return 'synced'
    }
    return 'local'
  }

  /**
   * Mapeia o estado real do documento para os status aceitos pelo <fzl-file-manager>:
   * - 'local' -> 'bookmarked-only' (Favorito Local)
   * - 'syncing' -> 'pending-upload' (Pendente Upload / Sincronizando)
   * - 'synced' -> 'synced' (Sincronizado)
   */
  getFileManagerStatus(doc, syncingIds = null) {
    const state = this.getDocumentSyncState(doc, syncingIds)
    if (state === 'syncing') return 'pending-upload'
    if (state === 'synced') return 'synced'
    return 'bookmarked-only'
  }

  /**
   * Retorna true quando há sessão autenticada ou token OAuth manual configurado.
   */
  isCloudAuthenticated(user) {
    const cfg = this.getCloudSyncConfig()
    return Boolean(user || cfg.googleAuthToken || cfg.oneDriveAuthToken)
  }

  /**
   * Retorna o provedor efetivo: enquanto não estiver autenticado nem possuir token manual,
   * força 'local' para que a UI não indique persistência em nuvem inexistente.
   */
  getEffectivePersistenceProvider(user) {
    const cfg = this.getCloudSyncConfig()
    if (!this.isCloudAuthenticated(user)) {
      return 'local'
    }
    return cfg.provider || 'local'
  }

  _saveData(data) {
    userData.setItem(STORAGE_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('caqdas-data-changed', { detail: data }))
  }

  getCloudSyncConfig() {
    try {
      const raw = localStorage.getItem(STORAGE_CLOUD_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        const normalized = { ...DEFAULT_CLOUD_CONFIG, ...parsed, googleDriveConvertToDocs: false }
        if (normalized.homeDirName === LEGACY_HOME_DIR) {
          normalized.homeDirName = DEFAULT_HOME_DIR
          normalized.googleDriveFolderId = ''
          normalized.oneDriveFolderId = ''
          localStorage.setItem(STORAGE_CLOUD_KEY, JSON.stringify(normalized))
        }
        return normalized
      }
    } catch (e) {
      console.warn('Erro ao ler configuração de nuvem:', e)
    }
    return { ...DEFAULT_CLOUD_CONFIG }
  }

  saveCloudSyncConfig(cfg) {
    const updated = { ...this.getCloudSyncConfig(), ...cfg, googleDriveConvertToDocs: false }
    localStorage.setItem(STORAGE_CLOUD_KEY, JSON.stringify(updated))
    window.dispatchEvent(new CustomEvent('caqdas-cloud-sync-changed', { detail: updated }))
    return updated
  }

  /**
   * Retorna o nome sanitizado da pasta inicial padrão de persistência (default: APP-CAQDAS-HOME-DIR).
   */
  getHomeDirName() {
    const cfg = this.getCloudSyncConfig()
    const clean = String(cfg.homeDirName || '')
      .trim()
      .replace(/^\/+|\/+$/g, '')
    return clean || DEFAULT_HOME_DIR
  }

  /**
   * Normaliza qualquer subpasta do corpus para residir sob a pasta raiz configurada (/{homeDirName}/...).
   */
  formatPersistenceFolder(subFolder = '') {
    const homeDir = this.getHomeDirName()
    const clean = String(subFolder || '')
      .trim()
      .replace(/^\/+|\/+$/g, '')
    if (!clean) return `/${homeDir}`
    if (clean === homeDir || clean.startsWith(`${homeDir}/`)) {
      return `/${clean}`
    }
    return `/${homeDir}/${clean}`
  }

  /**
   * Ajusta automaticamente o provedor de persistência (Google Drive ou OneDrive)
   * com base na conta social autenticada, quando autoConfigureByAuthProvider estiver ativo.
   */
  syncProviderFromAuthUser(user) {
    const cfg = this.getCloudSyncConfig()
    if (!user || cfg.autoConfigureByAuthProvider === false) {
      return cfg
    }

    const email = String(user.email || '').toLowerCase()
    const providerHint = String(user.provider || '').toLowerCase()
    let targetProvider = null

    if (
      providerHint === 'google' ||
      email.includes('@gmail.') ||
      email.endsWith('@googlemail.com') ||
      String(user.avatarUrl || '').includes('googleusercontent.com')
    ) {
      targetProvider = 'google-drive'
    } else if (
      providerHint === 'microsoft' ||
      /@(outlook|hotmail|live|msn)\./i.test(email)
    ) {
      targetProvider = 'onedrive'
    }

    if (targetProvider && targetProvider !== cfg.provider) {
      return this.saveCloudSyncConfig({ provider: targetProvider })
    }
    return cfg
  }

  /**
   * Reverte a persistência para 'local' quando não houver usuário autenticado nem token OAuth manual.
   */
  resetProviderWhenUnauthenticated(user) {
    const cfg = this.getCloudSyncConfig()
    if (!this.isCloudAuthenticated(user) && cfg.provider !== 'local') {
      return this.saveCloudSyncConfig({ provider: 'local' })
    }
    return cfg
  }

  updateDocument(docId, updates) {
    const doc = this._data.documents.find(d => d.id === docId)
    if (!doc) return null
    Object.assign(doc, updates)
    this._saveData(this._data)
    if (updates && 'googleDriveFileId' in updates) void this._linkRemoteOf(doc)
    return doc
  }

  getProject() {
    return this._data.project
  }

  getCategories() {
    return this._data.categories || []
  }

  getCodes() {
    return this._data.codes || []
  }

  getDocuments() {
    return this._data.documents || []
  }

  getMemos() {
    return this._data.memos || []
  }

  addDocument(doc) {
    const newDoc = {
      id: doc.id || `doc-${Date.now()}`,
      quotations: [],
      ...doc
    }
    this._data.documents.push(newDoc)
    this._saveData(this._data)
    void this._linkRemoteOf(newDoc)
    return newDoc
  }

  /**
   * Registra no corpus local os arquivos que já existem na pasta inicial da nuvem
   * (por exemplo, enviados de outro dispositivo). O conteúdo não é baixado aqui:
   * fica disponível pelo link da nuvem e é baixado sob demanda ao abrir.
   * @returns {number} quantidade de documentos adicionados
   */
  importCloudFiles(files, provider) {
    const docs = this._data.documents
    const knownIds = new Set(docs.map((d) => d.googleDriveFileId).filter(Boolean))
    let added = 0
    let linked = 0
    for (const f of files || []) {
      if (!f?.id || knownIds.has(f.id)) continue
      const mime = String(f.mimeType || '')
      // Pastas (ex.: .caqdas-dados) e documentos nativos do Google (Docs/Sheets) não entram como arquivos do corpus.
      if (mime === 'folder' || mime.startsWith('application/vnd.google-apps.')) continue
      const name = String(f.name || 'arquivo')
      if (name === '.caqdas-dados' || /^\.caqdas-.*\.json$/i.test(name)) continue
      const ext = name.includes('.') ? name.slice(name.lastIndexOf('.')).toLowerCase() : ''
      // Mesmo arquivo já registrado localmente mas sem o ID remoto (envio antigo): só vincula.
      const sameLocal = docs.find((d) => !d.googleDriveFileId && d.title === name && (!f.size || !d.size || d.size === f.size))
      const remote = {
        status: 'synced',
        storageProvider: provider,
        googleDriveFileId: f.id,
        externalViewerUrl: f.webViewLink,
        externalViewerLabel: provider === 'onedrive' ? 'Abrir no OneDrive ↗' : 'Abrir no Google Drive ↗',
        syncedAt: Date.now()
      }
      if (sameLocal) {
        Object.assign(sameLocal, remote)
        knownIds.add(f.id)
        linked++
        continue
      }
      const type = mime.startsWith('audio/')
        ? 'audio'
        : mime.startsWith('video/')
          ? 'video'
          : mime.startsWith('image/')
            ? 'image'
            : ext === '.pdf' || mime === 'application/pdf'
              ? 'pdf'
              : ext === '.docx'
                ? 'docx'
                : ext === '.csv' || ext === '.json'
                  ? ext.slice(1)
                  : 'interview'
      const subfolder = type === 'audio' ? 'capturas-audio' : type === 'image' || type === 'video' ? 'capturas-camera' : 'entrevistas'
      docs.push({
        id: `doc-cloud-${f.id}`,
        title: name,
        participant: 'Importado da nuvem',
        group: 'Corpus da Nuvem',
        folder: this.formatPersistenceFolder(subfolder),
        type,
        extension: ext,
        mimeType: mime,
        size: f.size || 0,
        uploadedAt: f.createdTime ? Date.parse(f.createdTime) : Date.now(),
        tags: ['nuvem', type, ...(type === 'audio' ? ['transcricao-pendente'] : [])],
        content: '',
        quotations: [],
        ...remote
      })
      knownIds.add(f.id)
      added++
    }
    if (added > 0 || linked > 0) {
      this._saveData(this._data)
      for (const doc of docs) if (doc.googleDriveFileId) void this._linkRemoteOf(doc)
    }
    return added
  }

  // --- Trechos selecionados (excertos / quotations) ---------------------------------
  // Cada trecho fica no próprio documento (doc.quotations), no escopo do usuário.
  // Modelo (EXCERPT_SCHEMA): ver normalizeExcerpt() abaixo.

  /**
   * Salva um trecho selecionado de um documento.
   * @param {string} docId documento de origem
   * @param {object} excerpt { text, title?, start?, end?, prefix?, suffix?, blockIndex?, codeId?, note? }
   */
  addQuotation(docId, excerpt) {
    const doc = this._data.documents.find((d) => d.id === docId)
    if (!doc) return null
    const now = new Date().toISOString()
    const newQuote = normalizeExcerpt(
      { ...excerpt, id: excerpt?.id || newExcerptId(), createdAt: excerpt?.createdAt || now, updatedAt: now },
      doc
    )
    if (!newQuote.text) return null
    doc.quotations = doc.quotations || []
    doc.quotations.push(newQuote)
    this._saveData(this._data)
    return newQuote
  }

  /** Atualiza título, nota, código ou âncora de um trecho. */
  updateQuotation(docId, quoteId, updates) {
    const doc = this._data.documents.find((d) => d.id === docId)
    const index = doc?.quotations?.findIndex((q) => q.id === quoteId) ?? -1
    if (index < 0) return null
    const current = doc.quotations[index]
    const next = normalizeExcerpt(
      { ...current, ...updates, id: current.id, createdAt: current.createdAt, updatedAt: new Date().toISOString() },
      doc
    )
    doc.quotations[index] = next
    this._saveData(this._data)
    return next
  }

  removeQuotation(docId, quoteId) {
    const doc = this._data.documents.find(d => d.id === docId)
    if (!doc || !doc.quotations) return
    doc.quotations = doc.quotations.filter(q => q.id !== quoteId)
    // Marca de exclusão: impede que uma sincronização traga o trecho de volta.
    const now = new Date().toISOString()
    this._rememberDeletedExcerpt({ id: quoteId, docId, deletedAt: now })
    // Limpa nó e relações associadas a este trecho no grafo
    const graph = normalizeExcerptGraph(this._data.excerptGraph)
    if (graph.nodes[quoteId]) delete graph.nodes[quoteId]
    const remainingRelations = []
    for (const rel of graph.relations) {
      if (rel.sourceId === quoteId || rel.targetId === quoteId) {
        graph.deletedRelations.push({ id: rel.id, deletedAt: now })
      } else {
        remainingRelations.push(rel)
      }
    }
    graph.relations = remainingRelations
    this._data.excerptGraph = graph
    this._saveData(this._data)
  }

  /** Trechos removidos (id, docId, deletedAt), para propagar a exclusão entre aparelhos. */
  getDeletedExcerpts() {
    return Array.isArray(this._data.deletedExcerpts) ? this._data.deletedExcerpts : []
  }

  _rememberDeletedExcerpt(mark) {
    if (!mark?.id || typeof mark.deletedAt !== 'string') return
    const list = this.getDeletedExcerpts().filter((m) => m.id !== mark.id)
    const previous = this.getDeletedExcerpts().find((m) => m.id === mark.id)
    const keep = previous && previous.deletedAt > mark.deletedAt ? previous : mark
    list.push({ id: String(keep.id), docId: String(keep.docId || ''), deletedAt: keep.deletedAt })
    this._data.deletedExcerpts = list
  }

  /** Trechos de um documento, já no formato atual (ordem de leitura). */
  getDocumentExcerpts(docId) {
    const doc = this._data.documents.find((d) => d.id === docId)
    return (doc?.quotations || [])
      .map((q) => normalizeExcerpt(q, doc))
      .sort((a, b) => (a.start ?? Infinity) - (b.start ?? Infinity) || a.createdAt.localeCompare(b.createdAt))
  }

  /** Todos os trechos do projeto, com o documento de origem. */
  getAllExcerpts() {
    return this.getDocuments().flatMap((doc) => (doc.quotations || []).map((q) => normalizeExcerpt(q, doc)))
  }

  /**
   * JSON versionado com os trechos do projeto (para baixar ou enviar ao GitHub).
   * Inclui os documentos de origem e os códigos referenciados, para o arquivo se explicar sozinho.
   */
  exportExcerpts() {
    const docs = this.getDocuments()
    const excerpts = this.getAllExcerpts()
    const usedDocs = new Set(excerpts.map((e) => e.docId))
    const usedCodes = new Set(excerpts.map((e) => e.codeId).filter(Boolean))
    const project = this.getProject() || {}
    const graph = this.getExcerptGraph()
    return {
      schema: EXCERPT_SCHEMA,
      exportedAt: new Date().toISOString(),
      project: { id: project.id || '', name: project.name || '' },
      documents: docs
        .filter((d) => usedDocs.has(d.id))
        .map((d) => ({
          id: d.id,
          title: d.title || '',
          type: d.type || '',
          participant: d.participant || '',
          folder: d.folder || '',
          ...(d.googleDriveFileId
            ? {
                remote: {
                  provider: d.storageProvider === 'onedrive' ? 'onedrive' : 'google-drive',
                  fileId: d.googleDriveFileId,
                  url: d.externalViewerUrl || ''
                }
              }
            : {})
        })),
      codes: this.getCodes()
        .filter((c) => usedCodes.has(c.id))
        .map((c) => ({ id: c.id, name: c.name, color: c.color, categoryId: c.categoryId || null })),
      excerpts,
      deleted: this.getDeletedExcerpts(),
      graph: {
        nodes: graph.nodes,
        relations: graph.relations,
        deleted: graph.deletedRelations
      }
    }
  }

  importProjectMeta(remoteProject) {
    if (!remoteProject || typeof remoteProject !== 'object') return false
    const current = this._data.project || {}
    let changed = false
    if (
      remoteProject.name &&
      (!current.name || current.name === 'Meu Projeto de Pesquisa')
    ) {
      current.name = String(remoteProject.name)
      changed = true
    }
    if (remoteProject.description && !current.description) {
      current.description = String(remoteProject.description)
      changed = true
    }
    if (changed) {
      this._data.project = current
      this._saveData(this._data)
    }
    return changed
  }

  /**
   * Restaura metadados de documentos vindos do GitHub (sem sobrescrever conteúdo local)
   * para que o corpus e suas marcações fiquem disponíveis imediatamente ao entrar em outro dispositivo.
   */
  importRemoteDocuments(remoteDocsList) {
    const res = mergeRemoteDocuments(this.getDocuments(), remoteDocsList, {
      formatFolder: (f) => this.formatPersistenceFolder(f)
    })
    if (res.added > 0 || res.updated > 0) {
      this._data.documents = res.documents
      this._saveData(this._data)
      for (const doc of res.addedDocs) {
        if (doc.googleDriveFileId) void this._linkRemoteOf(doc)
      }
    }
    return { added: res.added, updated: res.updated }
  }

  /**
   * Importa trechos de um JSON exportado (mescla por id; o mais recente vence).
   * Códigos referenciados faltantes são restaurados antes da mesclagem dos trechos.
   * Marcas de exclusão (`deleted`) removem trechos locais que não foram editados depois da exclusão.
   * @returns {{ added: number, updated: number, removed: number, skipped: number, codesAdded: number }}
   */
  importExcerpts(payload) {
    if (!payload || payload.schema !== EXCERPT_SCHEMA || !Array.isArray(payload.excerpts)) {
      throw new Error(`Arquivo inválido: esperado um JSON "${EXCERPT_SCHEMA}".`)
    }
    const mergedCodes = mergeRemoteCodes(this.getCodes(), payload.codes)
    if (mergedCodes.added > 0) {
      this._data.codes = mergedCodes.codes
    }

    const docs = this.getDocuments()
    const sourceTitles = new Map((payload.documents || []).map((d) => [d.id, d.title]))
    const sourceRemoteIds = new Map((payload.documents || []).map((d) => [d.id, d.remote?.fileId || '']))
    const result = { added: 0, updated: 0, removed: 0, skipped: 0, codesAdded: mergedCodes.added }
    let tombstonesChanged = false
    const tombstoneOf = (id) => this.getDeletedExcerpts().find((m) => m.id === id)
    for (const mark of Array.isArray(payload.deleted) ? payload.deleted : []) {
      if (!mark?.id || typeof mark.deletedAt !== 'string') continue
      const before = tombstoneOf(mark.id)?.deletedAt
      this._rememberDeletedExcerpt(mark)
      if (tombstoneOf(mark.id)?.deletedAt !== before) tombstonesChanged = true
    }
    for (const raw of payload.excerpts) {
      // Removido aqui (ou em outro aparelho) depois da última edição: não volta.
      const mark = raw?.id ? tombstoneOf(raw.id) : null
      if (mark && mark.deletedAt >= String(raw.updatedAt || raw.createdAt || '')) {
        result.skipped++
        continue
      }
      const title = sourceTitles.get(raw?.docId) || raw?.docTitle
      const remoteFileId = sourceRemoteIds.get(raw?.docId) || ''
      const doc =
        docs.find((d) => d.id === raw?.docId) ||
        (remoteFileId ? docs.find((d) => d.googleDriveFileId === remoteFileId) : null) ||
        (title ? docs.find((d) => d.title === title) : null)
      if (!doc || !raw?.id || !raw?.text) {
        result.skipped++
        continue
      }
      doc.quotations = doc.quotations || []
      const index = doc.quotations.findIndex((q) => q.id === raw.id)
      const incoming = normalizeExcerpt(raw, doc)
      if (index < 0) {
        doc.quotations.push(incoming)
        result.added++
      } else if (String(incoming.updatedAt) > String(normalizeExcerpt(doc.quotations[index], doc).updatedAt)) {
        doc.quotations[index] = incoming
        result.updated++
      }
    }
    // Aplica as exclusões aos trechos locais que não mudaram depois delas.
    for (const doc of docs) {
      if (!doc.quotations?.length) continue
      const kept = doc.quotations.filter((q) => {
        const mark = tombstoneOf(q.id)
        return !mark || mark.deletedAt < normalizeExcerpt(q, doc).updatedAt
      })
      result.removed += doc.quotations.length - kept.length
      doc.quotations = kept
    }
    let graphChanged = false
    if (payload.graph && typeof payload.graph === 'object') {
      const mergedGraph = mergeExcerptGraphs(this._data.excerptGraph, payload.graph)
      if (mergedGraph.changed) {
        this._data.excerptGraph = mergedGraph.graph
        graphChanged = true
      }
    }
    if (result.added || result.updated || result.removed || tombstonesChanged || graphChanged || result.codesAdded) {
      this._saveData(this._data)
    }
    return result
  }

  // --- Grafo de inter-relações entre marcações --------------------------------------

  getExcerptGraph() {
    return normalizeExcerptGraph(this._data.excerptGraph)
  }

  saveExcerptNodePosition(excerptId, x, y) {
    if (!excerptId || !Number.isFinite(Number(x)) || !Number.isFinite(Number(y))) return null
    const graph = this.getExcerptGraph()
    const pos = { x: Math.round(Number(x)), y: Math.round(Number(y)), updatedAt: new Date().toISOString() }
    graph.nodes[excerptId] = pos
    this._data.excerptGraph = graph
    this._saveData(this._data)
    return pos
  }

  saveExcerptNodePositions(posMap) {
    if (!posMap || typeof posMap !== 'object') return this.getExcerptGraph()
    const graph = this.getExcerptGraph()
    const now = new Date().toISOString()
    let changed = false
    for (const [id, rawPos] of Object.entries(posMap)) {
      if (!id || !rawPos || !Number.isFinite(Number(rawPos.x)) || !Number.isFinite(Number(rawPos.y))) continue
      graph.nodes[id] = {
        x: Math.round(Number(rawPos.x)),
        y: Math.round(Number(rawPos.y)),
        updatedAt: typeof rawPos.updatedAt === 'string' && rawPos.updatedAt ? rawPos.updatedAt : now
      }
      changed = true
    }
    if (changed) {
      this._data.excerptGraph = graph
      this._saveData(this._data)
    }
    return graph
  }

  addExcerptRelation({ sourceId, targetId, type = 'associa', label, directed, note = '' }) {
    const now = new Date().toISOString()
    const rel = normalizeRelation({
      id: newRandomId('rel'),
      sourceId,
      targetId,
      type,
      label,
      directed,
      note,
      createdAt: now,
      updatedAt: now
    })
    if (!rel) return null
    const graph = this.getExcerptGraph()
    graph.relations.push(rel)
    this._data.excerptGraph = graph
    this._saveData(this._data)
    return rel
  }

  updateExcerptRelation(relId, updates) {
    const graph = this.getExcerptGraph()
    const index = graph.relations.findIndex((r) => r.id === relId)
    if (index < 0) return null
    const current = graph.relations[index]
    const next = normalizeRelation({
      ...current,
      ...updates,
      id: current.id,
      createdAt: current.createdAt,
      updatedAt: new Date().toISOString()
    })
    if (!next) return null
    graph.relations[index] = next
    this._data.excerptGraph = graph
    this._saveData(this._data)
    return next
  }

  removeExcerptRelation(relId) {
    if (!relId) return
    const graph = this.getExcerptGraph()
    const before = graph.relations.length
    graph.relations = graph.relations.filter((r) => r.id !== relId)
    const now = new Date().toISOString()
    const prevIdx = graph.deletedRelations.findIndex((m) => m.id === relId)
    if (prevIdx >= 0) {
      graph.deletedRelations[prevIdx] = { id: relId, deletedAt: now }
    } else {
      graph.deletedRelations.push({ id: relId, deletedAt: now })
    }
    if (graph.relations.length !== before || prevIdx < 0) {
      this._data.excerptGraph = graph
      this._saveData(this._data)
    }
  }

  exportExcerptGraph() {
    const project = this.getProject() || {}
    const graph = this.getExcerptGraph()
    return {
      schema: GRAPH_SCHEMA,
      exportedAt: new Date().toISOString(),
      project: { id: project.id || '', name: project.name || '' },
      nodes: graph.nodes,
      relations: graph.relations,
      deleted: graph.deletedRelations
    }
  }

  importExcerptGraph(payload) {
    if (!payload || typeof payload !== 'object') {
      throw new Error(`Arquivo de grafo inválido: esperado JSON "${GRAPH_SCHEMA}".`)
    }
    if (payload.schema && payload.schema !== GRAPH_SCHEMA) {
      throw new Error(`Formato de grafo inválido: esperado "${GRAPH_SCHEMA}".`)
    }
    const merged = mergeExcerptGraphs(this._data.excerptGraph, payload)
    if (merged.changed) {
      this._data.excerptGraph = merged.graph
      this._saveData(this._data)
    }
    return { added: merged.added, updated: merged.updated, removed: merged.removed }
  }

  addCode(code) {
    const newCode = {
      id: code.id || `code-${Date.now()}`,
      color: code.color || '#006a6a',
      ...code
    }
    this._data.codes.push(newCode)
    this._saveData(this._data)
    return newCode
  }

  addCategory(cat) {
    const newCat = {
      id: cat.id || `cat-${Date.now()}`,
      color: cat.color || '#006a6a',
      ...cat
    }
    this._data.categories.push(newCat)
    this._saveData(this._data)
    return newCat
  }

  addMemo(memo) {
    const newMemo = {
      id: memo.id || `memo-${Date.now()}`,
      createdDate: new Date().toISOString().split('T')[0],
      ...memo
    }
    this._data.memos.push(newMemo)
    this._saveData(this._data)
    return newMemo
  }

  resetToDefault() {
    this._data = JSON.parse(JSON.stringify(INITIAL_RESEARCH_DATA))
    this._saveData(this._data)
  }

  getTheoryStudyData() {
    return this._theoryData
  }

  getOpenAccessSources() {
    return this._theoryData.sources || []
  }

  toggleSourceSelection(sourceId) {
    const sources = this._theoryData.sources || []
    const target = sources.find(s => s.id === sourceId)
    if (!target) return null
    target.selectedForFramework = !target.selectedForFramework
    this._saveTheoryData(this._theoryData)
    return target
  }

  addSource(sourceObj) {
    const newSource = {
      id: sourceObj.id || `src-${Date.now()}`,
      shortRef: sourceObj.shortRef || 'Fonte Adicionada',
      type: sourceObj.type || 'Artigo Metodológico (Acesso Aberto)',
      accessStatus: sourceObj.accessStatus || 'Acesso Aberto',
      abntCitation: sourceObj.abntCitation || '',
      url: sourceObj.url || '',
      summary: sourceObj.summary || '',
      contributionsToSoftware: sourceObj.contributionsToSoftware || '',
      selectedForFramework: sourceObj.selectedForFramework ?? true
    }
    this._theoryData.sources = this._theoryData.sources || []
    this._theoryData.sources.push(newSource)
    this._saveTheoryData(this._theoryData)
    return newSource
  }

  getTheoreticalNotes() {
    return this._theoryData.notes || []
  }

  addTheoreticalNote(noteObj) {
    const source = (this._theoryData.sources || []).find(s => s.id === noteObj.sourceId)
    const citationText = (noteObj.citationText || source?.abntCitation || '').trim()
    if (!citationText) {
      throw new Error('É obrigatório informar ou vincular uma fonte/citação para registrar uma anotação teórica.')
    }
    const newNote = {
      id: noteObj.id || `note-${Date.now()}`,
      title: noteObj.title,
      phase: noteObj.phase || 'Pré-Análise',
      content: noteObj.content,
      sourceId: noteObj.sourceId || source?.id || '',
      citationText,
      createdDate: new Date().toISOString().split('T')[0]
    }
    this._theoryData.notes = this._theoryData.notes || []
    this._theoryData.notes.unshift(newNote)
    this._saveTheoryData(this._theoryData)
    return newNote
  }

  removeTheoreticalNote(noteId) {
    this._theoryData.notes = (this._theoryData.notes || []).filter(n => n.id !== noteId)
    this._saveTheoryData(this._theoryData)
  }

  resetTheoryToDefault() {
    this._theoryData = {
      sources: JSON.parse(JSON.stringify(BARDIN_OPEN_ACCESS_SOURCES)),
      notes: JSON.parse(JSON.stringify(INITIAL_STUDY_NOTES))
    }
    this._saveTheoryData(this._theoryData)
  }
}

export const researchStorage = new ResearchStorageService()
