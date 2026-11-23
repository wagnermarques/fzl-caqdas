import { LitElement, html, svg, css, nothing } from 'lit'
import { authService } from 'fzl-fund-appshell--lit'
import { researchStorage } from '../services/storage-service.js'
import { userData } from '../services/user-data-service.js'
import { openForReading } from '../services/reading-intent.js'
import { isGithubConfigured, syncWithGithub, getGithubConfig } from '../services/github-sync-service.js'
import {
  NODE_WIDTH,
  NODE_HEIGHT,
  BARDIN_RELATION_TYPES,
  getRelationTypeMeta,
  computeAutoLayout,
  computeEdgePath
} from '../services/excerpt-graph-utils.js'
import '@material/web/button/filled-button.js'
import '@material/web/button/outlined-button.js'
import '@material/web/icon/icon.js'

const VIEW_W = 960
const VIEW_H = 620
const DEFAULT_NODE_COLOR = '#f9d65c'

function truncateText(text, maxLen) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (clean.length <= maxLen) return clean
  return `${clean.slice(0, Math.max(0, maxLen - 1)).trimEnd()}…`
}

function wrapTwoLines(text, maxCharsPerLine = 26) {
  const clean = String(text || '').replace(/\s+/g, ' ').trim()
  if (!clean) return ['', '']
  if (clean.length <= maxCharsPerLine) return [clean, '']

  let split = clean.lastIndexOf(' ', maxCharsPerLine)
  if (split < Math.floor(maxCharsPerLine * 0.4)) split = maxCharsPerLine
  const line1 = clean.slice(0, split).trimEnd()
  const rest = clean.slice(split).trimStart()
  const line2 = rest.length <= maxCharsPerLine ? rest : `${rest.slice(0, maxCharsPerLine - 1).trimEnd()}…`
  return [line1, line2]
}

export class CaqdasGraphView extends LitElement {
  static styles = css`
    *,
    *::before,
    *::after {
      box-sizing: border-box;
    }

    :host {
      display: block;
      width: 100%;
      max-width: 1320px;
      margin: 0 auto;
      padding: 20px 24px 32px;
      overflow-x: clip;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 12px 16px;
      margin-bottom: 14px;
    }

    h1 {
      margin: 0 0 6px;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 1.55rem;
      line-height: 1.25;
    }

    .header-actions {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-radius: 8px;
      border: 1px solid var(--md-sys-color-outline-variant, #cbd5e1);
      background: var(--md-sys-color-surface, #fff);
      color: var(--md-sys-color-on-surface, #1f2937);
      font: inherit;
      font-size: 0.88rem;
      font-weight: 500;
      cursor: pointer;
      text-decoration: none;
      white-space: nowrap;
    }

    .btn:hover:not([disabled]) {
      background: #f1f5f9;
    }

    .btn.primary {
      background: var(--md-sys-color-primary, #006a6a);
      border-color: var(--md-sys-color-primary, #006a6a);
      color: #fff;
    }

    .btn.primary:hover:not([disabled]) {
      background: #005555;
    }

    .btn.danger {
      color: #b91c1c;
      border-color: #fecaca;
      background: #fef2f2;
    }

    .btn.small {
      height: 28px;
      padding: 0 10px;
      font-size: 0.8rem;
    }

    .btn.active-mode {
      background: #e0f2f1;
      border-color: #006a6a;
      color: #004d40;
      font-weight: 600;
    }

    .btn[disabled] {
      opacity: 0.55;
      cursor: default;
    }

    .btn md-icon {
      font-size: 18px;
    }

    .btn.small md-icon {
      font-size: 16px;
    }

    .theory-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px 16px;
      padding: 12px 16px;
      border-radius: 10px;
      background: #e0f2f1;
      border: 1px solid #b2dfdb;
      color: #004d40;
      font-size: 0.9rem;
      line-height: 1.45;
      margin-bottom: 14px;
    }

    .theory-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      background: #006a6a;
      color: #fff;
      font-weight: 600;
      font-size: 0.85rem;
      text-decoration: none;
      white-space: nowrap;
    }

    .theory-link:hover {
      background: #005050;
    }

    .sync-banner {
      padding: 9px 12px;
      border-radius: 8px;
      font-size: 0.84rem;
      margin-bottom: 12px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
    }

    .sync-banner.ok {
      background: #f0fdf4;
      border-color: #bbf7d0;
      color: #166534;
    }

    .sync-banner.error {
      background: #fef2f2;
      border-color: #fecaca;
      color: #991b1b;
    }

    .sync-banner a {
      color: #0969da;
      font-weight: 600;
    }

    .controls-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px 10px;
      padding: 12px 14px;
      border-radius: 10px;
      background: var(--md-sys-color-surface, #fff);
      border: 1px solid var(--md-sys-color-outline-variant, #e2e8f0);
      margin-bottom: 16px;
    }

    .controls-bar select,
    .controls-bar input[type='search'],
    .inspector-card select,
    .inspector-card input[type='text'],
    .inspector-card textarea {
      font: inherit;
      font-size: 0.86rem;
      padding: 6px 10px;
      border-radius: 6px;
      border: 1px solid #cbd5e1;
      background: #fff;
      color: #1f2937;
      min-width: 0;
    }

    .controls-bar input[type='search'] {
      flex: 1 1 190px;
    }

    .workspace {
      display: grid;
      grid-template-columns: minmax(280px, 340px) minmax(0, 1fr);
      gap: 16px;
      align-items: start;
    }

    .list-panel {
      background: var(--md-sys-color-surface-container-low, #f8fafc);
      border: 1px solid var(--md-sys-color-outline-variant, #e2e8f0);
      border-radius: 12px;
      padding: 14px;
      max-height: 760px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 10px;
      min-width: 0;
    }

    .list-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      font-weight: 600;
      color: var(--md-sys-color-primary, #006a6a);
      font-size: 0.95rem;
    }

    .excerpt-card {
      background: #fff;
      border: 1px solid #e2e8f0;
      border-left-width: 5px;
      border-radius: 8px;
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      cursor: pointer;
      transition: border-color 0.12s ease, box-shadow 0.12s ease;
      overflow-wrap: anywhere;
    }

    .excerpt-card:hover {
      border-color: #94a3b8;
    }

    .excerpt-card.selected {
      border-color: #006a6a;
      box-shadow: 0 0 0 2px rgba(0, 106, 106, 0.22);
    }

    .excerpt-card.connect-source {
      border-color: #0284c7;
      box-shadow: 0 0 0 2px rgba(2, 132, 199, 0.3);
      background: #f0f9ff;
    }

    .excerpt-card-title {
      font-weight: 600;
      font-size: 0.9rem;
      color: #0f172a;
    }

    .excerpt-card-quote {
      font-style: italic;
      font-size: 0.83rem;
      color: #334155;
      line-height: 1.4;
    }

    .excerpt-card-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: #64748b;
    }

    .code-badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 7px;
      border-radius: 999px;
      color: #fff;
      font-size: 0.72rem;
      font-weight: 600;
    }

    .card-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 2px;
    }

    .link-btn {
      background: transparent;
      border: none;
      padding: 2px 4px;
      font: inherit;
      font-size: 0.78rem;
      color: #006a6a;
      cursor: pointer;
      font-weight: 600;
    }

    .link-btn:hover {
      text-decoration: underline;
    }

    .graph-column {
      display: flex;
      flex-direction: column;
      gap: 14px;
      min-width: 0;
    }

    .canvas-card {
      position: relative;
      background: #ffffff;
      border: 1px solid var(--md-sys-color-outline-variant, #cbd5e1);
      border-radius: 12px;
      overflow: hidden;
      min-height: 460px;
      height: 560px;
      background-image: radial-gradient(#e2e8f0 1px, transparent 1px);
      background-size: 20px 20px;
    }

    .graph-svg {
      display: block;
      width: 100%;
      height: 100%;
      touch-action: none;
      user-select: none;
      cursor: grab;
    }

    .graph-svg.panning {
      cursor: grabbing;
    }

    .graph-node {
      cursor: grab;
    }

    .graph-node.dragging {
      cursor: grabbing;
    }

    .graph-edge {
      cursor: pointer;
    }

    .canvas-overlay-top {
      position: absolute;
      top: 10px;
      left: 10px;
      right: 10px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 8px;
      pointer-events: none;
    }

    .canvas-overlay-top > * {
      pointer-events: auto;
    }

    .connect-hint {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 12px;
      border-radius: 8px;
      background: rgba(2, 132, 199, 0.94);
      color: #fff;
      font-size: 0.82rem;
      font-weight: 500;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .zoom-controls {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 4px;
      border-radius: 8px;
      background: rgba(255, 255, 255, 0.92);
      border: 1px solid #cbd5e1;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
      margin-left: auto;
    }

    .inspector-card {
      background: #fff;
      border: 1px solid var(--md-sys-color-outline-variant, #e2e8f0);
      border-radius: 12px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .inspector-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px 14px;
    }

    .field {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
    }

    .quote-box {
      padding: 10px 12px;
      border-radius: 8px;
      background: #f8fafc;
      border-left: 4px solid #006a6a;
      font-style: italic;
      font-size: 0.88rem;
      color: #1e293b;
      line-height: 1.5;
    }

    .rel-chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .rel-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 999px;
      border: 1px solid #cbd5e1;
      background: #f8fafc;
      font-size: 0.78rem;
      cursor: pointer;
    }

    .rel-chip:hover {
      background: #eef2f6;
    }

    .empty-state {
      padding: 40px 20px;
      text-align: center;
      color: #64748b;
      background: #fff;
      border: 1px dashed #cbd5e1;
      border-radius: 12px;
    }

    @media (max-width: 900px) {
      :host {
        padding: 14px 12px 24px;
      }

      .workspace {
        grid-template-columns: minmax(0, 1fr);
      }

      .list-panel {
        max-height: 360px;
        order: 2;
      }

      .graph-column {
        order: 1;
      }

      .canvas-card {
        height: 440px;
        min-height: 380px;
      }
    }
  `

