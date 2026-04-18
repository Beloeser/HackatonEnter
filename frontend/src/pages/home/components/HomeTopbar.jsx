import styled from 'styled-components'
import { LayoutGrid, LayoutList, Search, Sparkles } from 'lucide-react'

const Topbar = styled.header`
  grid-row: 1;
  grid-column: ${({ $chatOpen }) => ($chatOpen ? '2 / 5' : '2 / 4')};
  display: flex;
  min-height: 0;
  align-items: center;
  justify-content: space-between;
  gap: 40px;
  overflow: hidden;
  border-bottom: 1px solid #e5e7eb;
  background: #ffffff;
  padding: 0 32px;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
`

const SearchGroup = styled.div`
  display: flex;
  min-width: 0;
  flex: 1;
  align-items: center;
`

const SearchField = styled.div`
  position: relative;
  min-width: 0;
  flex: 1;
`

const SearchIcon = styled(Search)`
  pointer-events: none;
  position: absolute;
  top: 50%;
  left: 16px;
  color: #9ca3af;
  transform: translateY(-50%);
`

const SearchInput = styled.input`
  width: 100%;
  height: 48px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  padding: 13px 16px 13px 48px;
  color: #111827;
  font-size: 15px;
  line-height: 1.45;
  transition: box-shadow 0.2s ease, border-color 0.2s ease;

  &::placeholder {
    color: #9ca3af;
  }

  &:focus {
    outline: none;
    border-color: #ffb300;
    box-shadow: 0 0 0 2px rgba(255, 179, 0, 0.25);
  }
`

const Actions = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 24px;
`

const ViewSwitch = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f9fafb;
  padding: 6px;
`

const ViewButton = styled.button`
  display: flex;
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 8px;
  background: ${({ $active }) => ($active ? '#ffb300' : 'transparent')};
  color: ${({ $active }) => ($active ? '#111827' : '#6b7280')};
  box-shadow: ${({ $active }) => ($active ? '0 1px 2px rgba(15, 23, 42, 0.15)' : 'none')};
  transition: background-color 0.2s ease, color 0.2s ease;

  &:hover {
    background: ${({ $active }) => ($active ? '#ffb300' : '#ffffff')};
  }
`

const ChatToggle = styled.button`
  display: flex;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  gap: 10px;
  border: 0;
  border-radius: 10px;
  background: #ffb300;
  padding: 0 24px;
  color: #111827;
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.2);
  transition: background-color 0.2s ease;

  &:hover {
    background: #e6a200;
  }
`

export default function HomeTopbar({
  isChatOpen,
  viewMode,
  onViewModeChange,
  onToggleChat,
  searchQuery,
  onSearchQueryChange,
}) {
  return (
    <Topbar $chatOpen={isChatOpen}>
      <SearchGroup>
        <SearchField>
          <SearchIcon size={18} strokeWidth={2} />
          <SearchInput
            type="text"
            placeholder="Pesquisar processos, documentos..."
            value={searchQuery}
            onChange={(event) => onSearchQueryChange(event.target.value)}
          />
        </SearchField>
      </SearchGroup>

      <Actions>
        <ViewSwitch>
          <ViewButton
            type="button"
            $active={viewMode === 'card'}
            onClick={() => onViewModeChange('card')}
            aria-label="Card"
          >
            <LayoutList size={18} strokeWidth={2} />
          </ViewButton>

          <ViewButton
            type="button"
            $active={viewMode === 'grid'}
            onClick={() => onViewModeChange('grid')}
            aria-label="Grade"
          >
            <LayoutGrid size={18} strokeWidth={2} />
          </ViewButton>
        </ViewSwitch>

        <ChatToggle type="button" onClick={onToggleChat}>
          <Sparkles size={18} strokeWidth={2} />
          IA Chat
        </ChatToggle>
      </Actions>
    </Topbar>
  )
}
