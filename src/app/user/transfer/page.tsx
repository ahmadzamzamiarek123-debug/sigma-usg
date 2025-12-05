'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { formatRupiah } from '@/lib/utils'

export default function TransferPage() {
  const [balance, setBalance] = useState(0)
  const [toNim, setToNim] = useState('')
  const [amount, setAmount] = useState('')
  const [pin, setPin] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      try {
        const res = await fetch('/api/user/balance')
        const data = await res.json()
        setBalance(data.data?.balance || 0)
      } catch (error) {
        console.error('Error fetching balance:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchBalance()
  }, [])

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!toNim || !amount || !pin) {
      setResult({ success: false, message: 'Semua field harus diisi' })
      return
    }
    if (!/^\d{8}$/.test(toNim)) {
      setResult({ success: false, message: 'NIM harus 8 digit angka' })
      return
    }
    if (Number(amount) <= 0) {
      setResult({ success: false, message: 'Nominal harus lebih dari 0' })
      return
    }
    if (Number(amount) > balance) {
      setResult({ success: false, message: 'Saldo tidak mencukupi' })
      return
    }
    if (pin.length !== 6) {
      setResult({ success: false, message: 'PIN harus 6 digit' })
      return
    }
    setResult(null)
    setShowConfirmModal(true)
  }

  async function handleConfirmTransfer() {
    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/user/transfer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toNim,
          amount: Number(amount),
          pin,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: data.message })
        setBalance(data.data.newBalance)
        setToNim('')
        setAmount('')
        setPin('')
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setIsSubmitting(false)
      setShowConfirmModal(false)
    }
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
        <h1 className="text-2xl font-bold text-gray-900">Transfer Saldo</h1>
        <p className="text-gray-500 mt-1">Kirim saldo ke sesama mahasiswa</p>
      </div>

      {/* Balance Info */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="py-6">
          <p className="text-white/80 text-sm mb-1">Saldo Tersedia</p>
          <p className="text-3xl font-bold text-white">{formatRupiah(balance)}</p>
        </CardContent>
      </Card>

      {/* Transfer Form */}
      <Card className="max-w-lg">
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="NIM Tujuan"
              type="text"
              placeholder="Masukkan 8 digit NIM"
              value={toNim}
              onChange={(e) => setToNim(e.target.value)}
              maxLength={8}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              }
            />

            <Input
              label="Nominal Transfer"
              type="number"
              placeholder="Contoh: 50000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              icon={
                <span className="text-sm font-medium">Rp</span>
              }
            />

            <Input
              label="PIN Transaksi"
              type="password"
              placeholder="Masukkan 6 digit PIN"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              maxLength={6}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              }
            />

            {result && (
              <div className={`p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {result.message}
              </div>
            )}

            <Button type="submit" className="w-full">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              Transfer Sekarang
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} title="Konfirmasi Transfer">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">NIM Tujuan</span>
              <span className="font-medium">{toNim}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Nominal</span>
              <span className="font-semibold text-indigo-600">{formatRupiah(Number(amount))}</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-500 text-center">
            Pastikan data sudah benar. Transfer tidak dapat dibatalkan.
          </p>

          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowConfirmModal(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleConfirmTransfer} isLoading={isSubmitting} className="flex-1">
              Konfirmasi
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
