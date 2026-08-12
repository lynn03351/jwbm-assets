import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'

export default defineConfig({
  plugins: [react(), cssInjectedByJsPlugin()],
  define: { 'process.env.NODE_ENV': '"production"' },
  build: {
    outDir: 'dist-flexg',
    lib: {
      entry: 'src/flexg-entry.jsx',
      name: 'JwbmSalesDash',
      formats: ['iife'],
      fileName: () => 'jwbm_sales_dashboard.js',
    },
    chunkSizeWarningLimit: 8000,
  },
})