  static properties = {
    documents: { state: true },
    codes: { state: true },
    graph: { state: true },
    docFilter: { state: true },
    searchQuery: { state: true },
    onlyConnected: { state: true },
    connectMode: { state: true },
    connectSourceId: { state: true },
    connectType: { state: true },
    selectedExcerptId: { state: true },
    selectedRelationId: { state: true },
    viewX: { state: true },
    viewY: { state: true },
    zoom: { state: true },
    _dragPosMap: { state: true },
    _draggingNodeId: { state: true },
    _isPanning: { state: true },
    _draftTargetId: { state: true },
    _draftRelType: { state: true },
    _draftRelLabel: { state: true },
    _draftRelNote: { state: true },
    _edgeTypeDraft: { state: true },
    _edgeLabelDraft: { state: true },
    _edgeDirectedDraft: { state: true },
    _edgeNoteDraft: { state: true },
    githubSyncBusy: { state: true },
    githubSyncStatus: { state: true },
    _githubConfigured: { state: true }
  }

  constructor() {
    super()
    this.documents = []
    this.codes = []
    this.graph = { nodes: {}, relations: [], deletedRelations: [] }
    this.docFilter = 'all'
    this.searchQuery = ''
    this.onlyConnected = false
    this.connectMode = false
    this.connectSourceId = ''
    this.connectType = 'associa'
    this.selectedExcerptId = ''
    this.selectedRelationId = ''
    this.viewX = 0
    this.viewY = 0
    this.zoom = 1
    this._drag = null
    this._dragPosMap = {}
    this._draggingNodeId = ''
    this._isPanning = false
    this._draftTargetId = ''
    this._draftRelType = 'associa'
    this._draftRelLabel = ''
    this._draftRelNote = ''
    this._edgeTypeDraft = 'associa'
    this._edgeLabelDraft = ''
    this._edgeDirectedDraft = false
    this._edgeNoteDraft = ''
    this.githubSyncBusy = false
    this.githubSyncStatus = null
    this._githubConfigured = isGithubConfigured()
    this._hasFittedOnce = false
  }

  connectedCallback() {
    super.connectedCallback()
    this._loadData()
    this._githubConfigured = isGithubConfigured()
    this._onDataChanged = () => this._loadData()
    this._onGithubChanged = () => {
      this._githubConfigured = isGithubConfigured()
    }
    window.addEventListener('caqdas-data-changed', this._onDataChanged)
    window.addEventListener('caqdas-github-changed', this._onGithubChanged)
    this._unsubUserData = userData.subscribe(() => {
      this._loadData()
      this._githubConfigured = isGithubConfigured()
      this.githubSyncStatus = null
    })
  }

