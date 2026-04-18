import { useState } from 'react'
import styled from 'styled-components'
import FolderGrid from '../components/FolderGrid'

const Page = styled.section`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const Header = styled.header`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`

const Title = styled.h1`
  margin: 0;
  color: #333333;
  font-size: 28px;
  font-weight: 700;

  @media (max-width: 768px) {
    font-size: 24px;
  }

  @media (max-width: 480px) {
    font-size: 20px;
  }
`

const CreateFolderButton = styled.button`
  border: 0;
  border-radius: 6px;
  background: #6f4e37;
  padding: 12px 16px;
  color: #ffffff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease, background-color 0.15s ease;
  white-space: nowrap;

  &:hover {
    background: #5d3e2d;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 768px) {
    width: 100%;
  }

  @media (max-width: 480px) {
    padding: 12px;
    font-size: 13px;
  }
`

export default function FoldersPage() {
  const [folders, setFolders] = useState([
    { id: 1, name: 'Projeto React', itemCount: 12 },
    { id: 2, name: 'Dados ML', itemCount: 45 },
    { id: 3, name: 'Analises', itemCount: 8 },
    { id: 4, name: 'Backup', itemCount: 23 },
  ])

  const handleFolderClick = (folder) => {
    console.log('Pasta clicada:', folder)
  }

  const handleFolderDelete = (folderId) => {
    setFolders(folders.filter((folder) => folder.id !== folderId))
  }

  return (
    <Page>
      <Header>
        <Title>Minhas Pastas</Title>
        <CreateFolderButton type="button">+ Nova Pasta</CreateFolderButton>
      </Header>

      <FolderGrid
        folders={folders}
        onFolderClick={handleFolderClick}
        onFolderDelete={handleFolderDelete}
      />
    </Page>
  )
}
