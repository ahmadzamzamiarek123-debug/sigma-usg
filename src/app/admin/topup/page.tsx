'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge } from '@/components/ui/Badge'
import { formatRupiah, formatDateTime } from '@/lib/utils'

interface TopupRequest {
  id: string
  amount: number
  status: string
  evidenceUrl: string | null
  rejectionReason: string | null
  createdAt: string
  validatedAt: string | null
  userName: string
  userIdentifier: string
  userProdi: string | null
  validatedByName: string | null
}

export default function AdminTopupPage() {
  const [requests, setRequests] = useState<TopupRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filter, setFilter] = useState('PENDING')
  const [selectedRequest, setSelectedRequest] = useState<TopupRequest | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    fetchRequests()
  }, [filter])

  async function fetchRequests() {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/topup?status=${filter}`)
      const data = await res.json()
      setRequests(data.data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAction(action: 'APPROVE' | 'REJECT') {
    if (!selectedRequest) return
    if (action === 'REJECT' && !rejectReason) {
      setResult({ success: false, message: 'Alasan penolakan harus diisi' })
      return
    }

    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: selectedRequest.id,
          action,
          reason: rejectReason || undefined,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: data.message })
        setSelectedRequest(null)
        setRejectReason('')
        fetchRequests()
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const pendingCount = requests.length
  const filterOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: '', label: 'Semua' },
  ]

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Validasi Top-up</h1>
        <p className="text-gray-500 mt-1">Approve atau reject request top-up dari mahasiswa</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === opt.value
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Result Message */}
      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mahasiswa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prodi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nominal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                    Tidak ada request top-up
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{r.userName}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.userIdentifier}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{r.userProdi || '-'}</td>
                    <td className="px-6 py-4 text-sm font-semibold text-indigo-600">{formatRupiah(r.amount)}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(r.createdAt)}</td>
                    <td className="px-6 py-4">
                      {r.status === 'PENDING' ? (
                        <Button size="sm" onClick={() => setSelectedRequest(r)}>
                          Review
                        </Button>
                      ) : (
                        <span className="text-sm text-gray-400">
                          {r.validatedByName && `by ${r.validatedByName}`}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedRequest}
        onClose={() => {
          setSelectedRequest(null)
          setRejectReason('')
          setResult(null)
        }}
        title="Review Request Top-up"
      >
        {selectedRequest && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500">Nama</span>
                <span className="font-medium">{selectedRequest.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">NIM</span>
                <span className="font-medium">{selectedRequest.userIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Prodi</span>
                <span className="font-medium">{selectedRequest.userProdi || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Nominal</span>
                <span className="font-semibold text-indigo-600">{formatRupiah(selectedRequest.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tanggal Request</span>
                <span className="font-medium">{formatDateTime(selectedRequest.createdAt)}</span>
              </div>
            </div>

            <Textarea
              label="Alasan Penolakan (wajib jika reject)"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Masukkan alasan penolakan..."
              rows={2}
            />

            {result && !result.success && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-sm">
                {result.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="danger"
                onClick={() => handleAction('REJECT')}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Reject
              </Button>
              <Button
                onClick={() => handleAction('APPROVE')}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Approve
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
