import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Dr. Memo - Cuidado Sênior',
        short_name: 'Dr. Memo',
        description: 'App de cuidado da saúde para população sênior - medicamentos, consultas e rede de apoio',
        theme_color: '#9b87f5',
        background_color: '#1A1F2C',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        lang: 'pt-BR',
        dir: 'ltr',
        categories: ['health', 'medical', 'lifestyle'],
        icons: [
          {
            src: '/icon-72.png',
            sizes: '72x72',
            type: 'image/png'
          },
          {
            src: '/icon-96.png',
            sizes: '96x96',
            type: 'image/png'
          },
          {
            src: '/icon-128.png',
            sizes: '128x128',
            type: 'image/png'
          },
          {
            src: '/icon-144.png',
            sizes: '144x144',
            type: 'image/png'
          },
          {
            src: '/icon-152.png',
            sizes: '152x152',
            type: 'image/png'
          },
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-384.png',
            sizes: '384x384',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ],
        shortcuts: [
          {
            name: 'Meus Remédios',
            short_name: 'Remédios',
            url: '/medications',
            icons: [{ src: '/icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'Minhas Consultas',
            short_name: 'Consultas',
            url: '/appointments',
            icons: [{ src: '/icon-96.png', sizes: '96x96' }]
          },
          {
            name: 'Meus Contatos',
            short_name: 'Contatos',
            url: '/contacts',
            icons: [{ src: '/icon-96.png', sizes: '96x96' }]
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      },
      devOptions: {
        enabled: true
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
