import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
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
    newTitle: { state: true },
    newParticipant: { state: true },
    newGroup: { state: true },
    newFolder: { state: true },
    newContent: { state: true },
    selectedDocForReading: { state: true },
    _syncingDocId: { state: true }
  }

  constructor() {
    super()
    this.activeTab = 'manager'
    this.documents = []
    this.currentUser = null
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.cloudController = new CaqdasPersonalCloudDocsController(this)
    this._syncingDocId = null
    this.newTitle = ''
    this.newParticipant = ''
    this.newGroup = 'Geral'
    this.newFolder = '/entrevistas'
    this.newContent = ''
    this.selectedDocForReading = null
  }

  firstUpdated() {
    this._bindControllers()
  }

  updated() {
    this._bindControllers()
  }

  _bindControllers() {
    const socialEl = this.shadowRoot?.querySelector('fzl-social-login')
    const pickerEl = this.shadowRoot?.querySelector('fzl-document-picker')
    const managerEl = this.shadowRoot?.querySelector('fzl-file-manager')
    const authCtrl = socialEl?.authController || this.cloudController.authController

    if (authCtrl) {
      if (pickerEl && typeof pickerEl.bindSocialAuth === 'function') {
        pickerEl.bindSocialAuth(authCtrl, {
          convertToGoogleDocs: this.cloudConfig.googleDriveConvertToDocs,
          googleDriveFolderId: this.cloudConfig.googleDriveFolderId
        })
      }
      if (managerEl && typeof managerEl.bindSocialAuth === 'function') {
        managerEl.bindSocialAuth(authCtrl, {
          convertToGoogleDocs: this.cloudConfig.googleDriveConvertToDocs,
          googleDriveFolderId: this.cloudConfig.googleDriveFolderId
        })
      }
    }
  }

  async _syncDocViaController(doc) {
    if (this._syncingDocId) return
    this._syncingDocId = doc.id
    this.requestUpdate()

    try {
      const result = await this.cloudController.syncCorpusDocument(doc, {
        convertToGoogleDocs: this.cloudConfig.googleDriveConvertToDocs,
        folderId: this.cloudConfig.googleDriveFolderId
      })

      if (result.success) {
        this._loadDocs()
        alert(`✔ Documento "${doc.title}" sincronizado com sucesso no Google Docs!`)
      } else {
        alert(`Não foi possível sincronizar no Google Docs: ${result.error || 'Erro desconhecido'}`)
      }
    } catch (err) {
      alert(`Erro ao sincronizar: ${err.message}`)
    } finally {
      this._syncingDocId = null
      this.requestUpdate()
    }
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadDocs()
    this.cloudConfig = researchStorage.getCloudSyncConfig()

    this._unsubAuth = authService.subscribe((user) => {
      this.currentUser = user
      this.requestUpdate()
    })

    this._onDataChanged = () => this._loadDocs()
    this._onCloudChanged = (e) => {
      this.cloudConfig = e.detail || researchStorage.getCloudSyncConfig()
      this.requestUpdate()
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
  }

  _getManagedFiles() {
    return this.documents.map((doc) => {
      const ext = doc.extension || (doc.type === 'docx' ? '.docx' : doc.type === 'pdf' ? '.pdf' : '.txt')
      const cat = doc.type === 'pdf' ? 'pdf' : doc.type === 'csv' || doc.type === 'json' ? 'data' : 'text'
      const hasDocs = Boolean(doc.externalViewerUrl)
      return {
        id: doc.id,
        name: doc.title || 'Documento sem título',
        folder: doc.folder || (doc.type === 'interview' ? '/entrevistas' : '/documentos'),
        size: doc.size || (doc.content ? doc.content.length : 1024),
        extension: ext,
        category: cat,
        status: doc.status || 'synced',
        uploadedAt: doc.uploadedAt || Date.now(),
        uploadedBy: doc.participant || 'Pesquisador',
        readProgress: doc.quotations && doc.quotations.length > 0 ? 100 : 30,
        tags: doc.tags || [doc.participant || 'participante', doc.group || 'geral'],
        notes: `Participante: ${doc.participant || 'N/A'} | Excertos codificados: ${doc.quotations?.length || 0}`,
        textContent: doc.content || '',
        docxBlocks: doc.docxBlocks || undefined,
        externalViewerUrl: doc.externalViewerUrl || undefined,
        externalViewerLabel:
          doc.externalViewerLabel ||
          (hasDocs ? (doc.storageProvider === 'google-drive' ? 'Abrir no Google Docs ↗' : 'Abrir na Nuvem ↗') : undefined)
      }
    })
  }

  _handleDocumentSelect(e) {
    const docs = e.detail?.documents || []
    if (docs.length === 0) return

    let addedCount = 0
    for (const d of docs) {
      const existing = this.documents.find((existingDoc) => existingDoc.title === d.name)
      if (existing) continue

      const participantName = d.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      const ext = d.extension || (d.name.endsWith('.docx') ? '.docx' : '.txt')
      const docType = ext === '.docx' ? 'docx' : ext === '.pdf' ? 'pdf' : 'interview'

      researchStorage.addDocument({
        title: d.name,
        participant: participantName,
        group: 'Corpus Importado',
        folder: '/entrevistas',
        type: docType,
        extension: ext,
        size: d.size || (d.textContent ? d.textContent.length : 2048),
        status: d.uploadStatus === 'uploaded' ? 'synced' : 'synced',
        storageProvider: d.storageProvider || this.cloudConfig.provider,
        externalViewerUrl: d.externalViewerUrl || d.googleDocsUrl || undefined,
        externalViewerLabel: d.externalViewerLabel || (ext === '.docx' ? 'Abrir no Google Docs ↗' : 'Abrir no Google Drive ↗'),
        tags: d.tags && d.tags.length > 0 ? d.tags : ['importado', docType],
        content: d.textContent || (d.docxBlocks ? d.docxBlocks.map((b) => b.text).join('\n\n') : ''),
        docxBlocks: d.docxBlocks || undefined,
        quotations: []
      })
      addedCount++
    }

    if (addedCount > 0) {
      alert(`✔ ${addedCount} documento(s) importado(s) com sucesso para o Corpus da pesquisa!`)
      this.activeTab = 'manager'
    }
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
        storageProvider: uploadResult.provider || this.cloudConfig.provider,
        externalViewerUrl,
        externalViewerLabel,
        googleDriveFileId: uploadResult.fileId || doc.googleDriveFileId
      })
      this._loadDocs()
    }
  }

  _handleFileUploaded(e) {
    const detail = e.detail || {}
    const file = detail.file
    if (file && detail.externalViewerUrl) {
      researchStorage.updateDocument(file.id, {
        externalViewerUrl: detail.externalViewerUrl,
        externalViewerLabel: detail.externalViewerLabel || 'Abrir no Google Docs ↗',
        status: 'synced'
      })
      this._loadDocs()
    }
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
      folder: this.newFolder.trim() || '/entrevistas',
      type: 'interview',
      extension: '.txt',
      size: this.newContent.length,
      status: 'synced',
      tags: ['manual', 'entrevista'],
      content: this.newContent.trim(),
      quotations: []
    })

    this.newTitle = ''
    this.newParticipant = ''
    this.newContent = ''
    this.activeTab = 'manager'
    alert('Documento cadastrado com sucesso!')
  }

  _handleSocialLoginSuccess(e) {
    const { provider, user, credential } = e.detail
    authService.signInWithSocial({ provider, user, credential })
    alert(`✔ Autenticado com sucesso via ${provider.toUpperCase()}: ${user.name} (${user.email})`)
  }

  _handleSocialLoginError(e) {
    alert(`Erro na autenticação social: ${e.detail?.error || 'Tente novamente.'}`)
  }

  _handleSignOut() {
    authService.signOut()
    alert('Sessão encerrada.')
  }

  _updateCloudConfig(patch) {
    this.cloudConfig = researchStorage.saveCloudSyncConfig(patch)
    if (typeof window !== 'undefined') {
      if (patch.googleClientId !== undefined) window.__FZL_GOOGLE_CLIENT_ID__ = patch.googleClientId
      if (patch.microsoftClientId !== undefined) window.__FZL_MICROSOFT_CLIENT_ID__ = patch.microsoftClientId
    }
    this._bindControllers()
    this.requestUpdate()
  }

  _simulateDocsSyncForSample() {
    const docxDocs = this.documents.filter((d) => d.extension === '.docx' || d.type === 'docx')
    if (docxDocs.length === 0) {
      alert('Nenhum documento .docx encontrado no corpus para sincronizar.')
      return
    }

    for (const d of docxDocs) {
      const mockId = `1docs_${d.id}_${Date.now()}`
      researchStorage.updateDocument(d.id, {
        status: 'synced',
        storageProvider: 'google-drive',
        externalViewerUrl: `https://docs.google.com/document/d/${mockId}/edit`,
        externalViewerLabel: 'Abrir no Google Docs ↗',
        googleDriveFileId: mockId
      })
    }
    this._loadDocs()
    alert(`✔ ${docxDocs.length} documento(s) Word sincronizado(s) com links de edição no Google Docs!`)
  }

  render() {
    const managedFiles = this._getManagedFiles()
    const isGoogle = this.currentUser?.email?.includes('gmail') || this.currentUser?.avatarUrl?.includes('google')
    const isMs = this.currentUser?.email?.includes('outlook') || this.currentUser?.email?.includes('hotmail')

    return html`
      <div class="header-box">
        <div class="header-row">
          <div>
            <h1>Corpus de Pesquisa &amp; Gerenciador de Documentos</h1>
            <p style="margin: 6px 0 0 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
              Colete entrevistas, documentos Word (.docx), PDFs e notas de campo, organize o corpus e sincronize na nuvem com o Google Docs &amp; Google Drive.
            </p>
          </div>

          <div class="corpus-rules-badge">
            <md-icon>verified</md-icon>
            <span>Bardin: Corpus Exaustivo &amp; Pertinente</span>
          </div>
        </div>

        <div style="font-size: 0.9rem; color: #555;">
          Total no Corpus: <strong>${this.documents.length}</strong> documentos cadastrados | Pastas ativas:
          <code>/entrevistas</code>, <code>/documentos</code>
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
                <span class="user-pill" style="border-color: #fcd34d; background: #fffbeb; color: #92400e;">
                  <md-icon style="font-size: 18px; color: #d97706;">info</md-icon>
                  Modo Local / Demonstração (Sem Login Social ativo)
                </span>
              `}

          <span>
            ☁️ Provedor de Nuvem: <strong>${this.cloudConfig.provider === 'google-drive' ? 'Google Drive & Docs' : this.cloudConfig.provider}</strong>
            ${this.cloudConfig.googleDriveFolderId ? html`| Pasta: <code>${this.cloudConfig.googleDriveFolderId}</code>` : html`| Pasta: <code>Meu Drive (Raiz)</code>`}
            ${this.cloudConfig.googleDriveConvertToDocs ? html`| <span style="color: #006a6a; font-weight: 500;">✓ Conversão DOCX → Google Docs Ativa</span>` : ''}
          </span>
        </div>

        <div style="display: flex; gap: 8px;">
          <button
            class="tab-btn"
            style="padding: 6px 12px; font-size: 0.85rem;"
            @click=${() => {
              this.activeTab = 'cloud'
            }}
          >
            <md-icon style="font-size: 18px;">settings</md-icon>
            Configurar Nuvem &amp; Login
          </button>
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
          class="tab-btn ${this.activeTab === 'cloud' ? 'active' : ''}"
          @click=${() => {
            this.activeTab = 'cloud'
          }}
        >
          <md-icon>cloud_sync</md-icon>
          Google Drive &amp; Docs
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
                Alterne entre visualização em <strong>Tabela</strong> e <strong>Grade</strong>, navegue pelas pastas do corpus,
                consulte status de sincronização e clique em <strong>Continuar Leitura</strong> para abrir o leitor embutido com suporte nativo a DOCX, texto, busca e escala de fonte.
                Documentos enviados ao Google Drive exibem o botão direto <strong>Abrir no Google Docs ↗</strong>.
              </div>

              <fzl-file-manager
                view-mode="table"
                current-folder="/"
                storage-provider=${this.cloudConfig.provider}
                google-drive-folder-id=${this.cloudConfig.googleDriveFolderId}
                ?google-drive-convert-to-docs=${this.cloudConfig.googleDriveConvertToDocs}
                google-auth-token=${this.cloudConfig.googleAuthToken}
                .files=${managedFiles}
                @fzl-file-read=${this._handleFileRead}
                @fzl-file-delete=${this._handleFileDelete}
                @fzl-file-uploaded=${this._handleFileUploaded}
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
                📥 <strong>Upload Multiplataforma com Integração em Nuvem:</strong>
                Arraste e solte arquivos ou use os seletores abaixo para carregar entrevistas e relatórios em
                <strong>Word (.docx com leitor nativo OOXML)</strong>, <strong>PDF</strong>, <strong>Markdown (.md)</strong>,
                <strong>TXT</strong> ou planilhas <strong>CSV/JSON</strong>. Os arquivos são adicionados ao Corpus e enviados diretamente à sua pasta designada no <strong>Google Drive</strong>, com conversão automática para o <strong>Google Docs</strong>!
              </div>

              <fzl-document-picker
                mode="all"
                accept=".docx,.txt,.md,.pdf,.csv,.json"
                allow-folder-scan
                start-in="documents"
                storage-provider=${this.cloudConfig.provider}
                google-drive-folder-id=${this.cloudConfig.googleDriveFolderId}
                ?google-drive-convert-to-docs=${this.cloudConfig.googleDriveConvertToDocs}
                google-auth-token=${this.cloudConfig.googleAuthToken}
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

      ${this.activeTab === 'cloud'
        ? html`
            <div class="card">
              <h2 style="margin-top: 0; color: #006a6a; display: flex; align-items: center; gap: 8px;">
                <md-icon>cloud_sync</md-icon>
                Sincronização em Nuvem (Google Drive &amp; Google Docs)
              </h2>
              <p style="color: #4b5563; font-size: 0.95rem; line-height: 1.5;">
                Conecte sua conta pública do <strong>Google</strong> ou da <strong>Microsoft</strong> para gerenciar seus documentos na nuvem.
                Ao fazer o upload de arquivos de pesquisa (especialmente arquivos <code>.docx</code>), eles são salvos na sua pasta designada no Google Drive e transformados em documentos nativos do <strong>Google Docs</strong> para colaboração em tempo real.
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
                          ${this.cloudConfig.googleClientId
                            ? html`<span style="color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                                🟢 Login Real Google Ativo
                              </span>`
                            : html`<span style="color: #92400e; background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                                🟡 Modo Demonstração (Client ID não configurado)
                              </span>`}
                        </div>
                        <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 14px;">
                          Faça login com sua conta Google ou Microsoft para sincronizar com sua pasta do Drive / OneDrive:
                        </p>
                        <fzl-social-login
                          layout="buttons"
                          show-divider="false"
                          google-client-id=${this.cloudConfig.googleClientId || ''}
                          microsoft-client-id=${this.cloudConfig.microsoftClientId || ''}
                          microsoft-tenant-id=${this.cloudConfig.microsoftTenantId || 'common'}
                          ?allow-demo-fallback=${Boolean(this.cloudConfig.allowDemoFallback)}
                          @fzl-social-login-success=${this._handleSocialLoginSuccess}
                          @fzl-social-login-error=${this._handleSocialLoginError}
                        ></fzl-social-login>
                      `}
                </div>

                <!-- Card 2: Credenciais OAuth para Login Real -->
                <div class="cloud-card">
                  <h3>
                    <md-icon>key</md-icon>
                    Credenciais OAuth (Login Real)
                  </h3>

                  <p style="font-size: 0.82rem; color: #64748b; margin-top: 0;">
                    Cole aqui seus Client IDs públicos para ativar o login real com suas contas do Google e Microsoft:
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

                  <label class="switch-label">
                    <input
                      type="checkbox"
                      style="width: 18px; height: 18px; cursor: pointer;"
                      .checked=${Boolean(this.cloudConfig.allowDemoFallback)}
                      @change=${(e) => {
                        this._updateCloudConfig({ allowDemoFallback: e.target.checked })
                      }}
                    />
                    <span>
                      <strong>Permitir fallback de demonstração</strong>
                      <div style="font-size: 0.78rem; color: #64748b;">
                        Simula login quando o Client ID não estiver preenchido.
                      </div>
                    </span>
                  </label>
                </div>

                <!-- Card 3: Configuração Google Drive -->
                <div class="cloud-card">
                  <h3>
                    <md-icon>folder_shared</md-icon>
                    Destino no Google Drive
                  </h3>

                  <div class="form-group">
                    <md-outlined-text-field
                      label="ID da Pasta no Google Drive (Folder ID)"
                      supporting-text="Ex: 1aB2cD3e... (deixe em branco para a raiz do Meu Drive)"
                      style="width: 100%;"
                      .value=${this.cloudConfig.googleDriveFolderId || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ googleDriveFolderId: e.target.value.trim() })
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

                  <div class="form-group" style="margin-top: 14px;">
                    <md-outlined-text-field
                      label="Token OAuth2 Google Drive (Opcional para API direta)"
                      supporting-text="Bearer token com escopo drive.file ou gerado via GIS"
                      style="width: 100%;"
                      type="password"
                      .value=${this.cloudConfig.googleAuthToken || ''}
                      @input=${(e) => {
                        this._updateCloudConfig({ googleAuthToken: e.target.value.trim() })
                      }}
                    ></md-outlined-text-field>
                  </div>

                  <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;">
                    <md-filled-button @click=${() => alert('✔ Configurações de nuvem salvas com sucesso!')}>
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

              <!-- Card 3: Lista de Documentos Sincronizados e Links Google Docs -->
              <div style="margin-top: 24px;">
                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
                  <h3 style="margin: 0; color: #006a6a;">Documentos no Corpus com Integração Google Docs</h3>
                  <md-outlined-button @click=${this._simulateDocsSyncForSample}>
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
                      <th>Status de Nuvem</th>
                      <th>Visualizador / Edição</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${this.documents.map((doc) => {
                      const hasDocs = Boolean(doc.externalViewerUrl)
                      return html`
                        <tr>
                          <td><strong>${doc.title}</strong></td>
                          <td><code>${doc.extension || doc.type}</code></td>
                          <td>${doc.participant || 'N/A'} (<code>${doc.folder || '/entrevistas'}</code>)</td>
                          <td>
                            <span style="display: inline-flex; align-items: center; gap: 4px; color: ${hasDocs ? '#0284c7' : '#64748b'};">
                              <md-icon style="font-size: 16px;">${hasDocs ? 'cloud_done' : 'cloud_queue'}</md-icon>
                              ${hasDocs ? 'Sincronizado' : 'Local'}
                            </span>
                          </td>
                          <td>
                            <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                              ${hasDocs
                                ? html`
                                    <a class="btn-external-link" href=${doc.externalViewerUrl} target="_blank" rel="noopener noreferrer">
                                      <md-icon style="font-size: 14px;">open_in_new</md-icon>
                                      ${doc.externalViewerLabel || 'Abrir no Google Docs ↗'}
                                    </a>
                                  `
                                : ''}
                              <md-outlined-button
                                style="font-size: 0.78rem; --md-outlined-button-container-height: 30px; padding: 0 8px;"
                                ?disabled=${this._syncingDocId === doc.id}
                                @click=${() => this._syncDocViaController(doc)}
                              >
                                <md-icon slot="icon" style="font-size: 15px;">cloud_upload</md-icon>
                                ${this._syncingDocId === doc.id ? 'Sincronizando...' : hasDocs ? 'Re-sincronizar' : 'Sincronizar no Docs'}
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
