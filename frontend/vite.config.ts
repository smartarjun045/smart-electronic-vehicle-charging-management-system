import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // Makes EVSync installable like a native app (Add to Home Screen on
    // mobile, "Install" on desktop Chrome/Edge) and lets the shell load
    // instantly on repeat visits via a precaching service worker. API
    // calls themselves are NOT cached offline — this is a UI/asset
    // service worker, not an offline-data layer (see docs/LIMITATIONS.md).
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'EVSync — Smart EV Charging',
        short_name: 'EVSync',
        description: 'Find, book, and track EV charging — anywhere in India.',
        theme_color: '#0fa870',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        // Precache the built app shell; never cache /api or /socket.io
        // traffic, so data is always fetched live from the backend.
        navigateFallbackDenylist: [/^\/api/, /^\/socket\.io/],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/[abc]\.tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/socket.io': { target: 'http://localhost:5000', ws: true },
    },
  },
  build: {
    // Vendor chunk-splitting: large third-party libraries get their own
    // cacheable chunks instead of being bundled into every page's code,
    // so a browser that already has react/leaflet cached from a previous
    // visit doesn't re-download them after a deploy that only changed app code.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-map': ['leaflet', 'react-leaflet'],
          'vendor-realtime': ['socket.io-client'],
        },
      },
    },
  },
});
