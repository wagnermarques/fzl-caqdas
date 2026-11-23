export const BARDIN_THEORY_FRAMEWORK = {
  author: 'Laurence Bardin (Universidade Paris V — René Descartes)',
  classicDefinition:
    'Um conjunto de técnicas de análise das comunicações visando obter, por procedimentos sistemáticos e objetivos de descrição do conteúdo das mensagens, indicadores (quantitativos ou não) que permitam a inferência de conhecimentos relativos às condições de produção/recepção (variáveis inferidas) destas mensagens (BARDIN, 2011, p. 48).',
  modalities: [
    {
      name: 'Análise Categorial / Temática',
      usage: '~95% dos estudos qualitativos aplicados',
      description:
        'Desmembramento do texto em unidades temáticas (núcleos de sentido) e reagrupamento analógico em categorias.'
    },
    {
      name: 'Análise de Avaliação (Representacional)',
      usage: 'Atitudes e julgamentos',
      description:
        'Mede a direção (favorável/desfavorável) e a intensidade das atitudes do locutor diante dos objetos de que fala.'
    },
    {
      name: 'Análise da Enunciação',
      usage: 'Discurso como processo',
      description:
        'Observa a estrutura formal, lógica, lapsos, figuras de retórica e sequência da fala como processo em elaboração.'
    },
    {
      name: 'Análise das Relações (Coocorrências)',
      usage: 'Redes semânticas e associação',
      description:
        'Analisa a presença simultânea ou exclusão de duas ou mais unidades de registro em uma mesma unidade de contexto.'
    }
  ],
  phases: [
    {
      id: 'pre-analise',
      order: 1,
      title: 'Polo 1 — Pré-Análise',
      objective:
        'Organizar o material e operacionalizar as ideias iniciais para construir o plano de análise e o corpus da pesquisa.',
      steps: [
        {
          name: 'Leitura Flutuante',
          detail:
            'Primeiro contato aberto e exaustivo com os documentos, deixando-se invadir por impressões e orientações iniciais sem rigidez prematura.'
        },
        {
          name: 'Escolha dos Documentos (Constituição do Corpus)',
          detail:
            'Definição rigorosa do conjunto de documentos a analisar, respeitando as 4 regras de Bardin (Exaustividade, Representatividade, Homogeneidade e Pertinência).'
        },
        {
          name: 'Formulação de Hipóteses e Objetivos',
          detail:
            'Explicitação das questões norteadoras ou suposições provisórias alinhadas ao problema de pesquisa.'
        },
        {
          name: 'Referenciação de Índices e Indicadores',
          detail:
            'Definição dos indícios (ex.: menção explícita de um sentimento/tema) e de seus indicadores (ex.: frequência de aparição).'
        },
        {
          name: 'Preparação do Material',
          detail:
            'Transcrição literal de áudios/vídeos, higienização textual, padronização e anonimização dos informantes (ex.: Aluno 1, Corredor C4).'
        }
      ],
      rulesTitle: 'As 4 Regras de Constituição do Corpus (Bardin, 2011)',
      rules: [
        {
          name: '1. Exaustividade',
          description:
            'Definido o campo do corpus, todos os elementos desse conjunto devem ser analisados sem omissões arbitrárias.'
        },
        {
          name: '2. Representatividade',
          description:
            'Quando utilizada amostragem, ela deve ser representativa do universo inicial pesquisado.'
        },
        {
          name: '3. Homogeneidade',
          description:
            'Os documentos devem obedecer a critérios precisos de escolha, obtidos por técnicas e sujeitos comparáveis.'
        },
        {
          name: '4. Pertinência',
          description:
            'Os documentos escolhidos devem ser adequados enquanto fonte de informação para responder aos objetivos do estudo.'
        }
      ]
    },
    {
      id: 'exploracao',
      order: 2,
      title: 'Polo 2 — Exploração do Material (Codificação e Categorização)',
      objective:
        'Aplicar sistematicamente as decisões da pré-análise por meio do recorte, codificação (UR/UC), enumeração e agrupamento em categorias.',
      steps: [
        {
          name: 'Recorte: Unidade de Registro (UR)',
          detail:
            'Menor segmento de significação codificado (palavra, frase curta ou tema/núcleo de sentido) que serve de unidade-base para categorização e contagem.'
        },
        {
          name: 'Recorte: Unidade de Contexto (UC)',
          detail:
            'Segmento mais amplo (parágrafo ou resposta completa) que envolve a UR e permite compreender seu significado exato sem ambiguidade.'
        },
        {
          name: 'Enumeração (Regras de Contagem)',
          detail:
            'Critérios de quantificação: presença/ausência, frequência simples, frequência ponderada, intensidade, direção, ordem e coocorrência.'
        },
        {
          name: 'Abordagem Dedutiva vs. Indutiva vs. Mista',
          detail:
            'Dedutiva (a priori): códigos oriundos do referencial teórico; Indutiva (a posteriori): códigos emergentes diretamente dos dados; Mista: combinação de ambas.'
        },
        {
          name: 'Categorização (Agrupamento Analógico)',
          detail:
            'Classificação dos códigos em categorias e subcategorias conceituais segundo critérios semânticos, sintáticos, léxicos ou expressivos.'
        }
      ],
      rulesTitle: 'As 5 Regras de Qualidade das Categorias (Bardin, 2011)',
      rules: [
        {
          name: '1. Exclusão Mútua',
          description:
            'Cada código ou unidade de registro não pode pertencer simultaneamente a mais de uma categoria dentro de uma mesma dimensão analítica.'
        },
        {
          name: '2. Homogeneidade',
          description:
            'Um único princípio de classificação deve governar a organização de uma mesma árvore categorial.'
        },
        {
          name: '3. Pertinência',
          description:
            'A categoria deve estar adaptada ao material escolhido e articulada ao referencial teórico da pesquisa.'
        },
        {
          name: '4. Objetividade e Fidelidade',
          description:
            'Partes distintas do material devem ser codificadas sob os mesmos critérios operacionais (definições claras no Codebook).'
        },
        {
          name: '5. Produtividade',
          description:
            'As categorias devem gerar índices férteis para inferências, novas hipóteses e resultados analíticos consistentes.'
        }
      ]
    },
    {
      id: 'tratamento',
      order: 3,
      title: 'Polo 3 — Tratamento dos Resultados, Inferência e Interpretação',
      objective:
        'Transformar dados brutos codificados em achados científicos válidos, articulando evidências empíricas e teoria.',
      steps: [
        {
          name: 'Tratamento Descritivo e Síntese',
          detail:
            'Elaboração de quadros, tabelas de frequência absoluta (n) e percentual (%), diagramas de força e redes conceituais acompanhados de excertos literais.'
        },
        {
          name: 'Inferência',
          detail:
            'Operação lógica controlada que passa do conteúdo manifesto ao conteúdo latente e às condições de produção (emissor, receptor, mensagem, canal).'
        },
        {
          name: 'Interpretação Teórica',
          detail:
            'Confronto dos achados empíricos com a literatura do referencial teórico, confirmando estudos prévios ou destacando descobertas originais.'
        }
      ],
      rulesTitle: 'Polos de Inferência na Comunicação (Bardin, 2011)',
      rules: [
        {
          name: 'Emissor / Produtor',
          description: 'Quem produz a mensagem, suas motivações, valores, papel social e estado psicológico.'
        },
        {
          name: 'Receptor / Destinatário',
          description: 'A quem a mensagem se dirige e que efeitos comunicacionais busca produzir.'
        },
        {
          name: 'Mensagem (Código e Significação)',
          description: 'O que é dito explicitamente e o que está subentendido nas escolhas lexicais e temáticas.'
        },
        {
          name: 'Canal / Condições de Produção',
          description: 'O meio, o contexto institucional, histórico e situacional em que a fala ocorreu.'
        }
      ]
    }
  ],
  softwareMapping: [
    {
      bardinConcept: 'Leitura Flutuante (Pré-Análise)',
      softwareRequirement:
        'Modo de leitura limpa dos documentos sem marcações visuais concorrentes, com painel para registrar impressões iniciais em memos antes de codificar.'
    },
    {
      bardinConcept: '4 Regras do Corpus',
      softwareRequirement:
        'Checklist de validação do Corpus no módulo de Fontes (Exaustividade, Representatividade, Homogeneidade, Pertinência) e registro estruturado de perfil de participantes.'
    },
    {
      bardinConcept: 'Unidade de Registro (UR) vs. Unidade de Contexto (UC)',
      softwareRequirement:
        'Ao marcar uma UR (trecho), armazenar automaticamente o parágrafo/resposta ao redor como UC para garantir interpretação fiel nos relatórios.'
    },
    {
      bardinConcept: 'Codificação Dedutiva (a priori) vs. Indutiva (a posteriori)',
      softwareRequirement:
        'Permitir pré-cadastro no Livro de Códigos (dedutiva) e criação imediata durante a leitura (indutiva), com metadado indicando a origem do código.'
    },
    {
      bardinConcept: '5 Regras de Categorização (Exclusão Mútua & Objetividade)',
      softwareRequirement:
        'Validação de exclusão mútua por dimensão analítica (um código pertence a uma categoria) e campo obrigatório de Definição Operacional.'
    },
    {
      bardinConcept: 'Funil Categorial (Silva & Fossá, 2015)',
      softwareRequirement:
        'Suporte hierárquico em 3 níveis: códigos iniciais -> subcategorias intermediárias -> categorias finais.'
    },
    {
      bardinConcept: 'Enumeração & Frequências',
      softwareRequirement:
        'Cálculo automático de frequência absoluta (n) e percentual (%) por código, subcategoria e categoria, tanto por participante quanto no corpus global.'
    },
    {
      bardinConcept: 'Inferência & Auditoria (Mozzato & Grzybovski, 2011)',
      softwareRequirement:
        'Memos analíticos ligados aos polos da inferência e histórico cronológico de decisões metodológicas.'
    },
    {
      bardinConcept: 'Análise Temática & Análise das Relações (Coocorrências / Redes)',
      softwareRequirement:
        'Visualização de todas as marcações em grafo interativo, agrupando núcleos de sentido e explicitando associações, convergências, contrastes e relações causais/hierárquicas.'
    }
  ],
  thematicRelationsGuide: {
    id: 'analise-tematica-relacoes',
    title: 'Análise Temática, Categorização e Análise das Relações (Grafo de Marcações)',
    subtitle:
      'Referencial específico para o agrupamento de trechos em núcleos de sentido e a modelagem de redes semânticas de inter-relação no Polo 2 (Exploração) e Polo 3 (Inferência).',
    citation:
      'BARDIN, Laurence. Análise de conteúdo. São Paulo: Edições 70, 2011. (Análise temática/núcleos de sentido, p. 135; Categorização por inventário e classificação, p. 147–153; Análise categorial temática e Análise das relações/coocorrências, p. 199–201 e 255–265). Ver também: VITALI et al. (2019); SILVA; FOSSÁ (2015); MOZZATO; GRZYBOVSKI (2011).',
    pillars: [
      {
        title: '1. Núcleos de Sentido (Unidade de Registro Temática)',
        detail:
          'Na Análise Temática de Bardin (2011, p. 135), o tema é a unidade de significação que se liberta naturalmente do texto analisado segundo critérios ligados à teoria. Cada marcação destacada nos documentos corresponde a um núcleo de sentido passível de comparação transversal no corpus.'
      },
      {
        title: '2. Categorização: Inventário e Classificação',
        detail:
          'A categorização comporta duas etapas operacionais complementares (BARDIN, 2011, p. 148): o inventário (isolar os elementos/trechos recortados) e a classificação (repartir esses elementos e procurar ou impor certa organização às mensagens por reagrupamento analógico).'
      },
      {
        title: '3. Análise das Relações & Coocorrências em Rede',
        detail:
          'Para além da frequência isolada de cada código, a Análise das Relações (BARDIN, 2011, p. 255–265) examina associações, convergências, oposições e condicionamentos entre unidades de registro. Em softwares CAQDAS (como ilustrado por Vitali et al., 2019), explicitar essas ligações em grafo sustenta a passagem da descrição para a inferência científica.'
      }
    ],
    relationLegend: [
      {
        relation: 'associa-se / coocorre',
        meaning: 'Presença conjunta recorrente ou vínculo contextual entre dois núcleos de sentido (coocorrência).'
      },
      {
        relation: 'converge / reforça',
        meaning: 'Trechos de mesmo participante ou participantes distintos que apontam para uma mesma categoria.'
      },
      {
        relation: 'fundamenta / explica',
        meaning: 'Marcação empírica que sustenta teoricamente ou esclarece o sentido de outro trecho.'
      },
      {
        relation: 'influencia / condiciona',
        meaning: 'Indício de condição de produção, antecedente institucional/social ou efeito inferido no discurso.'
      },
      {
        relation: 'contrasta / tenciona',
        meaning: 'Contradição, divergência ou distinção útil para delimitar categorias (regra de exclusão mútua).'
      },
      {
        relation: 'subtema de / compõe',
        meaning: 'Organização hierárquica em funil categorial (unidades iniciais agrupadas em subtemas ou categorias finais).'
      }
    ]
  }
}

