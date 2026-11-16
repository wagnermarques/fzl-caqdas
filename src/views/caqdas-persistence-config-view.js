import { LitElement, html, css } from 'lit'
import { researchStorage, DEFAULT_HOME_DIR, getPersistenceProviderLabel } from '../services/storage-service.js'
import { authService } from 'fzl-fund-appshell--lit'
import { CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/button/text-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'
import '@fzl/webcomponents-lit/social-login'
import '@fzl/webcomponents-lit/reader-chapterview'

export class CaqdasPersistenceConfigView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1120px;
      margin: 0 auto;
    }

    .header-box {
      background: var(--md-sys-color-surface-container, #f3f5f5);
      border: 1px solid var(--md-sys-color-outline-variant, #d8e0df);
      border-radius: 16px;
      padding: 22px 24px;
      margin-bottom: 20px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px;
    }

    h1 {
      margin: 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.55rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .status-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #eef7f6;
      border: 1px solid #c2e2e0;
      border-radius: 12px;
      padding: 12px 18px;
      margin-bottom: 18px;
      font-size: 0.9rem;
    }

    .status-left {
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

    .selector-bar {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      background: #f8fafc;
      border: 1px solid #d8e5e4;
      border-radius: 12px;
      padding: 12px 16px;
      margin-bottom: 20px;
    }

    .selector-label {
      font-size: 0.85rem;
      font-weight: 600;
      color: #004d40;
      margin-right: 4px;
    }

    .cloud-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 20px;
    }

    .cloud-card {
      background: var(--md-sys-color-surface, #ffffff);
      border: 1px solid #d0e0df;
      border-radius: 12px;
      padding: 18px;
    }

    .cloud-card h2 {
      margin: 0 0 12px 0;
      color: #006a6a;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1.08rem;
    }

    .form-group {
      margin-bottom: 14px;
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

    .select-control:disabled {
      background: #f1f5f9;
      color: #64748b;
      cursor: not-allowed;
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

    .section-card {
      margin-top: 22px;
      background: var(--md-sys-color-surface, #ffffff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
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

    .diag-box {
      margin-top: 12px;
      padding: 10px 12px;
      border-radius: 8px;
      font-size: 0.83rem;
      line-height: 1.45;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      color: #334155;
    }

    .diag-box.ok {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }

    .diag-box.warn {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .diag-box.error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }
  `

  static properties = {
    documents: { state: true },
    currentUser: { state: true },
    cloudConfig: { state: true },
    _syncingDocIds: { state: true },
    _driveScopeStatus: { state: true },
    _driveDiagnostic: { state: true },
    _checkingDrive: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this.currentUser = authService.getCurrentUser?.() || null
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.cloudController = new CaqdasPersonalCloudDocsController(this)
    this._syncingDocIds = new Set()
    this._driveScopeStatus = 'unknown'
    this._driveDiagnostic = null
    this._checkingDrive = false
  }

  connectedCallback() {
    super.connectedCallback()
    this.documents = researchStorage.getDocuments()
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this._unsubAuth = authService.subscribe((user) => {
      this.currentUser = user
      this._driveDiagnostic = null
      this.requestUpdate()
      this.updateComplete.then(() => {
        this._bindControllers()
        void this._probeDriveAccess()
      })
    })
    this._onDataChanged = () => {
      this.documents = researchStorage.getDocuments()
    }
    this._onCloudChanged = (e) => {
      this.cloudConfig = e.detail || researchStorage.getCloudSyncConfig()
      this.requestUpdate()
      this.updateComplete.then(() => {
        this._bindControllers()
        void this._probeDriveAccess()
      })
    }
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
    window.addEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubAuth?.()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
    window.removeEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
  }

  firstUpdated() {
    this._bindControllers()
  }

  updated() {
    this._bindControllers()
  }

  _bindControllers() {
    const chapterGroup = this.shadowRoot?.querySelector('fzl-reader-chapterview-group') || null
    const chapterViews = Array.from(this.shadowRoot?.querySelectorAll('fzl-reader-chapterview') || [])
    this.cloudController.configurePersistenceComponents({
      chapterViewGroup: chapterGroup,
      chapterViews: chapterGroup ? [chapterGroup, ...chapterViews] : chapterViews
    })
  }

  _setDocSyncing(docId, active) {
    const next = new Set(this._syncingDocIds)
    if (active) next.add(docId)
    else next.delete(docId)
    this._syncingDocIds = next
  }

  _updateCloudConfig(patch) {
    this.cloudConfig = researchStorage.saveCloudSyncConfig(patch)
    if (typeof authService.configureSocialAuth === 'function') {
      const currentSocial = authService.getSocialAuthConfig?.() || {}
      authService.configureSocialAuth({
        ...currentSocial,
        ...(patch.googleClientId !== undefined ? { googleClientId: patch.googleClientId } : {}),
        ...(patch.microsoftClientId !== undefined ? { microsoftClientId: patch.microsoftClientId } : {}),
        ...(patch.microsoftTenantId !== undefined ? { microsoftTenantId: patch.microsoftTenantId } : {})
      })
    }
    this._bindControllers()
    this.requestUpdate()
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
    this._driveScopeStatus = 'not-signed-in'
    this._driveDiagnostic = null
    alert('Sessão encerrada.')
  }

  async _probeDriveAccess() {
    const res = await this.cloudController.probeSessionDriveScope()
    this._driveScopeStatus = res.status
  }

  async _handleAuthorizeGoogleDrive() {
    this._checkingDrive = true
    try {
      await this.cloudController.authorizeGoogleDrive()
      this._driveScopeStatus = 'ready'
      const diag = await this.cloudController.diagnoseGoogleDriveConnection()
      this._driveDiagnostic = diag
    } catch (err) {
      this._driveDiagnostic = {
        step: 'error',
        message: err?.message || 'Não foi possível autorizar o Google Drive.'
      }
    } finally {
      this._checkingDrive = false
    }
  }

  async _handleRunDriveDiagnostic() {
    this._checkingDrive = true
    try {
      const diag = await this.cloudController.diagnoseGoogleDriveConnection()
      this._driveDiagnostic = diag
      if (diag.step === 'ok') this._driveScopeStatus = 'ready'
      else if (diag.step === 'missing-scope') this._driveScopeStatus = 'needs-drive-scope'
    } finally {
      this._checkingDrive = false
    }
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
        this.documents = researchStorage.getDocuments()
        const targetLabel = activeProvider === 'onedrive' ? 'OneDrive' : 'Google Docs'
        this._driveDiagnostic = {
          step: 'ok',
          message: `Documento "${doc.title}" enviado com sucesso para o ${targetLabel}.`
        }
        alert(`✔ Documento "${doc.title}" sincronizado com sucesso no ${targetLabel}!`)
      } else {
        const msg = result.error || 'Erro desconhecido'
        this._driveDiagnostic = {
          step: /accessNotConfigured|Google Drive API/i.test(msg) ? 'api-disabled' : 'error',
          activationUrl: 'https://console.cloud.google.com/apis/library/drive.googleapis.com',
          message: msg
        }
        alert(`Não foi possível sincronizar na nuvem: ${msg}`)
      }
    } catch (err) {
      this._driveDiagnostic = {
        step: 'error',
        message: err?.message || 'Erro ao sincronizar documento.'
      }
      alert(`Erro ao sincronizar: ${err.message}`)
    } finally {
      this._setDocSyncing(doc.id, false)
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
    this.documents = researchStorage.getDocuments()
    alert(`✔ ${docxDocs.length} documento(s) Word sincronizado(s) com links de edição no Google Docs!`)
  }

  render() {
    const homeDirName = researchStorage.getHomeDirName()
    const isAuthenticated = researchStorage.isCloudAuthenticated(this.currentUser)
    const rawProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    const anySyncing = this._syncingDocIds.size > 0
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

    return html`
      <div class="header-box">
        <div class="header-row">
          <div>
            <h1>
              <md-icon style="color: #006a6a;">cloud_sync</md-icon>
              Persistência de Arquivos &amp; Sincronização (Google Drive / OneDrive)
            </h1>
            <p style="margin: 8px 0 0 0; color: #4b5563; font-size: 0.94rem; line-height: 1.5; max-width: 780px;">
              Ao autenticar com sua conta <strong>Google</strong> ou <strong>Microsoft</strong>, as opções de destino de
              persistência são habilitadas e configuradas automaticamente usando a pasta inicial
              (padrão: <code>${DEFAULT_HOME_DIR}</code>). Enquanto estiver desconectado, o aplicativo salva apenas localmente.
            </p>
          </div>

          <md-outlined-button href="#/fontes">
            <md-icon slot="icon">folder_open</md-icon>
            Ir para Fontes &amp; Documentos
          </md-outlined-button>
        </div>
      </div>

      <div class="status-banner">
        <div class="status-left">
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
                  <strong>${getPersistenceProviderLabel(rawProvider)}</strong>
                  | Pasta Inicial: <code>/${homeDirName}</code>
                  ${rawProvider === 'google-drive' && this.cloudConfig.googleDriveFolderId
                    ? html`| Folder ID: <code>${this.cloudConfig.googleDriveFolderId}</code>`
                    : rawProvider === 'onedrive' && this.cloudConfig.oneDriveFolderId
                      ? html`| OneDrive ID: <code>${this.cloudConfig.oneDriveFolderId}</code>`
                      : ''}
                </span>
              `
            : html`
                <span style="color: #475569;">
                  💾 <strong>Armazenamento Local (Offline / Navegador)</strong> | Pasta: <code>/${homeDirName}</code>
                </span>
              `}
        </div>
      </div>

      <div class="selector-bar">
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
          ? html`<span style="font-size: 0.8rem; color: #64748b;">
              🔒 Desabilitado até você fazer login (<a href="#/conta/entrar" style="color: #0284c7;">Entrar</a>)
            </span>`
          : ''}
      </div>

      <div class="cloud-grid">
        <!-- Card 1: Autenticação Social -->
        <div class="cloud-card">
          <h2>
            <md-icon>badge</md-icon>
            Autenticação &amp; Identidade
          </h2>

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

                <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                  <md-outlined-button @click=${this._handleSignOut}>
                    <md-icon slot="icon">logout</md-icon>
                    Desconectar
                  </md-outlined-button>
                  <md-text-button href="#/conta">Ver Minha Conta</md-text-button>
                </div>

                <div style="margin-top: 14px; padding-top: 12px; border-top: 1px solid #e2e8f0;">
                  <div style="font-size: 0.82rem; font-weight: 600; color: #334155; margin-bottom: 8px;">
                    Permissão &amp; Conexão Google Drive / Google Docs:
                  </div>
                  <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                    ${this._driveScopeStatus === 'needs-drive-scope'
                      ? html`
                          <md-filled-button
                            ?disabled=${this._checkingDrive}
                            @click=${this._handleAuthorizeGoogleDrive}
                          >
                            <md-icon slot="icon">verified_user</md-icon>
                            Autorizar Google Drive
                          </md-filled-button>
                        `
                      : html`
                          <md-outlined-button
                            ?disabled=${this._checkingDrive}
                            @click=${this._handleAuthorizeGoogleDrive}
                          >
                            <md-icon slot="icon">refresh</md-icon>
                            Renovar Permissão Drive
                          </md-outlined-button>
                        `}
                    <md-outlined-button
                      ?disabled=${this._checkingDrive}
                      @click=${this._handleRunDriveDiagnostic}
                    >
                      <md-icon slot="icon">network_check</md-icon>
                      ${this._checkingDrive ? 'Testando...' : 'Testar Conexão Google Docs'}
                    </md-outlined-button>
                  </div>

                  ${this._driveDiagnostic
                    ? html`
                        <div class="diag-box ${this._driveDiagnostic.step === 'ok' ? 'ok' : this._driveDiagnostic.step === 'missing-scope' ? 'warn' : 'error'}">
                          <div><strong>${this._driveDiagnostic.step === 'ok' ? '✔ Conectado:' : '⚠️ Atenção:'}</strong> ${this._driveDiagnostic.message}</div>
                          ${this._driveDiagnostic.step === 'api-disabled' && this._driveDiagnostic.activationUrl
                            ? html`<div style="margin-top: 6px;">
                                <a href=${this._driveDiagnostic.activationUrl} target="_blank" rel="noopener noreferrer" style="color: #0284c7; font-weight: 600;">
                                  Ativar Google Drive API no Google Cloud Console ↗
                                </a>
                              </div>`
                            : ''}
                        </div>
                      `
                    : this._driveScopeStatus === 'ready' || this._driveScopeStatus === 'manual-token'
                      ? html`<div class="diag-box ok">🟢 Escopo <code>drive.file</code> ativo nesta sessão. Clique em <em>Testar Conexão Google Docs</em> para validar a API do Google Cloud.</div>`
                      : this._driveScopeStatus === 'needs-drive-scope'
                        ? html`<div class="diag-box warn">🟠 Sua sessão atual ainda não concedeu permissão ao Google Drive (<code>drive.file</code>). Clique em <strong>Autorizar Google Drive</strong> acima.</div>`
                        : ''}
                </div>
              `
            : html`
                <div style="margin-bottom: 12px; font-size: 0.84rem;">
                  ${effectiveGoogleClientId
                    ? html`<span style="color: #166534; background: #dcfce7; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                        🟢 Google OAuth Ativo (Login Real)
                      </span>`
                    : html`<span style="color: #92400e; background: #fef3c7; padding: 2px 8px; border-radius: 4px; font-weight: 500;">
                        ⚠️ Google Client ID não informado (insira ao lado para autenticar)
                      </span>`}
                </div>
                <p style="font-size: 0.88rem; color: #64748b; margin-bottom: 14px;">
                  Faça login com sua conta Google ou Microsoft para habilitar e configurar a persistência na nuvem:
                </p>
                <fzl-social-login
                  layout="buttons"
                  show-divider="false"
                  google-client-id=${effectiveGoogleClientId}
                  microsoft-client-id=${effectiveMicrosoftClientId}
                  microsoft-tenant-id=${this.cloudConfig.microsoftTenantId || 'common'}
                  .requestDriveScope=${socialAuthCfg.requestDriveScope !== false}
                  @fzl-social-login-success=${this._handleSocialLoginSuccess}
                  @fzl-social-login-error=${this._handleSocialLoginError}
                ></fzl-social-login>
              `}
        </div>

        <!-- Card 2: Destino de Persistência & Pasta Inicial -->
        <div class="cloud-card">
          <h2>
            <md-icon>hard_drive</md-icon>
            Destino de Persistência &amp; Pasta Inicial
          </h2>

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
                  🔒 Faça login com uma conta padrão ou com suas credenciais OAuth para habilitar a seleção do destino.
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
              <strong>Configurar automaticamente Google Drive ou OneDrive ao fazer login</strong>
              <div style="font-size: 0.78rem; color: #64748b;">
                Ajusta todos os componentes conforme o provedor da conta autenticada.
              </div>
            </span>
          </label>

          <div class="form-group" style="margin-top: 12px;">
            <md-outlined-text-field
              label="Nome da Pasta Inicial de Persistência (Home Dir)"
              supporting-text="Padrão: ${DEFAULT_HOME_DIR} — raiz dos documentos na nuvem e no gerenciador"
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
          <h2>
            <md-icon>key</md-icon>
            Credenciais OAuth (Login Real)
          </h2>

          <p style="font-size: 0.82rem; color: #64748b; margin-top: 0;">
            Cole seus Client IDs públicos caso queira sobrescrever a configuração padrão do AppShell:
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
            🔒 <strong>Segurança:</strong> Autenticação exclusivamente real via provedores federados (Google GIS / Microsoft Entra).
          </div>
        </div>

        <!-- Card 4: Pastas de Destino & Tokens -->
        <div class="cloud-card">
          <h2>
            <md-icon>folder_shared</md-icon>
            Pastas de Destino (Google Drive &amp; OneDrive)
          </h2>

          <div class="form-group">
            <md-outlined-text-field
              label="ID da Pasta no Google Drive (Folder ID)"
              supporting-text="Opcional: se vazio, localiza ou cria '${homeDirName}' automaticamente"
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
              supporting-text="Opcional: se vazio, localiza ou cria '${homeDirName}' automaticamente"
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
              <strong>Converter documentos (.docx / transcrições) em Google Docs nativo</strong>
              <div style="font-size: 0.78rem; color: #64748b;">
                Permite abrir e editar entrevistas e documentos diretamente no Google Docs.
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
            <md-filled-button
              @click=${() =>
                alert(
                  `✔ Configurações salvas! Provedor: ${getPersistenceProviderLabel(rawProvider)} | Pasta Inicial: /${homeDirName}`
                )}
            >
              Salvar Configurações
            </md-filled-button>
          </div>
        </div>
      </div>

      <!-- Tutorial: Como Obter Credenciais Reais -->
      <details style="margin-top: 20px; background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 12px; padding: 14px 18px; font-size: 0.9rem; line-height: 1.6;">
        <summary style="font-weight: 600; cursor: pointer; color: #006a6a;">
          📘 Como obter o seu Google Client ID e Microsoft Client ID para login real (Passo a Passo)
        </summary>

        <div style="margin-top: 12px; display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 16px;">
          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <h3 style="margin: 0 0 8px 0; font-size: 1rem; color: #1e3a8a; display: flex; align-items: center; gap: 6px;">
              <md-icon style="font-size: 18px;">travel_explore</md-icon> 1. Google Cloud Console
            </h3>
            <ol style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: #334155;">
              <li>Acesse o <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">Google Cloud Console</a> e crie um projeto.</li>
              <li>Em <strong>Tela de consentimento OAuth</strong>, selecione <em>Externo</em> e preencha o nome do aplicativo.</li>
              <li>Em <strong>Credenciais</strong> &gt; <strong>Criar Credenciais</strong> &gt; <strong>ID do cliente OAuth</strong> (tipo <strong>Aplicativo da Web</strong>).</li>
              <li>Em <strong>Origens JavaScript autorizadas</strong>, adicione:
                <ul style="margin: 4px 0;">
                  <li><code>https://wagnermarques.github.io</code></li>
                  <li><code>http://localhost:5173</code></li>
                </ul>
              </li>
              <li>Em <strong>APIs e Serviços &gt; Biblioteca</strong>, ative a <strong>Google Drive API</strong> (obrigatório para criar pasta e enviar para o Google Docs sem erro 403).</li>
              <li>Em <strong>Público-alvo (Consentimento)</strong>, adicione usuários de teste ou clique em <strong>Publicar aplicativo</strong> (o escopo <code>drive.file</code> é classificado pelo Google como <em>não sensível</em>).</li>
              <li>Copie o <strong>Client ID</strong> e cole em <em>Google Cloud Client ID</em> acima.</li>
            </ol>
          </div>

          <div style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px;">
            <h3 style="margin: 0 0 8px 0; font-size: 1rem; color: #0369a1; display: flex; align-items: center; gap: 6px;">
              <md-icon style="font-size: 18px;">cloud</md-icon> 2. Microsoft Azure Portal (Entra ID)
            </h3>
            <ol style="margin: 0; padding-left: 18px; font-size: 0.85rem; color: #334155;">
              <li>Acesse o <a href="https://portal.azure.com/#view/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener">Portal do Azure (Registros de Aplicativo)</a> e clique em <strong>Novo registro</strong>.</li>
              <li>Selecione contas em qualquer diretório e contas pessoais da Microsoft.</li>
              <li>Em <strong>URI de Redirecionamento</strong> (<strong>SPA</strong>), adicione:
                <ul style="margin: 4px 0;">
                  <li><code>https://wagnermarques.github.io/fzl-caqdas/</code></li>
                  <li><code>http://localhost:5173/</code></li>
                </ul>
              </li>
              <li>Copie o <strong>ID do aplicativo (cliente)</strong> e cole em <em>Microsoft Azure Client ID</em> acima.</li>
            </ol>
          </div>
        </div>
      </details>

      <!-- Estado de Sincronização do Corpus -->
      <div class="section-card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
          <h2 style="margin: 0; font-size: 1.15rem; color: #006a6a;">
            Documentos no Corpus &amp; Estado de Sincronização
          </h2>
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
    `
  }
}

customElements.define('caqdas-persistence-config-view', CaqdasPersistenceConfigView)
