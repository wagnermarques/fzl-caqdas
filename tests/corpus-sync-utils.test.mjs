import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  inferExtension,
  inferDocType,
  mergeRemoteDocuments,
  mergeRemoteCodes
} from '../src/services/corpus-sync-utils.js'

describe('corpus-sync-utils', () => {
  it('infers extensions and document types for titles and MIME types', () => {
    assert.equal(inferExtension('00+ID+16679+RIAEE+PT.pdf'), '.pdf')
    assert.equal(inferExtension('Entrevista_01.DOCX'), '.docx')
    assert.equal(inferExtension('notas.txt'), '.txt')
    assert.equal(inferExtension('SemExtensao'), '')
    assert.equal(inferExtension('Arquivo', 'pdf'), '.pdf')

    assert.equal(inferDocType('', '.pdf'), 'pdf')
    assert.equal(inferDocType('', '.docx'), 'docx')
    assert.equal(inferDocType('', '.txt'), 'interview')
    assert.equal(inferDocType('', '', 'audio/webm'), 'audio')
    assert.equal(inferDocType('', '', 'video/webm'), 'video')
    assert.equal(inferDocType('pdf', '.txt'), 'pdf')
  })

  it('restores remote documents on an empty new-device corpus with cloud metadata', () => {
    const remote = [
      {
        id: 'doc-1',
        title: '16_MariaCandida.pdf',
        type: 'pdf',
        participant: 'Maria Cândida',
        folder: 'entrevistas',
        remote: {
          provider: 'google-drive',
          fileId: 'drive-file-123',
          url: 'https://drive.google.com/file/d/drive-file-123/view'
        }
      },
      {
        id: 'doc-2',
        title: 'transcricao.docx',
        remote: {
          provider: 'onedrive',
          fileId: 'od-456',
          url: 'https://1drv.ms/od-456'
        }
      },
      {
        id: 'doc-3',
        title: 'campo.txt',
        type: 'interview'
      }
    ]

    const res = mergeRemoteDocuments([], remote, { formatFolder: (f) => `/APP-CAQDAS-HOME-DIR/${f}` })
    assert.equal(res.added, 3)
    assert.equal(res.updated, 0)
    assert.equal(res.documents.length, 3)

    const pdfDoc = res.documents.find((d) => d.id === 'doc-1')
    assert.equal(pdfDoc.type, 'pdf')
    assert.equal(pdfDoc.extension, '.pdf')
    assert.equal(pdfDoc.googleDriveFileId, 'drive-file-123')
    assert.equal(pdfDoc.storageProvider, 'google-drive')
    assert.equal(pdfDoc.externalViewerUrl, 'https://drive.google.com/file/d/drive-file-123/view')
    assert.deepEqual(pdfDoc.quotations, [])

    const docxDoc = res.documents.find((d) => d.id === 'doc-2')
    assert.equal(docxDoc.type, 'docx')
    assert.equal(docxDoc.extension, '.docx')
    assert.equal(docxDoc.storageProvider, 'onedrive')
    assert.equal(docxDoc.folder, '/APP-CAQDAS-HOME-DIR/entrevistas')
  })

  it('deduplicates by id, remote fileId, or title while preserving local content and quotations', () => {
    const localDocs = [
      {
        id: 'doc-local-1',
        title: '16_MariaCandida.pdf',
        type: 'pdf',
        content: 'Texto já extraído localmente',
        docxBlocks: [{ type: 'paragraph', text: 'Texto já extraído localmente', page: 1 }],
        quotations: [{ id: 'q1', text: 'extraído' }]
      },
      {
        id: 'doc-cloud-xyz',
        title: 'OutroNome.pdf',
        type: 'pdf',
        extension: '.pdf',
        googleDriveFileId: 'drive-xyz',
        content: 'Conteúdo nuvem local',
        quotations: []
      }
    ]

    const remoteDocs = [
      // Casa por id
      { id: 'doc-local-1', title: '16_MariaCandida.pdf', remote: { provider: 'google-drive', fileId: 'drive-1' } },
      // Repete do trechos.json.documents com mesmo id -> não duplica
      { id: 'doc-local-1', title: '16_MariaCandida.pdf' },
      // Casa por googleDriveFileId mesmo com id/título diferente
      { id: 'doc-orig', title: 'Renomeado.pdf', remote: { provider: 'google-drive', fileId: 'drive-xyz' } },
      // Mesmo título porém fileId explicitamente diferente -> cria novo registro sem colidir
      { id: 'doc-other', title: 'OutroNome.pdf', remote: { provider: 'google-drive', fileId: 'drive-other' } }
    ]

    const res = mergeRemoteDocuments(localDocs, remoteDocs)
    assert.equal(res.added, 1)
    assert.equal(res.updated, 1)
    assert.equal(res.documents.length, 3)

    const mergedFirst = res.documents.find((d) => d.id === 'doc-local-1')
    assert.equal(mergedFirst.content, 'Texto já extraído localmente')
    assert.equal(mergedFirst.quotations.length, 1)
    assert.equal(mergedFirst.googleDriveFileId, 'drive-1')

    const matchedByFileId = res.documents.find((d) => d.id === 'doc-cloud-xyz')
    assert.equal(matchedByFileId.content, 'Conteúdo nuvem local')
  })

  it('preserves legislation metadata and routes legislation documents into /legislacao folder', () => {
    const remote = [
      {
        id: 'doc-lei-13005-2014',
        title: 'Lei nº 13.005/2014 — Plano Nacional de Educação (PNE)',
        type: 'legislation',
        participant: 'Legislação Federal',
        legislation: {
          catalogId: 'lei-13005-2014',
          tipo: 'LEI',
          numero: '13005',
          ano: '2014',
          planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm'
        }
      }
    ]

    const res = mergeRemoteDocuments([], remote, { formatFolder: (f) => `/APP-CAQDAS-HOME-DIR/${f}` })
    assert.equal(res.added, 1)
    assert.equal(res.documents[0].folder, '/APP-CAQDAS-HOME-DIR/legislacao')
    assert.equal(res.documents[0].type, 'legislation')
    assert.equal(res.documents[0].legislation?.numero, '13005')
  })

  it('restores missing codes without overwriting existing local codes', () => {
    const local = [
      { id: 'c1', name: 'Afeto (editado local)', color: '#111111', categoryId: 'cat-1' }
    ]
    const remote = [
      { id: 'c1', name: 'Afeto antigo', color: '#999999', categoryId: null },
      { id: 'c2', name: 'Práxis emancipadora', color: '#059669', categoryId: 'cat-2' }
    ]

    const res = mergeRemoteCodes(local, remote)
    assert.equal(res.added, 1)
    assert.equal(res.codes.length, 2)
    assert.equal(res.codes[0].name, 'Afeto (editado local)')
    assert.equal(res.codes[0].color, '#111111')
    assert.deepEqual(res.codes[1], {
      id: 'c2',
      name: 'Práxis emancipadora',
      color: '#059669',
      categoryId: 'cat-2'
    })
  })
})
