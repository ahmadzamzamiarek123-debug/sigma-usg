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

  // Bar chart for current saldo per prodi
  if (type === 'bar' && saldoData.length > 0) {
    return (
      <div className="w-full bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={saldoData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ChartColors.chartGrid} />
              <XAxis 
                dataKey="prodi" 
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
      <div className="w-full bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
        <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h3>
        <div className="w-full h-64 sm:h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={ChartColors.chartGrid} />
              <XAxis 
                dataKey="month" 
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
                  name,
                ]}
              />
              <Legend
                wrapperStyle={{ paddingTop: '16px', fontSize: '11px' }}
                formatter={(value) => (
                  <span className="text-gray-300 text-xs sm:text-sm">{value}</span>
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
    <div className="w-full bg-gray-900 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-xl overflow-hidden">
      <h3 className="text-base sm:text-lg font-semibold text-white mb-4">{title}</h3>
      <div className="h-48 sm:h-64 flex items-center justify-center text-gray-400">
        Tidak ada data tersedia
      </div>
    </div>
  )
}
