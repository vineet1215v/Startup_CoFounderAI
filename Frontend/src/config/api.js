// import io from 'socket.io-client' // REMOVED - WebSocket functionality removed

const API_BASE_URL = (import.meta.env.VITE_NODE_API_URL || 'http://localhost:5000').replace(/\/$/, '')

export const apiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${API_BASE_URL}${normalizedPath}`
}

export const getAuthToken = () => localStorage.getItem('token')

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

// Socket.io client for Boardroom live streaming (proxied via Backend:5000) - REMOVED
// Now using direct HTTP API calls instead of WebSockets
// export const boardroomSocket = (query = {}) => {
//   return io(API_BASE_URL, {
//     query,
//     transports: ['websocket', 'polling'],
//     autoConnect: false
//   })
// }

export default API_BASE_URL