  disconnectedCallback() {
    super.disconnectedCallback()
    window.removeEventListener('caqdas-data-changed', this._onDataChanged)
    window.removeEventListener('caqdas-github-changed', this._onGithubChanged)
    this._unsubUserData?.()
  }

  firstUpdated() {
    this._fitInitialOnce()
  }

  _loadData() {
    this.documents = researchStorage.getDocuments()
    this.codes = researchStorage.getCodes()
    this.graph = researchStorage.getExcerptGraph()
    const validIds = new Set(this._allExcerpts().map((e) => e.id))
    if (this.selectedExcerptId && !validIds.has(this.selectedExcerptId)) this.selectedExcerptId = ''
    if (this.connectSourceId && !validIds.has(this.connectSourceId)) this.connectSourceId = ''
    if (this.selectedRelationId && !this.graph.relations.some((r) => r.id === this.selectedRelationId)) {
      this.selectedRelationId = ''
    }
  }

  _allExcerpts() {
    return researchStorage.getAllExcerpts()
  }

  _filteredData() {
    const excerpts = this._allExcerpts()
    const codeMap = new Map(this.codes.map((c) => [c.id, c]))
    const docMap = new Map(this.documents.map((d) => [d.id, d]))
    const q = this.searchQuery.trim().toLowerCase()

    const connectedIds = new Set()
    for (const rel of this.graph.relations) {
      connectedIds.add(rel.sourceId)
      connectedIds.add(rel.targetId)
    }

    const filteredExcerpts = excerpts.filter((item) => {
      if (this.docFilter !== 'all' && item.docId !== this.docFilter) return false
      if (this.onlyConnected && !connectedIds.has(item.id)) return false
      if (!q) return true
      const codeName = (codeMap.get(item.codeId)?.name || '').toLowerCase()
      const docTitle = (docMap.get(item.docId)?.title || item.docTitle || '').toLowerCase()
      return (
        item.title.toLowerCase().includes(q) ||
        item.text.toLowerCase().includes(q) ||
        codeName.includes(q) ||
        docTitle.includes(q)
      )
    })

    const visibleIds = new Set(filteredExcerpts.map((e) => e.id))
    const visibleRelations = this.graph.relations.filter(
      (r) => visibleIds.has(r.sourceId) && visibleIds.has(r.targetId)
    )

    return { excerpts, filteredExcerpts, visibleRelations, codeMap, docMap }
  }

  _resolvedPositions(excerpts) {
    const base = computeAutoLayout(excerpts, this.graph.nodes, { forceAll: false, width: VIEW_W })
    const out = { ...base }
    for (const [id, dragPos] of Object.entries(this._dragPosMap)) {
      out[id] = { ...(out[id] || {}), x: dragPos.x, y: dragPos.y }
    }
    return out
  }

  _fitInitialOnce() {
    if (this._hasFittedOnce) return
    const { filteredExcerpts } = this._filteredData()
    if (!filteredExcerpts.length) return
    this._hasFittedOnce = true
    this._fitView(filteredExcerpts)
  }

