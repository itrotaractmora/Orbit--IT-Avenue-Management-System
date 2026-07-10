'use client'

import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export function MobileNavToggle() {
  const [isOpen, setIsOpen] = useState(false)

  // We need to interact with the DOM elements outside this component
  useEffect(() => {
    const sidebar = document.querySelector('.sidebar')
    const overlay = document.querySelector('.mobile-overlay')
    
    if (!sidebar || !overlay) return
    
    if (isOpen) {
      sidebar.classList.add('open')
      overlay.classList.add('open')
      document.body.style.overflow = 'hidden' // Prevent background scrolling
    } else {
      sidebar.classList.remove('open')
      overlay.classList.remove('open')
      document.body.style.overflow = ''
    }
    
    const handleOverlayClick = () => setIsOpen(false)
    overlay.addEventListener('click', handleOverlayClick)
    
    return () => {
      overlay.removeEventListener('click', handleOverlayClick)
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close sidebar on route change
  useEffect(() => {
    const handleRouteChange = () => setIsOpen(false)
    window.addEventListener('popstate', handleRouteChange)
    
    // Also hack to close on click of any nav link
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest('.nav-link')) {
        setIsOpen(false)
      }
    }
    document.addEventListener('click', handleLinkClick)
    
    return () => {
      window.removeEventListener('popstate', handleRouteChange)
      document.removeEventListener('click', handleLinkClick)
    }
  }, [])

  return (
    <button 
      className="mobile-nav-toggle" 
      onClick={() => setIsOpen(!isOpen)}
      aria-label="Toggle navigation menu"
    >
      {isOpen ? <X size={24} /> : <Menu size={24} />}
    </button>
  )
}
