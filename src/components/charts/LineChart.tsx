'use client'

import { LineChart as TremorLineChart } from '@tremor/react'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

interface LineChartProps {
  data: ChartDataPoint[]
  categories: string[]
  index: string
  title?: string
  colors?: string[]
  showLegend?: boolean
  showGridLines?: boolean
  className?: string
}

export function LineChart({
  data,
  categories,
  index,
  title,
  colors = ['blue', 'amber', 'emerald', 'rose', 'cyan'],
  showLegend = true,
  showGridLines = true,
  className,
}: LineChartProps) {
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
      <TremorLineChart
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        showLegend={showLegend}
        showGridLines={showGridLines}
        className="h-72"
        curveType="monotone"
      />
    </div>
  )
}
