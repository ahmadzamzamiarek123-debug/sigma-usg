'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { ChartColors, getProdiColor } from '@/lib/colors'

interface ProdiSaldoData {
  prodi: string
  balance: number
}

interface AdminProdiChartProps {
  saldoData?: ProdiSaldoData[]
  historyData?: Record<string, string | number>[]
  prodiList?: string[]
  type?: 'bar' | 'line'
  title?: string
}

export function AdminProdiChart({ 
  saldoData = [], 
  historyData = [],
  prodiList = [],
  type = 'bar',
  title = "Saldo per Prodi"
}: AdminProdiChartProps) {
  const formatRupiah = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`
    return value.toString()
  }

  // Common styling to adapt to light/dark themes
  const chartStyle = {
    textColor: 'var(--text-secondary)',
    tooltipBg: 'var(--bg-primary)',
    tooltipColor: 'var(--text-primary)',
    tooltipBorder: '1px solid var(--border-primary)',
  }

  // Bar chart for current saldo per prodi
  if (type === 'bar' && saldoData.length > 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={saldoData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ChartColors.chartGrid} />
              <XAxis 
                dataKey="prodi" 
                stroke={chartStyle.textColor}
                tick={{ fill: chartStyle.textColor, fontSize: 10 }}
                tickMargin={8}
              />
              <YAxis 
                stroke={chartStyle.textColor}
                tick={{ fill: chartStyle.textColor, fontSize: 10 }}
                tickFormatter={formatRupiah}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartStyle.tooltipBg,
                  border: chartStyle.tooltipBorder,
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: chartStyle.tooltipColor, fontWeight: 'bold' }}
                formatter={(value: number) => [`Rp ${value.toLocaleString('id-ID')}`, 'Saldo']}
              />
              <Bar dataKey="balance" radius={[6, 6, 0, 0]}>
                {saldoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getProdiColor(entry.prodi)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // Line chart for historical data
  if (type === 'line' && historyData.length > 0) {
    return (
      <div className="chart-container">
        <h3 className="chart-title">{title}</h3>
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ChartColors.chartGrid} />
              <XAxis 
                dataKey="month" 
                stroke={chartStyle.textColor}
                tick={{ fill: chartStyle.textColor, fontSize: 10 }}
                tickMargin={8}
              />
              <YAxis 
                stroke={chartStyle.textColor}
                tick={{ fill: chartStyle.textColor, fontSize: 10 }}
                tickFormatter={formatRupiah}
                width={45}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: chartStyle.tooltipBg,
                  border: chartStyle.tooltipBorder,
                  borderRadius: '12px',
                  boxShadow: 'var(--shadow-md)',
                  fontSize: '12px',
                }}
                labelStyle={{ color: chartStyle.tooltipColor, fontWeight: 'bold' }}
                formatter={(value: number, name: string) => [
                  `Rp ${value.toLocaleString('id-ID')}`,
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '11px' }}
                formatter={(value) => (
                  <span className="text-[var(--text-secondary)] text-xs sm:text-sm">{value}</span>
                )}
              />
              {prodiList.map((prodi) => (
                <Line
                  key={prodi}
                  type="monotone"
                  dataKey={prodi}
                  stroke={getProdiColor(prodi)}
                  strokeWidth={2}
                  dot={{ fill: getProdiColor(prodi), strokeWidth: 1, r: 3 }}
                  activeDot={{ r: 5 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-container">
      <h3 className="chart-title">{title}</h3>
      <div className="h-48 sm:h-64 flex items-center justify-center text-[var(--text-muted)]">
        Tidak ada data tersedia
      </div>
    </div>
  )
}
