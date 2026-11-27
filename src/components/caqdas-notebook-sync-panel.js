import { LitElement, html, css } from 'lit'
import { researchStorage, DEFAULT_NOTEBOOK_NAME } from '../services/storage-service.js'
import { userData } from '../services/user-data-service.js'
import {
  getNotebookSyncState,
  syncCorpusToNotebook,
  downloadCorpusMarkdownBundle
} from '../services/notebook-sync-service.js'
import '@material/web/icon/icon.js'

/**
 * Painel de integração com o Gemini Notebook (NotebookLM).
 * - Completo (padrão): configura o nome do caderno (padrão `APP-CAQDAS-HOME-NOTEBOOK`),
 *   cria/localiza o caderno na conta Google e envia todo o corpus como fonte.
 * - `compact`: barra compacta para a tela Fontes.
 */
export class CaqdasNotebookSyncPanel extends LitElement {
  static properties = {
    compact: { type: Boolean, reflect: true },
    _notebookNameDraft: { state: true },
    _syncState: { state: true },
    _busy: { state: true },
    _progress: { state: true },
    _status: { state: true }
  }

  static styles = css`
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    :host {
      display: block;
      max-width: 100%;
      min-width: 0;
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface, #1f2937);
    }

    h2 {
      margin: 0 0 6px;
      font-size: 1.1rem;
      color: #006a6a;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    p {
      margin: 0 0 10px;
      color: #4b5563;
      line-height: 1.45;
    }

    code {
      background: #f1f5f9;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 0.82rem;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
    }

    .field-row {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      gap: 10px;
      margin: 12px 0;
    }

    label {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
      flex: 1 1 280px;
      min-width: 0;
    }

    input {
      font: inherit;
      font-weight: 400;
      padding: 8px 10px;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      min-width: 0;
      background: #fff;
    }

    button,
    a.btn-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 34px;
      padding: 0 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      font: inherit;
      font-size: 0.84rem;
      font-weight: 600;
      cursor: pointer;
      color: #1e293b;
      text-decoration: none;
      white-space: nowrap;
    }

    button.primary {
      background: var(--md-sys-color-primary, #006a6a);
      border-color: var(--md-sys-color-primary, #006a6a);
      color: #fff;
    }

    button[disabled] {
      opacity: 0.55;
      cursor: default;
    }

    button md-icon,
    a.btn-link md-icon {
      font-size: 18px;
    }

    .status {
      margin-top: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      font-size: 0.84rem;
      line-height: 1.45;
      overflow-wrap: anywhere;
    }

    .status.ok {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }

    .status.warn {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .status.error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .compact-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 10px 14px;
      border-radius: 10px;
      background: #f0f7f7;
      border: 1px solid #c2e2e0;
      margin-top: 12px;
    }
  `

  constructor() {
    super()
    this.compact = false
    this._notebookNameDraft = researchStorage.getNotebookName()
    this._syncState = getNotebookSyncState()
    this._busy = false
    this._progress = ''
    this._status = null
  }

