import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

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
          maps: ["@react-google-maps/api"],
        },
      },
    },
  },
}));
