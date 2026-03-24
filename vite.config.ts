import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

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
    // componentTagger() disabled temporarily — investigating Vite reload on connect-stripe
    // mode === "development" && componentTagger(),
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
    sourcemap: 'hidden', // Maps for Sentry only — not served publicly

    rollupOptions: {
      output: {
        // ✨ OPTIMIZADO: Code splitting por vendors
        manualChunks: {
          // V4.9.1 — Optimized manual chunks for code splitting
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          'vendor-query': ['@tanstack/react-query'],

          // Supabase
          'supabase-vendor': ['@supabase/supabase-js'],

          // UI libraries (Radix + CVA + merge utils)
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-select',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],

          // Charts
          'vendor-charts': ['recharts'],

          // Icons
          'icons-vendor': ['lucide-react'],

          // i18n
          'vendor-i18n': ['i18next', 'react-i18next'],

          // Forms & Validation
          'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers'],

          // Utilities
          'utils-vendor': ['date-fns'],
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

  // Strip all console.* and debugger calls in production builds
  esbuild: mode === 'production' ? { drop: ['console', 'debugger'] } : {},

  // ✨ OPTIMIZADO: Optimización de dependencias
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'recharts',
      'date-fns',
      'date-fns/locale',
      'lucide-react',
      'sonner',
      'clsx',
      'tailwind-merge',
      'zod',
      'react-hook-form',
      '@hello-pangea/dnd',
      'posthog-js',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      '@radix-ui/react-alert-dialog',
      '@radix-ui/react-checkbox',
      '@radix-ui/react-collapsible',
      '@radix-ui/react-progress',
      '@radix-ui/react-scroll-area',
      '@radix-ui/react-separator',
      '@radix-ui/react-switch',
      '@radix-ui/react-visually-hidden',
      // Previously missing — discovered at runtime causing reloads
      '@radix-ui/react-slot',
      '@radix-ui/react-label',
      '@radix-ui/react-accordion',
      '@radix-ui/react-aspect-ratio',
      '@radix-ui/react-avatar',
      '@radix-ui/react-context-menu',
      '@radix-ui/react-hover-card',
      '@radix-ui/react-menubar',
      '@radix-ui/react-navigation-menu',
      '@radix-ui/react-popover',
      '@radix-ui/react-radio-group',
      '@radix-ui/react-slider',
      '@radix-ui/react-toast',
      '@radix-ui/react-toggle',
      '@radix-ui/react-toggle-group',
    ],
  },
}));
