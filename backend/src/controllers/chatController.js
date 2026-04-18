import OpenAI from 'openai'
import mongoose from 'mongoose'
import Case from '../models/CaseModel.js'

const MODEL_NAME = process.env.OPENAI_MODEL || 'gpt-5.4'

let openaiClient = null

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY || process.env.OPEN_AI_KEY

  if (!apiKey) {
    throw new Error('OPENAI_API_KEY (ou OPEN_AI_KEY) nao configurada no .env.')
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

function sanitizeContext(context) {
  if (!context || typeof context !== 'object') {
    return null
  }

  const type = String(context.type || '')
    .toLowerCase()
    .trim()
  const id = String(context.id || '').trim()
  const label = String(context.label || '').trim()
  const key = String(context.key || '').trim()

  if (!['process', 'folder'].includes(type)) {
    return null
  }

  return {
    type,
    id,
    label: label.slice(0, 200),
    key: key.slice(0, 200),
  }
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function buildCaseContextSummary(caseData) {
  return [
    `Processo: ${caseData.processNumber || 'Nao informado'} (${caseData.uf || '--'})`,
    `Status: ${caseData.status || 'Nao informado'}`,
    `Assunto: ${caseData.subject || 'Nao informado'}`,
    `Subassunto: ${caseData.subSubject || 'Nao informado'}`,
    `Valor da causa: ${formatMoney(caseData.claimValue)}`,
    `Condenacao estimada: ${formatMoney(caseData.condemnationValue)}`,
    `Recomendacao pre-calculada: decisao="${caseData?.recommendation?.decision || 'Nao informado'}", valor="${formatMoney(caseData?.recommendation?.suggestedValue)}", confianca="${Number(caseData?.recommendation?.confidence || 0)}"`,
    `Decisao registrada pelo advogado: ${caseData?.result?.decisionTaken || 'Nao informado'}`,
  ].join('\n')
}

async function buildContextMessage(context) {
  if (!context) {
    return ''
  }

  if (context.type === 'folder') {
    return [
      'Contexto atual da conversa:',
      `Tipo: pasta`,
      `Identificador: ${context.id || 'Nao informado'}`,
      `Nome/rotulo: ${context.label || 'Nao informado'}`,
      'Use esse contexto para orientar respostas mais alinhadas a triagem da pasta selecionada.',
    ].join('\n')
  }

  if (context.type === 'process') {
    if (!context.id || !mongoose.Types.ObjectId.isValid(context.id)) {
      return [
        'Contexto atual da conversa:',
        'Tipo: processo',
        `Identificador recebido: ${context.id || 'Nao informado'}`,
        'O id do processo nao e valido; avise a limitacao e responda de forma geral.',
      ].join('\n')
    }

    try {
      const caseItem = await Case.findById(context.id).lean()
      if (!caseItem) {
        return [
          'Contexto atual da conversa:',
          'Tipo: processo',
          `Identificador: ${context.id}`,
          'Processo nao encontrado no banco para este id; sinalize a limitacao ao responder.',
        ].join('\n')
      }

      return [
        'Contexto atual da conversa:',
        'Tipo: processo',
        `Identificador: ${context.id}`,
        `Rotulo enviado pelo frontend: ${context.label || 'Nao informado'}`,
        'Dados do processo no banco (fonte de verdade):',
        buildCaseContextSummary(caseItem),
        'Use este contexto como base principal da resposta.',
      ].join('\n')
    } catch {
      return [
        'Contexto atual da conversa:',
        'Tipo: processo',
        `Identificador: ${context.id}`,
        'Nao foi possivel consultar o processo agora; sinalize essa limitacao ao responder.',
      ].join('\n')
    }
  }

  return ''
}

const SYSTEM_PROMPT = [
  'Voce e um assistente juridico para uma plataforma chamada CoffeeBreakers.',
  'Responda em portugues brasileiro, com clareza e objetividade.',
  'Evite inventar fatos e deixe explicito quando estiver inferindo algo.',
].join(' ')

export const postChatMessage = async (req, res) => {
  try {
    const message = normalizeMessageContent(req.body?.message)
    const history = sanitizeHistory(req.body?.history)
    const context = sanitizeContext(req.body?.context)

    if (!message) {
      return res.status(400).json({
        error: 'O campo "message" e obrigatorio.',
      })
    }

    const client = getOpenAIClient()
    const contextMessage = await buildContextMessage(context)

    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...(contextMessage ? [{ role: 'system', content: contextMessage }] : []),
        ...history.map((item) => ({
          role: item.role,
          content: item.content,
        })),
        { role: 'user', content: message },
      ],
      temperature: 0.2,
    })

    const reply = normalizeMessageContent(completion.choices?.[0]?.message?.content)

    if (!reply) {
      return res.status(502).json({
        error: 'A OpenAI nao retornou texto na resposta.',
      })
    }

    return res.status(200).json({
      reply,
      model: MODEL_NAME,
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
