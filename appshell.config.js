import { defineAppShellConfig } from './fzl-fund-ui/appshell-lit/src/config.js'

export default defineAppShellConfig({
  title: 'FZL CAQDAS — Pesquisa Qualitativa',
  storagePrefix: 'fzl-caqdas',
  // Configuração declarativa nativa de autenticação social do AppShell (Google e Microsoft)
  // Origem autorizada padrão deste Client ID Google: https://wagnermarques.github.io
  socialAuth: {
    enabled: true,
    providers: 'all',
    googleClientId: '71632020257-bunqshu7n4ein9v46amajmk21ts25b5p.apps.googleusercontent.com',
    microsoftClientId: '',
    microsoftTenantId: 'common',
    requestDriveScope: true,
  },
  // Acessibilidade oficial do AppShell
  accessibility: {
    fonts: ['atkinson', 'opendyslexic'],
    themes: ['light', 'dark', 'high-contrast-light', 'high-contrast-dark'],
    textScale: { min: 1, max: 2 },
    defaults: { font: 'system', theme: 'system', textScale: 1 },
  },
})
