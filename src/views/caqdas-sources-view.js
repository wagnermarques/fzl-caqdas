import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'
import '@fzl/webcomponents-lit/file-manager'
import '@fzl/webcomponents-lit/document-picker'

export class CaqdasSourcesView extends LitElement {
  static styles = css`
    :host {
      display: block;
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header-box {
      background: var(--md-sys-color-surface-container, #f3f5f5);
      border: 1px solid var(--md-sys-color-outline-variant, #d8e0df);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 12px;
      flex-wrap: wrap;
      gap: 12px;
    }

    h1 {
      margin: 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.65rem;
    }

    .corpus-rules-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #e0f2f1;
      color: #004d40;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .tabs-bar {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      padding-bottom: 12px;
    }

    .tab-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 20px;
      border: 1px solid var(--md-sys-color-outline-variant, #ccc);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      cursor: pointer;
      font-size: 0.92rem;
      font-weight: 500;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .tab-btn:hover {
      background: #f2f7f7;
    }

    .tab-btn.active {
      background: var(--md-sys-color-primary, #006a6a);
      color: #fff;
      border-color: var(--md-sys-color-primary, #006a6a);
    }

    .card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .info-alert {
      background: #f0f7f7;
      border-left: 4px solid var(--md-sys-color-primary, #006a6a);
      padding: 12px 16px;
      border-radius: 0 8px 8px 0;
      font-size: 0.9rem;
      color: #2c4d4d;
      margin-bottom: 16px;
      line-height: 1.5;
    }

    .form-box {
      background: #f9fbfb;
      border: 1px dashed var(--md-sys-color-primary, #006a6a);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .action-panel {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid #e0e0e0;
    }
  `

  static properties = {
    activeTab: { state: true },
    documents: { state: true },
    newTitle: { state: true },
    newParticipant: { state: true },
    newGroup: { state: true },
    newFolder: { state: true },
    newContent: { state: true },
    selectedDocForReading: { state: true }
  }

  constructor() {
    super()
    this.activeTab = 'manager'
    this.documents = []
    this.newTitle = ''
    this.newParticipant = ''
    this.newGroup = 'Geral'
    this.newFolder = '/entrevistas'
    this.newContent = ''
    this.selectedDocForReading = null
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
    this.requestUpdate()
  }

  /**
   * Converte os documentos de pesquisa para o formato FzlManagedFile
   * consumido pelo componente <fzl-file-manager>.
   */
  _getManagedFiles() {
    return this.documents.map(doc => {
      const ext = doc.extension || (doc.type === 'docx' ? '.docx' : doc.type === 'pdf' ? '.pdf' : '.txt')
      const cat = doc.type === 'pdf' ? 'pdf' : (doc.type === 'csv' || doc.type === 'json' ? 'data' : 'text')
      return {
        id: doc.id,
        name: doc.title || 'Documento sem título',
        folder: doc.folder || (doc.type === 'interview' ? '/entrevistas' : '/documentos'),
        size: doc.size || (doc.content ? doc.content.length : 1024),
        extension: ext,
        category: cat,
        status: doc.status || 'synced',
        uploadedAt: doc.uploadedAt || Date.now(),
        uploadedBy: doc.participant || 'Pesquisador',
        readProgress: doc.quotations && doc.quotations.length > 0 ? 100 : 30,
        tags: doc.tags || [doc.participant || 'participante', doc.group || 'geral'],
        notes: `Participante: ${doc.participant || 'N/A'} | Excertos codificados: ${doc.quotations?.length || 0}`,
        textContent: doc.content || '',
        docxBlocks: doc.docxBlocks || undefined
      }
    })
  }