  _fitView(excerptsInput) {
    const excerpts = excerptsInput || this._filteredData().filteredExcerpts
    if (!excerpts.length) {
      this.viewX = 0
      this.viewY = 0
      this.zoom = 1
      return
    }
    const posMap = this._resolvedPositions(this._allExcerpts())
    let minX = Infinity
    let minY = Infinity
    let maxX = -Infinity
    let maxY = -Infinity
    for (const q of excerpts) {
      const p = posMap[q.id]
      if (!p) continue
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x + NODE_WIDTH)
      maxY = Math.max(maxY, p.y + NODE_HEIGHT)
    }
    if (!Number.isFinite(minX)) return
    const pad = 48
    const boxW = Math.max(240, maxX - minX + pad * 2)
    const boxH = Math.max(180, maxY - minY + pad * 2)
    const nextZoom = Math.max(0.35, Math.min(1.25, Math.min(VIEW_W / boxW, VIEW_H / boxH)))
    const curW = VIEW_W / nextZoom
    const curH = VIEW_H / nextZoom
    const centerX = (minX + maxX) / 2
    const centerY = (minY + maxY) / 2
    this.zoom = Math.round(nextZoom * 100) / 100
    this.viewX = Math.round(centerX - curW / 2)
    this.viewY = Math.round(centerY - curH / 2)
  }

  _autoArrangeAll() {
    const all = this._allExcerpts()
    if (!all.length) return
    const layout = computeAutoLayout(all, {}, { forceAll: true, width: VIEW_W })
    researchStorage.saveExcerptNodePositions(layout)
    this._dragPosMap = {}
    this._fitView()
  }

  _adjustZoom(factor) {
    const oldW = VIEW_W / this.zoom
    const oldH = VIEW_H / this.zoom
    const centerX = this.viewX + oldW / 2
    const centerY = this.viewY + oldH / 2
    const nextZoom = Math.max(0.35, Math.min(2.2, Math.round(this.zoom * factor * 100) / 100))
    const newW = VIEW_W / nextZoom
    const newH = VIEW_H / nextZoom
    this.zoom = nextZoom
    this.viewX = Math.round(centerX - newW / 2)
    this.viewY = Math.round(centerY - newH / 2)
  }

  _focusNode(excerptId) {
    this.selectedExcerptId = excerptId
    this.selectedRelationId = ''
    const posMap = this._resolvedPositions(this._allExcerpts())
    const pos = posMap[excerptId]
    if (!pos) return
    const vw = VIEW_W / this.zoom
    const vh = VIEW_H / this.zoom
    this.viewX = Math.round(pos.x + NODE_WIDTH / 2 - vw / 2)
    this.viewY = Math.round(pos.y + NODE_HEIGHT / 2 - vh / 2)
  }

  _selectNode(id) {
    this.selectedExcerptId = id
    this.selectedRelationId = ''
    this._draftTargetId = ''
    this._draftRelNote = ''
    this._draftRelLabel = ''
  }

  _selectRelation(rel) {
    this.selectedRelationId = rel.id
    this.selectedExcerptId = ''
    this._edgeTypeDraft = rel.type
    this._edgeLabelDraft = rel.label
    this._edgeDirectedDraft = Boolean(rel.directed)
    this._edgeNoteDraft = rel.note || ''
  }

  _startConnectFrom(excerptId) {
    this.connectMode = true
    this.connectSourceId = excerptId
    this.selectedExcerptId = excerptId
    this.selectedRelationId = ''
  }

  _toggleConnectMode() {
    this.connectMode = !this.connectMode
    if (!this.connectMode) {
      this.connectSourceId = ''
    } else if (this.selectedExcerptId) {
      this.connectSourceId = this.selectedExcerptId
    }
  }

  _handleExcerptCardClick(excerptId) {
    if (this.connectMode) {
      if (!this.connectSourceId) {
        this.connectSourceId = excerptId
        this.selectedExcerptId = excerptId
        return
      }
      if (this.connectSourceId === excerptId) {
        this.connectSourceId = ''
        return
      }
      const created = researchStorage.addExcerptRelation({
        sourceId: this.connectSourceId,
        targetId: excerptId,
        type: this.connectType
      })
      this.connectSourceId = ''
      this.connectMode = false
      if (created) this._selectRelation(created)
      return
    }
    this._focusNode(excerptId)
  }

  _clientToSvgPoint(clientX, clientY) {
    const svgEl = this.shadowRoot?.querySelector('.graph-svg')
    if (!svgEl) return { x: clientX, y: clientY }
    const ctm = typeof svgEl.getScreenCTM === 'function' ? svgEl.getScreenCTM() : null
    if (ctm && typeof svgEl.createSVGPoint === 'function') {
      const pt = svgEl.createSVGPoint()
      pt.x = clientX
      pt.y = clientY
      const transformed = pt.matrixTransform(ctm.inverse())
      return { x: transformed.x, y: transformed.y }
    }
    const rect = svgEl.getBoundingClientRect()
    const vw = VIEW_W / this.zoom
    const vh = VIEW_H / this.zoom
    const rx = rect.width ? (clientX - rect.left) / rect.width : 0
    const ry = rect.height ? (clientY - rect.top) / rect.height : 0
    return { x: this.viewX + rx * vw, y: this.viewY + ry * vh }
  }

  _onNodePointerDown(e, nodeId) {
    e.stopPropagation()
    if (e.button !== undefined && e.button !== 0) return

    if (this.connectMode) {
      this._handleExcerptCardClick(nodeId)
      return
    }

    const svgEl = this.shadowRoot?.querySelector('.graph-svg')
    svgEl?.setPointerCapture?.(e.pointerId)

    const posMap = this._resolvedPositions(this._allExcerpts())
    const startPos = posMap[nodeId] || { x: 40, y: 40 }
    const startPt = this._clientToSvgPoint(e.clientX, e.clientY)

    this._drag = {
      kind: 'node',
      id: nodeId,
      pointerId: e.pointerId,
      startPt,
      startPos: { x: startPos.x, y: startPos.y },
      clientX: e.clientX,
      clientY: e.clientY,
      moved: false
    }
    this._draggingNodeId = nodeId
  }

  _onEdgePointerDown(e, rel) {
    e.stopPropagation()
    this._selectRelation(rel)
  }

  _onSvgPointerDown(e) {
    if (e.button !== undefined && e.button !== 0) return
    const svgEl = e.currentTarget
    svgEl?.setPointerCapture?.(e.pointerId)
    this._drag = {
      kind: 'pan',
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startViewX: this.viewX,
      startViewY: this.viewY,
      moved: false
    }
    this._isPanning = true
  }

  _onSvgPointerMove(e) {
    if (!this._drag) return
    if (this._drag.kind === 'node') {
      const dist = Math.hypot(e.clientX - this._drag.clientX, e.clientY - this._drag.clientY)
      if (dist >= 5) this._drag.moved = true
      if (!this._drag.moved) return
      const pt = this._clientToSvgPoint(e.clientX, e.clientY)
      const nx = Math.round(this._drag.startPos.x + (pt.x - this._drag.startPt.x))
      const ny = Math.round(this._drag.startPos.y + (pt.y - this._drag.startPt.y))
      this._dragPosMap = { ...this._dragPosMap, [this._drag.id]: { x: nx, y: ny } }
      return
    }

    if (this._drag.kind === 'pan') {
      const dx = e.clientX - this._drag.startClientX
      const dy = e.clientY - this._drag.startClientY
      if (Math.hypot(dx, dy) >= 4) this._drag.moved = true
      if (!this._drag.moved) return
      const svgEl = e.currentTarget
      const rect = svgEl.getBoundingClientRect()
      const scaleX = (VIEW_W / this.zoom) / Math.max(1, rect.width)
      const scaleY = (VIEW_H / this.zoom) / Math.max(1, rect.height)
      const scale = Math.max(scaleX, scaleY)
      this.viewX = Math.round(this._drag.startViewX - dx * scale)
      this.viewY = Math.round(this._drag.startViewY - dy * scale)
    }
  }

  _onSvgPointerUp(e) {
    if (!this._drag) return
    const d = this._drag
    this._drag = null
    this._draggingNodeId = ''
    this._isPanning = false
    try {
      e.currentTarget?.releasePointerCapture?.(d.pointerId)
    } catch {
      // ignore
    }

    if (d.kind === 'node') {
      if (d.moved && this._dragPosMap[d.id]) {
        const finalPos = this._dragPosMap[d.id]
        const nextMap = { ...this._dragPosMap }
        delete nextMap[d.id]
        this._dragPosMap = nextMap
        researchStorage.saveExcerptNodePosition(d.id, finalPos.x, finalPos.y)
      }
      this._selectNode(d.id)
      return
    }

    if (d.kind === 'pan' && !d.moved) {
      this.selectedExcerptId = ''
      this.selectedRelationId = ''
      if (this.connectMode) this.connectSourceId = ''
    }
  }

  _onSvgWheel(e) {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    this._adjustZoom(factor)
  }

  _handleCreateRelationFromInspector(sourceId) {
    if (!sourceId || !this._draftTargetId || sourceId === this._draftTargetId) return
    const rel = researchStorage.addExcerptRelation({
      sourceId,
      targetId: this._draftTargetId,
      type: this._draftRelType,
      label: this._draftRelLabel.trim() || undefined,
      note: this._draftRelNote.trim()
    })
    this._draftTargetId = ''
    this._draftRelLabel = ''
    this._draftRelNote = ''
    if (rel) this._selectRelation(rel)
  }

  _handleSaveEdgeEdits(rel) {
    const meta = getRelationTypeMeta(this._edgeTypeDraft)
    const label = this._edgeLabelDraft.trim() || meta.label
    const updated = researchStorage.updateExcerptRelation(rel.id, {
      type: this._edgeTypeDraft,
      label,
      directed: this._edgeDirectedDraft,
      note: this._edgeNoteDraft.trim()
    })
    if (updated) this._selectRelation(updated)
  }

  _handleFlipEdge(rel) {
    const updated = researchStorage.updateExcerptRelation(rel.id, {
      sourceId: rel.targetId,
      targetId: rel.sourceId
    })
    if (updated) this._selectRelation(updated)
  }

  _handleDeleteEdge(rel) {
    researchStorage.removeExcerptRelation(rel.id)
    this.selectedRelationId = ''
  }

  async _handleGithubSave() {
    if (this.githubSyncBusy) return
    if (!isGithubConfigured()) {
      const goConfig = confirm(
        'O repositório remoto privado do GitHub ainda não está configurado.\n\nDeseja ir para Persistência & Sincronização para configurar agora?'
      )
      if (goConfig) window.location.hash = '#/config/persistencia'
      return
    }
    this.githubSyncBusy = true
    this.githubSyncStatus = null
    try {
      const user = authService.getCurrentUser?.()
      const r = await syncWithGithub(user ? { name: user.name || '' } : null)
      const relInfo = r.relationCount ? ` e ${r.relationCount} relação(ões)` : ''
      this.githubSyncStatus = {
        kind: 'ok',
        text: r.pushed
          ? `Commit e push realizados (${r.pushed} arquivo(s) em ${r.folder}/: ${r.excerptCount} trecho(s)${relInfo}).`
          : `Já sincronizado com ${r.folder}/ (sem alterações pendentes).`,
        link: r.pushed ? r.lastCommitUrl : ''
      }
    } catch (err) {
      this.githubSyncStatus = { kind: 'error', text: err?.message || String(err) }
    } finally {
      this.githubSyncBusy = false
    }
  }

  _renderSvgEdges(visibleRelations, posMap) {
    const groups = new Map()
    for (const rel of visibleRelations) {
      const pairKey =
        rel.sourceId < rel.targetId ? `${rel.sourceId}::${rel.targetId}` : `${rel.targetId}::${rel.sourceId}`
      if (!groups.has(pairKey)) groups.set(pairKey, [])
      groups.get(pairKey).push(rel)
    }

    const rendered = []
    for (const group of groups.values()) {
      const n = group.length
      group.forEach((rel, idx) => {
        const srcPos = posMap[rel.sourceId]
        const dstPos = posMap[rel.targetId]
        if (!srcPos || !dstPos) return
        const rawOffset = n === 1 ? 0 : (idx - (n - 1) / 2) * (n === 2 ? 1.25 : 1)
        const sign = rel.sourceId < rel.targetId ? 1 : -1
        const curveIndex = rawOffset * sign
        const pathInfo = computeEdgePath(srcPos, dstPos, { curveIndex })
        const meta = getRelationTypeMeta(rel.type)
        const isSelected = this.selectedRelationId === rel.id
        const stroke = isSelected ? '#0f172a' : meta.color
        const markerEnd = rel.directed ? `url(#${isSelected ? 'arrow-selected' : `arrow-${meta.id}`})` : ''
        const badgeLabel = truncateText(rel.label || meta.label, 24)
        const pillWidth = Math.max(64, Math.min(176, badgeLabel.length * 6.5 + 16))

        rendered.push(svg`
          <g class="graph-edge" @pointerdown=${(e) => this._onEdgePointerDown(e, rel)}>
            <path d=${pathInfo.d} fill="none" stroke="transparent" stroke-width="16" />
            <path
              d=${pathInfo.d}
              fill="none"
              stroke=${stroke}
              stroke-width=${isSelected ? 3 : 2.1}
              stroke-dasharray=${rel.directed ? 'none' : '6 3'}
              marker-end=${markerEnd}
            />
            <rect
              x=${pathInfo.midX - pillWidth / 2}
              y=${pathInfo.midY - 11}
              width=${pillWidth}
              height="20"
              rx="10"
              fill=${isSelected ? '#0f172a' : '#ffffff'}
              stroke=${stroke}
              stroke-width="1.2"
            />
            <text
              x=${pathInfo.midX}
              y=${pathInfo.midY + 3}
              text-anchor="middle"
              font-size="10.5"
              font-weight="600"
              fill=${isSelected ? '#ffffff' : stroke}
            >${badgeLabel}</text>
          </g>
        `)
      })
    }
    return rendered
  }

  _renderSvgNodes(filteredExcerpts, posMap, codeMap, docMap) {
    return filteredExcerpts.map((q) => {
      const pos = posMap[q.id]
      if (!pos) return nothing
      const code = q.codeId ? codeMap.get(q.codeId) : null
      const docTitle = docMap.get(q.docId)?.title || q.docTitle || 'Documento'
      const accent = code?.color || q.color || DEFAULT_NODE_COLOR
      const isSelected = this.selectedExcerptId === q.id
      const isConnectSource = this.connectSourceId === q.id
      const isDragging = this._draggingNodeId === q.id
      const stroke = isConnectSource ? '#0284c7' : isSelected ? '#006a6a' : '#cbd5e1'
      const strokeWidth = isConnectSource || isSelected ? 2.5 : 1.2
      const titleText = truncateText(q.title || '(sem título)', 23)
      const [line1, line2] = wrapTwoLines(q.text, 27)
      const footerText = truncateText(
        `${code ? `${code.name} · ` : ''}${docTitle}${q.page ? ` p.${q.page}` : ''}`,
        28
      )

      return svg`
        <g
          class="graph-node ${isDragging ? 'dragging' : ''}"
          transform="translate(${pos.x}, ${pos.y})"
          @pointerdown=${(e) => this._onNodePointerDown(e, q.id)}
        >
          <rect
            x="0"
            y="0"
            width=${NODE_WIDTH}
            height=${NODE_HEIGHT}
            rx="10"
            fill=${isConnectSource ? '#f0f9ff' : '#ffffff'}
            stroke=${stroke}
            stroke-width=${strokeWidth}
          />
          <rect x="0" y="0" width="6" height=${NODE_HEIGHT} rx="3" fill=${accent} />
          <text x="14" y="20" font-size="12" font-weight="700" fill="#0f172a">${titleText}</text>
          <text x="14" y="38" font-size="10.5" fill="#475569">${line1}</text>
          ${line2 ? svg`<text x="14" y="52" font-size="10.5" fill="#475569">${line2}</text>` : nothing}
          <text x="14" y="71" font-size="9.5" font-weight="600" fill="#006a6a">${footerText}</text>
        </g>
      `
    })
  }

  _renderInspector(excerpts, codeMap, docMap) {
    const excerptMap = new Map(excerpts.map((e) => [e.id, e]))

    if (this.selectedRelationId) {
      const rel = this.graph.relations.find((r) => r.id === this.selectedRelationId)
      if (!rel) return nothing
      const src = excerptMap.get(rel.sourceId)
      const dst = excerptMap.get(rel.targetId)
      const meta = getRelationTypeMeta(this._edgeTypeDraft)

      return html`
        <div class="inspector-card">
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <strong style="color: #0f172a; font-size: 0.98rem;">
              Relação: “${src?.title || 'Origem'}” ${this._edgeDirectedDraft ? '→' : '↔'} “${dst?.title || 'Destino'}”
            </strong>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn small" @click=${() => this._handleFlipEdge(rel)}>
                <md-icon>swap_horiz</md-icon> Inverter direção
              </button>
              <button type="button" class="btn small danger" @click=${() => this._handleDeleteEdge(rel)}>
                <md-icon>delete</md-icon> Remover relação
              </button>
            </div>
          </div>

          <div class="inspector-grid">
            <label class="field">
              Tipo metodológico (Bardin)
              <select
                .value=${this._edgeTypeDraft}
                @change=${(e) => {
                  const nextType = e.target.value
                  const prevMeta = getRelationTypeMeta(this._edgeTypeDraft)
                  const nextMeta = getRelationTypeMeta(nextType)
                  this._edgeTypeDraft = nextType
                  if (!this._edgeLabelDraft.trim() || this._edgeLabelDraft.trim() === prevMeta.label) {
                    this._edgeLabelDraft = nextMeta.label
                  }
                  this._edgeDirectedDraft = nextMeta.defaultDirected
                }}
              >
                ${BARDIN_RELATION_TYPES.map(
                  (t) => html`<option value=${t.id} ?selected=${t.id === this._edgeTypeDraft}>${t.label}</option>`
                )}
              </select>
              <span style="font-weight: 400; color: #64748b; font-size: 0.76rem;">${meta.hint}</span>
            </label>

            <label class="field">
              Rótulo exibido na seta
              <input
                type="text"
                .value=${this._edgeLabelDraft}
                @input=${(e) => {
                  this._edgeLabelDraft = e.target.value
                }}
              />
              <label style="display: flex; align-items: center; gap: 6px; font-weight: 500; margin-top: 4px;">
                <input
                  type="checkbox"
                  .checked=${this._edgeDirectedDraft}
                  @change=${(e) => {
                    this._edgeDirectedDraft = e.target.checked
                  }}
                />
                Relação direcionada (com seta)
              </label>
            </label>
          </div>

          <label class="field">
            Nota analítica / inferência sobre esta ligação
            <textarea
              rows="2"
              placeholder="Descreva por que estes trechos se relacionam na sua análise temática…"
              .value=${this._edgeNoteDraft}
              @input=${(e) => {
                this._edgeNoteDraft = e.target.value
              }}
            ></textarea>
          </label>

          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <button type="button" class="btn primary small" @click=${() => this._handleSaveEdgeEdits(rel)}>
              <md-icon>check</md-icon> Aplicar alterações da relação
            </button>
          </div>
        </div>
      `
    }

    if (this.selectedExcerptId) {
      const q = excerptMap.get(this.selectedExcerptId)
      if (!q) return nothing
      const docTitle = docMap.get(q.docId)?.title || q.docTitle || 'Documento'
      const code = q.codeId ? codeMap.get(q.codeId) : null
      const attached = this.graph.relations.filter((r) => r.sourceId === q.id || r.targetId === q.id)
      const candidates = excerpts.filter((other) => other.id !== q.id)

      return html`
        <div class="inspector-card">
          <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 8px;">
            <div>
              <strong style="font-size: 1rem; color: #0f172a;">${q.title || '(sem título)'}</strong>
              <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">
                ${docTitle}${q.page ? ` · p. ${q.page}` : ''}
                ${code
                  ? html` · <span class="code-badge" style="background: ${code.color};">${code.name}</span>`
                  : ''}
              </div>
            </div>
            <div style="display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="btn small" @click=${() => this._startConnectFrom(q.id)}>
                <md-icon>timeline</md-icon> Conectar no grafo
              </button>
              <button type="button" class="btn small" @click=${() => openForReading(q.docId, { fullscreen: true })}>
                <md-icon>menu_book</md-icon> Abrir documento
              </button>
            </div>
          </div>

          <div class="quote-box">“${q.text}”</div>

          <div class="inspector-grid">
            <label class="field">
              Código temático (Livro de Códigos)
              <select
                .value=${q.codeId || ''}
                @change=${(e) => {
                  researchStorage.updateQuotation(q.docId, q.id, { codeId: e.target.value || null })
                }}
              >
                <option value="" ?selected=${!q.codeId}>— sem código —</option>
                ${this.codes.map(
                  (c) => html`<option value=${c.id} ?selected=${c.id === q.codeId}>${c.name}</option>`
                )}
              </select>
            </label>

            <div class="field">
              <span>Relações ligadas a este trecho (${attached.length})</span>
              ${attached.length
                ? html`<div class="rel-chip-list">
                    ${attached.map((r) => {
                      const otherId = r.sourceId === q.id ? r.targetId : r.sourceId
                      const other = excerptMap.get(otherId)
                      const arrow = !r.directed ? '↔' : r.sourceId === q.id ? '→' : '←'
                      return html`
                        <button type="button" class="rel-chip" @click=${() => this._selectRelation(r)}>
                          <span>${arrow} ${r.label}</span>
                          <strong>${truncateText(other?.title || 'Trecho', 20)}</strong>
                        </button>
                      `
                    })}
                  </div>`
                : html`<span style="font-weight: 400; color: #64748b;">Nenhuma relação criada ainda.</span>`}
            </div>
          </div>

          ${candidates.length
            ? html`
                <div style="border-top: 1px solid #e2e8f0; padding-top: 10px;">
                  <div style="font-weight: 600; font-size: 0.85rem; color: #006a6a; margin-bottom: 8px;">
                    Criar relação a partir desta marcação
                  </div>
                  <div class="inspector-grid">
                    <label class="field">
                      Conectar com a marcação
                      <select
                        .value=${this._draftTargetId}
                        @change=${(e) => {
                          this._draftTargetId = e.target.value
                        }}
                      >
                        <option value="">Escolha outro trecho…</option>
                        ${candidates.map(
                          (c) =>
                            html`<option value=${c.id} ?selected=${c.id === this._draftTargetId}>
                              ${truncateText(c.title || c.text, 44)} (${truncateText(
                                docMap.get(c.docId)?.title || c.docTitle || 'Doc',
                                18
                              )})
                            </option>`
                        )}
                      </select>
                    </label>

                    <label class="field">
                      Tipo de ligação (Bardin)
                      <select
                        .value=${this._draftRelType}
                        @change=${(e) => {
                          this._draftRelType = e.target.value
                        }}
                      >
                        ${BARDIN_RELATION_TYPES.map(
                          (t) => html`<option value=${t.id} ?selected=${t.id === this._draftRelType}>${t.label}</option>`
                        )}
                      </select>
                    </label>
                  </div>

                  <div class="inspector-grid" style="margin-top: 8px;">
                    <label class="field">
                      Rótulo opcional
                      <input
                        type="text"
                        placeholder=${getRelationTypeMeta(this._draftRelType).label}
                        .value=${this._draftRelLabel}
                        @input=${(e) => {
                          this._draftRelLabel = e.target.value
                        }}
                      />
                    </label>
                    <label class="field">
                      Nota analítica (opcional)
                      <input
                        type="text"
                        placeholder="Por que essas marcações se inter-relacionam?"
                        .value=${this._draftRelNote}
                        @input=${(e) => {
                          this._draftRelNote = e.target.value
                        }}
                      />
                    </label>
                  </div>

                  <div style="margin-top: 10px; display: flex; justify-content: flex-end;">
                    <button
                      type="button"
                      class="btn primary small"
                      ?disabled=${!this._draftTargetId}
                      @click=${() => this._handleCreateRelationFromInspector(q.id)}
                    >
                      <md-icon>add_link</md-icon> Adicionar relação no grafo
                    </button>
                  </div>
                </div>
              `
            : nothing}
        </div>
      `
    }

    return html`
      <div class="inspector-card" style="color: #475569; font-size: 0.86rem;">
        <strong>Como ajustar o grafo:</strong> arraste livremente os cartões no quadro para agrupar núcleos de sentido;
        use <strong>Conectar marcações</strong> (ou o botão <em>Conectar</em> no cartão) para ligar duas marcações com uma
        relação de Bardin; clique sobre uma seta para editar o rótulo e registrar sua nota inferencial; e clique em
        <strong>Salvar no GitHub</strong> para gravar trechos e grafo em JSON no repositório privado.
      </div>
    `
  }

  render() {
    const { excerpts, filteredExcerpts, visibleRelations, codeMap, docMap } = this._filteredData()
    const posMap = this._resolvedPositions(excerpts)
    const githubCfg = getGithubConfig()
    const vw = Math.round(VIEW_W / this.zoom)
    const vh = Math.round(VIEW_H / this.zoom)
    const relCountByExcerpt = new Map()
    for (const r of this.graph.relations) {
      relCountByExcerpt.set(r.sourceId, (relCountByExcerpt.get(r.sourceId) || 0) + 1)
      relCountByExcerpt.set(r.targetId, (relCountByExcerpt.get(r.targetId) || 0) + 1)
    }

    return html`
      <div class="page-header">
        <div>
          <h1>Todas as Marcações &amp; Grafo de Relações</h1>
          <div style="color: #475569; font-size: 0.92rem;">
            ${excerpts.length} marcação(ões) no corpus · ${this.graph.relations.length} relação(ões) mapeada(s)
          </div>
        </div>
        <div class="header-actions">
          <button
            type="button"
            class="btn primary"
            ?disabled=${this.githubSyncBusy}
            title=${this._githubConfigured
              ? `Commit & push JSON (trechos e grafo) para ${githubCfg.repo}`
              : 'Configurar repositório privado e salvar no GitHub'}
            @click=${this._handleGithubSave}
          >
            <md-icon>${this.githubSyncBusy ? 'sync' : 'cloud_upload'}</md-icon>
            ${this.githubSyncBusy ? 'Salvando JSON…' : 'Salvar no GitHub'}
          </button>
          <a class="btn" href="#/codificacao">
            <md-icon>edit_note</md-icon> Voltar à Codificação
          </a>
        </div>
      </div>

      <div class="theory-banner">
        <span>
          📚 <strong>Análise Temática &amp; das Relações (Bardin):</strong> agrupa marcações em núcleos de sentido e explicita
          coocorrências, convergências e contrastes antes da inferência teórica.
        </span>
        <a class="theory-link" href="#/teoria-bardin?secao=analise-tematica-relacoes">
          <md-icon style="font-size: 17px;">menu_book</md-icon>
          Consultar esse trecho da teoria de Bardin →
        </a>
      </div>

      ${this.githubSyncStatus
        ? html`
            <div class="sync-banner ${this.githubSyncStatus.kind}" role="status">
              ${this.githubSyncStatus.text}
              ${this.githubSyncStatus.link
                ? html` <a href=${this.githubSyncStatus.link} target="_blank" rel="noopener noreferrer">Ver commit ↗</a>`
                : nothing}
            </div>
          `
        : nothing}

      <div class="controls-bar">
        <select
          aria-label="Filtrar por documento"
          .value=${this.docFilter}
          @change=${(e) => {
            this.docFilter = e.target.value
          }}
        >
          <option value="all" ?selected=${this.docFilter === 'all'}>Todos os documentos (${this.documents.length})</option>
          ${this.documents.map(
            (d) => html`<option value=${d.id} ?selected=${this.docFilter === d.id}>${d.title}</option>`
          )}
        </select>

        <input
          type="search"
          placeholder="Buscar por título, trecho ou código…"
          .value=${this.searchQuery}
          @input=${(e) => {
            this.searchQuery = e.target.value
          }}
        />

        <button
          type="button"
          class="btn small ${this.connectMode ? 'active-mode' : ''}"
          @click=${this._toggleConnectMode}
        >
          <md-icon>timeline</md-icon>
          ${this.connectMode ? 'Conectando (clique para sair)' : 'Conectar marcações'}
        </button>

        <select
          aria-label="Tipo padrão ao conectar"
          .value=${this.connectType}
          @change=${(e) => {
            this.connectType = e.target.value
          }}
        >
          ${BARDIN_RELATION_TYPES.map(
            (t) => html`<option value=${t.id} ?selected=${t.id === this.connectType}>${t.label}</option>`
          )}
        </select>

        <button type="button" class="btn small" @click=${this._autoArrangeAll} title="Reorganizar cartões sem sobreposição">
          <md-icon>auto_fix_high</md-icon> Organizar nós
        </button>

        <button type="button" class="btn small" @click=${() => this._fitView()} title="Centralizar e ajustar zoom ao grafo">
          <md-icon>fit_screen</md-icon> Ajustar visão
        </button>

        <label style="display: inline-flex; align-items: center; gap: 6px; font-size: 0.84rem; color: #334155;">
          <input
            type="checkbox"
            .checked=${this.onlyConnected}
            @change=${(e) => {
              this.onlyConnected = e.target.checked
            }}
          />
          Só conectados
        </label>
      </div>

      ${!excerpts.length
        ? html`
            <div class="empty-state">
              <p style="margin: 0 0 12px; font-size: 1rem;">
                Ainda não há marcações salvas em nenhum documento do projeto.
              </p>
              <a class="btn primary" href="#/codificacao">
                <md-icon>edit_note</md-icon> Ir para Área de Codificação marcar trechos
              </a>
            </div>
          `
        : html`
            <div class="workspace">
              <div class="list-panel">
                <div class="list-header">
                  <span>Marcações (${filteredExcerpts.length})</span>
                  <span style="font-size: 0.78rem; color: #64748b; font-weight: 400;">
                    ${visibleRelations.length} aresta(s) visível(is)
                  </span>
                </div>

                ${filteredExcerpts.map((q) => {
                  const code = q.codeId ? codeMap.get(q.codeId) : null
                  const docTitle = docMap.get(q.docId)?.title || q.docTitle || 'Documento'
                  const borderColor = code?.color || q.color || DEFAULT_NODE_COLOR
                  const isSel = this.selectedExcerptId === q.id
                  const isSrc = this.connectSourceId === q.id
                  const relCount = relCountByExcerpt.get(q.id) || 0

                  return html`
                    <div
                      class="excerpt-card ${isSel ? 'selected' : ''} ${isSrc ? 'connect-source' : ''}"
                      style="border-left-color: ${borderColor};"
                      @click=${() => this._handleExcerptCardClick(q.id)}
                    >
                      <div class="excerpt-card-title">${q.title || '(sem título)'}</div>
                      <div class="excerpt-card-quote">“${truncateText(q.text, 150)}”</div>
                      <div class="excerpt-card-meta">
                        <span>${truncateText(docTitle, 26)}${q.page ? ` · p. ${q.page}` : ''}</span>
                        ${code
                          ? html`<span class="code-badge" style="background: ${code.color};">${code.name}</span>`
                          : nothing}
                        ${relCount ? html`<span>· ${relCount} ligação(ões)</span>` : nothing}
                      </div>
                      <div class="card-actions" @click=${(e) => e.stopPropagation()}>
                        <button type="button" class="link-btn" @click=${() => this._focusNode(q.id)}>Focar</button>
                        <button type="button" class="link-btn" @click=${() => this._startConnectFrom(q.id)}>
                          Conectar
                        </button>
                        <button
                          type="button"
                          class="link-btn"
                          @click=${() => openForReading(q.docId, { fullscreen: true })}
                        >
                          Abrir doc
                        </button>
                      </div>
                    </div>
                  `
                })}
              </div>

              <div class="graph-column">
                <div class="canvas-card">
                  <div class="canvas-overlay-top">
                    ${this.connectMode
                      ? html`
                          <div class="connect-hint">
                            <span>
                              ${this.connectSourceId
                                ? 'Agora clique na marcação de destino para criar a ligação.'
                                : 'Clique na marcação de origem para iniciar a ligação.'}
                            </span>
                            <button
                              type="button"
                              class="btn small"
                              style="height: 22px; padding: 0 8px;"
                              @click=${() => {
                                this.connectMode = false
                                this.connectSourceId = ''
                              }}
                            >
                              Cancelar
                            </button>
                          </div>
                        `
                      : html`<span></span>`}

                    <div class="zoom-controls">
                      <button type="button" class="btn small" @click=${() => this._adjustZoom(0.85)} aria-label="Diminuir zoom">
                        −
                      </button>
                      <span style="font-size: 0.78rem; font-weight: 600; min-width: 42px; text-align: center;">
                        ${Math.round(this.zoom * 100)}%
                      </span>
                      <button type="button" class="btn small" @click=${() => this._adjustZoom(1.18)} aria-label="Aumentar zoom">
                        +
                      </button>
                    </div>
                  </div>

                  <svg
                    class="graph-svg ${this._isPanning ? 'panning' : ''}"
                    viewBox="${this.viewX} ${this.viewY} ${vw} ${vh}"
                    preserveAspectRatio="xMidYMid meet"
                    @pointerdown=${this._onSvgPointerDown}
                    @pointermove=${this._onSvgPointerMove}
                    @pointerup=${this._onSvgPointerUp}
                    @pointercancel=${this._onSvgPointerUp}
                    @wheel=${this._onSvgWheel}
                  >
                    <defs>
                      ${BARDIN_RELATION_TYPES.map(
                        (t) => svg`
                          <marker
                            id="arrow-${t.id}"
                            viewBox="0 0 10 10"
                            refX="9"
                            refY="5"
                            markerWidth="7"
                            markerHeight="7"
                            orient="auto-start-reverse"
                          >
                            <path d="M 0 1 L 10 5 L 0 9 z" fill=${t.color} />
                          </marker>
                        `
                      )}
                      <marker
                        id="arrow-selected"
                        viewBox="0 0 10 10"
                        refX="9"
                        refY="5"
                        markerWidth="7"
                        markerHeight="7"
                        orient="auto-start-reverse"
                      >
                        <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
                      </marker>
                    </defs>
                    ${this._renderSvgEdges(visibleRelations, posMap)}
                    ${this._renderSvgNodes(filteredExcerpts, posMap, codeMap, docMap)}
                  </svg>
                </div>

                ${this._renderInspector(excerpts, codeMap, docMap)}
              </div>
            </div>
          `}
    `
  }
}

customElements.define('caqdas-graph-view', CaqdasGraphView)
