import { html } from 'lit'
import './styles/app.css'
import 'fzl-fund-appshell--lit/styles/theme.css'
import '@fzl/design-tokens/tokens.css'
import { createAppShell, pattern } from 'fzl-fund-appshell--lit'

// Import Views
import './views/caqdas-home-view.js'
import './views/caqdas-sources-view.js'
import './views/caqdas-coding-view.js'
import './views/caqdas-codebook-view.js'
import './views/caqdas-matrix-view.js'
import './views/caqdas-memos-view.js'
import './views/caqdas-reports-view.js'

createAppShell({
  mount: '#app',
  title: 'FZL CAQDAS — Pesquisa Qualitativa',
  home: () => html`<caqdas-home-view></caqdas-home-view>`,
  routes: [
    {
      name: 'fontes',
      match: pattern('/fontes'),
      render: () => html`<caqdas-sources-view></caqdas-sources-view>`
    },
    {
      name: 'codificacao',
      match: pattern('/codificacao'),
      render: () => html`<caqdas-coding-view></caqdas-coding-view>`
    },
    {
      name: 'codebook',
      match: pattern('/codebook'),
      render: () => html`<caqdas-codebook-view></caqdas-codebook-view>`
    },
    {
      name: 'comparativo',
      match: pattern('/comparativo'),
      render: () => html`<caqdas-matrix-view></caqdas-matrix-view>`
    },
    {
      name: 'memos',
      match: pattern('/memos'),
      render: () => html`<caqdas-memos-view></caqdas-memos-view>`
    },
    {
      name: 'relatorios',
      match: pattern('/relatorios'),
      render: () => html`<caqdas-reports-view></caqdas-reports-view>`
    }
  ],
  drawer: {
    sections: [
      {
        id: 'corpus-section',
        label: 'Corpus & Materiais',
        items: [
          { label: 'Visão Geral (Dashboard)', href: '#/', icon: 'dashboard' },
          { label: 'Fontes & Documentos', href: '#/fontes', icon: 'folder_open' }
        ]
      },
      {
        id: 'analysis-section',
        label: 'Análise Qualitativa',
        items: [
          { label: 'Área de Codificação', href: '#/codificacao', icon: 'edit_note' },
          { label: 'Livro de Códigos (Codebook)', href: '#/codebook', icon: 'account_tree' },
          { label: 'Matriz Comparativa', href: '#/comparativo', icon: 'compare_arrows' },
          { label: 'Memos & Diário de Bordo', href: '#/memos', icon: 'sticky_note_2' }
        ]
      },
      {
        id: 'outputs-section',
        label: 'Saídas & Integração',
        items: [
          { label: 'Relatórios & Python/Pandas', href: '#/relatorios', icon: 'analytics' }
        ]
      }
    ]
  }
})
