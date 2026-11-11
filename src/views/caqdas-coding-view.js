import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'

export class CaqdasCodingView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    h1 {
      margin: 0 0 8px 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.6rem;
    }

    .layout {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 24px;
      margin-top: 20px;
    }

    @media (max-width: 840px) {
      .layout {
        grid-template-columns: 1fr;
      }
    }

    .editor-card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 24px;
    }

    .sidebar-card {
      background: var(--md-sys-color-surface-container-low, #f9f9f9);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .document-text-container {
      margin-top: 16px;
      font-size: 1.15rem;
      line-height: 1.8;
      padding: 16px;
      background: #fafafa;
      border-radius: 8px;
      border: 1px solid #eee;
      user-select: text;
    }

    .quotation-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.8rem;
      font-weight: 600;
      color: white;
      margin: 0 2px;
      vertical-align: middle;
    }

    .quote-list-item {
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.9rem;
    }

    .quote-text {
      font-style: italic;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .quote-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 4px;
    }

    .code-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      color: white;
    }

    .remove-btn {
      cursor: pointer;
      color: #d32f2f;
      background: transparent;
      border: none;
      font-size: 0.8rem;
      padding: 2px 4px;
    }

    .coding-action-bar {
      margin-top: 16px;
      padding: 12px;
      background: #eef7f6;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
  `

  static properties = {
    documents: { state: true },
    codes: { state: true },
    selectedDocId: { state: true },
    selectedText: { state: true },
    selectedCodeId: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this.codes = []
    this.selectedDocId = ''
    this.selectedText = ''
    this.selectedCodeId = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadData()
    this._onDataChanged = () => this._loadData()
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
  }

  _loadData() {
    this.documents = researchStorage.getDocuments()
    this.codes = researchStorage.getCodes()
    if (!this.selectedDocId && this.documents.length > 0) {
      this.selectedDocId = this.documents[0].id
    }
    if (!this.selectedCodeId && this.codes.length > 0) {
      this.selectedCodeId = this.codes[0].id
    }
  }

  _handleMouseUp(e) {
    const selection = window.getSelection()
    const text = selection.toString().trim()
    if (text) {
      this.selectedText = text
    }
  }

  _handleApplyCode() {
    if (!this.selectedText) {
      alert('Selecione primeiro um trecho de texto para codificar.')
      return
    }
    if (!this.selectedCodeId) {
      alert('Selecione um código para aplicar.')
      return
    }

    researchStorage.addQuotation(this.selectedDocId, {
      codeId: this.selectedCodeId,
      text: this.selectedText,
      startOffset: 0,
      endOffset: this.selectedText.length
    })

    this.selectedText = ''
  }

  _handleDeleteQuote(quoteId) {
    researchStorage.removeQuotation(this.selectedDocId, quoteId)
  }

  render() {
    const doc = this.documents.find(d => d.id === this.selectedDocId) || this.documents[0]
    const codeMap = new Map(this.codes.map(c => [c.id, c]))

    return html`
      <div>
        <h1>Área de Codificação Qualitativa (Open & Thematic Coding)</h1>
        <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
          Selecione o texto com o cursor do mouse e vincule-o aos conceitos e categorias da pesquisa.
        </p>
      </div>

      <div style="margin-top: 16px; display: flex; align-items: center; gap: 12px;">
        <label style="font-weight: 500;">Documento:</label>
        <select
          style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 0.95rem;"
          .value=${this.selectedDocId}
          @change=${(e) => { this.selectedDocId = e.target.value; this.selectedText = ''; }}
        >
          ${this.documents.map(d => html`
            <option value=${d.id} ?selected=${d.id === this.selectedDocId}>${d.title} (${d.participant})</option>
          `)}
        </select>
      </div>

      <div class="layout">
        <div class="editor-card">
          <h2 style="margin: 0 0 12px 0; font-size: 1.25rem; color: var(--md-sys-color-on-surface, #1c1b1f);">
            ${doc?.title || 'Selecione um documento'}
          </h2>
          <div style="font-size: 0.85rem; color: #666; margin-bottom: 8px;">
            Participante: <strong>${doc?.participant || 'N/A'}</strong> | Tipo: <em>${doc?.type || 'Texto'}</em>
          </div>

          <div
            class="document-text-container"
            @mouseup=${this._handleMouseUp}
          >
            ${doc?.content || 'Nenhum conteúdo disponível.'}
          </div>

          <div class="coding-action-bar">
            <div style="flex: 1;">
              <strong>Trecho selecionado:</strong>
              <div style="font-style: italic; color: #006a6a; margin-top: 4px;">
                ${this.selectedText ? `"${this.selectedText}"` : '(Selecione um trecho acima com o mouse)'}
              </div>
            </div>

            <div style="display: flex; gap: 8px; align-items: center;">
              <select
                style="padding: 6px 10px; border-radius: 6px; border: 1px solid #bbb;"
                .value=${this.selectedCodeId}
                @change=${(e) => { this.selectedCodeId = e.target.value }}
              >
                ${this.codes.map(c => html`
                  <option value=${c.id} ?selected=${c.id === this.selectedCodeId}>
                    ${c.name}
                  </option>
                `)}
              </select>

              <md-filled-button
                ?disabled=${!this.selectedText}
                @click=${this._handleApplyCode}
              >
                <md-icon slot="icon">tag</md-icon>
                Codificar Trecho
              </md-filled-button>
            </div>
          </div>
        </div>

        <div class="sidebar-card">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--md-sys-color-primary, #006a6a);">
            Excertos Codificados neste Documento (${doc?.quotations?.length || 0})
          </h3>

          ${(doc?.quotations || []).length === 0 ? html`
            <div style="color: #777; font-size: 0.9rem;">
              Nenhum trecho codificado ainda neste documento.
            </div>
          ` : (doc?.quotations || []).map(q => {
            const code = codeMap.get(q.codeId) || { name: 'Código Removido', color: '#999' }
            return html`
              <div class="quote-list-item">
                <span class="quote-text">"${q.text}"</span>
                <div class="quote-footer">
                  <span class="code-chip" style="background-color: ${code.color};">
                    ${code.name}
                  </span>
                  <button class="remove-btn" @click=${() => this._handleDeleteQuote(q.id)}>
                    Remover
                  </button>
                </div>
              </div>
            `
          })}
        </div>
      </div>
    `
  }
}

customElements.define('caqdas-coding-view', CaqdasCodingView)
