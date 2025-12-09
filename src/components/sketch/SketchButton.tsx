'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface SketchButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
}

export function SketchButton({ 
  children, 
  className, 
  variant = 'default',
  size = 'md',
  isLoading = false,
  disabled,
  ...props 
}: SketchButtonProps) {
  const variants = {
    default: 'sketch-btn',
    primary: 'sketch-btn sketch-btn-primary',
    danger: 'sketch-btn sketch-btn-danger',
    success: 'sketch-btn sketch-btn-success',
    outline: 'sketch-btn sketch-btn-outline',
  }

  const sizes = {
    sm: 'text-sm py-1.5 px-3',
    md: 'text-base py-2 px-4',
    lg: 'text-lg py-2.5 px-6',
  }

  return (
    <button
      className={cn(
        variants[variant],
        sizes[size],
        (disabled || isLoading) && 'opacity-60 cursor-not-allowed',
        className
      )}
      disabled={disabled || isLoading}
      style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  )
}
