import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    middlewareMode: false,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@react-three')) return 'r3f'
          if (id.includes('three')) return 'three-core'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('\\react\\') || id.includes('/react/')) {
            return 'react-core'
          }
        },
      },
    },
  },
})
