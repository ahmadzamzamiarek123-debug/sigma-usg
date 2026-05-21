'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { formatRupiah, formatDate, formatDateTime } from '@/lib/utils'

interface ReportData {
  totalIncome: number
  totalTransactions: number
  byJenis: { jenis: string; count: number; total: number }[]
  recentPayments: {
    id: string
    tagihanTitle: string
    jenis: string
    nominal: number
    userName: string
    userIdentifier: string
    paidAt: string
  }[]
}

export default function LaporanPage() {
  const { data: session } = useSession()
  const [report, setReport] = useState<ReportData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [jenis, setJenis] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchReport()
  }, [])

  async function fetchReport() {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError("Tanggal mulai tidak boleh lebih dari tanggal akhir");
      return;
    }
    setError("");
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)
      if (jenis) params.append('jenis', jenis)

      const res = await fetch(`/api/operator/laporan?${params}`)
      const data = await res.json()
      if(data.success) {
        setReport(data.data)
      } else {
        setError(data.error)
      }
    } catch (error) {
      console.error('Error fetching report:', error)
      setError("Gagal mengambil laporan")
    } finally {
      setIsLoading(false)
    }
  }

  function handleExportCSV() {
    if (!report || report.recentPayments.length === 0) return
    const headers = ['Tagihan', 'Jenis', 'Mahasiswa', 'NIM', 'Nominal', 'Tanggal']
    const rows = report.recentPayments.map(p => [
      `"${p.tagihanTitle}"`,
      p.jenis,
      `"${p.userName}"`,
      p.userIdentifier,
      p.nominal,
      p.paidAt
    ])
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `laporan_pembayaran_${formatDate(new Date())}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const jenisOptions = [
    { value: '', label: 'Semua Jenis' },
    { value: 'KAS', label: 'Kas' },
    { value: 'ACARA', label: 'Acara' },
    { value: 'SEMINAR', label: 'Seminar' },
    { value: 'OTHER', label: 'Lainnya' },
  ]

  const jenisColors: Record<string, string> = {
    KAS: 'bg-[var(--color-info)]',
    ACARA: 'bg-[var(--usg-primary)]',
    SEMINAR: 'bg-[var(--color-success)]',
    OTHER: 'bg-[var(--text-muted)]',
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Laporan Keuangan</h1>
        <p className="text-[var(--text-secondary)] mt-1">
          Laporan pemasukan prodi {session?.user?.prodi}
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Input
                label="Tanggal Mulai"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Input
                label="Tanggal Akhir"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="w-48">
              <Select
                label="Jenis Tagihan"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                options={jenisOptions}
              />
            </div>
            <Button onClick={fetchReport}>
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
              </svg>
              Terapkan Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && <div className="alert-danger mb-6">{error}</div>}

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-32 w-full"></div>
            ))}
          </div>
        </div>
      ) : report ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card variant="gradient">
              <CardContent className="py-6">
                <p className="text-white/80 text-sm mb-1">Total Pemasukan</p>
                <p className="text-3xl font-bold text-white">{formatRupiah(report.totalIncome)}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-success-light)] flex items-center justify-center">
                  <svg className="w-6 h-6 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">{report.totalTransactions}</p>
                  <p className="text-sm text-[var(--text-secondary)]">Total Transaksi</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-[var(--text-secondary)] mb-3">Per Jenis Tagihan</p>
                <div className="space-y-2">
                  {report.byJenis.length === 0 ? (
                    <p className="text-[var(--text-muted)] text-sm">Tidak ada data</p>
                  ) : (
                    report.byJenis.map((item) => (
                      <div key={item.jenis} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${jenisColors[item.jenis]}`}></div>
                          <span className="text-sm text-[var(--text-secondary)]">{item.jenis}</span>
                        </div>
                        <span className="text-sm font-medium text-[var(--text-primary)]">{formatRupiah(item.total)}</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="table-wrapper">
            <div className="px-6 py-4 border-b border-[var(--border-primary)] flex items-center justify-between">
              <h2 className="font-semibold text-[var(--text-primary)]">Pembayaran Terbaru</h2>
              <Button variant="outline" size="sm" onClick={handleExportCSV}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export CSV
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tagihan</th>
                    <th>Jenis</th>
                    <th>Mahasiswa</th>
                    <th>NIM</th>
                    <th>Nominal</th>
                    <th>Tanggal</th>
                  </tr>
                </thead>
                <tbody>
                  {report.recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-[var(--text-muted)]">
                        Tidak ada data pembayaran
                      </td>
                    </tr>
                  ) : (
                    report.recentPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="font-medium text-[var(--text-primary)]">{p.tagihanTitle}</td>
                        <td>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium text-white ${jenisColors[p.jenis]}`}>
                            {p.jenis}
                          </span>
                        </td>
                        <td className="text-[var(--text-secondary)]">{p.userName}</td>
                        <td className="text-[var(--text-secondary)]">{p.userIdentifier}</td>
                        <td className="font-medium text-[var(--text-primary)]">{formatRupiah(p.nominal)}</td>
                        <td className="text-[var(--text-secondary)]">{formatDateTime(p.paidAt)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-[var(--text-muted)]">Gagal memuat data laporan</p>
          </CardContent>
        </Card>
      )}
    </DashboardLayout>
  )
}
