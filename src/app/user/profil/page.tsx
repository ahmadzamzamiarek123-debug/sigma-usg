'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate } from '@/lib/utils'

export default function ProfilPage() {
  const { data: session, update } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'pin'>('profile')
  
  // Password form
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  // PIN form
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    
    if (newPassword !== confirmPassword) {
      setResult({ success: false, message: 'Password baru tidak sama' })
      return
    }
    
    if (newPassword.length < 6) {
      setResult({ success: false, message: 'Password minimal 6 karakter' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: 'Password berhasil diubah' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setIsLoading(false)
    }
  }

  async function handlePinChange(e: React.FormEvent) {
    e.preventDefault()
    
    if (newPin !== confirmPin) {
      setResult({ success: false, message: 'PIN baru tidak sama' })
      return
    }
    
    if (newPin.length !== 6) {
      setResult({ success: false, message: 'PIN harus 6 digit' })
      return
    }

    setIsLoading(true)
    setResult(null)

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPin, newPin }),
      })

      const data = await res.json()

      if (data.success) {
        setResult({ success: true, message: 'PIN berhasil diubah' })
        setCurrentPin('')
        setNewPin('')
        setConfirmPin('')
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch {
      setResult({ success: false, message: 'Terjadi kesalahan' })
    } finally {
      setIsLoading(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profil' },
    { id: 'password', label: 'Ubah Password' },
    { id: 'pin', label: 'Ubah PIN' },
  ]

  return (
    <DashboardLayout>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Profil Saya</h1>
        <p className="text-gray-500 mt-1">Kelola informasi akun dan keamanan</p>
      </div>

      {/* Profile Card */}
      <Card variant="gradient" className="mb-8">
        <CardContent className="py-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold text-white">
              {session?.user?.name?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{session?.user?.name}</h2>
              <p className="text-white/80">{session?.user?.identifier}</p>
              <p className="text-white/60 text-sm mt-1">
                {session?.user?.prodi} • Angkatan {session?.user?.angkatan}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as typeof activeTab)
              setResult(null)
            }}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <Card className="max-w-lg">
        <CardContent className="py-6">
          {/* Result Message */}
          {result && (
            <div className={`mb-6 p-4 rounded-xl ${result.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {result.message}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">NIM</label>
                <p className="text-lg font-medium text-gray-900">{session?.user?.identifier}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nama</label>
                <p className="text-lg font-medium text-gray-900">{session?.user?.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Program Studi</label>
                <p className="text-lg font-medium text-gray-900">{session?.user?.prodi}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Angkatan</label>
                <p className="text-lg font-medium text-gray-900">{session?.user?.angkatan}</p>
              </div>
            </div>
          )}

          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <Input
                label="Password Saat Ini"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
              <Input
                label="Password Baru"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
              <Input
                label="Konfirmasi Password Baru"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                Ubah Password
              </Button>
            </form>
          )}

          {activeTab === 'pin' && (
            <form onSubmit={handlePinChange} className="space-y-4">
              <Input
                label="PIN Saat Ini"
                type="password"
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                maxLength={6}
                required
              />
              <Input
                label="PIN Baru (6 digit)"
                type="password"
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                maxLength={6}
                required
              />
              <Input
                label="Konfirmasi PIN Baru"
                type="password"
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                maxLength={6}
                required
              />
              <Button type="submit" isLoading={isLoading} className="w-full">
                Ubah PIN
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
