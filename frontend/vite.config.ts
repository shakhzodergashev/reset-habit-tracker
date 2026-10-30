import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // During development, forward /api/... to the NestJS backend and drop the /api prefix:
    // /api/auth/login -> http://localhost:3000/auth/login
    // The browser only talks to Vite's own address, so no CORS setup is needed.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})
