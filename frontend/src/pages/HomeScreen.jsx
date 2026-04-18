import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Clock, FileText, Folder, Sparkles, TrendingUp } from 'lucide-react'
import { usePersistentChatHistory } from '../hooks/usePersistentChatHistory'
import { fetchCases, sendChatMessage } from '../services/api'
import AssistantPanel from './home/components/AssistantPanel'
import DocumentsPanel from './home/components/DocumentsPanel'
import FoldersPanel from './home/components/FoldersPanel'
import HomeSidebar from './home/components/HomeSidebar'
import HomeTopbar from './home/components/HomeTopbar'

const FOLDER_DEFINITIONS = [
  { id: 0, name: 'Processos Ativos', icon: Folder },
  { id: 1, name: 'Em Analise', icon: TrendingUp },
  { id: 2, name: 'Aguardando Decisao', icon: Clock },
  { id: 3, name: 'Arquivados', icon: FileText },
  { id: 4, name: 'Urgentes', icon: Sparkles },
]

const PageGrid = styled.div`
  display: grid;
  grid-template-columns: ${({ $chatOpen }) =>
    $chatOpen ? '76px 360px minmax(0, 1fr) minmax(340px, 420px)' : '76px 360px minmax(0, 1fr)'};
  grid-template-rows: 96px minmax(0, 1fr);
  width: 100%;
  height: 100vh;
  height: 100dvh;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  overflow: hidden;
  background: #f3f4f6;
`

const DashboardChatSlot = styled.div`
  grid-column: 4;
  grid-row: 2;
  display: flex;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
`

function createChatMessage(role, content) {
  return {
    id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    role,
    content,
    createdAt: new Date().toISOString(),
  }
}

function buildChatContext({ selectedDocument, selectedFolder, folders }) {
  if (selectedDocument) {
    return {
      key: `process:${selectedDocument.id}`,
      type: 'process',
      id: selectedDocument.id,
      label: selectedDocument.title,
    }
  }

  const activeFolder = folders.find((folder) => folder.id === selectedFolder)

  return {
    key: `folder:${selectedFolder}`,
    type: 'folder',
    id: selectedFolder,
    label: activeFolder?.name || `Pasta ${selectedFolder}`,
  }
}

function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function mapStatusToFolderId(status) {
  const normalizedStatus = normalizeText(status)

  if (
    normalizedStatus.includes('urgente') ||
    normalizedStatus.includes('prazo') ||
    normalizedStatus.includes('liminar')
  ) {
    return 4
  }

  if (
    normalizedStatus.includes('arquiv') ||
    normalizedStatus.includes('baixado') ||
    normalizedStatus.includes('transito')
  ) {
    return 3
  }

  if (
    normalizedStatus.includes('aguardando') ||
    normalizedStatus.includes('pendente') ||
    normalizedStatus.includes('concluso') ||
    normalizedStatus.includes('despacho')
  ) {
    return 2
  }

  if (
    normalizedStatus.includes('analise') ||
    normalizedStatus.includes('triagem') ||
    normalizedStatus.includes('revisao')
  ) {
    return 1
  }

  return 0
}

