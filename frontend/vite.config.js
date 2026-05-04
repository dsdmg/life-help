import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [
    vue(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo/*.png', 'logo/*.ico'],
      manifest: {
        name: 'Life Help - 生活助手',
        short_name: 'Life Help',
        description: '生活助手应用 - 仓库管理与物品追踪',
        theme_color: '#1989fa',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo/logo512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo/logo192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/logo/logo100.png',
            sizes: '100x100',
            type: 'image/png'
          },
          {
            src: '/logo/logo128.ico',
            sizes: '128x128',
            type: 'image/x-icon'
          },
          {
            src: '/logo/logo048.ico',
            sizes: '48x48',
            type: 'image/x-icon'
          },
          {
            src: '/logo/logo032.ico',
            sizes: '32x32',
            type: 'image/x-icon'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}']
      }
    })
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
