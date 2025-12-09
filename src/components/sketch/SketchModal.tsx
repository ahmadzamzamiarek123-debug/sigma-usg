'use client'

import { cn } from '@/lib/utils'
import React, { useEffect } from 'react'
import { SketchButton } from './SketchButton'

interface SketchModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function SketchModal({ 
  isOpen,
  onClose,
  title,
  children, 
  className 
}: SketchModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div 
        className="absolute inset-0 sketch-modal-overlay"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          'sketch-modal relative w-full max-w-md max-h-[90vh] overflow-auto',
          className
        )}
      >
        {/* Header */}
        <div className="sketch-modal-header flex items-center justify-between">
          <h2 className="sketch-modal-title" style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}>
            📋 {title}
          </h2>
          <button
            onClick={onClose}
            className="text-2xl text-[var(--sketch-text-muted)] hover:text-[var(--sketch-text)] transition-colors"
            style={{ fontFamily: "'Patrick Hand', cursive" }}
          >
            ✕
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 sm:p-6" style={{ fontFamily: "'Patrick Hand', 'Comic Neue', cursive" }}>
          {children}
        </div>
      </div>
    </div>
  )
}