export const BARDIN_VIDEO_NOTES = {
  mainVideo: {
    id: '3fvAcOrcr5Y',
    title: 'O QUE É e COMO FAZER ANÁLISE DE CONTEÚDO de BARDIN: Explicação e Exemplos passo a passo',
    channel: 'Canal Metodologia Descomplicada (Simplified Methodology)',
    publishedAt: '2023-09-12',
    duration: '28:40',
    url: 'https://www.youtube.com/watch?v=3fvAcOrcr5Y',
    abntCitation:
      'CANAL METODOLOGIA DESCOMPLICADA (Simplified Methodology). O QUE É e COMO FAZER ANÁLISE DE CONTEÚDO de BARDIN: Explicação e Exemplos passo a passo. YouTube, 12 set. 2023. Duração: 28min40s. Disponível em: https://www.youtube.com/watch?v=3fvAcOrcr5Y. Acesso em: 13 nov. 2026.'
  },
  keyTakeaways: [
    'Laurence Bardin é uma professora-autora (mulher) da Universidade de Paris — é importante referenciar corretamente como "a autora".',
    'Na metodologia científica, é necessário especificar a modalidade adotada (geralmente Análise de Conteúdo Temática por frequência) e o passo a passo seguido.',
    'O vídeo estrutura a execução prática em 4 etapas: (1) Preparação/seleção do material; (2) Codificação; (3) Categorização; (4) Análise, tratamento e interpretação dos resultados.',
    'Códigos podem nascer do referencial teórico prévio (dedutivos) ou emergir diretamente da fala do entrevistado (indutivos/novas descobertas).',
    'Regra prática central: cada código é alocado em apenas uma categoria (exclusão mútua) para formar quadros e frequências consistentes.'
  ],
  examples: [
    {
      id: 'ex-1-provas',
      title: 'Exemplo 1 (Demonstração Prática no Word) — Reações de Alunos em Exames',
      context:
        'Estudo sobre "Análise das reações físicas e psicológicas de alunos durante exames". Pergunta: "Como você se sente quando está prestes a fazer uma prova importante?".',
      findings: [
        {
          category: 'Reações Físicas',
          codes: ['Batimento cardíaco acelerado', 'Dor no estômago', 'Tremor'],
          frequency: 3,
          percentage: '27%',
          quote: '"Eu costumo sentir meu coração batendo mais rápido"'
        },
        {
          category: 'Reações Psicológicas',
          codes: ['Nervosismo', 'Ansiedade (2x)', 'Medo (2x)', 'Pressão (código emergente novo)'],
          frequency: 8,
          percentage: '73%',
          quote: '"Há essa pressão para ir bem na prova, o que me deixa um pouco ansioso"'
        }
      ]
    },
    {
      id: 'ex-2-corrida',
      title: 'Exemplo 2 (Artigo 1) — Corrida de Rua: Aspectos Motivacionais (Albuquerque et al., 2018)',
      context:
        '9 entrevistados (entrevista semiestruturada + questionário sociodemográfico), transcrição assistida e Análise Temática por Frequência.',
      findings: [
        {
          category: 'Motivações Extrínsecas',
          codes: ['Influência de familiares e amigos / terceiros (5 ocorrências)'],
          frequency: 5,
          percentage: '45,5%',
          quote: 'Corredor C4: "dá um bem-estar para a pessoa, você socializa, você conhece gente..."'
        },
        {
          category: 'Motivações Intrínsecas',
          codes: ['Saúde (3)', 'Desafio (2)', 'Atividade física (1)'],
          frequency: 6,
          percentage: '54,5%',
          quote: 'Discussão confronta o achado mais forte com Franco e cita trechos literais anonimizados.'
        }
      ]
    },
    {
      id: 'ex-3-polissemia',
      title: 'Exemplo 3 (Artigo 2) — Polissemia da Saúde em Universitários (Vitali et al., 2019)',
      context:
        'Organização hierárquica com apoio de software CAQDAS (ATLAS.ti): 3 categorias, 7 subcategorias e 20 códigos em rede semântica e tabela de frequências.',
      findings: [
        {
          category: 'Hierarquia & Tabela Quantificada',
          codes: ['Subcategoria Bem-estar (122 citações / 52,5%)', 'Subcategoria Equilíbrio (34 citações)'],
          frequency: 156,
          percentage: 'Destaque',
          quote: 'Demonstra como softwares CAQDAS organizam 3 níveis (Categoria -> Subcategoria -> Código) e geram redes.'
        }
      ]
    }
  ],
  playlistUrl: 'https://www.youtube.com/playlist?list=PLKL-OaADMnAh-bbrCwTb5SQTpjbCN6Zse',
  playlistVideos: [
    {
      order: 1,
      id: '3fvAcOrcr5Y',
      title: 'O QUE É e COMO FAZER ANÁLISE DE CONTEÚDO de BARDIN: Explicação e Exemplos passo a passo',
      focus: 'Visão geral das etapas + 3 exemplos práticos'
    },
    {
      order: 2,
      id: 'pBThixMwUy4',
      title: 'Análise de Conteúdo de Bardin: Quais os Tipos de Materiais que Posso Analisar?',
      focus: 'Constituição do corpus e tipos de fontes (Fase 2)'
    },
    {
      order: 3,
      id: 'c1QPPYOB6Ig',
      title: "Bardin's Content Analysis: Difference Between Unit of Meaning and Unit of Context",
      focus: 'Unidade de Registro vs. Unidade de Contexto (Fase 4)'
    },
    {
      order: 4,
      id: 's_0XF17BFas',
      title: 'Como fazer CODIFICAÇÃO na ANÁLISE DE CONTEÚDO de BARDIN: Explicação e Exemplo prático',
      focus: 'Recorte do texto e atribuição de códigos (Fase 4)'
    },
    {
      order: 5,
      id: 'we5NhWzKD_w',
      title: "How to create CATEGORIES in Bardin's CONTENT ANALYSIS: Step-by-step explanation",
      focus: 'Reagrupamento analógico em categorias (Fase 5)'
    },
    {
      order: 6,
      id: 'h4T-MkfY2r4',
      title: "Bardin's Content Analysis: Deductive Analysis and Inductive Analysis",
      focus: 'Grade fechada (a priori) vs. grade aberta (a posteriori)'
    },
    {
      order: 7,
      id: 'xsbbWsxEfqY',
      title: 'Análise de Conteúdo de Bardin: Como Escrever a Metodologia?',
      focus: 'Redação da seção metodológica (Fase 9)'
    },
    {
      order: 8,
      id: 'qQr890wT7xY',
      title: 'ANÁLISE DE CONTEÚDO DE BARDIN – COMO ESCREVER OS RESULTADOS E DISCUSSÕES',
      focus: 'Tabelas, citações literais e inferência (Fase 9)'
    },
    {
      order: 9,
      id: 'L0S5V3ZLN84',
      title: 'Examples of Bardin Content Analysis in TCC, Dissertation and Thesis',
      focus: 'Aplicações reais em trabalhos acadêmicos'
    }
  ]
}

