import { openForReading } from '../services/reading-intent.js'
import { pdfTextExtractor } from '../services/pdf-text.js'
import { LitElement, html, css } from 'lit'
import { researchStorage, getPersistenceProviderLabel } from '../services/storage-service.js'
import { authService } from 'fzl-fund-appshell--lit'
import { CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'
import '@fzl/webcomponents-lit/file-manager'
import '@fzl/webcomponents-lit/document-picker'
import '@fzl/webcomponents-lit/camera-capture'
import '../components/caqdas-audio-recorder.js'
import '../components/caqdas-legislation-panel.js'

export class CaqdasSourcesView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-box {
      background: var(--md-sys-color-surface-container, #f3f5f5);
      border: 1px solid var(--md-sys-color-outline-variant, #d8e0df);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 12px;
    }

    h1 {
      margin: 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.65rem;
    }

    .corpus-rules-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e0f2f1;
      color: #004d40;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .capture-status {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      font-size: 0.88rem;
    }

    .tabs-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      padding-bottom: 12px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline-variant, #ccc);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
      font-size: 0.92rem;
      font-weight: 500;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .tab-btn:hover {
      background: #f2f7f7;
    }

    .tab-btn.active {
      background: var(--md-sys-color-primary, #006a6a);
      color: #fff;
      border-color: var(--md-sys-color-primary, #006a6a);
    }

    .card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .info-alert {
      background: #f0f7f7;
      border-left: 4px solid var(--md-sys-color-primary, #006a6a);
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 0.9rem;
      color: #2c4d4d;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .form-box {
      background: #f9fbfb;
      border: 1px dashed var(--md-sys-color-primary, #006a6a);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .action-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #e0e0e0;
    }

    .selected-doc-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 14px;
      padding: 12px 16px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      font-size: 0.88rem;
    }

    .btn-local-file {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #ecfdf5;
      color: #065f46;
      padding: 6px 12px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 0.84rem;
      border: 1px solid #a7f3d0;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-local-file:hover {
      background: #d1fae5;
    }

    .btn-external-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e0f2fe;
      color: #0284c7;
      padding: 6px 12px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.84rem;
      border: 1px solid #bae6fd;
    }

    .btn-external-link:hover {
      background: #bae6fd;
    }

    .cloud-pull-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      margin: 0 0 12px;
      font-size: 0.88rem;
      color: #475569;
    }

    .pending-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 16px;
      padding: 14px;
      border: 1px dashed #f59e0b;
      border-radius: 12px;
      background: #fffbeb;
    }

    .pending-heading {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 600;
      color: #92400e;
    }

    .pending-item {
      display: flex;
      flex-wrap: wrap;
      gap: 14px;
      align-items: center;
      padding: 10px;
      border-radius: 10px;
      background: #fff;
      border: 1px solid #fde68a;
    }

    .pending-preview {
      flex: 0 1 220px;
      min-width: 0;
    }

    .pending-preview img,
    .pending-preview video {
      display: block;
      width: 100%;
      max-height: 160px;
      object-fit: contain;
      border-radius: 8px;
      background: #000;
    }

    .pending-preview audio {
      width: 100%;
    }

    .pending-form {
      flex: 1 1 260px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    .pending-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.85rem;
      color: #333;
    }

    .pending-name-wrap {
      display: flex;
      align-items: stretch;
    }

    .pending-name-input {
      flex: 1;
      min-width: 0;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      border-right: none;
      border-radius: 8px 0 0 8px;
      font: inherit;
    }

    .pending-ext {
      display: inline-flex;
      align-items: center;
      padding: 0 10px;
      border: 1px solid #cbd5e1;
      border-radius: 0 8px 8px 0;
      background: #f1f5f9;
      color: #64748b;
      font-size: 0.85rem;
    }

    .pending-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  `

  static properties = {
    activeTab: { state: true },
    documents: { state: true },
    currentUser: { state: true },
    cloudConfig: { state: true },
    currentFolder: { state: true },
    captureStatus: { state: true },
    newTitle: { state: true },
    newParticipant: { state: true },
    newGroup: { state: true },
    newFolder: { state: true },
    newContent: { state: true },
    selectedDocForReading: { state: true },
    pendingCaptures: { state: true },
    cloudPullStatus: { state: true },
    _cloudPulling: { state: true },
    _downloadingDocId: { state: true },
    _syncingDocIds: { state: true }
  }

  constructor() {
    super()
    this.activeTab = 'manager'
    this.documents = []
    this.currentUser = null
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.cloudController = new CaqdasPersonalCloudDocsController(this)
    this.currentFolder = `/${researchStorage.getHomeDirName()}`
    this.captureStatus = ''
    this._syncingDocIds = new Set()
    this.newTitle = ''
    this.newParticipant = ''
    this.newGroup = 'Geral'
    this.newFolder = researchStorage.formatPersistenceFolder('entrevistas')
    this.newContent = ''
    this.selectedDocForReading = null
    this.pendingCaptures = []
    this.cloudPullStatus = ''
    this._cloudPulling = false
    this._downloadingDocId = ''
    this._autoPulledFor = ''
  }

  _syncTabFromHash() {
    if (typeof window === 'undefined') return
    const hash = window.location.hash || ''
    const qIdx = hash.indexOf('?')
    if (qIdx < 0) return
    const params = new URLSearchParams(hash.slice(qIdx + 1))
    const aba = params.get('aba')
    if (aba === 'legislacao') {
      this.activeTab = 'legislation'
    }
  }

  firstUpdated() {
    this._bindControllers()
    this._refreshFileManager()
  }

  updated() {
    this._bindControllers()
  }

  _bindControllers() {
    const pickerEl = this.shadowRoot?.querySelector('fzl-document-picker')
    const managerEl = this.shadowRoot?.querySelector('fzl-file-manager')
    const cameraEl = this.shadowRoot?.querySelector('fzl-camera-capture')
    const chapterGroups = Array.from(this.shadowRoot?.querySelectorAll('fzl-reader-chapterview-group') || [])
    const chapterViews = Array.from(this.shadowRoot?.querySelectorAll('fzl-reader-chapterview') || [])

    this.cloudController.configurePersistenceComponents({
      fileManager: managerEl,
      documentPicker: pickerEl,
      cameraCapture: cameraEl,
      chapterViewGroup: chapterGroups[0] || null,
      chapterViews: [...chapterGroups, ...chapterViews]
    })
  }

  _refreshFileManager() {
    const managerEl = this.shadowRoot?.querySelector('fzl-file-manager')
    if (managerEl && typeof managerEl.refresh === 'function') {
      void managerEl.refresh()
    }
  }

  _setDocSyncing(docId, active) {
    const next = new Set(this._syncingDocIds)
    if (active) next.add(docId)
    else next.delete(docId)
    this._syncingDocIds = next
    this.requestUpdate()
    this.updateComplete.then(() => this._refreshFileManager())
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadDocs()
    this._syncTabFromHash()
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.currentFolder = `/${researchStorage.getHomeDirName()}`

    this._unsubAuth = authService.subscribe((user) => {
      this.currentUser = user
      this.requestUpdate()
      this.updateComplete.then(() => {
        this._bindControllers()
        if (user) void this.cloudController.probeSessionDriveScope()
        // Ao entrar em outro dispositivo, traz automaticamente os arquivos já salvos na nuvem
        // (sem abrir janela de login; se faltar permissão, o botão "Buscar na nuvem" resolve).
        const key = user?.email || user?.id || ''
        if (key && this._autoPulledFor !== key && this._isCloudActive()) {
          this._autoPulledFor = key
          void this._pullFromCloud({ interactive: false })
        }
      })
    })

    this._onDataChanged = () => this._loadDocs()
    this._onHashChange = () => this._syncTabFromHash()
    this._onCloudChanged = (e) => {
      const prevHome = this.currentFolder?.split('/').filter(Boolean)[0] || ''
      this.cloudConfig = e.detail || researchStorage.getCloudSyncConfig()
      const nextHome = researchStorage.getHomeDirName()
      if (!this.currentFolder || this.currentFolder === '/' || (prevHome && prevHome !== nextHome)) {
        const subSuffix = this.currentFolder?.startsWith(`/${prevHome}/`)
          ? this.currentFolder.slice(prevHome.length + 1)
          : ''
        this.currentFolder = `/${nextHome}${subSuffix}`
      }
      this.requestUpdate()
      this.updateComplete.then(() => {
        this._bindControllers()
        this._refreshFileManager()
      })
    }

    window.addEventListener('caqdas-data-changed', this._onDataChanged)
    window.addEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
    window.addEventListener('hashchange', this._onHashChange)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this.pendingCaptures.forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl))
    if (this._unsubAuth) this._unsubAuth()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
    window.removeEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
    window.removeEventListener('hashchange', this._onHashChange)
  }

  _loadDocs() {
    this.documents = researchStorage.getDocuments()
    if (this.selectedDocForReading) {
      this.selectedDocForReading = this.documents.find((d) => d.id === this.selectedDocForReading.id) || null
    }
    this.requestUpdate()
    this.updateComplete.then(() => this._refreshFileManager())
  }

  _isCloudActive() {
    const provider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    return (
      researchStorage.isCloudAuthenticated(this.currentUser) && (provider === 'google-drive' || provider === 'onedrive')
    )
  }

  /** Lista a pasta inicial na nuvem e registra no corpus os arquivos que ainda não estão aqui. */
  async _pullFromCloud({ interactive = true } = {}) {
    if (this._cloudPulling) return
    this._cloudPulling = true
    if (interactive) this.cloudPullStatus = '🔄 Buscando arquivos na nuvem...'
    try {
      const result = await this.cloudController.listCloudHomeFiles({ interactive })
      if (!result.success) {
        if (interactive || result.error !== 'sem-token') {
          this.cloudPullStatus = `⚠️ Não foi possível listar a pasta na nuvem: ${result.error}`
        }
        return
      }
      const added = researchStorage.importCloudFiles(result.files, result.provider)
      const label = getPersistenceProviderLabel(result.provider)
      this.cloudPullStatus =
        added > 0
          ? `☁️ ${added} arquivo(s) de ${label} adicionados ao corpus. Eles são baixados para este dispositivo quando você os abre.`
          : interactive
            ? `✔ Corpus em dia com ${label} (${result.files.length} arquivo(s) na pasta).`
            : ''
      this._loadDocs()
    } finally {
      this._cloudPulling = false
    }
  }

  /** Garante uma cópia local (IndexedDB) de um documento que só existe na nuvem. */
  async _ensureLocalCopy(doc) {
    if (!doc || researchStorage.hasLocalDocument(doc) || !doc.googleDriveFileId) return Boolean(doc)
    this._downloadingDocId = doc.id
    try {
      const file = await this.cloudController.downloadCloudFile(doc)
      if (!file) return false
      await researchStorage.saveBinaryFile(doc.id, file)
      if (!doc.size) researchStorage.updateDocument(doc.id, { size: file.size })
      this._loadDocs()
      return true
    } catch {
      return false
    } finally {
      this._downloadingDocId = ''
    }
  }

  async _openDocFromDevice(doc) {
    await this._ensureLocalCopy(doc)
    const res = await researchStorage.openLocalDocument(doc)
    if (!res.ok) {
      if (doc?.externalViewerUrl) {
        window.open(doc.externalViewerUrl, '_blank', 'noopener,noreferrer')
      } else {
        alert(
          'Este arquivo não está armazenado localmente neste dispositivo. Use o botão "Abrir no Google Drive" ou reimporte o arquivo.'
        )
      }
    }
  }

  _getManagedFiles() {
    return this.documents.map((doc) => {
      const ext = doc.extension || (doc.type === 'docx' ? '.docx' : doc.type === 'pdf' ? '.pdf' : '.txt')
      const cat =
        doc.type === 'pdf'
          ? 'pdf'
          : doc.type === 'csv' || doc.type === 'json'
            ? 'data'
            : doc.type === 'image'
              ? 'image'
              : 'text'
      const syncState = researchStorage.getDocumentSyncState(doc, this._syncingDocIds)
      const isSynced = syncState === 'synced'
      const statusLabel =
        syncState === 'syncing'
          ? '🔄 Sincronizando...'
          : isSynced
            ? '☁️ Sincronizado'
            : '💾 Documento Local'
      const folder = researchStorage.formatPersistenceFolder(
        doc.folder ||
          (doc.type === 'interview' ? 'entrevistas' : doc.type === 'legislation' ? 'legislacao' : 'documentos')
      )
      const binaryFile = researchStorage.getBinaryFile(doc.id)
      const objectUrl = researchStorage.getFileObjectUrl(doc.id)
      return {
        id: doc.id,
        name: doc.title || 'Documento sem título',
        folder,
        size: doc.size || binaryFile?.size || (doc.content ? doc.content.length : 1024),
        extension: ext,
        category: cat,
        status: researchStorage.getFileManagerStatus(doc, this._syncingDocIds),
        uploadedAt: doc.uploadedAt || Date.now(),
        uploadedBy: doc.participant || 'Pesquisador',
        readProgress: doc.quotations && doc.quotations.length > 0 ? 100 : 30,
        tags: doc.tags || [doc.participant || 'participante', doc.group || 'geral'],
        notes: `${statusLabel} | Participante: ${doc.participant || 'N/A'} | Excertos codificados: ${doc.quotations?.length || 0}`,
        textContent: doc.content || '',
        docxBlocks: doc.docxBlocks || undefined,
        ...(binaryFile ? { file: binaryFile } : {}),
        ...(objectUrl ? { objectUrl } : {}),
        externalViewerUrl: isSynced ? doc.externalViewerUrl : undefined,
        externalViewerLabel: isSynced
          ? doc.externalViewerLabel ||
            (doc.storageProvider === 'google-drive'
              ? 'Abrir no Google Drive ↗'
              : doc.storageProvider === 'onedrive'
                ? 'Abrir no OneDrive ↗'
                : 'Abrir na Nuvem ↗')
          : undefined
      }
    })
  }

  _handleDocumentSelect(e) {
    const docs = e.detail?.documents || []
    if (docs.length === 0) return

    const activeProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    let addedCount = 0
    for (const d of docs) {
      const existing = this.documents.find((existingDoc) => existingDoc.id === d.id || existingDoc.title === d.name)
      const remoteUrl = d.externalViewerUrl || d.googleDocsUrl || undefined
      const isUploadedRemote = d.uploadStatus === 'uploaded' && Boolean(remoteUrl)
      if (existing) {
        if (d.file) {
          void researchStorage.saveBinaryFile(existing.id, d.file)
          researchStorage.updateDocument(existing.id, {
            size: d.size || d.file.size,
            status: isUploadedRemote ? 'synced' : 'local',
            externalViewerUrl: isUploadedRemote ? remoteUrl : undefined,
            googleDriveFileId: undefined,
            syncedAt: isUploadedRemote ? Date.now() : undefined,
            // Reimportação de PDF/DOCX: o texto extraído substitui o anterior (os trechos são reancorados).
            ...(d.textContent || d.docxBlocks?.length
              ? {
                  content: d.textContent || d.docxBlocks.map((b) => b.text).join('\n\n'),
                  docxBlocks: d.docxBlocks || undefined,
                  ...(d.pageCount ? { pageCount: d.pageCount } : {}),
                  ...(existing.type === 'pdf' ? { pdfNeedsOcr: Boolean(d.pdfNeedsOcr) } : {})
                }
              : {})
          })
          addedCount++
        }
        continue
      }

      const participantName = d.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      const ext = d.extension || (d.name.endsWith('.docx') ? '.docx' : '.txt')
      const docType = ext === '.docx' ? 'docx' : ext === '.pdf' ? 'pdf' : 'interview'

      const savedDoc = researchStorage.addDocument({
        ...(d.id ? { id: d.id } : {}),
        title: d.name,
        participant: participantName,
        group: 'Corpus Importado',
        folder: researchStorage.formatPersistenceFolder('entrevistas'),
        type: docType,
        extension: ext,
        size: d.size || (d.textContent ? d.textContent.length : 2048),
        status: isUploadedRemote ? 'synced' : 'local',
        storageProvider: isUploadedRemote ? (d.storageProvider || activeProvider) : 'local',
        externalViewerUrl: isUploadedRemote ? remoteUrl : undefined,
        externalViewerLabel: isUploadedRemote
          ? d.externalViewerLabel ||
            (activeProvider === 'onedrive' ? 'Abrir no OneDrive ↗' : 'Abrir no Google Drive ↗')
          : undefined,
        syncedAt: isUploadedRemote ? Date.now() : undefined,
        tags: d.tags && d.tags.length > 0 ? d.tags : ['importado', docType],
        content: d.textContent || (d.docxBlocks ? d.docxBlocks.map((b) => b.text).join('\n\n') : ''),
        docxBlocks: d.docxBlocks || undefined,
        ...(docType === 'pdf'
          ? { pageCount: d.pageCount || undefined, pdfNeedsOcr: Boolean(d.pdfNeedsOcr), textExtractedAt: d.textContent ? new Date().toISOString() : undefined }
          : {}),
        quotations: []
      })
      if (d.file) {
        void researchStorage.saveBinaryFile(savedDoc.id, d.file)
      }
      addedCount++
    }

    if (addedCount > 0) {
      alert(`✔ ${addedCount} documento(s) importado(s) com sucesso para o Corpus em ${researchStorage.formatPersistenceFolder('entrevistas')}!`)
      this.activeTab = 'manager'
    }
  }

  async _saveMediaCaptureToCorpus({
    file,
    title,
    content,
    mediaType,
    subfolder = 'capturas-camera',
    source = 'fzl-camera-capture',
    tags = ['camera', mediaType]
  }) {
    const captureFolder = researchStorage.formatPersistenceFolder(subfolder)
    const isAuthenticated = researchStorage.isCloudAuthenticated(this.currentUser)
    const activeProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    const isCloudProvider = isAuthenticated && (activeProvider === 'google-drive' || activeProvider === 'onedrive')

    const savedDoc = researchStorage.addDocument({
      title,
      participant: this.currentUser?.name || 'Registro de Campo',
      group: 'Capturas de Campo',
      folder: captureFolder,
      type: mediaType,
      extension: file.name.includes('.') ? file.name.slice(file.name.lastIndexOf('.')) : '',
      size: file.size,
      status: 'local',
      storageProvider: 'local',
      tags,
      content,
      quotations: []
    })
    void researchStorage.saveBinaryFile(savedDoc.id, file)

    this.captureStatus = `💾 Captura "${title}" salva localmente em ${captureFolder}.`

    if (this.cloudConfig.autoSyncToCloud && isCloudProvider) {
      this._setDocSyncing(savedDoc.id, true)
      researchStorage.updateDocument(savedDoc.id, { status: 'syncing' })
      this.captureStatus = `🔄 Sincronizando "${title}" em ${getPersistenceProviderLabel(activeProvider)}...`

      try {
        const result = await this.cloudController.uploadToPersonalCloud(file, {
          convertToGoogleDocs: false,
          folderId:
            activeProvider === 'onedrive'
              ? this.cloudConfig.oneDriveFolderId
              : this.cloudConfig.googleDriveFolderId,
          context: { docId: savedDoc.id, folder: captureFolder, source }
        })

        if (result.success) {
          researchStorage.updateDocument(savedDoc.id, {
            status: 'synced',
            storageProvider: result.provider,
            externalViewerUrl: result.externalViewerUrl,
            externalViewerLabel: result.externalViewerLabel,
            googleDriveFileId: result.fileId,
            syncedAt: Date.now()
          })
          this.captureStatus = `☁️ "${title}" salva em ${captureFolder} e sincronizada em ${result.provider === 'onedrive' ? 'OneDrive' : 'Google Drive'}.`
        } else {
          researchStorage.updateDocument(savedDoc.id, { status: 'local' })
          this.captureStatus = `💾 "${title}" salva localmente em ${captureFolder}. Envio para nuvem não concluído (${result.error || 'pendente'}).`
        }
      } catch (err) {
        researchStorage.updateDocument(savedDoc.id, { status: 'local' })
        this.captureStatus = `💾 "${title}" salva localmente em ${captureFolder}. Envio pendente: ${err.message}`
      } finally {
        this._setDocSyncing(savedDoc.id, false)
      }
    }

    this._loadDocs()
    this.requestUpdate()
  }

  /**
   * Coloca uma captura (foto, vídeo ou áudio) numa fila para o pesquisador
   * nomear o arquivo antes de gravá-lo no IndexedDB.
   */
  _queuePendingCapture({ blob, mime, ext, suggestedName, saveArgs }) {
    const key = `pc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    this.pendingCaptures = [
      ...this.pendingCaptures,
      { key, blob, mime, ext, name: suggestedName, previewUrl: URL.createObjectURL(blob), saveArgs }
    ]
    this.captureStatus = '✏️ Dê um nome ao arquivo e clique em "Salvar" para gravá-lo no dispositivo.'
    void this.updateComplete.then(() => {
      const inputs = this.shadowRoot?.querySelectorAll('.pending-name-input')
      const last = inputs?.[inputs.length - 1]
      last?.focus()
      last?.select()
    })
  }

  _sanitizeFileName(raw) {
    return String(raw || '')
      .trim()
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, ' ')
      .slice(0, 120)
  }

  _updatePendingName(key, name) {
    this.pendingCaptures = this.pendingCaptures.map((p) => (p.key === key ? { ...p, name } : p))
  }

  _removePending(key) {
    const item = this.pendingCaptures.find((p) => p.key === key)
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl)
    this.pendingCaptures = this.pendingCaptures.filter((p) => p.key !== key)
  }

  _discardPendingCapture(key) {
    this._removePending(key)
    this.captureStatus = '🗑️ Captura descartada.'
  }

  async _confirmPendingCapture(key) {
    const item = this.pendingCaptures.find((p) => p.key === key)
    if (!item) return
    let base = this._sanitizeFileName(item.name)
    if (!base) {
      this.captureStatus = '⚠️ Informe um nome para o arquivo antes de salvar.'
      return
    }
    if (base.toLowerCase().endsWith(item.ext.toLowerCase())) base = base.slice(0, -item.ext.length)
    let title = `${base}${item.ext}`
    if (this.documents.some((d) => d.title === title)) {
      title = `${base}-${new Date().toISOString().replace(/[:.]/g, '-')}${item.ext}`
    }
    const file = new File([item.blob], title, { type: item.mime })
    this._removePending(key)
    await this._saveMediaCaptureToCorpus({ ...item.saveArgs, file, title })
  }

  _renderPendingCaptures(mediaTypes) {
    const items = this.pendingCaptures.filter((p) => mediaTypes.includes(p.saveArgs.mediaType))
    if (items.length === 0) return ''
    return html`
      <div class="pending-list">
        <div class="pending-heading">
          <md-icon>drive_file_rename_outline</md-icon>
          Nomeie ${items.length > 1 ? `os ${items.length} arquivos` : 'o arquivo'} antes de salvar no dispositivo
        </div>
        ${items.map(
          (p) => html`
            <div class="pending-item">
              <div class="pending-preview">
                ${p.saveArgs.mediaType === 'image'
                  ? html`<img src=${p.previewUrl} alt="Pré-visualização da captura" />`
                  : p.saveArgs.mediaType === 'video'
                    ? html`<video src=${p.previewUrl} controls></video>`
                    : html`<audio src=${p.previewUrl} controls></audio>`}
              </div>
              <div class="pending-form">
                <label class="pending-label">
                  Nome do arquivo
                  <span class="pending-name-wrap">
                    <input
                      class="pending-name-input"
                      type="text"
                      .value=${p.name}
                      @input=${(e) => this._updatePendingName(p.key, e.target.value)}
                      @keydown=${(e) => {
                        if (e.key === 'Enter') void this._confirmPendingCapture(p.key)
                      }}
                    />
                    <span class="pending-ext">${p.ext}</span>
                  </span>
                </label>
                <div class="pending-actions">
                  <md-filled-button @click=${() => void this._confirmPendingCapture(p.key)}>
                    <md-icon slot="icon">save</md-icon>Salvar
                  </md-filled-button>
                  <md-outlined-button @click=${() => this._discardPendingCapture(p.key)}>
                    <md-icon slot="icon">delete</md-icon>Descartar
                  </md-outlined-button>
                </div>
              </div>
            </div>
          `
        )}
      </div>
    `
  }

  async _handleCapturePhoto(e) {
    const photo = e.detail?.photo
    if (!photo?.blob) return
    const stamp = new Date(photo.timestamp || Date.now()).toISOString().replace(/[:.]/g, '-')
    const mime = photo.blob.type || 'image/jpeg'
    const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg'
    const homeDir = researchStorage.getHomeDirName()
    const effectiveProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)

    this._queuePendingCapture({
      blob: photo.blob,
      mime,
      ext,
      suggestedName: `foto-campo-${stamp}`,
      saveArgs: {
        mediaType: 'image',
        content: `Registro fotográfico de campo capturado via fzl-camera-capture (${photo.width || '?'}x${photo.height || '?'}, câmera: ${photo.facingMode || 'environment'}).\nPasta de persistência: /${homeDir}/capturas-camera\nPersistência efetiva no momento: ${getPersistenceProviderLabel(effectiveProvider)}`
      }
    })
  }

  async _handleCaptureVideo(e) {
    const video = e.detail?.video
    if (!video?.blob) return
    const stamp = new Date(video.timestamp || Date.now()).toISOString().replace(/[:.]/g, '-')
    const mime = video.mimeType || video.blob.type || 'video/webm'
    const ext = mime.includes('mp4') ? '.mp4' : '.webm'
    const homeDir = researchStorage.getHomeDirName()
    const effectiveProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)

    this._queuePendingCapture({
      blob: video.blob,
      mime,
      ext,
      suggestedName: `video-campo-${stamp}`,
      saveArgs: {
        mediaType: 'video',
        content: `Registro em vídeo de campo capturado via fzl-camera-capture (duração: ${video.durationSeconds || 0}s, formato: ${mime}).\nPasta de persistência: /${homeDir}/capturas-camera\nPersistência efetiva no momento: ${getPersistenceProviderLabel(effectiveProvider)}`
      }
    })
  }

  async _handleCaptureAudio(e) {
    const audio = e.detail?.audio
    if (!audio?.blob) return
    const stamp = new Date(audio.timestamp || Date.now()).toISOString().replace(/[:.]/g, '-')
    const mime = audio.mimeType || audio.blob.type || 'audio/webm'
    const importedName = audio.fileName || ''
    const importedExt = importedName.includes('.') ? importedName.slice(importedName.lastIndexOf('.')) : ''
    const ext =
      importedExt || (mime.includes('mp4') ? '.m4a' : mime.includes('ogg') ? '.ogg' : mime.includes('mpeg') ? '.mp3' : '.webm')
    const kind = audio.mode === 'meeting' ? 'reuniao' : audio.mode === 'import' ? 'importado' : 'entrevista'
    const origin =
      audio.mode === 'meeting'
        ? 'reunião online: aba compartilhada + microfone'
        : audio.mode === 'import'
          ? `arquivo selecionado do dispositivo: ${importedName}`
          : 'entrevista: microfone'
    const homeDir = researchStorage.getHomeDirName()
    const effectiveProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)

    this._queuePendingCapture({
      blob: audio.blob,
      mime,
      ext,
      suggestedName: importedName ? importedName.slice(0, importedName.length - importedExt.length) : `audio-${kind}-${stamp}`,
      saveArgs: {
        mediaType: 'audio',
        subfolder: 'capturas-audio',
        source: 'caqdas-audio-recorder',
        tags: ['audio', kind, 'transcricao-pendente'],
        content: `Gravação de áudio (${origin}).\nDuração: ${audio.durationSeconds || 0}s, formato: ${mime}.\nTranscrição: pendente.\nPasta de persistência: /${homeDir}/capturas-audio\nPersistência efetiva no momento: ${getPersistenceProviderLabel(effectiveProvider)}`
      }
    })
  }

  async _handleFileRename(e) {
    const { file, previousName, newName } = e.detail || {}
    const doc = file && this.documents.find((d) => d.id === file.id)
    if (!doc || !newName) return

    researchStorage.updateDocument(doc.id, { title: newName })
    const binary = researchStorage.getBinaryFile(doc.id)
    if (binary) {
      await researchStorage.saveBinaryFile(doc.id, new File([binary], newName, { type: binary.type }))
    }
    if (this.selectedDocForReading?.id === doc.id) {
      this.selectedDocForReading = { ...this.selectedDocForReading, title: newName }
    }

    const remoteId = doc.googleDriveFileId
    const isRemote = remoteId && (doc.storageProvider === 'google-drive' || doc.storageProvider === 'onedrive')
    if (isRemote) {
      const result = await this.cloudController.renameCloudFile(doc.storageProvider, remoteId, newName)
      if (!result.success) {
        alert(
          `"${previousName}" foi renomeado para "${newName}" neste dispositivo, mas não na nuvem (${result.error}). ` +
            'Renomeie manualmente no ' + (doc.storageProvider === 'onedrive' ? 'OneDrive' : 'Google Drive') + ' se necessário.'
        )
      }
    }
    this._loadDocs()
  }

  _handleUploadSuccess(e) {
    const detail = e.detail || {}
    const doc = detail.document
    const uploadResult = detail.uploadResult || detail.response || {}

    if (doc) {
      const targetDoc = this.documents.find((d) => d.id === doc.id || d.title === doc.name)
      const externalViewerUrl = uploadResult.externalViewerUrl || doc.externalViewerUrl || doc.googleDocsUrl
      const externalViewerLabel = uploadResult.externalViewerLabel || doc.externalViewerLabel || 'Abrir no Google Drive ↗'

      if (targetDoc) {
        if (doc.file) {
          void researchStorage.saveBinaryFile(targetDoc.id, doc.file)
        }
        researchStorage.updateDocument(targetDoc.id, {
          status: 'synced',
          storageProvider: uploadResult.provider || researchStorage.getEffectivePersistenceProvider(this.currentUser),
          externalViewerUrl,
          externalViewerLabel,
          googleDriveFileId: uploadResult.fileId || doc.googleDriveFileId,
          syncedAt: Date.now()
        })
        this._loadDocs()
      }
    }
  }

  _handleFileUploaded(e) {
    const detail = e.detail || {}
    const file = detail.file
    const result = detail.result || detail
    const viewerUrl = result.externalViewerUrl || detail.externalViewerUrl
    if (file && viewerUrl) {
      researchStorage.updateDocument(file.id, {
        externalViewerUrl: viewerUrl,
        externalViewerLabel: result.externalViewerLabel || detail.externalViewerLabel || 'Abrir na Nuvem ↗',
        storageProvider: result.provider || researchStorage.getEffectivePersistenceProvider(this.currentUser),
        googleDriveFileId: result.fileId || file.externalFileId,
        status: 'synced',
        syncedAt: Date.now()
      })
      this._loadDocs()
    }
  }

  _handleFileUploadError(e) {
    const msg = e.detail?.error || 'Não foi possível concluir o envio para a nuvem.'
    alert(msg)
    this._refreshFileManager()
  }

  _handleFileRead(e) {
    const file = e.detail?.file
    if (!file) return
    const doc = this.documents.find((d) => d.id === file.id)
    if (doc) {
      this.selectedDocForReading = doc
      if (!researchStorage.hasLocalDocument(doc) && doc.googleDriveFileId) {
        void this._ensureLocalCopy(doc)
      }
      // "Continuar Leitura" abre o leitor de trechos em tela cheia (no mesmo gesto do clique).
      openForReading(doc.id)
    }
  }

  async _handleFileDelete(e) {
    const file = e.detail?.file
    if (!file) return
    // Apaga em todas as fontes: nuvem (lixeira do Drive/OneDrive) e navegador.
    const result = await researchStorage.deleteDocument(file.id)
    if (result.cancelled) return
    this.documents = researchStorage.getDocuments()
    if (result.pending) {
      alert(
        `"${file.name}" saiu do corpus, mas não foi possível removê-lo da nuvem agora` +
          `${result.error ? ` (${result.error})` : ''}. A remoção será tentada de novo automaticamente.`
      )
    }
  }

  _handleSaveManualDoc() {
    if (!this.newTitle.trim() || !this.newContent.trim()) {
      alert('Por favor, informe ao menos o título e o conteúdo.')
      return
    }

    researchStorage.addDocument({
      title: this.newTitle.trim(),
      participant: this.newParticipant.trim() || 'Participante',
      group: this.newGroup.trim() || 'Geral',
      folder: researchStorage.formatPersistenceFolder(this.newFolder.trim() || 'entrevistas'),
      type: 'interview',
      extension: '.txt',
      size: this.newContent.length,
      status: 'local',
      storageProvider: 'local',
      tags: ['manual', 'entrevista'],
      content: this.newContent.trim(),
      quotations: []
    })

    this.newTitle = ''
    this.newParticipant = ''
    this.newFolder = researchStorage.formatPersistenceFolder('entrevistas')
    this.newContent = ''
    this.activeTab = 'manager'
    alert('Documento cadastrado localmente com sucesso!')
  }

  render() {
    const homeDirName = researchStorage.getHomeDirName()
    const isAuthenticated = researchStorage.isCloudAuthenticated(this.currentUser)
    const rawProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    const effectiveProvider = rawProvider === 'local' ? 'rest' : rawProvider
    const allowCloudUpload = isAuthenticated && (rawProvider === 'google-drive' || rawProvider === 'onedrive')
    const activeFolder = this.currentFolder || `/${homeDirName}`

    return html`
      <div class="header-box">
        <div class="header-row">
          <div>
            <h1>Corpus de Pesquisa &amp; Gerenciador de Documentos</h1>
            <p style="margin: 6px 0 0 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
              ${isAuthenticated
                ? html`Colete entrevistas, documentos Word (.docx), PDFs e capturas de campo em
                    <code>/${homeDirName}</code> (<strong>${getPersistenceProviderLabel(rawProvider)}</strong>).`
                : html`Colete e organize entrevistas, documentos Word (.docx), PDFs e capturas de campo localmente em
                    <code>/${homeDirName}</code>.`}
            </p>
          </div>

          <div style="display: flex; flex-wrap: wrap; align-items: center; gap: 10px;">
            <md-filled-button
              @click=${() => {
                this.activeTab = 'legislation'
              }}
            >
              <md-icon slot="icon">gavel</md-icon>
              Adicionar legislação ao corpus
            </md-filled-button>

            <div class="corpus-rules-badge">
              <md-icon>verified</md-icon>
              <span>Bardin: Corpus Exaustivo &amp; Pertinente</span>
            </div>
          </div>
        </div>

        <div style="font-size: 0.9rem; color: #555;">
          Total no Corpus: <strong>${this.documents.length}</strong> documentos cadastrados | Pasta inicial de persistência:
          <code>/${homeDirName}</code>
        </div>
      </div>

      <div class="tabs-bar">
        <button
          class="tab-btn ${this.activeTab === 'manager' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'manager'
          }}
        >
          <md-icon>folder</md-icon>
          Gerenciador de Arquivos (fzl-file-manager)
        </button>

        <button
          class="tab-btn ${this.activeTab === 'legislation' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'legislation'
          }}
        >
          <md-icon>gavel</md-icon>
          Legislação (Planalto / Busca)
        </button>

        <button
          class="tab-btn ${this.activeTab === 'upload' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'upload'
          }}
        >
          <md-icon>upload_file</md-icon>
          Upload &amp; Importação (fzl-document-picker)
        </button>

        <button
          class="tab-btn ${this.activeTab === 'camera' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'camera'
          }}
        >
          <md-icon>photo_camera</md-icon>
          Captura de dados por imagem
        </button>

        <button
          class="tab-btn ${this.activeTab === 'audio' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'audio'
          }}
        >
          <md-icon>mic</md-icon>
          Captura de dados por áudio
        </button>

        <button
          class="tab-btn ${this.activeTab === 'manual' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'manual'
          }}
        >
          <md-icon>edit_note</md-icon>
          Digitação Manual de Transcrição
        </button>
      </div>

      ${this.activeTab === 'manager'
        ? html`
            <div class="card">
              <div class="info-alert">
                📂 <strong>Explorador de Arquivos &amp; Leitor Integrado:</strong>
                ${isAuthenticated
                  ? html`Operando em <code>${activeFolder}</code> com persistência configurada para
                      <strong>${getPersistenceProviderLabel(rawProvider)}</strong>.`
                  : html`Operando em modo <strong>Local (Navegador)</strong> na pasta <code>${activeFolder}</code>. Os documentos mostrados aqui são apenas locais enquanto você não estiver conectado.`}
                Alterne entre visualização em <strong>Tabela</strong> e <strong>Grade</strong>, navegue pelas pastas sob
                <code>/${homeDirName}</code> e clique em <strong>Continuar Leitura</strong>.
              </div>

              ${allowCloudUpload
                ? html`
                    <div class="cloud-pull-bar">
                      <md-outlined-button ?disabled=${this._cloudPulling} @click=${() => void this._pullFromCloud()}>
                        <md-icon slot="icon">cloud_download</md-icon>
                        ${this._cloudPulling ? 'Buscando...' : `Buscar arquivos em ${getPersistenceProviderLabel(rawProvider)}`}
                      </md-outlined-button>
                      <span>${this.cloudPullStatus ||
                        'Traz para este dispositivo a lista de arquivos já salvos na sua nuvem (por exemplo, enviados de outro computador).'}</span>
                    </div>
                  `
                : ''}

              <fzl-file-manager
                view-mode="table"
                current-folder=${activeFolder}
                .includeLocalBookmarks=${false}
                storage-provider=${effectiveProvider}
                google-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.googleDriveFolderId || '') : ''}
                one-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.oneDriveFolderId || '') : ''}
                .googleDriveConvertToDocs=${false}
                google-auth-token=${allowCloudUpload ? (this.cloudConfig.googleAuthToken || '') : ''}
                one-drive-auth-token=${allowCloudUpload ? (this.cloudConfig.oneDriveAuthToken || '') : ''}
                .fetchHandler=${() => Promise.resolve(this._getManagedFiles())}
                @fzl-folder-change=${(e) => {
                  if (e.detail?.folder) {
                    this.currentFolder = e.detail.folder
                  }
                }}
                @fzl-file-read=${this._handleFileRead}
                @fzl-file-delete=${this._handleFileDelete}
                @fzl-file-rename=${this._handleFileRename}
                @fzl-file-upload-success=${this._handleFileUploaded}
                @fzl-file-uploaded=${this._handleFileUploaded}
                @fzl-file-upload-error=${this._handleFileUploadError}
                @fzl-file-open-study=${(e) => {
                  if (e.detail?.file?.id) openForReading(e.detail.file.id)
                  else window.location.hash = '#/codificacao'
                }}
              ></fzl-file-manager>

              ${this.selectedDocForReading
                ? html`
                    <div class="selected-doc-bar">
                      <div>
                        <strong>${this.selectedDocForReading.title}</strong>
                        <span style="color: #64748b; margin-left: 8px;">
                          ${this._downloadingDocId === this.selectedDocForReading.id
                            ? '⬇️ Baixando da nuvem para este dispositivo...'
                            : researchStorage.hasLocalDocument(this.selectedDocForReading)
                            ? '📱 Disponível neste dispositivo'
                            : this.selectedDocForReading.externalViewerUrl
                              ? '☁️ Somente na nuvem'
                              : 'Arquivo sem cópia local neste dispositivo'}
                        </span>
                      </div>
                      <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        ${researchStorage.hasLocalDocument(this.selectedDocForReading)
                          ? html`
                              <button
                                type="button"
                                class="btn-local-file"
                                @click=${() => void this._openDocFromDevice(this.selectedDocForReading)}
                              >
                                <md-icon style="font-size: 16px;">folder_open</md-icon>
                                Abrir do Dispositivo
                              </button>
                            `
                          : ''}
                        ${this.selectedDocForReading.legislation?.planaltoUrl ||
                        this.selectedDocForReading.legislation?.normasUrl
                          ? html`
                              <a
                                class="btn-external-link"
                                href=${this.selectedDocForReading.legislation.planaltoUrl ||
                                this.selectedDocForReading.legislation.normasUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <md-icon style="font-size: 16px;">gavel</md-icon>
                                ${this.selectedDocForReading.legislation.planaltoUrl
                                  ? 'Ver texto oficial no Planalto ↗'
                                  : 'Ver texto oficial ↗'}
                              </a>
                            `
                          : ''}
                        ${this.selectedDocForReading.externalViewerUrl
                          ? html`
                              <a
                                class="btn-external-link"
                                href=${this.selectedDocForReading.externalViewerUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <md-icon style="font-size: 16px;">open_in_new</md-icon>
                                ${this.selectedDocForReading.externalViewerLabel || 'Abrir no Google Drive ↗'}
                              </a>
                            `
                          : ''}
                      </div>
                    </div>
                  `
                : ''}

              <div class="action-panel">
                <span style="font-size: 0.9rem; color: #555;">
                  Pronto para selecionar evidências e codificar os trechos dos documentos?
                </span>
                <md-filled-button href="#/codificacao">
                  <md-icon slot="icon">edit_note</md-icon>
                  Ir para Área de Codificação (Bardin)
                </md-filled-button>
              </div>
            </div>
          `
        : ''}

      ${this.activeTab === 'legislation'
        ? html`
            <caqdas-legislation-panel
              .documents=${this.documents}
              @caqdas-legislation-added=${() => this._loadDocs()}
            ></caqdas-legislation-panel>
          `
        : ''}

      ${this.activeTab === 'upload'
        ? html`
            <div class="card">
              <div class="info-alert">
                📥 <strong>Upload &amp; Importação de Documentos:</strong>
                ${isAuthenticated && rawProvider !== 'local'
                  ? html`Destino ativo: <strong>${getPersistenceProviderLabel(rawProvider)}</strong> na pasta inicial
                      <code>/${homeDirName}</code>.`
                  : html`Modo <strong>Local</strong> ativo na pasta <code>/${homeDirName}</code> — os documentos importados ficam salvos apenas localmente neste navegador (sem envio para a nuvem).`}
                Arraste e solte arquivos em Word (<code>.docx</code>), PDF, Markdown, TXT ou CSV/JSON.
              </div>

              <fzl-document-picker
                .pdfTextExtractor=${pdfTextExtractor}
                mode="all"
                accept=".docx,.txt,.md,.pdf,.csv,.json"
                allow-folder-scan
                start-in="documents"
                storage-provider=${effectiveProvider}
                google-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.googleDriveFolderId || '') : ''}
                one-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.oneDriveFolderId || '') : ''}
                .googleDriveConvertToDocs=${false}
                google-auth-token=${allowCloudUpload ? (this.cloudConfig.googleAuthToken || '') : ''}
                one-drive-auth-token=${allowCloudUpload ? (this.cloudConfig.oneDriveAuthToken || '') : ''}
                @fzl-document-select=${this._handleDocumentSelect}
                @fzl-document-upload-success=${this._handleUploadSuccess}
                @fzl-document-upload-error=${this._handleFileUploadError}
                @fzl-document-open-study=${(e) => {
                  this._handleDocumentSelect(e)
                  window.location.hash = '#/codificacao'
                }}
              ></fzl-document-picker>
            </div>
          `
        : ''}

      ${this.activeTab === 'camera'
        ? html`
            <div class="card">
              <div class="info-alert">
                📷 <strong>Captura de Campo Integrada (<code>&lt;fzl-camera-capture&gt;</code>):</strong>
                ${allowCloudUpload && this.cloudConfig.autoSyncToCloud
                  ? html`Fotos de documentos e vídeos de observação são registrados em <code>/${homeDirName}/capturas-camera</code>
                      e sincronizados automaticamente com <strong>${getPersistenceProviderLabel(rawProvider)}</strong>.`
                  : html`Fotos de documentos e vídeos de observação são registrados <strong>apenas localmente</strong> em
                      <code>/${homeDirName}/capturas-camera</code>. <a href="#/config/persistencia" style="color: #0284c7; font-weight: 600;">Configurar sincronização em nuvem</a>.`}
              </div>

              <fzl-camera-capture
                mode="both"
                overlay="document"
                @fzl-capture-photo=${this._handleCapturePhoto}
                @fzl-capture-video=${this._handleCaptureVideo}
              ></fzl-camera-capture>

              ${this._renderPendingCaptures(['image', 'video'])}

              ${this.captureStatus
                ? html`<div class="capture-status">${this.captureStatus}</div>`
                : ''}
            </div>
          `
        : ''}

      ${this.activeTab === 'audio'
        ? html`
            <div class="card">
              <div class="info-alert">
                🎙️ <strong>Captura de dados por áudio:</strong>
                ${allowCloudUpload && this.cloudConfig.autoSyncToCloud
                  ? html`Entrevistas e reuniões são gravadas primeiro no dispositivo (IndexedDB) em
                      <code>/${homeDirName}/capturas-audio</code> e depois sincronizadas com
                      <strong>${getPersistenceProviderLabel(rawProvider)}</strong> para posterior transcrição.`
                  : html`Entrevistas e reuniões são gravadas <strong>apenas localmente</strong> (IndexedDB) em
                      <code>/${homeDirName}/capturas-audio</code>.
                      <a href="#/config/persistencia" style="color: #0284c7; font-weight: 600;">Configurar sincronização em nuvem</a>.`}
              </div>

              <caqdas-audio-recorder @fzl-capture-audio=${this._handleCaptureAudio}></caqdas-audio-recorder>

              ${this._renderPendingCaptures(['audio'])}

              ${this.captureStatus
                ? html`<div class="capture-status">${this.captureStatus}</div>`
                : ''}
            </div>
          `
        : ''}

      ${this.activeTab === 'manual'
        ? html`
            <div class="form-box">
              <h3 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">
                Digitar ou Colar Nova Transcrição Manualmente
              </h3>
              <div class="form-group">
                <md-outlined-text-field
                  label="Título do Documento / Entrevista"
                  style="width: 100%;"
                  .value=${this.newTitle}
                  @input=${(e) => {
                    this.newTitle = e.target.value
                  }}
                ></md-outlined-text-field>
              </div>
              <div style="display: flex; gap: 12px; flex-wrap: wrap;" class="form-group">
                <md-outlined-text-field
                  label="Participante / Informante (ex.: Estudante 4, Aluno A)"
                  style="flex: 1; min-width: 240px;"
                  .value=${this.newParticipant}
                  @input=${(e) => {
                    this.newParticipant = e.target.value
                  }}
                ></md-outlined-text-field>
                <md-outlined-text-field
                  label="Pasta no Corpus (ex.: /entrevistas, /atas)"
                  style="width: 220px;"
                  .value=${this.newFolder}
                  @input=${(e) => {
                    this.newFolder = e.target.value
                  }}
                ></md-outlined-text-field>
              </div>
              <div class="form-group">
                <md-outlined-text-field
                  type="textarea"
                  rows="6"
                  label="Texto Transcrito Completo"
                  style="width: 100%;"
                  .value=${this.newContent}
                  @input=${(e) => {
                    this.newContent = e.target.value
                  }}
                ></md-outlined-text-field>
              </div>

              <div style="display: flex; gap: 8px; justify-content: flex-end;">
                <md-outlined-button
                  @click=${() => {
                    this.activeTab = 'manager'
                  }}
                >
                  Cancelar
                </md-outlined-button>
                <md-filled-button @click=${this._handleSaveManualDoc}>Salvar no Corpus</md-filled-button>
              </div>
            </div>
          `
        : ''}
    `
  }
}

customElements.define('caqdas-sources-view', CaqdasSourcesView)
