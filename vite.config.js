import { defineConfig, mergeConfig } from 'vite'
import appshell from './appshell.config.js'
import { appshellConfig } from './fzl-fund-ui/appshell-lit/vite/preset.js'

export default defineConfig(
  mergeConfig(
    appshellConfig({
      ...appshell,
      base: './',
      includeAssets: ['favicon.svg'],
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
      },
      manifest: {
        id: 'fzl-caqdas-researcher',
        name: 'Qualitative Research Assistant — CAQDAS',
        short_name: 'CAQDAS',
        description: 'Computer-Assisted Qualitative Data Analysis Software (CAQDAS) for qualitative researchers',
        background_color: '#fffbfe',
        theme_color: '#006a6a',
        icons: [
          { src: 'icons/icon-48.png', sizes: '48x48', type: 'image/png' },
          { src: 'icons/icon-72.png', sizes: '72x72', type: 'image/png' },
          { src: 'icons/icon-96.png', sizes: '96x96', type: 'image/png' },
          { src: 'icons/icon-128.png', sizes: '128x128', type: 'image/png' },
          { src: 'icons/icon-144.png', sizes: '144x144', type: 'image/png' },
          { src: 'icons/icon-152.png', sizes: '152x152', type: 'image/png' },
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-384.png', sizes: '384x384', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
    {
      server: {
        port: 3040,
      },
    },
  ),
)
