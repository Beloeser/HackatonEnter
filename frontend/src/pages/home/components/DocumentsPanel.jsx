import styled from 'styled-components'
import { Clock } from 'lucide-react'

const Content = styled.main`
  grid-column: 3;
  grid-row: 2;
  min-width: 0;
  min-height: 0;
  overflow-y: auto;
  background: #f3f4f6;
  padding: 32px 40px;
`

const PageHeader = styled.div`
  margin-bottom: 24px;
  text-align: left;
`

const Title = styled.h1`
  margin: 0;
  color: #111827;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
`

const Subtitle = styled.p`
  margin: 8px 0 0;
  color: #6b7280;
  font-size: 15px;
  line-height: 1.4;
`

const DocumentCollection = styled.div`
  display: ${({ $viewMode }) => ($viewMode === 'grid' ? 'grid' : 'flex')};
  grid-template-columns: ${({ $viewMode }) =>
    $viewMode === 'grid' ? 'repeat(auto-fill, minmax(190px, 1fr))' : 'none'};
  flex-direction: ${({ $viewMode }) => ($viewMode === 'grid' ? 'row' : 'column')};
  align-items: stretch;
  gap: 20px;
`

const DocumentCard = styled.button`
  width: 100%;
  min-height: ${({ $viewMode }) => ($viewMode === 'grid' ? '208px' : '0')};
  border: 1px solid ${({ $active }) => ($active ? '#f5e9c8' : '#e5e7eb')};
  border-radius: 10px;
  background: ${({ $active }) => ($active ? '#fffbf0' : '#ffffff')};
  padding: ${({ $viewMode }) => ($viewMode === 'grid' ? '18px' : '24px')};
  text-align: left;
  box-shadow: ${({ $active }) =>
    $active ? '0 4px 14px rgba(15, 23, 42, 0.07)' : '0 1px 2px rgba(15, 23, 42, 0.05)'};
  transition: border-color 0.2s ease, box-shadow 0.2s ease, background-color 0.2s ease;

  &:hover {
    border-color: #e8e8e8;
    box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
  }
`

const DocumentMain = styled.div`
  display: flex;
  flex-direction: ${({ $viewMode }) => ($viewMode === 'grid' ? 'column' : 'row')};
  align-items: ${({ $viewMode }) => ($viewMode === 'grid' ? 'flex-start' : 'flex-start')};
  justify-content: space-between;
  gap: ${({ $viewMode }) => ($viewMode === 'grid' ? '12px' : '20px')};
`

const DocumentText = styled.div`
  min-width: 0;
  flex: 1;
  padding-right: ${({ $viewMode }) => ($viewMode === 'grid' ? '0' : '8px')};
`

const DocumentTitle = styled.h3`
  margin: 0;
  color: #111827;
  font-size: ${({ $viewMode }) => ($viewMode === 'grid' ? '14px' : '15px')};
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: ${({ $viewMode }) => ($viewMode === 'grid' ? '1.38' : '1.45')};
`

const DocumentType = styled.p`
  margin: ${({ $viewMode }) => ($viewMode === 'grid' ? '8px 0 0' : '10px 0 0')};
  color: #6b7280;
  font-size: ${({ $viewMode }) => ($viewMode === 'grid' ? '13px' : '14px')};
  line-height: ${({ $viewMode }) => ($viewMode === 'grid' ? '1.45' : '1.55')};
`

const StatusChip = styled.span`
  flex-shrink: 0;
  align-self: ${({ $viewMode }) => ($viewMode === 'grid' ? 'flex-start' : 'auto')};
  border: 1px solid #e8d48a;
  border-radius: 999px;
  background: #fffcf5;
  padding: 6px 12px;
  color: #92400e;
  font-size: 12px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.2;
  text-align: center;
`

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: ${({ $viewMode }) => ($viewMode === 'grid' ? '14px' : '20px')};
  color: #9ca3af;
  font-size: ${({ $viewMode }) => ($viewMode === 'grid' ? '12px' : '13px')};
  letter-spacing: 0.02em;
`

const MetaIcon = styled(Clock)`
  flex-shrink: 0;
  opacity: 0.8;
`

const EmptyState = styled.div`
  border: 1px dashed #d1d5db;
  border-radius: 10px;
  background: #ffffff;
  padding: 36px 24px;
  color: #6b7280;
  text-align: center;
`

const EmptyTitle = styled.p`
  margin: 0;
  color: #111827;
  font-size: 16px;
  font-weight: 600;
`

const EmptySubtitle = styled.p`
  margin: 8px 0 0;
  font-size: 14px;
`

export default function DocumentsPanel({
  folders,
  selectedFolder,
  documents,
  selectedDocumentId,
  onSelectDocument,
  viewMode,
  totalDocuments,
}) {
  const activeFolder = folders.find((folder) => folder.id === selectedFolder)
  const activeDocument = documents.find((document) => document.id === selectedDocumentId)

  const subtitleText = activeDocument
    ? `Processo ativo no chat: ${activeDocument.title}`
    : documents.length === totalDocuments
      ? `${documents.length} processos encontrados • Modo ${viewMode === 'grid' ? 'grade' : 'card'}`
      : `${documents.length} de ${totalDocuments} processos exibidos • Modo ${viewMode === 'grid' ? 'grade' : 'card'}`

  return (
    <Content>
      <PageHeader>
        <Title>{activeFolder?.name ?? 'Pastas'}</Title>
        <Subtitle>{subtitleText}</Subtitle>
      </PageHeader>

      {documents.length === 0 ? (
        <EmptyState>
          <EmptyTitle>Nenhum processo encontrado</EmptyTitle>
          <EmptySubtitle>Ajuste os filtros para ver outros resultados.</EmptySubtitle>
        </EmptyState>
      ) : (
        <DocumentCollection $viewMode={viewMode}>
          {documents.map((doc) => {
            const isActive = doc.id === selectedDocumentId

            return (
              <DocumentCard
                key={doc.id}
                type="button"
                $active={isActive}
                $viewMode={viewMode}
                onClick={() => onSelectDocument && onSelectDocument(doc.id)}
                aria-pressed={isActive}
              >
                <DocumentMain $viewMode={viewMode}>
                  <DocumentText $viewMode={viewMode}>
                    <DocumentTitle $viewMode={viewMode}>{doc.title}</DocumentTitle>
                    <DocumentType $viewMode={viewMode}>{doc.type}</DocumentType>
                  </DocumentText>
                  <StatusChip $viewMode={viewMode}>{doc.status}</StatusChip>
                </DocumentMain>

                <Meta $viewMode={viewMode}>
                  <MetaIcon size={16} strokeWidth={1.75} />
                  <span>{doc.date}</span>
                </Meta>
              </DocumentCard>
            )
          })}
        </DocumentCollection>
      )}
    </Content>
  )
}
