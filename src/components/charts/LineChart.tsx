'use client'

import { LineChart as TremorLineChart, Card } from '@tremor/react'

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
  colors = ['indigo', 'purple'],
  showLegend = true,
  showGridLines = true,
  className,
}: LineChartProps) {
  return (
    <Card className={`bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
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
    </Card>
  )
}
