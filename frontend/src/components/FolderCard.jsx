import styled from 'styled-components'
import { Folder, Trash2 } from 'lucide-react'

const Card = styled.article`
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #ffffff;
  padding: 16px;
  cursor: pointer;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: #a0826d;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  }
`

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 12px;
`

const IconWrapper = styled.div`
  color: #6f4e37;
`

const DeleteButton = styled.button`
  display: flex;
  width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 4px;
  background: transparent;
  color: #999999;
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;

  &:hover {
    background: #f0f0f0;
    color: #e74c3c;
  }
`

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Name = styled.h3`
  margin: 0;
  color: #333333;
  font-size: 16px;
  font-weight: 600;
  word-break: break-word;
`

const Info = styled.p`
  margin: 0;
  color: #999999;
  font-size: 13px;
`

export default function FolderCard({ name, itemCount, onClick, onDelete }) {
  return (
    <Card onClick={onClick}>
      <Header>
        <IconWrapper>
          <Folder size={30} strokeWidth={2} />
        </IconWrapper>

        <DeleteButton
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onDelete && onDelete()
          }}
          title="Deletar pasta"
          aria-label="Deletar pasta"
        >
          <Trash2 size={16} strokeWidth={1.9} />
        </DeleteButton>
      </Header>

      <Content>
        <Name>{name}</Name>
        <Info>{itemCount} itens</Info>
      </Content>
    </Card>
  )
}
