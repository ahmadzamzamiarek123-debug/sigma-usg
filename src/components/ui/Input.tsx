import { cn } from '@/lib/utils'
import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export function Input({
  label,
  error,
  icon,
  className,
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="input-label"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[var(--text-muted)]">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={cn(
            'input',
            icon && 'pl-10',
            error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  )
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export function Textarea({
  label,
  error,
  className,
  id,
  ...props
}: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={textareaId}
          className="input-label"
        >
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'input resize-y min-h-[80px]',
          error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  )
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  options: { value: string; label: string }[]
}

export function Select({
  label,
  error,
  options,
  className,
  id,
  ...props
}: SelectProps) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="space-y-1.5">
      {label && (
        <label
          htmlFor={selectId}
          className="input-label"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={cn(
          'input py-2.5',
          error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-sm text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  )
}
