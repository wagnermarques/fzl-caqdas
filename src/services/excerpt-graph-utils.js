export const GRAPH_SCHEMA = 'caqdas-grafo/v1'
export const NODE_WIDTH = 200
export const NODE_HEIGHT = 82

export const BARDIN_RELATION_TYPES = Object.freeze([
  {
    id: 'associa',
    label: 'associa-se / coocorre',
    defaultDirected: false,
    color: '#0284c7',
    hint: 'Análise das Relações (coocorrência): unidades que aparecem juntas ou dialogam no corpus.'
  },
  {
    id: 'converge',
    label: 'converge / reforça',
    defaultDirected: false,
    color: '#059669',
    hint: 'Agrupamento analógico: trechos que convergem para um mesmo núcleo de sentido.'
  },
  {
    id: 'fundamenta',
    label: 'fundamenta / explica',
    defaultDirected: true,
    color: '#006a6a',
    hint: 'Um trecho oferece evidência empírica ou explicação para outro.'
  },
  {
    id: 'causa',
    label: 'influencia / condiciona',
    defaultDirected: true,
    color: '#7c3aed',
    hint: 'Relação de condição de produção, antecedente ou efeito inferido.'
  },
  {
    id: 'contrasta',
    label: 'contrasta / tenciona',
    defaultDirected: false,
    color: '#dc2626',
    hint: 'Oposição, tensão ou distinção temática relevante para a categorização.'
  },
  {
    id: 'parte-de',
    label: 'subtema de / compõe',
    defaultDirected: true,
    color: '#d97706',
    hint: 'Relação hierárquica (funil categorial): trecho ou subtema que compõe tema mais amplo.'
  },
  {
    id: 'custom',
    label: 'relação personalizada',
    defaultDirected: true,
    color: '#475569',
    hint: 'Relação analítica livre definida pelo pesquisador.'
  }
])

const RELATION_TYPE_MAP = new Map(BARDIN_RELATION_TYPES.map((t) => [t.id, t]))

export function getRelationTypeMeta(typeId) {
  return RELATION_TYPE_MAP.get(typeId) || RELATION_TYPE_MAP.get('associa')
}

const EPOCH_ISO = new Date(0).toISOString()

export function normalizeRelation(raw) {
  const r = raw || {}
  const sourceId = String(r.sourceId || '').trim()
  const targetId = String(r.targetId || '').trim()
  if (!sourceId || !targetId || sourceId === targetId) return null

  const type = RELATION_TYPE_MAP.has(r.type) ? r.type : 'associa'
  const meta = getRelationTypeMeta(type)
  const createdAt = typeof r.createdAt === 'string' && r.createdAt ? r.createdAt : EPOCH_ISO
  const updatedAt = typeof r.updatedAt === 'string' && r.updatedAt ? r.updatedAt : createdAt
  const label = String(r.label ?? '').trim() || meta.label
  const directed = typeof r.directed === 'boolean' ? r.directed : meta.defaultDirected

  return {
    id: String(r.id || '').trim(),
    sourceId,
    targetId,
    type,
    label,
    directed,
    note: String(r.note || ''),
    createdAt,
    updatedAt
  }
}

function normalizeNodePos(raw) {
  if (!raw || typeof raw !== 'object') return null
  const x = Number(raw.x)
  const y = Number(raw.y)
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return {
    x: Math.round(x),
    y: Math.round(y),
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : EPOCH_ISO
  }
}

export function normalizeExcerptGraph(rawGraph) {
  const g = rawGraph || {}
  const nodes = {}
  if (g.nodes && typeof g.nodes === 'object' && !Array.isArray(g.nodes)) {
    for (const [excerptId, rawPos] of Object.entries(g.nodes)) {
      const id = String(excerptId || '').trim()
      if (!id) continue
      const pos = normalizeNodePos(rawPos)
      if (pos) nodes[id] = pos
    }
  }

  const tombstoneMap = new Map()
  const rawDeleted = Array.isArray(g.deletedRelations)
    ? g.deletedRelations
    : Array.isArray(g.deleted)
      ? g.deleted
      : []
  for (const mark of rawDeleted) {
    const id = String(mark?.id || '').trim()
    if (!id || typeof mark?.deletedAt !== 'string' || !mark.deletedAt) continue
    const prev = tombstoneMap.get(id)
    if (!prev || mark.deletedAt > prev.deletedAt) {
      tombstoneMap.set(id, { id, deletedAt: mark.deletedAt })
    }
  }

  const relMap = new Map()
  for (const rawRel of Array.isArray(g.relations) ? g.relations : []) {
    const rel = normalizeRelation(rawRel)
    if (!rel || !rel.id) continue
    const tomb = tombstoneMap.get(rel.id)
    if (tomb && tomb.deletedAt >= rel.updatedAt) continue
    const prev = relMap.get(rel.id)
    if (!prev || rel.updatedAt > prev.updatedAt) {
      relMap.set(rel.id, rel)
    }
  }

  return {
    nodes,
    relations: [...relMap.values()],
    deletedRelations: [...tombstoneMap.values()]
  }
}

