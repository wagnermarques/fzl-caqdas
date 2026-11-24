import { LitElement, html, css } from 'lit'
import { openForReading } from '../services/reading-intent.js'
import {
  normalizeTipo,
  tipoLabel,
  buildLegislationDocId,
  decodeHtmlBytes,
  parseLegislationHtmlToBlocks,
  parseLegislationTextToBlocks,
  parseSearchQuery
} from '../services/legislation-utils.js'
import { LEGISLATION_CATALOG, searchCatalog } from '../services/legislation-catalog.js'
import {
  searchFederalLegislation,
  resolveLegislationByUrl,
  loadLegislationFullText,
  insertLegislationIntoCorpus
} from '../services/legislation-service.js'
import '@material/web/icon/icon.js'

const PNE_PLANALTO_URL = 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm'

export class CaqdasLegislationPanel extends LitElement {
  static styles = css`
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    :host {
      display: block;
      max-width: 100%;
      min-width: 0;
    }

    .panel-stack {
      display: flex;
      flex-direction: column;
      gap: 18px;
    }

    .card {
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e0e0e0);
      border-radius: 12px;
      padding: 20px;
      min-width: 0;
    }

    .card.highlight {
      border-color: var(--md-sys-color-primary, #006a6a);
      background: #f8fbfb;
    }

    .card h2 {
      margin: 0 0 6px 0;
      font-size: 1.12rem;
      color: var(--md-sys-color-primary, #006a6a);
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .card-desc {
      margin: 0 0 14px 0;
      font-size: 0.9rem;
      color: #49454f;
      line-height: 1.45;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
    }

    input[type='url'],
    input[type='text'],
    input[type='number'],
    select,
    textarea {
      font: inherit;
      font-size: 0.92rem;
      padding: 9px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1c1b1f;
      min-width: 0;
    }

    input[type='url']:focus,
    input[type='text']:focus,
    input[type='number']:focus,
    select:focus,
    textarea:focus {
      outline: 2px solid rgba(0, 106, 106, 0.25);
      border-color: var(--md-sys-color-primary, #006a6a);
    }

    .url-input {
      flex: 1 1 320px;
    }

    .search-input {
      flex: 1 1 260px;
    }

    .tipo-select {
      flex: 0 1 150px;
    }

    .ano-input {
      width: 105px;
    }

    .quick-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      font-size: 0.84rem;
      color: #555;
    }

    .chip-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 11px;
      border-radius: 999px;
      border: 1px solid #99d5d0;
      background: #e6f4f3;
      color: #00514e;
      font: inherit;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
    }

    .chip-btn:hover {
      background: #d1ece9;
    }

    .link-toggle-btn {
      background: none;
      border: none;
      padding: 0;
      color: var(--md-sys-color-primary, #006a6a);
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: underline;
      cursor: pointer;
    }

    .status-banner {
      margin-top: 12px;
      padding: 12px 14px;
      border-radius: 10px;
      font-size: 0.88rem;
      line-height: 1.45;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      border: 1px solid transparent;
    }

    .status-banner.ok {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }

    .status-banner.info {
      background: #eff6ff;
      border-color: #bfdbfe;
      color: #1e3a8a;
    }

    .status-banner.warn {
      background: #fffbeb;
      border-color: #fde68a;
      color: #92400e;
    }

    .status-banner.error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .ext-portals {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-top: 10px;
      font-size: 0.82rem;
      color: #475569;
    }

    .ext-link {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px 10px;
      border-radius: 8px;
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      color: #0f172a;
      text-decoration: none;
      font-weight: 500;
      font-size: 0.82rem;
    }

    .ext-link:hover {
      background: #e2e8f0;
    }

    .results-meta {
      margin-top: 12px;
      font-size: 0.84rem;
      color: #475569;
    }

    .results-list {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .law-item {
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      background: #fafcfc;
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
    }

    .law-item.featured {
      border-color: #99d5d0;
      background: #f2f9f8;
    }

    .law-info {
      flex: 1 1 420px;
      min-width: 0;
    }

    .law-title {
      font-weight: 700;
      color: #134e4a;
      font-size: 0.98rem;
      line-height: 1.35;
      margin-bottom: 4px;
    }

    .law-badges {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-bottom: 6px;
      font-size: 0.76rem;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 999px;
      font-weight: 600;
      background: #e2e8f0;
      color: #334155;
    }

    .badge.offline {
      background: #d1fae5;
      color: #065f46;
    }

    .badge.auto {
      background: #e0f2fe;
      color: #075985;
    }

    .badge.senado {
      background: #fef3c7;
      color: #92400e;
    }

    .badge.in-corpus {
      background: #006a6a;
      color: #fff;
    }

    .law-ementa {
      margin: 0;
      font-size: 0.87rem;
      color: #334155;
      line-height: 1.45;
    }

    .law-links {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 8px;
    }

    .law-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 8px;
      flex-shrink: 0;
    }

    @media (max-width: 680px) {
      .law-actions {
        align-items: flex-start;
        width: 100%;
      }
    }

    .action-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-primary, #006a6a);
      background: var(--md-sys-color-primary, #006a6a);
      color: #fff;
      font: inherit;
      font-size: 0.86rem;
      font-weight: 600;
      cursor: pointer;
      white-space: nowrap;
    }

    .action-btn.secondary {
      background: #fff;
      color: var(--md-sys-color-primary, #006a6a);
    }

    .action-btn:hover:not([disabled]) {
      filter: brightness(0.95);
    }

    .action-btn[disabled] {
      opacity: 0.6;
      cursor: default;
    }

    .action-btn md-icon {
      font-size: 18px;
    }

    .field-label {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #334155;
      margin-bottom: 12px;
    }

    .manual-textarea {
      width: 100%;
      min-height: 200px;
      resize: vertical;
      line-height: 1.45;
    }

    .file-upload-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1e293b;
      font: inherit;
      font-size: 0.85rem;
      font-weight: 600;
      cursor: pointer;
    }

    .file-upload-btn:hover {
      background: #f1f5f9;
    }
  `

