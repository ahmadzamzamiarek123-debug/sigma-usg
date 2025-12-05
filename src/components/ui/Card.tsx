import { cn } from '@/lib/utils'
import React from 'react'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'gradient' | 'glass'
}

export function Card({ children, className, variant = 'default', ...props }: CardProps) {
  const variants = {
    default: 'bg-white border border-gray-200',
    gradient: 'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white',
    glass: 'bg-white/80 backdrop-blur-lg border border-white/20',
  }

  return (
    <div
      className={cn(
        'w-full rounded-xl sm:rounded-2xl shadow-lg transition-all duration-300 hover:shadow-xl overflow-hidden',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('text-base sm:text-lg font-semibold text-gray-900', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardContent({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 sm:py-4', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ children, className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-4 py-3 sm:px-6 sm:py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-xl sm:rounded-b-2xl', className)} {...props}>
      {children}
    </div>
  )
}
