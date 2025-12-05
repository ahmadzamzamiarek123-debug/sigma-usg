'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { UserFinanceChart } from '@/components/charts/UserFinanceChart'
import { formatRupiah } from '@/lib/utils'
import { ChartColors } from '@/lib/colors'
import Link from 'next/link'

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
      <DashboardLayout>
        <div className="animate-pulse space-y-4 sm:space-y-6">
          <div className="h-6 sm:h-8 bg-gray-200 rounded w-2/3 sm:w-1/3"></div>
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-24 sm:h-32 bg-gray-200 rounded-xl sm:rounded-2xl"></div>
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">
          Selamat Datang, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">
          Dashboard Mahasiswa • {session?.user?.prodi}
        </p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
        {/* Saldo Pribadi */}
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 col-span-2 sm:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <p className="text-indigo-100 text-xs sm:text-sm mb-1">Saldo Anda</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{formatRupiah(balance)}</p>
          </CardContent>
        </Card>

        {/* Top-up Total */}
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ChartColors.topup}20` }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: ChartColors.topup }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Top-up</p>
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{formatRupiah(financeData?.totals.topup || 0)}</p>
          </CardContent>
        </Card>

        {/* Pembayaran Total */}
        <Card className="bg-white border border-gray-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${ChartColors.payment}20` }}>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: ChartColors.payment }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Bayar</p>
            </div>
            <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{formatRupiah(financeData?.totals.payment || 0)}</p>
          </CardContent>
        </Card>

        {/* Saldo Prodi */}
        {prodiSaldo && (
          <Card className="bg-white border border-gray-100">
            <CardContent className="p-3 sm:p-6">
              <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <p className="text-gray-500 text-xs sm:text-sm truncate">Prodi</p>
              </div>
              <p className="text-base sm:text-xl md:text-2xl font-bold text-gray-900 truncate">{formatRupiah(prodiSaldo.currentBalance)}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Charts Section */}
      <div className="mb-4 sm:mb-8">
        <UserFinanceChart 
          data={financeData?.chartData || []} 
          title="Statistik Keuangan 30 Hari" 
        />
      </div>

      {/* Quick Actions - Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
        <Link href="/user/bayar" className="block">
          <Card className="bg-white border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Bayar Tagihan</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Lihat dan bayar tagihan</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/user/transfer" className="block">
          <Card className="bg-white border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Transfer</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Kirim saldo ke teman</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/user/saldo-prodi" className="block sm:col-span-2 lg:col-span-1">
          <Card className="bg-white border border-gray-100 hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 text-sm sm:text-base">Transparansi Prodi</h3>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">Lihat saldo & pengeluaran</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </DashboardLayout>
  )
}
