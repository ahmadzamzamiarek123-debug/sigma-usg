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
    
    const numericAmount = Number(amount);
    if(numericAmount <= 0) {
      setResult({ success: false, message: 'Nominal harus lebih dari 0' })
      return;
    }
    if(numericAmount > currentBalance) {
      setResult({ success: false, message: 'Saldo tidak mencukupi' })
      return;
    }

    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/prodi/pengeluaran', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numericAmount,
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
        <div className="space-y-6">
          <div className="skeleton h-8 w-1/3"></div>
          <div className="skeleton h-32 w-full"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">Pengeluaran Prodi</h1>
          <p className="text-[var(--text-secondary)] mt-1">
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

      <div className="mb-8">
        <StatsCardGradient
          title="Saldo Prodi Tersedia"
          value={formatRupiah(currentBalance)}
          subtitle="Dapat digunakan untuk pengeluaran"
        />
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'alert-success' : 'alert-danger'}`}>
          {result.message}
        </div>
      )}

      <div className="table-wrapper">
        <div className="px-6 py-4 border-b border-[var(--border-primary)]">
          <h2 className="font-semibold text-[var(--text-primary)]">Riwayat Pengeluaran</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Dicatat Oleh</th>
                <th>Jumlah</th>
              </tr>
            </thead>
            <tbody>
              {pengeluaran.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Belum ada pengeluaran tercatat
                  </td>
                </tr>
              ) : (
                pengeluaran.map((p) => (
                  <tr key={p.id}>
                    <td className="text-[var(--text-secondary)]">
                      {formatDateTime(p.createdAt)}
                    </td>
                    <td className="text-[var(--text-primary)]">
                      {p.description}
                    </td>
                    <td className="text-[var(--text-secondary)]">
                      {p.createdBy.name}
                    </td>
                    <td className="font-semibold text-[var(--color-danger)]">
                      -{formatRupiah(p.amount)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Catat Pengeluaran Baru">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-[var(--color-info-light)] rounded-xl mb-4">
            <p className="text-sm text-[var(--color-info)]">
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
            min="1"
            max={currentBalance}
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
