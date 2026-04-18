import dotenv from 'dotenv'
import connectDB from './src/config/db.js'
import User from './src/models/UserModel.js'
import Case from './src/models/CaseModel.js'

dotenv.config()

const now = new Date('2026-04-18T10:00:00.000Z')

const sampleUsers = [
  {
    email: 'maria.silva@escritorio.com',
    password: 'senha123',
    name: 'Maria Silva',
    role: 'advogado',
  },
  {
    email: 'joao.santos@escritorio.com',
    password: 'adv2024',
    name: 'Joao Santos',
    role: 'advogado',
  },
  {
    email: 'ana.costa@escritorio.com',
    password: 'demo456',
    name: 'Ana Costa',
    role: 'admin',
  },
  {
    email: 'admin@escritorio.com',
    password: 'admin',
    name: 'AdminAdmin',
    role: 'admin',
  },
]

function buildOrigins(updatedAt, recommendationAt, lawyerDecisionAt) {
  return {
    judicialPhase: {
      source: 'importado do tribunal',
      updatedAt,
    },
    internalStatus: {
      source: 'informado pela equipe',
      updatedAt,
    },
    recommendation: {
      source: 'estimado automaticamente',
      updatedAt: recommendationAt,
    },
    lawyerDecision: {
      source: 'informado pelo advogado',
      updatedAt: lawyerDecisionAt,
    },
    financialEstimate: {
      source: 'calculado com base nos documentos anexados',
      updatedAt,
    },
  }
}