/**
 * Mescla o grafo local com o vindo do remoto/JSON exportado:
 * - relações e posições de nós: o `updatedAt` mais recente vence;
 * - tombstones (`deleted` / `deletedRelations`): suprimem relações mais antigas.
 */
export function mergeExcerptGraphs(localGraph, incomingPayload) {
  const local = normalizeExcerptGraph(localGraph)
  const nodes = { ...local.nodes }
  const relMap = new Map(local.relations.map((r) => [r.id, r]))
  const tombstoneMap = new Map(local.deletedRelations.map((m) => [m.id, m]))

  let added = 0
  let updated = 0
  let removed = 0
  let nodesChanged = false
  let tombstonesChanged = false

  const rawDeleted = Array.isArray(incomingPayload?.deletedRelations)
    ? incomingPayload.deletedRelations
    : Array.isArray(incomingPayload?.deleted)
      ? incomingPayload.deleted
      : []

  for (const mark of rawDeleted) {
    const id = String(mark?.id || '').trim()
    if (!id || typeof mark?.deletedAt !== 'string' || !mark.deletedAt) continue
    const prev = tombstoneMap.get(id)
    if (!prev || mark.deletedAt > prev.deletedAt) {
      tombstoneMap.set(id, { id, deletedAt: mark.deletedAt })
      tombstonesChanged = true
    }
  }

  for (const rawRel of Array.isArray(incomingPayload?.relations) ? incomingPayload.relations : []) {
    const incoming = normalizeRelation(rawRel)
    if (!incoming || !incoming.id) continue
    const tomb = tombstoneMap.get(incoming.id)
    if (tomb && tomb.deletedAt >= incoming.updatedAt) continue
    const existing = relMap.get(incoming.id)
    if (!existing) {
      relMap.set(incoming.id, incoming)
      added++
    } else if (incoming.updatedAt > existing.updatedAt) {
      relMap.set(incoming.id, incoming)
      updated++
    }
  }

  for (const [id, rel] of [...relMap.entries()]) {
    const tomb = tombstoneMap.get(id)
    if (tomb && tomb.deletedAt >= rel.updatedAt) {
      relMap.delete(id)
      removed++
    }
  }

  if (incomingPayload?.nodes && typeof incomingPayload.nodes === 'object' && !Array.isArray(incomingPayload.nodes)) {
    for (const [excerptId, rawPos] of Object.entries(incomingPayload.nodes)) {
      const id = String(excerptId || '').trim()
      if (!id) continue
      const incomingPos = normalizeNodePos(rawPos)
      if (!incomingPos) continue
      const existingPos = nodes[id]
      if (!existingPos || incomingPos.updatedAt > existingPos.updatedAt) {
        nodes[id] = incomingPos
        nodesChanged = true
      }
    }
  }

  const changed = Boolean(added || updated || removed || nodesChanged || tombstonesChanged)
  return {
    graph: {
      nodes,
      relations: [...relMap.values()],
      deletedRelations: [...tombstoneMap.values()]
    },
    added,
    updated,
    removed,
    changed
  }
}

function rectsOverlap(ax, ay, bx, by, w, h, pad = 20) {
  return Math.abs(ax - bx) < w + pad && Math.abs(ay - by) < h + pad
}

/**
 * Calcula posições em grade sem sobreposição para as marcações no canvas.
 * Quando `forceAll = false`, mantém posições existentes e aloca apenas nós novos.
 */
