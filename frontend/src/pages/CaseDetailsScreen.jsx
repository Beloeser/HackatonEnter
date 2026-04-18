import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  CircleDollarSign,
  Copy,
  ExternalLink,
  FileDown,
  FileText,
  Gavel,
  Scale,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { usePersistentChatHistory } from '../hooks/usePersistentChatHistory'
import {
  fetchCaseById,
  fetchCaseRecommendation,
  finalizeCaseResult,
  sendChatMessage,
} from '../services/api'
import AssistantPanel from './home/components/AssistantPanel'

const PageLayout = styled.main`
  display: grid;
  grid-template-columns: ${({ $chatOpen }) =>
    $chatOpen ? 'minmax(0, 1fr) minmax(340px, 420px)' : 'minmax(0, 1fr)'};
  width: 100%;
  min-height: 100vh;
  height: 100%;
  overflow: hidden;
  background: #f3f4f6;
`

const DetailsColumn = styled.section`
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 24px 30px;
`

const Container = styled.section`
  max-width: 1180px;
  margin: 0 auto;
`

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  margin-bottom: 20px;
`

const TopActions = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`

const BackButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px 14px;
  color: #374151;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: #d1d5db;
    background: #fafafa;
  }
`

const ChatOpenButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px 12px;
  color: #111827;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: #ffb300;
    background: #fff9ea;
  }
`

const DashboardLink = styled(Link)`
  color: #9f6700;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
`

const Hero = styled.header`
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  overflow: hidden;
  background: linear-gradient(160deg, #101010, #1a1a1a 52%, #0f0f0f);
  color: #f8fafc;
  padding: 26px 28px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.16);
`

const HeroTitle = styled.h1`
  margin: 0;
  font-size: clamp(22px, 3.2vw, 34px);
  line-height: 1.15;
  letter-spacing: -0.02em;
`

const HeroMeta = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 12px;
`

const Tag = styled.span`
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 600;
  color: ${({ $accent }) => ($accent ? '#1f2937' : '#f8fafc')};
  background: ${({ $accent }) => ($accent ? '#ffb300' : 'rgba(255, 255, 255, 0.08)')};
`

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 16px;
  margin-top: 18px;
`

const Card = styled.article`
  grid-column: span ${({ $span = 12 }) => $span};
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);

  @media (max-width: 980px) {
    grid-column: span 12;
  }
`

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  color: #6b7280;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const DataList = styled.dl`
  margin: 0;
  display: grid;
  gap: 10px;
`

const DataRow = styled.div`
  display: grid;
  gap: 3px;
`

const DataLabel = styled.dt`
  margin: 0;
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
`

const DataValue = styled.dd`
  margin: 0;
  color: #111827;
  font-size: 14px;
  line-height: 1.45;
  font-weight: ${({ $strong }) => ($strong ? 700 : 500)};
`

const ValueStack = styled.div`
  display: grid;
  gap: 2px;
`

const ActionGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  padding: 12px 13px;
  color: #1f2937;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: #ffb300;
    background: #fff9ea;
  }
`

const Feedback = styled.p`
  margin: 10px 0 0;
  font-size: 12px;
  color: ${({ $error }) => ($error ? '#b91c1c' : '#6b7280')};
`

const List = styled.ul`
  margin: 0;
  padding-left: 18px;
  color: #111827;
  font-size: 13px;
  line-height: 1.5;
  display: grid;
  gap: 6px;
`

const Hint = styled.p`
  margin: 10px 0 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.5;
`

const SummaryText = styled.p`
  margin: 0;
  color: #111827;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-line;
`

const SummaryPanel = styled.div`
  border: 1px solid #fde7b0;
  border-radius: 12px;
  background: linear-gradient(180deg, #fffdf7 0%, #ffffff 100%);
  padding: 14px;
`

const SummaryLead = styled.p`
  margin: 0;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.65;
  font-weight: 600;
`

const SummaryGrid = styled.div`
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`

const SummaryPoint = styled.article`
  border: 1px solid #f3f4f6;
  border-radius: 10px;
  background: #ffffff;
  padding: 10px 11px;
`

