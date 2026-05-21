'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { StatsCard, StatsCardGradient } from '@/components/charts/StatsCard'
import { formatRupiah, formatDate } from '@/lib/utils'

interface ProdiData {
  prodi: string
  totalBalance: number
  monthlyIncome: number
  monthlyExpense: number
  recentExpenses: {
    id: string
    amount: number
    description: string
    createdAt: string
  }[]
}

export default function SaldoProdiPage() {
  const { data: session } = useSession()
  const [data, setData] = useState<ProdiData | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch('/api/prodi/saldo')
        const result = await res.json()
        setData(result.data)
      } catch (error) {
        console.error('Error fetching prodi saldo:', error)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 w-full"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Saldo Prodi</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Transparansi keuangan prodi {data?.prodi}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatsCardGradient
          title="Total Saldo Prodi"
          value={formatRupiah(data?.totalBalance || 0)}
          subtitle="Saldo tersedia"
        />
        <StatsCard
          title="Pemasukan Bulan Ini"
          value={formatRupiah(data?.monthlyIncome || 0)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
            </svg>
          }
          trend={{ value: 0, isPositive: true }}
          description="dari pembayaran"
        />
        <StatsCard
          title="Pengeluaran Bulan Ini"
          value={formatRupiah(data?.monthlyExpense || 0)}
          icon={
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
            </svg>
          }
          description="kegiatan prodi"
        />
      </div>

      <Card className="border-[var(--border-primary)]">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Riwayat Pengeluaran Prodi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="bg-[var(--bg-tertiary)]">
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {data?.recentExpenses?.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Belum ada pengeluaran tercatat
                  </td>
                </tr>
              ) : (
                data?.recentExpenses?.map((expense) => (
                  <tr key={expense.id} className="hover:bg-[var(--bg-hover)]">
                    <td className="text-[var(--text-secondary)]">
                      {formatDate(expense.createdAt)}
                    </td>
                    <td className="text-[var(--text-primary)]">
                      {expense.description}
                    </td>
                    <td className="font-medium text-[var(--color-danger)]">
                      -{formatRupiah(expense.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="mt-6 p-4 bg-[var(--color-info-light)] rounded-xl border border-[var(--color-info)] opacity-90">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-[var(--color-info)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-[var(--text-primary)]">
            <p className="font-medium mb-1">Tentang Transparansi</p>
            <p className="text-[var(--text-secondary)]">
              Halaman ini menampilkan saldo dan pengeluaran prodi Anda untuk menjaga transparansi keuangan.
              Pemasukan berasal dari pembayaran tagihan, sementara pengeluaran dicatat oleh operator prodi.
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
