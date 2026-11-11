import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'

export class CaqdasMatrixView extends LitElement {
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

    .matrix-card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 24px;
      margin-top: 20px;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      min-width: 600px;
    }

    th, td {
      border: 1px solid #e0e0e0;
      padding: 12px 14px;
      text-align: center;
      font-size: 0.95rem;
    }

    th {
      background: #f4f6f6;
      font-weight: 600;
      color: #333;
    }

    th.row-header {
      text-align: left;
      background: #fbfbfb;
    }

    .has-quote {
      background-color: #e0f2f1;
      color: #00695c;
      font-weight: 700;
    }

    .no-quote {
      color: #ccc;
    }

    .legend-box {
      margin-top: 20px;
      padding: 12px 16px;
      background: #fafafa;
      border-radius: 8px;
      font-size: 0.9rem;
      color: #555;
    }
  `

  static properties = {
    documents: { state: true },
    codes: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this.codes = []
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
  }

  _countDocCode(doc, codeId) {
    if (!doc.quotations) return 0
    return doc.quotations.filter(q => q.codeId === codeId).length
  }

  render() {
    return html`
      <div>
        <h1>Matriz de Análise Comparativa (Casos x Códigos)</h1>
        <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
          Cruze as respostas dos participantes com os códigos temáticos identificados para contrastar relatos e identificar padrões.
        </p>
      </div>

      <div class="matrix-card">
        <table>
          <thead>
            <tr>
              <th style="width: 25%; text-align: left;">Participante / Caso</th>
              ${this.codes.map(code => html`
                <th>${code.name}</th>
              `)}
            </tr>
          </thead>
          <tbody>
            ${this.documents.map(doc => html`
              <tr>
                <td class="row-header">
                  <strong>${doc.participant}</strong>
                  <div style="font-size: 0.8rem; color: #777;">${doc.title}</div>
                </td>
                ${this.codes.map(code => {
                  const count = this._countDocCode(doc, code.id)
                  return html`
                    <td class="${count > 0 ? 'has-quote' : 'no-quote'}">
                      ${count > 0 ? count : '—'}
                    </td>
                  `
                })}
              </tr>
            `)}
          </tbody>
        </table>

        <div class="legend-box">
          💡 Os números indicam a frequência de menções / excertos codificados para cada tema em cada entrevista.
        </div>
      </div>
    `
  }
}

customElements.define('caqdas-matrix-view', CaqdasMatrixView)
