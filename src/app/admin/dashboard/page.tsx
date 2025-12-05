'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { AdminProdiChart } from '@/components/charts/AdminProdiChart'
import { formatRupiah, formatDateTime } from '@/lib/utils'
import Link from 'next/link'

interface ProdiSaldoData {
  prodi: string
  balance: number
}

interface Summary {
  totalSystemBalance: number
  activeUsers: number
  activeOperators: number
  totalProdi: number
}

interface AuditLogEntry {
  id: string
  action: string
  detail: string
  createdAt: string
  actor?: { name: string } | null
}

export default function AdminDashboard() {
  const { data: session } = useSession()
  const [saldoData, setSaldoData] = useState<ProdiSaldoData[]>([])
  const [historyData, setHistoryData] = useState<Array<Record<string, string | number>>>([])
  const [prodiList, setProdiList] = useState<string[]>([])
  const [summary, setSummary] = useState<Summary | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodiRes, auditRes] = await Promise.all([
          fetch('/api/admin/prodi-saldo-summary'),
          fetch('/api/admin/audit?limit=5'),
        ])

        const prodiData = await prodiRes.json()
        const auditData = await auditRes.json()

        if (prodiData.success) {
          setSaldoData(prodiData.data.saldoData)
          setHistoryData(prodiData.data.historyData)
          setProdiList(prodiData.data.prodiList)
          setSummary(prodiData.data.summary)
        }

        if (auditData.success) {
          setAuditLogs(auditData.data || [])
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

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
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">Dashboard Admin</h1>
        <p className="text-gray-500 text-xs sm:text-sm mt-1">Selamat datang, {session?.user?.name?.split(' ')[0]}</p>
      </div>

      {/* Stats Cards - Responsive Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-4 sm:mb-8">
        <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 col-span-2 sm:col-span-1">
          <CardContent className="p-4 sm:p-6">
            <p className="text-indigo-100 text-xs sm:text-sm mb-1">Total Sistem</p>
            <p className="text-xl sm:text-2xl md:text-3xl font-bold truncate">{formatRupiah(summary?.totalSystemBalance || 0)}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Users</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary?.activeUsers || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Operator</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary?.activeOperators || 0}</p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100">
          <CardContent className="p-3 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-3 mb-1 sm:mb-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <p className="text-gray-500 text-xs sm:text-sm truncate">Prodi</p>
            </div>
            <p className="text-xl sm:text-2xl font-bold text-gray-900">{summary?.totalProdi || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts - Responsive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-8">
        <AdminProdiChart 
          saldoData={saldoData} 
          type="bar"
          title="Saldo per Prodi" 
        />
        {historyData.length > 0 && (
          <AdminProdiChart 
            historyData={historyData}
            prodiList={prodiList}
            type="line"
            title="Tren Saldo (Tahunan)" 
          />
        )}
      </div>

      {/* Quick Actions & Audit Log - Responsive */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Quick Actions */}
        <Card className="bg-white border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Aksi Cepat</h2>
          </div>
          <CardContent className="p-3 sm:p-6 space-y-2 sm:space-y-3">
            <Link href="/admin/topup" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Validasi Top-up</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Setujui atau tolak</p>
              </div>
            </Link>

            <Link href="/admin/operators" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Kelola Operator</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Aktifkan/nonaktifkan</p>
              </div>
            </Link>

            <Link href="/admin/users" className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg sm:rounded-xl hover:bg-gray-50 transition-colors">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className="font-medium text-gray-900 text-sm sm:text-base">Kelola Users</p>
                <p className="text-xs sm:text-sm text-gray-500 truncate">Manage mahasiswa</p>
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Audit Logs */}
        <Card className="bg-white border border-gray-100">
          <div className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900 text-sm sm:text-base">Audit Log</h2>
            <Link href="/admin/audit" className="text-xs sm:text-sm text-indigo-600 hover:underline">
              Semua
            </Link>
          </div>
          <div className="divide-y divide-gray-100 max-h-64 sm:max-h-80 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <div className="p-4 sm:p-6 text-center text-gray-500 text-sm">Belum ada aktivitas</div>
            ) : (
              auditLogs.map((log) => (
                <div key={log.id} className="p-3 sm:p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-gray-100 text-gray-600 truncate max-w-[120px] sm:max-w-none">
                      {log.action}
                    </span>
                    <span className="text-xs text-gray-400 flex-shrink-0">
                      {formatDateTime(log.createdAt)}
                    </span>
                  </div>
                  <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 truncate">{log.actor?.name || 'System'}</p>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
