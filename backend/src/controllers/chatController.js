import OpenAI from 'openai'
import { runPythonScript } from '../utils/pythonRunner.js'

const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-5.4'
const MAX_CONTEXT_CONTRACTS = 8
const PROCESS_NUMBER_REGEX = /\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}/g

let openaiClient = null

function isLikelyPlaceholderApiKey(apiKey) {
  const normalized = String(apiKey || '').trim().toLowerCase()
  if (!normalized) return true

  return (
    normalized === 'your_openai_api_key_here' ||
    normalized.startsWith('your_openai') ||
    normalized.includes('replace_with') ||
    normalized.includes('coloque_sua_chave')
  )
}

function getOpenAIClient() {
  const apiKey = String(process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY || '').trim()

  if (isLikelyPlaceholderApiKey(apiKey)) {
    throw new Error(
      'OPENAI_API_KEY (ou OPEN_AI_KEY) nao configurada corretamente no .env. ' +
        'Substitua o valor placeholder por uma chave real da OpenAI.'
    )
  }

  if (!openaiClient) {
    openaiClient = new OpenAI({ apiKey })
  }

  return openaiClient
}

function normalizeMessageContent(content) {
  if (!content) {
    return ''
  }

  if (typeof content === 'string') {
    return content.trim()
  }

  if (Array.isArray(content)) {
    return content
      .map((part) => {
        if (typeof part === 'string') {
          return part
        }

        if (part && typeof part === 'object' && 'text' in part && typeof part.text === 'string') {
          return part.text
        }

        return ''
      })
      .join('\n')
      .trim()
  }

  return ''
}

function sanitizeHistory(history) {
  if (!Array.isArray(history)) {
    return []
  }

  return history
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      role: item.role,
      content: normalizeMessageContent(item.content),
    }))
    .filter((item) => ['user', 'assistant'].includes(item.role) && item.content)
    .slice(-20)
}

const SYSTEM_PROMPT = [
  'Voce e um assistente juridico para uma plataforma chamada CoffeeBreakers.',
  'Responda em portugues brasileiro, com clareza e objetividade.',
  'Evite inventar fatos e deixe explicito quando estiver inferindo algo.',
  'Quando houver contexto de contratos, use os dados como fonte principal.',
  'Explique e defenda a recomendacao de acordo ou defesa com base em taxa de vitoria e valor de acordo justo.',
  'Nao contradiga o contexto numerico informado; se faltar dado, declare explicitamente.',
  'A resposta deve ser principalmente qualitativa e executiva.',
  'Use os numeros como base de raciocinio, mas cite poucos valores (no maximo 2), salvo se o usuario pedir detalhamento numerico.',
  'Priorize: diagnostico qualitativo, recomendacao, justificativa curta e proximo passo.',
].join(' ')

function sanitizeContractNumbers(input) {
  const raw = Array.isArray(input) ? input : []
  return Array.from(
    new Set(
      raw
        .map((value) => String(value || '').trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_CONTEXT_CONTRACTS)
}

function extractProcessNumbersFromText(input) {
  const text = normalizeMessageContent(input)
  if (!text) {
    return []
  }

  const matches = text.match(PROCESS_NUMBER_REGEX) || []
  return sanitizeContractNumbers(matches)
}

function sanitizeContractInputs(input) {
  const raw = Array.isArray(input) ? input : input && typeof input === 'object' ? [input] : []

  return raw
    .filter((item) => item && typeof item === 'object' && !Array.isArray(item))
    .slice(0, MAX_CONTEXT_CONTRACTS)
}

function formatCurrency(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return 'N/A'
  }

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  })
}

function formatPercent(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) {
    return 'N/A'
  }

  return `${number.toFixed(2)}%`
}

function decisionLabel(fazerAcordo) {
  return fazerAcordo ? 'Fazer acordo' : 'Manter defesa'
}

function buildModelDecisionBlock(contractAnalyses) {
  if (!Array.isArray(contractAnalyses) || contractAnalyses.length === 0) {
    return ''
  }

  const lines = contractAnalyses.slice(0, 5).map((item) => {
    const suggestedValue =
      item.fazer_acordo && item.valor_acordo_justo !== null && item.valor_acordo_justo !== undefined
        ? formatCurrency(item.valor_acordo_justo)
        : 'N/A'

    return [
      `- Processo: ${item.numero_processo}`,
      `  Decisao: ${decisionLabel(item.fazer_acordo)}`,
      `  Chance de vitoria: ${formatPercent(item.taxa_probabilidade_vitoria)}`,
      `  Valor sugerido de acordo: ${suggestedValue}`,
    ].join('\n')
  })

  if (contractAnalyses.length > 5) {
    lines.push(`- +${contractAnalyses.length - 5} processo(s) com decisao calculada.`)
  }

  return ['Decisao baseada no modelo preditivo:', ...lines].join('\n')
}

