'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatsCardGradient } from '@/components/charts/StatsCard'
import { formatRupiah, formatDateTime } from '@/lib/utils'

interface Pengeluaran {
  id: string
  amount: number
  description: string
  createdAt: string
  createdBy: { name: string }
}

export default function PengeluaranPage() {
  const { data: session } = useSession()
  const [pengeluaran, setPengeluaran] = useState<Pengeluaran[]>([])
  const [currentBalance, setCurrentBalance] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Form state
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/prodi/pengeluaran')
      const data = await res.json()
      setPengeluaran(data.data?.pengeluaran || [])
      setCurrentBalance(data.data?.currentBalance || 0)
    } catch (error) {
      console.error('Error fetching pengeluaran:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/prodi/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Number(amount),
          description,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: 'Pengeluaran berhasil dicatat' })
        setAmount('')
        setDescription('')
        setShowModal(false)
        fetchData()
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengeluaran Prodi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Catat pengeluaran untuk prodi {session?.user?.prodi}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Catat Pengeluaran
        </Button>
      </div>

      {/* Balance Card */}
      <div className="mb-8">
        <StatsCardGradient
          title="Saldo Prodi Tersedia"
          value={formatRupiah(currentBalance)}
          subtitle="Dapat digunakan untuk pengeluaran"
        />
      </div>

      {/* Result Message */}
      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {result.message}
        </div>
      )}

      {/* Pengeluaran List */}
      <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Riwayat Pengeluaran</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Keterangan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dicatat Oleh</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Jumlah</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {pengeluaran.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Belum ada pengeluaran tercatat
                  </td>
                </tr>
              ) : (
                pengeluaran.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {p.description}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                      {p.createdBy.name}
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-red-600 dark:text-red-400">
                      -{formatRupiah(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Catat Pengeluaran Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl mb-4">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              <span className="font-medium">Saldo tersedia:</span> {formatRupiah(currentBalance)}
            </p>
          </div>

          <Input
            label="Jumlah Pengeluaran (Rp)"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Contoh: 500000"
            required
          />

          <Textarea
            label="Deskripsi Pengeluaran"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan keperluan pengeluaran ini..."
            rows={3}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowModal(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Simpan
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
