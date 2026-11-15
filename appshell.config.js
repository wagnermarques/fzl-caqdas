import { defineAppShellConfig } from './fzl-fund-ui/appshell-lit/src/config.js'

export default defineAppShellConfig({
  title: 'FZL CAQDAS — Pesquisa Qualitativa',
  storagePrefix: 'fzl-caqdas',
  // Configuração declarativa nativa de autenticação social do AppShell (Google e Microsoft)
  socialAuth: {
    enabled: true,
    googleClientId: '',
    microsoftClientId: '',
    microsoftTenantId: 'common',
    requestDriveScope: true,
    googleScopes: 'https://www.googleapis.com/auth/drive.file openid profile email',
    microsoftScopes: 'openid profile email User.Read Files.ReadWrite',
  },
  // Acessibilidade oficial do AppShell
  accessibility: {
    fonts: ['atkinson', 'opendyslexic'],
    themes: ['light', 'dark', 'high-contrast-light', 'high-contrast-dark'],
    textScale: { min: 1, max: 2 },
    defaults: { font: 'system', theme: 'system', textScale: 1 },
  },
})
