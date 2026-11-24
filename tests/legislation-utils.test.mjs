import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  normalizeTipo,
  formatLawNumber,
  buildLegislationDocId,
  parseLegislationUrl,
  parseSearchQuery,
  decodeHtmlEntities,
  decodeHtmlBytes,
  classifyLawParagraph,
  parseLegislationHtmlToBlocks,
  parseLegislationTextToBlocks,
  extractCamaraFullTextUrl
} from '../src/services/legislation-utils.js'
import { searchCatalog, findCatalogEntry } from '../src/services/legislation-catalog.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PNE_JSON_PATH = resolve(__dirname, '../public/data/legislacao/lei-13005-2014.json')

describe('legislation-utils', () => {
  it('parses Planalto, Camara, Normas.leg.br, and invalid URLs', () => {
    const pne = parseLegislationUrl('https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm')
    assert.equal(pne.ok, true)
    assert.equal(pne.source, 'planalto')
    assert.equal(pne.tipo, 'LEI')
    assert.equal(pne.numero, '13005')
    assert.equal(pne.ano, '2014')

    const compilado = parseLegislationUrl('www.planalto.gov.br/ccivil_03/leis/lcp/lcp101compilado.htm')
    assert.equal(compilado.ok, true)
    assert.equal(compilado.tipo, 'LCP')
    assert.equal(compilado.numero, '101')

    const dec = parseLegislationUrl('https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2023/decreto/d11697.htm')
    assert.equal(dec.ok, true)
    assert.equal(dec.tipo, 'DEC')
    assert.equal(dec.numero, '11697')
    assert.equal(dec.ano, '2023')

    const emc = parseLegislationUrl('https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc108.htm')
    assert.equal(emc.ok, true)
    assert.equal(emc.tipo, 'EMC')
    assert.equal(emc.numero, '108')

    const camaraUpd = parseLegislationUrl(
      'https://www2.camara.leg.br/legin/fed/lei/2014/lei-13005-25-junho-2014-778970-normaatualizada-pl.html'
    )
    assert.equal(camaraUpd.ok, true)
    assert.equal(camaraUpd.source, 'camara')
    assert.equal(camaraUpd.tipo, 'LEI')
    assert.equal(camaraUpd.numero, '13005')
    assert.equal(camaraUpd.ano, '2014')
    assert.equal(camaraUpd.isNormaIndex, false)

    const camaraIdx = parseLegislationUrl(
      'https://www2.camara.leg.br/legin/fed/lei/1996/lei-9394-20-dezembro-1996-362578-norma-pl.html'
    )
    assert.equal(camaraIdx.ok, true)
    assert.equal(camaraIdx.tipo, 'LEI')
    assert.equal(camaraIdx.numero, '9394')
    assert.equal(camaraIdx.ano, '1996')
    assert.equal(camaraIdx.isNormaIndex, true)

    const normas = parseLegislationUrl('https://normas.leg.br/?urn=urn:lex:br:federal:lei:2014-06-25;13005')
    assert.equal(normas.ok, true)
    assert.equal(normas.source, 'normas')
    assert.equal(normas.tipo, 'LEI')
    assert.equal(normas.numero, '13005')
    assert.equal(normas.ano, '2014')

    const bad = parseLegislationUrl('apenas texto invalido')
    assert.equal(bad.ok, false)
    assert.equal(formatLawNumber('13005'), '13.005')
    assert.equal(normalizeTipo('LEI-n'), 'LEI')
    assert.equal(buildLegislationDocId({ catalogId: 'lei-13005-2014' }), 'doc-lei-13005-2014')
  })

  it('parses search queries including numbers, years, law names, and URLs', () => {
    const q1 = parseSearchQuery('13005')
    assert.equal(q1.isUrl, false)
    assert.equal(q1.numero, '13005')

    const q2 = parseSearchQuery('13.005/2014')
    assert.equal(q2.numero, '13005')
    assert.equal(q2.ano, '2014')

    const q3 = parseSearchQuery('Lei 9.394/1996')
    assert.equal(q3.tipo, 'LEI')
    assert.equal(q3.numero, '9394')
    assert.equal(q3.ano, '1996')

    const q4 = parseSearchQuery('PNE')
    assert.equal(q4.isUrl, false)
    assert.equal(q4.keywords, 'PNE')

    const q5 = parseSearchQuery('https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm')
    assert.equal(q5.isUrl, true)
    assert.equal(q5.urlInfo.numero, '13005')
  })

  it('decodes HTML entities and UTF-8 / Windows-1252 Planalto byte buffers', () => {
    assert.equal(decodeHtmlEntities('Lei n&ordm; 13.005 &mdash; Educa&ccedil;&atilde;o &amp; Art. 1&#186;'), 'Lei nº 13.005 — Educação & Art. 1º')

    const latin1Html = '<meta charset="iso-8859-1"><p>Educa\xe7\xe3o e Inclus\xe3o n\xba 1</p>'
    const latinBytes = Uint8Array.from([...latin1Html].map((c) => c.charCodeAt(0)))
    assert.ok(decodeHtmlBytes(latinBytes).includes('Educação e Inclusão nº 1'))

    const utf8Bytes = new TextEncoder().encode('<p>Educação Pátria nº 1</p>')
    assert.equal(decodeHtmlBytes(utf8Bytes), '<p>Educação Pátria nº 1</p>')
  })

  it('parses legislation HTML cleanly into classified blocks and removes boilerplate/strikeouts', () => {
    const html = `
      <html>
        <head><style>p { color: black; }</style></head>
        <body>
          <p>Presidência da República</p>
          <p>Casa Civil</p>
          <p><img src="brasao.gif">LEI Nº\n13.005, DE 25 DE JUNHO DE 2014.</p>
          <p>CAPÍTULO I</p>
          <p>Art. 1<sup>o</sup> Fica aprovado <strike>texto revogado</strike> o PNE ;</p>
          <p>I - erradicação do analfabetismo ;</p>
          <p>Meta 1: universalizar a educação infantil.</p>
          <p>Estratégias:</p>
          <p>1.1) definir metas locais;</p>
          <p>*</p>
        </body>
      </html>
    `
    const { blocks, plainText } = parseLegislationHtmlToBlocks(html)
    assert.equal(blocks.some((b) => /Presidência da República|Casa Civil/i.test(b.text)), false)
    assert.equal(blocks.some((b) => /texto revogado/.test(b.text)), false)
    assert.equal(blocks.some((b) => b.text === '*'), false)

    assert.deepEqual(blocks[0], { type: 'heading', level: 1, text: 'LEI Nº 13.005, DE 25 DE JUNHO DE 2014.' })
    assert.deepEqual(blocks[1], { type: 'heading', level: 2, text: 'CAPÍTULO I' })
    assert.deepEqual(blocks[2], { type: 'paragraph', text: 'Art. 1o Fica aprovado o PNE;' })
    assert.deepEqual(blocks[3], { type: 'list-item', text: 'I - erradicação do analfabetismo;' })
    assert.deepEqual(blocks[4], { type: 'heading', level: 2, text: 'Meta 1: universalizar a educação infantil.' })
    assert.deepEqual(blocks[5], { type: 'heading', level: 3, text: 'Estratégias:' })
    assert.deepEqual(blocks[6], { type: 'list-item', text: '1.1) definir metas locais;' })
    assert.equal(plainText, blocks.map((b) => b.text).join('\n\n'))

    const indexUrl = extractCamaraFullTextUrl(
      '<a href="lei-9394-20-dezembro-1996-362578-normaatualizada-pl.html">Texto atualizado</a>',
      'https://www2.camara.leg.br/legin/fed/lei/1996/lei-9394-20-dezembro-1996-362578-norma-pl.html'
    )
    assert.equal(
      indexUrl,
      'https://www2.camara.leg.br/legin/fed/lei/1996/lei-9394-20-dezembro-1996-362578-normaatualizada-pl.html'
    )
    assert.equal(classifyLawParagraph('ANEXO')?.level, 1)
  })

  it('parses pasted plain Planalto text into structured legal blocks', () => {
    const pasted = [
      'Presidência da República',
      'Subchefia para Assuntos Jurídicos',
      'LEI Nº 13.005, DE 25 DE JUNHO DE 2014.',
      '',
      'Art. 1º É aprovado o Plano Nacional',
      'de Educação - PNE.',
      'Parágrafo único. Acompanhamento contínuo.',
      'I - diretriz inicial ;'
    ].join('\n')

    const { blocks } = parseLegislationTextToBlocks(pasted)
    assert.equal(blocks.length, 4)
    assert.equal(blocks[0].type, 'heading')
    assert.equal(blocks[1].text, 'Art. 1º É aprovado o Plano Nacional de Educação - PNE.')
    assert.equal(blocks[2].text, 'Parágrafo único. Acompanhamento contínuo.')
    assert.equal(blocks[3].type, 'list-item')
    assert.equal(blocks[3].text, 'I - diretriz inicial;')
  })

  it('resolves and searches curated catalog including Lei 13.005/2014 Planalto URL', () => {
    const byUrl = findCatalogEntry('https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm')
    assert.equal(byUrl?.id, 'lei-13005-2014')
    assert.equal(byUrl?.docId, 'doc-lei-13005-2014')
    assert.equal(Boolean(byUrl?.bundledPath), true)

    const pneHits = searchCatalog('PNE')
    assert.ok(pneHits.some((e) => e.id === 'lei-13005-2014'))

    const inclusionHits = searchCatalog('inclusão')
    assert.ok(inclusionHits.some((e) => e.id === 'lei-13146-2015'))
  })

  it('bundles complete valid Lei nº 13.005/2014 (PNE) offline JSON asset', () => {
    const payload = JSON.parse(readFileSync(PNE_JSON_PATH, 'utf-8'))
    assert.equal(payload.id, 'lei-13005-2014')
    assert.equal(payload.docId, 'doc-lei-13005-2014')
    assert.ok(Array.isArray(payload.blocks))
    assert.ok(payload.blocks.length > 200, `Expected >200 blocks, got ${payload.blocks.length}`)
    assert.equal(payload.blocks.some((b) => b.text === '*'), false)

    for (let i = 1; i <= 14; i++) {
      const re = new RegExp(`^Art\\.\\s*${i}(?:º|\\b)`, 'i')
      assert.ok(payload.blocks.some((b) => re.test(b.text)), `Missing Art. ${i}`)
    }
    for (let i = 1; i <= 20; i++) {
      const re = new RegExp(`^Meta\\s+${i}\\s*[:.\\-–—]`, 'i')
      assert.ok(payload.blocks.some((b) => re.test(b.text)), `Missing Meta ${i}`)
    }
    assert.ok(payload.blocks.some((b) => /^8\.7\)/.test(b.text)), 'Missing Strategy 8.7)')
    assert.ok(payload.blocks.some((b) => /^20\.12\)/.test(b.text)), 'Missing Strategy 20.12)')
  })
})
