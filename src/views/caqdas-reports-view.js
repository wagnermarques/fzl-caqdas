import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'

export class CaqdasReportsView extends LitElement {
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

    .report-card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 24px;
      margin-top: 20px;
    }

    .code-block {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 16px;
      border-radius: 8px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9rem;
      overflow-x: auto;
      line-height: 1.5;
    }

    .btn-row {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }
  `

  static properties = {
    project: { state: true },
    documents: { state: true },
    codes: { state: true },
    categories: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this.codes = []
    this.categories = []
    this.project = null
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
    this.project = researchStorage.getProject()
    this.documents = researchStorage.getDocuments()
    this.codes = researchStorage.getCodes()
    this.categories = researchStorage.getCategories()
  }

  _exportJSON() {
    const data = {
      project: this.project,
      categories: this.categories,
      codes: this.codes,
      documents: this.documents,
      memos: researchStorage.getMemos()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `caqdas-project-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  _generatePythonScript() {
    return `# -*- coding: utf-8 -*-
"""
Script Python para Análise de Dados Qualitativos com Pandas
Exportado diretamente do CAQDAS (FZL Researcher)
"""
import json
import pandas as pd
import matplotlib.pyplot as plt

# 1. Carregar os dados exportados
with open('caqdas-project.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# 2. Criar DataFrame de Excertos e Códigos
rows = []
code_map = {c['id']: c['name'] for c in data['codes']}
cat_map = {c['id']: c.get('categoryId') for c in data['codes']}

for doc in data['documents']:
    for q in doc.get('quotations', []):
        rows.append({
            'document_id': doc['id'],
            'participant': doc.get('participant', 'Unknown'),
            'group': doc.get('group', 'General'),
            'code': code_map.get(q['codeId'], q['codeId']),
            'quotation_text': q['text']
        })

df_quotes = pd.DataFrame(rows)

print("=== Frequência de Códigos ===")
print(df_quotes['code'].value_counts())

print("\\n=== Matriz Cruzada (Participante x Código) ===")
cross_tab = pd.crosstab(df_quotes['participant'], df_quotes['code'])
print(cross_tab)
`
  }

  render() {
    return html`
      <div>
        <h1>Relatórios & Integração com Python / Pandas</h1>
        <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
          Gere saídas analíticas para publicação e utilize Python para exploração estatística e visualizações avançadas.
        </p>
      </div>

      <div class="report-card">
        <h2 style="margin-top: 0; font-size: 1.25rem;">Exportar Dados do Projeto</h2>
        <div class="btn-row">
          <md-filled-button @click=${this._exportJSON}>
            <md-icon slot="icon">file_download</md-icon>
            Baixar Projeto Completo (JSON)
          </md-filled-button>
        </div>

        <h3 style="margin-top: 24px; font-size: 1.1rem; color: #006a6a;">
          Integração com Python (Pandas + Matplotlib)
        </h3>
        <p style="font-size: 0.95rem; color: #444;">
          Utilize o script abaixo para carregar o arquivo JSON exportado no Jupyter Notebook ou Google Colab:
        </p>

        <pre class="code-block"><code>${this._generatePythonScript()}</code></pre>
      </div>
    `
  }
}

customElements.define('caqdas-reports-view', CaqdasReportsView)
