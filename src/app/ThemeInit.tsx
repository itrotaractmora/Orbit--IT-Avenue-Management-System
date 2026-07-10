'use client'

import { useEffect } from 'react'

export function ThemeInit() {
  useEffect(() => {
    // Only run on client
    const theme = localStorage.getItem('theme')
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])
  return null
}
