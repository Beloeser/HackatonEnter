import dotenv from 'dotenv'
import connectDB from './src/config/db.js'
import User from './src/models/UserModel.js'
import Case from './src/models/CaseModel.js'

dotenv.config()

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
    role: 'advogado'
  }
]

const sampleCases = [
  {
    processNumber: '1764352-89.2025.8.06.1818',
    uf: 'CE',
    subject: 'Não reconhece operação',
    subSubject: 'Genérico',
    macroResult: 'Não Êxito',
    microResult: 'Parcial procedência',
    claimValue: 13534,
    condemnationValue: 7714.38,
    status: 'em_analise',
    recommendation: {
      decision: 'ajustar estratégia',
      suggestedValue: 7700,
      confidence: 0.68,
      reasoning: 'análise inicial indica que há possibilidade de acordo parcial com redução de custos'
    },
    result: {
      decisionTaken: 'em_andamento',
      finalValue: 0,
      outcome: 'pendente',
      effective: false
    }
  },
  {
    processNumber: '1764353-90.2025.8.05.0001',
    uf: 'BA',
    subject: 'Cobrança indevida',
    subSubject: 'Cartão de crédito',
    macroResult: 'Procedente em parte',
    microResult: 'Parcial procedência',
    claimValue: 8200,
    condemnationValue: 4200,
    status: 'em_analise',
    recommendation: {
      decision: 'propor acordo',
      suggestedValue: 4000,
      confidence: 0.72,
      reasoning: 'casos semelhantes costumam ser resolvidos com acordos de valores médios'
    },
    result: {
      decisionTaken: 'em_andamento',
      finalValue: 0,
      outcome: 'pendente',
      effective: false
    }
  },
  {
    processNumber: '1764354-01.2025.8.07.0002',
    uf: 'RJ',
    subject: 'Rescisão contratual',
    subSubject: 'Indenização',
    macroResult: 'Não Êxito',
    microResult: 'Improcedente total',
    claimValue: 22000,
    condemnationValue: 0,
    status: 'em_analise',
    recommendation: {
      decision: 'manter defesa',
      suggestedValue: 0,
      confidence: 0.55,
      reasoning: 'documentação favorece a improcedência do pedido'
    },
    result: {
      decisionTaken: 'em_andamento',
      finalValue: 0,
      outcome: 'pendente',
      effective: false
    }
  },
  {
    processNumber: '1764355-12.2025.8.26.0003',
    uf: 'SP',
    subject: 'Dano moral',
    subSubject: 'Publicidade enganosa',
    macroResult: 'Procedente',
    microResult: 'Condenação total',
    claimValue: 15000,
    condemnationValue: 10000,
    status: 'em_analise',
    recommendation: {
      decision: 'avaliar acordo',
      suggestedValue: 9500,
      confidence: 0.8,
      reasoning: 'alto potencial de condenação também indica bom potencial de acordo'
    },
    result: {
      decisionTaken: 'em_andamento',
      finalValue: 0,
      outcome: 'pendente',
      effective: false
    }
  },
  {
    processNumber: '1764356-23.2025.8.16.0004',
    uf: 'MG',
    subject: 'Ação trabalhista',
    subSubject: 'Horas extras',
    macroResult: 'Procedente',
    microResult: 'Condenação parcial',
    claimValue: 18000,
    condemnationValue: 9000,
    status: 'em_analise',
    recommendation: {
      decision: 'negociar valor',
      suggestedValue: 8800,
      confidence: 0.7,
      reasoning: 'valor de condenação parcial é consistente com cálculo das horas extras'
    },
    result: {
      decisionTaken: 'em_andamento',
      finalValue: 0,
      outcome: 'pendente',
      effective: false
    }
  }
]

const runSeed = async () => {
  await connectDB()

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

  const lawyerMap = createdUsers.reduce((map, user) => {
    map[user.username] = user._id
    return map
  }, {})

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