  static properties = {
    documents: { type: Array },
    _urlInput: { state: true },
    _urlBusy: { state: true },
    _status: { state: true },
    _searchQuery: { state: true },
    _searchTipo: { state: true },
    _searchAno: { state: true },
    _searchBusy: { state: true },
    _searchResults: { state: true },
    _senadoQueried: { state: true },
    _senadoError: { state: true },
    _insertingKey: { state: true },
    _fallbackOpen: { state: true },
    _fallbackEntry: { state: true },
    _fallbackTitle: { state: true },
    _fallbackText: { state: true },
    _fallbackFileInfo: { state: true },
    _fallbackHtmlBlocks: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this._urlInput = ''
    this._urlBusy = false
    this._status = null
    this._searchQuery = ''
    this._searchTipo = ''
    this._searchAno = ''
    this._searchBusy = false
    this._searchResults = [...LEGISLATION_CATALOG]
    this._senadoQueried = false
    this._senadoError = ''
    this._insertingKey = ''
    this._fallbackOpen = false
    this._fallbackEntry = null
    this._fallbackTitle = ''
    this._fallbackText = ''
    this._fallbackFileInfo = ''
    this._fallbackHtmlBlocks = null
  }

  _entryKey(entry) {
    return entry?.id || entry?.docId || `${entry?.tipo || ''}-${entry?.numero || ''}-${entry?.ano || ''}`
  }

  _findDocInCorpus(entry) {
    const docs = Array.isArray(this.documents) ? this.documents : []
    if (!entry) return null
    const expectedId = entry.docId || buildLegislationDocId(entry)
    return (
      docs.find(
        (d) =>
          d.id === expectedId ||
          (entry.planaltoUrl && d.legislation?.planaltoUrl === entry.planaltoUrl) ||
          (entry.numero &&
            entry.tipo &&
            d.legislation?.numero === String(entry.numero) &&
            d.legislation?.tipo === normalizeTipo(entry.tipo) &&
            (!entry.ano || d.legislation?.ano === String(entry.ano)))
      ) || null
    )
  }