  /**
   * Captura documentos selecionados/lidos no <fzl-document-picker>
   * e adiciona automaticamente ao Corpus da pesquisa.
   */
  _handleDocumentSelect(e) {
    const docs = e.detail?.documents || []
    if (docs.length === 0) return

    let addedCount = 0
    for (const d of docs) {
      const existing = this.documents.find(existingDoc => existingDoc.title === d.name)
      if (existing) continue

      const participantName = d.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      const ext = d.extension || (d.name.endsWith('.docx') ? '.docx' : '.txt')
      const docType = ext === '.docx' ? 'docx' : ext === '.pdf' ? 'pdf' : 'interview'

      researchStorage.addDocument({
        title: d.name,
        participant: participantName,
        group: 'Corpus Importado',
        folder: '/entrevistas',
        type: docType,
        extension: ext,
        size: d.size || (d.textContent ? d.textContent.length : 2048),
        status: 'synced',
        tags: d.tags && d.tags.length > 0 ? d.tags : ['importado', docType],
        content: d.textContent || (d.docxBlocks ? d.docxBlocks.map(b => b.text).join('\n\n') : ''),
        docxBlocks: d.docxBlocks || undefined,
        quotations: []
      })
      addedCount++
    }

    if (addedCount > 0) {
      alert(`✔ ${addedCount} documento(s) importado(s) com sucesso para o Corpus da pesquisa!`)
      this.activeTab = 'manager'
    }
  }

  _handleFileRead(e) {
    const file = e.detail?.file
    if (!file) return
    const doc = this.documents.find(d => d.id === file.id)
    if (doc) {
      this.selectedDocForReading = doc
    }
  }

  _handleFileDelete(e) {
    const file = e.detail?.file
    if (!file) return
    const confirmDel = confirm(`Deseja remover "${file.name}" do corpus da pesquisa?`)
    if (confirmDel) {
      this.documents = this.documents.filter(d => d.id !== file.id)
      const data = researchStorage._data
      data.documents = this.documents
      researchStorage._saveData(data)
    }
  }

  _handleSaveManualDoc() {
    if (!this.newTitle.trim() || !this.newContent.trim()) {
      alert('Por favor, informe ao menos o título e o conteúdo.')
      return
    }

    researchStorage.addDocument({
      title: this.newTitle.trim(),
      participant: this.newParticipant.trim() || 'Participante',
      group: this.newGroup.trim() || 'Geral',
      folder: this.newFolder.trim() || '/entrevistas',
      type: 'interview',
      extension: '.txt',
      size: this.newContent.length,
      status: 'synced',
      tags: ['manual', 'entrevista'],
      content: this.newContent.trim(),
      quotations: []
    })

    this.newTitle = ''
    this.newParticipant = ''
    this.newContent = ''
    this.activeTab = 'manager'
    alert('Documento cadastrado com sucesso!')
  }

