// Local dev uses localhost:5000; production build uses Render unless overridden.
const DEFAULT_SERVER = import.meta.env.DEV
  ? 'http://localhost:5000'
  : 'https://foneworldecom.onrender.com'

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

  const server = stripTrailingSlash(explicitServer || DEFAULT_SERVER)
  return { server, api: `${server}/api` }
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
