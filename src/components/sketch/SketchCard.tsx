'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface SketchCardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'stats' | 'accent'
  noPushpin?: boolean
}

export function SketchCard({ 
  children, 
  className, 
  variant = 'default',
  noPushpin = false,
  ...props 
}: SketchCardProps) {
  const variants = {
    default: 'sketch-card',
    stats: 'sketch-stats-card',
    accent: 'sketch-card border-[var(--sketch-accent)]',
  }

  return (
    <div
      className={cn(
        variants[variant],
        noPushpin && 'before:content-none',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function SketchCardHeader({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div 
      className={cn(
        'pb-3 mb-3 border-b-2 border-dashed border-[var(--sketch-border-light)]',
        className
      )} 
      {...props}
    >
      {children}
    </div>
  )
}

export function SketchCardTitle({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 
      className={cn(
        'font-[var(--font-hand-bold)] text-lg font-bold text-[var(--sketch-text)]',
        className
      )} 
      style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
      {...props}
    >
      {children}
    </h3>
  )
}

export function SketchCardContent({ 
  children, 
  className, 
  ...props 
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('', className)} {...props}>
      {children}
    </div>
  )
}
