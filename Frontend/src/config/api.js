const API_BASE_URL = (import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000').replace(/\/$/, '')
const BOARDROOM_API_BASE_URL = (import.meta.env.VITE_BOARDROOM_API_URL || '').replace(/\/$/, '')
const BOARDROOM_WS_BASE_URL = (
  import.meta.env.VITE_BOARDROOM_WS_URL ||
  (BOARDROOM_API_BASE_URL ? BOARDROOM_API_BASE_URL.replace(/^http/, 'ws') : '')
).replace(/\/$/, '')

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export const boardroomApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${BOARDROOM_API_BASE_URL}${normalizedPath}`
}

export const getAuthToken = () => localStorage.getItem('token')
export const hasBoardroomService = Boolean(BOARDROOM_API_BASE_URL)

const buildHeaders = (options = {}) => {
  const headers = new Headers(options.headers || {})
  const token = getAuthToken()

  if (!headers.has('Authorization') && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  return headers
}

export const apiFetch = (path, options = {}) => {
  return fetch(apiUrl(path), {
    ...options,
    headers: buildHeaders(options),
  })
}

export const boardroomFetch = (path, options = {}) => {
  if (!hasBoardroomService) {
    return apiFetch(path, options)
  }

  return fetch(boardroomApiUrl(path), {
    ...options,
    headers: buildHeaders(options),
  })
}

export const boardroomWsUrl = (path, query = {}) => {
  if (!BOARDROOM_WS_BASE_URL) {
    return ''
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const searchParams = new URLSearchParams()

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  return `${BOARDROOM_WS_BASE_URL}${normalizedPath}${queryString ? `?${queryString}` : ''}`
}

export default API_BASE_URL
