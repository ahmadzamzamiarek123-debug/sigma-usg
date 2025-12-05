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
    <div className={cn(
      'bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 transition-colors',
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            {icon}
          </div>
        )}
      </div>
      
      {(trend || description) && (
        <div className="flex items-center gap-2">
          {trend && (
            <span className={cn(
              'text-sm font-medium flex items-center gap-1',
              trend.isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
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
            <span className="text-sm text-gray-500 dark:text-gray-400">{description}</span>
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
      'bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-lg shadow-indigo-500/30',
      className
    )}>
      <p className="text-white/80 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {subtitle && <p className="text-white/60 text-sm mt-2">{subtitle}</p>}
    </div>
  )
}