const SummaryPointTitle = styled.h4`
  margin: 0;
  color: #6b7280;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`

const SummaryPointText = styled.p`
  margin: 6px 0 0;
  color: #111827;
  font-size: 13px;
  line-height: 1.55;
`

const DecisionRow = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`

const DecisionButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid ${({ $active }) => ($active ? '#f59e0b' : '#d1d5db')};
  border-radius: 10px;
  background: ${({ $active }) => ($active ? '#fff7e0' : '#ffffff')};
  color: #111827;
  font-size: 13px;
  font-weight: 700;
  padding: 11px;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: #f59e0b;
    background: #fff7e0;
  }
`

const FieldBlock = styled.label`
  display: grid;
  gap: 6px;
  margin-top: 12px;
`

const FieldLabel = styled.span`
  color: #374151;
  font-size: 12px;
  font-weight: 700;
`

const TextInput = styled.input`
  width: 100%;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  padding: 10px 12px;
  outline: none;

  &:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
  }
`

const TextArea = styled.textarea`
  width: 100%;
  min-height: 100px;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  color: #111827;
  font-size: 14px;
  line-height: 1.5;
  padding: 10px 12px;
  outline: none;

  &:focus {
    border-color: #f59e0b;
    box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.15);
  }
`

const PublishButton = styled.button`
  margin-top: 12px;
  width: 100%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #111827;
  border-radius: 10px;
  background: #111827;
  color: #ffffff;
  font-size: 13px;
  font-weight: 700;
  padding: 11px 12px;
  cursor: pointer;
  transition: opacity 0.2s ease;

  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
`

const StateCard = styled.section`
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  background: #ffffff;
  padding: 28px 20px;
  text-align: center;
  color: #6b7280;
  margin-top: 18px;
`

function createChatMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}

function formatCurrency(value) {
  const parsed = Number(value || 0)
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(parsed)
}

