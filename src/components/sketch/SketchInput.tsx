'use client'

import { cn } from '@/lib/utils'
import React from 'react'

interface SketchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function SketchInput({ 
  label,
  error,
  className, 
  id,
  ...props 
}: SketchInputProps) {
  const inputId = id || `sketch-input-${Math.random().toString(36).slice(2)}`

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={inputId}
          className="sketch-label"
          style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={cn(
          'sketch-input',
          error && 'border-[var(--sketch-danger)]',
          className
        )}
        style={{ fontFamily: "'Patrick Hand', 'Comic Neue', cursive" }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--sketch-danger)]" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          {error}
        </p>
      )}
    </div>
  )
}

interface SketchSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function SketchSelect({ 
  label,
  options,
  className, 
  id,
  ...props 
}: SketchSelectProps) {
  const selectId = id || `sketch-select-${Math.random().toString(36).slice(2)}`

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={selectId}
          className="sketch-label"
          style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'sketch-input cursor-pointer',
          className
        )}
        style={{ fontFamily: "'Patrick Hand', 'Comic Neue', cursive" }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

interface SketchTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function SketchTextarea({ 
  label,
  error,
  className, 
  id,
  ...props 
}: SketchTextareaProps) {
  const textareaId = id || `sketch-textarea-${Math.random().toString(36).slice(2)}`

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId}
          className="sketch-label"
          style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'sketch-input min-h-[100px] resize-y',
          error && 'border-[var(--sketch-danger)]',
          className
        )}
        style={{ fontFamily: "'Patrick Hand', 'Comic Neue', cursive" }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-[var(--sketch-danger)]" style={{ fontFamily: "'Patrick Hand', cursive" }}>
          {error}
        </p>
      )}
    </div>
  )
}
