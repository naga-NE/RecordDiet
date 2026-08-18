import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const productionCsp = "default-src 'self'; base-uri 'none'; object-src 'none'; form-action 'none'; frame-src 'none'; child-src 'none'; connect-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; manifest-src 'self'; worker-src 'self'; media-src 'none'"

function localOnlyCsp(): Plugin {
  return {
    name: 'local-only-csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler() {
        return [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: productionCsp }, injectTo: 'head-prepend' }]
      }
    }
  }
}

export default defineConfig({
  base: './',
  server: { host: true },
  preview: { host: true },
  plugins: [
    localOnlyCsp(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      workbox: {
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      },
      manifest: {
        name: 'Diet Log',
        short_name: 'DietLog',
        description: '食事・筋トレ・体重を素早く記録する個人用PWA',
        theme_color: '#111111',
        background_color: '#f5f5f3',
        display: 'standalone',
        start_url: './',
        scope: './',
        lang: 'ja',
        categories: ['health', 'fitness'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ]
})
