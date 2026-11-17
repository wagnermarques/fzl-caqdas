import { INITIAL_RESEARCH_DATA, LEGACY_SAMPLE_DOCUMENTS } from './sample-data.js'
import { BARDIN_OPEN_ACCESS_SOURCES, INITIAL_STUDY_NOTES } from './bardin-theory-data.js'

const STORAGE_KEY = 'fzl_caqdas_research_data_v1'
const STORAGE_THEORY_KEY = 'fzl_caqdas_theory_study_v1'
const STORAGE_CLOUD_KEY = 'fzl_caqdas_cloud_sync_v1'
const FILE_DB_NAME = 'fzl_caqdas_files_v1'
const FILE_STORE_NAME = 'files'

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

class ResearchStorageService {
  constructor() {
    this._binaryFiles = new Map()
    this._objectUrls = new Map()
    this._data = this._loadData()
    this._theoryData = this._loadTheoryData()
    void this._hydrateBinaryFiles()
  }

  _openFilesDb() {
    if (typeof indexedDB === 'undefined') return Promise.resolve(null)
    return new Promise((resolve) => {
      try {
        const req = indexedDB.open(FILE_DB_NAME, 1)
        req.onupgradeneeded = () => {
          const db = req.result
          if (!db.objectStoreNames.contains(FILE_STORE_NAME)) {
            db.createObjectStore(FILE_STORE_NAME, { keyPath: 'id' })
          }
        }
        req.onsuccess = () => resolve(req.result)
        req.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  }

  _cacheBinaryInMemory(docId, file) {
    if (!docId || !file) return
    const prevUrl = this._objectUrls.get(docId)
    if (prevUrl && typeof URL?.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(prevUrl)
      } catch {
        // Ignore revoke failures
      }
      this._objectUrls.delete(docId)
    }
    this._binaryFiles.set(docId, file)
  }

  async saveBinaryFile(docId, file) {
    if (!docId || !file) return
    this._cacheBinaryInMemory(docId, file)
    const db = await this._openFilesDb()
    if (!db) return
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(FILE_STORE_NAME, 'readwrite')
        tx.objectStore(FILE_STORE_NAME).put({
          id: docId,
          name: file.name || docId,
          type: file.type || 'application/octet-stream',
          lastModified: file.lastModified || Date.now(),
          blob: file
        })
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
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

    const db = await this._openFilesDb()
    if (!db) return null
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(FILE_STORE_NAME, 'readonly')
        const req = tx.objectStore(FILE_STORE_NAME).get(docId)
        req.onsuccess = () => {
          const rec = req.result
          if (!rec?.blob) {
            resolve(null)
            return
          }
          const restored =
            rec.blob instanceof File
              ? rec.blob
              : new File([rec.blob], rec.name || docId, {
                  type: rec.type || 'application/octet-stream',
                  lastModified: rec.lastModified || Date.now()
                })
          this._cacheBinaryInMemory(docId, restored)
          resolve(restored)
        }
        req.onerror = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  }

  async deleteBinaryFile(docId) {
    if (!docId) return
    const prevUrl = this._objectUrls.get(docId)
    if (prevUrl && typeof URL?.revokeObjectURL === 'function') {
      try {
        URL.revokeObjectURL(prevUrl)
      } catch {
        // Ignore revoke errors
      }
    }
    this._objectUrls.delete(docId)
    this._binaryFiles.delete(docId)

    const db = await this._openFilesDb()
    if (!db) return
    await new Promise((resolve) => {
      try {
        const tx = db.transaction(FILE_STORE_NAME, 'readwrite')
        tx.objectStore(FILE_STORE_NAME).delete(docId)
        tx.oncomplete = () => resolve()
        tx.onerror = () => resolve()
      } catch {
        resolve()
      }
    })
  }

  async _hydrateBinaryFiles() {
    const db = await this._openFilesDb()
    if (!db) return
    const records = await new Promise((resolve) => {
      try {
        const tx = db.transaction(FILE_STORE_NAME, 'readonly')
        const req = tx.objectStore(FILE_STORE_NAME).getAll()
        req.onsuccess = () => resolve(Array.isArray(req.result) ? req.result : [])
        req.onerror = () => resolve([])
      } catch {
        resolve([])
      }
    })

    let loadedAny = false
    for (const rec of records) {
      if (!rec?.id || !rec?.blob || this._binaryFiles.has(rec.id)) continue
      const restored =
        rec.blob instanceof File
          ? rec.blob
          : new File([rec.blob], rec.name || rec.id, {
              type: rec.type || 'application/octet-stream',
              lastModified: rec.lastModified || Date.now()
            })
      this._cacheBinaryInMemory(rec.id, restored)
      loadedAny = true
    }

    if (loadedAny && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('caqdas-data-changed', { detail: this._data }))
    }
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
    const raw = localStorage.getItem(STORAGE_THEORY_KEY)
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
    localStorage.setItem(STORAGE_THEORY_KEY, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('caqdas-theory-changed', { detail: data }))
  }

  _loadData() {
    const raw = localStorage.getItem(STORAGE_KEY)
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
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
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
    return newDoc
  }

  addQuotation(docId, quotation) {
    const doc = this._data.documents.find(d => d.id === docId)
    if (!doc) return null
    const newQuote = {
      id: `quote-${Date.now()}`,
      ...quotation
    }
    doc.quotations = doc.quotations || []
    doc.quotations.push(newQuote)
    this._saveData(this._data)
    return newQuote
  }

  removeQuotation(docId, quoteId) {
    const doc = this._data.documents.find(d => d.id === docId)
    if (!doc || !doc.quotations) return
    doc.quotations = doc.quotations.filter(q => q.id !== quoteId)
    this._saveData(this._data)
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