export const BARDIN_OPEN_ACCESS_SOURCES = [
  {
    id: 'src-bardin-2011',
    shortRef: 'BARDIN (2011)',
    type: 'Livro Base',
    accessStatus: 'Obra de Referência Clássica',
    abntCitation:
      'BARDIN, Laurence. Análise de conteúdo. Tradução de Luís Antero Reto e Augusto Pinheiro. São Paulo: Edições 70, 2011. 279 p. (Original francês: L’Analyse de contenu, 1977).',
    url: 'https://www.grupoalmedina.net/',
    summary:
      'Obra fundacional que estabelece as três fases cronológicas (Pré-análise, Exploração do Material e Tratamento dos Resultados), as 4 regras do corpus, UR/UC, regras de enumeração e as 5 regras de categorização.',
    contributionsToSoftware:
      'Define o modelo canônico de estados e regras de integridade metodológica do fzl-caqdas.',
    selectedForFramework: true
  },
  {
    id: 'src-video-3fv',
    shortRef: 'CANAL METODOLOGIA DESCOMPLICADA (2023)',
    type: 'Vídeo Aula',
    accessStatus: 'Acesso Aberto (YouTube)',
    abntCitation:
      'CANAL METODOLOGIA DESCOMPLICADA (Simplified Methodology). O QUE É e COMO FAZER ANÁLISE DE CONTEÚDO de BARDIN: Explicação e Exemplos passo a passo. YouTube, 12 set. 2023. Duração: 28min40s. Disponível em: https://www.youtube.com/watch?v=3fvAcOrcr5Y. Acesso em: 13 nov. 2026.',
    url: 'https://www.youtube.com/watch?v=3fvAcOrcr5Y&list=PLKL-OaADMnAh-bbrCwTb5SQTpjbCN6Zse',
    summary:
      'Apresentação prática passo a passo das etapas da Análise Temática de Bardin com exemplos no Word e análise estrutural de dois artigos científicos publicados.',
    contributionsToSoftware:
      'Inspira o fluxo de marcação de trechos em documentos, cálculo automático de frequência (%) e exibição de excertos na discussão.',
    selectedForFramework: true
  },
  {
    id: 'src-silva-fossa-2015',
    shortRef: 'SILVA; FOSSÁ (2015)',
    type: 'Artigo Metodológico (Acesso Aberto)',
    accessStatus: 'Acesso Aberto (Qualitas / UEPB)',
    abntCitation:
      'SILVA, Andressa Hennig; FOSSÁ, Maria Ivete Trevisan. Análise de conteúdo: exemplo de aplicação da técnica para análise de dados qualitativos. Qualitas Revista Eletrônica, Campina Grande, v. 17, n. 1, p. 1–14, 2015. DOI: https://doi.org/10.18391/qualitas.v16i1.2113.',
    url: 'https://doi.org/10.18391/qualitas.v16i1.2113',
    summary:
      'Guia prático detalhando a aplicação do método de Bardin e o processo progressivo de categorização em três estágios (categorias iniciais, intermediárias e finais).',
    contributionsToSoftware:
      'Fundamenta a hierarquia progressiva no Livro de Códigos (funil categorial em 3 níveis).',
    selectedForFramework: true
  },
  {
    id: 'src-mozzato-grzybovski-2011',
    shortRef: 'MOZZATO; GRZYBOVSKI (2011)',
    type: 'Artigo Metodológico (Acesso Aberto)',
    accessStatus: 'Acesso Aberto (SciELO)',
    abntCitation:
      'MOZZATO, Anelise Rebelato; GRZYBOVSKI, Denize. Análise de conteúdo como técnica de análise de dados qualitativos no campo da administração: potencial e desafios. RAC - Revista de Administração Contemporânea, Curitiba, v. 15, n. 4, p. 731–747, jul./ago. 2011. Disponível em: https://doi.org/10.1590/S1415-65552011000400010.',
    url: 'https://doi.org/10.1590/S1415-65552011000400010',
    summary:
      'Discute rigor científico, confiabilidade, validação e cuidados para evitar o reducionismo positivista ou interpretações puramente subjetivas na Análise de Conteúdo.',
    contributionsToSoftware:
      'Justifica a trilha de auditoria metodológica (memos, diário de bordo e definições operacionais explícitas).',
    selectedForFramework: true
  },
  {
    id: 'src-camara-2013',
    shortRef: 'CÂMARA (2013)',
    type: 'Artigo Metodológico (Acesso Aberto)',
    accessStatus: 'Acesso Aberto (PePSIC / BVS)',
    abntCitation:
      'CÂMARA, Rosana Hoffman. Análise de conteúdo: da teoria à prática em pesquisas sociais aplicadas às organizações. Gerais: Revista Interinstitucional de Psicologia, Belo Horizonte, v. 6, n. 2, p. 179–191, jul./dez. 2013. Disponível em: http://pepsic.bvsalud.org/scielo.php?script=sci_arttext&pid=S1983-82202013000200003.',
    url: 'http://pepsic.bvsalud.org/scielo.php?script=sci_arttext&pid=S1983-82202013000200003',
    summary:
      'Ponte didática entre a teoria de Bardin e sua execução empírica, detalhando as 3 fases e o uso de grades de categorias fechadas, abertas e mistas.',
    contributionsToSoftware:
      'Suporte explícito a grades dedutivas (fechadas), indutivas (abertas) e mistas na codificação.',
    selectedForFramework: true
  },
  {
    id: 'src-caregnato-mutti-2006',
    shortRef: 'CAREGNATO; MUTTI (2006)',
    type: 'Artigo Metodológico (Acesso Aberto)',
    accessStatus: 'Acesso Aberto (SciELO)',
    abntCitation:
      'CAREGNATO, Rita Catalina Aquino; MUTTI, Regina. Pesquisa qualitativa: análise de discurso versus análise de conteúdo. Texto & Contexto - Enfermagem, Florianópolis, v. 15, n. 4, p. 679–684, out./dez. 2006. Disponível em: https://doi.org/10.1590/S0104-07072006000400017.',
    url: 'https://doi.org/10.1590/S0104-07072006000400017',
    summary:
      'Esclarece as diferenças epistemológicas entre a Análise de Conteúdo (Bardin — foco na essência do texto e categorização temática) e a Análise do Discurso (Pêcheux — foco sócio-histórico).',
    contributionsToSoftware:
      'Delimita o escopo epistemológico do framework para evitar confusão conceitual nas notas metodológicas.',
    selectedForFramework: true
  },
  {
    id: 'src-urquiza-marques-2016',
    shortRef: 'URQUIZA; MARQUES (2016)',
    type: 'Artigo Metodológico (Acesso Aberto)',
    accessStatus: 'Acesso Aberto (UEL / Entretextos)',
    abntCitation:
      'URQUIZA, Marconi de Albuquerque; MARQUES, Denilson Bezerra. Análise de conteúdo em termos de Bardin aplicada à comunicação corporativa sob o signo de uma abordagem teórico-empírica. Entretextos, Londrina, v. 16, n. 1, p. 115–144, jan./jun. 2016. Disponível em: https://doi.org/10.5433/1519-5392.2016v16n1p115.',
    url: 'https://doi.org/10.5433/1519-5392.2016v16n1p115',
    summary:
      'Explora em detalhe os tipos de Unidades de Registro, Unidades de Contexto e as diversas regras de enumeração propostas por Bardin.',
    contributionsToSoftware:
      'Modelagem dos metadados de recorte (UR + UC) e regras múltiplas de enumeração (frequência, coocorrência e direção).',
    selectedForFramework: true
  },
  {
    id: 'src-albuquerque-2018',
    shortRef: 'ALBUQUERQUE et al. (2018)',
    type: 'Artigo Exemplo Prático',
    accessStatus: 'Acesso Aberto (Unicamp)',
    abntCitation:
      'ALBUQUERQUE, Dienyffer Bernardo de et al. Corrida de rua: uma análise qualitativa dos aspectos que motivam sua prática. Conexões: Educação Física, Esporte e Saúde, Campinas, v. 16, n. 3, p. 331–346, 2018. Disponível em: https://doi.org/10.20396/conex.v16i3.8653520.',
    url: 'https://doi.org/10.20396/conex.v16i3.8653520',
    summary:
      'Exemplo prático analisado no vídeo 3fvAcOrcr5Y demonstrando categorias intrínsecas/extrínsecas, contagem de ocorrências e citação de informantes (Corredor C4).',
    contributionsToSoftware:
      'Referência de formato de relatório de frequência com diagramas de força e citações anonimizadas.',
    selectedForFramework: true
  },
  {
    id: 'src-vitali-2019',
    shortRef: 'VITALI et al. (2019)',
    type: 'Artigo Exemplo Prático',
    accessStatus: 'Acesso Aberto (SciELO)',
    abntCitation:
      'VITALI, Marieli Mezari et al. Prumo, Guyton e caminho: polissemia da saúde na perspectiva dos estudantes universitários. Physis: Revista de Saúde Coletiva, Rio de Janeiro, v. 29, n. 2, e290209, 2019. Disponível em: https://doi.org/10.1590/S0103-73312019290209.',
    url: 'https://doi.org/10.1590/S0103-73312019290209',
    summary:
      'Exemplo prático analisado no vídeo 3fvAcOrcr5Y com árvore de 3 categorias, 7 subcategorias e 20 códigos em rede semântica e tabela percentual.',
    contributionsToSoftware:
      'Referência para visualização em rede hierárquica de 3 níveis e tabelas combinadas (n e %).',
    selectedForFramework: true
  }
]

