'use client'

import React, { useEffect } from 'react'

interface PasswordCheckerProps {
  password?: string
  confirmPassword?: string
  onValidate?: (isValid: boolean) => void
}

export function PasswordChecker({
  password = '',
  confirmPassword = '',
  onValidate,
}: PasswordCheckerProps) {
  const hasMinLength = password.length >= 6
  const hasLetter = /[a-zA-Z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const passwordsMatch = password.length > 0 && password === confirmPassword

  const isValid = hasMinLength && hasLetter && hasNumber && passwordsMatch

  useEffect(() => {
    if (onValidate) {
      onValidate(isValid)
    }
  }, [isValid, onValidate])

  if (password.length === 0) {
    return null
  }

  const renderCheckItem = (label: string, isPassed: boolean, showStatus: boolean) => {
    const color = showStatus
      ? (isPassed ? '#10b981' : '#ef4444')
      : 'var(--on-surface-variant, #7e7e7e)'

    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '13px',
          color: color,
          transition: 'color 0.2s ease',
          marginBottom: '6px',
        }}
      >
        {showStatus ? (
          isPassed ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flexShrink: 0 }}
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          )
        ) : (
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: 'var(--on-surface-variant, #7e7e7e)',
              marginLeft: '4px',
              marginRight: '4px',
              flexShrink: 0,
            }}
          />
        )}
        <span>{label}</span>
      </div>
    )
  }

  return (
    <div
      style={{
        marginTop: '12px',
        padding: '12px',
        backgroundColor: 'rgba(200, 24, 90, 0.02)',
        borderRadius: '8px',
        border: '1px solid rgba(200, 24, 90, 0.08)',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <div
        style={{
          fontWeight: 600,
          fontSize: '12px',
          marginBottom: '8px',
          color: 'var(--on-surface)',
        }}
      >
        Password Requirements:
      </div>
      {renderCheckItem('At least 6 characters', hasMinLength, true)}
      {renderCheckItem('At least one letter (a-z, A-Z)', hasLetter, true)}
      {renderCheckItem('At least one number (0-9)', hasNumber, true)}
      {renderCheckItem('Passwords match', passwordsMatch, confirmPassword.length > 0)}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
