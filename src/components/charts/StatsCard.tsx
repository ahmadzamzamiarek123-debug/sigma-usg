'use client'

import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: number
    isPositive: boolean
  }
  description?: string
  className?: string
}

export function StatsCard({ title, value, icon, trend, description, className }: StatsCardProps) {
  return (
    <div className={cn('stats-card', className)}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="stats-card-label">{title}</p>
          <p className="stats-card-value mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-[var(--color-accent-bg)] flex items-center justify-center text-[var(--usg-accent-hover)]">
            {icon}
          </div>
        )}
      </div>
      
      {(trend || description) && (
        <div className="flex items-center gap-2 mt-4">
          {trend && (
            <span className={cn(
              'text-sm font-medium flex items-center gap-1',
              trend.isPositive ? 'text-[var(--color-success)]' : 'text-[var(--color-danger)]'
            )}>
              {trend.isPositive ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                </svg>
              )}
              {trend.value}%
            </span>
          )}
          {description && (
            <span className="text-sm text-[var(--text-muted)]">{description}</span>
          )}
        </div>
      )}
    </div>
  )
}

interface StatsCardGradientProps {
  title: string
  value: string | number
  subtitle?: string
  className?: string
}

export function StatsCardGradient({ title, value, subtitle, className }: StatsCardGradientProps) {
  return (
    <div className={cn(
      'bg-gradient-to-br from-[var(--usg-primary)] to-[var(--usg-primary-light)] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden',
      className
    )}>
      {/* Background Accent */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-white opacity-10 rounded-full blur-2xl"></div>
      
      <p className="text-white/80 text-sm relative z-10">{title}</p>
      <p className="text-3xl font-bold mt-1 relative z-10">{value}</p>
      {subtitle && <p className="text-white/60 text-sm mt-2 relative z-10">{subtitle}</p>}
    </div>
  )
}
