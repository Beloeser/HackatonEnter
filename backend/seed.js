import dotenv from 'dotenv'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import connectDB from './src/config/db.js'
import User from './src/models/UserModel.js'
import Case from './src/models/CaseModel.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROCESSOS_EM_ANDAMENTO_CSV = path.resolve(
  __dirname,
  '..',
  'db',
  'processed',
  'processos_em_andamento.csv'
)

const sampleUsers = [
  {
    username: 'maria.silva',
    password: 'senha123',
    name: 'Maria Silva',
    role: 'advogado'
  },
  {
    username: 'joao.santos',
    password: 'adv2024',
    name: 'João Santos',
    role: 'advogado'
  },
  {
    username: 'ana.costa',
    password: 'demo456',
    name: 'Ana Costa',
    role: 'admin'
  }
]

const LEGACY_SAMPLE_PROCESS_NUMBERS = [
  '1764352-89.2025.8.06.1818',
  '1764353-90.2025.8.05.0001',
  '1764354-01.2025.8.07.0002',
  '1764355-12.2025.8.26.0003',
  '1764356-23.2025.8.16.0004',
]

const parseCsvLine = (line) => {
  const out = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"' && inQuotes && next === '"') {
      current += '"'
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = !inQuotes
      continue
    }

    if (char === ',' && !inQuotes) {
      out.push(current)
      current = ''
      continue
    }

    current += char
  }

  out.push(current)
  return out
}

const toNumberOrZero = (value) => {
  const n = Number.parseFloat(String(value ?? '').trim())
  return Number.isFinite(n) ? n : 0
}

const loadSampleCasesFromCsv = async () => {
  const raw = await fs.readFile(PROCESSOS_EM_ANDAMENTO_CSV, 'utf8')
  const lines = raw.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length < 2) {
    return []
  }

  const headers = parseCsvLine(lines[0].replace(/^\uFEFF/, ''))
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line)
    const record = {}
    headers.forEach((header, idx) => {
      record[header] = values[idx] ?? ''
    })
    return record
  })

  return rows
    .map((row) => ({
      processNumber: String(row['Número do processo'] || '').trim(),
      uf: String(row.UF || '').trim().toUpperCase(),
      subject: String(row.Assunto || '').trim(),
      subSubject: String(row['Sub-assunto'] || '').trim(),
      macroResult: String(row['Resultado macro'] || '').trim(),
      microResult: String(row['Resultado micro'] || '').trim(),
      claimValue: toNumberOrZero(row['Valor da causa']),
      condemnationValue: toNumberOrZero(row['Valor da condenação/indenização']),
      status: 'em_andamento',
    }))
    .filter((item) => item.processNumber && item.uf && item.subject)
}

const runSeed = async () => {
  await connectDB()
  const sampleCases = await loadSampleCasesFromCsv()
  if (sampleCases.length === 0) {
    throw new Error(
      `Nenhum processo encontrado em ${PROCESSOS_EM_ANDAMENTO_CSV}.`
    )
  }

  const removedLegacy = await Case.deleteMany({
    processNumber: { $in: LEGACY_SAMPLE_PROCESS_NUMBERS }
  })
  if (removedLegacy.deletedCount > 0) {
    console.log(`Removidos ${removedLegacy.deletedCount} processos legados do seed antigo.`)
  }

  const createdUsers = []
  for (const userData of sampleUsers) {
    let user = await User.findOne({ username: userData.username })
    if (!user) {
      user = await User.create(userData)
      console.log(`Criado usuário: ${user.username}`)
    } else {
      console.log(`Usuário já existe: ${user.username}`)
    }
    createdUsers.push(user)
  }

  const caseExamples = sampleCases.map((caseData, index) => ({
    ...caseData,
    assignedLawyerId: createdUsers[index % createdUsers.length]._id
  }))

  for (const caseData of caseExamples) {
    const existingCase = await Case.findOne({ processNumber: caseData.processNumber })
    if (existingCase) {
      console.log(`Processo já existe: ${caseData.processNumber}`)
      continue
    }

    const createdCase = await Case.create(caseData)
    console.log(`Criado processo: ${createdCase.processNumber}`)
  }

  console.log('Seed de advogados e processos finalizada.')
  process.exit(0)
}

runSeed().catch((error) => {
  console.error('Falha ao executar seed:', error)
  process.exit(1)
})
