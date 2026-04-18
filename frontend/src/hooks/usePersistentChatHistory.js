import { useCallback, useEffect, useMemo, useState } from 'react'

const STORAGE_KEY = 'coffeebreakers.chat.history.v1'
const MAX_MESSAGES_PER_CONTEXT = 80
const ALLOWED_ROLES = new Set(['assistant', 'user'])
let hasResetHistoryForPageLoad = false

function createMessageId(prefix = 'msg') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

function createWelcomeMessage(contextType, contextLabel) {
  const target =
    contextType === 'process'
      ? `processo "${contextLabel || 'selecionado'}"`
      : `pasta "${contextLabel || 'selecionada'}"`

  return {
    id: createMessageId('assistant'),
    role: 'assistant',
    content: `Ola! Este historico esta vinculado ao ${target}. Como posso ajudar?`,
    createdAt: new Date().toISOString(),
  }
}

function normalizeMessage(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'object') {
    return null
  }

  const role = typeof rawMessage.role === 'string' ? rawMessage.role : ''
  const content = typeof rawMessage.content === 'string' ? rawMessage.content.trim() : ''

  if (!ALLOWED_ROLES.has(role) || !content) {
    return null
  }

  return {
    id: typeof rawMessage.id === 'string' && rawMessage.id ? rawMessage.id : createMessageId(role),
    role,
    content,
    createdAt:
      typeof rawMessage.createdAt === 'string' && rawMessage.createdAt
        ? rawMessage.createdAt
        : new Date().toISOString(),
  }
}

function normalizeMessages(rawMessages) {
  if (!Array.isArray(rawMessages)) {
    return []
  }

  return rawMessages
    .map(normalizeMessage)
    .filter(Boolean)
    .slice(-MAX_MESSAGES_PER_CONTEXT)
}

function parseStoredHistory() {
  if (typeof window === 'undefined') {
    return {}
  }

  try {
    if (!hasResetHistoryForPageLoad) {
      // Regra solicitada: ao recarregar a pagina, o chat deve iniciar limpo.
      window.localStorage.removeItem(STORAGE_KEY)
      hasResetHistoryForPageLoad = true
    }

    const raw = window.localStorage.getItem(STORAGE_KEY)

    if (!raw) {
      return {}
    }

    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return {}
    }

    const normalized = {}

    Object.entries(parsed).forEach(([contextKey, messages]) => {
      const safeMessages = normalizeMessages(messages)

      if (safeMessages.length > 0) {
        normalized[contextKey] = safeMessages
      }
    })

    return normalized
  } catch {
    return {}
  }
}

function ensureContextHistory(historyByContext, context) {
  const existing = normalizeMessages(historyByContext[context.key])

  if (existing.length > 0) {
    return existing
  }

  return [createWelcomeMessage(context.type, context.label)]
}

function writeStoredHistory(historyByContext) {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(historyByContext))
  } catch {
    // Sem acao: navegadores podem bloquear localStorage em alguns contextos.
  }
}

export function usePersistentChatHistory({ contextKey, contextType, contextLabel }) {
  const activeContext = useMemo(
    () => ({
      key: contextKey,
      type: contextType,
      label: contextLabel,
    }),
    [contextKey, contextType, contextLabel],
  )

  const [historyByContext, setHistoryByContext] = useState(() => {
    const stored = parseStoredHistory()
    return {
      ...stored,
      [activeContext.key]: ensureContextHistory(stored, activeContext),
    }
  })

  useEffect(() => {
    setHistoryByContext((current) => {
      const existing = current[activeContext.key]

      if (Array.isArray(existing) && existing.length > 0) {
        return current
      }

      return {
        ...current,
        [activeContext.key]: ensureContextHistory(current, activeContext),
      }
    })
  }, [activeContext])

  useEffect(() => {
    writeStoredHistory(historyByContext)
  }, [historyByContext])

  const messages = useMemo(
    () => historyByContext[activeContext.key] || ensureContextHistory(historyByContext, activeContext),
    [historyByContext, activeContext],
  )

  const updateMessagesForContext = useCallback((context, updater) => {
    setHistoryByContext((current) => {
      const baseMessages = ensureContextHistory(current, context)
      const nextMessagesRaw = typeof updater === 'function' ? updater(baseMessages) : updater
      const nextMessages = normalizeMessages(nextMessagesRaw)

      return {
        ...current,
        [context.key]:
          nextMessages.length > 0
            ? nextMessages
            : [createWelcomeMessage(context.type, context.label)],
      }
    })
  }, [])

  return {
    messages,
    updateMessagesForContext,
  }
}
