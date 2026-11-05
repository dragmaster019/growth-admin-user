import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/app/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'redirect-root-to-app',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/' || req.url === '/index.html') {
            res.writeHead(302, { Location: '/app/' })
            res.end()
            return
          }
          next()
        })
      },
    },
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000' },
    },
  },
})