function formatDateFromValue(value) {
  if (!value) {
    return ''
  }

  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function extractCaseList(payload) {
  if (Array.isArray(payload)) {
    return payload
  }

  if (Array.isArray(payload?.data)) {
    return payload.data
  }

  if (Array.isArray(payload?.cases)) {
    return payload.cases
  }

  return []
}

function normalizeIncomingDocument(rawDocument, index) {
  if (!rawDocument || typeof rawDocument !== 'object') {
    return null
  }

  const idSource = rawDocument.id || rawDocument._id || rawDocument.processNumber || `case-${index}`
  const id = String(idSource)
  const status = String(rawDocument.status || 'em_analise')
  const folderIdCandidate = Number(rawDocument.folderId)
  const folderId = Number.isFinite(folderIdCandidate) ? folderIdCandidate : mapStatusToFolderId(status)

  return {
    id,
    folderId,
    title: rawDocument.title || (rawDocument.processNumber ? `Processo ${rawDocument.processNumber}` : `Processo ${id}`),
    type: rawDocument.type || rawDocument.subject || 'Assunto nao informado',
    date: rawDocument.date || formatDateFromValue(rawDocument.updatedAt || rawDocument.createdAt),
    status,
    processNumber: rawDocument.processNumber || '',
  }
}

export default function HomeScreen() {
  const navigate = useNavigate()
  const [selectedFolder, setSelectedFolder] = useState(0)
  const [selectedDocumentId, setSelectedDocumentId] = useState(null)
  const [viewMode, setViewMode] = useState('card')
  const [searchQuery, setSearchQuery] = useState('')
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [sidebarActive, setSidebarActive] = useState('settings')
  const [chatInput, setChatInput] = useState('')
  const [loadingContextKey, setLoadingContextKey] = useState(null)
  const [chatErrorsByContext, setChatErrorsByContext] = useState({})
  const [documents, setDocuments] = useState([])
  const [isCasesLoading, setIsCasesLoading] = useState(true)
  const [casesError, setCasesError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadCases = async () => {
      setIsCasesLoading(true)
      setCasesError('')

      try {
        const payload = await fetchCases()
        const rawCases = extractCaseList(payload)
        const normalizedCases = rawCases
          .map((caseItem, index) => normalizeIncomingDocument(caseItem, index))
          .filter(Boolean)

        if (!isMounted) {
          return
        }

        setDocuments(normalizedCases)
      } catch (error) {
        if (!isMounted) {
          return
        }

        const message =
          error?.response?.data?.message || error?.message || 'Nao foi possivel carregar os processos do backend.'

        setDocuments([])
        setCasesError(message)
      } finally {
        if (isMounted) {
          setIsCasesLoading(false)
        }
      }
    }

    loadCases()

    return () => {
      isMounted = false
    }
  }, [])

  const foldersWithCount = useMemo(() => {
    const countByFolder = documents.reduce((accumulator, document) => {
      const currentCount = accumulator[document.folderId] || 0
      return {
        ...accumulator,
        [document.folderId]: currentCount + 1,
      }
    }, {})

    return FOLDER_DEFINITIONS.map((folder) => ({
      ...folder,
      count: countByFolder[folder.id] || 0,
    }))
  }, [documents])

  const documentsForSelectedFolder = useMemo(
    () => documents.filter((document) => document.folderId === selectedFolder),
    [documents, selectedFolder],
  )

  const filteredDocuments = useMemo(() => {
    const normalizedQuery = normalizeText(searchQuery.trim())

    return documentsForSelectedFolder.filter((document) => {
      const searchableText = normalizeText(
        `${document.title} ${document.type} ${document.status} ${document.date} ${document.processNumber}`,
      )

      return normalizedQuery.length === 0 || searchableText.includes(normalizedQuery)
    })
  }, [documentsForSelectedFolder, searchQuery])

  const selectedDocument = useMemo(
    () => documents.find((document) => String(document.id) === String(selectedDocumentId)) || null,
    [documents, selectedDocumentId],
  )

  const activeChatContext = useMemo(
    () => buildChatContext({ selectedDocument, selectedFolder, folders: foldersWithCount }),
    [selectedDocument, selectedFolder, foldersWithCount],
  )

  const { messages: chatMessages, updateMessagesForContext } = usePersistentChatHistory({
    contextKey: activeChatContext.key,
    contextType: activeChatContext.type,
    contextLabel: activeChatContext.label,
  })

  const chatError = chatErrorsByContext[activeChatContext.key] || ''
  const isChatLoading = loadingContextKey === activeChatContext.key
  const hasPendingRequest = Boolean(loadingContextKey)

  useEffect(() => {
    setChatInput('')
  }, [activeChatContext.key])

  useEffect(() => {
    if (!selectedDocumentId) {
      return
    }

    const existsInCurrentResult = filteredDocuments.some(
      (document) => String(document.id) === String(selectedDocumentId),
    )

    if (!existsInCurrentResult) {
      setSelectedDocumentId(null)
    }
  }, [filteredDocuments, selectedDocumentId])

  const setChatErrorForContext = (contextKey, value) => {
    setChatErrorsByContext((current) => {
      if (!value) {
        if (!current[contextKey]) {
          return current
        }

        const next = { ...current }
        delete next[contextKey]
        return next
      }

      return {
        ...current,
        [contextKey]: value,
      }
    })
  }

  const toggleChat = () => {
    setIsChatOpen((current) => !current)
  }

  const handleSelectFolder = (folderId) => {
    setSelectedFolder(folderId)
    setSelectedDocumentId(null)
  }

  const handleSelectDocument = (documentId) => {
    setSelectedDocumentId(String(documentId))
  }

  const handleOpenDocument = (documentId) => {
    if (!documentId) {
      return
    }

    navigate(`/dashboard/process/${documentId}`)
  }

  const handleChatInputChange = (value) => {
    if (chatError) {
      setChatErrorForContext(activeChatContext.key, '')
    }

    setChatInput(value)
  }

  const handleSendMessage = async () => {
    const message = chatInput.trim()

    if (!message || hasPendingRequest) {
      return
    }

    const requestContext = {
      key: activeChatContext.key,
      type: activeChatContext.type,
      label: activeChatContext.label,
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
    setChatErrorForContext(requestContext.key, '')
    setLoadingContextKey(requestContext.key)

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
    } catch (error) {
      const errorMessage =
        error?.response?.data?.error || error?.message || 'Nao foi possivel enviar sua mensagem para a IA.'

      setChatErrorForContext(requestContext.key, errorMessage)
    } finally {
      setLoadingContextKey((current) => (current === requestContext.key ? null : current))
    }
  }

  const chatContextDescription =
    activeChatContext.type === 'process'
      ? 'Historico do processo selecionado'
      : 'Historico da pasta selecionada'

  return (
    <PageGrid $chatOpen={isChatOpen}>
      <HomeSidebar activeItem={sidebarActive} onSelectItem={setSidebarActive} />
      <HomeTopbar
        isChatOpen={isChatOpen}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onToggleChat={toggleChat}
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
      />
      <FoldersPanel
        folders={foldersWithCount}
        selectedFolder={selectedFolder}
        onSelectFolder={handleSelectFolder}
      />
      <DocumentsPanel
        folders={foldersWithCount}
        selectedFolder={selectedFolder}
        documents={filteredDocuments}
        selectedDocumentId={selectedDocumentId}
        onSelectDocument={handleSelectDocument}
        onOpenDocument={handleOpenDocument}
        viewMode={viewMode}
        totalDocuments={documentsForSelectedFolder.length}
        isLoading={isCasesLoading}
        error={casesError}
      />
      {isChatOpen ? (
        <DashboardChatSlot>
          <AssistantPanel
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
            messages={chatMessages}
            inputValue={chatInput}
            onInputChange={handleChatInputChange}
            onSendMessage={handleSendMessage}
            isLoading={isChatLoading}
            error={chatError}
            contextLabel={activeChatContext.label}
            contextDescription={chatContextDescription}
          />
        </DashboardChatSlot>
      ) : null}
    </PageGrid>
  )
}
