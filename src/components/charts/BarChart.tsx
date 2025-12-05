'use client'

import { BarChart as TremorBarChart, Card } from '@tremor/react'

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
  colors = ['indigo', 'purple'],
  showLegend = true,
  layout = 'vertical',
  className,
}: BarChartProps) {
  return (
    <Card className={`bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
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
    </Card>
  )
}
