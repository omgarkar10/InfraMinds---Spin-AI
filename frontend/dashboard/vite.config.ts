import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'SPIN Staff Field Portal',
        short_name: 'SPIN Field',
        theme_color: '#0a2540',
        icons: [
          { src: "/images/spin-icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/images/spin-icon-512.png", sizes: "512x512", type: "image/png" }
        ]
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/maps\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-maps-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],

  // Dev server: proxy /api to local backend
  server: {
    port: 5173,
    proxy:
      mode === "development"
        ? {
            "/api": {
              target: "http://localhost:8080",
              changeOrigin: true,
            },
          }
        : undefined,
  },

  build: {
    // Produce source maps for production error tracking
    sourcemap: false,
    // Increase chunk warning threshold (React Maps is large)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        // Split vendor bundles for better caching
        manualChunks: {
          react: ["react", "react-dom"],
          maps: ["@vis.gl/react-google-maps"],
          leaflet: ["leaflet", "react-leaflet"],
          firebase: ["firebase/app", "firebase/auth", "firebase/firestore"],
        },
      },
    },
  },
}));