function formatDateTime(value) {
  if (!value) {
    return 'Não informado'
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return 'Não informado'
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function humanizeToken(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function formatJudicialPhase(value) {
  const normalized = String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()

  const knownLabels = {
    'peticao inicial protocolada': 'Peticao inicial protocolada',
    'citacao pendente': 'Citacao pendente',
    'contestacao apresentada': 'Contestacao apresentada',
    instrucao: 'Em instrucao',
    sentenca: 'Sentenca',
    recurso: 'Em recurso',
    'fase processual nao confirmada': 'Fase processual ainda não confirmada',
  }

  if (knownLabels[normalized]) {
    return knownLabels[normalized]
  }

  const raw = humanizeToken(value)
  if (!raw) {
    return 'Fase processual ainda não confirmada'
  }

  return raw.charAt(0).toUpperCase() + raw.slice(1)
}

function parseCaseSummary(summary) {
  const blocks = String(summary || '')
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length === 0) {
    return { intro: '', points: [] }
  }

  const intro = blocks[0]
  const points = blocks.slice(1).map((block, index) => {
    const parsed = block.match(/^([^:]{3,90}):\s*([\s\S]+)$/)
    if (!parsed) {
      return {
        title: `Ponto ${index + 1}`,
        text: block,
      }
    }

    return {
      title: parsed[1].trim(),
      text: parsed[2].trim(),
    }
  })

  return { intro, points }
}

function mapCaseFromApi(payload) {
  const raw = payload?.data || payload?.case || payload
  if (!raw || typeof raw !== 'object') {
    return null
  }

  return {
    id: String(raw.id || raw._id || ''),
    processNumber: raw.processNumber || '',
    title: raw.title || (raw.processNumber ? `Processo ${raw.processNumber}` : 'Processo'),
    status: raw.status || 'em_analise',
    internalStatus: raw.internalStatus || raw.status || 'em_analise',
    judicialStatus: raw.judicialStatus || 'nao_confirmado',
    judicialPhase: raw.judicialPhase || 'fase processual nao confirmada',
    actionClass: raw.actionClass || 'geral',
    clientRole: raw.clientRole || 'autor',
    suggestedThesis: raw.suggestedThesis || '',
    actionContext: raw.actionContext || {},
    type: raw.type || raw.subject || 'Assunto nao informado',
    subType: raw.subType || raw.subSubject || 'Nao informado',
    uf: raw.uf || '--',
    claimValue: Number(raw.claimValue || 0),
    condemnationValue: Number(raw.condemnationValue || 0),
    macroResult: raw.macroResult || 'Nao informado',
    microResult: raw.microResult || 'Nao informado',
    recommendation: raw.recommendation || {},
    result: raw.result || {},
    financialEstimate: raw.financialEstimate || {},
    consistencyIssues: Array.isArray(raw.consistencyIssues) ? raw.consistencyIssues : [],
    terminologyAlerts: Array.isArray(raw.terminologyAlerts) ? raw.terminologyAlerts : [],
    dataOrigins: raw.dataOrigins || {},
    confidenceByBlock: raw.confidenceByBlock || {},
    decisionTrail: Array.isArray(raw.decisionTrail) ? raw.decisionTrail : [],
  }
}

function buildMockPdfContent(caseData, docType) {
  const lines = [
    'COFFEEBREAKERS LEGAL - DOCUMENTO MOCK',
    `Tipo do arquivo: ${docType}`,
    `Processo: ${caseData.processNumber || caseData.id}`,
    `Assunto: ${caseData.type}`,
    `Status: ${caseData.status}`,
    `Gerado em: ${new Date().toISOString()}`,
    '',
    'Este arquivo e um mock para demonstracao da funcionalidade de download.',
  ]

  return lines.join('\n')
}

function downloadMockFile(fileName, content, mimeType = 'application/pdf') {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(url)
}

export default function CaseDetailsScreen() {
  const navigate = useNavigate()
  const { caseId } = useParams()
  const [caseData, setCaseData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [chatInput, setChatInput] = useState('')
  const [chatError, setChatError] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [isRecommendationLoading, setIsRecommendationLoading] = useState(true)
  const [recommendationError, setRecommendationError] = useState('')
  const [caseSummary, setCaseSummary] = useState('')
  const [aiRecommendation, setAiRecommendation] = useState(null)
  const [selectedDecision, setSelectedDecision] = useState('')
  const [agreementValue, setAgreementValue] = useState('')
  const [publishReason, setPublishReason] = useState('')
  const [isPublishing, setIsPublishing] = useState(false)
  const [publishError, setPublishError] = useState('')
  const [publishSuccess, setPublishSuccess] = useState('')

  const parsedSummary = useMemo(() => parseCaseSummary(caseSummary), [caseSummary])

  const chatContext = useMemo(
    () => ({
      key: `process:${caseId || 'desconhecido'}`,
      type: 'process',
      id: caseId || '',
      label: caseData?.title || `Processo ${caseData?.processNumber || caseId || 'selecionado'}`,
    }),
    [caseId, caseData?.title, caseData?.processNumber],
  )

  const { messages: chatMessages, updateMessagesForContext } = usePersistentChatHistory({
    contextKey: chatContext.key,
    contextType: chatContext.type,
    contextLabel: chatContext.label,
  })

  useEffect(() => {
    let isMounted = true

    const loadCase = async () => {
      setIsLoading(true)
      setError('')

      try {
        const payload = await fetchCaseById(caseId)
        const normalized = mapCaseFromApi(payload)

        if (!isMounted) {
          return
        }

        if (!normalized) {
          setError('Nao foi possivel normalizar os dados do processo.')
          setCaseData(null)
        } else {
          setCaseData(normalized)
        }
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        const message =
          requestError?.response?.data?.message ||
          requestError?.message ||
          'Não foi possível carregar os detalhes do processo.'

        setError(message)
        setCaseData(null)
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadCase()

    return () => {
      isMounted = false
    }
  }, [caseId])

  useEffect(() => {
    let isMounted = true

    const loadRecommendation = async () => {
      setIsRecommendationLoading(true)
      setRecommendationError('')

      try {
        const payload = await fetchCaseRecommendation(caseId)
        const recommendationData = payload?.data || {}

        if (!isMounted) {
          return
        }

        setCaseSummary(String(recommendationData.summary || ''))
        setAiRecommendation(recommendationData.recommendation || null)
        setCaseData((current) =>
          current
            ? {
                ...current,
                consistencyIssues: Array.isArray(recommendationData.consistencyIssues)
                  ? recommendationData.consistencyIssues
                  : current.consistencyIssues,
                terminologyAlerts: Array.isArray(recommendationData.terminologyAlerts)
                  ? recommendationData.terminologyAlerts
                  : current.terminologyAlerts,
              }
            : current,
        )
        setSelectedDecision(String(recommendationData.recommendation?.decision || ''))

        if (recommendationData.recommendation?.decision === 'acordo') {
          const suggested = Number(recommendationData.recommendation?.suggestedValue || 0)
          setAgreementValue(suggested > 0 ? String(Math.round(suggested)) : '')
        } else {
          setAgreementValue('')
        }
      } catch (requestError) {
        if (!isMounted) {
          return
        }

        const message =
          requestError?.response?.data?.message ||
          requestError?.message ||
          'Não foi possível carregar a recomendacao da IA.'

        setRecommendationError(message)
        setCaseSummary('')
        setAiRecommendation(null)
      } finally {
        if (isMounted) {
          setIsRecommendationLoading(false)
        }
      }
    }

    loadRecommendation()

    return () => {
      isMounted = false
    }
  }, [caseId])

  useEffect(() => {
    setChatInput('')
    setChatError('')
    setIsChatLoading(false)
  }, [chatContext.key])

  useEffect(() => {
    setPublishReason('')
    setPublishError('')
    setPublishSuccess('')
    setIsPublishing(false)
  }, [caseId])

  const externalLink = useMemo(() => {
    if (!caseData?.processNumber) {
      return `https://www.jusbrasil.com.br/busca?q=${caseId}`
    }

    return `https://www.jusbrasil.com.br/busca?q=${encodeURIComponent(caseData.processNumber)}`
  }, [caseData, caseId])

  const handleChatInputChange = (value) => {
    if (chatError) {
      setChatError('')
    }

    setChatInput(value)
  }

  const handleSendMessage = async () => {
    const message = chatInput.trim()

    if (!message || isChatLoading) {
      return
    }

    const requestContext = {
      key: chatContext.key,
      type: chatContext.type,
      id: chatContext.id,
      label: chatContext.label,
    }

    const history = chatMessages.map((item) => ({
      role: item.role,
      content: item.content,
    }))

    updateMessagesForContext(requestContext, (currentMessages) => [
      ...currentMessages,
      createChatMessage('user', message),
    ])

    setChatInput('')
    setChatError('')
    setIsChatLoading(true)

    try {
      const response = await sendChatMessage({
        message,
        history,
        context: requestContext,
      })

      const assistantReply = typeof response?.reply === 'string' ? response.reply.trim() : ''

      if (!assistantReply) {
        throw new Error('A IA nao retornou uma resposta em texto.')
      }

      updateMessagesForContext(requestContext, (currentMessages) => [
        ...currentMessages,
        createChatMessage('assistant', assistantReply),
      ])
    } catch (requestError) {
      const messageText =
        requestError?.response?.data?.error ||
        requestError?.message ||
        'Não foi possível enviar sua mensagem para a IA.'

      setChatError(messageText)
    } finally {
      setIsChatLoading(false)
    }
  }

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(externalLink)
      setFeedback('Link do processo copiado com sucesso.')
    } catch {
      setFeedback('Não foi possível copiar automaticamente. Copie manualmente do navegador.')
    }
  }

  const handleDownloadProcessPdf = () => {
    if (!caseData) {
      return
    }
    downloadMockFile(
      `processo-${caseData.processNumber || caseData.id}.pdf`,
      buildMockPdfContent(caseData, 'PDF do Processo'),
    )
    setFeedback('Download mock do PDF do processo iniciado.')
  }

  const handleDownloadAutos = () => {
    if (!caseData) {
      return
    }
    downloadMockFile(
      `autos-${caseData.processNumber || caseData.id}.pdf`,
      buildMockPdfContent(caseData, 'Autos do Processo'),
    )
    setFeedback('Download mock dos autos iniciado.')
  }

  const handleDownloadPowerOfAttorney = () => {
    if (!caseData) {
      return
    }
    downloadMockFile(
      `procuracao-${caseData.processNumber || caseData.id}.pdf`,
      buildMockPdfContent(caseData, 'Procuracao'),
    )
    setFeedback('Download mock da procuracao iniciado.')
  }

  const handleSelectDecision = (decision) => {
    setSelectedDecision(decision)
    setPublishError('')
    setPublishSuccess('')
    if (decision === 'defesa') {
      setAgreementValue('')
    }
  }

  const handlePublishResult = async () => {
    if (isPublishing || !caseData) {
      return
    }

    if (!selectedDecision) {
      setPublishError('Selecione acordo ou defesa antes de publicar.')
      return
    }

    if (selectedDecision === 'acordo') {
      const parsedAgreementValue = Number(agreementValue)
      if (!Number.isFinite(parsedAgreementValue) || parsedAgreementValue <= 0) {
      setPublishError('Informe um valor de acordo válido maior que zero.')
        return
      }
    }

    if (!publishReason.trim()) {
      setPublishError('Explique o motivo da escolha para finalizar o resultado.')
      return
    }

    setPublishError('')
    setPublishSuccess('')
    setIsPublishing(true)

    try {
      const payload = await finalizeCaseResult(caseData.id, {
        decision: selectedDecision,
        agreementValue: selectedDecision === 'acordo' ? Number(agreementValue) : 0,
        justification: publishReason.trim(),
      })

      const savedCase = mapCaseFromApi(payload?.data?.case || payload?.data?.data?.case || payload?.data?.case)
      if (savedCase) {
        setCaseData(savedCase)
      }

      setPublishSuccess('Resultado publicado com sucesso.')
      setFeedback('Fluxo do advogado finalizado neste processo.')
    } catch (requestError) {
      const message =
        requestError?.response?.data?.message ||
        requestError?.message ||
        'Não foi possível publicar o resultado.'

      setPublishError(message)
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <PageLayout $chatOpen={isChatOpen}>
      <DetailsColumn>
        <Container>
          <TopRow>
            <BackButton type="button" onClick={() => navigate('/dashboard')}>
              <ArrowLeft size={16} />
              Voltar para dashboard
            </BackButton>

            <TopActions>
              {!isChatOpen ? (
                <ChatOpenButton type="button" onClick={() => setIsChatOpen(true)}>
                  <Sparkles size={16} />
                  Abrir IA Chat
                </ChatOpenButton>
              ) : null}

              <DashboardLink to="/dashboard">Ir para lista</DashboardLink>
            </TopActions>
          </TopRow>

          {isLoading ? (
            <StateCard>Carregando detalhes do processo...</StateCard>
          ) : error || !caseData ? (
            <StateCard>{error || 'Processo não encontrado.'}</StateCard>
          ) : (
            <>
              <Hero>
                <HeroTitle>{caseData.title}</HeroTitle>
                <HeroMeta>
                  <Tag $accent>Status interno: {caseData.internalStatus}</Tag>
                  <Tag>Andamento no tribunal: {formatJudicialPhase(caseData.judicialPhase)}</Tag>
                  <Tag>UF {caseData.uf}</Tag>
                  <Tag>{caseData.processNumber || 'Sem numero'}</Tag>
                </HeroMeta>
              </Hero>

              <Grid>
                <Card $span={12}>
                  <CardHeader>
                    <FileText size={15} />
                    Resumo do Caso
                  </CardHeader>
                  {isRecommendationLoading ? (
                    <DataValue>Gerando resumo contextual...</DataValue>
                  ) : caseSummary ? (
                    <SummaryPanel>
                      <SummaryLead>{parsedSummary.intro}</SummaryLead>
                      {parsedSummary.points.length > 0 ? (
                        <SummaryGrid>
                          {parsedSummary.points.map((point, index) => (
                            <SummaryPoint key={`${point.title}-${index}`}>
                              <SummaryPointTitle>{point.title}</SummaryPointTitle>
                              <SummaryPointText>{point.text}</SummaryPointText>
                            </SummaryPoint>
                          ))}
                        </SummaryGrid>
                      ) : (
                        <SummaryText>{caseSummary}</SummaryText>
                      )}
                    </SummaryPanel>
                  ) : (
                    <DataValue>Não foi possível gerar resumo no momento.</DataValue>
                  )}
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <Scale size={15} />
                    Dados Principais
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Assunto</DataLabel>
                      <DataValue $strong>{caseData.type}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Subassunto</DataLabel>
                      <DataValue>{caseData.subType}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Classe da acao</DataLabel>
                      <DataValue>{caseData.actionClass || '--'}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Polo do cliente</DataLabel>
                      <DataValue>{caseData.clientRole || '--'}</DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <CircleDollarSign size={15} />
                    Valores
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Valor da causa</DataLabel>
                      <DataValue $strong>{formatCurrency(caseData.claimValue)}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>{caseData.financialEstimate?.label || 'Estimativa financeira'}</DataLabel>
                      <DataValue $strong>
                        {formatCurrency(caseData.financialEstimate?.estimatedValue || caseData.condemnationValue)}
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Faixa estimada</DataLabel>
                      <DataValue>
                        {formatCurrency(caseData.financialEstimate?.uncertaintyMin)} a{' '}
                        {formatCurrency(caseData.financialEstimate?.uncertaintyMax)}
                      </DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <ShieldCheck size={15} />
                    Recomendacao de IA
                  </CardHeader>
                  {isRecommendationLoading ? (
                    <DataValue>Consultando IA com contexto do modelo de ML...</DataValue>
                  ) : recommendationError ? (
                    <Feedback $error>{recommendationError}</Feedback>
                  ) : (
                    <DataList>
                      <DataRow>
                        <DataLabel>Decisão sugerida</DataLabel>
                        <DataValue>{aiRecommendation?.decision || 'Não informado'}</DataValue>
                      </DataRow>
                      <DataRow>
                        <DataLabel>Status da recomendacao</DataLabel>
                        <DataValue>{aiRecommendation?.status || caseData.recommendation?.status || 'preliminar'}</DataValue>
                      </DataRow>
                      <DataRow>
                        <DataLabel>Estimativa de valor sugerido</DataLabel>
                        <DataValue>
                          {Number(aiRecommendation?.suggestedValue || 0) > 0
                            ? formatCurrency(aiRecommendation?.suggestedValue)
                            : 'Não informado'}
                        </DataValue>
                      </DataRow>
                      <DataRow>
                        <DataLabel>Confianca</DataLabel>
                        <DataValue>
                          {typeof aiRecommendation?.confidence === 'number'
                            ? `${Math.round(aiRecommendation.confidence * 100)}%`
                            : 'Não informado'}
                        </DataValue>
                      </DataRow>
                      <DataRow>
                        <DataLabel>Tese sugerida</DataLabel>
                        <DataValue>{caseData.suggestedThesis || aiRecommendation?.decision || 'Não informado'}</DataValue>
                      </DataRow>
                      <DataRow>
                        <DataLabel>Explicacao detalhada da escolha</DataLabel>
                        <DataValue>{aiRecommendation?.explanation || 'Não informado'}</DataValue>
                      </DataRow>
                      <DataRow>
                        <DataLabel>Aviso</DataLabel>
                        <DataValue>{aiRecommendation?.disclaimer || caseData.recommendation?.disclaimer || 'Esta recomendacao depende de validacao humana.'}</DataValue>
                      </DataRow>
                    </DataList>
                  )}
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <Gavel size={15} />
                    Decisão do Advogado
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Status da decisão humana</DataLabel>
                      <DataValue>{caseData.result?.status || 'pendente'}</DataValue>
                    </DataRow>
                  </DataList>
                  <DecisionRow>
                    <DecisionButton
                      type="button"
                      $active={selectedDecision === 'acordo'}
                      onClick={() => handleSelectDecision('acordo')}
                    >
                      Acordo
                    </DecisionButton>
                    <DecisionButton
                      type="button"
                      $active={selectedDecision === 'defesa'}
                      onClick={() => handleSelectDecision('defesa')}
                    >
                      Defesa
                    </DecisionButton>
                  </DecisionRow>

                  {selectedDecision === 'acordo' ? (
                    <FieldBlock>
                      <FieldLabel>Valor do acordo</FieldLabel>
                      <TextInput
                        type="number"
                        min="0"
                        step="0.01"
                      placeholder="Ex.: 7500"
                        value={agreementValue}
                        onChange={(event) => setAgreementValue(event.target.value)}
                      />
                    </FieldBlock>
                  ) : null}

                  <FieldBlock>
                    <FieldLabel>Justifique a escolha para publicar/finalizar</FieldLabel>
                    <TextArea
                      placeholder="Explique resumidamente o porquê da escolha."
                      value={publishReason}
                      onChange={(event) => setPublishReason(event.target.value)}
                    />
                  </FieldBlock>

                  <PublishButton type="button" onClick={handlePublishResult} disabled={isPublishing}>
                    {isPublishing ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
                    {isPublishing ? 'Publicando...' : 'Publicar / Finalizar Resultado'}
                  </PublishButton>

                  {publishError ? <Feedback $error>{publishError}</Feedback> : null}
                  {publishSuccess ? <Feedback>{publishSuccess}</Feedback> : null}
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <FileText size={15} />
                    Origem e Atualizacao
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Andamento no tribunal</DataLabel>
                      <DataValue>
                        <ValueStack>
                          <span>Origem: {caseData.dataOrigins?.judicialPhase?.source || 'Não informado'}</span>
                          <span>Atualizado em: {formatDateTime(caseData.dataOrigins?.judicialPhase?.updatedAt)}</span>
                        </ValueStack>
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Status interno</DataLabel>
                      <DataValue>
                        <ValueStack>
                          <span>Origem: {caseData.dataOrigins?.internalStatus?.source || 'Não informado'}</span>
                          <span>Atualizado em: {formatDateTime(caseData.dataOrigins?.internalStatus?.updatedAt)}</span>
                        </ValueStack>
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Recomendacao automatizada</DataLabel>
                      <DataValue>
                        <ValueStack>
                          <span>Origem: {caseData.dataOrigins?.recommendation?.source || 'Não informado'}</span>
                          <span>
                            Atualizado em:{' '}
                            {formatDateTime(
                              aiRecommendation?.generatedAt || caseData.dataOrigins?.recommendation?.updatedAt,
                            )}
                          </span>
                        </ValueStack>
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Decisão humana</DataLabel>
                      <DataValue>
                        <ValueStack>
                          <span>Origem: {caseData.dataOrigins?.lawyerDecision?.source || 'Não informado'}</span>
                          <span>Atualizado em: {formatDateTime(caseData.dataOrigins?.lawyerDecision?.updatedAt)}</span>
                        </ValueStack>
                      </DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <CircleDollarSign size={15} />
                    Memória da estimativa
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Base de cálculo</DataLabel>
                      <DataValue>{caseData.financialEstimate?.calculationBase || 'Não informada'}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Metodologia</DataLabel>
                      <DataValue>{caseData.financialEstimate?.methodology || 'Não informada'}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Documentos usados</DataLabel>
                      <DataValue>
                        {Array.isArray(caseData.financialEstimate?.documentsUsed) &&
                        caseData.financialEstimate.documentsUsed.length > 0
                          ? caseData.financialEstimate.documentsUsed.join(', ')
                          : 'Não informado'}
                      </DataValue>
                    </DataRow>
                    {caseData.actionClass === 'revisional_bancaria' ? (
                      <>
                        <DataRow>
                          <DataLabel>Contrato envolvido</DataLabel>
                          <DataValue>{caseData.actionContext?.contractReference || 'Não informado'}</DataValue>
                        </DataRow>
                        <DataRow>
                          <DataLabel>Taxa contratada / taxa média</DataLabel>
                          <DataValue>
                            {caseData.actionContext?.contractedRate ?? 'n/a'} /{' '}
                            {caseData.actionContext?.marketRate ?? 'n/a'}
                          </DataValue>
                        </DataRow>
                        <DataRow>
                          <DataLabel>Pedido principal</DataLabel>
                          <DataValue>{caseData.actionContext?.mainClaim || 'Não informado'}</DataValue>
                        </DataRow>
                      </>
                    ) : null}
                  </DataList>
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <AlertCircle size={15} />
                    Pendências de consistência
                  </CardHeader>
                  {caseData.consistencyIssues?.length ? (
                    <List>
                      {caseData.consistencyIssues.map((issue, index) => (
                        <li key={`${issue.code || 'issue'}-${index}`}>
                          [{issue.severity || 'warning'}] {issue.message || 'Inconsistencia detectada'}
                        </li>
                      ))}
                    </List>
                  ) : (
                    <DataValue>Nenhuma pendência de consistência detectada.</DataValue>
                  )}

                  {caseData.terminologyAlerts?.length ? (
                    <>
                      <Hint>Alertas terminológicos</Hint>
                      <List>
                        {caseData.terminologyAlerts.map((alert, index) => (
                          <li key={`alert-${index}`}>{alert}</li>
                        ))}
                      </List>
                    </>
                  ) : null}
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <ShieldCheck size={15} />
                    Confiabilidade por bloco
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Classificacao do assunto</DataLabel>
                      <DataValue>
                        {Math.round(Number(caseData.confidenceByBlock?.subjectClassification || 0) * 100)}%
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Estimativa financeira</DataLabel>
                      <DataValue>
                        {Math.round(Number(caseData.confidenceByBlock?.financialEstimate || 0) * 100)}%
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Fase processual</DataLabel>
                      <DataValue>
                        {Math.round(Number(caseData.confidenceByBlock?.judicialPhase || 0) * 100)}%
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Tese sugerida</DataLabel>
                      <DataValue>
                        {Math.round(Number(caseData.confidenceByBlock?.suggestedThesis || 0) * 100)}%
                      </DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={12}>
                  <CardHeader>
                    <Gavel size={15} />
                    Trilha de decisão
                  </CardHeader>
                  {caseData.decisionTrail?.length ? (
                    <List>
                      {caseData.decisionTrail.map((item, index) => (
                        <li key={`${item.type || 'trail'}-${index}`}>
                          Em {formatDateTime(item.createdAt)}, {item.actor || 'sistema'} registrou o evento{' '}
                          "{item.type || 'evento'}". Recomendacao: {item.recommendationDecision || 'n/a'}. Decisao
                          humana: {item.lawyerDecision || 'n/a'}. Motivo: {item.reason || 'Não informado'}.
                        </li>
                      ))}
                    </List>
                  ) : (
                    <DataValue>Nenhum evento registrado na trilha de decisão.</DataValue>
                  )}
                </Card>

                <Card $span={12}>
                  <CardHeader>
                    <FileText size={15} />
                    Documentos e Links (Mock)
                  </CardHeader>

                  <ActionGrid>
                    <ActionButton type="button" onClick={handleDownloadProcessPdf}>
                      Baixar PDF do Processo
                      <FileDown size={16} />
                    </ActionButton>

                    <ActionButton type="button" onClick={handleDownloadAutos}>
                      Baixar Autos
                      <FileDown size={16} />
                    </ActionButton>

                    <ActionButton type="button" onClick={handleDownloadPowerOfAttorney}>
                      Baixar procuracao
                      <FileDown size={16} />
                    </ActionButton>

                    <ActionButton type="button" onClick={handleCopyLink}>
                      Copiar Link do Processo
                      <Copy size={16} />
                    </ActionButton>

                    <ActionButton
                      type="button"
                      onClick={() => {
                        window.open(externalLink, '_blank', 'noopener,noreferrer')
                        setFeedback('Abrindo link externo do processo.')
                      }}
                    >
                      Abrir Link Externo
                      <ExternalLink size={16} />
                    </ActionButton>
                  </ActionGrid>
                </Card>
              </Grid>

              {feedback ? <Feedback>{feedback}</Feedback> : null}
            </>
          )}
        </Container>
      </DetailsColumn>

      <AssistantPanel
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        messages={chatMessages}
        inputValue={chatInput}
        onInputChange={handleChatInputChange}
        onSendMessage={handleSendMessage}
        isLoading={isChatLoading}
        error={chatError}
        contextLabel={chatContext.label}
        contextDescription="Histórico do processo selecionado"
      />
    </PageLayout>
  )
}



