import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_NOTEBOOK_NAME,
  sanitizeNotebookName,
  extractNotebookId,
  buildNotebookWebUrl,
  formatSourceDisplayName,
  splitTextIntoNotebookChunks,
  buildCorpusExcerptsSummaryMarkdown,
  buildFullCorpusMarkdownBundle,
  planNotebookSourceUploads,
} from '../src/services/notebook-utils.js'

test('sanitizeNotebookName retorna padrão quando vazio e limpa espaços extras', () => {
  assert.equal(sanitizeNotebookName(''), DEFAULT_NOTEBOOK_NAME)
  assert.equal(sanitizeNotebookName('   '), DEFAULT_NOTEBOOK_NAME)
  assert.equal(sanitizeNotebookName(null), DEFAULT_NOTEBOOK_NAME)
  assert.equal(sanitizeNotebookName('  Meu   Notebook  '), 'Meu Notebook')
})

test('extractNotebookId e buildNotebookWebUrl normalizam resource name e ID', () => {
  assert.equal(extractNotebookId('notebooks/abc-123'), 'abc-123')
  assert.equal(extractNotebookId('abc-123'), 'abc-123')
  assert.equal(extractNotebookId(''), '')
  assert.equal(
    buildNotebookWebUrl('notebooks/abc-123'),
    'https://notebooklm.google.com/notebook/abc-123',
  )
  assert.equal(buildNotebookWebUrl(''), 'https://notebooklm.google.com/')
})

test('formatSourceDisplayName usa título, fallback para id e trunca em 200 chars', () => {
  assert.equal(formatSourceDisplayName({ title: '  Entrevista 1.txt  ' }), 'Entrevista 1.txt')
  assert.equal(formatSourceDisplayName({ id: 'doc-9' }), 'doc-9')
  assert.equal(formatSourceDisplayName({}), 'Documento sem título')
  assert.equal(formatSourceDisplayName({ title: 'a'.repeat(250) }).length, 200)
})

test('splitTextIntoNotebookChunks mantém textos curtos inteiros e divide textos grandes por limite em bytes', () => {
  assert.deepEqual(splitTextIntoNotebookChunks(''), [])
  assert.deepEqual(splitTextIntoNotebookChunks('Texto curto'), ['Texto curto'])

  const para = 'Parágrafo de pesquisa qualitativa com acentuação: é, ã, ç.\n\n'
  const bigText = para.repeat(30)
  const chunks = splitTextIntoNotebookChunks(bigText, 300)
  assert.ok(chunks.length > 1)
  for (const chunk of chunks) {
    assert.ok(Buffer.byteLength(chunk, 'utf8') <= 300)
  }
  assert.equal(chunks.join('\n\n').replace(/\s+/g, ' ').trim(), bigText.replace(/\s+/g, ' ').trim())
})

test('buildCorpusExcerptsSummaryMarkdown gera resumo com códigos, categorias, trechos e relações', () => {
  const md = buildCorpusExcerptsSummaryMarkdown({
    project: { name: 'Projeto Bardin', description: 'Pesquisa sobre Educação' },
    documents: [
      {
        id: 'd1',
        title: 'Doc 1.txt',
        quotations: [
          {
            id: 'e1',
            title: 'Fala 1',
            codeId: 'c1',
            page: 3,
            text: 'O estudante desenvolveu autonomia ao longo do semestre.',
            note: 'Trecho chave',
          },
        ],
      },
    ],
    codes: [{ id: 'c1', name: 'Autonomia', categoryId: 'cat1' }],
    categories: [{ id: 'cat1', name: 'Práticas' }],
    graph: {
      relations: [{ sourceId: 'e1', targetId: 'e1', label: 'reforça', note: 'Auto-referência' }],
    },
  })

  assert.match(md, /# Projeto Bardin/)
  assert.match(md, /Pesquisa sobre Educação/)
  assert.match(md, /\*\*Autonomia\*\* \(Categoria: Práticas\)/)
  assert.match(md, /### Doc 1\.txt/)
  assert.match(md, /O estudante desenvolveu autonomia/)
  assert.match(md, /Trecho chave/)
  assert.match(md, /\*\*\[reforça\]\*\*/)
})

test('buildFullCorpusMarkdownBundle concatena documentos e resumo', () => {
  const bundle = buildFullCorpusMarkdownBundle({
    project: { name: 'Projeto Teste' },
    documents: [
      { id: 'd1', title: 'Entrevista A', participant: 'Prof. A', content: 'Conteúdo integral A' },
      { id: 'd2', title: 'PDF Binário', storageType: 'indexeddb-file' },
    ],
    codes: [],
    categories: [],
    graph: { relations: [] },
  })

  assert.match(bundle, /## Entrevista A/)
  assert.match(bundle, /\*Participante \/ Origem:\* Prof\. A/)
  assert.match(bundle, /Conteúdo integral A/)
  assert.match(bundle, /## PDF Binário/)
  assert.match(bundle, /_Conteúdo textual ainda não extraído neste dispositivo\._/)
})

test('planNotebookSourceUploads evita duplicatas já presentes no notebook e marca binários sem texto', () => {
  const docs = [
    { id: 'd1', title: 'Doc Já Enviado.txt', content: 'Texto já presente no notebook' },
    { id: 'd2', title: 'Novo Texto.txt', content: 'Novo conteúdo de entrevista' },
    { id: 'd3', title: 'Lei.pdf', storageType: 'indexeddb-file', mimeType: 'application/pdf' },
  ]
  const existingSources = [{ displayName: 'doc já enviado.txt' }]

  const plan = planNotebookSourceUploads({
    existingSources,
    documents: docs,
    summaryMarkdown: '# Resumo',
    summaryTitle: 'CAQDAS — Códigos, Trechos e Grafo (Bardin).md',
  })

  assert.equal(plan.alreadyPresent.length, 1)
  assert.equal(plan.alreadyPresent[0].displayName, 'Doc Já Enviado.txt')

  const kinds = plan.toUpload.map((item) => [item.kind, item.displayName])
  assert.deepEqual(kinds, [
    ['text', 'Novo Texto.txt'],
    ['binary-or-skip', 'Lei.pdf'],
    ['text', 'CAQDAS — Códigos, Trechos e Grafo (Bardin).md'],
  ])
})
