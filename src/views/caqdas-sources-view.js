import { LitElement, html, css } from 'lit'
import { researchStorage, DEFAULT_HOME_DIR } from '../services/storage-service.js'
import { authService } from 'fzl-fund-appshell--lit'
import { CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'
import '@material/web/checkbox/checkbox.js'
import '@fzl/webcomponents-lit/file-manager'
import '@fzl/webcomponents-lit/document-picker'
import '@fzl/webcomponents-lit/social-login'
import '@fzl/webcomponents-lit/camera-capture'
import '@fzl/webcomponents-lit/reader-chapterview'

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

    .cloud-status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #eef7f6;
      border: 1px solid #c2e2e0;
      border-radius: 12px;
      padding: 12px 18px;
      margin-bottom: 20px;
      font-size: 0.9rem;
    }

    .cloud-status-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .user-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: #ffffff;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid #b2dfdb;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .user-avatar-tiny {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
    }

    .persistence-selectors {
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #d8e5e4;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 18px;
    }

    .selector-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
    }

    .selector-label {
      font-size: 0.82rem;
      font-weight: 600;
      color: #004d40;
      min-width: 145px;
    }

    .select-control {
      width: 100%;
      padding: 12px 14px;
      border-radius: 6px;
      border: 1px solid #79747e;
      background: #ffffff;
      font-size: 0.95rem;
      font-family: inherit;
      color: inherit;
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

    .cloud-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
      margin-top: 16px;
    }

    .cloud-card {
      background: #ffffff;
      border: 1px solid #d0e0df;
      border-radius: 12px;
      padding: 18px;
    }

    .cloud-card h3 {
      margin: 0 0 10px 0;
      color: #006a6a;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.1rem;
    }

    .switch-label {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 12px 0;
      cursor: pointer;
      font-size: 0.92rem;
      user-select: none;
    }

    .doc-link-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 12px;
      font-size: 0.88rem;
    }

    .doc-link-table th,
    .doc-link-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 12px;
      text-align: left;
    }

    .doc-link-table th {
      background: #f1f5f9;
      font-weight: 600;
    }

    .btn-external-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #e0f2fe;
      color: #0284c7;
      padding: 4px 10px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.8rem;
      border: 1px solid #bae6fd;
    }

    .btn-external-link:hover {
      background: #bae6fd;
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
    _syncingDocId: { state: true },
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
    this._syncingDocId = null
    this._syncingDocIds = new Set()
    this.newTitle = ''
    this.newParticipant = ''
    this.newGroup = 'Geral'
    this.newFolder = researchStorage.formatPersistenceFolder('entrevistas')
    this.newContent = ''
    this.selectedDocForReading = null
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
    this._syncingDocId = active ? docId : null
    this.requestUpdate()
    this.updateComplete.then(() => this._refreshFileManager())
  }

  async _syncDocViaController(doc) {
    if (!researchStorage.isCloudAuthenticated(this.currentUser)) {
      alert('Faça login com Google ou Microsoft para sincronizar documentos na nuvem.')
      return
    }
    if (this._syncingDocIds.has(doc.id)) return
    this._setDocSyncing(doc.id, true)

    try {
      const activeProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
      const result = await this.cloudController.syncCorpusDocument(doc, {
        convertToGoogleDocs: this.cloudConfig.googleDriveConvertToDocs,
        folderId:
          activeProvider === 'onedrive'
            ? this.cloudConfig.oneDriveFolderId
            : this.cloudConfig.googleDriveFolderId
      })

      if (result.success) {
        this._loadDocs()
        const targetLabel = activeProvider === 'onedrive' ? 'OneDrive' : 'Google Docs'
        alert(`✔ Documento "${doc.title}" sincronizado com sucesso no ${targetLabel}!`)
      } else {
        alert(`Não foi possível sincronizar na nuvem: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      alert(`Erro ao sincronizar: ${err.message}`)
    } finally {
      this._setDocSyncing(doc.id, false)
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadDocs()
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.currentFolder = `/${researchStorage.getHomeDirName()}`

    this._unsubAuth = authService.subscribe((user) => {
      this.currentUser = user
      this.requestUpdate()
      this.updateComplete.then(() => this._bindControllers())
    })

    this._onDataChanged = () => this._loadDocs()
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
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    if (this._unsubAuth) this._unsubAuth()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
    window.removeEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
  }

  _loadDocs() {
    this.documents = researchStorage.getDocuments()
    this.requestUpdate()
    this.updateComplete.then(() => this._refreshFileManager())
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
        doc.folder || (doc.type === 'interview' ? 'entrevistas' : 'documentos')
      )
      return {
        id: doc.id,
        name: doc.title || 'Documento sem título',
        folder,
        size: doc.size || (doc.content ? doc.content.length : 1024),
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
        externalViewerUrl: isSynced ? doc.externalViewerUrl : undefined,
        externalViewerLabel: isSynced
          ? doc.externalViewerLabel ||
            (doc.storageProvider === 'google-drive'
              ? 'Abrir no Google Docs ↗'
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
      const existing = this.documents.find((existingDoc) => existingDoc.title === d.name)
      if (existing) continue

      const participantName = d.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      const ext = d.extension || (d.name.endsWith('.docx') ? '.docx' : '.txt')
      const docType = ext === '.docx' ? 'docx' : ext === '.pdf' ? 'pdf' : 'interview'
      const remoteUrl = d.externalViewerUrl || d.googleDocsUrl || undefined
      const isUploadedRemote = d.uploadStatus === 'uploaded' && Boolean(remoteUrl)

      researchStorage.addDocument({
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
            (activeProvider === 'onedrive'
              ? 'Abrir no OneDrive ↗'
              : ext === '.docx'
                ? 'Abrir no Google Docs ↗'
                : 'Abrir no Google Drive ↗')
          : undefined,
        syncedAt: isUploadedRemote ? Date.now() : undefined,
        tags: d.tags && d.tags.length > 0 ? d.tags : ['importado', docType],
        content: d.textContent || (d.docxBlocks ? d.docxBlocks.map((b) => b.text).join('\n\n') : ''),
        docxBlocks: d.docxBlocks || undefined,
        quotations: []
      })
      addedCount++
    }

    if (addedCount > 0) {
      alert(`✔ ${addedCount} documento(s) importado(s) com sucesso para o Corpus em ${researchStorage.formatPersistenceFolder('entrevistas')}!`)
      this.activeTab = 'manager'
    }
  }

  async _saveMediaCaptureToCorpus({ file, title, content, mediaType }) {
    const captureFolder = researchStorage.formatPersistenceFolder('capturas-camera')
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
      tags: ['camera', mediaType],
      content,
      quotations: []
    })

    this.captureStatus = `💾 Captura "${title}" salva localmente em ${captureFolder}.`

    if (this.cloudConfig.autoSyncToCloud && isCloudProvider) {
      this._setDocSyncing(savedDoc.id, true)
      researchStorage.updateDocument(savedDoc.id, { status: 'syncing' })
      this.captureStatus = `🔄 Sincronizando "${title}" em ${this._getProviderLabel(activeProvider)}...`

      try {
        const result = await this.cloudController.uploadToPersonalCloud(file, {
          convertToGoogleDocs: false,
          folderId:
            activeProvider === 'onedrive'
              ? this.cloudConfig.oneDriveFolderId
              : this.cloudConfig.googleDriveFolderId,
          context: { docId: savedDoc.id, folder: captureFolder, source: 'fzl-camera-capture' }
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

  async _handleCapturePhoto(e) {
    const photo = e.detail?.photo
    if (!photo?.blob) return
    const stamp = new Date(photo.timestamp || Date.now()).toISOString().replace(/[:.]/g, '-')
    const mime = photo.blob.type || 'image/jpeg'
    const ext = mime.includes('png') ? '.png' : mime.includes('webp') ? '.webp' : '.jpg'
    const title = `foto-campo-${stamp}${ext}`
    const file = new File([photo.blob], title, { type: mime })
    const homeDir = researchStorage.getHomeDirName()
    const effectiveProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)

    await this._saveMediaCaptureToCorpus({
      file,
      title,
      mediaType: 'image',
      content: `Registro fotográfico de campo capturado via fzl-camera-capture (${photo.width || '?'}x${photo.height || '?'}, câmera: ${photo.facingMode || 'environment'}).\nPasta de persistência: /${homeDir}/capturas-camera\nPersistência efetiva no momento: ${this._getProviderLabel(effectiveProvider)}`
    })
  }

  async _handleCaptureVideo(e) {
    const video = e.detail?.video
    if (!video?.blob) return
    const stamp = new Date(video.timestamp || Date.now()).toISOString().replace(/[:.]/g, '-')
    const mime = video.mimeType || video.blob.type || 'video/webm'
    const ext = mime.includes('mp4') ? '.mp4' : '.webm'
    const title = `video-campo-${stamp}${ext}`
    const file = new File([video.blob], title, { type: mime })
    const homeDir = researchStorage.getHomeDirName()
    const effectiveProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)

    await this._saveMediaCaptureToCorpus({
      file,
      title,
      mediaType: 'video',
      content: `Registro em vídeo de campo capturado via fzl-camera-capture (duração: ${video.durationSeconds || 0}s, formato: ${mime}).\nPasta de persistência: /${homeDir}/capturas-camera\nPersistência efetiva no momento: ${this._getProviderLabel(effectiveProvider)}`
    })
  }

  _handleUploadSuccess(e) {
    const detail = e.detail || {}
    const doc = detail.document
    const uploadResult = detail.uploadResult || {}

    if (doc) {
      const externalViewerUrl = uploadResult.externalViewerUrl || doc.externalViewerUrl || doc.googleDocsUrl
      const externalViewerLabel = uploadResult.externalViewerLabel || doc.externalViewerLabel || 'Abrir no Google Docs ↗'

      researchStorage.updateDocument(doc.id, {
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
    }
  }

  _handleFileDelete(e) {
    const file = e.detail?.file
    if (!file) return
    const confirmDel = confirm(`Deseja remover "${file.name}" do corpus da pesquisa?`)
    if (confirmDel) {
      this.documents = this.documents.filter((d) => d.id !== file.id)
      const data = researchStorage._data
      data.documents = this.documents
      researchStorage._saveData(data)
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

  async _handleSocialLoginSuccess(e) {
    const { provider, user, credential, accessToken } = e.detail
    await authService.signInWithSocial({ provider, user, credential, accessToken })
    researchStorage.syncProviderFromAuthUser({ ...user, provider })
    alert(`✔ Autenticado com sucesso via ${provider.toUpperCase()}: ${user.name} (${user.email})`)
  }

  _handleSocialLoginError(e) {
    alert(`Erro na autenticação social: ${e.detail?.error || 'Tente novamente.'}`)
  }

  _handleSignOut() {
    authService.signOut()
    researchStorage.resetProviderWhenUnauthenticated(null)
    alert('Sessão encerrada.')
  }

  _updateCloudConfig(patch) {
    this.cloudConfig = researchStorage.saveCloudSyncConfig(patch)
    // Sincroniza dinamicamente a configuração nativa de socialAuth do AppShell
    if (typeof authService.configureSocialAuth === 'function') {
      const currentSocial = authService.getSocialAuthConfig?.() || {}
      authService.configureSocialAuth({
        ...currentSocial,
        ...(patch.googleClientId !== undefined ? { googleClientId: patch.googleClientId } : {}),
        ...(patch.microsoftClientId !== undefined ? { microsoftClientId: patch.microsoftClientId } : {}),
        ...(patch.microsoftTenantId !== undefined ? { microsoftTenantId: patch.microsoftTenantId } : {}),
      })
    }
    this._bindControllers()
    this._refreshFileManager()
    this.requestUpdate()
  }

  _getProviderLabel(provider) {
    switch (provider) {
      case 'google-drive':
        return 'Google Drive & Docs'
      case 'onedrive':
        return 'Microsoft OneDrive'
      case 'local':
        return 'Armazenamento Local (Navegador)'
      case 'rest':
        return 'Servidor REST Customizado'
      default:
        return provider || 'Armazenamento Local (Navegador)'
    }
  }

  _simulateDocsSyncForSample() {
    if (!researchStorage.isCloudAuthenticated(this.currentUser)) {
      alert('Faça login com Google ou Microsoft antes de simular a sincronização na nuvem.')
      return
    }
    const docxDocs = this.documents.filter((d) => d.extension === '.docx' || d.type === 'docx')
    if (docxDocs.length === 0) {
      alert('Nenhum documento .docx encontrado no corpus para sincronizar.')
      return
    }

    const nowIso = new Date().toISOString()
    for (const d of docxDocs) {
      const mockId = `1docs_${d.id}_${Date.now()}`
      researchStorage.updateDocument(d.id, {
        status: 'synced',
        storageProvider: 'google-drive',
        externalViewerUrl: `https://docs.google.com/document/d/${mockId}/edit`,
        externalViewerLabel: 'Abrir no Google Docs ↗',
        googleDriveFileId: mockId,
        syncedAt: nowIso
      })
    }
    this._loadDocs()
    alert(`✔ ${docxDocs.length} documento(s) Word sincronizado(s) com links de edição no Google Docs!`)
  }

  render() {
    const homeDirName = researchStorage.getHomeDirName()
    const isAuthenticated = researchStorage.isCloudAuthenticated(this.currentUser)
    const rawProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    const effectiveProvider = rawProvider === 'local' ? 'rest' : rawProvider
    const allowCloudUpload = isAuthenticated && (rawProvider === 'google-drive' || rawProvider === 'onedrive')
    const anySyncing = this._syncingDocIds.size > 0
    const activeFolder = this.currentFolder || `/${homeDirName}`
    const socialAuthCfg = authService.getSocialAuthConfig?.() || {}
    const effectiveGoogleClientId = this.cloudConfig.googleClientId || socialAuthCfg.googleClientId || ''
    const effectiveMicrosoftClientId = this.cloudConfig.microsoftClientId || socialAuthCfg.microsoftClientId || ''
    const isGoogle =
      this.currentUser?.provider === 'google' ||
      this.currentUser?.email?.includes('gmail') ||
      this.currentUser?.avatarUrl?.includes('google')
    const isMs =
      this.currentUser?.provider === 'microsoft' ||
      /@(outlook|hotmail|live|msn)\./i.test(this.currentUser?.email || '')

    const providerItems = [
      { id: 'google-drive', value: 'google-drive', label: 'Google Drive (GDrive)', color: '#0284c7', disabled: !isAuthenticated },
      { id: 'onedrive', value: 'onedrive', label: 'Microsoft OneDrive', color: '#0369a1', disabled: !isAuthenticated },
      { id: 'local', value: 'local', label: 'Armazenamento Local', color: '#006a6a', disabled: !isAuthenticated },
      { id: 'rest', value: 'rest', label: 'REST Customizado', color: '#475569', disabled: !isAuthenticated }
    ]

    const folderItems = [
      { id: 'root', value: `/${homeDirName}`, label: `📁 /${homeDirName}` },
      { id: 'entrevistas', value: `/${homeDirName}/entrevistas`, label: `🎙️ /${homeDirName}/entrevistas` },
      { id: 'documentos', value: `/${homeDirName}/documentos`, label: `📄 /${homeDirName}/documentos` },
      { id: 'camera', value: `/${homeDirName}/capturas-camera`, label: `📷 /${homeDirName}/capturas-camera` }
    ]

    return html`
      <div class="header-box">
        <div class="header-row">
          <div>
            <h1>Corpus de Pesquisa &amp; Gerenciador de Documentos</h1>
            <p style="margin: 6px 0 0 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
              ${isAuthenticated
                ? html`Colete entrevistas, documentos Word (.docx), PDFs e capturas de campo na pasta inicial
                    <code>/${homeDirName}</code> com destino configurável (<strong>${this._getProviderLabel(rawProvider)}</strong>).`
                : html`Colete e organize entrevistas, documentos Word (.docx), PDFs e capturas de campo localmente em
                    <code>/${homeDirName}</code>. Faça login com Google ou Microsoft para habilitar a sincronização em nuvem.`}
            </p>
          </div>

          <div class="corpus-rules-badge">
            <md-icon>verified</md-icon>
            <span>Bardin: Corpus Exaustivo &amp; Pertinente</span>
          </div>
        </div>

        <div style="font-size: 0.9rem; color: #555;">
          Total no Corpus: <strong>${this.documents.length}</strong> documentos cadastrados | Pasta inicial de persistência:
          <code>/${homeDirName}</code>
        </div>
      </div>

      <!-- Cloud & Auth Status Banner -->
      <div class="cloud-status-banner">
        <div class="cloud-status-left">
          ${this.currentUser
            ? html`
                <span class="user-pill">
                  ${this.currentUser.avatarUrl
                    ? html`<img class="user-avatar-tiny" src=${this.currentUser.avatarUrl} alt="" />`
                    : html`<md-icon style="font-size: 18px;">account_circle</md-icon>`}
                  <strong>${this.currentUser.name}</strong> (${this.currentUser.email})
                  <span style="font-size: 0.72rem; background: #e0f2f1; color: #004d40; padding: 2px 6px; border-radius: 4px;">
                    ${isGoogle ? 'Google' : isMs ? 'Microsoft' : 'Logado'}
                  </span>
                </span>
              `
            : html`
                <span class="user-pill" style="border-color: #cbd5e1; background: #f8fafc; color: #475569;">
                  <md-icon style="font-size: 18px; color: #64748b;">account_circle</md-icon>
                  Não autenticado — opere localmente ou <a href="#/conta/entrar" style="color: #0284c7; font-weight: 600;">entre</a>
                </span>
              `}

          ${isAuthenticated
            ? html`
                <span>
                  ${anySyncing ? '🔄 Sincronizando...' : '☁️ Persistência ativa:'}
                  <strong>${this._getProviderLabel(rawProvider)}</strong>
                  | Pasta Inicial: <code>/${homeDirName}</code>
                  ${rawProvider === 'google-drive' && this.cloudConfig.googleDriveFolderId
                    ? html`| Folder ID: <code>${this.cloudConfig.googleDriveFolderId}</code>`
                    : rawProvider === 'onedrive' && this.cloudConfig.oneDriveFolderId
                      ? html`| OneDrive ID: <code>${this.cloudConfig.oneDriveFolderId}</code>`
                      : ''}
                  ${rawProvider === 'google-drive' && this.cloudConfig.googleDriveConvertToDocs
                    ? html`| <span style="color: #006a6a; font-weight: 500;">✓ Conversão DOCX → Google Docs Ativa</span>`
                    : ''}
                </span>
              `
            : html`
                <span style="color: #475569;">
                  💾 <strong>Armazenamento Local (Offline / Navegador)</strong> | Pasta: <code>/${homeDirName}</code>
                  · <em>Sem sincronização em nuvem enquanto desconectado</em>
                </span>
              `}
        </div>

        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <fzl-reader-chapterview
            variant="pill"
            color=${!isAuthenticated ? '#475569' : anySyncing ? '#d97706' : '#006a6a'}
            selected
            label=${!isAuthenticated
              ? `💾 Local · /${homeDirName}`
              : anySyncing
                ? `🔄 Sincronizando · /${homeDirName}`
                : `${rawProvider === 'local' ? '💾' : '☁️'} ${this._getProviderLabel(rawProvider)} · /${homeDirName}`}
            @fzl-click=${() => {
              this.activeTab = 'cloud'
            }}
          ></fzl-reader-chapterview>

          <button
            class="tab-btn"
            style="padding: 6px 12px; font-size: 0.85rem;"
            @click=${() => {
              this.activeTab = 'cloud'
            }}
          >
            <md-icon style="font-size: 18px;">settings</md-icon>
            Configurar Persistência &amp; Login
          </button>
        </div>
      </div>

      <!-- Barra de seleção rápida com <fzl-reader-chapterview-group> e <fzl-reader-chapterview> -->
      <div class="persistence-selectors">
        <div class="selector-group">
          <span class="selector-label">Destino de Persistência:</span>
          <fzl-reader-chapterview-group
            aria-label="Selecionar provedor de persistência"
            selection-mode="single"
            .items=${providerItems}
            .selected=${isAuthenticated ? rawProvider : ''}
            @fzl-change=${(e) => {
              if (!isAuthenticated) return
              const selected = e.detail?.selected
              if (selected) {
                this._updateCloudConfig({ provider: selected })
              }
            }}
          ></fzl-reader-chapterview-group>
          ${!isAuthenticated
            ? html`<span style="font-size: 0.78rem; color: #64748b;">
                🔒 Desabilitado até você fazer login (<a href="#/conta/entrar" style="color: #0284c7;">Entrar</a>)
              </span>`
            : ''}
        </div>

        <div class="selector-group">
          <span class="selector-label">Pasta em /${homeDirName}:</span>
          <fzl-reader-chapterview-group
            aria-label="Selecionar pasta inicial ativa"
            selection-mode="single"
            .items=${folderItems}
            .selected=${activeFolder}
            @fzl-change=${(e) => {
              const folder = e.detail?.selected || `/${homeDirName}`
              this.currentFolder = folder
              const managerEl = this.shadowRoot?.querySelector('fzl-file-manager')
              if (managerEl && typeof managerEl.navigateToFolder === 'function') {
                managerEl.navigateToFolder(folder)
              }
            }}
          ></fzl-reader-chapterview-group>
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
          Captura de Câmera (fzl-camera-capture)
        </button>

        <button
          class="tab-btn ${this.activeTab === 'cloud' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'cloud'
          }}
        >
          <md-icon>cloud_sync</md-icon>
          Persistência &amp; Nuvem (GDrive / OneDrive)
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
                      <strong>${this._getProviderLabel(rawProvider)}</strong>.`
                  : html`Operando em modo <strong>Local (Navegador)</strong> na pasta <code>${activeFolder}</code>. Os documentos mostrados aqui são apenas locais enquanto você não estiver conectado.`}
                Alterne entre visualização em <strong>Tabela</strong> e <strong>Grade</strong>, navegue pelas pastas sob
                <code>/${homeDirName}</code> e clique em <strong>Continuar Leitura</strong>.
              </div>

              <fzl-file-manager
                view-mode="table"
                current-folder=${activeFolder}
                .includeLocalBookmarks=${false}
                storage-provider=${effectiveProvider}
                google-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.googleDriveFolderId || '') : ''}
                one-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.oneDriveFolderId || '') : ''}
                ?google-drive-convert-to-docs=${allowCloudUpload && Boolean(this.cloudConfig.googleDriveConvertToDocs)}
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
                @fzl-file-upload-success=${this._handleFileUploaded}
                @fzl-file-uploaded=${this._handleFileUploaded}
                @fzl-file-upload-error=${this._handleFileUploadError}
                @fzl-file-open-study=${() => {
                  window.location.hash = '#/codificacao'
                }}
              ></fzl-file-manager>

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

      ${this.activeTab === 'upload'
        ? html`
            <div class="card">
              <div class="info-alert">
                📥 <strong>Upload &amp; Importação de Documentos:</strong>
                ${isAuthenticated && rawProvider !== 'local'
                  ? html`Destino ativo: <strong>${this._getProviderLabel(rawProvider)}</strong> na pasta inicial
                      <code>/${homeDirName}</code>.`
                  : html`Modo <strong>Local</strong> ativo na pasta <code>/${homeDirName}</code> — os documentos importados ficam salvos apenas localmente neste navegador (sem envio para a nuvem).`}
                Arraste e solte arquivos em Word (<code>.docx</code>), PDF, Markdown, TXT ou CSV/JSON.
              </div>

              <fzl-document-picker
                mode="all"
                accept=".docx,.txt,.md,.pdf,.csv,.json"
                allow-folder-scan
                start-in="documents"
                storage-provider=${effectiveProvider}
                google-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.googleDriveFolderId || '') : ''}
                one-drive-folder-id=${allowCloudUpload ? (this.cloudConfig.oneDriveFolderId || '') : ''}
                ?google-drive-convert-to-docs=${allowCloudUpload && Boolean(this.cloudConfig.googleDriveConvertToDocs)}
                google-auth-token=${allowCloudUpload ? (this.cloudConfig.googleAuthToken || '') : ''}
                one-drive-auth-token=${allowCloudUpload ? (this.cloudConfig.oneDriveAuthToken || '') : ''}
                @fzl-document-select=${this._handleDocumentSelect}
                @fzl-document-upload-success=${this._handleUploadSuccess}
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
                      e sincronizados automaticamente com <strong>${this._getProviderLabel(rawProvider)}</strong>.`
                  : html`Fotos de documentos e vídeos de observação são registrados <strong>apenas localmente</strong> em
                      <code>/${homeDirName}/capturas-camera</code>. Conecte uma conta Google ou Microsoft para ativar o envio à nuvem.`}
              </div>

              <fzl-camera-capture
                mode="both"
                overlay="document"
                @fzl-capture-photo=${this._handleCapturePhoto}
                @fzl-capture-video=${this._handleCaptureVideo}
              ></fzl-camera-capture>

              ${this.captureStatus
                ? html`<div class="capture-status">${this.captureStatus}</div>`
                : ''}
            </div>
          `
        : ''}

      ${this.activeTab === 'cloud'
        ? html`
            <div class="card">
              <h2 style="margin-top: 0; color: #006a6a; display: flex; align-items: center; gap: 8px;">
                <md-icon>cloud_sync</md-icon>
                Persistência de Arquivos &amp; Sincronização (Google Drive / OneDrive)
              </h2>
              <p style="color: #4b5563; font-size: 0.95rem; line-height: 1.5;">
                Ao autenticar com sua conta <strong>Google</strong> ou <strong>Microsoft</strong>, as opções de destino de
                persistência são habilitadas e configuradas automaticamente para o provedor correspondente usando a pasta inicial
                (padrão: <code>${DEFAULT_HOME_DIR}</code>). Enquanto estiver desconectado, todas as opções de nuvem ficam bloqueadas e o app salva apenas localmente.
              </p>

              <div class="cloud-grid">
                <!-- Card 1: Autenticação Social -->
                <div class="cloud-card">
                  <h3>
                    <md-icon>badge</md-icon>
                    Autenticação &amp; Identidade
                  </h3>

                  ${this.currentUser
                    ? html`
                        <div style="display: flex; align-items: center; gap: 12px; margin: 16px 0; padding: 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
                          ${this.currentUser.avatarUrl
                            ? html`<img style="width: 44px; height: 44px; border-radius: 50%; object-fit: cover;" src=${this.currentUser.avatarUrl} alt="" />`
                            : html`<md-icon style="font-size: 40px; color: #006a6a;">account_circle</md-icon>`}
                          <div>
                            <div style="font-weight: 600; font-size: 1rem;">${this.currentUser.name}</div>
                            <div style="font-size: 0.85rem; color: #64748b;">${this.currentUser.email}</div>
                          </div>
                        </div>

                        <div style="display: flex; gap: 8px;">
                          <md-outlined-button @click=${this._handleSignOut}>
                            <md-icon slot="icon">logout</md-icon>
                            Desconectar
                          </md-outlined-button>
                          <md-text-button href="#/conta">Ver Minha Conta</md-text-button>
                        </div>
                      `
                    : html`
                        <div style="margin-bottom: 12px; font-size: 0.84rem;">
                          ${effectiveGoogleClientId
                            ? html`<span style="color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                                🟢 Google OAuth Ativo (Login Real)
                              </span>`
                            : html`<span style="color: #92400e; background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                                ⚠️ Google Client ID não informado (insira abaixo para autenticar)
                              </span>`}
                        </div>
                        <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 14px;">
                          Faça login com sua conta real do Google ou Microsoft para habilitar e configurar a persistência na nuvem:
                        </p>
                        <fzl-social-login
                          layout="buttons"
                          show-divider="false"
                          google-client-id=${effectiveGoogleClientId}
                          microsoft-client-id=${effectiveMicrosoftClientId}
                          microsoft-tenant-id=${this.cloudConfig.microsoftTenantId || 'common'}
                          .requestDriveScope=${socialAuthCfg.requestDriveScope === true}
                          @fzl-social-login-success=${this._handleSocialLoginSuccess}
                          @fzl-social-login-error=${this._handleSocialLoginError}
                        ></fzl-social-login>
                      `}
                </div>

                <!-- Card 2: Destino de Persistência & Pasta Inicial -->
                <div class="cloud-card">
                  <h3>
                    <md-icon>hard_drive</md-icon>
                    Destino de Persistência &amp; Pasta Inicial
                  </h3>

                  <div class="form-group">
                    <label style="display: block; font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 6px;">
                      Onde persistir arquivos e capturas:
                    </label>
                    <select
                      class="select-control"
                      ?disabled=${!isAuthenticated}
                      .value=${rawProvider}
                      @change=${(e) => {
                        this._updateCloudConfig({ provider: e.target.value })
                      }}
                    >
                      <option value="google-drive">Google Drive &amp; Google Docs</option>
                      <option value="onedrive">Microsoft OneDrive</option>
                      <option value="local">Armazenamento Local (Navegador / Offline)</option>
                      <option value="rest">Backend REST Customizado</option>
                    </select>
                    ${!isAuthenticated
                      ? html`<div style="font-size: 0.78rem; color: #64748b; margin-top: 6px;">
                          🔒 Faça login com uma conta padrão ou com suas credenciais OAuth para habilitar a seleção do destino de persistência.
                        </div>`
                      : ''}
                  </div>

                  <label class="switch-label">
                    <input
                      type="checkbox"
                      style="width: 18px; height: 18px; cursor: pointer;"
                      .checked=${this.cloudConfig.autoConfigureByAuthProvider !== false}
                      @change=${(e) => {
                        this._updateCloudConfig({ autoConfigureByAuthProvider: e.target.checked })
                      }}
                    />
                    <span>
                      <strong>Configurar automaticamente para Google Drive ou OneDrive ao fazer login com Google ou Microsoft</strong>
                      <div style="font-size: 0.78rem; color: #64748b;">
                        Ajusta automaticamente todos os componentes conforme o provedor da conta autenticada.
                      </div>
                    </span>
                  </label>

                  <div class="form-group" style="margin-top: 12px;">
                    <md-outlined-text-field
                      label="Nome da Pasta Inicial de Persistência (Home Dir)"
                      supporting-text="Padrão: ${DEFAULT_HOME_DIR} — usada como raiz dos documentos na nuvem e no gerenciador"
                      style="width: 100%;"
                      .value=${this.cloudConfig.homeDirName ?? DEFAULT_HOME_DIR}
                      @input=${(e) => {
                        this._updateCloudConfig({ homeDirName: e.target.value })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <div style="display: flex; gap: 8px; justify-content: flex-end;">
                    <md-outlined-button
                      @click=${() => {
                        this._updateCloudConfig({
                          homeDirName: DEFAULT_HOME_DIR,
                          googleDriveFolderId: '',
                          oneDriveFolderId: ''
                        })
                      }}
                    >
                      Restaurar ${DEFAULT_HOME_DIR}
                    </md-outlined-button>
                  </div>
                </div>

                <!-- Card 3: Credenciais OAuth para Login Real -->
                <div class="cloud-card">
                  <h3>
                    <md-icon>key</md-icon>
                    Credenciais OAuth (Login Real)
                  </h3>

                  <p style="font-size: 0.82rem; color: #64748b; margin-top: 0;">
                    Cole aqui seus Client IDs públicos caso queira sobrescrever a configuração padrão do AppShell:
                  </p>

                  <div class="form-group">
                    <md-outlined-text-field
                      label="Google Cloud Client ID"
                      supporting-text="Ex: 123456789-abc.apps.googleusercontent.com"
                      style="width: 100%;"
                      .value=${this.cloudConfig.googleClientId || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ googleClientId: e.target.value.trim() })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <div class="form-group">
                    <md-outlined-text-field
                      label="Microsoft Azure Client ID"
                      supporting-text="Ex: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                      style="width: 100%;"
                      .value=${this.cloudConfig.microsoftClientId || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ microsoftClientId: e.target.value.trim() })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <div style="font-size: 0.8rem; color: #64748b; background: #f1f5f9; padding: 8px 12px; border-radius: 6px;">
                    🔒 <strong>Segurança:</strong> O aplicativo opera exclusivamente com autenticação real via provedores federados (Google GIS / Microsoft Entra).
                  </div>
                </div>

                <!-- Card 4: Configuração Google Drive & OneDrive -->
                <div class="cloud-card">
                  <h3>
                    <md-icon>folder_shared</md-icon>
                    Pastas de Destino (Google Drive &amp; OneDrive)
                  </h3>

                  <div class="form-group">
                    <md-outlined-text-field
                      label="ID da Pasta no Google Drive (Folder ID)"
                      supporting-text="Opcional: se vazio, localiza ou cria '${homeDirName}' automaticamente no envio"
                      style="width: 100%;"
                      .value=${this.cloudConfig.googleDriveFolderId || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ googleDriveFolderId: e.target.value.trim() })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <div class="form-group">
                    <md-outlined-text-field
                      label="ID da Pasta no Microsoft OneDrive (Folder ID)"
                      supporting-text="Opcional: se vazio, localiza ou cria '${homeDirName}' automaticamente no envio"
                      style="width: 100%;"
                      .value=${this.cloudConfig.oneDriveFolderId || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ oneDriveFolderId: e.target.value.trim() })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <label class="switch-label">
                    <input
                      type="checkbox"
                      style="width: 18px; height: 18px; cursor: pointer;"
                      .checked=${Boolean(this.cloudConfig.googleDriveConvertToDocs)}
                      @change=${(e) => {
                        this._updateCloudConfig({ googleDriveConvertToDocs: e.target.checked })
                      }}
                    />
                    <span>
                      <strong>Converter .docx em Google Docs nativo</strong>
                      <div style="font-size: 0.78rem; color: #64748b;">
                        Permite abrir e editar o documento diretamente no navegador via Google Docs.
                      </div>
                    </span>
                  </label>

                  <div class="form-group" style="margin-top: 10px;">
                    <md-outlined-text-field
                      label="Token OAuth2 Google Drive (Opcional)"
                      supporting-text="Bearer token manual ou obtido automaticamente via GIS"
                      style="width: 100%;"
                      type="password"
                      .value=${this.cloudConfig.googleAuthToken || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ googleAuthToken: e.target.value.trim() })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <div class="form-group">
                    <md-outlined-text-field
                      label="Token OAuth2 OneDrive (Opcional)"
                      supporting-text="Bearer token Microsoft Graph ou obtido automaticamente via Entra"
                      style="width: 100%;"
                      type="password"
                      .value=${this.cloudConfig.oneDriveAuthToken || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ oneDriveAuthToken: e.target.value.trim() })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;">
                    <md-filled-button @click=${() => alert(`✔ Configurações salvas! Provedor: ${this._getProviderLabel(rawProvider)} | Pasta Inicial: /${homeDirName}`)}>
                      Salvar Configurações
                    </md-filled-button>
                  </div>
                </div>
              </div>

              <!-- Tutorial: Como Obter Credenciais Reais -->
              <details style="margin-top: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px 16px; font-size: 0.9rem; line-height: 1.6;">
                <summary style="font-weight: 600; cursor: pointer; color: #006a6a;">
                  📘 Como obter o seu Google Client ID e Microsoft Client ID para login real (Passo a Passo)
                </summary>

                <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
                  <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
                    <h4 style="margin: 0 0 8px 0; color: #1e3a8a; display: flex; align-items: center; gap: 6px;">
                      <md-icon style="font-size: 18px;">travel_explore</md-icon> 1. Google Cloud Console
                    </h4>
                    <ol style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: #334155;">
                      <li>Acesse o <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console</a> e crie um projeto (gratuito).</li>
                      <li>Vá em <strong>Tela de consentimento OAuth</strong>, selecione <em>Externo</em> e informe o nome do seu aplicativo.</li>
                      <li>Vá em <strong>Credenciais</strong> &gt; <strong>Criar Credenciais</strong> &gt; <strong>ID do cliente OAuth</strong>.</li>
                      <li>Escolha o tipo <strong>Aplicativo da Web</strong>.</li>
                      <li>Em <strong>Origens JavaScript autorizadas</strong>, adicione:
                        <ul style="margin: 4px 0;">
                          <li><code>https://wagnermarques.github.io</code></li>
                          <li><code>http://localhost:5173</code> (se rodar em desenvolvimento local)</li>
                        </ul>
                      </li>
                      <li>Em <strong>APIs e Serviços</strong>, ative a <strong>Google Drive API</strong> se desejar upload direto.</li>
                      <li>Copie o <strong>Client ID</strong> gerado (ex: <code>...apps.googleusercontent.com</code>) e cole no campo <em>Google Cloud Client ID</em> acima!</li>
                    </ol>
                  </div>

                  <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
                    <h4 style="margin: 0 0 8px 0; color: #0369a1; display: flex; align-items: center; gap: 6px;">
                      <md-icon style="font-size: 18px;">cloud</md-icon> 2. Microsoft Azure Portal (Entra ID)
                    </h4>
                    <ol style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: #334155;">
                      <li>Acesse o <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener">Portal do Azure (Registros de Aplicativo)</a>.</li>
                      <li>Clique em <strong>Novo registro</strong>.</li>
                      <li>Selecione <em>Contas em qualquer diretório organizacional e contas pessoais da Microsoft (ex: Skype, Xbox, Outlook.com)</em>.</li>
                      <li>Em <strong>URI de Redirecionamento</strong>, escolha plataforma <strong>SPA (Aplicativo de Página Única)</strong> e adicione:
                        <ul style="margin: 4px 0;">
                          <li><code>https://wagnermarques.github.io/fzl-caqdas/</code></li>
                          <li><code>http://localhost:5173/</code></li>
                        </ul>
                      </li>
                      <li>Copie o <strong>ID do aplicativo (cliente)</strong> (formato GUID) e cole no campo <em>Microsoft Azure Client ID</em> acima!</li>
                    </ol>
                  </div>
                </div>
              </details>

              <!-- Card 3: Lista de Documentos & Estado de Sincronização -->
              <div style="margin-top: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <h3 style="margin: 0; color: #006a6a;">Documentos no Corpus &amp; Estado de Sincronização</h3>
                  <md-outlined-button
                    ?disabled=${!isAuthenticated || anySyncing}
                    @click=${this._simulateDocsSyncForSample}
                  >
                    <md-icon slot="icon">sync</md-icon>
                    Sincronizar Arquivos DOCX no Google Docs (Simulação)
                  </md-outlined-button>
                </div>

                <table class="doc-link-table">
                  <thead>
                    <tr>
                      <th>Documento</th>
                      <th>Tipo</th>
                      <th>Participante / Pasta</th>
                      <th>Status de Sincronização</th>
                      <th>Visualizador / Ação</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.documents.map((doc) => {
                      const syncState = researchStorage.getDocumentSyncState(doc, this._syncingDocIds)
                      const hasDocs = Boolean(doc.externalViewerUrl)
                      const isSyncing = syncState === 'syncing'
                      const hasRemote = syncState === 'synced'
                      const formattedFolder = researchStorage.formatPersistenceFolder(doc.folder || 'entrevistas')
                      const statusColor = isSyncing ? '#d97706' : hasRemote ? '#0284c7' : '#64748b'
                      const statusIcon = isSyncing ? 'sync' : hasRemote ? 'cloud_done' : 'computer'
                      const statusLabel = isSyncing ? 'Sincronizando...' : hasRemote ? 'Sincronizado' : 'Local'
                      const actionLabel = isSyncing
                        ? 'Sincronizando...'
                        : !isAuthenticated
                          ? 'Requer Login'
                          : rawProvider === 'local'
                            ? 'Modo Local'
                            : hasRemote
                              ? 'Re-sincronizar'
                              : 'Sincronizar na Nuvem'
                      return html`
                        <tr>
                          <td><strong>${doc.title}</strong></td>
                          <td><code>${doc.extension || doc.type}</code></td>
                          <td>${doc.participant || 'N/A'} (<code>${formattedFolder}</code>)</td>
                          <td>
                            <span style="display: inline-flex; align-items: center; gap: 4px; font-weight: 500; color: ${statusColor};">
                              <md-icon style="font-size: 16px;">${statusIcon}</md-icon>
                              ${statusLabel}
                            </span>
                          </td>
                          <td>
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                              ${hasDocs
                                ? html`
                                    <a class="btn-external-link" href=${doc.externalViewerUrl} target="_blank" rel="noopener noreferrer">
                                      <md-icon style="font-size: 14px;">open_in_new</md-icon>
                                      ${doc.externalViewerLabel || 'Abrir na Nuvem ↗'}
                                    </a>
                                  `
                                : ''}
                              <md-outlined-button
                                style="font-size: 0.78rem; --md-outlined-button-container-height: 30px; padding: 0 8px;"
                                ?disabled=${!isAuthenticated || rawProvider === 'local' || isSyncing}
                                @click=${() => this._syncDocViaController(doc)}
                              >
                                <md-icon slot="icon" style="font-size: 15px;">${isSyncing ? 'sync' : 'cloud_upload'}</md-icon>
                                ${actionLabel}
                              </md-outlined-button>
                            </div>
                          </td>
                        </tr>
                      `
                    })}
                  </tbody>
                </table>
              </div>
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
