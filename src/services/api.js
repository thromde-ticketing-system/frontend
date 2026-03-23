import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 90000, // 90 seconds — Render free tier cold start can take up to 60s
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: false,
})

// Add auth token to all requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  // For FormData, let the browser set Content-Type with the correct multipart boundary.
  // If we leave 'application/json' as the default it breaks file uploads.
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type']
  }
  return config
})

// Handle responses — retry on network errors, redirect on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config

    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      window.location.href = '/login'
      return Promise.reject(error)
    }

    // Retry up to 3 times on network errors or 5xx server errors (cold start)
    config._retryCount = config._retryCount || 0
    const isNetworkError = !error.response
    const isServerError = error.response?.status >= 500

    if ((isNetworkError || isServerError) && config._retryCount < 3) {
      config._retryCount++
      const delay = config._retryCount * 2000 // 2s, 4s, 6s
      await new Promise(resolve => setTimeout(resolve, delay))
      return api(config)
    }

    return Promise.reject(error)
  }
)

export default api
