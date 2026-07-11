'use client'

import { useActionState, useEffect, useRef } from 'react'

interface SettingsFormProps {
  action: (prevState: any, formData: FormData) => Promise<any>
  submitLabel: string
  requireConfirmation?: string
  children: React.ReactNode
  disabled?: boolean
}

export function SettingsForm({ action, submitLabel, requireConfirmation, children, disabled = false }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(action, null)
  const formRef = useRef<HTMLFormElement>(null)

  useEffect(() => {
    if (state?.success && formRef.current) {
      // Clear password fields on success
      const passwordInputs = formRef.current.querySelectorAll('input[type="password"], input[name="password"], input[name="confirmPassword"]')
      passwordInputs.forEach((input: any) => {
        input.value = ''
      })
    }
  }, [state])

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (requireConfirmation && !window.confirm(requireConfirmation)) {
      e.preventDefault()
    }
  }

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-16)' }}>
      {children}
      
      {state?.error && (
        <div style={{ color: 'var(--danger)', fontSize: '13px', backgroundColor: 'var(--danger-bg)', padding: '8px 12px', borderRadius: '4px' }}>
          {state.error}
        </div>
      )}
      
      {state?.success && (
        <div style={{ color: '#15803d', fontSize: '13px', backgroundColor: '#dcfce7', padding: '8px 12px', borderRadius: '4px' }}>
          {state.success}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-8)' }}>
        <button type="submit" className="btn btn-primary" disabled={isPending || disabled}>
          {isPending ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  )
}
