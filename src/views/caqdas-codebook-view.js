import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'

export class CaqdasCodebookView extends LitElement {
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

    .category-card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
      border-bottom: 2px solid #eee;
      padding-bottom: 8px;
    }

    .category-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .codes-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }

    .codes-table th, .codes-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid #eee;
      font-size: 0.95rem;
    }

    .codes-table th {
      background: #f8f9fa;
      color: #555;
      font-weight: 600;
    }

    .code-pill {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 12px;
      color: white;
      font-weight: 500;
      font-size: 0.85rem;
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
    categories: { state: true },
    codes: { state: true },
    documents: { state: true },
    isAddingCode: { state: true },
    newCodeName: { state: true },
    newCodeDesc: { state: true },
    newCodeCatId: { state: true },
    newCodeColor: { state: true },
    isAddingCategory: { state: true },
    newCatName: { state: true },
    newCatDesc: { state: true },
    newCatColor: { state: true }
  }

  constructor() {
    super()
    this.categories = []
    this.codes = []
    this.documents = []
    this.isAddingCode = false
    this.newCodeName = ''
    this.newCodeDesc = ''
    this.newCodeCatId = ''
    this.newCodeColor = '#006a6a'
    this.isAddingCategory = false
    this.newCatName = ''
    this.newCatDesc = ''
    this.newCatColor = '#1565c0'
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
    this.categories = researchStorage.getCategories()
    this.codes = researchStorage.getCodes()
    this.documents = researchStorage.getDocuments()
    if (!this.categories.some((c) => c.id === this.newCodeCatId) && this.categories.length > 0) {
      this.newCodeCatId = this.categories[0].id
    }
  }

  _getQuotationsCountForCode(codeId) {
    let count = 0
    for (const doc of this.documents) {
      if (doc.quotations) {
        count += doc.quotations.filter(q => q.codeId === codeId).length
      }
    }
    return count
  }

  _handleSaveCode() {
    if (!this.newCodeName.trim()) {
      alert('Informe o nome do código.')
      return
    }
    if (!this.categories.some((c) => c.id === this.newCodeCatId)) {
      alert('Crie uma categoria antes de adicionar códigos.')
      return
    }

    researchStorage.addCode({
      name: this.newCodeName.trim(),
      description: this.newCodeDesc.trim(),
      categoryId: this.newCodeCatId,
      color: this.newCodeColor
    })

    this.newCodeName = ''
    this.newCodeDesc = ''
    this.isAddingCode = false
  }

  _handleSaveCategory() {
    const name = this.newCatName.trim()
    if (!name) {
      alert('Informe o nome da categoria.')
      return
    }
    const cat = researchStorage.addCategory({
      name,
      description: this.newCatDesc.trim(),
      color: this.newCatColor
    })
    this.newCodeCatId = cat.id
    this.newCatName = ''
    this.newCatDesc = ''
    this.isAddingCategory = false
    this._loadData()
  }

  render() {
    return html`
      <div class="header-row">
        <div>
          <h1>Livro de Códigos (Codebook & Categorias)</h1>
          <p style="margin: 4px 0 0 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
            Estrutura hierárquica de conceitos, categorias teóricas e definições operacionais.
          </p>
        </div>

        <div style="display: flex; gap: 8px; flex-wrap: wrap;">
          <md-outlined-button
            @click=${() => {
              this.isAddingCategory = !this.isAddingCategory
              if (this.isAddingCategory) this.isAddingCode = false
            }}
          >
            <md-icon slot="icon">${this.isAddingCategory ? 'close' : 'create_new_folder'}</md-icon>
            ${this.isAddingCategory ? 'Cancelar' : 'Nova Categoria'}
          </md-outlined-button>
          <md-filled-button
            ?disabled=${this.categories.length === 0}
            title=${this.categories.length === 0 ? 'Crie uma categoria primeiro' : ''}
            @click=${() => {
              this.isAddingCode = !this.isAddingCode
              if (this.isAddingCode) this.isAddingCategory = false
            }}
          >
            <md-icon slot="icon">${this.isAddingCode ? 'close' : 'add'}</md-icon>
            ${this.isAddingCode ? 'Cancelar' : 'Novo Código'}
          </md-filled-button>
        </div>
      </div>

      ${this.isAddingCategory ? html`
        <div class="add-form">
          <h3 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">Criar Nova Categoria</h3>
          <div style="margin-bottom: 12px; display: flex; gap: 12px; align-items: center;">
            <md-outlined-text-field
              label="Nome da Categoria"
              style="flex: 1;"
              .value=${this.newCatName}
              @input=${(e) => { this.newCatName = e.target.value }}
            ></md-outlined-text-field>
            <label style="font-weight: 500;">Cor:</label>
            <input
              type="color"
              .value=${this.newCatColor}
              @change=${(e) => { this.newCatColor = e.target.value }}
              style="border: none; width: 36px; height: 36px; cursor: pointer; border-radius: 4px;"
            />
          </div>
          <div style="margin-bottom: 12px;">
            <md-outlined-text-field
              type="textarea"
              rows="2"
              label="Descrição da Categoria"
              style="width: 100%;"
              .value=${this.newCatDesc}
              @input=${(e) => { this.newCatDesc = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <md-outlined-button @click=${() => { this.isAddingCategory = false }}>Cancelar</md-outlined-button>
            <md-filled-button @click=${this._handleSaveCategory}>Salvar Categoria</md-filled-button>
          </div>
        </div>
      ` : ''}

      ${this.categories.length === 0 && !this.isAddingCategory ? html`
        <div class="add-form" style="text-align: center;">
          <p style="margin: 0 0 8px;"><strong>Seu livro de códigos está vazio.</strong></p>
          <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
            Comece criando uma <strong>categoria</strong> (por exemplo, um eixo temático da sua análise) e depois adicione
            os <strong>códigos</strong> dentro dela.
          </p>
        </div>
      ` : ''}

      ${this.isAddingCode ? html`
        <div class="add-form">
          <h3 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">Criar Novo Código Qualitativo</h3>
          <div style="margin-bottom: 12px;">
            <md-outlined-text-field
              label="Nome do Código (Conceito / Ideia)"
              style="width: 100%;"
              .value=${this.newCodeName}
              @input=${(e) => { this.newCodeName = e.target.value }}
            ></md-outlined-text-field>
          </div>

          <div style="margin-bottom: 12px; display: flex; gap: 12px; align-items: center;">
            <label style="font-weight: 500;">Categoria:</label>
            <select
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc;"
              .value=${this.newCodeCatId}
              @change=${(e) => { this.newCodeCatId = e.target.value }}
            >
              ${this.categories.map(cat => html`
                <option value=${cat.id} ?selected=${cat.id === this.newCodeCatId}>${cat.name}</option>
              `)}
            </select>

            <label style="font-weight: 500; margin-left: 12px;">Cor:</label>
            <input
              type="color"
              .value=${this.newCodeColor}
              @change=${(e) => { this.newCodeColor = e.target.value }}
              style="border: none; width: 36px; height: 36px; cursor: pointer; border-radius: 4px;"
            />
          </div>

          <div style="margin-bottom: 12px;">
            <md-outlined-text-field
              type="textarea"
              rows="3"
              label="Definição Operacional (Regras de Aplicação)"
              style="width: 100%;"
              .value=${this.newCodeDesc}
              @input=${(e) => { this.newCodeDesc = e.target.value }}
            ></md-outlined-text-field>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <md-outlined-button @click=${() => { this.isAddingCode = false }}>Cancelar</md-outlined-button>
            <md-filled-button @click=${this._handleSaveCode}>Salvar Código</md-filled-button>
          </div>
        </div>
      ` : ''}

      ${this.categories.map(cat => {
        const catCodes = this.codes.filter(c => c.categoryId === cat.id)
        return html`
          <div class="category-card">
            <div class="category-header">
              <span style="display: inline-block; width: 14px; height: 14px; border-radius: 50%; background-color: ${cat.color};"></span>
              <span class="category-title">${cat.name}</span>
            </div>
            <div style="color: #666; font-size: 0.9rem; margin-bottom: 12px;">
              ${cat.description}
            </div>

            <table class="codes-table">
              <thead>
                <tr>
                  <th style="width: 25%;">Código</th>
                  <th>Definição Operacional</th>
                  <th style="width: 15%; text-align: right;">Frequência</th>
                </tr>
              </thead>
              <tbody>
                ${catCodes.length === 0 ? html`
                  <tr>
                    <td colspan="3" style="text-align: center; color: #999;">Nenhum código associado a esta categoria.</td>
                  </tr>
                ` : catCodes.map(code => html`
                  <tr>
                    <td>
                      <span class="code-pill" style="background-color: ${code.color};">
                        ${code.name}
                      </span>
                    </td>
                    <td style="color: #444;">${code.description || '—'}</td>
                    <td style="text-align: right; font-weight: 600; color: #006a6a;">
                      ${this._getQuotationsCountForCode(code.id)}
                    </td>
                  </tr>
                `)}
              </tbody>
            </table>
          </div>
        `
      })}
    `
  }
}

customElements.define('caqdas-codebook-view', CaqdasCodebookView)
