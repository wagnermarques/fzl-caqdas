import { LitElement, html, css } from 'lit'
import { authService } from 'fzl-fund-appshell--lit'
import { researchStorage, getPersistenceProviderLabel } from '../services/storage-service.js'
import { CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import { getBackgroundSyncState, triggerBackgroundPull } from '../services/background-sync-service.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@fzl/webcomponents-lit/reader-chapterview'

/**
 * Widget compacto de status de autenticação e destino de persistência em nuvem/local
 * exibido dentro do drawer de configurações do AppShell.
 */
export class CaqdasCloudStatusDrawerWidget extends LitElement {
  static styles = css`
    :host {
      display: block;
    }

    .cloud-status-banner {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin: 8px 12px 12px;
      padding: 12px;
      border-radius: 12px;
      background: #eef7f6;
      border: 1px solid #c2e2e0;
      font-size: 0.85rem;
      box-sizing: border-box;
    }

    .cloud-status-left {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
      min-width: 0;
    }

    .user-pill {
      display: inline-flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 6px;
      background: #ffffff;
      padding: 5px 10px;
      border-radius: 16px;
      border: 1px solid #b2dfdb;
      font-size: 0.8rem;
      font-weight: 500;
      max-width: 100%;
      box-sizing: border-box;
      overflow-wrap: anywhere;
      line-height: 1.35;
    }

    .user-avatar-tiny {
      width: 22px;
      height: 22px;
      border-radius: 50%;
      object-fit: cover;
      flex-shrink: 0;
    }

    fzl-reader-chapterview {
      max-width: 100%;
      cursor: pointer;
    }

    md-outlined-button {
      width: 100%;
      --md-outlined-button-container-height: 36px;
    }

    .bg-sync-box {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 6px 8px;
      border-radius: 8px;
      background: #ffffff;
      border: 1px solid #d5e5e4;
      font-size: 0.76rem;
      line-height: 1.35;
      color: #334155;
      overflow-wrap: anywhere;
    }

    .bg-sync-box.error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .bg-sync-btn {
      background: transparent;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      padding: 2px 7px;
      font: inherit;
      font-size: 0.72rem;
      font-weight: 600;
      color: #006a6a;
      cursor: pointer;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .bg-sync-btn[disabled] {
      opacity: 0.55;
      cursor: default;
    }
  `

  static properties = {
    currentUser: { state: true },
    cloudConfig: { state: true },
    documents: { state: true },
    bgSync: { state: true }
  }

  constructor() {
    super()
    this.currentUser = authService.getCurrentUser?.() || null
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.documents = researchStorage.getDocuments()
    this.bgSync = getBackgroundSyncState()
    this.cloudController = new CaqdasPersonalCloudDocsController(this)
  }

  connectedCallback() {
    super.connectedCallback()
    this.currentUser = authService.getCurrentUser?.() || null
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.documents = researchStorage.getDocuments()
    this.bgSync = getBackgroundSyncState()

    this._unsubAuth = authService.subscribe((user) => {
      this.currentUser = user || null
      this.cloudConfig = researchStorage.getCloudSyncConfig()
      this.requestUpdate()
    })

    this._onCloudChanged = (e) => {
      this.cloudConfig = e?.detail || researchStorage.getCloudSyncConfig()
      this.requestUpdate()
    }

    this._onDataChanged = () => {
      this.documents = researchStorage.getDocuments()
    }

    this._onBgSyncChanged = (e) => {
      this.bgSync = e?.detail || getBackgroundSyncState()
    }

    window.addEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
    window.addEventListener('caqdas-bg-sync-changed', this._onBgSyncChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubAuth?.()
    window.removeEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
    window.removeEventListener('caqdas-bg-sync-changed', this._onBgSyncChanged)
  }

  firstUpdated() {
    this._syncPersistenceComponents()
  }

  updated() {
    this._syncPersistenceComponents()
  }

  _syncPersistenceComponents() {
    const chapterViews = Array.from(this.shadowRoot?.querySelectorAll('fzl-reader-chapterview') || [])
    this.cloudController.configurePersistenceComponents({ chapterViews })
  }

  _closeDrawer() {
    const shell = document.querySelector('app-shell')
    if (shell) {
      shell._drawerOpen = false
    }
  }

  _navigateTo(hash) {
    this._closeDrawer()
    window.location.hash = hash
  }

  render() {
    const homeDirName = researchStorage.getHomeDirName()
    const isAuthenticated = researchStorage.isCloudAuthenticated(this.currentUser)
    const rawProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    const isGoogle =
      this.currentUser?.provider === 'google' ||
      this.currentUser?.email?.includes('gmail') ||
      this.currentUser?.avatarUrl?.includes('google')
    const isMs =
      this.currentUser?.provider === 'microsoft' ||
      /@(outlook|hotmail|live|msn)\./i.test(this.currentUser?.email || '')

    return html`
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
                  Não autenticado — opere localmente ou
                  <a
                    href="#/conta/entrar"
                    style="color: #0284c7; font-weight: 600;"
                    @click=${() => this._closeDrawer()}
                  >entre</a>
                </span>
              `}

          <fzl-reader-chapterview
            variant="pill"
            color=${!isAuthenticated ? '#475569' : '#006a6a'}
            selected
            label=${!isAuthenticated
              ? `💾 Local · /${homeDirName}`
              : `${rawProvider === 'local' ? '💾' : '☁️'} ${getPersistenceProviderLabel(rawProvider)} · /${homeDirName}`}
            @fzl-click=${() => this._navigateTo('#/config/persistencia')}
          ></fzl-reader-chapterview>
        </div>

        <md-outlined-button href="#/config/persistencia" @click=${() => this._closeDrawer()}>
          <md-icon slot="icon">tune</md-icon>
          Configurar Persistência &amp; Nuvem
        </md-outlined-button>

        ${this._renderBgSyncStatus()}
      </div>
    `
  }

  _renderBgSyncStatus() {
    const bg = this.bgSync || getBackgroundSyncState()
    if (bg.state === 'idle') return ''
    if (bg.state === 'unconfigured') {
      return html`
        <div class="bg-sync-box">
          <span>
            ${bg.message || 'Faça login ou configure o GitHub para sincronizar marcações.'}
            <a
              href="#/config/persistencia"
              style="color: #0284c7; font-weight: 600;"
              @click=${() => this._closeDrawer()}
            >Configurar</a>
          </span>
        </div>
      `
    }
    const timeLabel = bg.lastPullAt
      ? new Date(bg.lastPullAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : ''
    return html`
      <div class="bg-sync-box ${bg.state === 'error' ? 'error' : ''}">
        <span>
          ${bg.state === 'syncing'
            ? '🔄 Sincronizando marcações em segundo plano…'
            : bg.state === 'error'
              ? `⚠️ ${bg.message}`
              : `✓ ${bg.message || 'Marcações sincronizadas'}${timeLabel ? ` (${timeLabel})` : ''}`}
        </span>
        <button
          type="button"
          class="bg-sync-btn"
          ?disabled=${bg.state === 'syncing'}
          title="Buscar e sincronizar marcações da nuvem (Drive/OneDrive) e GitHub"
          @click=${() => void triggerBackgroundPull({ force: true, interactive: true, reason: 'manual' })}
        >
          ${bg.state === 'syncing' ? '…' : 'Atualizar'}
        </button>
      </div>
    `
  }
}

customElements.define('caqdas-cloud-status-drawer-widget', CaqdasCloudStatusDrawerWidget)
