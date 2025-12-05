'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { ChartColors, TransactionTypeLabels } from '@/lib/colors'

interface FinanceDataPoint {
  date: string
  topup: number
  payment: number
  transfer_out: number
  transfer_in: number
}

interface UserFinanceChartProps {
  data: FinanceDataPoint[]
  title?: string
}

export function UserFinanceChart({ data, title = "Statistik Keuangan" }: UserFinanceChartProps) {
  const formatRupiah = (value: number) => {
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}jt`
    if (value >= 1000) return `${(value / 1000).toFixed(0)}rb`
    return value.toString()
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400">
          Belum ada data transaksi
        </div>
      </div>
    )
  }

  return (
    <div className="w-full bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="w-full h-64 sm:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={ChartColors.chartGrid} />
            <XAxis 
              dataKey="date" 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickMargin={8}
            />
            <YAxis 
              stroke="#9CA3AF"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickFormatter={formatRupiah}
              width={45}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1F2937',
                border: 'none',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#F9FAFB', fontWeight: 'bold' }}
              formatter={(value: number, name: string) => [
                `Rp ${value.toLocaleString('id-ID')}`,
                TransactionTypeLabels[name.toUpperCase()] || name,
              ]}
            />
            <Legend
              wrapperStyle={{ paddingTop: '16px', fontSize: '11px' }}
              formatter={(value) => (
                <span className="text-gray-300 text-xs sm:text-sm">
                  {TransactionTypeLabels[value.toUpperCase()] || value}
                </span>
              )}
            />
            <Line
              type="monotone"
              dataKey="topup"
              name="TOPUP"
              stroke={ChartColors.topup}
              strokeWidth={2}
              dot={{ fill: ChartColors.topup, strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="payment"
              name="PAYMENT"
              stroke={ChartColors.payment}
              strokeWidth={2}
              dot={{ fill: ChartColors.payment, strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="transfer_out"
              name="TRANSFER_OUT"
              stroke={ChartColors.transfer_out}
              strokeWidth={2}
              dot={{ fill: ChartColors.transfer_out, strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="transfer_in"
              name="TRANSFER_IN"
              stroke={ChartColors.transfer_in}
              strokeWidth={2}
              dot={{ fill: ChartColors.transfer_in, strokeWidth: 1, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
