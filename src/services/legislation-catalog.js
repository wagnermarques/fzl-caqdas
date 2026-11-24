import { normalizeTipo, parseLegislationUrl, parseSearchQuery } from './legislation-utils.js'

function stripAccents(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export const LEGISLATION_CATALOG = Object.freeze([
  {
    id: 'lei-13005-2014',
    docId: 'doc-lei-13005-2014',
    featured: true,
    tipo: 'LEI',
    numero: '13005',
    ano: '2014',
    dataAssinatura: '25/06/2014',
    shortName: 'PNE (Plano Nacional de Educação)',
    title: 'Lei nº 13.005/2014 — Plano Nacional de Educação (PNE)',
    ementa: 'Aprova o Plano Nacional de Educação - PNE e dá outras providências (20 metas e estratégias, texto consolidado).',
    tags: ['pne', 'plano nacional de educacao', 'metas', 'estrategias', 'ensino', 'educacao'],
    bundledPath: './data/legislacao/lei-13005-2014.json',
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13005.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2014/lei-13005-25-junho-2014-778970-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2014-06-25;13005'
  },
  {
    id: 'lei-9394-1996',
    docId: 'doc-lei-9394-1996',
    tipo: 'LEI',
    numero: '9394',
    ano: '1996',
    dataAssinatura: '20/12/1996',
    shortName: 'LDB (Diretrizes e Bases da Educação Nacional)',
    title: 'Lei nº 9.394/1996 — Diretrizes e Bases da Educação Nacional (LDB)',
    ementa: 'Estabelece as diretrizes e bases da educação nacional.',
    tags: ['ldb', 'educacao basica', 'ensino medio', 'educacao profissional', 'inclusao', 'darcy ribeiro'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l9394.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/1996/lei-9394-20-dezembro-1996-362578-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:1996-12-20;9394'
  },
  {
    id: 'lei-13146-2015',
    docId: 'doc-lei-13146-2015',
    tipo: 'LEI',
    numero: '13146',
    ano: '2015',
    dataAssinatura: '06/07/2015',
    shortName: 'LBI (Estatuto da Pessoa com Deficiência)',
    title: 'Lei nº 13.146/2015 — Lei Brasileira de Inclusão da Pessoa com Deficiência (LBI)',
    ementa: 'Institui a Lei Brasileira de Inclusão da Pessoa com Deficiência (Estatuto da Pessoa com Deficiência).',
    tags: ['lbi', 'inclusao', 'acessibilidade', 'tecnologia assistiva', 'educacao especial', 'deficiencia'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13146.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2015/lei-13146-6-julho-2015-781174-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2015-07-06;13146'
  },
  {
    id: 'lei-11892-2008',
    docId: 'doc-lei-11892-2008',
    tipo: 'LEI',
    numero: '11892',
    ano: '2008',
    dataAssinatura: '29/12/2008',
    shortName: 'Institutos Federais / Rede Federal EPT',
    title: 'Lei nº 11.892/2008 — Rede Federal de Educação Profissional, Científica e Tecnológica',
    ementa: 'Institui a Rede Federal de Educação Profissional, Científica e Tecnológica, cria os Institutos Federais de Educação, Ciência e Tecnologia, e dá outras providências.',
    tags: ['institutos federais', 'ept', 'educacao profissional', 'tecnica', 'rede federal'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2008/lei/l11892.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2008/lei-11892-29-dezembro-2008-585085-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2008-12-29;11892'
  },
  {
    id: 'lei-12711-2012',
    docId: 'doc-lei-12711-2012',
    tipo: 'LEI',
    numero: '12711',
    ano: '2012',
    dataAssinatura: '29/08/2012',
    shortName: 'Lei de Cotas (Ensino Superior e Técnico Federal)',
    title: 'Lei nº 12.711/2012 — Lei de Cotas no Ensino Superior e Técnico Federal',
    ementa: 'Dispõe sobre o ingresso nas universidades federais e nas instituições federais de ensino técnico de nível médio e dá outras providências.',
    tags: ['cotas', 'acoes afirmativas', 'ingresso', 'permanencia', 'ensino tecnico', 'ensino superior'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2012/lei/l12711.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2012/lei-12711-29-agosto-2012-774113-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2012-08-29;12711'
  },
  {
    id: 'lei-14113-2020',
    docId: 'doc-lei-14113-2020',
    tipo: 'LEI',
    numero: '14113',
    ano: '2020',
    dataAssinatura: '25/12/2020',
    shortName: 'Novo FUNDEB',
    title: 'Lei nº 14.113/2020 — Regulamentação do Novo FUNDEB',
    ementa: 'Regulamenta o Fundo de Manutenção e Desenvolvimento da Educação Básica e de Valorização dos Profissionais da Educação (Fundeb).',
    tags: ['fundeb', 'financiamento', 'educacao basica', 'profissionais da educacao'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/l14113.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2020/lei-14113-25-dezembro-2020-790952-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2020-12-25;14113'
  },
  {
    id: 'lei-8069-1990',
    docId: 'doc-lei-8069-1990',
    tipo: 'LEI',
    numero: '8069',
    ano: '1990',
    dataAssinatura: '13/07/1990',
    shortName: 'ECA (Estatuto da Criança e do Adolescente)',
    title: 'Lei nº 8.069/1990 — Estatuto da Criança e do Adolescente (ECA)',
    ementa: 'Dispõe sobre o Estatuto da Criança e do Adolescente e dá outras providências.',
    tags: ['eca', 'crianca', 'adolescente', 'direito a educacao', 'evasao', 'permanencia'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/leis/l8069.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/1990/lei-8069-13-julho-1990-372211-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:1990-07-13;8069'
  },
  {
    id: 'lei-14934-2024',
    docId: 'doc-lei-14934-2024',
    tipo: 'LEI',
    numero: '14934',
    ano: '2024',
    dataAssinatura: '25/07/2024',
    shortName: 'Prorrogação da Vigência do PNE (até 2025)',
    title: 'Lei nº 14.934/2024 — Prorrogação da Vigência do PNE até 31/12/2025',
    ementa: 'Prorroga, até 31 de dezembro de 2025, a vigência do Plano Nacional de Educação, aprovado pela Lei nº 13.005, de 25 de junho de 2014.',
    tags: ['pne', 'prorrogacao', '13005', 'vigencia'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/l14934.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2024/lei-14934-25-julho-2024-795997-publicacaooriginal-172483-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2024-07-25;14934'
  },
  {
    id: 'lei-13709-2018',
    docId: 'doc-lei-13709-2018',
    tipo: 'LEI',
    numero: '13709',
    ano: '2018',
    dataAssinatura: '14/08/2018',
    shortName: 'LGPD (Proteção de Dados Pessoais)',
    title: 'Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD)',
    ementa: 'Lei Geral de Proteção de Dados Pessoais (LGPD).',
    tags: ['lgpd', 'dados pessoais', 'etica em pesquisa', 'privacidade', 'anonimizacao'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2018/lei-13709-14-agosto-2018-787077-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2018-08-14;13709'
  },
  {
    id: 'lei-12527-2011',
    docId: 'doc-lei-12527-2011',
    tipo: 'LEI',
    numero: '12527',
    ano: '2011',
    dataAssinatura: '18/11/2011',
    shortName: 'LAI (Lei de Acesso à Informação)',
    title: 'Lei nº 12.527/2011 — Lei de Acesso à Informação (LAI)',
    ementa: 'Regula o acesso a informações previsto no inciso XXXIII do art. 5º, no inciso II do § 3º do art. 37 e no § 2º do art. 216 da Constituição Federal.',
    tags: ['lai', 'transparencia', 'acesso a informacao', 'dados publicos'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2011/lei/l12527.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2011/lei-12527-18-novembro-2011-611802-normaatualizada-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2011-11-18;12527'
  },
  {
    id: 'lei-13004-2014',
    docId: 'doc-lei-13004-2014',
    tipo: 'LEI',
    numero: '13004',
    ano: '2014',
    dataAssinatura: '24/06/2014',
    shortName: 'Ação Civil Pública (Patrimônio Público e Social)',
    title: 'Lei nº 13.004/2014 — Proteção ao Patrimônio Público e Social (Ação Civil Pública)',
    ementa: 'Altera os arts. 1º, 4º e 5º da Lei nº 7.347, de 24 de julho de 1985, para incluir entre as finalidades da ação civil pública a proteção do patrimônio público e social.',
    tags: ['acao civil publica', 'patrimonio publico', '7347'],
    planaltoUrl: 'https://www.planalto.gov.br/ccivil_03/_ato2011-2014/2014/lei/l13004.htm',
    camaraUrl: 'https://www2.camara.leg.br/legin/fed/lei/2014/lei-13004-24-junho-2014-778953-publicacaooriginal-144441-pl.html',
    normasUrl: 'https://normas.leg.br/?urn=urn:lex:br:federal:lei:2014-06-24;13004'
  }
])

function normalizeHrefForCompare(url) {
  return String(url || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
}

/**
 * Localiza uma entrada do catálogo curado por `id`/`docId`, URL oficial ou `(tipo, numero, ano)`.
 */
export function findCatalogEntry(criteria = {}) {
  if (!criteria) return null
  if (typeof criteria === 'string') {
    const asUrl = parseLegislationUrl(criteria)
    if (asUrl.ok) return findCatalogEntry({ url: asUrl.url, tipo: asUrl.tipo, numero: asUrl.numero, ano: asUrl.ano })
    return LEGISLATION_CATALOG.find((e) => e.id === criteria || e.docId === criteria) || null
  }

  const { id, docId, catalogId, url, planaltoUrl, camaraUrl, normasUrl, tipo, numero, ano } = criteria
  const targetId = catalogId || id || docId
  if (targetId) {
    const byId = LEGISLATION_CATALOG.find((e) => e.id === targetId || e.docId === targetId)
    if (byId) return byId
  }

  const candidateUrls = [url, planaltoUrl, camaraUrl, normasUrl].filter(Boolean).map(normalizeHrefForCompare)
  if (candidateUrls.length) {
    const byUrl = LEGISLATION_CATALOG.find((e) => {
      const entryUrls = [e.planaltoUrl, e.camaraUrl, e.normasUrl].map(normalizeHrefForCompare)
      return candidateUrls.some((u) => entryUrls.includes(u))
    })
    if (byUrl) return byUrl
  }

  const cleanNum = String(numero || '').replace(/\D+/g, '')
  const normTipo = normalizeTipo(tipo)
  const cleanAno = String(ano || '').replace(/\D+/g, '')
  if (cleanNum) {
    return (
      LEGISLATION_CATALOG.find(
        (e) =>
          e.numero === String(Number.parseInt(cleanNum, 10)) &&
          (!normTipo || e.tipo === normTipo) &&
          (!cleanAno || e.ano === cleanAno)
      ) || null
    )
  }

  return null
}

/**
 * Filtra o catálogo curado a partir de uma consulta livre, URL ou filtros explícitos.
 */
export function searchCatalog(query = '', { tipo = '', ano = '' } = {}) {
  const parsed = parseSearchQuery(query, { tipo, ano })
  if (parsed.isUrl && parsed.urlInfo?.ok) {
    const exact = findCatalogEntry({
      url: parsed.urlInfo.url,
      tipo: parsed.urlInfo.tipo,
      numero: parsed.urlInfo.numero,
      ano: parsed.urlInfo.ano
    })
    return exact ? [exact] : []
  }

  const terms = stripAccents(parsed.keywords)
    .split(/\s+/)
    .filter((t) => t.length > 0)

  return LEGISLATION_CATALOG.filter((entry) => {
    if (parsed.tipo && entry.tipo !== parsed.tipo) return false
    if (parsed.ano && entry.ano !== parsed.ano) return false
    if (parsed.numero && entry.numero !== parsed.numero) return false
    if (!terms.length) return true

    const haystack = stripAccents(
      [entry.title, entry.shortName, entry.ementa, entry.numero, entry.ano, ...(entry.tags || [])].join(' ')
    )
    return terms.every((t) => haystack.includes(t))
  })
}
