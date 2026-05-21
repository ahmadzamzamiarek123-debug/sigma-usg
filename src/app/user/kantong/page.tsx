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

  async function handleTopupRequest(e?: React.FormEvent) {
    if (e) e.preventDefault()
    if (!topupAmount || isNaN(Number(topupAmount)) || Number(topupAmount) < 10000) {
      setMessage({ type: 'error', text: 'Masukkan nominal yang valid (Min Rp 10.000)' })
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
        setTimeout(() => setMessage(null), 3000)
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
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Kantong Saya</h1>
        <p className="text-[var(--text-secondary)] mt-1">Kelola saldo dan lihat riwayat transaksi</p>
      </div>

      <Card variant="gradient" className="mb-8">
        <CardContent className="py-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[var(--text-inverse)] opacity-80 text-sm mb-1">Saldo Saat Ini</p>
              <p className="text-4xl font-bold text-[var(--text-inverse)]">{formatRupiah(balance)}</p>
            </div>
            <Button
              onClick={() => setShowTopupModal(true)}
              className="bg-white/20 hover:bg-white/30 text-[var(--text-inverse)] border-0"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Request Top-up
            </Button>
          </div>
        </CardContent>
      </Card>

      {message && (
        <div className={`mb-6 ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <div className="px-6 py-4 border-b border-[var(--border-primary)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Riwayat Transaksi</h2>
            </div>
            <CardContent className="divide-y divide-[var(--border-primary)] max-h-[500px] overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm py-8 text-center">Belum ada transaksi</p>
              ) : (
                transactions.map((t) => (
                  <div key={t.id} className="py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        t.type === 'TOPUP' ? 'bg-[var(--color-success-light)] text-[var(--color-success)]' :
                        t.type === 'TRANSFER_IN' ? 'bg-[var(--color-info-light)] text-[var(--color-info)]' :
                        t.type === 'TRANSFER_OUT' ? 'bg-[var(--color-warning-light)] text-[var(--color-warning)]' :
                        'bg-[rgba(30,58,95,0.1)] text-[var(--usg-primary)] dark:bg-[rgba(30,58,95,0.3)] dark:text-[var(--usg-primary-light)]'
                      }`}>
                        {t.type === 'TOPUP' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        )}
                        {t.type === 'TRANSFER_IN' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                          </svg>
                        )}
                        {t.type === 'TRANSFER_OUT' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                          </svg>
                        )}
                        {t.type === 'PAYMENT' && (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">{t.description || t.type}</p>
                        <p className="text-sm text-[var(--text-muted)]">{formatDateTime(t.createdAt)}</p>
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

        <div>
          <Card>
            <div className="px-6 py-4 border-b border-[var(--border-primary)]">
              <h2 className="font-semibold text-[var(--text-primary)]">Request Top-up</h2>
            </div>
            <CardContent className="divide-y divide-[var(--border-primary)] max-h-[500px] overflow-y-auto">
              {topupRequests.length === 0 ? (
                <p className="text-[var(--text-muted)] text-sm py-8 text-center">Belum ada request</p>
              ) : (
                topupRequests.map((r) => (
                  <div key={r.id} className="py-3">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-[var(--text-primary)]">{formatRupiah(r.amount)}</p>
                      <StatusBadge status={r.status} />
                    </div>
                    <p className="text-sm text-[var(--text-muted)]">{formatDateTime(r.createdAt)}</p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Modal isOpen={showTopupModal} onClose={() => setShowTopupModal(false)} title="Request Top-up Saldo">
        <form onSubmit={handleTopupRequest} className="space-y-4">
          <Input
            label="Nominal Top-up"
            type="number"
            placeholder="Contoh: 100000"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
            min="10000"
            required
          />
          <p className="text-sm text-[var(--text-muted)]">
            Minimal Rp 10.000, maksimal Rp 10.000.000
          </p>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowTopupModal(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Request Top-up
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
