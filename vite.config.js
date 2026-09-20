import { defineConfig } from 'vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

const rewriteAdmin = (req, _res, next) => {
  const [pathname, search] = (req.url ?? '').split('?')
  const map = {
    '/admin/apps': '/admin/apps.html',
    '/admin/apps/': '/admin/apps.html',
    '/admin/shop': '/admin/shop.html',
    '/admin/shop/': '/admin/shop.html',
  }
  if (pathname in map) {
    req.url = `${map[pathname]}${search ? `?${search}` : ''}`
    next()
    return
  }
  const appMatch = pathname.match(/^\/apps\/([^/]+)\/?$/)
  if (appMatch && appMatch[1] !== 'detail.html') {
    req.url = `/apps/detail.html${search ? `?${search}` : ''}`
  }
  next()
}

export default defineConfig({
  plugins: [
    {
      name: 'admin-rewrites',
      configureServer(server) {
        server.middlewares.use(rewriteAdmin)
      },
      configurePreviewServer(server) {
        server.middlewares.use(rewriteAdmin)
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        adminApps: resolve(root, 'admin/apps.html'),
        adminShop: resolve(root, 'admin/shop.html'),
        appDetail: resolve(root, 'apps/detail.html'),
      },
    },
  },
})
