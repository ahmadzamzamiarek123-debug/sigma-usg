'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Select } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { formatRupiah, formatDate } from '@/lib/utils'

interface Tagihan {
  id: string
  title: string
  description: string | null
  jenis: string
  prodiTarget: string | null
  angkatanTarget: string | null
  nominal: number
  deadline: string
  isActive: boolean
  paidCount: number
  totalPembayaran: number
  createdAt: string
}

export default function OperatorTagihanPage() {
  const { data: session } = useSession()
  const [tagihan, setTagihan] = useState<Tagihan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  // Form state
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [jenis, setJenis] = useState('KAS')
  const [angkatanTarget, setAngkatanTarget] = useState('')
  const [nominal, setNominal] = useState('')
  const [deadline, setDeadline] = useState('')

  useEffect(() => {
    fetchTagihan()
  }, [])

  async function fetchTagihan() {
    try {
      const res = await fetch('/api/operator/tagihan')
      const data = await res.json()
      setTagihan(data.data || [])
    } catch (error) {
      console.error('Error fetching tagihan:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setJenis('KAS')
    setAngkatanTarget('')
    setNominal('')
    setDeadline('')
  }

  async function handleCreateTagihan(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setResult(null)

    try {
      const res = await fetch('/api/operator/tagihan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description || undefined,
          jenis,
          angkatanTarget: angkatanTarget || null,
          nominal: Number(nominal),
          deadline,
        }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: 'Tagihan berhasil dibuat' })
        resetForm()
        setShowCreateModal(false)
        fetchTagihan()
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const jenisOptions = [
    { value: 'KAS', label: 'Kas' },
    { value: 'ACARA', label: 'Acara' },
    { value: 'SEMINAR', label: 'Seminar' },
    { value: 'OTHER', label: 'Lainnya' },
  ]

  const angkatanOptions = [
    { value: '', label: 'Semua Angkatan' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' },
    { value: '2022', label: '2022' },
    { value: '2021', label: '2021' },
  ]

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
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded-2xl"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kelola Tagihan</h1>
          <p className="text-gray-500 mt-1">
            Buat dan kelola tagihan untuk prodi {session?.user?.prodi}
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Buat Tagihan
        </Button>
      </div>

      {/* Result Message */}
      {result && (
        <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
          {result.message}
        </div>
      )}

      {/* Tagihan List */}
      {tagihan.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-gray-500">Belum ada tagihan</p>
            <Button onClick={() => setShowCreateModal(true)} className="mt-4">
              Buat Tagihan Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tagihan.map((t) => (
            <Card key={t.id} className="hover:shadow-xl transition-all">
              <CardContent className="py-5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${jenisColors[t.jenis]}`}>
                    {t.jenis}
                  </span>
                  <Badge variant={t.isActive ? 'success' : 'default'}>
                    {t.isActive ? 'Aktif' : 'Nonaktif'}
                  </Badge>
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{t.title}</h3>
                {t.description && (
                  <p className="text-sm text-gray-500 mb-3 line-clamp-2">{t.description}</p>
                )}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xl font-bold text-indigo-600">{formatRupiah(t.nominal)}</span>
                </div>
                <div className="space-y-1 text-sm text-gray-500">
                  <p>Target: {t.angkatanTarget || 'Semua angkatan'}</p>
                  <p>Deadline: {formatDate(t.deadline)}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Sudah Bayar</span>
                    <span className="font-semibold text-green-600">{t.paidCount} orang</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Buat Tagihan Baru" size="lg">
        <form onSubmit={handleCreateTagihan} className="space-y-4">
          <Input
            label="Judul Tagihan"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Kas Mingguan - Desember 2024"
            required
          />
          
          <Textarea
            label="Deskripsi (opsional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Keterangan tambahan tentang tagihan"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Jenis Tagihan"
              value={jenis}
              onChange={(e) => setJenis(e.target.value)}
              options={jenisOptions}
            />
            <Select
              label="Target Angkatan"
              value={angkatanTarget}
              onChange={(e) => setAngkatanTarget(e.target.value)}
              options={angkatanOptions}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nominal (Rp)"
              type="number"
              value={nominal}
              onChange={(e) => setNominal(e.target.value)}
              placeholder="Contoh: 50000"
              required
            />
            <Input
              label="Deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)} className="flex-1">
              Batal
            </Button>
            <Button type="submit" isLoading={isSubmitting} className="flex-1">
              Buat Tagihan
            </Button>
          </div>
        </form>
      </Modal>
    </DashboardLayout>
  )
}
