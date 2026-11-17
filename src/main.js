import { html } from 'lit'
import './styles/app.css'
import 'fzl-fund-appshell--lit/styles/theme.css'
import '@fzl/design-tokens/tokens.css'
import { createAppShell, pattern, authService } from 'fzl-fund-appshell--lit'
import { researchStorage } from './services/storage-service.js'
import { clearCachedCloudTokens } from './controllers/caqdas-controllers.js'

// Sincroniza Client IDs válidos declarados localmente sem sobrescrever o appshell.config.js com valores vazios/inválidos
const initialCloudCfg = researchStorage.getCloudSyncConfig()
const storedGoogleId = typeof initialCloudCfg.googleClientId === 'string' ? initialCloudCfg.googleClientId.trim() : ''
const storedMicrosoftId = typeof initialCloudCfg.microsoftClientId === 'string' ? initialCloudCfg.microsoftClientId.trim() : ''
const hasValidStoredGoogleId =
  storedGoogleId.endsWith('.apps.googleusercontent.com') && storedGoogleId.length > '.apps.googleusercontent.com'.length
const hasValidStoredMsId = /^[0-9a-f-]{8,}$/i.test(storedMicrosoftId)

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
import './views/caqdas-persistence-config-view.js'
import './components/caqdas-cloud-status-drawer-widget.js'

createAppShell({
  mount: '#app',
  footerItems: () => html`
    <a
      href="./privacy.html"
      target="_blank"
      rel="noopener noreferrer"
      style="color: inherit; text-decoration: underline;"
    >Privacidade</a>
  `,
  ...(hasValidStoredGoogleId || hasValidStoredMsId
    ? {
        socialAuth: {
          enabled: true,
          ...(hasValidStoredGoogleId ? { googleClientId: storedGoogleId } : {}),
          ...(hasValidStoredMsId ? { microsoftClientId: storedMicrosoftId } : {}),
        },
      }
    : {}),
  on: {
    'auth:login': ({ user, reason }) => {
      researchStorage.syncProviderFromAuthUser(user)
      console.info(`[FZL CAQDAS] Usuário autenticado (${reason || 'sessão'}):`, user?.name, user?.email, user?.provider)
    },
    'auth:logout': ({ reason }) => {
      clearCachedCloudTokens()
      researchStorage.resetProviderWhenUnauthenticated(null)
      console.info(`[FZL CAQDAS] Sessão encerrada (${reason || 'manual'})`)
    },
  },
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
    },
    {
      name: 'config-persistencia',
      title: 'Persistência & Sincronização',
      crumb: ['Config', 'Persistência & Nuvem'],
      match: pattern('/config/persistencia'),
      render: () => html`<caqdas-persistence-config-view></caqdas-persistence-config-view>`
    }
  ],
  drawer: {
    configHeader: () => html`<caqdas-cloud-status-drawer-widget></caqdas-cloud-status-drawer-widget>`,
    configItems: (shell) => html`
      <md-list-item
        type="button"
        @click=${() => {
          if (shell) shell._drawerOpen = false
          window.location.hash = '#/config/persistencia'
        }}
      >
        <md-icon slot="start">cloud_sync</md-icon>
        Persistência &amp; Sincronização (Nuvem)
      </md-list-item>
    `,
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
        label: 'Acesso & Configurações',
        items: [
          { label: 'Minha Conta / Perfil', href: '#/conta', icon: 'account_circle' },
          { label: 'Login Social (Google / Microsoft)', href: '#/conta/entrar', icon: 'login' },
          { label: 'Persistência & Sincronização (Nuvem)', href: '#/config/persistencia', icon: 'cloud_sync' }
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

// Garante ajuste automático de persistência (GDrive / OneDrive quando autenticado; Local quando deslogado)
authService.subscribe((user, reason) => {
  if (reason === 'socialAuthConfig') return
  if (user) {
    researchStorage.syncProviderFromAuthUser(user)
  } else {
    clearCachedCloudTokens()
    researchStorage.resetProviderWhenUnauthenticated(null)
  }
})
