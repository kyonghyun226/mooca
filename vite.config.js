import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

const rewriteAdminApps = (req, _res, next) => {
  const [pathname, search] = (req.url ?? '').split('?')
  if (pathname === '/admin/apps' || pathname === '/admin/apps/') {
    req.url = `/admin/apps.html${search ? `?${search}` : ''}`
  }
  next()
}

export default defineConfig({
  plugins: [
    {
      name: 'admin-apps-rewrite',
      configureServer(server) {
        server.middlewares.use(rewriteAdminApps)
      },
      configurePreviewServer(server) {
        server.middlewares.use(rewriteAdminApps)
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        adminApps: resolve(root, 'admin/apps.html'),
      },
    },
  },
})
