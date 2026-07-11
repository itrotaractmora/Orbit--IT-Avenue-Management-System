'use client'

import React, { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ className = '', style, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false)

    const toggleVisibility = (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      setShowPassword((prev) => !prev)
    }

    return (
      <div className="password-input-wrapper">
        <input
          {...props}
          ref={ref}
          type={showPassword ? 'text' : 'password'}
          className={`form-input ${className}`.trim()}
          style={style}
        />
        <button
          type="button"
          onClick={toggleVisibility}
          className="password-toggle-btn"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'