  _emitAdded(doc, entry) {
    this.dispatchEvent(
      new CustomEvent('caqdas-legislation-added', {
        detail: { doc, entry },
        bubbles: true,
        composed: true
      })
    )
  }

  _usePneUrl() {
    this._urlInput = PNE_PLANALTO_URL
    this._status = null
  }

  async _handleUrlSubmit(e) {
    e?.preventDefault?.()
    if (this._urlBusy) return
    const raw = String(this._urlInput || '').trim()
    if (!raw) {
      this._status = {
        kind: 'warn',
        text: 'Cole a URL oficial da lei (ex.: https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm).'
      }
      return
    }
    this._urlBusy = true
    this._status = { kind: 'info', text: 'Consultando metadados e texto oficial da legislação…' }
    try {
      const resolved = await resolveLegislationByUrl(raw)
      if (!resolved.ok) {
        this._status = { kind: 'error', text: resolved.error }
        return
      }
      await this._loadAndInsertEntry(resolved.entry)
    } finally {
      this._urlBusy = false
    }
  }

  async _loadAndInsertEntry(entry) {
    const key = this._entryKey(entry)
    this._insertingKey = key
    try {
      const res = await loadLegislationFullText(entry)
      if (!res.ok) {
        this._openFallbackForEntry(res.entry || entry, res.message)
        this._status = { kind: 'warn', text: res.message }
        return
      }
      const { doc, updatedExisting } = insertLegislationIntoCorpus({
        entry: res.entry || entry,
        blocks: res.blocks,
        plainText: res.plainText,
        loadedFrom: res.loadedFrom
      })
      this._fallbackOpen = false
      this._emitAdded(doc, res.entry || entry)
      const originLabel =
        res.loadedFrom === 'bundled'
          ? 'texto oficial embutido no app'
          : res.loadedFrom === 'camara'
            ? 'texto consolidado da Câmara dos Deputados'
            : 'fonte oficial'
      this._status = {
        kind: 'ok',
        docId: doc.id,
        text: updatedExisting
          ? `✔ "${doc.title}" atualizada no corpus (${res.blocks.length} blocos estruturados, ${originLabel}).`
          : `✔ "${doc.title}" adicionada ao corpus em ${doc.folder} (${res.blocks.length} blocos estruturados, ${originLabel}).`
      }
    } catch (err) {
      this._status = { kind: 'error', text: err?.message || 'Não foi possível inserir a legislação.' }
    } finally {
      this._insertingKey = ''
    }
  }

  _openFallbackForEntry(entry, infoMessage = '') {
    this._fallbackEntry = entry || null
    this._fallbackTitle = entry?.title || ''
    this._fallbackText = ''
    this._fallbackFileInfo = infoMessage || ''
    this._fallbackHtmlBlocks = null
    this._fallbackOpen = true
    void this.updateComplete.then(() => {
      this.shadowRoot?.querySelector('#fallback-card')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    })
  }

  _handleSearchInputChange(nextQuery = this._searchQuery, nextTipo = this._searchTipo, nextAno = this._searchAno) {
    this._searchQuery = nextQuery
    this._searchTipo = nextTipo
    this._searchAno = nextAno
    this._senadoQueried = false
    this._senadoError = ''
    this._searchResults = searchCatalog(nextQuery, { tipo: nextTipo, ano: nextAno })
  }

  async _handleSearchSubmit(e) {
    e?.preventDefault?.()
    const q = String(this._searchQuery || '').trim()
    const parsed = parseSearchQuery(q, { tipo: this._searchTipo, ano: this._searchAno })
    if (parsed.isUrl) {
      this._urlInput = q
      await this._handleUrlSubmit()
      return
    }
    this._searchBusy = true
    this._senadoError = ''
    try {
      const res = await searchFederalLegislation(q, { tipo: this._searchTipo, ano: this._searchAno })
      this._searchResults = res.results
      this._senadoQueried = res.senadoQueried
      this._senadoError = res.senadoError
    } finally {
      this._searchBusy = false
    }
  }

