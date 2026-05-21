'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Button } from '@/components/ui/Button'
import { Textarea } from '@/components/ui/Input'
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

  // Use to trigger confirmation modal specifically for rejection
  const [confirmReject, setConfirmReject] = useState(false)

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
        setConfirmReject(false)
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

  const filterOptions = [
    { value: 'PENDING', label: 'Pending' },
    { value: 'APPROVED', label: 'Approved' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: '', label: 'Semua' },
  ]

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Validasi Top-up</h1>
        <p className="text-[var(--text-secondary)] mt-1">Approve atau reject request top-up dari mahasiswa</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => {
              setFilter(opt.value)
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              filter === opt.value
                ? 'bg-[var(--usg-primary)] text-white'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'alert-success' : 'alert-danger'}`}>
          {result.message}
        </div>
      )}

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Mahasiswa</th>
                <th>NIM</th>
                <th>Prodi</th>
                <th>Nominal</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--usg-primary)] border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : requests.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Tidak ada request top-up
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id}>
                    <td className="font-medium text-[var(--text-primary)]">{r.userName}</td>
                    <td className="text-[var(--text-secondary)]">{r.userIdentifier}</td>
                    <td className="text-[var(--text-secondary)]">{r.userProdi || '-'}</td>
                    <td className="font-semibold text-[var(--color-info)]">{formatRupiah(r.amount)}</td>
                    <td>
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="text-[var(--text-secondary)]">{formatDateTime(r.createdAt)}</td>
                    <td>
                      {r.status === 'PENDING' ? (
                        <Button size="sm" onClick={() => setSelectedRequest(r)}>
                          Review
                        </Button>
                      ) : (
                        <span className="text-sm text-[var(--text-muted)]">
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
      </div>

      <Modal
        isOpen={!!selectedRequest}
        onClose={() => {
          if (!confirmReject) {
            setSelectedRequest(null)
            setRejectReason('')
            setResult(null)
          }
        }}
        title={confirmReject ? "Konfirmasi Penolakan" : "Review Request Top-up"}
      >
        {selectedRequest && !confirmReject && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Nama</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedRequest.userName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">NIM</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedRequest.userIdentifier}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Prodi</span>
                <span className="font-medium text-[var(--text-primary)]">{selectedRequest.userProdi || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Nominal</span>
                <span className="font-semibold text-[var(--color-info)]">{formatRupiah(selectedRequest.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-secondary)]">Tanggal Request</span>
                <span className="font-medium text-[var(--text-primary)]">{formatDateTime(selectedRequest.createdAt)}</span>
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
              <div className="alert-danger text-sm">
                {result.message}
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                variant="danger"
                onClick={() => {
                  if(!rejectReason) {
                    setResult({ success: false, message: 'Alasan penolakan harus diisi' });
                    return;
                  }
                  setConfirmReject(true)
                }}
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

        {selectedRequest && confirmReject && (
          <div className="space-y-4">
            <p className="text-[var(--text-secondary)]">Apakah Anda yakin menolak request topup senilai {formatRupiah(selectedRequest.amount)} dari {selectedRequest.userName}?</p>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setConfirmReject(false)} className="flex-1">Kembali</Button>
              <Button variant="danger" isLoading={isSubmitting} onClick={() => handleAction('REJECT')} className="flex-1">Ya, Tolak</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
