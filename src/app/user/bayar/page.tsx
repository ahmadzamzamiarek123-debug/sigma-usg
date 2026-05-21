'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
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
  const router = useRouter()
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

  async function handlePayment(e?: React.FormEvent) {
    if (e) e.preventDefault()
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
        setTimeout(() => {
          router.push('/user/riwayat')
        }, 1500)
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
    KAS: 'bg-[var(--color-info)] text-[var(--text-inverse)]',
    ACARA: 'bg-[var(--usg-primary)] text-[var(--text-inverse)]',
    SEMINAR: 'bg-[var(--color-success)] text-[var(--text-inverse)]',
    OTHER: 'bg-[var(--text-muted)] text-[var(--text-inverse)]',
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="skeleton h-32 w-full"></div>
          <div className="skeleton h-64 w-full"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Bayar Tagihan</h1>
        <p className="text-[var(--text-secondary)] mt-1">Bayar kas, iuran acara, atau seminar</p>
      </div>

      <Card variant="gradient" className="mb-8">
        <CardContent className="py-6">
          <p className="text-[var(--text-inverse)] opacity-80 text-sm mb-1">Saldo Tersedia</p>
          <p className="text-3xl font-bold text-[var(--text-inverse)]">{formatRupiah(balance)}</p>
        </CardContent>
      </Card>

      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'alert-success' : 'alert-danger'}`}>
          {result.message}
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Tagihan Belum Dibayar ({unpaidTagihan.length})</h2>
        {unpaidTagihan.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-[var(--color-success-light)] flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-[var(--text-muted)]">Tidak ada tagihan yang perlu dibayar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {unpaidTagihan.map((t) => (
              <Card key={t.id}>
                <CardContent className="py-5">
                  <div className="flex items-start justify-between mb-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${jenisColors[t.jenis] || jenisColors.OTHER}`}>
                      {t.jenis}
                    </span>
                    {isDeadlinePassed(t.deadline) ? (
                      <Badge variant="danger">Lewat Deadline</Badge>
                    ) : isDeadlineNear(t.deadline) ? (
                      <Badge variant="warning">Segera</Badge>
                    ) : null}
                  </div>
                  <h3 className="font-semibold text-[var(--text-primary)] mb-1">{t.title}</h3>
                  {t.description && (
                    <p className="text-sm text-[var(--text-secondary)] mb-3">{t.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-[var(--usg-primary)]">{formatRupiah(t.nominal)}</span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-4">
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

      {paidTagihan.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Sudah Dibayar ({paidTagihan.length})</h2>
          <Card>
            <CardContent className="divide-y divide-[var(--border-primary)]">
              {paidTagihan.map((t) => (
                <div key={t.id} className="py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-success-light)] flex items-center justify-center">
                      <svg className="w-5 h-5 text-[var(--color-success)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{t.title}</p>
                      <p className="text-sm text-[var(--text-muted)]">Dibayar: {formatDate(t.paidAt!)}</p>
                    </div>
                  </div>
                  <p className="font-semibold text-[var(--text-primary)]">{formatRupiah(t.nominal)}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

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
          <form onSubmit={handlePayment} className="space-y-4">
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Tagihan</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedTagihan.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Nominal</span>
                <span className="font-semibold text-[var(--usg-primary)]">{formatRupiah(selectedTagihan.nominal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Saldo Setelah Bayar</span>
                <span className="font-medium text-[var(--text-primary)]">{formatRupiah(balance - selectedTagihan.nominal)}</span>
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
              <div className="alert-danger text-sm">
                {result.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setSelectedTagihan(null)
                  setPin('')
                }}
                className="flex-1"
              >
                Batal
              </Button>
              <Button type="submit" isLoading={isSubmitting} className="flex-1">
                Bayar
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </DashboardLayout>
  )
}
