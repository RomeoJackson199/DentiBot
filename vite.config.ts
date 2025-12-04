import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// Performance-optimized Vite configuration
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Target modern browsers only for smaller bundles
    target: 'es2020',
    // Optimize bundle size with aggressive code splitting
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Node modules chunking strategy
          if (id.includes('node_modules')) {
            // Core React ecosystem - load immediately
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Supabase - critical for auth
            if (id.includes('@supabase')) {
              return 'supabase-vendor';
            }
            // UI components - frequently used
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            // Form handling
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'form-vendor';
            }
            // Date utilities
            if (id.includes('date-fns')) {
              return 'date-vendor';
            }
            // Charts - only loaded when needed
            if (id.includes('recharts') || id.includes('d3')) {
              return 'chart-vendor';
            }
            // Mapbox - very large, lazy load only
            if (id.includes('mapbox')) {
              return 'map-vendor';
            }
            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            // TanStack Query
            if (id.includes('@tanstack')) {
              return 'query-vendor';
            }
            // Icons - split out lucide
            if (id.includes('lucide')) {
              return 'icons-vendor';
            }
            // Other smaller vendor packages
            return 'vendor-misc';
          }
          // Split app code by feature area
          if (id.includes('/src/')) {
            if (id.includes('/pages/')) {
              return 'pages';
            }
            if (id.includes('/components/ui/')) {
              return 'ui-components';
            }
            if (id.includes('/components/')) {
              return 'components';
            }
            if (id.includes('/hooks/')) {
              return 'hooks';
            }
          }
        },
        // Use hashed filenames for better caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    // Increase warning limit since we're code-splitting
    chunkSizeWarningLimit: 500,
    // No source maps in production
    sourcemap: mode === 'development',
    // Better minification with esbuild (faster than terser)
    minify: 'esbuild',
    // CSS code splitting
    cssCodeSplit: true,
    // Inline small assets
    assetsInlineLimit: 4096,
  },
  // Optimize dependencies for faster dev startup
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@supabase/supabase-js',
      'date-fns',
      'zod',
      '@tanstack/react-query',
      'framer-motion',
      'mapbox-gl',
    ],
  },
  // Enable CSS optimizations
  css: {
    devSourcemap: false,
  },
  // JSON optimization
  json: {
    stringify: true,
  },
  // Enable experimental features for better performance
  esbuild: {
    // Remove console.log in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
    // Minify identifiers
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true,
  },
}));
