import axios from 'axios'

const API_BASE_URL = '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

export async function sendChatMessage({
  message,
  history = [],
  contractNumbers = [],
  contratosCsv,
}) {
  const payload = {
    message,
    history,
    contractNumbers,
  }

  if (typeof contratosCsv === 'string' && contratosCsv.trim()) {
    payload.contratosCsv = contratosCsv.trim()
  }

  const response = await api.post('/chat', payload)
  return response.data
}

export default api
