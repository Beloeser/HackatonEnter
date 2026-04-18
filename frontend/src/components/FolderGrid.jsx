import styled from 'styled-components'
import FolderCard from './FolderCard'

const Grid = styled.div`
  display: grid;
  width: 100%;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
    gap: 12px;
  }
`

const EmptyState = styled.div`
  display: flex;
  min-height: 300px;
  align-items: center;
  justify-content: center;
  border: 2px dashed #e0e0e0;
  border-radius: 8px;
  background: #f5f5f5;
  color: #999999;
  font-size: 16px;
`

export default function FolderGrid({ folders, onFolderClick, onFolderDelete }) {
  if (folders.length === 0) {
    return (
      <EmptyState>
        <p>Nenhuma pasta encontrada</p>
      </EmptyState>
    )
  }

  return (
    <Grid>
      {folders.map((folder) => (
        <FolderCard
          key={folder.id}
          name={folder.name}
          itemCount={folder.itemCount}
          onClick={() => onFolderClick && onFolderClick(folder)}
          onDelete={() => onFolderDelete && onFolderDelete(folder.id)}
        />
      ))}
    </Grid>
  )
}
