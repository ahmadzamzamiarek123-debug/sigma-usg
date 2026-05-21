'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { formatDateTime } from '@/lib/utils'
import { formatAuditAction } from '@/lib/audit'

interface AuditLog {
  id: string
  actorName: string
  actorRole: string
  actorIdentifier: string
  action: string
  detail: string
  createdAt: string
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [actionFilter, setActionFilter] = useState('')

  useEffect(() => {
    fetchLogs()
  }, [page, actionFilter])

  async function fetchLogs() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', '20')
      if (actionFilter) params.append('action', actionFilter)

      const res = await fetch(`/api/admin/audit?${params}`)
      const data = await res.json()
      setLogs(data.data || [])
      setTotalPages(data.totalPages || 1)
    } catch (error) {
      console.error('Error fetching logs:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const actionOptions = [
    { value: '', label: 'Semua Actions' },
    { value: 'LOGIN', label: 'Login' },
    { value: 'TOPUP_REQUESTED', label: 'Request Top-up' },
    { value: 'TOPUP_APPROVED', label: 'Top-up Approved' },
    { value: 'TOPUP_REJECTED', label: 'Top-up Rejected' },
    { value: 'PAYMENT_SUCCESS', label: 'Payment Success' },
    { value: 'TRANSFER_SENT', label: 'Transfer Sent' },
    { value: 'TAGIHAN_CREATED', label: 'Tagihan Created' },
  ]

  const getRoleVariant = (role: string) => {
    switch(role) {
      case 'USER': return 'info'
      case 'OPERATOR': return 'success'
      case 'ADMIN': return 'warning' // using warning mapped to purple style ideally, or default
      default: return 'default'
    }
  }

  interface DetailData {
    amount?: number
    targetUserName?: string
    tagihanTitle?: string
    description?: string
  }

  function parseDetail(detail: string): DetailData {
    try {
      return JSON.parse(detail) as DetailData
    } catch {
      return {}
    }
  }

  return (
    <DashboardLayout>
      <div className="mb-4 sm:mb-8">
        <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[var(--text-primary)]">Audit Log</h1>
        <p className="text-[var(--text-secondary)] text-xs sm:text-sm mt-1">Riwayat semua aktivitas dalam sistem</p>
      </div>

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-full sm:w-64">
              <Select
                label="Filter Action"
                value={actionFilter}
                onChange={(e) => {
                  setActionFilter(e.target.value)
                  setPage(1)
                }}
                options={actionOptions}
              />
            </div>
            <Button onClick={fetchLogs} className="w-full sm:w-auto mt-2 sm:mt-0">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="table-wrapper">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Actor</th>
                <th>Role</th>
                <th>Action</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-[var(--usg-primary)] border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[var(--text-muted)]">
                    Tidak ada log aktivitas
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const detail = parseDetail(log.detail)
                  return (
                    <tr key={log.id}>
                      <td className="whitespace-nowrap text-[var(--text-secondary)]">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{log.actorName}</p>
                          <p className="text-xs text-[var(--text-muted)]">{log.actorIdentifier}</p>
                        </div>
                      </td>
                      <td>
                        <Badge variant={getRoleVariant(log.actorRole) as any}>{log.actorRole}</Badge>
                      </td>
                      <td>
                        <p className="font-medium text-[var(--text-primary)]">{formatAuditAction(log.action)}</p>
                        <p className="text-xs text-[var(--text-muted)] font-mono">{log.action}</p>
                      </td>
                      <td className="max-w-xs text-[var(--text-secondary)]">
                        {detail.amount !== undefined && (
                          <span>Rp {detail.amount.toLocaleString('id-ID')}</span>
                        )}
                        {detail.targetUserName && (
                          <span className="ml-2">→ {detail.targetUserName}</span>
                        )}
                        {detail.tagihanTitle && (
                          <span>{detail.tagihanTitle}</span>
                        )}
                        {detail.description && (
                          <span className="text-[var(--text-muted)]"> ({detail.description})</span>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-[var(--border-primary)] flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-[var(--text-secondary)]">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1}
              >
                ← Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page === totalPages}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
