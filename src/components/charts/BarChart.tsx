'use client'

import { BarChart as TremorBarChart } from '@tremor/react'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

interface BarChartProps {
  data: ChartDataPoint[]
  categories: string[]
  index: string
  title?: string
  colors?: string[]
  showLegend?: boolean
  layout?: 'vertical' | 'horizontal'
  className?: string
}

export function BarChart({
  data,
  categories,
  index,
  title,
  colors = ['blue', 'amber', 'emerald', 'rose', 'cyan'],
  showLegend = true,
  layout = 'vertical',
  className,
}: BarChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className={cn("chart-container flex items-center justify-center h-72", className)}>
        <p className="text-[var(--text-muted)]">Tidak ada data tersedia</p>
      </div>
    )
  }

  return (
    <div className={cn("chart-container", className)}>
      {title && (
        <h3 className="chart-title">{title}</h3>
      )}
      <TremorBarChart
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        showLegend={showLegend}
        layout={layout}
        className="h-72"
      />
    </div>
  )
}
