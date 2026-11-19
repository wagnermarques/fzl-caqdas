import { LitElement, html, css } from 'lit'
import { authService } from 'fzl-fund-appshell--lit'
import { researchStorage, getPersistenceProviderLabel } from '../services/storage-service.js'
import { userData } from '../services/user-data-service.js'
import { takeReadingRequest } from '../services/reading-intent.js'
import { CaqdasDocxCodingController, CaqdasPersonalCloudDocsController } from '../controllers/caqdas-controllers.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'
import '@material/web/select/outlined-select.js'
import '@material/web/select/select-option.js'
import '@fzl/webcomponents-lit/reader-chapterview'
import '../components/caqdas-github-sync-panel.js'
import {
  anchorSelection,
  buildTextQuote,
  readerBlocksFromText,
  readerPlainText
} from '@fzl/webcomponents-lit/document-reader'

const READER_PREFS_KEY = 'reader_prefs_v1'
const DEFAULT_EXCERPT_COLOR = '#f9d65c'

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

    .reader-frame {
      height: min(78vh, 960px);
      min-height: 360px;
      margin-top: 12px;
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 10px;
      overflow: hidden;
    }

    .reader-frame fzl-document-reader {
      --fzl-reader-height: 100%;
    }

    .save-excerpt {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .aside-list {
      padding: 8px 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .aside-title {
      margin: 0;
      font-size: 0.95rem;
      color: var(--md-sys-color-primary, #006a6a);
    }

    .save-excerpt .popover-code {
      height: 26px;
      max-width: 160px;
      border-radius: 6px;
      border: 1px solid var(--md-sys-color-outline, #9e9e9e);
      font: inherit;
      font-size: 0.8rem;
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .save-excerpt input {
      height: 26px;
      width: clamp(120px, 22vw, 260px);
      padding: 0 8px;
      border-radius: 6px;
      border: 1px solid var(--md-sys-color-outline, #9e9e9e);
      font: inherit;
      font-size: 0.85rem;
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .tool-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 26px;
      padding: 0 8px;
      border-radius: 6px;
      border: 1px solid var(--md-sys-color-outline-variant, #ccc);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1c1b1f);
      font: inherit;
      font-size: 0.8rem;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
    }

    .tool-btn.primary {
      background: var(--md-sys-color-primary, #006a6a);
      border-color: var(--md-sys-color-primary, #006a6a);
      color: var(--md-sys-color-on-primary, #fff);
    }

    .tool-btn[disabled] {
      opacity: 0.5;
      cursor: default;
    }

    .tool-btn md-icon {
      font-size: 16px;
    }

    .selection-bar {
      margin-top: 12px;
      padding: 10px 12px;
      background: var(--md-sys-color-surface-container-low, #eef7f6);
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      font-size: 0.9rem;
    }

    .selection-bar .preview {
      flex: 1 1 240px;
      min-width: 0;
      font-style: italic;
      color: var(--md-sys-color-primary, #006a6a);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .excerpt-title {
      font-weight: 600;
      color: var(--md-sys-color-on-surface, #1c1b1f);
    }

    .excerpt-title input {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      padding: 4px 6px;
    }

    .excerpt-meta {
      font-size: 0.75rem;
      color: var(--md-sys-color-on-surface-variant, #666);
    }

    .link-btn {
      cursor: pointer;
      background: transparent;
      border: none;
      color: var(--md-sys-color-primary, #006a6a);
      font: inherit;
      font-size: 0.8rem;
      padding: 2px 4px;
    }

    .sidebar-actions {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
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

    .quote-list-item.active {
      border-color: var(--md-sys-color-primary, #006a6a);
      box-shadow: 0 0 0 1px var(--md-sys-color-primary, #006a6a);
    }

    .save-excerpt {
      padding: 6px;
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #ccc);
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
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

    .btn-local-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: #ecfdf5;
      color: #065f46;
      padding: 4px 10px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 0.8rem;
      border: 1px solid #a7f3d0;
      cursor: pointer;
      font-family: inherit;
    }

    .btn-local-badge:hover {
      background: #d1fae5;
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
    showUrList: { state: true },
    selectionAnchor: { state: true },
    excerptTitle: { state: true },
    editingExcerptId: { state: true },
    activeExcerptId: { state: true },
    readerPrefs: { state: true }
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
    this.selectionAnchor = null
    this.excerptTitle = ''
    this.editingExcerptId = ''
    this.activeExcerptId = ''
    this.readerPrefs = this._loadReaderPrefs()
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
    // Preferências de leitura são do usuário: recarrega ao trocar de conta.
    this._unsubscribeUserData = userData.subscribe(() => {
      this.readerPrefs = this._loadReaderPrefs()
    })
    this._onReadingRequest = () => this._applyReadingRequest()
    window.addEventListener('caqdas-reading-request', this._onReadingRequest)
    this._applyReadingRequest()
  }

  /** "Continuar Leitura" nas Fontes: abre o documento pedido, já em tela cheia. */
  async _applyReadingRequest() {
    const request = takeReadingRequest()
    if (!request || !this.documents.some((d) => d.id === request.docId)) return
    if (request.docId !== this.selectedDocId) this._selectDoc(request.docId)
    if (!request.fullscreen) return
    await this.updateComplete
    const reader = this.shadowRoot?.querySelector('fzl-document-reader')
    await reader?.updateComplete
    // Nativo quando o navegador ainda considera o clique recente; senão, modo imersivo.
    await reader?.enterFullscreen?.()
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    this._unsubscribeAuth?.()
    this._unsubscribeUserData?.()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
    window.removeEventListener('caqdas-cloud-sync-changed', this._onCloudChanged)
    window.removeEventListener('caqdas-reading-request', this._onReadingRequest)
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

  _loadData() {
    this.documents = researchStorage.getDocuments()
    this.codes = researchStorage.getCodes()
    if (!this.selectedDocId && this.documents.length > 0) {
      this.selectedDocId = this.documents[0].id
    }
    // Código é opcional: o trecho nasce só com título; um código removido deixa de valer.
    if (this.selectedCodeId && !this.codes.some((c) => c.id === this.selectedCodeId)) this.selectedCodeId = ''
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
    this._clearSelection()
    this.selectedUrId = ''
    this.editingExcerptId = ''
    this._syncReaderDoc()
  }

  _clearSelection() {
    this.selectedText = ''
    this.selectionAnchor = null
    this.excerptTitle = ''
    const reader = this._reader
    if (reader) {
      reader.pendingRange = null
      reader.clearSelection?.()
    }
  }

  // --- leitor ------------------------------------------------------------------------

  get _reader() {
    return this.shadowRoot?.querySelector('fzl-document-reader') || null
  }

  _loadReaderPrefs() {
    try {
      const raw = userData.getItem(READER_PREFS_KEY)
      const parsed = raw ? JSON.parse(raw) : {}
      return {
        fontSize: Number.isFinite(parsed.fontSize) ? parsed.fontSize : 18,
        readingWidth: parsed.readingWidth === 'wide' ? 'wide' : 'narrow'
      }
    } catch {
      return { fontSize: 18, readingWidth: 'narrow' }
    }
  }

  _handleReaderPrefs(e) {
    const { fontSize, readingWidth } = e.detail || {}
    this.readerPrefs = { fontSize, readingWidth }
    userData.setItem(READER_PREFS_KEY, JSON.stringify(this.readerPrefs))
  }

  /** Seleção feita no leitor (fzl-reader-selection): âncora W3C + trecho pendente visível. */
  _handleReaderSelection(e) {
    const { text, start, end, prefix, suffix, blockIndex, page, endPage } = e.detail || {}
    if (!text) return
    this.selectionAnchor = { text, start, end, prefix, suffix, blockIndex: blockIndex ?? null, page: page ?? null, endPage: endPage ?? null }
    this.selectedText = text
    this.selectedUrId = ''
    if (this._reader) this._reader.pendingRange = { start, end }
    // O foco no campo de título é feito pelo leitor (popover-autofocus).
  }

  _handleReaderSelectionClear() {
    // O leitor mantém a seleção enquanto o foco está no formulário; aqui ela sumiu de fato.
    if (this.excerptTitle.trim()) return
    this.selectedText = ''
    this.selectionAnchor = null
    if (this._reader) this._reader.pendingRange = null
  }

  /** Texto canônico do documento (o mesmo que reader.plainText), para ancorar os trechos. */
  _plainTextOf(doc) {
    if (!doc) return ''
    const blocks = Array.isArray(doc.docxBlocks) && doc.docxBlocks.length ? doc.docxBlocks : readerBlocksFromText(doc.content || '')
    return readerPlainText(blocks)
  }

  /** Reancora cada trecho no texto atual (posição, ou citação + contexto se o texto mudou). */
  _anchoredExcerpts(doc, excerpts, codeMap) {
    const plain = this._plainTextOf(doc)
    return excerpts.map((q) => {
      const pos = plain ? anchorSelection(plain, q) : null
      const code = q.codeId ? codeMap.get(q.codeId) : null
      return { q, pos, color: code?.color || DEFAULT_EXCERPT_COLOR }
    })
  }

  _selectRegistrationUnit(ur) {
    this.selectedUrId = ur.urId
    this.selectedText = ur.text
    const plain = String(this._reader?.plainText || '')
    const start = plain.indexOf(ur.text)
    if (start < 0) {
      this.selectionAnchor = { text: ur.text, start: null, end: null, prefix: '', suffix: '', blockIndex: null }
      return
    }
    const end = start + ur.text.length
    this.selectionAnchor = { ...buildTextQuote(plain, start, end), start, end, blockIndex: null }
    if (this._reader) this._reader.pendingRange = { start, end }
  }

  // --- trechos ------------------------------------------------------------------------

  _handleSaveExcerpt() {
    if (!this.selectedText || !this.selectionAnchor) {
      alert('Selecione primeiro um trecho do documento.')
      return
    }
    const title = this.excerptTitle.trim()
    if (!title) {
      alert('Dê um título ao trecho: do que ele trata?')
      this.shadowRoot?.querySelector('.save-excerpt input')?.focus()
      return
    }
    const saved = researchStorage.addQuotation(this.selectedDocId, {
      ...this.selectionAnchor,
      title,
      codeId: this.selectedCodeId || null
    })
    if (!saved) {
      alert('Não foi possível salvar o trecho.')
      return
    }
    this.activeExcerptId = saved.id
    this._clearSelection()
  }

  _handleSaveTitle(quoteId, value) {
    const title = String(value || '').trim()
    this.editingExcerptId = ''
    if (!title) return
    researchStorage.updateQuotation(this.selectedDocId, quoteId, { title })
  }

  _handleDeleteQuote(quote) {
    if (!confirm(`Remover o trecho "${quote.title || quote.text.slice(0, 40)}"?`)) return
    researchStorage.removeQuotation(this.selectedDocId, quote.id)
  }

  async _goToExcerpt(quote) {
    const reader = this._reader
    if (!reader) return
    this.activeExcerptId = quote.id
    await this.updateComplete
    const shown = await reader.scrollToAnnotation?.(quote.id)
    if (!shown) alert('Este trecho não foi encontrado no texto atual do documento.')
  }

  _handleAnnotationClick(e) {
    const id = e.detail?.id
    if (!id) return
    this.activeExcerptId = id
    this.updateComplete.then(() =>
      this._excerptElement(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    )
  }

  _exportExcerpts() {
    const payload = researchStorage.exportExcerpts()
    if (!payload.excerpts.length) {
      alert('Ainda não há trechos salvos para exportar.')
      return
    }
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `caqdas-trechos-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 10_000)
  }

  async _importExcerpts(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const result = researchStorage.importExcerpts(JSON.parse(await file.text()))
      alert(
        `Importação concluída: ${result.added} novo(s), ${result.updated} atualizado(s)` +
          (result.removed ? `, ${result.removed} removido(s)` : '') +
          (result.skipped ? `, ${result.skipped} ignorado(s) (documento não encontrado neste corpus).` : '.')
      )
    } catch (err) {
      alert(err?.message || 'Não foi possível ler o arquivo JSON.')
    }
  }

  /** Lista de trechos (usada na lateral da página e no painel do leitor em tela cheia). */
  _renderExcerptList(excerpts, codeMap, orphanIds, posById) {
    return excerpts.length === 0 ? html`
            <div style="color: #777; font-size: 0.9rem;">
              Nenhum trecho salvo neste documento ainda.
            </div>
          ` : excerpts.map(q => {
            const code = q.codeId ? codeMap.get(q.codeId) || { name: 'Código removido', color: '#999' } : null
            return html`
              <div
                class="quote-list-item ${this.activeExcerptId === q.id ? 'active' : ''}"
                data-excerpt-id=${q.id}
              >
                <div class="excerpt-title">
                  ${this.editingExcerptId === q.id
                    ? html`
                        <input
                          type="text"
                          aria-label="Título do trecho"
                          .value=${q.title}
                          @keydown=${(e) => {
                            if (e.key === 'Enter') this._handleSaveTitle(q.id, e.target.value)
                            if (e.key === 'Escape') this.editingExcerptId = ''
                          }}
                          @blur=${(e) => this._handleSaveTitle(q.id, e.target.value)}
                        />
                      `
                    : q.title || html`<span style="color: #999; font-weight: 400;">(sem título)</span>`}
                </div>
                <span class="quote-text">“${q.text}”</span>
                <div class="excerpt-meta">
                  ${orphanIds.has(q.id)
                    ? html`<strong style="color: #b45309;">não encontrado no texto atual</strong> · `
                    : html`${q.page ? `p. ${q.page}${q.endPage && q.endPage !== q.page ? `–${q.endPage}` : ''} · ` : ''}posição ${posById.get(q.id).start}–${posById.get(q.id).end} · `}${new Date(q.createdAt).getTime() > 0
                    ? new Date(q.createdAt).toLocaleString('pt-BR')
                    : ''}
                </div>
                <div class="quote-footer">
                  ${code
                    ? html`<span class="code-chip" style="background-color: ${code.color};">${code.name}</span>`
                    : html`<span></span>`}
                  <span>
                    <button class="link-btn" @click=${() => this._goToExcerpt(q)}>Ir para</button>
                    <button
                      class="link-btn"
                      @click=${async () => {
                        this.editingExcerptId = q.id
                        await this.updateComplete
                        this._excerptElement(q.id, '.excerpt-title input')?.focus()
                      }}
                    >
                      Renomear
                    </button>
                    <button class="remove-btn" @click=${() => this._handleDeleteQuote(q)}>Remover</button>
                  </span>
                </div>
              </div>
            `
          })
  }

  /** Item da lista que está à vista: o do painel do leitor em tela cheia, ou o da lateral. */
  _excerptElement(id, inner = '') {
    const scope = this._reader?.fullscreen ? '.aside-list' : '.sidebar-card'
    const sel = `${scope} [data-excerpt-id="${CSS.escape(id)}"] ${inner}`.trim()
    return this.shadowRoot?.querySelector(sel) || null
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
      ? `☁️ ${getPersistenceProviderLabel(activeProvider)} · /${homeDirName}`
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
    const excerpts = doc ? researchStorage.getDocumentExcerpts(doc.id) : []
    const anchored = this._anchoredExcerpts(doc, excerpts, codeMap)
    const annotations = anchored
      .filter((a) => a.pos)
      .map((a) => ({ id: a.q.id, start: a.pos.start, end: a.pos.end, color: a.color, title: a.q.title }))
    const orphanIds = new Set(anchored.filter((a) => !a.pos).map((a) => a.q.id))
    const posById = new Map(anchored.map((a) => [a.q.id, a.pos]))
    const blocks = Array.isArray(doc?.docxBlocks) && doc.docxBlocks.length ? doc.docxBlocks : null
    const wordCount = this.readerController.document?.wordCount || doc?.content?.split(/\s+/).filter(Boolean).length || 0

    return html`
      <div>
        <h1>Área de Codificação Qualitativa (Open & Thematic Coding)</h1>
        <p style="margin: 0; color: var(--md-sys-color-on-surface-variant, #49454f);">
          Selecione um trecho no leitor, dê um título a ele e salve. Use a tela cheia para ler com mais espaço.
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
            window.location.hash = '#/config/persistencia'
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
                  window.location.hash = '#/config/persistencia'
                }}
              ></fzl-reader-chapterview>
            `
          : ''}
      </div>

      <div class="layout">
        <div class="editor-card">
          <div class="excerpt-meta">
            Participante: <strong>${doc?.participant || 'N/A'}</strong> | Pasta: <code>${docFolder}</code>
            | Palavras: <strong>${wordCount}</strong>
          </div>

          ${urChipItems.length
            ? html`
                <!-- Unidades de Registro de Bardin (URs) via <fzl-reader-chapterview-group> -->
                <div class="ur-chips-container">
                  <span style="font-size: 0.78rem; font-weight: 600; color: #004d40; width: 100%;">
                    Unidades de Registro (Bardin) — clique em uma UR para selecioná-la inteira:
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
              `
            : ''}

          <div class="reader-frame">
            <fzl-document-reader
              compact
              popover-autofocus
              snap-to-words
              document-title=${doc?.title || ''}
              meta=${doc?.participant || ''}
              .text=${blocks ? '' : doc?.content || ''}
              .blocks=${blocks}
              .fontSize=${this.readerPrefs.fontSize}
              .readingWidth=${this.readerPrefs.readingWidth}
              .annotations=${annotations}
              active-annotation=${this.activeExcerptId}
              @fzl-reader-selection=${this._handleReaderSelection}
              @fzl-reader-selection-clear=${this._handleReaderSelectionClear}
              @fzl-reader-annotation-click=${this._handleAnnotationClick}
              @fzl-reader-preferences-change=${this._handleReaderPrefs}
            >
              <div slot="aside" class="aside-list">
                <h3 class="aside-title">Trechos (${excerpts.length})</h3>
                ${this._renderExcerptList(excerpts, codeMap, orphanIds, posById)}
              </div>
              ${html`
                    <form
                      slot="selection-popover"
                      class="save-excerpt"
                      @submit=${(e) => {
                        e.preventDefault()
                        this._handleSaveExcerpt()
                      }}
                    >
                      <input
                        type="text"
                        placeholder="Título do trecho…"
                        aria-label="Título do trecho selecionado"
                        .value=${this.excerptTitle}
                        @input=${(e) => {
                          this.excerptTitle = e.target.value
                        }}
                        @keydown=${(e) => {
                          if (e.key === 'Escape') this._clearSelection()
                        }}
                      />
                      ${this.codes.length
                        ? html`<select
                            class="popover-code"
                            aria-label="Código (opcional)"
                            title="Código de Bardin (opcional)"
                            .value=${this.selectedCodeId || ''}
                            @change=${(e) => {
                              this.selectedCodeId = e.target.value
                            }}
                          >
                            <option value="" ?selected=${!this.selectedCodeId}>— sem código —</option>
                            ${this.codes.map(
                              (c) => html`<option value=${c.id} ?selected=${c.id === this.selectedCodeId}>${c.name}</option>`
                            )}
                          </select>`
                        : ''}
                      <button type="submit" class="tool-btn primary" ?disabled=${!this.excerptTitle.trim()}>
                        <md-icon>bookmark_add</md-icon>Salvar
                      </button>
                      <button type="button" class="tool-btn" title="Cancelar (Esc)" @click=${() => this._clearSelection()}>
                        <md-icon>close</md-icon>
                      </button>
                    </form>
                  `}
              ${html`
                    ${doc && researchStorage.hasLocalDocument(doc)
                      ? html`
                          <button
                            slot="actions"
                            type="button"
                            class="tool-btn"
                            title="Abrir o arquivo original do dispositivo"
                            @click=${() => void researchStorage.openLocalDocument(doc)}
                          >
                            <md-icon>folder_open</md-icon>
                          </button>
                        `
                      : ''}
                    ${doc?.externalViewerUrl
                      ? html`
                          <a
                            slot="actions"
                            class="tool-btn"
                            href=${doc.externalViewerUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            title=${doc.externalViewerLabel || 'Abrir no Google Drive'}
                          >
                            <md-icon>open_in_new</md-icon>
                          </a>
                        `
                      : ''}
                  `}
              <span slot="empty">Nenhum conteúdo de texto disponível para este documento.</span>
            </fzl-document-reader>
          </div>

          <div class="selection-bar">
            <span class="preview">
              ${this.selectedText ? `“${this.selectedText}”` : 'Selecione um trecho no leitor com o mouse ou o teclado.'}
            </span>
            <label style="display: flex; align-items: center; gap: 6px;">
              Código (opcional):
              <select
                style="padding: 6px 10px; border-radius: 6px; border: 1px solid #bbb;"
                .value=${this.selectedCodeId}
                @change=${(e) => { this.selectedCodeId = e.target.value }}
              >
                <option value="" ?selected=${!this.selectedCodeId}>— sem código —</option>
                ${this.codes.map(c => html`
                  <option value=${c.id} ?selected=${c.id === this.selectedCodeId}>${c.name}</option>
                `)}
              </select>
            </label>
            ${this.selectedText
              ? html`<button type="button" class="link-btn" @click=${() => this._clearSelection()}>Cancelar</button>`
              : ''}
          </div>
        </div>

        <div class="sidebar-card">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--md-sys-color-primary, #006a6a);">
            Trechos deste documento (${excerpts.length})
          </h3>
          <div class="sidebar-actions">
            <button type="button" class="tool-btn" @click=${this._exportExcerpts} title="Baixar todos os trechos do projeto em JSON">
              <md-icon>download</md-icon>Exportar JSON
            </button>
            <label class="tool-btn" title="Importar trechos de um JSON exportado">
              <md-icon>upload</md-icon>Importar JSON
              <input type="file" accept="application/json,.json" hidden @change=${this._importExcerpts} />
            </label>
          </div>
          <caqdas-github-sync-panel compact style="margin: 4px 0 10px;"></caqdas-github-sync-panel>

          ${this._renderExcerptList(excerpts, codeMap, orphanIds, posById)}
        </div>
      </div>
    `
  }
}

customElements.define('caqdas-coding-view', CaqdasCodingView)
