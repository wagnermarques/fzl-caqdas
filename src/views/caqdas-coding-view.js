import { LitElement, html, css } from 'lit'
import { authService } from 'fzl-fund-appshell--lit'
import { researchStorage } from '../services/storage-service.js'
import { CaqdasDocxCodingController, CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'
import '@fzl/webcomponents-lit/reader-chapterview'

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

    .editor-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #eee;
    }

    .zoom-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 4px;
      border: 1px solid #ccc;
      background: #fff;
      cursor: pointer;
      font-weight: bold;
    }

    .zoom-btn:hover {
      background: #f0f0f0;
    }

    .ur-chips-container {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 12px;
      padding: 10px;
      background: #f4f8f8;
      border-radius: 8px;
      border: 1px solid #e0eeee;
    }

    .ur-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 8px;
      background: #ffffff;
      border: 1px solid #c2dede;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      transition: all 0.15s ease;
    }

    .ur-chip:hover {
      background: #006a6a;
      color: #ffffff;
      border-color: #006a6a;
    }

    .btn-docs-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #e0f2fe;
      color: #0284c7;
      padding: 4px 10px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      font-size: 0.8rem;
      border: 1px solid #bae6fd;
    }

    .btn-docs-badge:hover {
      background: #bae6fd;
    }
  `

  static properties = {
    documents: { state: true },
    codes: { state: true },
    cloudConfig: { state: true },
    currentUser: { state: true },
    selectedDocId: { state: true },
    selectedText: { state: true },
    selectedCodeId: { state: true },
    selectedUrId: { state: true },
    showUrList: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this.codes = []
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this.currentUser = authService.getCurrentUser?.() || null
    this.selectedDocId = ''
    this.selectedText = ''
    this.selectedCodeId = ''
    this.selectedUrId = ''
    this.showUrList = true
    this.readerController = new CaqdasDocxCodingController(this, { fontSize: 16 })
    this.cloudController = new CaqdasPersonalCloudDocsController(this)
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadData()
    this.currentUser = authService.getCurrentUser?.() || null
    this.cloudConfig = researchStorage.getCloudSyncConfig()
    this._unsubscribeAuth = authService.subscribe((user, reason) => {
      if (reason === 'socialAuthConfig') return
      this.currentUser = user || null
      this.cloudConfig = researchStorage.getCloudSyncConfig()
      this.updateComplete.then(() => this._syncPersistenceChips())
    })
    this._onDataChanged = () => this._loadData()
    this._onCloudChanged = (e) => {
      this.cloudConfig = e.detail || researchStorage.getCloudSyncConfig()
      this.requestUpdate()
      this.updateComplete.then(() => this._syncPersistenceChips())
    }
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
    window.addEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubscribeAuth?.()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
    window.removeEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
  }

  firstUpdated() {
    this._syncPersistenceChips()
  }

  updated() {
    this._syncPersistenceChips()
  }

  _syncPersistenceChips() {
    const chapterGroup = this.shadowRoot?.querySelector('fzl-reader-chapterview-group') || null
    const chapterViews = Array.from(this.shadowRoot?.querySelectorAll('fzl-reader-chapterview') || [])
    this.cloudController.configurePersistenceComponents({
      chapterViewGroup: chapterGroup,
      chapterViews
    })
  }

  _getProviderLabel(provider) {
    switch (provider) {
      case 'google-drive':
        return 'Google Drive'
      case 'onedrive':
        return 'OneDrive'
      case 'local':
        return 'Armazenamento Local'
      case 'rest':
        return 'REST Customizado'
      default:
        return provider || 'Armazenamento Local'
    }
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
    this._syncReaderDoc()
  }

  _syncReaderDoc() {
    const doc = this.documents.find((d) => d.id === this.selectedDocId)
    if (doc) {
      this.readerController.openDocument({
        id: doc.id,
        name: doc.title,
        category: doc.type === 'docx' ? 'docx' : doc.type === 'pdf' ? 'pdf' : 'text',
        extension: doc.extension || (doc.type === 'docx' ? '.docx' : '.txt'),
        textContent: doc.content || '',
        blocks: doc.docxBlocks || undefined
      })
    }
  }

  _selectDoc(id) {
    this.selectedDocId = id
    this.selectedText = ''
    this.selectedUrId = ''
    this._syncReaderDoc()
  }

  _selectRegistrationUnit(ur) {
    this.selectedUrId = ur.urId
    this.selectedText = ur.text
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
    const isAuthenticated = researchStorage.isCloudAuthenticated(this.currentUser)
    const activeProvider = researchStorage.getEffectivePersistenceProvider(this.currentUser)
    const isCloudActive = isAuthenticated && activeProvider !== 'local'
    const homeDirName = researchStorage.getHomeDirName()
    const persistenceChipColor = isCloudActive ? '#0284c7' : '#475569'
    const persistenceChipLabel = isCloudActive
      ? `☁️ ${this._getProviderLabel(activeProvider)} · /${homeDirName}`
      : `💾 Local (Navegador) · /${homeDirName}`
    const docSyncState = researchStorage.getDocumentSyncState(doc)
    const docSyncChip =
      docSyncState === 'syncing'
        ? { color: '#d97706', label: '🔄 Sincronizando...' }
        : docSyncState === 'synced'
          ? { color: '#0284c7', label: '☁️ Sincronizado' }
          : { color: '#64748b', label: '💾 Local' }
    const docFolder = researchStorage.formatPersistenceFolder(
      doc?.folder || (doc?.type === 'interview' ? 'entrevistas' : 'documentos')
    )
    const urs = this.readerController.toRegistrationUnits()
    const urChipItems = urs.map((ur) => ({
      id: ur.urId,
      value: ur.urId,
      label: ur.label,
      count: ur.wordCount,
      color: '#006a6a'
    }))

    return html`
      <div>
        <h1>Área de Codificação Qualitativa (Open & Thematic Coding)</h1>
        <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
          Selecione o texto com o cursor do mouse e vincule-o aos conceitos e categorias da pesquisa.
        </p>
      </div>

      <div style="margin-top: 16px; display: flex; align-items: center; flex-wrap: wrap; gap: 12px;">
        <label style="font-weight: 500;">Documento:</label>
        <select
          style="padding: 8px 12px; border-radius: 8px; border: 1px solid #ccc; font-size: 0.95rem;"
          .value=${this.selectedDocId}
          @change=${(e) => this._selectDoc(e.target.value)}
        >
          ${this.documents.map(d => html`
            <option value=${d.id} ?selected=${d.id === this.selectedDocId}>${d.title} (${d.participant})</option>
          `)}
        </select>

        <fzl-reader-chapterview
          variant="pill"
          color=${persistenceChipColor}
          selected
          data-storage-provider=${activeProvider}
          data-home-dir=${homeDirName}
          label=${persistenceChipLabel}
          @fzl-click=${() => {
            window.location.hash = '#/fontes'
          }}
        ></fzl-reader-chapterview>

        ${doc
          ? html`
              <fzl-reader-chapterview
                variant="pill"
                color=${docSyncChip.color}
                selected
                data-sync-state=${docSyncState}
                label=${docSyncChip.label}
                @fzl-click=${() => {
                  window.location.hash = '#/fontes'
                }}
              ></fzl-reader-chapterview>
            `
          : ''}
      </div>

      <div class="layout">
        <div class="editor-card">
          <div class="editor-toolbar">
            <div>
              <h2 style="margin: 0; font-size: 1.25rem; color: var(--md-sys-color-on-surface, #1c1b1f);">
                ${doc?.title || 'Selecione um documento'}
              </h2>
              <div style="font-size: 0.82rem; color: #666; margin-top: 4px;">
                Participante: <strong>${doc?.participant || 'N/A'}</strong> | Pasta: <code>${docFolder}</code>
                | Palavras: <strong>${this.readerController.document?.wordCount || doc?.content?.split(/\s+/).length || 0}</strong>
              </div>
            </div>

            <div style="display: flex; align-items: center; gap: 8px;">
              ${doc?.externalViewerUrl
                ? html`
                    <a class="btn-docs-badge" href=${doc.externalViewerUrl} target="_blank" rel="noopener noreferrer">
                      <md-icon style="font-size: 14px;">open_in_new</md-icon>
                      ${doc.externalViewerLabel || 'Abrir no Google Docs ↗'}
                    </a>
                  `
                : ''}

              <span style="font-size: 0.8rem; color: #555;">Fonte: ${this.readerController.fontSize}px</span>
              <button class="zoom-btn" title="Diminuir fonte" @click=${() => this.readerController.zoomOut()}>-</button>
              <button class="zoom-btn" title="Aumentar fonte" @click=${() => this.readerController.zoomIn()}>+</button>
            </div>
          </div>

          <!-- Unidades de Registro de Bardin (URs) via <fzl-reader-chapterview-group> e <fzl-reader-chapterview> -->
          <div class="ur-chips-container">
            <span style="font-size: 0.78rem; font-weight: 600; color: #004d40; width: 100%;">
              Unidades de Registro (Bardin) — clique em uma UR para selecioná-la inteira para codificação:
            </span>
            <fzl-reader-chapterview-group
              aria-label="Unidades de Registro de Bardin"
              selection-mode="single"
              data-storage-provider=${activeProvider}
              data-home-dir=${homeDirName}
              .items=${urChipItems}
              .selected=${this.selectedUrId}
              @fzl-change=${(e) => {
                const urId = e.detail?.selected || e.detail?.value
                const match = urs.find((u) => u.urId === urId)
                if (match) {
                  this._selectRegistrationUnit(match)
                } else {
                  this.selectedUrId = ''
                }
              }}
            ></fzl-reader-chapterview-group>
          </div>

          <div
            class="document-text-container"
            style="font-size: ${this.readerController.fontSize}px;"
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