  async _handleFallbackFileUpload(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const buf = await file.arrayBuffer()
      const raw = decodeHtmlBytes(buf)
      const isHtml = /\.html?$/i.test(file.name) || /<\s*(?:html|body|p|div)\b/i.test(raw)
      const parsed = isHtml ? parseLegislationHtmlToBlocks(raw) : parseLegislationTextToBlocks(raw)
      if (!parsed.blocks.length) {
        this._status = { kind: 'warn', text: `O arquivo "${file.name}" não contém texto legal reconhecível.` }
        return
      }
      this._fallbackHtmlBlocks = parsed.blocks
      this._fallbackText = parsed.plainText
      this._fallbackFileInfo = `✔ Arquivo "${file.name}" carregado (${parsed.blocks.length} blocos estruturados).`
      if (!this._fallbackTitle.trim()) {
        const heading = parsed.blocks.find((b) => b.type === 'heading')?.text || file.name.replace(/\.[^.]+$/, '')
        this._fallbackTitle = heading.slice(0, 140)
      }
    } catch (err) {
      this._status = { kind: 'error', text: `Falha ao ler arquivo: ${err?.message || err}` }
    }
  }

  _handleFallbackSave(e) {
    e?.preventDefault?.()
    const title = String(this._fallbackTitle || '').trim()
    const rawText = String(this._fallbackText || '').trim()
    if (!title || !rawText) {
      this._status = {
        kind: 'warn',
        text: 'Informe o título da legislação e cole o texto completo (ou carregue um arquivo .htm/.html/.txt).'
      }
      return
    }

    let blocks
    let plainText
    if (Array.isArray(this._fallbackHtmlBlocks) && this._fallbackHtmlBlocks.length) {
      blocks = this._fallbackHtmlBlocks
      plainText = blocks.map((b) => b.text).join('\n\n')
    } else if (/<\s*(?:html|body|p)\b/i.test(rawText)) {
      const parsed = parseLegislationHtmlToBlocks(rawText)
      blocks = parsed.blocks
      plainText = parsed.plainText
    } else {
      const parsed = parseLegislationTextToBlocks(rawText)
      blocks = parsed.blocks
      plainText = parsed.plainText
    }

    if (!blocks.length) {
      this._status = { kind: 'warn', text: 'Não foi possível identificar blocos de texto no conteúdo informado.' }
      return
    }

    const baseEntry = this._fallbackEntry || {
      tipo: 'LEI',
      numero: '',
      ano: '',
      ementa: '',
      dataAssinatura: '',
      planaltoUrl: '',
      camaraUrl: '',
      normasUrl: '',
      sourceUrl: ''
    }

    const entry = {
      ...baseEntry,
      title,
      docId: baseEntry.docId || buildLegislationDocId({ catalogId: baseEntry.id, tipo: baseEntry.tipo, numero: baseEntry.numero, ano: baseEntry.ano, slug: title })
    }

    const { doc, updatedExisting } = insertLegislationIntoCorpus({
      entry,
      blocks,
      plainText,
      loadedFrom: 'manual'
    })
    this._fallbackOpen = false
    this._fallbackHtmlBlocks = null
    this._emitAdded(doc, entry)
    this._status = {
      kind: 'ok',
      docId: doc.id,
      text: updatedExisting
        ? `✔ "${doc.title}" atualizada no corpus (${blocks.length} blocos estruturados).`
        : `✔ "${doc.title}" estruturada e adicionada ao corpus em ${doc.folder} (${blocks.length} blocos).`
    }
  }

  _renderSourceBadge(entry) {
    if (entry.bundledPath) {
      return html`<span class="badge offline">⚡ Embutida offline</span>`
    }
    if (entry.camaraUrl) {
      return html`<span class="badge auto">🌐 Texto oficial automático</span>`
    }
    return html`<span class="badge senado">🏛 Metadados oficiais (Senado)</span>`
  }

  render() {
    const queryParsed = parseSearchQuery(this._searchQuery, { tipo: this._searchTipo, ano: this._searchAno })
    const showKeywordHint =
      !this._senadoQueried &&
      queryParsed.keywords &&
      !queryParsed.numero &&
      !queryParsed.ano &&
      this._searchResults.length === 0

    return html`
      <div class="panel-stack">
        <!-- Card 1: Inserir por URL oficial -->
        <section class="card highlight">
          <h2>
            <md-icon>link</md-icon>
            Inserir legislação por URL oficial (Planalto, Câmara ou Normas.leg.br)
          </h2>
          <p class="card-desc">
            Cole o endereço oficial de uma lei federal para estruturá-la por títulos, artigos, parágrafos, incisos e metas
            diretamente no seu corpus de leitura e marcação.
          </p>

          <form class="row" @submit=${this._handleUrlSubmit}>
            <input
              type="url"
              class="url-input"
              aria-label="URL oficial da legislação no Planalto, Câmara ou Normas.leg.br"
              placeholder="https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm"
              .value=${this._urlInput}
              @input=${(e) => {
                this._urlInput = e.target.value
              }}
            />
            <button type="submit" class="action-btn" ?disabled=${this._urlBusy}>
              <md-icon>${this._urlBusy ? 'sync' : 'library_add'}</md-icon>
              ${this._urlBusy ? 'Buscando…' : 'Buscar e inserir no corpus'}
            </button>
          </form>

          <div class="quick-row">
            <span>Atalho rápido:</span>
            <button type="button" class="chip-btn" @click=${this._usePneUrl}>
              <md-icon style="font-size: 16px;">auto_fix_high</md-icon>
              Usar URL da Lei nº 13.005/2014 (PNE)
            </button>
            <button
              type="button"
              class="link-toggle-btn"
              @click=${() => {
                if (this._fallbackOpen) {
                  this._fallbackOpen = false
                } else {
                  this._openFallbackForEntry(null, '')
                }
              }}
            >
              ${this._fallbackOpen ? 'Ocultar importação manual' : 'Ou colar / importar arquivo HTML da lei manualmente'}
            </button>
          </div>

          ${this._status
            ? html`
                <div class="status-banner ${this._status.kind}" role="status">
                  <span>${this._status.text}</span>
                  ${this._status.docId
                    ? html`
                        <button
                          type="button"
                          class="action-btn"
                          @click=${() => openForReading(this._status.docId)}
                        >
                          <md-icon>menu_book</md-icon>
                          Abrir no leitor para marcar agora
                        </button>
                      `
                    : ''}
                </div>
              `
            : ''}
        </section>

        <!-- Card 3 (condicional): Completar importação manual / CORS fallback -->
        ${this._fallbackOpen
          ? html`
              <section id="fallback-card" class="card highlight">
                <h2>
                  <md-icon>content_paste_go</md-icon>
                  Completar importação da legislação
                </h2>
                <p class="card-desc">
                  ${this._fallbackEntry?.planaltoUrl || this._fallbackEntry?.normasUrl
                    ? html`O portal de origem bloqueia leitura automática pelo navegador (CORS). Abra a fonte oficial,
                        copie o texto completo (<code>Ctrl+A</code>, <code>Ctrl+C</code>) ou salve a página em
                        <code>.htm</code>/<code>.html</code> e importe abaixo.`
                    : html`Cole o texto da norma jurídica ou carregue um arquivo <code>.htm</code>/<code>.html</code>/<code>.txt</code>
                        salvo do Planalto para estruturá-lo automaticamente em artigos, parágrafos e incisos.`}
                </p>

                ${this._fallbackEntry
                  ? html`
                      <div class="law-links" style="margin: 0 0 12px 0;">
                        ${this._fallbackEntry.planaltoUrl
                          ? html`
                              <a
                                class="ext-link"
                                href=${this._fallbackEntry.planaltoUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <md-icon style="font-size: 16px;">open_in_new</md-icon>
                                Abrir texto no Planalto ↗
                              </a>
                            `
                          : ''}
                        ${this._fallbackEntry.normasUrl
                          ? html`
                              <a
                                class="ext-link"
                                href=${this._fallbackEntry.normasUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <md-icon style="font-size: 16px;">open_in_new</md-icon>
                                Abrir no Normas.leg.br ↗
                              </a>
                            `
                          : ''}
                        ${this._fallbackEntry.ementa
                          ? html`<span style="font-size: 0.84rem; color: #334155;">${this._fallbackEntry.ementa}</span>`
                          : ''}
                      </div>
                    `
                  : ''}

                <form @submit=${this._handleFallbackSave}>
                  <label class="field-label">
                    Título no corpus
                    <input
                      type="text"
                      placeholder="Ex.: Lei nº 14.180/2021 — Política de Inovação Educação Conectada"
                      .value=${this._fallbackTitle}
                      @input=${(e) => {
                        this._fallbackTitle = e.target.value
                      }}
                    />
                  </label>

                  <div class="row" style="margin-bottom: 10px;">
                    <label class="file-upload-btn">
                      <md-icon style="font-size: 18px;">upload_file</md-icon>
                      Carregar arquivo .htm / .html / .txt
                      <input
                        type="file"
                        accept=".htm,.html,.txt,text/html,text/plain"
                        hidden
                        @change=${this._handleFallbackFileUpload}
                      />
                    </label>
                    ${this._fallbackFileInfo
                      ? html`<span style="font-size: 0.84rem; color: #065f46;">${this._fallbackFileInfo}</span>`
                      : ''}
                  </div>

                  <label class="field-label">
                    Texto completo da lei
                    <textarea
                      class="manual-textarea"
                      placeholder="Cole aqui o texto copiado da página oficial da lei..."
                      .value=${this._fallbackText}
                      @input=${(e) => {
                        this._fallbackText = e.target.value
                        this._fallbackHtmlBlocks = null
                      }}
                    ></textarea>
                  </label>

                  <div class="row" style="justify-content: flex-end;">
                    <button
                      type="button"
                      class="action-btn secondary"
                      @click=${() => {
                        this._fallbackOpen = false
                      }}
                    >
                      Cancelar
                    </button>
                    <button type="submit" class="action-btn">
                      <md-icon>article</md-icon>
                      Estruturar e inserir no corpus
                    </button>
                  </div>
                </form>
              </section>
            `
          : ''}

        <!-- Card 2: Pesquisar Legislação Federal -->
        <section class="card">
          <h2>
            <md-icon>search</md-icon>
            Pesquisar Legislação Federal
          </h2>
          <p class="card-desc">
            Filtre imediatamente o catálogo educacional e jurídico ou consulte a base oficial do
            <strong>Senado Federal (Dados Abertos)</strong> informando o número (ex.: <code>13005</code>,
            <code>13.005/2014</code>) ou tipo + ano.
          </p>

          <form class="row" @submit=${this._handleSearchSubmit}>
            <input
              type="text"
              class="search-input"
              aria-label="Pesquisar lei por número, sigla, ano ou palavra-chave"
              placeholder="Ex.: 13.005/2014, PNE, LDB, inclusão, cotas, 9394..."
              .value=${this._searchQuery}
              @input=${(e) => this._handleSearchInputChange(e.target.value, this._searchTipo, this._searchAno)}
            />
            <select
              class="tipo-select"
              aria-label="Tipo de norma"
              .value=${this._searchTipo}
              @change=${(e) => this._handleSearchInputChange(this._searchQuery, e.target.value, this._searchAno)}
            >
              <option value="">Todos os tipos</option>
              <option value="LEI">Lei Ordinária (LEI)</option>
              <option value="LCP">Lei Complementar (LCP)</option>
              <option value="DEC">Decreto (DEC)</option>
              <option value="EMC">Emenda Const. (EMC)</option>
              <option value="MPV">Medida Provisória (MPV)</option>
            </select>
            <input
              type="number"
              class="ano-input"
              aria-label="Ano da norma"
              placeholder="Ano (ex. 2014)"
              min="1889"
              max="2099"
              .value=${this._searchAno}
              @input=${(e) => this._handleSearchInputChange(this._searchQuery, this._searchTipo, e.target.value)}
            />
            <button type="submit" class="action-btn" ?disabled=${this._searchBusy}>
              <md-icon>${this._searchBusy ? 'sync' : 'search'}</md-icon>
              ${this._searchBusy ? 'Pesquisando…' : 'Pesquisar'}
            </button>
          </form>

          <div class="ext-portals">
            <span>Portais oficiais para busca temática:</span>
            <a class="ext-link" href="https://normas.leg.br/" target="_blank" rel="noopener noreferrer">
              Normas.leg.br ↗
            </a>
            <a class="ext-link" href="https://www.planalto.gov.br/ccivil_03/" target="_blank" rel="noopener noreferrer">
              Portal Planalto ↗
            </a>
            <a class="ext-link" href="https://www.camara.leg.br/legislacao/busca" target="_blank" rel="noopener noreferrer">
              Câmara Legislação ↗
            </a>
          </div>

          ${showKeywordHint
            ? html`
                <div class="status-banner info">
                  <span>
                    A busca por assunto no catálogo local não encontrou “${this._searchQuery}”. Para pesquisar qualquer outra
                    norma federal na API do Senado, informe o número (ex.: <code>14180/2021</code>), selecione tipo + ano, ou
                    pesquise nos portais acima e cole a URL em “Inserir por URL oficial”.
                  </span>
                </div>
              `
            : ''}

          ${this._senadoError
            ? html`<div class="status-banner warn">${this._senadoError}</div>`
            : ''}

          <div class="results-meta">
            ${this._searchResults.length} resultado(s) encontrado(s)
            ${this._senadoQueried ? ' (catálogo + Senado Federal Dados Abertos)' : ' no catálogo oficial'}
          </div>

          <div class="results-list">
            ${this._searchResults.map((entry) => {
              const existingDoc = this._findDocInCorpus(entry)
              const busy = this._insertingKey === this._entryKey(entry)
              return html`
                <article class="law-item ${entry.featured ? 'featured' : ''}">
                  <div class="law-info">
                    <div class="law-badges">
                      <span class="badge">${tipoLabel(entry.tipo)}</span>
                      ${entry.dataAssinatura || entry.ano
                        ? html`<span class="badge">${entry.dataAssinatura || entry.ano}</span>`
                        : ''}
                      ${this._renderSourceBadge(entry)}
                      ${existingDoc ? html`<span class="badge in-corpus">✓ No corpus</span>` : ''}
                    </div>
                    <div class="law-title">${entry.title}</div>
                    ${entry.ementa ? html`<p class="law-ementa">${entry.ementa}</p>` : ''}
                    <div class="law-links">
                      ${entry.planaltoUrl
                        ? html`
                            <a class="ext-link" href=${entry.planaltoUrl} target="_blank" rel="noopener noreferrer">
                              Ver no Planalto ↗
                            </a>
                          `
                        : ''}
                      ${entry.normasUrl
                        ? html`
                            <a class="ext-link" href=${entry.normasUrl} target="_blank" rel="noopener noreferrer">
                              Normas.leg.br ↗
                            </a>
                          `
                        : ''}
                    </div>
                  </div>
                  <div class="law-actions">
                    ${existingDoc
                      ? html`
                          <button
                            type="button"
                            class="action-btn secondary"
                            @click=${() => openForReading(existingDoc.id)}
                          >
                            <md-icon>menu_book</md-icon>
                            No corpus · Abrir no leitor
                          </button>
                        `
                      : html`
                          <button
                            type="button"
                            class="action-btn"
                            ?disabled=${busy}
                            @click=${() => this._loadAndInsertEntry(entry)}
                          >
                            <md-icon>${busy ? 'sync' : 'add_circle'}</md-icon>
                            ${busy ? 'Inserindo…' : 'Inserir no corpus'}
                          </button>
                        `}
                  </div>
                </article>
              `
            })}
          </div>
        </section>
      </div>
    `
  }
}

customElements.define('caqdas-legislation-panel', CaqdasLegislationPanel)
