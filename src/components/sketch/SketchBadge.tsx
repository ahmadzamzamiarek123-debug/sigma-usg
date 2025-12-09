'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface SketchBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'danger' | 'warning' | 'accent'
}

export function SketchBadge({ 
  children,
  variant = 'default',
  className, 
  ...props 
}: SketchBadgeProps) {
  const variants = {
    default: 'sketch-badge bg-gray-100 text-gray-700',
    success: 'sketch-badge sketch-badge-success',
    danger: 'sketch-badge sketch-badge-danger',
    warning: 'sketch-badge sketch-badge-warning',
    accent: 'sketch-badge sketch-badge-accent',
  }

  return (
    <span 
      className={cn(variants[variant], className)} 
      style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
      {...props}
    >
      {children}
    </span>
  )
}
