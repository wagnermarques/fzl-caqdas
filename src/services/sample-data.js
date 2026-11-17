// Projeto inicial vazio: o pesquisador cria suas próprias categorias, códigos,
// documentos e memorandos.
export const INITIAL_RESEARCH_DATA = {
  project: {
    id: 'proj-default',
    name: 'Meu Projeto de Pesquisa',
    description: '',
    createdDate: new Date().toISOString().slice(0, 10),
    author: ''
  },
  categories: [],
  codes: [],
  documents: [],
  memos: []
}

/**
 * Documentos fictícios ("Interview — Student 1..3") distribuídos em versões
 * anteriores (<= 0.1.13). São removidos do armazenamento local na carga,
 * desde que o conteúdo continue idêntico ao original.
 */
export const LEGACY_SAMPLE_DOCUMENTS = {
  'doc-student-1': 'Technology makes classes more interesting, but sometimes I have difficulty accessing the internet.',
  'doc-student-2': 'Online activities help me learn at my own pace.',
  'doc-student-3': 'The internet connection is a problem, especially when I need to watch videos.'
}