function buildContractContextPrompt(contractAnalyses) {
  if (!Array.isArray(contractAnalyses) || contractAnalyses.length === 0) {
    return ''
  }

  const lines = contractAnalyses.map((item) => {
    const decisionLabel = item.fazer_acordo ? 'Fazer acordo' : 'Nao fazer acordo'
    const agreementValue = item.fazer_acordo
      ? formatCurrency(item.valor_acordo_justo)
      : 'N/A (nao recomendado)'

    return [
      `Processo ${item.numero_processo}:`,
      `- Taxa de probabilidade de vitoria: ${item.taxa_probabilidade_vitoria}%`,
      `- Decisao recomendada: ${decisionLabel}`,
      `- Valor de acordo justo: ${agreementValue}`,
    ].join('\n')
  })

  return [
    'Contexto consolidado de contratos (historico de decisao):',
    ...lines,
    'Use este contexto para responder perguntas e justificar a recomendacao.',
    'Mantenha tom qualitativo e cite poucos numeros.',
    'Mesmo com resposta qualitativa, inclua explicitamente a decisao, a chance de vitoria e o valor sugerido de acordo quando houver.',
  ].join('\n\n')
}

function toFiniteNumber(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function classifyWinRate(probabilityPercent) {
  const value = toFiniteNumber(probabilityPercent)
  if (value === null) return 'incerta'
  if (value >= 75) return 'alta'
  if (value >= 60) return 'moderada para alta'
  if (value >= 45) return 'moderada'
  return 'baixa'
}

function summarizeContractAnalyses(contractAnalyses) {
  const total = contractAnalyses.length
  const agreementItems = contractAnalyses.filter((item) => item.fazer_acordo)
  const defenseItems = contractAnalyses.filter((item) => !item.fazer_acordo)

  const winRates = contractAnalyses
    .map((item) => toFiniteNumber(item.taxa_probabilidade_vitoria))
    .filter((value) => value !== null)
  const averageWinRate =
    winRates.length > 0 ? winRates.reduce((acc, value) => acc + value, 0) / winRates.length : null

  const agreementValues = agreementItems
    .map((item) => toFiniteNumber(item.valor_acordo_justo))
    .filter((value) => value !== null)
  const averageAgreementValue =
    agreementValues.length > 0
      ? agreementValues.reduce((acc, value) => acc + value, 0) / agreementValues.length
      : null

  return {
    total,
    agreementCount: agreementItems.length,
    defenseCount: defenseItems.length,
    averageWinRate,
    averageAgreementValue,
    predominantDecision: agreementItems.length >= defenseItems.length ? 'acordo' : 'defesa',
  }
}

function buildFallbackReply({ message, contractAnalyses }) {
  const question = normalizeMessageContent(message)

  if (!Array.isArray(contractAnalyses) || contractAnalyses.length === 0) {
    return [
      'Nao consegui carregar contexto de contratos para responder com base no historico.',
      'Se quiser, informe os numeros dos processos para eu analisar e responder com recomendacao de acordo ou defesa.',
      question ? `Pergunta recebida: "${question}"` : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (contractAnalyses.length === 1) {
    const item = contractAnalyses[0]
    const chance = toFiniteNumber(item.taxa_probabilidade_vitoria)
    const chanceLabel = classifyWinRate(chance)
    const decisionLabel = item.fazer_acordo ? 'seguir com acordo' : 'manter defesa'
    const agreementValue = item.fazer_acordo
      ? formatCurrency(item.valor_acordo_justo)
      : null

    const qualitative = [
      'Resposta em modo fallback (sem OPENAI_API_KEY), baseada no historico do contrato selecionado:',
      `Pelo perfil de risco atual, a chance de vitoria e ${chanceLabel}${
        chance !== null ? ` (em torno de ${chance.toFixed(1)}%)` : ''
      }, e a recomendacao tecnica e ${decisionLabel}.`,
      item.fazer_acordo && agreementValue
        ? `Como referencia de negociacao, o acordo justo fica na faixa de ${agreementValue}.`
        : 'Como a recomendacao atual nao e acordo, o foco deve ser fortalecer a estrategia de defesa.',
      'Se quiser resposta conversacional da IA, configure OPENAI_API_KEY no backend/.env.',
      question ? `Pergunta recebida: "${question}"` : '',
    ]
      .filter(Boolean)
      .join('\n')

    const decisionBlock = buildModelDecisionBlock(contractAnalyses)
    return `${qualitative}\n\n${decisionBlock}`
  }

  const summary = summarizeContractAnalyses(contractAnalyses)
  const chanceLabel = classifyWinRate(summary.averageWinRate)
  const recommendation =
    summary.predominantDecision === 'acordo' ? 'priorizar acordos' : 'priorizar defesa'

  const qualitative = [
    'Resposta em modo fallback (sem OPENAI_API_KEY), baseada no historico consolidado dos contratos:',
    `No conjunto analisado, o cenario e de probabilidade ${chanceLabel}${
      summary.averageWinRate !== null ? ` (media perto de ${summary.averageWinRate.toFixed(1)}%)` : ''
    }, com orientacao predominante para ${recommendation}.`,
    summary.predominantDecision === 'acordo' && summary.averageAgreementValue !== null
      ? `Como referencia qualitativa de negociacao, o acordo justo tipico fica em torno de ${formatCurrency(
          summary.averageAgreementValue
        )}.`
      : 'Qualitativamente, a estrategia mais consistente e sustentar a defesa com foco em provas e coerencia do caso.',
    'Se quiser resposta conversacional da IA, configure OPENAI_API_KEY no backend/.env.',
  ].join('\n')

  const decisionBlock = buildModelDecisionBlock(contractAnalyses)
  return `${qualitative}\n\n${decisionBlock}`
}

async function runContractAnalysisByProcess({ processNumber, contratosCsv }) {
  const args = ['--output', 'resumo', '--contrato-processo', processNumber]
  if (contratosCsv) {
    args.push('--contratos-csv', contratosCsv)
  }

  const result = await runPythonScript('analise.py', args)
  if (!result || result.status === 'error') {
    return null
  }

  return {
    numero_processo: processNumber,
    taxa_probabilidade_vitoria: result.taxa_probabilidade_vitoria,
    fazer_acordo: Boolean(result.fazer_acordo),
    valor_acordo_justo: result.valor_acordo_justo ?? null,
  }
}

async function runContractAnalysisByInput({ contractInput }) {
  const args = ['--output', 'resumo', '--contrato-json', JSON.stringify(contractInput)]
  const result = await runPythonScript('analise.py', args)
  if (!result || result.status === 'error') {
    return null
  }

  return {
    numero_processo:
      normalizeMessageContent(contractInput?.['Número do processo']) ||
      normalizeMessageContent(contractInput?.numeroProcesso) ||
      'processo_sem_numero',
    taxa_probabilidade_vitoria: result.taxa_probabilidade_vitoria,
    fazer_acordo: Boolean(result.fazer_acordo),
    valor_acordo_justo: result.valor_acordo_justo ?? null,
  }
}

async function buildContractsContextData({ contractNumbers, contractInputs, contratosCsv }) {
  const analyses = []
  const warnings = []

  for (const processNumber of contractNumbers) {
    try {
      const analysis = await runContractAnalysisByProcess({
        processNumber,
        contratosCsv,
      })

      if (analysis) {
        analyses.push(analysis)
      } else {
        warnings.push(`Nao foi possivel analisar o processo ${processNumber}.`)
      }
    } catch (error) {
      warnings.push(`Falha ao analisar ${processNumber}: ${error.message}`)
    }
  }

  for (const [index, contractInput] of contractInputs.entries()) {
    try {
      const analysis = await runContractAnalysisByInput({
        contractInput,
      })

      if (analysis) {
        analyses.push(analysis)
      } else {
        warnings.push(`Nao foi possivel analisar os parametros do contrato #${index + 1}.`)
      }
    } catch (error) {
      warnings.push(`Falha ao analisar parametros do contrato #${index + 1}: ${error.message}`)
    }
  }

  return {
    analyses,
    warnings,
    prompt: buildContractContextPrompt(analyses),
  }
}

export const postChatMessage = async (req, res) => {
  try {
    const message = normalizeMessageContent(req.body?.message)
    const history = sanitizeHistory(req.body?.history)
    const contractNumbersFromBody = sanitizeContractNumbers(req.body?.contractNumbers)
    const contractNumbersFromMessage = extractProcessNumbersFromText(message)
    const contractNumbers = sanitizeContractNumbers([
      ...contractNumbersFromBody,
      ...contractNumbersFromMessage,
    ])
    const contractInputs = sanitizeContractInputs(req.body?.contractInputs || req.body?.contractInput)
    const contratosCsv = normalizeMessageContent(req.body?.contratosCsv)

    if (!message) {
      return res.status(400).json({
        error: 'O campo "message" e obrigatorio.',
      })
    }

    const contractContext = await buildContractsContextData({
      contractNumbers,
      contractInputs,
      contratosCsv,
    })
    let client = null
    try {
      client = getOpenAIClient()
    } catch (error) {
      const fallbackReply = buildFallbackReply({
        message,
        contractAnalyses: contractContext.analyses,
      })

      return res.status(200).json({
        reply: fallbackReply,
        model: 'fallback-no-openai',
        warning: error.message,
        contractContext: {
          totalInformado: contractNumbers.length + contractInputs.length,
          totalProcessosInformados: contractNumbers.length,
          totalParametrosInformados: contractInputs.length,
          totalAnalisado: contractContext.analyses.length,
          contratos: contractContext.analyses,
          warnings: contractContext.warnings,
        },
      })
    }

    const messages = [{ role: 'system', content: SYSTEM_PROMPT }]
    if (contractContext.prompt) {
      messages.push({
        role: 'system',
        content: contractContext.prompt,
      })
    }

    messages.push(
      ...history.map((item) => ({
        role: item.role,
        content: item.content,
      })),
      { role: 'user', content: message }
    )

    let completion = null
    try {
      completion = await client.chat.completions.create({
        model: MODEL_NAME,
        messages,
        temperature: 0.2,
      })
    } catch (error) {
      const errorMessage = String(error?.message || '')
      const isAuthError = error?.status === 401 || /incorrect api key/i.test(errorMessage)
      const fallbackReply = buildFallbackReply({
        message,
        contractAnalyses: contractContext.analyses,
      })

      if (isAuthError) {
        return res.status(200).json({
          reply: fallbackReply,
          model: 'fallback-invalid-openai-key',
          warning:
            'OPENAI_API_KEY invalida. Ajuste a chave no backend/.env para usar o modelo da OpenAI.',
          contractContext: {
            totalInformado: contractNumbers.length + contractInputs.length,
            totalProcessosInformados: contractNumbers.length,
            totalParametrosInformados: contractInputs.length,
            totalAnalisado: contractContext.analyses.length,
            contratos: contractContext.analyses,
            warnings: contractContext.warnings,
          },
        })
      }

      return res.status(200).json({
        reply: fallbackReply,
        model: 'fallback-openai-unavailable',
        warning: `OpenAI indisponivel no momento (${errorMessage}). Resposta baseada no contexto dos contratos.`,
        contractContext: {
          totalInformado: contractNumbers.length + contractInputs.length,
          totalProcessosInformados: contractNumbers.length,
          totalParametrosInformados: contractInputs.length,
          totalAnalisado: contractContext.analyses.length,
          contratos: contractContext.analyses,
          warnings: contractContext.warnings,
        },
      })
    }

    const reply = normalizeMessageContent(completion.choices?.[0]?.message?.content)

    if (!reply) {
      return res.status(502).json({
        error: 'A OpenAI nao retornou texto na resposta.',
      })
    }

    const decisionBlock = buildModelDecisionBlock(contractContext.analyses)
    const finalReply = decisionBlock ? `${reply}\n\n${decisionBlock}` : reply

    return res.status(200).json({
      reply: finalReply,
      model: MODEL_NAME,
      contractContext: {
        totalInformado: contractNumbers.length + contractInputs.length,
        totalProcessosInformados: contractNumbers.length,
        totalParametrosInformados: contractInputs.length,
        totalAnalisado: contractContext.analyses.length,
        contratos: contractContext.analyses,
        warnings: contractContext.warnings,
      },
    })
  } catch (error) {
    const status = error?.status || 500
    const message = error?.message || 'Erro ao processar a mensagem com IA.'

    console.error('Erro no chat IA:', message)

    return res.status(status).json({
      error: message,
    })
  }
}
