'use client'

import { Share2 } from 'lucide-react'

export function CopyLinkButton({ url }: { url: string }) {
  const handleCopy = () => {
    navigator.clipboard.writeText(url)
    // Optional: could trigger a toast notification here if desired
    alert('Profile link copied to clipboard!')
  }

  return (
    <button 
      onClick={handleCopy}
      className="btn btn-secondary" 
      style={{ display: 'flex', gap: 'var(--spacing-8)', height: '36px', padding: '0 12px', fontSize: '14px' }}
    >
      <Share2 size={16} />
      <span>Copy Profile Link</span>
    </button>
  )
}