export function computeAutoLayout(
  excerpts,
  existingNodes = {},
  { forceAll = false, width = 960, nodeWidth = NODE_WIDTH, nodeHeight = NODE_HEIGHT } = {}
) {
  const list = Array.isArray(excerpts) ? excerpts : []
  const now = new Date().toISOString()

  // Agrupa por documento na ordem de aparição para facilitar leitura inicial
  const docOrder = []
  const byDoc = new Map()
  for (const q of list) {
    if (!q?.id) continue
    const docKey = String(q.docId || '')
    if (!byDoc.has(docKey)) {
      docOrder.push(docKey)
      byDoc.set(docKey, [])
    }
    byDoc.get(docKey).push(q)
  }
  const ordered = docOrder.flatMap((k) => byDoc.get(k))

  const result = {}
  const placed = []

  if (!forceAll) {
    for (const q of ordered) {
      const pos = normalizeNodePos(existingNodes?.[q.id])
      if (pos) {
        result[q.id] = pos
        placed.push(pos)
      }
    }
  }

  const gapX = 52
  const gapY = 48
  const stepX = nodeWidth + gapX
  const stepY = nodeHeight + gapY
  const padX = 48
  const padY = 48
  const maxFitCols = Math.max(1, Math.floor((Math.max(width, stepX + padX * 2) - padX) / stepX))
  const desiredCols = ordered.length <= 1 ? 1 : ordered.length <= 4 ? 2 : ordered.length <= 12 ? 3 : 4
  const cols = Math.max(1, Math.min(desiredCols, maxFitCols))

  let slotIndex = 0
  for (const q of ordered) {
    if (result[q.id]) continue

    let candidateX = 0
    let candidateY = 0
    // Encontra o primeiro slot livre que não colida com nós já posicionados
    for (let guard = 0; guard < 10_000; guard++) {
      const col = slotIndex % cols
      const row = Math.floor(slotIndex / cols)
      slotIndex++
      candidateX = Math.round(padX + col * stepX)
      candidateY = Math.round(padY + row * stepY)
      const overlaps = placed.some((p) => rectsOverlap(candidateX, candidateY, p.x, p.y, nodeWidth, nodeHeight, 16))
      if (!overlaps) break
    }

    const pos = { x: candidateX, y: candidateY, updatedAt: now }
    result[q.id] = pos
    placed.push(pos)
  }

  return result
}

function rectEdgePoint(cx, cy, targetX, targetY, halfW, halfH) {
  const dx = targetX - cx
  const dy = targetY - cy
  if (Math.abs(dx) < 1e-6 && Math.abs(dy) < 1e-6) return { x: cx, y: cy }
  const sx = Math.abs(dx) > 1e-6 ? halfW / Math.abs(dx) : Infinity
  const sy = Math.abs(dy) > 1e-6 ? halfH / Math.abs(dy) : Infinity
  const t = Math.min(sx, sy)
  return { x: cx + dx * t, y: cy + dy * t }
}

/**
 * Calcula pontos de interseção nas bordas dos cartões, curva quadrática e ponto médio da aresta.
 */
export function computeEdgePath(srcPos, dstPos, { curveIndex = 0, nodeWidth = NODE_WIDTH, nodeHeight = NODE_HEIGHT } = {}) {
  const halfW = nodeWidth / 2 + 2
  const halfH = nodeHeight / 2 + 2
  const cx1 = srcPos.x + nodeWidth / 2
  const cy1 = srcPos.y + nodeHeight / 2
  const cx2 = dstPos.x + nodeWidth / 2
  const cy2 = dstPos.y + nodeHeight / 2

  const dx = cx2 - cx1
  const dy = cy2 - cy1
  const dist = Math.hypot(dx, dy) || 1
  const nx = -dy / dist
  const ny = dx / dist
  const offset = curveIndex * 44

  const qcx = (cx1 + cx2) / 2 + nx * offset
  const qcy = (cy1 + cy2) / 2 + ny * offset

  const p1 = rectEdgePoint(cx1, cy1, qcx, qcy, halfW, halfH)
  const p2 = rectEdgePoint(cx2, cy2, qcx, qcy, halfW, halfH)

  const midX = 0.25 * p1.x + 0.5 * qcx + 0.25 * p2.x
  const midY = 0.25 * p1.y + 0.5 * qcy + 0.25 * p2.y

  return {
    x1: Math.round(p1.x * 10) / 10,
    y1: Math.round(p1.y * 10) / 10,
    x2: Math.round(p2.x * 10) / 10,
    y2: Math.round(p2.y * 10) / 10,
    cx: Math.round(qcx * 10) / 10,
    cy: Math.round(qcy * 10) / 10,
    midX: Math.round(midX * 10) / 10,
    midY: Math.round(midY * 10) / 10,
    d: `M ${Math.round(p1.x * 10) / 10} ${Math.round(p1.y * 10) / 10} Q ${Math.round(qcx * 10) / 10} ${Math.round(qcy * 10) / 10} ${Math.round(p2.x * 10) / 10} ${Math.round(p2.y * 10) / 10}`
  }
}
