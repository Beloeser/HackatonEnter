import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'
import { Home, User, Shield } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'admin', label: 'Admin', icon: Shield },
]

const Sidebar = styled.aside`
  grid-column: 1;
  grid-row: 1 / -1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 0;
  width: 100%;
  padding: 36px 0;
  background: #0b0b0b;
`

const ProfileButton = styled.button`
  display: flex;
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 999px;
  background: #ffb300;
  color: #111827;
  box-shadow: 0 2px 14px rgba(255, 179, 0, 0.38);
  transition: filter 0.2s ease;

  &:hover {
    filter: brightness(1.05);
  }
`

const Nav = styled.nav`
  display: flex;
  width: 100%;
  min-height: 0;
  flex: 1;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 36px;
`

const NavButton = styled.button`
  position: relative;
  display: flex;
  width: 100%;
  height: 44px;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: ${({ $active }) => ($active ? '#ffb300' : '#a1a1aa')};
  transition: color 0.2s ease, background-color 0.2s ease;

  &::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    width: 3px;
    height: 32px;
    border-radius: 0 2px 2px 0;
    background: #ffb300;
    opacity: ${({ $active }) => ($active ? 1 : 0)};
    transform: translateY(-50%);
    transition: opacity 0.2s ease;
  }

  &:hover {
    color: ${({ $active }) => ($active ? '#ffb300' : '#f4f4f5')};
    background: ${({ $active }) => ($active ? 'transparent' : 'rgba(255, 255, 255, 0.06)')};
  }
`

export default function HomeSidebar({ activeItem, onSelectItem }) {
  const navigate = useNavigate()

  const userStr = localStorage.getItem('user')
  const user = userStr ? JSON.parse(userStr) : null
  const isAdmin = user?.role === 'admin'

  const handleItemClick = (itemId) => {
    if (itemId === 'admin') {
      navigate('/admin/dashboard')
      return
    }

    navigate('/dashboard')
    onSelectItem(itemId)
  }

  return (
    <Sidebar>
      <ProfileButton type="button" aria-label="Perfil">
        <User size={20} strokeWidth={2} />
      </ProfileButton>

      <Nav aria-label="Navegacao principal">
        {NAV_ITEMS.map((item) => {
          if (item.id === 'admin' && !isAdmin) return null

          const Icon = item.icon
          const isActive = activeItem === item.id

          return (
            <NavButton
              key={item.id}
              type="button"
              $active={isActive}
              onClick={() => handleItemClick(item.id)}
              aria-label={item.label}
              aria-current={isActive ? 'true' : undefined}
            >
              <Icon size={20} strokeWidth={isActive ? 2 : 1.75} />
            </NavButton>
          )
        })}
      </Nav>
    </Sidebar>
  )
}
