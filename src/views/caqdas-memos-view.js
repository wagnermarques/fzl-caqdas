import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'

export class CaqdasMemosView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 12px;
    }

    h1 {
      margin: 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.6rem;
    }

    .memos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }

    .memo-card {
      background: #fffde7;
      border: 1px solid #fff59d;
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.06);
    }

    .memo-title {
      font-size: 1.15rem;
      font-weight: 600;
      color: #5d4037;
    }

    .memo-date {
      font-size: 0.8rem;
      color: #8d6e63;
    }

    .memo-content {
      font-size: 0.95rem;
      line-height: 1.6;
      color: #3e2723;
    }

    .add-form {
      background: var(--md-sys-color-surface-container-low, #f9f9f9);
      border: 1px dashed var(--md-sys-color-outline, #79747e);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }
  `

  static properties = {
    memos: { state: true },
    isAdding: { state: true },
    newTitle: { state: true },
    newContent: { state: true }
  }

  constructor() {
    super()
    this.memos = []
    this.isAdding = false
    this.newTitle = ''
    this.newContent = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadMemos()
    this._onDataChanged = () => this._loadMemos()
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
  }

  _loadMemos() {
    this.memos = researchStorage.getMemos()
  }

  _handleSaveMemo() {
    if (!this.newTitle.trim() || !this.newContent.trim()) {
      alert('Informe o título e o conteúdo da reflexão analítica.')
      return
    }

    researchStorage.addMemo({
      title: this.newTitle.trim(),
      content: this.newContent.trim(),
      targetType: 'theoretical'
    })

    this.newTitle = ''
    this.newContent = ''
    this.isAdding = false
  }

  render() {
    return html`
      <div class="header-row">
        <div>
          <h1>Memos Analíticos & Diário de Bordo</h1>
          <p style="margin: 4px 0 0 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
            Registre hipóteses interpretativas, reflexões metodológicas e decisões epistemológicas da pesquisa.
          </p>
        </div>

        <md-filled-button @click=${() => { this.isAdding = !this.isAdding }}>
          <md-icon slot="icon">${this.isAdding ? 'close' : 'add'}</md-icon>
          ${this.isAdding ? 'Cancelar' : 'Nova Anotação / Memo'}
        </md-filled-button>
      </div>

      ${this.isAdding ? html`
        <div class="add-form">
          <h3 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">Novo Memo Analítico</h3>
          <div style="margin-bottom: 12px;">
            <md-outlined-text-field
              label="Título da Reflexão"
              style="width: 100%;"
              .value=${this.newTitle}
              @input=${(e) => { this.newTitle = e.target.value }}
            ></md-outlined-text-field>
          </div>

          <div style="margin-bottom: 12px;">
            <md-outlined-text-field
              type="textarea"
              rows="4"
              label="Conteúdo Analítico / Insight do Pesquisador"
              style="width: 100%;"
              .value=${this.newContent}
              @input=${(e) => { this.newContent = e.target.value }}
            ></md-outlined-text-field>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <md-outlined-button @click=${() => { this.isAdding = false }}>Cancelar</md-outlined-button>
            <md-filled-button @click=${this._handleSaveMemo}>Salvar Memo</md-filled-button>
          </div>
        </div>
      ` : ''}

      <div class="memos-grid">
        ${this.memos.map(memo => html`
          <div class="memo-card">
            <div class="memo-title">${memo.title}</div>
            <div class="memo-date">Data: ${memo.createdDate || 'Recente'}</div>
            <div class="memo-content">${memo.content}</div>
          </div>
        `)}
      </div>
    `
  }
}

customElements.define('caqdas-memos-view', CaqdasMemosView)
