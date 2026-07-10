'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'

export function Toast() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [message, setMessage] = useState<string | null>(null)
  const [isHiding, setIsHiding] = useState(false)

  useEffect(() => {
    const toastMsg = searchParams.get('toast')
    if (toastMsg) {
      setMessage(toastMsg)
      setIsHiding(false)
      
      // Remove the query param without refreshing the page
      const newSearchParams = new URLSearchParams(searchParams.toString())
      newSearchParams.delete('toast')
      const newUrl = `${pathname}${newSearchParams.toString() ? `?${newSearchParams.toString()}` : ''}`
      router.replace(newUrl, { scroll: false })

      // Auto dismiss after 3 seconds
      const hideTimer = setTimeout(() => {
        setIsHiding(true)
        setTimeout(() => {
          setMessage(null)
          setIsHiding(false)
        }, 300) // matches fadeOut duration
      }, 3000)
      
      return () => clearTimeout(hideTimer)
    }
  }, [searchParams, pathname, router])

  if (!message) return null

  return (
    <div className="toast-container">
      <div className={`toast ${isHiding ? 'hiding' : ''}`}>
        <CheckCircle2 size={18} style={{ color: 'var(--success)' }} />
        <span style={{ fontSize: '14px', fontWeight: 500 }}>{message}</span>
      </div>
    </div>
  )
}
