'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { SketchLayout, SketchCard, SketchCardContent, SketchButton, SketchGraphWrapper } from '@/components/sketch'
import { formatRupiah } from '@/lib/utils'
import Link from 'next/link'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface FinanceData {
  chartData: Array<{
    date: string
    topup: number
    payment: number
    transfer_out: number
    transfer_in: number
  }>
  totals: {
    topup: number
    payment: number
    transfer_out: number
    transfer_in: number
  }
}

interface ProdiSaldo {
  currentBalance: number
  monthlyIncome: number
  monthlyExpense: number
}

export default function UserDashboard() {
  const { data: session } = useSession()
  const [balance, setBalance] = useState(0)
  const [financeData, setFinanceData] = useState<FinanceData | null>(null)
  const [prodiSaldo, setProdiSaldo] = useState<ProdiSaldo | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [balanceRes, financeRes, prodiRes] = await Promise.all([
          fetch('/api/user/balance'),
          fetch('/api/user/finance-summary?period=month'),
          session?.user?.prodi 
            ? fetch(`/api/public/prodi-saldo?prodi=${session.user.prodi}`)
            : Promise.resolve(null),
        ])

        const balanceData = await balanceRes.json()
        const financeRaw = await financeRes.json()

        setBalance(balanceData.data?.balance || 0)
        if (financeRaw.success) setFinanceData(financeRaw.data)

        if (prodiRes) {
          const prodiData = await prodiRes.json()
          if (prodiData.success) setProdiSaldo(prodiData.data)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (session?.user) fetchData()
  }, [session])

  if (isLoading) {
    return (
      <SketchLayout>
        <div className="space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 bg-gray-200 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </SketchLayout>
    )
  }

  return (
    <SketchLayout>
      {/* Header */}
      <div className="mb-6">
        <h1 
          className="text-xl sm:text-2xl font-bold text-[var(--sketch-text)]"
          style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
        >
          👋 Halo, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-[var(--sketch-text-muted)] text-sm mt-1">
          📚 {session?.user?.prodi} • Dashboard Mahasiswa
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {/* Saldo */}
        <SketchCard variant="stats" className="col-span-2 sm:col-span-1">
          <SketchCardContent>
            <p className="text-sm text-[var(--sketch-text-muted)]">💰 Saldo Anda</p>
            <p 
              className="text-xl sm:text-2xl font-bold text-[var(--sketch-accent)] mt-1"
              style={{ fontFamily: "'Comic Neue', cursive" }}
            >
              {formatRupiah(balance)}
            </p>
          </SketchCardContent>
        </SketchCard>

        {/* Top-up */}
        <SketchCard variant="stats">
          <SketchCardContent>
            <p className="text-sm text-[var(--sketch-text-muted)]">📥 Top-up</p>
            <p 
              className="text-lg sm:text-xl font-bold text-[var(--sketch-success)] mt-1"
              style={{ fontFamily: "'Comic Neue', cursive" }}
            >
              {formatRupiah(financeData?.totals.topup || 0)}
            </p>
          </SketchCardContent>
        </SketchCard>

        {/* Pembayaran */}
        <SketchCard variant="stats">
          <SketchCardContent>
            <p className="text-sm text-[var(--sketch-text-muted)]">📤 Bayar</p>
            <p 
              className="text-lg sm:text-xl font-bold text-[var(--sketch-danger)] mt-1"
              style={{ fontFamily: "'Comic Neue', cursive" }}
            >
              {formatRupiah(financeData?.totals.payment || 0)}
            </p>
          </SketchCardContent>
        </SketchCard>

        {/* Saldo Prodi */}
        {prodiSaldo && (
          <SketchCard variant="stats">
            <SketchCardContent>
              <p className="text-sm text-[var(--sketch-text-muted)]">🏛️ Prodi</p>
              <p 
                className="text-lg sm:text-xl font-bold text-[var(--sketch-text)] mt-1"
                style={{ fontFamily: "'Comic Neue', cursive" }}
              >
                {formatRupiah(prodiSaldo.currentBalance)}
              </p>
            </SketchCardContent>
          </SketchCard>
        )}
      </div>

      {/* Chart */}
      {financeData && financeData.chartData.length > 0 && (
        <SketchGraphWrapper title="Statistik Keuangan 30 Hari" className="mb-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={financeData.chartData}>
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fontFamily: "'Patrick Hand', cursive" }}
                  stroke="var(--sketch-border-light)"
                />
                <YAxis 
                  tick={{ fontSize: 10, fontFamily: "'Patrick Hand', cursive" }}
                  stroke="var(--sketch-border-light)"
                  tickFormatter={(v) => `${(v/1000)}k`}
                />
                <Tooltip 
                  contentStyle={{
                    fontFamily: "'Patrick Hand', cursive",
                    background: 'var(--sketch-paper)',
                    border: '2px solid var(--sketch-border)',
                    borderRadius: '4px 8px 6px 10px',
                  }}
                  formatter={(value: number) => formatRupiah(value)}
                />
                <Line 
                  type="monotone" 
                  dataKey="topup" 
                  stroke="var(--sketch-success)" 
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ fill: 'var(--sketch-success)', r: 3 }}
                  name="Top-up"
                />
                <Line 
                  type="monotone" 
                  dataKey="payment" 
                  stroke="var(--sketch-danger)" 
                  strokeWidth={2}
                  strokeDasharray="5 3"
                  dot={{ fill: 'var(--sketch-danger)', r: 3 }}
                  name="Bayar"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </SketchGraphWrapper>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <Link href="/user/bayar">
          <SketchCard className="hover:border-[var(--sketch-accent)] transition-colors cursor-pointer h-full" noPushpin>
            <SketchCardContent className="flex items-center gap-3 p-4">
              <span className="text-2xl">💳</span>
              <div>
                <p className="font-bold text-[var(--sketch-text)]" style={{ fontFamily: "'Comic Neue', cursive" }}>Bayar Tagihan</p>
                <p className="text-xs text-[var(--sketch-text-muted)]">Lihat & bayar tagihan</p>
              </div>
            </SketchCardContent>
          </SketchCard>
        </Link>

        <Link href="/user/transfer">
          <SketchCard className="hover:border-[var(--sketch-accent)] transition-colors cursor-pointer h-full" noPushpin>
            <SketchCardContent className="flex items-center gap-3 p-4">
              <span className="text-2xl">🔄</span>
              <div>
                <p className="font-bold text-[var(--sketch-text)]" style={{ fontFamily: "'Comic Neue', cursive" }}>Transfer</p>
                <p className="text-xs text-[var(--sketch-text-muted)]">Kirim saldo ke teman</p>
              </div>
            </SketchCardContent>
          </SketchCard>
        </Link>

        <Link href="/user/saldo-prodi" className="sm:col-span-1">
          <SketchCard className="hover:border-[var(--sketch-accent)] transition-colors cursor-pointer h-full" noPushpin>
            <SketchCardContent className="flex items-center gap-3 p-4">
              <span className="text-2xl">🏛️</span>
              <div>
                <p className="font-bold text-[var(--sketch-text)]" style={{ fontFamily: "'Comic Neue', cursive" }}>Transparansi Prodi</p>
                <p className="text-xs text-[var(--sketch-text-muted)]">Lihat saldo prodi</p>
              </div>
            </SketchCardContent>
          </SketchCard>
        </Link>
      </div>
    </SketchLayout>
  )
}