export const INITIAL_STUDY_NOTES = [
  {
    id: 'note-bardin-corpus',
    title: 'Critérios obrigatórios do Corpus antes da codificação',
    phase: 'Pré-Análise',
    content:
      'Antes de iniciar a codificação no software, o pesquisador precisa validar o conjunto de entrevistas pelas quatro regras de Bardin: Exaustividade, Representatividade, Homogeneidade e Pertinência. O software deve impedir seleção arbitrária sem justificativa no diário.',
    sourceId: 'src-bardin-2011',
    citationText: 'BARDIN, Laurence. Análise de conteúdo. São Paulo: Edições 70, 2011.',
    createdDate: '2026-11-13'
  },
  {
    id: 'note-ur-uc-recorte',
    title: 'Separação técnica entre Unidade de Registro (UR) e Unidade de Contexto (UC)',
    phase: 'Exploração do Material',
    content:
      'Ao selecionar um trecho curto de entrevista (UR), o sentido exato pode ser perdido fora da pergunta ou parágrafo original. Por isso, o motor de codificação deve armazenar tanto o trecho selecionado (UR) quanto o parágrafo/resposta completa (UC).',
    sourceId: 'src-urquiza-marques-2016',
    citationText: 'URQUIZA, M. A.; MARQUES, D. B. Entretextos, v. 16, n. 1, p. 115–144, 2016.',
    createdDate: '2026-11-13'
  },
  {
    id: 'note-exclusao-mutua',
    title: 'Regra da Exclusão Mútua na Categorização (Vídeo 3fvAcOrcr5Y)',
    phase: 'Exploração do Material',
    content:
      'Conforme reforçado no exemplo prático do vídeo (reações físicas vs. psicológicas), um mesmo código não deve pertencer simultaneamente a duas categorias concorrentes. Além disso, novos códigos emergentes (ex.: "Pressão") convivem com códigos vindos do referencial teórico.',
    sourceId: 'src-video-3fv',
    citationText:
      'CANAL METODOLOGIA DESCOMPLICADA. O QUE É e COMO FAZER ANÁLISE DE CONTEÚDO de BARDIN. YouTube, 12 set. 2023 (3fvAcOrcr5Y).',
    createdDate: '2026-11-13'
  },
  {
    id: 'note-rigor-auditoria',
    title: 'Rigor científico e superação de mecanicismo via Memos e Definições',
    phase: 'Tratamento & Inferência',
    content:
      'A contagem de frequências auxilia a visualizar a força temática, mas a inferência exige voltar às condições de produção da mensagem e registrar decisões no diário reflexivo, garantindo confiabilidade e auditabilidade.',
    sourceId: 'src-mozzato-grzybovski-2011',
    citationText: 'MOZZATO, A. R.; GRZYBOVSKI, D. RAC, v. 15, n. 4, p. 731–747, 2011.',
    createdDate: '2026-11-13'
  }
]
