
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './', // Keep this relative!

  build: {
    target: 'esnext',
    outDir: 'docs', // Keep this for GitHub Pages
    rollupOptions: {
      input: {
        // 1. Main entry is now the Landing Page
        main: resolve(__dirname, 'index.html'), 
        // 2. Dashboard is now dashboard.html
        dashboard: resolve(__dirname, 'dashboard.html'),
        // 3. IDE remains the same
        ide: resolve(__dirname, 'ide.html')
      },
    },
  },
  
  server: {
    // Open the new index (Landing Page) by default
    open: '/index.html', 

    
    // Headers required for Pyodide (Python in browser) to work securely
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      allow: ['..'],
    },
  },

  // Ensure Monaco Editor workers are bundled correctly
  optimizeDeps: {
    include: [
      'monaco-editor/esm/vs/language/json/json.worker',
      'monaco-editor/esm/vs/language/css/css.worker',
      'monaco-editor/esm/vs/language/html/html.worker',
      'monaco-editor/esm/vs/language/typescript/ts.worker',
      'monaco-editor/esm/vs/editor/editor.worker'
    ],
  },
});