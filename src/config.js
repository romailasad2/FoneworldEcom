function stripTrailingSlash(url) {
  return url.replace(/\/+$/, '')
}

// Derive the server origin (no /api) and the API base (with /api) from whatever
// is provided, tolerating values that include or omit the /api suffix.
function resolveBases() {
  const explicitApi = import.meta.env.VITE_API_URL
  const explicitServer = import.meta.env.VITE_SERVER_URL

  if (explicitApi) {
    const cleaned = stripTrailingSlash(explicitApi)
    const api = cleaned.endsWith('/api') ? cleaned : `${cleaned}/api`
    const server = api.replace(/\/api$/, '')
    return { server, api }
  }

  if (explicitServer) {
    const server = stripTrailingSlash(explicitServer)
    return { server, api: `${server}/api` }
  }

  // Local dev talks to the standalone backend on port 5000. Production is a
  // single service where the API lives on the same origin, so use relative paths.
  if (import.meta.env.DEV) {
    return { server: 'http://localhost:5000', api: 'http://localhost:5000/api' }
  }

  return { server: '', api: '/api' }
}

const { server, api } = resolveBases()

export const SERVER_BASE_URL = server
export const API_BASE_URL = api

export function resolveImageUrl(image) {
  if (!image) return ''
  if (image.startsWith('http://') || image.startsWith('https://')) return image
  if (image.startsWith('/uploads/')) return `${SERVER_BASE_URL}${image}`
  return image
}
