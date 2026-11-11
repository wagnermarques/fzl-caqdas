import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@fzl/webcomponents-lit/button'

export class CaqdasHomeView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .hero-card {
      background: var(--md-sys-color-surface-container, #f3f3f3);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 24px;
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
    }

    h1 {
      margin: 0 0 12px 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.8rem;
    }

    p.subtitle {
      margin: 0 0 20px 0;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      font-size: 1.05rem;
      line-height: 1.5;
    }

    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .metric-card {
      background: var(--md-sys-color-surface, #fff);
      padding: 20px;
      border-radius: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .metric-value {
      font-size: 2.2rem;
      font-weight: 700;
      color: var(--md-sys-color-primary, #006a6a);
    }

    .metric-label {
      font-size: 0.9rem;
      color: var(--md-sys-color-on-surface-variant, #49454f);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .quick-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
      margin-top: 16px;
    }

    .section-title {
      font-size: 1.3rem;
      margin: 24px 0 16px 0;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .quote-box {
      border-left: 4px solid var(--md-sys-color-primary, #006a6a);
      padding: 12px 16px;
      background: var(--md-sys-color-surface-container-low, #f8f8f8);
      margin-bottom: 12px;
      border-radius: 0 8px 8px 0;
    }
  `

  static properties = {
    project: { state: true },
    docsCount: { state: true },
    codesCount: { state: true },
    quotesCount: { state: true },
    memosCount: { state: true }
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadMetrics()
    this._onDataChanged = () => this._loadMetrics()
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
  }

  _loadMetrics() {
    this.project = researchStorage.getProject()
    const docs = researchStorage.getDocuments()
    const codes = researchStorage.getCodes()
    const memos = researchStorage.getMemos()

    this.docsCount = docs.length
    this.codesCount = codes.length
    this.quotesCount = docs.reduce((acc, d) => acc + (d.quotations?.length || 0), 0)
    this.memosCount = memos.length
  }

  render() {
    return html`
      <div class="hero-card">
        <h1>Qualitative Research Assistant (CAQDAS)</h1>
        <p class="subtitle">
          Ambiente para apoio a métodos qualitativos: coleta, organização, transcrição, codificação temática,
          matriz comparativa e geração de evidências.
        </p>

        <div style="font-weight: 600; margin-bottom: 8px;">
          Projeto Ativo: <span style="color: var(--md-sys-color-primary, #006a6a);">${this.project?.name || 'Projeto Padrão'}</span>
        </div>
        <div style="color: var(--md-sys-color-on-surface-variant, #49454f); font-size: 0.95rem; margin-bottom: 16px;">
          ${this.project?.description}
        </div>

        <div class="quick-actions">
          <md-filled-button href="#/codificacao">
            <md-icon slot="icon">edit_note</md-icon>
            Área de Codificação
          </md-filled-button>

          <md-outlined-button href="#/codebook">
            <md-icon slot="icon">account_tree</md-icon>
            Livro de Códigos
          </md-outlined-button>

          <md-outlined-button href="#/fontes">
            <md-icon slot="icon">source</md-icon>
            Documentos & Fontes
          </md-outlined-button>

          <md-outlined-button href="#/comparativo">
            <md-icon slot="icon">compare_arrows</md-icon>
            Análise Comparativa
          </md-outlined-button>

          <md-outlined-button href="#/relatorios">
            <md-icon slot="icon">analytics</md-icon>
            Relatórios & Python
          </md-outlined-button>
        </div>
      </div>

      <div class="metrics-grid">
        <div class="metric-card">
          <span class="metric-value">${this.docsCount}</span>
          <span class="metric-label">Documentos / Entrevistas</span>
        </div>
        <div class="metric-card">
          <span class="metric-value">${this.codesCount}</span>
          <span class="metric-label">Códigos Criados</span>
        </div>
        <div class="metric-card">
          <span class="metric-value">${this.quotesCount}</span>
          <span class="metric-label">Segmentos Codificados</span>
        </div>
        <div class="metric-card">
          <span class="metric-value">${this.memosCount}</span>
          <span class="metric-label">Memos & Diários</span>
        </div>
      </div>

      <h2 class="section-title">Exemplo em Análise: Tecnologia na Educação</h2>
      <div class="quote-box">
        <strong>Estudante 1:</strong> "Technology makes classes more interesting, but sometimes I have difficulty accessing the internet."
        <div style="margin-top: 6px; font-size: 0.85rem; color: #555;">
          <span style="background: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 4px; font-weight: 500;">Increased engagement</span>
          <span style="background: #ffebee; color: #c62828; padding: 2px 6px; border-radius: 4px; font-weight: 500; margin-left: 6px;">Internet connectivity</span>
        </div>
      </div>

      <div class="quote-box">
        <strong>Estudante 2:</strong> "Online activities help me learn at my own pace."
        <div style="margin-top: 6px; font-size: 0.85rem; color: #555;">
          <span style="background: #e8f5e9; color: #2e7d32; padding: 2px 6px; border-radius: 4px; font-weight: 500;">Self-paced learning</span>
        </div>
      </div>

      <div class="quote-box">
        <strong>Estudante 3:</strong> "The internet connection is a problem, especially when I need to watch videos."
        <div style="margin-top: 6px; font-size: 0.85rem; color: #555;">
          <span style="background: #ffebee; color: #c62828; padding: 2px 6px; border-radius: 4px; font-weight: 500;">Internet connectivity</span>
          <span style="background: #ffebee; color: #c62828; padding: 2px 6px; border-radius: 4px; font-weight: 500; margin-left: 6px;">Access to digital resources</span>
        </div>
      </div>
    `
  }
}

customElements.define('caqdas-home-view', CaqdasHomeView)
