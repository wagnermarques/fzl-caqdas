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
import './views/caqdas-theory-view.js'
import './views/caqdas-app-docs-view.js'

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
    },
    {
      name: 'teoria-bardin',
      match: pattern('/teoria-bardin'),
      render: () => html`<caqdas-theory-view></caqdas-theory-view>`
    },
    {
      name: 'documentacao-app',
      match: pattern('/documentacao-app'),
      render: () => html`<caqdas-app-docs-view></caqdas-app-docs-view>`
    }
  ],
  drawer: {
    sections: [
      {
        id: 'theory-section',
        label: 'Referencial Metodológico',
        items: [
          { label: 'Teoria: Análise de Bardin', href: '#/teoria-bardin', icon: 'school' }
        ]
      },
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
      },
      {
        id: 'account-section',
        label: 'Acesso & Sincronização',
        items: [
          { label: 'Minha Conta / Perfil', href: '#/conta', icon: 'account_circle' },
          { label: 'Login Social (Google / Microsoft)', href: '#/conta/entrar', icon: 'login' }
        ]
      },
      {
        id: 'help-section',
        label: 'Ajuda & Operação',
        items: [
          { label: 'Documentação do Aplicativo', href: '#/documentacao-app', icon: 'help_center' }
        ]
      }
    ]
  }
})
