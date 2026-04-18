import OpenAI from 'openai'

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

const SYSTEM_PROMPT = [
  'Voce e um assistente juridico para uma plataforma chamada CoffeeBreakers.',
  'Responda em portugues brasileiro, com clareza e objetividade.',
  'Evite inventar fatos e deixe explicito quando estiver inferindo algo.',
].join(' ')

export const postChatMessage = async (req, res) => {
  try {
    const message = normalizeMessageContent(req.body?.message)
    const history = sanitizeHistory(req.body?.history)

    if (!message) {
      return res.status(400).json({
        error: 'O campo "message" e obrigatorio.',
      })
    }

    const client = getOpenAIClient()

    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
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
