import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  GRAPH_SCHEMA,
  NODE_WIDTH,
  NODE_HEIGHT,
  BARDIN_RELATION_TYPES,
  normalizeRelation,
  normalizeExcerptGraph,
  mergeExcerptGraphs,
  computeAutoLayout,
  computeEdgePath
} from '../src/services/excerpt-graph-utils.js'

describe('excerpt-graph-utils', () => {
  it('normalizes relations, applies type defaults, and rejects self-loops', () => {
    assert.equal(GRAPH_SCHEMA, 'caqdas-grafo/v1')
    assert.ok(BARDIN_RELATION_TYPES.length >= 6)

    const selfLoop = normalizeRelation({ id: 'r0', sourceId: 'q1', targetId: 'q1', type: 'associa' })
    assert.equal(selfLoop, null)

    const missing = normalizeRelation({ id: 'r1', sourceId: 'q1' })
    assert.equal(missing, null)

    const rel = normalizeRelation({
      id: 'r2',
      sourceId: 'q1',
      targetId: 'q2',
      type: 'fundamenta',
      note: 'A fala fundamenta a categoria.'
    })
    assert.equal(rel.directed, true)
    assert.equal(rel.label, 'fundamenta / explica')
    assert.equal(rel.note, 'A fala fundamenta a categoria.')

    const normalized = normalizeExcerptGraph({
      nodes: {
        q1: { x: 100.4, y: 200.6, updatedAt: '2026-11-23T10:00:00Z' },
        bad: { x: 'NaN', y: 50 }
      },
      relations: [
        rel,
        { id: 'r3', sourceId: 'q2', targetId: 'q2', type: 'associa' },
        { id: 'r4', sourceId: 'q2', targetId: 'q3', type: 'associa', updatedAt: '2026-11-23T09:00:00Z' }
      ],
      deletedRelations: [{ id: 'r4', deletedAt: '2026-11-23T10:00:00Z' }]
    })

    assert.deepEqual(Object.keys(normalized.nodes), ['q1'])
    assert.equal(normalized.nodes.q1.x, 100)
    assert.equal(normalized.nodes.q1.y, 201)
    assert.deepEqual(
      normalized.relations.map((r) => r.id),
      ['r2']
    )
  })

  it('merges local and remote graphs by updatedAt and honors tombstones', () => {
    const local = {
      nodes: {
        q1: { x: 100, y: 100, updatedAt: '2026-11-23T12:00:00Z' },
        q2: { x: 320, y: 100, updatedAt: '2026-11-23T10:00:00Z' }
      },
      relations: [
        {
          id: 'r-edit',
          sourceId: 'q1',
          targetId: 'q2',
          type: 'associa',
          label: 'rótulo antigo',
          directed: false,
          createdAt: '2026-11-23T09:00:00Z',
          updatedAt: '2026-11-23T10:00:00Z'
        },
        {
          id: 'r-del',
          sourceId: 'q1',
          targetId: 'q3',
          type: 'contrasta',
          createdAt: '2026-11-23T09:00:00Z',
          updatedAt: '2026-11-23T09:30:00Z'
        }
      ],
      deletedRelations: [{ id: 'r-recreated', deletedAt: '2026-11-23T09:00:00Z' }]
    }

    const remote = {
      nodes: {
        q1: { x: 999, y: 999, updatedAt: '2026-11-23T11:00:00Z' }, // mais antiga: local vence
        q2: { x: 500, y: 240, updatedAt: '2026-11-23T13:00:00Z' } // mais nova: remota vence
      },
      relations: [
        {
          id: 'r-edit',
          sourceId: 'q1',
          targetId: 'q2',
          type: 'causa',
          label: 'rótulo atualizado',
          directed: true,
          createdAt: '2026-11-23T09:00:00Z',
          updatedAt: '2026-11-23T13:00:00Z'
        },
        {
          id: 'r-recreated',
          sourceId: 'q2',
          targetId: 'q3',
          type: 'converge',
          createdAt: '2026-11-23T08:00:00Z',
          updatedAt: '2026-11-23T11:00:00Z' // mais recente que tombstone local
        }
      ],
      deleted: [{ id: 'r-del', deletedAt: '2026-11-23T12:00:00Z' }]
    }

    const res = mergeExcerptGraphs(local, remote)
    assert.equal(res.changed, true)
    assert.equal(res.added, 1) // r-recreated
    assert.equal(res.updated, 1) // r-edit
    assert.equal(res.removed, 1) // r-del

    assert.equal(res.graph.nodes.q1.x, 100)
    assert.equal(res.graph.nodes.q2.x, 500)
    assert.equal(res.graph.relations.length, 2)
    const edited = res.graph.relations.find((r) => r.id === 'r-edit')
    assert.equal(edited.label, 'rótulo atualizado')
    assert.equal(edited.directed, true)
    assert.ok(res.graph.relations.some((r) => r.id === 'r-recreated'))
    assert.ok(!res.graph.relations.some((r) => r.id === 'r-del'))
  })

  it('computes non-overlapping auto-layout and preserves existing coordinates when forceAll is false', () => {
    const excerpts = [
      { id: 'q1', docId: 'd1', text: 'a' },
      { id: 'q2', docId: 'd1', text: 'b' },
      { id: 'q3', docId: 'd2', text: 'c' },
      { id: 'q4', docId: 'd2', text: 'd' },
      { id: 'q5', docId: 'd2', text: 'e' }
    ]

    const existing = {
      q1: { x: 48, y: 48, updatedAt: '2026-11-23T10:00:00Z' },
      q2: { x: 640, y: 310, updatedAt: '2026-11-23T10:00:00Z' }
    }

    const partial = computeAutoLayout(excerpts, existing, { forceAll: false })
    assert.equal(partial.q1.x, 48)
    assert.equal(partial.q2.x, 640)
    assert.equal(partial.q2.y, 310)

    const ids = excerpts.map((e) => e.id)
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = partial[ids[i]]
        const b = partial[ids[j]]
        const overlap = Math.abs(a.x - b.x) < NODE_WIDTH && Math.abs(a.y - b.y) < NODE_HEIGHT
        assert.equal(overlap, false, `Expected ${ids[i]} and ${ids[j]} not to overlap`)
      }
    }

    const full = computeAutoLayout(excerpts, existing, { forceAll: true })
    assert.notEqual(full.q2.x, 640)
  })

  it('computes card-border edge paths and distinct curves for parallel edges', () => {
    const src = { x: 0, y: 0 }
    const dst = { x: 400, y: 0 }

    const straight = computeEdgePath(src, dst, { curveIndex: 0 })
    assert.equal(straight.x1, NODE_WIDTH + 2)
    assert.equal(straight.y1, NODE_HEIGHT / 2)
    assert.equal(straight.x2, 400 - 2)
    assert.equal(straight.y2, NODE_HEIGHT / 2)
    assert.ok(straight.d.startsWith('M '))

    const curvedUp = computeEdgePath(src, dst, { curveIndex: 1 })
    const curvedDown = computeEdgePath(src, dst, { curveIndex: -1 })
    assert.notEqual(curvedUp.midY, straight.midY)
    assert.notEqual(curvedUp.midY, curvedDown.midY)
  })
})
