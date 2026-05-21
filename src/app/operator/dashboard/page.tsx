'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { StatsCard, StatsCardGradient } from '@/components/charts/StatsCard'
import { BarChart } from '@/components/charts/BarChart'
import { DonutChart } from '@/components/charts/DonutChart'
import { formatRupiah } from '@/lib/utils'
import Link from 'next/link'

interface ChartData {
  monthlyData: { name: string; Kas: number; Acara: number; Seminar: number }[]
  jenisBreakdown: { name: string; value: number }[]
  totalPaid: number
  totalTagihan: number
  prodiSaldo: number
}

export default function OperatorDashboard() {
  const { data: session } = useSession()
  const [chartData, setChartData] = useState<ChartData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/charts/operator')
        const data = await res.json()
        if (data.success) {
          setChartData(data.data)
        } else {
          setError(data.error || 'Gagal memuat data')
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        setError('Terjadi kesalahan')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="skeleton h-8 w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="skeleton h-32 w-full"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const totalIncome = chartData?.jenisBreakdown?.reduce((sum, j) => sum + j.value, 0) || 0

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">
          Dashboard Operator
        </h1>
        <p className="text-[var(--text-secondary)] mt-1">
          {session?.user?.name} • Prodi {session?.user?.prodi}
        </p>
      </div>

      {error && (
        <div className="alert-danger mb-6">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatsCardGradient
          title="Total Pemasukan"
          value={formatRupiah(totalIncome)}
          subtitle="Bulan ini"
        />
        <StatsCard
          title="Tagihan Aktif"
          value={chartData?.totalTagihan || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          description="Total dibuat"
        />
        <StatsCard
          title="Pembayaran"
          value={chartData?.totalPaid || 0}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          description="Sudah bayar"
        />
        <StatsCard
          title="Saldo Prodi"
          value={formatRupiah(chartData?.prodiSaldo || 0)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          description="Tersedia"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          {chartData?.monthlyData && (
            <BarChart
              data={chartData.monthlyData}
              categories={['Kas', 'Acara', 'Seminar']}
              index="name"
              title="Pemasukan per Jenis (6 Bulan)"
              colors={['blue', 'purple', 'emerald']}
            />
          )}
        </div>
        <div>
          {chartData?.jenisBreakdown && chartData.jenisBreakdown.length > 0 && (
            <DonutChart
              data={chartData.jenisBreakdown}
              title="Distribusi Pemasukan"
              colors={['blue', 'purple', 'emerald', 'amber']}
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link href="/operator/tagihan">
          <Card className="hover:shadow-xl transition-all cursor-pointer group">
            <CardContent className="py-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--color-info-light)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-[var(--color-info)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Kelola Tagihan</h3>
                <p className="text-sm text-[var(--text-secondary)]">Buat dan kelola tagihan</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/operator/pengeluaran">
          <Card className="hover:shadow-xl transition-all cursor-pointer group">
            <CardContent className="py-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--color-danger-light)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-[var(--color-danger)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Pengeluaran</h3>
                <p className="text-sm text-[var(--text-secondary)]">Catat pengeluaran prodi</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/operator/laporan">
          <Card className="hover:shadow-xl transition-all cursor-pointer group">
            <CardContent className="py-8 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">Lihat Laporan</h3>
                <p className="text-sm text-[var(--text-secondary)]">Laporan pemasukan</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </DashboardLayout>
  )
}
