const users = [
  {
    id: 1,
    username: 'maria.silva',
    password: 'senha123',
    name: 'Maria Silva',
    role: 'advogado'
  },
  {
    id: 2,
    username: 'joao.santos',
    password: 'adv2024',
    name: 'João Santos',
    role: 'advogado'
  },
  {
    id: 3,
    username: 'ana.costa',
    password: 'demo456',
    name: 'Ana Costa',
    role: 'advogado'
  }
]

export function findUserByUsername(username) {
  if (!username || typeof username !== 'string') {
    return null
  }
  const normalized = username.trim()
  return users.find((u) => u.username === normalized) ?? null
}
