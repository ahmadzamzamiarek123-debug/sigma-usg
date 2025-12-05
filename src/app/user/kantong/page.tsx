'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRupiah, formatDateTime, getTransactionSign, getTransactionTypeColor } from '@/lib/utils'

interface Transaction {
  id: string
  type: string
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string
  relatedUserName: string | null
  createdAt: string
}

interface TopupRequest {
  id: string
  amount: number
  status: string
  createdAt: string
  validatedAt: string | null
}

export default function KantongPage() {
  const [balance, setBalance] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [topupRequests, setTopupRequests] = useState<TopupRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showTopupModal, setShowTopupModal] = useState(false)
  const [topupAmount, setTopupAmount] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [balanceRes, transactionsRes, topupRes] = await Promise.all([
        fetch('/api/user/balance'),
        fetch('/api/user/transactions?limit=20'),
        fetch('/api/user/topup'),
      ])

      const balanceData = await balanceRes.json()
      const transactionsData = await transactionsRes.json()
      const topupData = await topupRes.json()

      setBalance(balanceData.data?.balance || 0)
      setTransactions(transactionsData.data || [])
      setTopupRequests(topupData.data || [])
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleTopupRequest() {
    if (!topupAmount || isNaN(Number(topupAmount))) {
      setMessage({ type: 'error', text: 'Masukkan nominal yang valid' })
      return
    }

    setIsSubmitting(true)
    setMessage(null)

    try {
      const res = await fetch('/api/user/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: Number(topupAmount) }),
      })

      const data = await res.json()

      if (data.success) {
        setMessage({ type: 'success', text: data.message })
        setTopupAmount('')
        setShowTopupModal(false)
        fetchData()
      } else {
        setMessage({ type: 'error', text: data.error })
      }
    } catch {
      setMessage({ type: 'error', text: 'Terjadi kesalahan' })
    } finally {
      setIsSubmitting(false)
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
        <h1 className="text-2xl font-bold text-gray-900">Kantong Saya</h1>
        <p className="text-gray-500 mt-1">Kelola saldo dan lihat riwayat transaksi</p>
      </div>

      {/* Balance Card */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm mb-1">Saldo Saat Ini</p>
              <p className="text-4xl font-bold text-white">{formatRupiah(balance)}</p>
            </div>
            <Button
              onClick={() => setShowTopupModal(true)}
              className="bg-white/20 hover:bg-white/30 text-white border-0"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Request Top-up
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Message */}
      {message && (
        <div className={`mb-6 p-4 rounded-xl ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction History */}
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Riwayat Transaksi</h2>
            </div>
            <CardContent className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">Belum ada transaksi</p>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        t.type === 'TOPUP' ? 'bg-green-100' :
                        t.type === 'TRANSFER_IN' ? 'bg-blue-100' :
                        t.type === 'TRANSFER_OUT' ? 'bg-orange-100' :
                        'bg-purple-100'
                      }`}>
                        {t.type === 'TOPUP' && (
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                        {t.type === 'TRANSFER_IN' && (
                          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {t.type === 'TRANSFER_OUT' && (
                          <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        )}
                        {t.type === 'PAYMENT' && (
                          <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t.description || t.type}</p>
                        <p className="text-sm text-gray-500">{formatDateTime(t.createdAt)}</p>
                      </div>
                    </div>
                    <p className={`font-semibold ${getTransactionTypeColor(t.type)}`}>
                      {getTransactionSign(t.type)}{formatRupiah(t.amount)}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top-up Requests */}
        <div>
          <Card>
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-semibold text-gray-900">Request Top-up</h2>
            </div>
            <CardContent className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
              {topupRequests.length === 0 ? (
                <p className="text-gray-500 text-sm py-8 text-center">Belum ada request</p>
              ) : (
                topupRequests.map((r) => (
                  <div key={r.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-gray-900">{formatRupiah(r.amount)}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-gray-500">{formatDateTime(r.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Top-up Modal */}
      <Modal isOpen={showTopupModal} onClose={() => setShowTopupModal(false)} title="Request Top-up Saldo">
        <div className="space-y-4">
          <Input
            label="Nominal Top-up"
            type="number"
            placeholder="Contoh: 100000"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
          />
          <p className="text-sm text-gray-500">
            Minimal Rp 10.000, maksimal Rp 10.000.000
          </p>
          <div className="flex gap-3 pt-4">
            <Button variant="secondary" onClick={() => setShowTopupModal(false)} className="flex-1">
              Batal
            </Button>
            <Button onClick={handleTopupRequest} isLoading={isSubmitting} className="flex-1">
              Request Top-up
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  )
}
