'use client'

import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah, formatDate } from '@/lib/utils'

interface User {
  id: string
  identifier: string
  name: string
  prodi: string | null
  angkatan: string | null
  isActive: boolean
  createdAt: string
  balance: { balance: number } | null
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [prodiList, setProdiList] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionType, setActionType] = useState<'toggle' | 'reset' | 'prodi' | null>(null)
  const [newProdi, setNewProdi] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Filters
  const [filterProdi, setFilterProdi] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchUsers()
  }, [filterProdi, filterStatus, page])

  async function fetchUsers() {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      params.append('page', page.toString())
      if (filterProdi) params.append('prodi', filterProdi)
      if (filterStatus) params.append('status', filterStatus)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      setUsers(data.data || [])
      setTotalPages(data.totalPages || 1)
      setProdiList(data.prodiList || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleAction() {
    if (!selectedUser || !actionType) return
    setIsSubmitting(true)
    setResult(null)

    try {
      const body: { action: string; prodi?: string } = { action: '' }
      if (actionType === 'toggle') body.action = 'toggle-active'
      if (actionType === 'reset') body.action = 'reset-password'
      if (actionType === 'prodi') {
        body.action = 'change-prodi'
        body.prodi = newProdi
      }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: data.message })
        setSelectedUser(null)
        setActionType(null)
        setNewProdi('')
        fetchUsers()
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Kelola Users</h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Manage semua mahasiswa dalam sistem</p>
      </div>

      {/* Filters */}
      <Card className="mb-6 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-end gap-4">
            <div className="w-48">
              <Select
                label="Prodi"
                value={filterProdi}
                onChange={(e) => { setFilterProdi(e.target.value); setPage(1) }}
                options={[
                  { value: '', label: 'Semua Prodi' },
                  ...prodiList.map(p => ({ value: p, label: p })),
                ]}
              />
            </div>
            <div className="w-48">
              <Select
                label="Status"
                value={filterStatus}
                onChange={(e) => { setFilterStatus(e.target.value); setPage(1) }}
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'active', label: 'Aktif' },
                  { value: 'inactive', label: 'Nonaktif' },
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Result Message */}
      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'}`}>
          {result.message}
        </div>
      )}

      {/* Users Table */}
      <Card className="bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">NIM</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Prodi</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Angkatan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Saldo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    Tidak ada user
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="px-6 py-4 text-sm font-mono text-gray-900 dark:text-white">{u.identifier}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{u.prodi || '-'}</td>
                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">{u.angkatan || '-'}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                      {formatRupiah(u.balance?.balance || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={u.isActive ? 'success' : 'danger'}>
                        {u.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={u.isActive ? 'danger' : 'primary'}
                          onClick={() => { setSelectedUser(u); setActionType('toggle') }}
                        >
                          {u.isActive ? 'Disable' : 'Enable'}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedUser(u); setActionType('reset') }}
                        >
                          Reset PW
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Halaman {page} dari {totalPages}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}>
                ← Prev
              </Button>
              <Button variant="outline" size="sm" onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}>
                Next →
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!selectedUser && !!actionType}
        onClose={() => { setSelectedUser(null); setActionType(null); setNewProdi('') }}
        title={
          actionType === 'toggle'
            ? (selectedUser?.isActive ? 'Nonaktifkan User' : 'Aktifkan User')
            : actionType === 'reset'
            ? 'Reset Password'
            : 'Ubah Prodi'
        }
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                <span className="font-medium">{selectedUser.name}</span>
                <br />
                <span className="text-gray-500 dark:text-gray-400">{selectedUser.identifier}</span>
              </p>
            </div>

            {actionType === 'toggle' && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                User ini akan {selectedUser.isActive ? 'dinonaktifkan' : 'diaktifkan'}. 
                {selectedUser.isActive && ' User tidak akan bisa login.'}
              </p>
            )}

            {actionType === 'reset' && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Password akan direset ke <span className="font-mono font-medium">password123</span>
              </p>
            )}

            {actionType === 'prodi' && (
              <Input
                label="Prodi Baru"
                value={newProdi}
                onChange={(e) => setNewProdi(e.target.value.toUpperCase())}
                placeholder="Contoh: TI, SI, MI"
              />
            )}

            <div className="flex gap-3 pt-4">
              <Button variant="secondary" onClick={() => { setSelectedUser(null); setActionType(null) }} className="flex-1">
                Batal
              </Button>
              <Button
                variant={actionType === 'toggle' && selectedUser.isActive ? 'danger' : 'primary'}
                onClick={handleAction}
                isLoading={isSubmitting}
                className="flex-1"
              >
                Konfirmasi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  )
}