const sampleCases = [
  {
    processNumber: '1865001-11.2026.8.12.0001',
    uf: 'MS',
    subject: 'Bancario',
    subSubject: 'Juros abusivos',
    macroResult: 'Procedente em parte',
    microResult: 'Recalculo contratual',
    claimValue: 28600,
    condemnationValue: 11900,
    status: 'decisao_validada',
    judicialStatus: 'fase_revisional_confirmada',
    judicialPhase: 'instrução',
    internalStatus: 'decisao_validada',
    actionClass: 'revisional_bancaria',
    clientRole: 'autor',
    suggestedThesis: 'manter tese revisional',
    actionContext: {
      contractReference: 'CONTR-2024-9917',
      contractedRate: 3.19,
      marketRate: 2.08,
      hasCapitalization: true,
      mainClaim: 'revisao de encargos e exclusao de juros acima da taxa media',
      urgencyReliefRequested: true,
      causeValueCriteria: 'diferenca estimada entre evolucao contratual e evolucao revisada',
    },
    recommendation: {
      decision: 'acordo',
      suggestedValue: 11000,
      confidence: 0.73,
      reasoning:
        'Prova documental indica chance relevante de revisao parcial e composicao em faixa segura para mitigar risco financeiro.',
      status: 'preliminar',
      generatedAt: new Date('2026-04-10T14:00:00.000Z'),
      disclaimer: 'Esta e uma sugestao automatizada e nao substitui validacao do advogado responsavel.',
    },
    result: {
      decisionTaken: 'acordo',
      status: 'validada',
      finalValue: 10850,
      outcome: 'finalizado_pelo_advogado',
      effective: true,
      justification: 'A faixa de acordo ficou aderente a memoria de calculo revisional e evitou litigio prolongado.',
      publishedAt: new Date('2026-04-14T16:10:00.000Z'),
    },
    financialEstimate: {
      label: 'Proveito economico estimado',
      estimatedValue: 11900,
      uncertaintyMin: 9500,
      uncertaintyMax: 13000,
      calculationBase: 'Revisao de encargos remuneratorios e exclusao de juros acima da taxa media BACEN.',
      methodology: 'Cenario otimista/base/conservador com memoria de calculo anexada pelo perito contabil.',
      documentsUsed: ['contrato_cedula_credito.pdf', 'planilha_evolucao_debito.xlsx', 'laudo_preliminar_contabil.pdf'],
    },
    consistencyIssues: [],
    terminologyAlerts: [],
    decisionTrail: [
      {
        type: 'recomendacao_inicial',
        actor: 'sistema',
        reason: 'Sugestao automatizada inicial com base no historico e documentos anexados.',
        recommendationDecision: 'acordo',
        recommendationConfidence: 0.73,
        lawyerDecision: '',
        createdAt: new Date('2026-04-10T14:00:00.000Z'),
      },
      {
        type: 'decisao_humana_validada',
        actor: 'advogado',
        reason: 'Acordo alinhado ao risco financeiro e estrategia de encerramento eficiente.',
        recommendationDecision: 'acordo',
        recommendationConfidence: 0.73,
        lawyerDecision: 'acordo',
        createdAt: new Date('2026-04-14T16:10:00.000Z'),
      },
    ],
    metadata: {
      origins: buildOrigins(
        new Date('2026-04-12T11:20:00.000Z'),
        new Date('2026-04-10T14:00:00.000Z'),
        new Date('2026-04-14T16:10:00.000Z'),
      ),
      confidenceByBlock: {
        subjectClassification: 0.88,
        financialEstimate: 0.81,
        judicialPhase: 0.86,
        suggestedThesis: 0.79,
      },
    },
  },
  {
    processNumber: '1865002-22.2026.8.26.0002',
    uf: 'SP',
    subject: 'Dano moral',
    subSubject: 'Negativacao indevida',
    macroResult: 'Procedente',
    microResult: 'Condenacao em danos morais',
    claimValue: 22000,
    condemnationValue: 12000,
    status: 'decisao_validada',
    judicialStatus: 'fase_recursal_confirmada',
    judicialPhase: 'recurso',
    internalStatus: 'decisao_validada',
    actionClass: 'indenizatoria',
    clientRole: 'autor',
    suggestedThesis: 'sustentar dano moral com foco em prova documental de negativacao',
    recommendation: {
      decision: 'defesa',
      suggestedValue: 0,
      confidence: 0.7,
      reasoning: 'A tese probatoria e robusta para manutencao da estrategia litigiosa ate julgamento recursal.',
      status: 'preliminar',
      generatedAt: new Date('2026-04-09T10:30:00.000Z'),
      disclaimer: 'Esta e uma sugestao automatizada e nao substitui validacao do advogado responsavel.',
    },
    result: {
      decisionTaken: 'defesa',
      status: 'validada',
      finalValue: 0,
      outcome: 'estrategia_litigiosa_mantida',
      effective: true,
      justification: 'A defesa foi mantida por aderencia integral entre provas e jurisprudencia local.',
      publishedAt: new Date('2026-04-13T15:00:00.000Z'),
    },
    financialEstimate: {
      label: 'Indenizacao estimada',
      estimatedValue: 12000,
      uncertaintyMin: 9800,
      uncertaintyMax: 13800,
      calculationBase: 'Jurisprudencia regional para negativacao indevida e parametros de dano moral por faixa de impacto.',
      methodology: 'Modelagem por precedentes similares com ajuste por tempo de restricao e dano comprovado.',
      documentsUsed: ['consulta_serasa.pdf', 'comprovante_quitacao.pdf', 'peticao_inicial.pdf'],
    },
    consistencyIssues: [],
    terminologyAlerts: [],
    decisionTrail: [
      {
        type: 'recomendacao_inicial',
        actor: 'sistema',
        reason: 'Manter estrategia de defesa recursal.',
        recommendationDecision: 'defesa',
        recommendationConfidence: 0.7,
        lawyerDecision: '',
        createdAt: new Date('2026-04-09T10:30:00.000Z'),
      },
      {
        type: 'decisao_humana_validada',
        actor: 'advogado',
        reason: 'Defesa validada pela consistencia probatoria e fase recursal.',
        recommendationDecision: 'defesa',
        recommendationConfidence: 0.7,
        lawyerDecision: 'defesa',
        createdAt: new Date('2026-04-13T15:00:00.000Z'),
      },
    ],
    metadata: {
      origins: buildOrigins(
        new Date('2026-04-12T09:10:00.000Z'),
        new Date('2026-04-09T10:30:00.000Z'),
        new Date('2026-04-13T15:00:00.000Z'),
      ),
      confidenceByBlock: {
        subjectClassification: 0.9,
        financialEstimate: 0.77,
        judicialPhase: 0.83,
        suggestedThesis: 0.76,
      },
    },
  },
  {
    processNumber: '1865003-33.2026.8.19.0003',
    uf: 'RJ',
    subject: 'Recuperacao de credito',
    subSubject: 'Duplicata mercantil',
    macroResult: 'Exito',
    microResult: 'Acordo homologado',
    claimValue: 45800,
    condemnationValue: 0,
    status: 'encerrado',
    judicialStatus: 'transito_em_julgado',
    judicialPhase: 'sentença',
    internalStatus: 'encerrado',
    actionClass: 'cobranca',
    clientRole: 'autor',
    suggestedThesis: 'encerramento com baixa apos cumprimento integral',
    recommendation: {
      decision: 'acordo',
      suggestedValue: 45200,
      confidence: 0.82,
      reasoning: 'A composicao integral era o melhor caminho de recuperacao com menor tempo de ciclo.',
      status: 'preliminar',
      generatedAt: new Date('2026-04-02T13:40:00.000Z'),
      disclaimer: 'Esta e uma sugestao automatizada e nao substitui validacao do advogado responsavel.',
    },
    result: {
      decisionTaken: 'acordo',
      status: 'validada',
      finalValue: 45800,
      outcome: 'encerrado_com_exito',
      effective: true,
      justification: 'Pagamento integral comprovado e homologacao sem pendencias residuais.',
      publishedAt: new Date('2026-04-11T18:20:00.000Z'),
    },
    financialEstimate: {
      label: 'Valor recuperavel estimado',
      estimatedValue: 45200,
      uncertaintyMin: 43000,
      uncertaintyMax: 45800,
      calculationBase: 'Historico de adimplemento do devedor e prova documental da duplicata.',
      methodology: 'Modelo de recuperacao por faixa de risco com cenarios de acordo e execucao.',
      documentsUsed: ['duplicata_mercantil.pdf', 'demonstrativo_atualizacao.xlsx', 'acordo_homologado.pdf'],
    },
    consistencyIssues: [],
    terminologyAlerts: [],
    decisionTrail: [
      {
        type: 'recomendacao_inicial',
        actor: 'sistema',
        reason: 'Acordo recomendado para maximizar recuperacao em menor prazo.',
        recommendationDecision: 'acordo',
        recommendationConfidence: 0.82,
        lawyerDecision: '',
        createdAt: new Date('2026-04-02T13:40:00.000Z'),
      },
      {
        type: 'decisao_humana_validada',
        actor: 'advogado',
        reason: 'Acordo homologado e cumprido integralmente.',
        recommendationDecision: 'acordo',
        recommendationConfidence: 0.82,
        lawyerDecision: 'acordo',
        createdAt: new Date('2026-04-11T18:20:00.000Z'),
      },
    ],
    metadata: {
      origins: buildOrigins(
        new Date('2026-04-11T18:20:00.000Z'),
        new Date('2026-04-02T13:40:00.000Z'),
        new Date('2026-04-11T18:20:00.000Z'),
      ),
      confidenceByBlock: {
        subjectClassification: 0.86,
        financialEstimate: 0.84,
        judicialPhase: 0.91,
        suggestedThesis: 0.81,
      },
    },
  },
  {
    processNumber: '1865004-44.2026.8.03.0004',
    uf: 'AP',
    subject: 'Execucao fiscal',
    subSubject: 'ISS',
    macroResult: 'Nao exito',
    microResult: 'Risco de penhora',
    claimValue: 86300,
    condemnationValue: 51200,
    status: 'estrategia_revisada',
    judicialStatus: 'fase_executiva_confirmada',
    judicialPhase: 'instrução',
    internalStatus: 'estrategia_revisada',
    actionClass: 'cobranca',
    clientRole: 'reu',
    suggestedThesis: 'parcelamento com garantia para evitar constricao imediata',
    recommendation: {
      decision: 'acordo',
      suggestedValue: 48000,
      confidence: 0.69,
      reasoning: 'Composicao com parcelamento reduz risco de atos executivos gravosos.',
      status: 'preliminar',
      generatedAt: new Date('2026-04-08T09:00:00.000Z'),
      disclaimer: 'Esta e uma sugestao automatizada e nao substitui validacao do advogado responsavel.',
    },
    result: {
      decisionTaken: 'acordo',
      status: 'validada',
      finalValue: 47600,
      outcome: 'parcelamento_formalizado',
      effective: true,
      justification: 'Parcelamento formalizado dentro da capacidade financeira e com suspensao de atos executivos.',
      publishedAt: new Date('2026-04-15T12:45:00.000Z'),
    },
    financialEstimate: {
      label: 'Risco estimado de condenacao',
      estimatedValue: 51200,
      uncertaintyMin: 47000,
      uncertaintyMax: 54000,
      calculationBase: 'Debito executado, acrescimos legais e historico de deferimento de medidas constritivas.',
      methodology: 'Cenario de risco financeiro em execucao fiscal com simulacao de parcelamento.',
      documentsUsed: ['cda.pdf', 'extrato_debito_fiscal.pdf', 'minuta_parcelamento.pdf'],
    },
    consistencyIssues: [],
    terminologyAlerts: [],
    decisionTrail: [
      {
        type: 'recomendacao_inicial',
        actor: 'sistema',
        reason: 'Composicao recomendada para reduzir risco de penhora.',
        recommendationDecision: 'acordo',
        recommendationConfidence: 0.69,
        lawyerDecision: '',
        createdAt: new Date('2026-04-08T09:00:00.000Z'),
      },
      {
        type: 'decisao_humana_validada',
        actor: 'advogado',
        reason: 'Parcelamento validado com suspensao de atos executivos.',
        recommendationDecision: 'acordo',
        recommendationConfidence: 0.69,
        lawyerDecision: 'acordo',
        createdAt: new Date('2026-04-15T12:45:00.000Z'),
      },
    ],
    metadata: {
      origins: buildOrigins(
        new Date('2026-04-15T12:45:00.000Z'),
        new Date('2026-04-08T09:00:00.000Z'),
        new Date('2026-04-15T12:45:00.000Z'),
      ),
      confidenceByBlock: {
        subjectClassification: 0.84,
        financialEstimate: 0.8,
        judicialPhase: 0.79,
        suggestedThesis: 0.75,
      },
    },
  },
]

const runSeed = async () => {
  await connectDB()

  try {
    console.log('Limpando colecoes de usuarios e processos...')
    await Promise.all([User.deleteMany({}), Case.deleteMany({})])

    const users = await User.insertMany(sampleUsers)
    console.log(`Usuarios inseridos: ${users.length}`)

    const casesWithOwners = sampleCases.map((caseData, index) => ({
      ...caseData,
      assignedLawyerId: users[index % 2]._id,
      createdAt: new Date(now.getTime() - (index + 3) * 86400000),
      updatedAt: new Date(now.getTime() - index * 3600000),
    }))

    const createdCases = await Case.insertMany(casesWithOwners)
    console.log(`Processos inseridos: ${createdCases.length}`)

    console.log('Reset concluido: banco limpo e populado com exemplos completos sem pendencias.')
    process.exit(0)
  } catch (error) {
    console.error('Falha ao executar seed de reset:', error)
    process.exit(1)
  }
}

runSeed()
