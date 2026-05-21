'use client'

import { DonutChart as TremorDonutChart, Legend } from '@tremor/react'
import { cn } from '@/lib/utils'

interface ChartDataPoint {
  name: string
  value: number
}

interface DonutChartProps {
  data: ChartDataPoint[]
  title?: string
  colors?: string[]
  showLabel?: boolean
  showAnimation?: boolean
  className?: string
}

export function DonutChart({
  data,
  title,
  colors = ['blue', 'amber', 'emerald', 'rose', 'cyan'],
  showLabel = true,
  showAnimation = true,
  className,
}: DonutChartProps) {
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
      <div className="flex items-center justify-center">
        <TremorDonutChart
          data={data}
          category="value"
          index="name"
          colors={colors}
          showLabel={showLabel}
          showAnimation={showAnimation}
          className="h-52"
        />
      </div>
      <Legend
        categories={data.map(d => d.name)}
        colors={colors}
        className="mt-4 justify-center"
      />
    </div>
  )
}
