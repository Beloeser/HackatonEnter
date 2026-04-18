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
    role: 'advogado',
  },
  {
    username: 'joao.santos',
    password: 'adv2024',
    name: 'Joao Santos',
    role: 'advogado',
  },
  {
    username: 'ana.costa',
    password: 'demo456',
    name: 'Ana Costa',
    role: 'admin',
  },
]

const sampleCases = [
  {
    processNumber: '1864301-89.2026.8.06.1001',
    uf: 'CE',
    subject: 'Nao reconhece operacao',
    subSubject: 'Pix',
    macroResult: 'Nao exito',
    microResult: 'Parcial procedencia',
    claimValue: 13780,
    condemnationValue: 7480,
    status: 'em_analise',
    recommendation: {
      decision: 'propor acordo parcial',
      suggestedValue: 7200,
      confidence: 0.71,
      reasoning: 'ha sinal de parcial procedencia com reducao de risco via acordo',
    },
    result: {
      decisionTaken: 'em_andamento',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864302-90.2026.8.05.0001',
    uf: 'BA',
    subject: 'Cobranca indevida',
    subSubject: 'Cartao de credito',
    macroResult: 'Procedente em parte',
    microResult: 'Condenacao parcial',
    claimValue: 9400,
    condemnationValue: 4200,
    status: 'em_revisao',
    recommendation: {
      decision: 'negociar valor',
      suggestedValue: 3900,
      confidence: 0.74,
      reasoning: 'historico local aponta fechamento rapido com faixa de acordo proxima',
    },
    result: {
      decisionTaken: 'aguardando_aprovacao',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864303-01.2026.8.07.0002',
    uf: 'RJ',
    subject: 'Revisao contratual',
    subSubject: 'Financiamento de veiculo',
    macroResult: 'Procedente',
    microResult: 'Reducao de encargos',
    claimValue: 26100,
    condemnationValue: 9800,
    status: 'aguardando_decisao',
    recommendation: {
      decision: 'manter proposta tecnica',
      suggestedValue: 9200,
      confidence: 0.66,
      reasoning: 'calculo revisional apresenta chance real de ajuste parcial do contrato',
    },
    result: {
      decisionTaken: 'peticao_protocolada',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864304-12.2026.8.26.0003',
    uf: 'SP',
    subject: 'Acao trabalhista',
    subSubject: 'Horas extras',
    macroResult: 'Procedente em parte',
    microResult: 'Condenacao parcial',
    claimValue: 31200,
    condemnationValue: 15400,
    status: 'em_andamento',
    recommendation: {
      decision: 'avaliar acordo com teto',
      suggestedValue: 14500,
      confidence: 0.69,
      reasoning: 'prova testemunhal mista indica boa chance de reduzir impacto financeiro',
    },
    result: {
      decisionTaken: 'audiencia_marcada',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864305-23.2026.8.16.0004',
    uf: 'MG',
    subject: 'Dano moral',
    subSubject: 'Negativacao indevida',
    macroResult: 'Procedente',
    microResult: 'Condenacao total',
    claimValue: 18700,
    condemnationValue: 11200,
    status: 'urgente_prazo_48h',
    recommendation: {
      decision: 'agir em regime de urgencia',
      suggestedValue: 10500,
      confidence: 0.83,
      reasoning: 'prazo processual curto e jurisprudencia desfavoravel exigem resposta imediata',
    },
    result: {
      decisionTaken: 'priorizado',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864306-34.2026.8.19.0005',
    uf: 'RJ',
    subject: 'Recuperacao de credito',
    subSubject: 'Duplicata mercantil',
    macroResult: 'Exito',
    microResult: 'Homologado acordo',
    claimValue: 45800,
    condemnationValue: 0,
    status: 'arquivado',
    recommendation: {
      decision: 'encerrar com baixa',
      suggestedValue: 0,
      confidence: 0.91,
      reasoning: 'acordo integral cumprido e sem pendencias residuais',
    },
    result: {
      decisionTaken: 'arquivado',
      finalValue: 45800,
      outcome: 'encerrado_com_exito',
      effective: true,
    },
  },
  {
    processNumber: '1864307-45.2026.8.21.0006',
    uf: 'RS',
    subject: 'Rescisao contratual',
    subSubject: 'Locacao comercial',
    macroResult: 'Nao exito',
    microResult: 'Improcedente total',
    claimValue: 22800,
    condemnationValue: 0,
    status: 'liminar_emergencial',
    recommendation: {
      decision: 'reforcar pedido liminar',
      suggestedValue: 0,
      confidence: 0.59,
      reasoning: 'documentacao inicial e fraca, mas ha espaco para complemento imediato',
    },
    result: {
      decisionTaken: 'liminar_protocolada',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864308-56.2026.8.15.0007',
    uf: 'PA',
    subject: 'Responsabilidade civil',
    subSubject: 'Acidente de consumo',
    macroResult: 'Procedente em parte',
    microResult: 'Danos materiais',
    claimValue: 17300,
    condemnationValue: 6700,
    status: 'pendente_documentos',
    recommendation: {
      decision: 'coletar provas complementares',
      suggestedValue: 6200,
      confidence: 0.64,
      reasoning: 'falta laudo tecnico para sustentar tese com maior seguranca',
    },
    result: {
      decisionTaken: 'aguardando_documentacao',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864309-67.2026.8.11.0008',
    uf: 'PE',
    subject: 'Falha na prestacao de servico',
    subSubject: 'Internet residencial',
    macroResult: 'Procedente em parte',
    microResult: 'Obrigacao de fazer',
    claimValue: 9800,
    condemnationValue: 3100,
    status: 'ativo',
    recommendation: {
      decision: 'manter defesa com provas tecnicas',
      suggestedValue: 2800,
      confidence: 0.62,
      reasoning: 'ha registros de atendimento que podem reduzir extensao da condenacao',
    },
    result: {
      decisionTaken: 'contestacao_apresentada',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864310-78.2026.8.13.0009',
    uf: 'PR',
    subject: 'Plano de saude',
    subSubject: 'Negativa de cobertura',
    macroResult: 'Procedente',
    microResult: 'Obrigacao de custeio',
    claimValue: 42500,
    condemnationValue: 17800,
    status: 'transito_em_julgado',
    recommendation: {
      decision: 'encerrar fase cognitiva',
      suggestedValue: 0,
      confidence: 0.94,
      reasoning: 'decisao consolidada sem novos recursos viaveis',
    },
    result: {
      decisionTaken: 'sentenca_transitada',
      finalValue: 17800,
      outcome: 'encerrado',
      effective: true,
    },
  },
  {
    processNumber: '1864311-89.2026.8.01.0010',
    uf: 'AC',
    subject: 'Direito do consumidor',
    subSubject: 'Atraso na entrega',
    macroResult: 'Procedente em parte',
    microResult: 'Dano material',
    claimValue: 7400,
    condemnationValue: 2600,
    status: 'triagem_documental',
    recommendation: {
      decision: 'concluir triagem e responder',
      suggestedValue: 2400,
      confidence: 0.67,
      reasoning: 'documentos basicos ja apontam responsabilidade parcial',
    },
    result: {
      decisionTaken: 'triagem_em_andamento',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864312-90.2026.8.02.0011',
    uf: 'AL',
    subject: 'Propriedade intelectual',
    subSubject: 'Uso indevido de marca',
    macroResult: 'Exito',
    microResult: 'Acordo extrajudicial',
    claimValue: 39800,
    condemnationValue: 0,
    status: 'baixado_definitivamente',
    recommendation: {
      decision: 'baixar processo',
      suggestedValue: 0,
      confidence: 0.9,
      reasoning: 'acordo executado e homologado sem saldo pendente',
    },
    result: {
      decisionTaken: 'baixado',
      finalValue: 32000,
      outcome: 'encerrado_com_acordo',
      effective: true,
    },
  },
  {
    processNumber: '1864313-01.2026.8.03.0012',
    uf: 'AP',
    subject: 'Execucao fiscal',
    subSubject: 'ISS',
    macroResult: 'Nao exito',
    microResult: 'Penhora deferida',
    claimValue: 86300,
    condemnationValue: 51200,
    status: 'concluso_para_despacho',
    recommendation: {
      decision: 'priorizar plano de parcelamento',
      suggestedValue: 48000,
      confidence: 0.58,
      reasoning: 'risco elevado de constricao patrimonial apos despacho',
    },
    result: {
      decisionTaken: 'aguardando_despacho',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864314-12.2026.8.04.0013',
    uf: 'AM',
    subject: 'Previdenciario',
    subSubject: 'Revisao de beneficio',
    macroResult: 'Procedente em parte',
    microResult: 'Recalculo parcial',
    claimValue: 52200,
    condemnationValue: 18600,
    status: 'em_andamento',
    recommendation: {
      decision: 'manter estrategia de calculo',
      suggestedValue: 17800,
      confidence: 0.7,
      reasoning: 'pericia contabil favoravel com margem de ajuste moderada',
    },
    result: {
      decisionTaken: 'pericia_solicitada',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864315-23.2026.8.08.0014',
    uf: 'ES',
    subject: 'Tributario',
    subSubject: 'Compensacao PIS COFINS',
    macroResult: 'Procedente',
    microResult: 'Direito reconhecido',
    claimValue: 121000,
    condemnationValue: 0,
    status: 'aguardando_decisao',
    recommendation: {
      decision: 'aguardar sentenca com memoria de calculo pronta',
      suggestedValue: 0,
      confidence: 0.77,
      reasoning: 'linha jurisprudencial recente favorece tese principal',
    },
    result: {
      decisionTaken: 'memoria_finalizada',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864316-34.2026.8.09.0015',
    uf: 'GO',
    subject: 'Ambiental',
    subSubject: 'Auto de infracao',
    macroResult: 'Nao exito',
    microResult: 'Multa mantida',
    claimValue: 67000,
    condemnationValue: 33500,
    status: 'urgente_prazo_24h',
    recommendation: {
      decision: 'apresentar recurso urgente',
      suggestedValue: 30000,
      confidence: 0.61,
      reasoning: 'prazo final em 24h e risco de inscricao imediata em divida ativa',
    },
    result: {
      decisionTaken: 'recurso_em_preparo',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864317-45.2026.8.10.0016',
    uf: 'MA',
    subject: 'Societario',
    subSubject: 'Dissolucao parcial',
    macroResult: 'Procedente em parte',
    microResult: 'Apuracao de haveres',
    claimValue: 157000,
    condemnationValue: 68400,
    status: 'ativo',
    recommendation: {
      decision: 'seguir com pericia de haveres',
      suggestedValue: 65000,
      confidence: 0.65,
      reasoning: 'ha divergencia contabil com chance razoavel de composicao',
    },
    result: {
      decisionTaken: 'fase_instrutoria',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
  {
    processNumber: '1864318-56.2026.8.12.0017',
    uf: 'MS',
    subject: 'Bancario',
    subSubject: 'Juros abusivos',
    macroResult: 'Procedente em parte',
    microResult: 'Recalculo de contrato',
    claimValue: 28600,
    condemnationValue: 11900,
    status: 'em_analise',
    recommendation: {
      decision: 'manter tese revisional',
      suggestedValue: 11000,
      confidence: 0.73,
      reasoning: 'laudo preliminar indica cobranca acima da media de mercado',
    },
    result: {
      decisionTaken: 'analise_complementar',
      finalValue: 0,
      outcome: 'pendente',
      effective: false,
    },
  },
]

const runSeed = async () => {
  await connectDB()

  const createdUsers = []
  for (const userData of sampleUsers) {
    let user = await User.findOne({ username: userData.username })
    if (!user) {
      user = await User.create(userData)
      console.log(`Criado usuario: ${user.username}`)
    } else {
      console.log(`Usuario ja existe: ${user.username}`)
    }
    createdUsers.push(user)
  }

  const caseExamples = sampleCases.map((caseData, index) => ({
    ...caseData,
    assignedLawyerId: createdUsers[index % createdUsers.length]._id,
  }))

  for (const caseData of caseExamples) {
    const existingCase = await Case.findOne({ processNumber: caseData.processNumber })
    if (existingCase) {
      console.log(`Processo ja existe: ${caseData.processNumber}`)
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
