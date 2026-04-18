import { useState, useEffect } from 'react'

export const useResponsive = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480)
  const [isTablet, setIsTablet] = useState(window.innerWidth <= 768)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth
      setIsMobile(width <= 480)
      setIsTablet(width <= 768)
      
      if (width > 480) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  const closeSidebar = () => {
    setSidebarOpen(false)
  }

  return {
    isMobile,
    isTablet,
    sidebarOpen,
    toggleSidebar,
    closeSidebar
  }
}
