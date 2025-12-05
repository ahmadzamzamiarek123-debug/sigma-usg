'use client'

import { AreaChart as TremorAreaChart, Card } from '@tremor/react'

interface ChartDataPoint {
  name: string
  [key: string]: string | number
}

interface AreaChartProps {
  data: ChartDataPoint[]
  categories: string[]
  index: string
  title?: string
  colors?: string[]
  showLegend?: boolean
  showGridLines?: boolean
  className?: string
}

export function AreaChart({
  data,
  categories,
  index,
  title,
  colors = ['indigo', 'purple'],
  showLegend = true,
  showGridLines = true,
  className,
}: AreaChartProps) {
  return (
    <Card className={`bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      )}
      <TremorAreaChart
        data={data}
        index={index}
        categories={categories}
        colors={colors}
        showLegend={showLegend}
        showGridLines={showGridLines}
        className="h-72"
        curveType="monotone"
      />
    </Card>
  )
}
