export const INITIAL_RESEARCH_DATA = {
  project: {
    id: 'proj-tech-edu-1',
    name: 'Students\' Perceptions of Technology in Education',
    description: 'Estudo qualitativo explorando benefícios e desafios tecnológicos enfrentados por estudantes em ambientes de ensino híbrido e presencial.',
    createdDate: '2026-11-11',
    author: 'Wagner Marques'
  },
  categories: [
    {
      id: 'cat-benefits',
      name: 'Learning benefits',
      color: '#2e7d32',
      description: 'Aspectos positivos relacionados à autonomia, engajamento e flexibilidade proporcionados pelas tecnologias digitais.'
    },
    {
      id: 'cat-challenges',
      name: 'Technological challenges',
      color: '#c62828',
      description: 'Barreiras de infraestrutura, conectividade e acesso que prejudicam a experiência educacional.'
    }
  ],
  codes: [
    {
      id: 'code-engagement',
      categoryId: 'cat-benefits',
      name: 'Increased engagement',
      color: '#4caf50',
      description: 'Aulas mais dinâmicas e atraentes com uso de recursos digitais.'
    },
    {
      id: 'code-self-paced',
      categoryId: 'cat-benefits',
      name: 'Self-paced learning',
      color: '#81c784',
      description: 'Capacidade do aluno ditar o ritmo de estudos e rever conteúdos.'
    },
    {
      id: 'code-connectivity',
      categoryId: 'cat-challenges',
      name: 'Internet connectivity',
      color: '#e53935',
      description: 'Instabilidade de sinal, quedas de conexão ou lentidão de rede.'
    },
    {
      id: 'code-access-resources',
      categoryId: 'cat-challenges',
      name: 'Access to digital resources',
      color: '#ef5350',
      description: 'Dificuldades materiais ou técnicas para acessar vídeos, softwares ou plataformas.'
    }
  ],
  documents: [
    {
      id: 'doc-student-1',
      title: 'Interview — Student 1',
      participant: 'Student 1',
      group: 'Undergraduate',
      type: 'interview',
      content: 'Technology makes classes more interesting, but sometimes I have difficulty accessing the internet.',
      quotations: [
        {
          id: 'quote-1',
          codeId: 'code-engagement',
          text: 'Technology makes classes more interesting',
          startOffset: 0,
          endOffset: 43
        },
        {
          id: 'quote-2',
          codeId: 'code-connectivity',
          text: 'sometimes I have difficulty accessing the internet',
          startOffset: 49,
          endOffset: 99
        }
      ]
    },
    {
      id: 'doc-student-2',
      title: 'Interview — Student 2',
      participant: 'Student 2',
      group: 'Undergraduate',
      type: 'interview',
      content: 'Online activities help me learn at my own pace.',
      quotations: [
        {
          id: 'quote-3',
          codeId: 'code-self-paced',
          text: 'Online activities help me learn at my own pace',
          startOffset: 0,
          endOffset: 46
        }
      ]
    },
    {
      id: 'doc-student-3',
      title: 'Interview — Student 3',
      participant: 'Student 3',
      group: 'Undergraduate',
      type: 'interview',
      content: 'The internet connection is a problem, especially when I need to watch videos.',
      quotations: [
        {
          id: 'quote-4',
          codeId: 'code-connectivity',
          text: 'The internet connection is a problem',
          startOffset: 0,
          endOffset: 36
        },
        {
          id: 'quote-5',
          codeId: 'code-access-resources',
          text: 'especially when I need to watch videos',
          startOffset: 38,
          endOffset: 76
        }
      ]
    }
  ],
  memos: [
    {
      id: 'memo-1',
      title: 'Reflexão Inicial: Contraste entre Engajamento e Conectividade',
      targetType: 'category',
      targetId: 'cat-challenges',
      content: 'Nota-se uma contradição recorrente: embora a mediação digital desperte interesse e engajamento metodológico, a infraestrutura material e conectividade limitam severamente a continuidade da aprendizagem, criando frustração nos estudantes.',
      createdDate: '2026-11-11'
    }
  ]
}
