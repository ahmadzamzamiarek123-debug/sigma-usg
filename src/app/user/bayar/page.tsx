'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { formatRupiah, formatDate, isDeadlineNear, isDeadlinePassed } from '@/lib/utils'

interface Tagihan {
  id: string
  title: string
  description: string | null
  jenis: string
  nominal: number
  deadline: string
  isPaid: boolean
  paidAt: string | null
  createdByName: string
}

export default function BayarPage() {
  const [balance, setBalance] = useState(0)
  const [tagihan, setTagihan] = useState<Tagihan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedTagihan, setSelectedTagihan] = useState<Tagihan | null>(null)
  const [pin, setPin] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [balanceRes, tagihanRes] = await Promise.all([
        fetch('/api/user/balance'),
        fetch('/api/user/tagihan'),
      ])

      const balanceData = await balanceRes.json()
      const tagihanData = await tagihanRes.json()

      setBalance(balanceData.data?.balance || 0)
      setTagihan(tagihanData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePayment() {
    if (!selectedTagihan || !pin) return

    if (pin.length !== 6) {
      setResult({ success: false, message: 'PIN harus 6 digit' })
      return
    }

    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/user/tagihan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tagihanId: selectedTagihan.id,
          pin,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: data.message })
        setBalance(data.data.newBalance)
        setSelectedTagihan(null)
        setPin('')
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

  const unpaidTagihan = tagihan.filter((t) => !t.isPaid)
  const paidTagihan = tagihan.filter((t) => t.isPaid)

  const jenisColors: Record<string, string> = {
    KAS: 'bg-blue-100 text-blue-700',
    ACARA: 'bg-purple-100 text-purple-700',
    SEMINAR: 'bg-green-100 text-green-700',
    OTHER: 'bg-gray-100 text-gray-700',
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="animate-pulse space-y-6">
          <div className="h-32 bg-gray-200 rounded-2xl"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Bayar Tagihan</h1>
        <p className="text-gray-500 mt-1">Bayar kas, iuran acara, atau seminar</p>
      </div>

      {/* Balance Info */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="py-6">
          <p className="text-white/80 text-sm mb-1">Saldo Tersedia</p>
          <p className="text-3xl font-bold text-white">{formatRupiah(balance)}</p>
        </CardContent>
      </Card>

      {/* Result Message */}
      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}

      {/* Unpaid Tagihan */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Tagihan Belum Dibayar ({unpaidTagihan.length})</h2>
        {unpaidTagihan.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-500">Tidak ada tagihan yang perlu dibayar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpaidTagihan.map((t) => (
              <Card key={t.id} className="hover:shadow-xl transition-all">
                <CardContent className="py-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${jenisColors[t.jenis]}`}>
                      {t.jenis}
                    </span>
                    {isDeadlinePassed(t.deadline) ? (
                      <Badge variant="danger">Lewat Deadline</Badge>
                    ) : isDeadlineNear(t.deadline) ? (
                      <Badge variant="warning">Segera</Badge>
                    ) : null}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
                  {t.description && (
                    <p className="text-sm text-gray-500 mb-3">{t.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-indigo-600">{formatRupiah(t.nominal)}</span>
                  </div>
                  <p className="text-sm text-gray-500 mb-4">
                    Deadline: {formatDate(t.deadline)}
                  </p>
                  <Button
                    onClick={() => {
                      setSelectedTagihan(t)
                      setResult(null)
                    }}
                    disabled={balance < t.nominal}
                    className="w-full"
                  >
                    {balance < t.nominal ? 'Saldo Tidak Cukup' : 'Bayar Sekarang'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Paid Tagihan */}
      {paidTagihan.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Sudah Dibayar ({paidTagihan.length})</h2>
          <Card>
            <CardContent className="divide-y divide-gray-100">
              {paidTagihan.map((t) => (
                <div key={t.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{t.title}</p>
                      <p className="text-sm text-gray-500">Dibayar: {formatDate(t.paidAt!)}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">{formatRupiah(t.nominal)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Payment Modal */}
      <Modal
        isOpen={!!selectedTagihan}
        onClose={() => {
          setSelectedTagihan(null)
          setPin('')
          setResult(null)
        }}
        title="Konfirmasi Pembayaran"
      >
        {selectedTagihan && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Tagihan</span>
                <span className="font-medium">{selectedTagihan.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nominal</span>
                <span className="font-semibold text-indigo-600">{formatRupiah(selectedTagihan.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Saldo Setelah Bayar</span>
                <span className="font-medium">{formatRupiah(balance - selectedTagihan.nominal)}</span>
              </div>
            </div>

            <Input
              label="PIN Transaksi"
              type="password"
              placeholder="Masukkan 6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
            />

            {result && !result.success && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                {result.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="secondary"
                onClick={() => {
                  setSelectedTagihan(null)
                  setPin('')
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button onClick={handlePayment} isLoading={isSubmitting} className="flex-1">
                Bayar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
