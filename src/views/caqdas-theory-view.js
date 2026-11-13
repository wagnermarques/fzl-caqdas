import { LitElement, html, css } from 'lit'
import { researchStorage } from '../services/storage-service.js'
import { BARDIN_THEORY_FRAMEWORK, BARDIN_VIDEO_NOTES } from '../services/bardin-theory-data.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/textfield/outlined-text-field.js'

export class CaqdasTheoryView extends LitElement {
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

    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
    }

    h1 {
      margin: 0 0 8px 0;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.65rem;
    }

    .scope-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      background: #e0f2f1;
      color: #004d40;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 0.9rem;
      margin-top: 12px;
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
      margin-bottom: 16px;
    }

    .quote-classic {
      border-left: 4px solid var(--md-sys-color-primary, #006a6a);
      background: #f5fafa;
      padding: 14px 18px;
      border-radius: 0 8px 8px 0;
      font-style: italic;
      line-height: 1.6;
      margin: 12px 0;
    }

    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 16px;
    }

    .pill {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 0.78rem;
      font-weight: 600;
      background: #e8f5e9;
      color: #1b5e20;
    }

    .pill-muted {
      background: #eceff1;
      color: #455a64;
    }

    .pill-phase {
      background: #e0f2f1;
      color: #00695c;
    }

    .rule-item {
      background: #fafafa;
      border: 1px solid #ececec;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
      font-size: 0.92rem;
    }

    th, td {
      border: 1px solid #e0e0e0;
      padding: 10px 12px;
      text-align: left;
      vertical-align: top;
    }

    th {
      background: #f4f7f7;
      font-weight: 600;
      color: #1f2929;
    }

    .source-card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 14px;
    }

    .source-card.selected {
      border-left: 5px solid var(--md-sys-color-primary, #006a6a);
      background: #fcffff;
    }

    .abnt-box {
      background: #f6f8fa;
      border: 1px solid #e1e4e8;
      padding: 10px 12px;
      border-radius: 8px;
      font-family: Georgia, 'Times New Roman', serif;
      font-size: 0.92rem;
      line-height: 1.5;
      margin: 10px 0;
    }

    .note-card {
      background: #fffef5;
      border: 1px solid #f0e6a8;
      border-radius: 12px;
      padding: 18px;
      margin-bottom: 14px;
    }

    .note-citation {
      margin-top: 10px;
      padding-top: 8px;
      border-top: 1px dashed #dfd490;
      font-size: 0.85rem;
      color: #5d4037;
    }

    .form-box {
      background: #f8fafa;
      border: 1px dashed var(--md-sys-color-primary, #006a6a);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 20px;
    }

    .form-row {
      margin-bottom: 12px;
    }

    a.ext-link {
      color: var(--md-sys-color-primary, #006a6a);
      font-weight: 500;
      text-decoration: none;
    }

    a.ext-link:hover {
      text-decoration: underline;
    }
  `

  static properties = {
    activeTab: { state: true },
    sources: { state: true },
    notes: { state: true },
    isAddingSource: { state: true },
    isAddingNote: { state: true },
    copiedId: { state: true },
    newSourceShortRef: { state: true },
    newSourceType: { state: true },
    newSourceAccess: { state: true },
    newSourceAbnt: { state: true },
    newSourceUrl: { state: true },
    newSourceSummary: { state: true },
    newNoteTitle: { state: true },
    newNotePhase: { state: true },
    newNoteSourceId: { state: true },
    newNoteCustomCitation: { state: true },
    newNoteContent: { state: true }
  }

  constructor() {
    super()
    this.activeTab = 'fases'
    this.sources = []
    this.notes = []
    this.isAddingSource = false
    this.isAddingNote = false
    this.copiedId = ''

    this.newSourceShortRef = ''
    this.newSourceType = 'Artigo Metodológico (Acesso Aberto)'
    this.newSourceAccess = 'Acesso Aberto'
    this.newSourceAbnt = ''
    this.newSourceUrl = ''
    this.newSourceSummary = ''

    this.newNoteTitle = ''
    this.newNotePhase = 'Pré-Análise'
    this.newNoteSourceId = ''
    this.newNoteCustomCitation = ''
    this.newNoteContent = ''
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadTheoryData()
    this._onTheoryChanged = () => this._loadTheoryData()
    window.addEventListener('caqdas-theory-changed', this._onTheoryChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('caqdas-theory-changed', this._onTheoryChanged)
  }

  _loadTheoryData() {
    this.sources = researchStorage.getOpenAccessSources()
    this.notes = researchStorage.getTheoreticalNotes()
    if (!this.newNoteSourceId && this.sources.length > 0) {
      this.newNoteSourceId = this.sources[0].id
    }
  }

  _toggleSource(id) {
    researchStorage.toggleSourceSelection(id)
  }

  async _copyCitation(source) {
    try {
      await navigator.clipboard.writeText(source.abntCitation)
      this.copiedId = source.id
      setTimeout(() => {
        if (this.copiedId === source.id) this.copiedId = ''
      }, 2000)
    } catch {
      alert(source.abntCitation)
    }
  }

  _saveNewSource() {
    if (!this.newSourceShortRef.trim() || !this.newSourceAbnt.trim()) {
      alert('Informe a referência curta e a citação completa (ABNT) da fonte.')
      return
    }
    researchStorage.addSource({
      shortRef: this.newSourceShortRef.trim(),
      type: this.newSourceType,
      accessStatus: this.newSourceAccess.trim() || 'Acesso Aberto',
      abntCitation: this.newSourceAbnt.trim(),
      url: this.newSourceUrl.trim(),
      summary: this.newSourceSummary.trim(),
      contributionsToSoftware: 'Adicionada durante o estudo teórico.',
      selectedForFramework: true
    })
    this.newSourceShortRef = ''
    this.newSourceAbnt = ''
    this.newSourceUrl = ''
    this.newSourceSummary = ''
    this.isAddingSource = false
  }

  _saveNewNote() {
    if (!this.newNoteTitle.trim() || !this.newNoteContent.trim()) {
      alert('Preencha o título e o conteúdo da anotação de estudo.')
      return
    }
    const chosenSource = this.sources.find(s => s.id === this.newNoteSourceId)
    const citationText = this.newNoteCustomCitation.trim() || chosenSource?.abntCitation || ''
    if (!citationText) {
      alert('Selecione uma fonte ou preencha a citação bibliográfica da anotação.')
      return
    }
    researchStorage.addTheoreticalNote({
      title: this.newNoteTitle.trim(),
      phase: this.newNotePhase,
      content: this.newNoteContent.trim(),
      sourceId: chosenSource?.id || '',
      citationText
    })
    this.newNoteTitle = ''
    this.newNoteCustomCitation = ''
    this.newNoteContent = ''
    this.isAddingNote = false
  }

  _deleteNote(id) {
    researchStorage.removeTheoreticalNote(id)
  }

  _renderTabFases() {
    const fw = BARDIN_THEORY_FRAMEWORK
    return html`
      <div class="card">
        <h2 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">
          Definição Clássica — ${fw.author}
        </h2>
        <div class="quote-classic">${fw.classicDefinition}</div>

        <h3 style="margin: 18px 0 10px 0;">Modalidades da Análise de Conteúdo</h3>
        <div class="grid-2">
          ${fw.modalities.map(m => html`
            <div class="rule-item">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 8px; margin-bottom: 4px;">
                <strong>${m.name}</strong>
                <span class="pill pill-phase">${m.usage}</span>
              </div>
              <div style="font-size: 0.9rem; color: #444;">${m.description}</div>
            </div>
          `)}
        </div>
      </div>

      ${fw.phases.map(phase => html`
        <div class="card">
          <h2 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">${phase.title}</h2>
          <p style="margin: 0 0 14px 0; color: #444;">${phase.objective}</p>

          <div class="grid-2">
            <div>
              <h4 style="margin: 0 0 8px 0;">Etapas Operacionais</h4>
              ${phase.steps.map(st => html`
                <div class="rule-item">
                  <strong>${st.name}</strong>
                  <div style="font-size: 0.9rem; color: #444; margin-top: 4px;">${st.detail}</div>
                </div>
              `)}
            </div>

            <div>
              <h4 style="margin: 0 0 8px 0;">${phase.rulesTitle}</h4>
              ${phase.rules.map(r => html`
                <div class="rule-item" style="background: #f4f9f9; border-color: #d6e9e8;">
                  <strong style="color: #005b5b;">${r.name}</strong>
                  <div style="font-size: 0.9rem; color: #333; margin-top: 4px;">${r.description}</div>
                </div>
              `)}
            </div>
          </div>
        </div>
      `)}
    `
  }

  _renderTabVideo() {
    const v = BARDIN_VIDEO_NOTES
    return html`
      <div class="card">
        <h2 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">
          Vídeo Principal: ${v.mainVideo.title}
        </h2>
        <div style="font-size: 0.9rem; color: #555; margin-bottom: 10px;">
          Canal: <strong>${v.mainVideo.channel}</strong> | Duração: <strong>${v.mainVideo.duration}</strong> |
          <a class="ext-link" href="${v.mainVideo.url}" target="_blank" rel="noopener noreferrer">Abrir vídeo no YouTube ↗</a>
        </div>

        <div class="abnt-box">
          <strong>Citação ABNT:</strong> ${v.mainVideo.abntCitation}
        </div>

        <h3 style="margin: 16px 0 8px 0;">Pontos-Chave Extraídos do Vídeo</h3>
        <ul style="line-height: 1.6; padding-left: 20px; margin: 0;">
          ${v.keyTakeaways.map(item => html`<li>${item}</li>`)}
        </ul>
      </div>

      ${v.examples.map(ex => html`
        <div class="card">
          <h3 style="margin-top: 0; color: #005b5b;">${ex.title}</h3>
          <p style="margin: 0 0 12px 0; color: #444;">${ex.context}</p>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                <th>Códigos / Subcategorias</th>
                <th style="width: 110px;">Freq. (n)</th>
                <th style="width: 90px;">%</th>
                <th>Excerto / Observação</th>
              </tr>
            </thead>
            <tbody>
              ${ex.findings.map(f => html`
                <tr>
                  <td><strong>${f.category}</strong></td>
                  <td>${f.codes.join(', ')}</td>
                  <td>${f.frequency}</td>
                  <td>${f.percentage}</td>
                  <td><em>${f.quote}</em></td>
                </tr>
              `)}
            </tbody>
          </table>
        </div>
      `)}

      <div class="card">
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <h3 style="margin: 0; color: var(--md-sys-color-primary, #006a6a);">
            Playlist Associada (${v.playlistVideos.length} vídeos)
          </h3>
          <a class="ext-link" href="${v.playlistUrl}" target="_blank" rel="noopener noreferrer">
            Abrir playlist completa no YouTube ↗
          </a>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">#</th>
              <th>Título do Vídeo</th>
              <th>Foco Metodológico no Projeto</th>
              <th style="width: 110px;">Link</th>
            </tr>
          </thead>
          <tbody>
            ${v.playlistVideos.map(pv => html`
              <tr>
                <td>${pv.order}</td>
                <td>${pv.title}</td>
                <td>${pv.focus}</td>
                <td>
                  <a class="ext-link" href="https://www.youtube.com/watch?v=${pv.id}&list=PLKL-OaADMnAh-bbrCwTb5SQTpjbCN6Zse" target="_blank" rel="noopener noreferrer">
                    Assistir ↗
                  </a>
                </td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `
  }

  _renderTabFontes() {
    const selectedCount = this.sources.filter(s => s.selectedForFramework).length
    return html`
      <div class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="margin: 0 0 4px 0; color: var(--md-sys-color-primary, #006a6a);">
            Catálogo de Fontes & Seleção do Framework Teórico
          </h2>
          <div style="font-size: 0.92rem; color: #555;">
            <strong>${selectedCount}</strong> de <strong>${this.sources.length}</strong> fontes selecionadas para fundamentar o software <code>fzl-caqdas</code>.
          </div>
        </div>

        <md-filled-button @click=${() => { this.isAddingSource = !this.isAddingSource }}>
          <md-icon slot="icon">${this.isAddingSource ? 'close' : 'add'}</md-icon>
          ${this.isAddingSource ? 'Cancelar' : 'Adicionar Nova Fonte'}
        </md-filled-button>
      </div>

      ${this.isAddingSource ? html`
        <div class="form-box">
          <h3 style="margin-top: 0; color: #006a6a;">Cadastrar Nova Fonte Teórica</h3>
          <div class="form-row">
            <md-outlined-text-field
              label="Referência Curta (ex.: FRANCO, 2018)"
              style="width: 100%;"
              .value=${this.newSourceShortRef}
              @input=${e => { this.newSourceShortRef = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-row" style="display: flex; gap: 12px; flex-wrap: wrap;">
            <select
              style="padding: 10px; border-radius: 8px; border: 1px solid #999;"
              .value=${this.newSourceType}
              @change=${e => { this.newSourceType = e.target.value }}
            >
              <option value="Artigo Metodológico (Acesso Aberto)">Artigo Metodológico (Acesso Aberto)</option>
              <option value="Livro Base">Livro Base</option>
              <option value="Vídeo Aula">Vídeo Aula</option>
              <option value="Artigo Exemplo Prático">Artigo Exemplo Prático</option>
            </select>
            <md-outlined-text-field
              label="URL / DOI de Acesso"
              style="flex: 1; min-width: 260px;"
              .value=${this.newSourceUrl}
              @input=${e => { this.newSourceUrl = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-row">
            <md-outlined-text-field
              type="textarea"
              rows="2"
              label="Citação Completa (Formato ABNT)"
              style="width: 100%;"
              .value=${this.newSourceAbnt}
              @input=${e => { this.newSourceAbnt = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-row">
            <md-outlined-text-field
              type="textarea"
              rows="2"
              label="Resumo e Contribuição para o Framework"
              style="width: 100%;"
              .value=${this.newSourceSummary}
              @input=${e => { this.newSourceSummary = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <md-outlined-button @click=${() => { this.isAddingSource = false }}>Cancelar</md-outlined-button>
            <md-filled-button @click=${this._saveNewSource}>Salvar Fonte</md-filled-button>
          </div>
        </div>
      ` : ''}

      ${this.sources.map(src => html`
        <div class="source-card ${src.selectedForFramework ? 'selected' : ''}">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap;">
              <strong style="font-size: 1.05rem;">${src.shortRef}</strong>
              <span class="pill pill-phase">${src.type}</span>
              <span class="pill ${src.selectedForFramework ? '' : 'pill-muted'}">
                ${src.selectedForFramework ? 'Adotada no Framework' : 'Não Selecionada'}
              </span>
              <span style="font-size: 0.85rem; color: #555;">${src.accessStatus}</span>
            </div>

            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
              <md-outlined-button @click=${() => this._copyCitation(src)}>
                <md-icon slot="icon">content_copy</md-icon>
                ${this.copiedId === src.id ? 'Copiado!' : 'Copiar ABNT'}
              </md-outlined-button>
              <md-outlined-button @click=${() => this._toggleSource(src.id)}>
                <md-icon slot="icon">${src.selectedForFramework ? 'check_box' : 'check_box_outline_blank'}</md-icon>
                ${src.selectedForFramework ? 'Remover do Núcleo' : 'Adotar no Núcleo'}
              </md-outlined-button>
            </div>
          </div>

          <div class="abnt-box">${src.abntCitation}</div>

          <div style="font-size: 0.93rem; color: #333; line-height: 1.5; margin-bottom: 6px;">
            ${src.summary}
          </div>
          <div style="font-size: 0.88rem; color: #005b5b;">
            <strong>Aplicação no Software:</strong> ${src.contributionsToSoftware}
          </div>

          ${src.url ? html`
            <div style="margin-top: 8px;">
              <a class="ext-link" href="${src.url}" target="_blank" rel="noopener noreferrer">Acessar fonte original ↗</a>
            </div>
          ` : ''}
        </div>
      `)}
    `
  }

  _renderTabCaderno() {
    return html`
      <div class="card" style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
        <div>
          <h2 style="margin: 0 0 4px 0; color: var(--md-sys-color-primary, #006a6a);">
            Caderno de Anotações de Estudo da Teoria (${this.notes.length})
          </h2>
          <div style="font-size: 0.92rem; color: #555;">
            Toda anotação registrada aqui vincula obrigatoriamente a fonte citada e permanece isolada dos dados empíricos e do manual do usuário.
          </div>
        </div>

        <md-filled-button @click=${() => { this.isAddingNote = !this.isAddingNote }}>
          <md-icon slot="icon">${this.isAddingNote ? 'close' : 'note_add'}</md-icon>
          ${this.isAddingNote ? 'Cancelar' : 'Nova Anotação Teórica'}
        </md-filled-button>
      </div>

      ${this.isAddingNote ? html`
        <div class="form-box">
          <h3 style="margin-top: 0; color: #006a6a;">Registrar Anotação de Estudo (Com Fonte Obrigatória)</h3>
          <div class="form-row">
            <md-outlined-text-field
              label="Título da Anotação Teórica"
              style="width: 100%;"
              .value=${this.newNoteTitle}
              @input=${e => { this.newNoteTitle = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-row" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: center;">
            <label style="font-weight: 500;">Fase de Bardin:</label>
            <select
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid #999;"
              .value=${this.newNotePhase}
              @change=${e => { this.newNotePhase = e.target.value }}
            >
              <option value="Pré-Análise">Pré-Análise</option>
              <option value="Exploração do Material">Exploração do Material</option>
              <option value="Tratamento & Inferência">Tratamento & Inferência</option>
              <option value="Epistemologia Geral">Epistemologia Geral</option>
            </select>

            <label style="font-weight: 500;">Fonte Vinculada:</label>
            <select
              style="padding: 8px 12px; border-radius: 8px; border: 1px solid #999; flex: 1; min-width: 240px;"
              .value=${this.newNoteSourceId}
              @change=${e => { this.newNoteSourceId = e.target.value }}
            >
              ${this.sources.map(s => html`
                <option value=${s.id} ?selected=${s.id === this.newNoteSourceId}>${s.shortRef} — ${s.type}</option>
              `)}
            </select>
          </div>
          <div class="form-row">
            <md-outlined-text-field
              label="Citação específica (opcional: sobrescreve ou inclui página, ex.: BARDIN, 2011, p. 125)"
              style="width: 100%;"
              .value=${this.newNoteCustomCitation}
              @input=${e => { this.newNoteCustomCitation = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div class="form-row">
            <md-outlined-text-field
              type="textarea"
              rows="4"
              label="Síntese teórica e implicação para o software"
              style="width: 100%;"
              .value=${this.newNoteContent}
              @input=${e => { this.newNoteContent = e.target.value }}
            ></md-outlined-text-field>
          </div>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <md-outlined-button @click=${() => { this.isAddingNote = false }}>Cancelar</md-outlined-button>
            <md-filled-button @click=${this._saveNewNote}>Salvar Anotação</md-filled-button>
          </div>
        </div>
      ` : ''}

      ${this.notes.map(note => html`
        <div class="note-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap;">
            <div>
              <strong style="font-size: 1.05rem; color: #3e2723;">${note.title}</strong>
              <div style="margin-top: 4px; display: flex; gap: 8px; align-items: center;">
                <span class="pill pill-phase">${note.phase}</span>
                <span style="font-size: 0.82rem; color: #6d4c41;">Data: ${note.createdDate}</span>
              </div>
            </div>
            <md-outlined-button @click=${() => this._deleteNote(note.id)}>
              <md-icon slot="icon">delete</md-icon>
              Remover
            </md-outlined-button>
          </div>

          <p style="margin: 12px 0 0 0; line-height: 1.6; color: #333;">${note.content}</p>

          <div class="note-citation">
            <strong>Fonte citada:</strong> ${note.citationText}
          </div>
        </div>
      `)}

      <div class="card">
        <h3 style="margin-top: 0; color: var(--md-sys-color-primary, #006a6a);">
          Matriz de Tradução: Conceito de Bardin → Requisito no Software fzl-caqdas
        </h3>
        <table>
          <thead>
            <tr>
              <th style="width: 30%;">Construto / Etapa de Bardin</th>
              <th>Requisito Funcional Direcionado no Software</th>
            </tr>
          </thead>
          <tbody>
            ${BARDIN_THEORY_FRAMEWORK.softwareMapping.map(row => html`
              <tr>
                <td><strong>${row.bardinConcept}</strong></td>
                <td>${row.softwareRequirement}</td>
              </tr>
            `)}
          </tbody>
        </table>
      </div>
    `
  }

  render() {
    return html`
      <div class="header-box">
        <div class="header-top">
          <div>
            <h1>Fundamentação Teórica — Análise de Conteúdo (Bardin)</h1>
            <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
              Base metodológica, fichamento de referências e citações para guiar a construção do framework <strong>fzl-caqdas</strong>.
            </p>
          </div>
        </div>

        <div class="scope-banner">
          <span>
            📚 <strong>Acervo Teórico Isolado:</strong> Estas anotações de estudo ficam separadas da documentação operacional de uso do aplicativo.
          </span>
          <a class="ext-link" href="#/documentacao-app">Ir para Documentação de Uso do App →</a>
        </div>
      </div>

      <div class="tabs-bar">
        <button class="tab-btn ${this.activeTab === 'fases' ? 'active' : ''}" @click=${() => { this.activeTab = 'fases' }}>
          <md-icon>menu_book</md-icon>
          3 Fases & Regras de Bardin
        </button>
        <button class="tab-btn ${this.activeTab === 'video' ? 'active' : ''}" @click=${() => { this.activeTab = 'video' }}>
          <md-icon>ondemand_video</md-icon>
          Vídeo & Playlist (3fvAcOrcr5Y)
        </button>
        <button class="tab-btn ${this.activeTab === 'fontes' ? 'active' : ''}" @click=${() => { this.activeTab = 'fontes' }}>
          <md-icon>library_books</md-icon>
          Fontes Abertas & Citações ABNT
        </button>
        <button class="tab-btn ${this.activeTab === 'caderno' ? 'active' : ''}" @click=${() => { this.activeTab = 'caderno' }}>
          <md-icon>edit_note</md-icon>
          Caderno de Estudo & Mapeamento
        </button>
      </div>

      ${this.activeTab === 'fases' ? this._renderTabFases() : ''}
      ${this.activeTab === 'video' ? this._renderTabVideo() : ''}
      ${this.activeTab === 'fontes' ? this._renderTabFontes() : ''}
      ${this.activeTab === 'caderno' ? this._renderTabCaderno() : ''}
    `
  }
}

customElements.define('caqdas-theory-view', CaqdasTheoryView)
