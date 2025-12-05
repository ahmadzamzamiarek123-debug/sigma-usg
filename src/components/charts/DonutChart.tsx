'use client'

import { DonutChart as TremorDonutChart, Card, Legend } from '@tremor/react'

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
  colors = ['indigo', 'purple', 'pink', 'emerald', 'amber'],
  showLabel = true,
  showAnimation = true,
  className,
}: DonutChartProps) {
  return (
    <Card className={`bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
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
    </Card>
  )
}
