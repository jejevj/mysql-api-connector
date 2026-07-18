import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message = err.response?.data?.detail || err.message || 'Terjadi kesalahan'
    return Promise.reject(new Error(message))
  }
)

// ── Connectors ──────────────────────────────────────────────
export const connectorApi = {
  list:   ()          => api.get('/connectors/'),
  get:    (id)        => api.get(`/connectors/${id}`),
  create: (data)      => api.post('/connectors/', data),
  update: (id, data)  => api.put(`/connectors/${id}`, data),
  delete: (id)        => api.delete(`/connectors/${id}`),
  test:   (id)        => api.post(`/connectors/${id}/test`),
}

// ── Models ───────────────────────────────────────────────────
export const modelApi = {
  list:        ()         => api.get('/models/'),
  get:         (id)       => api.get(`/models/${id}`),
  create:      (data)     => api.post('/models/', data),
  update:      (id, data) => api.put(`/models/${id}`, data),
  delete:      (id)       => api.delete(`/models/${id}`),
  createTable: (id)       => api.post(`/models/${id}/create-table`),
  dbTables:    (cfg)      => api.post('/models/db-tables', cfg),
  dbColumns:   (cfg)      => api.post('/models/db-columns', cfg),
}

// ── Jobs ─────────────────────────────────────────────────────
export const jobApi = {
  list:   ()    => api.get('/jobs/'),
  get:    (id)  => api.get(`/jobs/${id}`),
  start:  (data)=> api.post('/jobs/', data),
  pause:  (id)  => api.patch(`/jobs/${id}/pause`),
  resume: (id)  => api.patch(`/jobs/${id}/resume`),
  stop:   (id)  => api.delete(`/jobs/${id}/stop`),
}

export default api
