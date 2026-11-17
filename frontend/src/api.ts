import axios from 'axios'

// In production, relative URL allows Nginx to reverse-proxy requests
// to backend internal service, eliminating accidental calls to visitor's localhost.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '',
})

// Axios response interceptor cleans up invalid or expired tokens automatically
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!(localStorage.getItem('propzy_token') || localStorage.getItem('rentflow_token'))
      if (hadToken) {
        localStorage.removeItem('propzy_token')
        localStorage.removeItem('rentflow_token')
        delete api.defaults.headers.common.Authorization
      }
    }
    return Promise.reject(error)
  }
)

export default api
