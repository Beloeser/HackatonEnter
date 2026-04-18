import styled from 'styled-components'

const Panel = styled.section`
  grid-column: 2;
  grid-row: 2;
  display: flex;
  min-width: 0;
  min-height: 0;
  flex-direction: column;
  overflow: hidden;
  border-right: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 1px 0 0 rgba(15, 23, 42, 0.03);
`

const PanelHeader = styled.div`
  flex-shrink: 0;
  border-bottom: 1px solid #e5e7eb;
  padding: 28px 24px 20px;
`

const PanelTitle = styled.h2`
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
`

const FolderList = styled.div`
  min-height: 0;
  flex: 1;
  overflow-y: auto;
`

const FolderItem = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  gap: 16px;
  border: 0;
  border-bottom: 1px solid #e5e7eb;
  background: ${({ $active }) => ($active ? '#fffbf0' : 'transparent')};
  padding: 18px 24px;
  text-align: left;
  box-shadow: ${({ $active }) => ($active ? 'inset 0 0 0 1px #f5e9c8' : 'none')};
  transition: background-color 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? '#fffbf0' : '#fafafa')};
  }
`

const FolderIconWrap = styled.span`
  display: flex;
  width: 36px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  color: ${({ $active }) => ($active ? '#b45309' : '#6b7280')};
`

const FolderName = styled.span`
  min-width: 0;
  flex: 1;
  color: ${({ $active }) => ($active ? '#111827' : '#4b5563')};
  font-size: 15px;
  font-weight: ${({ $active }) => ($active ? 700 : 400)};
  line-height: 1.4;
`

const FolderCount = styled.span`
  flex-shrink: 0;
  border: 1px solid ${({ $active }) => ($active ? '#e8d48a' : 'transparent')};
  border-radius: 999px;
  background: ${({ $active }) => ($active ? '#fff4d6' : '#f3f4f6')};
  padding: 6px 10px;
  color: ${({ $active }) => ($active ? '#713f12' : '#4b5563')};
  font-size: 11px;
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  line-height: 1;
`

export default function FoldersPanel({ folders, selectedFolder, onSelectFolder }) {
  return (
    <Panel>
      <PanelHeader>
        <PanelTitle>Pastas</PanelTitle>
      </PanelHeader>

      <FolderList>
        {folders.map((folder) => {
          const Icon = folder.icon
          const isActive = selectedFolder === folder.id

          return (
            <FolderItem
              key={folder.id}
              type="button"
              $active={isActive}
              onClick={() => onSelectFolder(folder.id)}
            >
              <FolderIconWrap $active={isActive}>
                <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
              </FolderIconWrap>

              <FolderName $active={isActive}>{folder.name}</FolderName>
              <FolderCount $active={isActive}>{folder.count}</FolderCount>
            </FolderItem>
          )
        })}
      </FolderList>
    </Panel>
  )
}