  connectedCallback() {
    super.connectedCallback()
    this._refreshFromStorage()
    this._unsubUserData = userData.subscribe(() => this._refreshFromStorage())
    this._onCloudChanged = () => {
      this._notebookNameDraft = researchStorage.getNotebookName()
    }
    this._onNotebookChanged = (e) => {
      this._syncState = e?.detail || getNotebookSyncState()
    }
    window.addEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
    window.addEventListener('caqdas-notebook-changed', this._onNotebookChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubUserData?.()
    window.removeEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
    window.removeEventListener('caqdas-notebook-changed', this._onNotebookChanged)
  }

  _refreshFromStorage() {
    this._notebookNameDraft = researchStorage.getNotebookName()
    this._syncState = getNotebookSyncState()
    this._status = null
  }

  _handleNameInput(e) {
    const val = e.target.value
    this._notebookNameDraft = val
    researchStorage.saveCloudSyncConfig({ notebookName: val })
  }

  _handleResetName() {
    this._notebookNameDraft = DEFAULT_NOTEBOOK_NAME
    researchStorage.saveCloudSyncConfig({ notebookName: DEFAULT_NOTEBOOK_NAME })
  }

  async _handleSyncCorpus() {
    if (this._busy) return
    this._busy = true
    this._status = null
    this._progress = 'Conectando ao Gemini Notebook…'
    try {
      const res = await syncCorpusToNotebook({
        includeSummary: true,
        onProgress: ({ current, total, displayName }) => {
          this._progress = `Enviando fonte ${current}/${total}: ${displayName}…`
        }
      })
      const label = res.notebook?.displayName || researchStorage.getNotebookName()
      const parts = [
        res.created ? `Notebook "${label}" criado` : `Notebook "${label}" conectado`,
        res.uploadedCount > 0 ? `${res.uploadedCount} fonte(s) enviada(s)` : 'nenhuma fonte nova pendente',
        res.alreadyPresentCount > 0 ? `${res.alreadyPresentCount} já existente(s)` : '',
        res.skippedEmptyCount > 0 ? `${res.skippedEmptyCount} sem texto extraído neste dispositivo` : ''
      ].filter(Boolean)
      this._status = {
        kind: 'ok',
        text: `✔ ${parts.join(' · ')}.`,
        webUrl: res.webUrl
      }
    } catch (err) {
      this._status = {
        kind: err?.isApiDisabled ? 'warn' : 'error',
        text: err?.message || String(err),
        activationUrl: err?.activationUrl || ''
      }
    } finally {
      this._busy = false
      this._progress = ''
    }
  }

  _handleDownloadBundle() {
    const res = downloadCorpusMarkdownBundle()
    this._status = {
      kind: 'ok',
      text: `✔ Arquivo "${res.fileName}" gerado (${Math.round(res.bytes / 1024)} KB). Você pode enviá-lo direto em notebooklm.google.com → Adicionar fontes.`
    }
  }

  _renderStatus() {
    if (!this._status && !this._progress) return ''
    if (this._progress) {
      return html`<div class="status" role="status">⏳ ${this._progress}</div>`
    }
    return html`
      <div class="status ${this._status.kind}" role="status">
        <div>${this._status.text}</div>
        <div class="row" style="margin-top: 8px;">
          ${this._status.webUrl
            ? html`
                <a class="btn-link" href=${this._status.webUrl} target="_blank" rel="noopener noreferrer">
                  <md-icon>open_in_new</md-icon>
                  Abrir ${researchStorage.getNotebookName()} no NotebookLM ↗
                </a>
              `
            : ''}
          ${this._status.activationUrl
            ? html`
                <a class="btn-link" href=${this._status.activationUrl} target="_blank" rel="noopener noreferrer">
                  <md-icon>cloud_done</md-icon>
                  Ativar Gemini Notebook API no Google Cloud ↗
                </a>
                <button type="button" @click=${this._handleDownloadBundle}>
                  <md-icon>download</md-icon>
                  Baixar Corpus (.md) para importar manualmente
                </button>
              `
            : ''}
        </div>
      </div>
    `
  }

  render() {
    const activeName = researchStorage.getNotebookName()
    const webUrl = this._syncState?.webUrl || ''

    if (this.compact) {
      return html`
        <div class="compact-bar">
          <div style="font-size: 0.85rem; color: #004d40;">
            <strong>NotebookLM:</strong> <code>${activeName}</code>
            ${this._syncState?.totalSources
              ? html` · <span>${this._syncState.totalSources} fonte(s)</span>`
              : ''}
          </div>
          <div class="row">
            <button type="button" class="primary" ?disabled=${this._busy} @click=${this._handleSyncCorpus}>
              <md-icon>menu_book</md-icon>
              ${this._busy ? 'Enviando corpus…' : 'Enviar corpus para NotebookLM'}
            </button>
            ${webUrl
              ? html`
                  <a class="btn-link" href=${webUrl} target="_blank" rel="noopener noreferrer">
                    <md-icon>open_in_new</md-icon>
                    Abrir Notebook ↗
                  </a>
                `
              : ''}
          </div>
        </div>
        ${this._renderStatus()}
      `
    }

    return html`
      <div>
        <h2>
          <md-icon>auto_stories</md-icon>
          Gemini Notebook (NotebookLM) — Corpus como Fonte
        </h2>
        <p>
          Cria ou localiza o caderno <code>${activeName}</code> na sua conta Google e envia todos os documentos do
          corpus (textos, legislações, PDFs e o resumo de marcações/grafo) como fontes somente leitura no NotebookLM.
        </p>

        <div class="field-row">
          <label>
            Nome do Notebook no NotebookLM
            <input
              type="text"
              placeholder=${DEFAULT_NOTEBOOK_NAME}
              .value=${this._notebookNameDraft}
              @input=${this._handleNameInput}
            />
          </label>
          <button type="button" @click=${this._handleResetName}>
            Restaurar ${DEFAULT_NOTEBOOK_NAME}
          </button>
        </div>

        <div class="row">
          <button type="button" class="primary" ?disabled=${this._busy} @click=${this._handleSyncCorpus}>
            <md-icon>cloud_upload</md-icon>
            ${this._busy ? 'Enviando corpus…' : 'Criar / Enviar Corpus para o Notebook'}
          </button>

          <button type="button" @click=${this._handleDownloadBundle} title="Alternativa offline sem precisar habilitar a API no GCP">
            <md-icon>download</md-icon>
            Baixar Corpus (.md)
          </button>

          ${webUrl
            ? html`
                <a class="btn-link" href=${webUrl} target="_blank" rel="noopener noreferrer">
                  <md-icon>open_in_new</md-icon>
                  Abrir ${this._syncState?.displayName || activeName} ↗
                </a>
              `
            : ''}
        </div>

        ${this._renderStatus()}
      </div>
    `
  }
}

customElements.define('caqdas-notebook-sync-panel', CaqdasNotebookSyncPanel)
