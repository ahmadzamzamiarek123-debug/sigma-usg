'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface SketchGraphWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  children: React.ReactNode
}

export function SketchGraphWrapper({ 
  title,
  children, 
  className, 
  ...props 
}: SketchGraphWrapperProps) {
  return (
    <div className={cn('sketch-chart-wrapper', className)} {...props}>
      {title && (
        <h3 
          className="sketch-chart-title"
          style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
        >
          ✏️ {title}
        </h3>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}