  render() {
    const managedFiles = this._getManagedFiles()

    return html`
      <div class="header-box">
        <div class="header-row">
          <div>
            <h1>Corpus de Pesquisa &amp; Gerenciador de Documentos</h1>
            <p style="margin: 6px 0 0 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
              Faça upload de transcrições, arquivos Word (.docx), PDFs e notas de campo, gerencie o corpus e realize a leitura analítica prévia.
            </p>
          </div>

          <div class="corpus-rules-badge">
            <md-icon>verified</md-icon>
            <span>Bardin: Corpus Exaustivo &amp; Pertinente</span>
          </div>
        </div>

        <div style="font-size: 0.9rem; color: #555;">
          Total no Corpus: <strong>${this.documents.length}</strong> documentos cadastrados | 
          Pastas ativas: <code>/entrevistas</code>, <code>/documentos</code>
        </div>
      </div>

      <div class="tabs-bar">
        <button
          class="tab-btn ${this.activeTab === 'manager' ? 'active' : ''}"
          @click=${() => { this.activeTab = 'manager' }}
        >
          <md-icon>folder</md-icon>
          Gerenciador de Arquivos (fzl-file-manager)
        </button>

        <button
          class="tab-btn ${this.activeTab === 'upload' ? 'active' : ''}"
          @click=${() => { this.activeTab = 'upload' }}
        >
          <md-icon>upload_file</md-icon>
          Upload &amp; Importação (fzl-document-picker)
        </button>

        <button
          class="tab-btn ${this.activeTab === 'manual' ? 'active' : ''}"
          @click=${() => { this.activeTab = 'manual' }}
        >
          <md-icon>edit_note</md-icon>
          Digitação Manual de Transcrição
        </button>
      </div>

      ${this.activeTab === 'manager' ? html`
        <div class="card">
          <div class="info-alert">
            📂 <strong>Explorador de Arquivos &amp; Leitor Integrado:</strong>
            Alterne entre visualização em <strong>Tabela</strong> e <strong>Grade</strong>, navegue pelas pastas do corpus,
            consulte badges de status e clique em <strong>Continuar Leitura</strong> para abrir o leitor embutido com suporte nativo a DOCX, texto, busca e escala de fonte.
          </div>

          <fzl-file-manager
            view-mode="table"
            current-folder="/"
            .files=${managedFiles}
            @fzl-file-read=${this._handleFileRead}
            @fzl-file-delete=${this._handleFileDelete}
            @fzl-file-open-study=${() => {
              window.location.hash = '#/codificacao'
            }}
          ></fzl-file-manager>

          <div class="action-panel">
            <span style="font-size: 0.9rem; color: #555;">
              Pronto para selecionar evidências e codificar os trechos dos documentos?
            </span>
            <md-filled-button href="#/codificacao">
              <md-icon slot="icon">edit_note</md-icon>
              Ir para Área de Codificação (Bardin)
            </md-filled-button>
          </div>
        </div>
      ` : ''}

      ${this.activeTab === 'upload' ? html`
        <div class="card">
          <div class="info-alert">
            📥 <strong>Upload Multiplataforma (Desktop &amp; Mobile):</strong>
            Arraste e solte arquivos ou use os seletores abaixo para carregar entrevistas e relatórios em
            <strong>Word (.docx com leitor nativo OOXML)</strong>, <strong>PDF</strong>, <strong>Markdown (.md)</strong>,
            <strong>TXT</strong> ou planilhas <strong>CSV/JSON</strong>. Os arquivos aceitos são adicionados automaticamente ao Corpus!
          </div>

          <fzl-document-picker
            mode="all"
            accept=".docx,.txt,.md,.pdf,.csv,.json"
            allow-folder-scan
            start-in="documents"
            @fzl-document-select=${this._handleDocumentSelect}
            @fzl-document-open-study=${(e) => {
              this._handleDocumentSelect(e)
              window.location.hash = '#/codificacao'
            }}
          ></fzl-document-picker>
        </div>
      ` : ''}

      ${this.activeTab === 'manual' ? html`
        <div class="form-box">
          <h3 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">
            Digitar ou Colar Nova Transcrição Manualmente
          </h3>
          <div class="form-group">
            <md-outlined-text-field
              label="Título do Documento / Entrevista"
              style="width: 100%;"
              .value=${this.newTitle}
              @input=${(e) => { this.newTitle = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;" class="form-group">
            <md-outlined-text-field
              label="Participante / Informante (ex.: Estudante 4, Aluno A)"
              style="flex: 1; min-width: 240px;"
              .value=${this.newParticipant}
              @input=${(e) => { this.newParticipant = e.target.value }}
            ></md-outlined-text-field>
            <md-outlined-text-field
              label="Pasta no Corpus (ex.: /entrevistas, /atas)"
              style="width: 220px;"
              .value=${this.newFolder}
              @input=${(e) => { this.newFolder = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-group">
            <md-outlined-text-field
              type="textarea"
              rows="6"
              label="Texto Transcrito Completo"
              style="width: 100%;"
              .value=${this.newContent}
              @input=${(e) => { this.newContent = e.target.value }}
            ></md-outlined-text-field>
          </div>

          <div style="display: flex; gap: 8px; justify-content: flex-end;">
            <md-outlined-button @click=${() => { this.activeTab = 'manager' }}>Cancelar</md-outlined-button>
            <md-filled-button @click=${this._handleSaveManualDoc}>Salvar no Corpus</md-filled-button>
          </div>
        </div>
      ` : ''}
    `
  }
}

customElements.define('caqdas-sources-view', CaqdasSourcesView)
