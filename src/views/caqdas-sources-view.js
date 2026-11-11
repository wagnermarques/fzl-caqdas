import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'

export class CaqdasSourcesView extends LitElement {
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

    .doc-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
      gap: 16px;
    }

    .doc-card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }

    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .doc-title {
      font-size: 1.1rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .doc-badge {
      font-size: 0.75rem;
      background: var(--md-sys-color-secondary-container, #e8def8);
      color: var(--md-sys-color-on-secondary-container, #1d192b);
      padding: 4px 8px;
      border-radius: 8px;
      text-transform: uppercase;
      font-weight: 500;
    }

    .doc-preview {
      font-size: 0.95rem;
      line-height: 1.5;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      background: var(--md-sys-color-surface-container-low, #fcfcfc);
      padding: 12px;
      border-radius: 8px;
      border-left: 3px solid var(--md-sys-color-outline-variant, #ccc);
    }

    .doc-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: auto;
      font-size: 0.85rem;
      color: var(--md-sys-color-outline, #79747e);
    }

    .add-box {
      background: var(--md-sys-color-surface-container-low, #f9f9f9);
      border: 1px dashed var(--md-sys-color-outline, #79747e);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .form-group {
      margin-bottom: 12px;
    }
  `

  static properties = {
    documents: { state: true },
    isAdding: { state: true },
    newTitle: { state: true },
    newParticipant: { state: true },
    newContent: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this.isAdding = false
    this.newTitle = ''
    this.newParticipant = ''
    this.newContent = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadDocs()
    this._onDataChanged = () => this._loadDocs()
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
  }

  _loadDocs() {
    this.documents = researchStorage.getDocuments()
  }

  _handleSaveDoc() {
    if (!this.newTitle.trim() || !this.newContent.trim()) {
      alert('Por favor, informe ao menos o título e o conteúdo.')
      return
    }

    researchStorage.addDocument({
      title: this.newTitle.trim(),
      participant: this.newParticipant.trim() || 'Participante',
      type: 'interview',
      content: this.newContent.trim()
    })

    this.newTitle = ''
    this.newParticipant = ''
    this.newContent = ''
    this.isAdding = false
  }

  render() {
    return html`
      <div class="header-row">
        <div>
          <h1>Fontes e Documentos de Pesquisa</h1>
          <p style="margin: 4px 0 0 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
            Gerencie transcrições de entrevistas, notas de campo e questionários.
          </p>
        </div>

        <md-filled-button @click=${() => { this.isAdding = !this.isAdding }}>
          <md-icon slot="icon">${this.isAdding ? 'close' : 'add'}</md-icon>
          ${this.isAdding ? 'Cancelar' : 'Adicionar Documento'}
        </md-filled-button>
      </div>

      ${this.isAdding ? html`
        <div class="add-box">
          <h3 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">Novo Documento / Entrevista</h3>
          <div class="form-group">
            <md-outlined-text-field
              label="Título do Documento"
              style="width: 100%;"
              .value=${this.newTitle}
              @input=${(e) => { this.newTitle = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-group">
            <md-outlined-text-field
              label="Participante / Informante"
              style="width: 100%;"
              .value=${this.newParticipant}
              @input=${(e) => { this.newParticipant = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-group">
            <md-outlined-text-field
              type="textarea"
              rows="4"
              label="Texto / Transcrição Completa"
              style="width: 100%;"
              .value=${this.newContent}
              @input=${(e) => { this.newContent = e.target.value }}
            ></md-outlined-text-field>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end; margin-top: 12px;">
            <md-outlined-button @click=${() => { this.isAdding = false }}>Cancelar</md-outlined-button>
            <md-filled-button @click=${this._handleSaveDoc}>Salvar Documento</md-filled-button>
          </div>
        </div>
      ` : ''}

      <div class="doc-grid">
        ${this.documents.map(doc => html`
          <div class="doc-card">
            <div class="doc-header">
              <span class="doc-title">${doc.title}</span>
              <span class="doc-badge">${doc.participant || 'Geral'}</span>
            </div>

            <div class="doc-preview">
              "${doc.content}"
            </div>

            <div class="doc-footer">
              <span><strong>${doc.quotations?.length || 0}</strong> citações codificadas</span>
              <md-outlined-button href="#/codificacao">
                Codificar
              </md-outlined-button>
            </div>
          </div>
        `)}
      </div>
    `
  }
}

customElements.define('caqdas-sources-view', CaqdasSourcesView)
