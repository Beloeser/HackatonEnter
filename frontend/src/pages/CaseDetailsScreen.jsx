import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import styled from 'styled-components'
import {
  ArrowLeft,
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
import { fetchCaseById, sendChatMessage } from '../services/api'
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
    type: raw.type || raw.subject || 'Assunto nao informado',
    subType: raw.subType || raw.subSubject || 'Nao informado',
    uf: raw.uf || '--',
    claimValue: Number(raw.claimValue || 0),
    condemnationValue: Number(raw.condemnationValue || 0),
    macroResult: raw.macroResult || 'Nao informado',
    microResult: raw.microResult || 'Nao informado',
    recommendation: raw.recommendation || {},
    result: raw.result || {},
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

  const chatContext = useMemo(
    () => ({
      key: `process:${caseId || 'desconhecido'}`,
      type: 'process',
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
          'Nao foi possivel carregar o detalhe do processo.'

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
    setChatInput('')
    setChatError('')
    setIsChatLoading(false)
  }, [chatContext.key])

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
        'Nao foi possivel enviar sua mensagem para a IA.'

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
      setFeedback('Nao foi possivel copiar automaticamente. Copie manualmente do navegador.')
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
            <StateCard>{error || 'Processo nao encontrado.'}</StateCard>
          ) : (
            <>
              <Hero>
                <HeroTitle>{caseData.title}</HeroTitle>
                <HeroMeta>
                  <Tag $accent>{caseData.status}</Tag>
                  <Tag>UF {caseData.uf}</Tag>
                  <Tag>{caseData.processNumber || 'Sem numero'}</Tag>
                </HeroMeta>
              </Hero>

              <Grid>
                <Card $span={4}>
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
                      <DataLabel>Numero do processo</DataLabel>
                      <DataValue>{caseData.processNumber || '--'}</DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={4}>
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
                      <DataLabel>Valor da condenacao</DataLabel>
                      <DataValue $strong>{formatCurrency(caseData.condemnationValue)}</DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={4}>
                  <CardHeader>
                    <Gavel size={15} />
                    Resultado
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Macro resultado</DataLabel>
                      <DataValue>{caseData.macroResult}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Micro resultado</DataLabel>
                      <DataValue>{caseData.microResult}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Decisao tomada</DataLabel>
                      <DataValue>{caseData.result.decisionTaken || 'Nao informado'}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Outcome final</DataLabel>
                      <DataValue>{caseData.result.outcome || 'Nao informado'}</DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={6}>
                  <CardHeader>
                    <ShieldCheck size={15} />
                    Recomendacao de IA (Mock)
                  </CardHeader>
                  <DataList>
                    <DataRow>
                      <DataLabel>Decisao sugerida</DataLabel>
                      <DataValue>{caseData.recommendation.decision || 'Nao informado'}</DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Valor sugerido</DataLabel>
                      <DataValue>
                        {caseData.recommendation.suggestedValue
                          ? formatCurrency(caseData.recommendation.suggestedValue)
                          : 'Nao informado'}
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Confianca</DataLabel>
                      <DataValue>
                        {typeof caseData.recommendation.confidence === 'number'
                          ? `${Math.round(caseData.recommendation.confidence * 100)}%`
                          : 'Nao informado'}
                      </DataValue>
                    </DataRow>
                    <DataRow>
                      <DataLabel>Justificativa</DataLabel>
                      <DataValue>{caseData.recommendation.reasoning || 'Nao informado'}</DataValue>
                    </DataRow>
                  </DataList>
                </Card>

                <Card $span={6}>
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
                      Baixar Procuracao
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

                  {feedback ? <Feedback>{feedback}</Feedback> : null}
                </Card>
              </Grid>
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
        contextDescription="Historico do processo selecionado"
      />
    </PageLayout>
  )
}
