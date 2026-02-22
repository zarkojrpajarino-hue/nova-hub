import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // ✨ OPTIMIZADO: Configuración de build mejorada
    target: 'es2020',
    minify: 'esbuild',
    sourcemap: true, // Necesario para Sentry error tracking

    rollupOptions: {
      output: {
        // ✨ OPTIMIZADO: Code splitting por vendors
        manualChunks: {
          // React core
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],

          // React Query
          'tanstack-vendor': ['@tanstack/react-query'],

          // Supabase
          'supabase-vendor': ['@supabase/supabase-js'],

          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
          ],

          // Charts
          'charts-vendor': ['recharts'],

          // Icons
          'icons-vendor': ['lucide-react'],

          // Forms & Validation
          'forms-vendor': ['react-hook-form', 'zod'],

          // Utilities
          'utils-vendor': ['date-fns', 'clsx', 'tailwind-merge'],
        },

        // ✨ OPTIMIZADO: Nombres de chunks consistentes
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // ✨ OPTIMIZADO: Aumentar límite de advertencia
    chunkSizeWarningLimit: 1000, // 1MB

    // ✨ OPTIMIZADO: Optimizaciones de CSS
    cssCodeSplit: true,

    // ✨ OPTIMIZADO: Reportar tamaños comprimidos
    reportCompressedSize: true,
  },

  // ✨ OPTIMIZADO: Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
    ],
  },
}));
