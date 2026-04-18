import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function sendChatMessage({ message, history = [] }) {
  const response = await api.post('/chat', { message, history })
  return response.data
}

export async function fetchCases() {
  const response = await api.get('/cases')
  return response.data
}

export async function fetchCaseById(caseId) {
  const response = await api.get(`/cases/${caseId}`)
  return response.data
}

export default api
