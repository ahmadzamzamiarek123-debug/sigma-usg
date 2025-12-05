'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { detectRole, getRedirectPath } from '@/lib/utils'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const detectedRole = identifier ? detectRole(identifier) : null
  const roleLabels: Record<string, string> = {
    USER: 'Mahasiswa',
    OPERATOR: 'Operator',
    ADMIN: 'Administrator',
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const role = detectRole(identifier)
      if (!role) {
        setError('Format identifier tidak valid')
        setIsLoading(false)
        return
      }

      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Identifier atau password salah')
      } else {
        router.push(getRedirectPath(role))
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan, coba lagi')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm mx-auto">
        {/* Logo */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <svg className="w-8 h-8 sm:w-9 sm:h-9 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="mt-4 text-xl sm:text-2xl font-bold text-gray-900">Fintech Kampus</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Sistem Keuangan Internal</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            <Input
              label="NIM / Kode Operator"
              type="text"
              placeholder="Masukkan NIM atau kode"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
            />

            <Input
              label="Password"
              type="password"
              placeholder="Masukkan password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            {/* Role Detection Badge */}
            {detectedRole && (
              <div className="flex items-center justify-center">
                <span className="px-3 py-1.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 border border-indigo-200">
                  Login sebagai {roleLabels[detectedRole]}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="p-3 sm:p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-xs sm:text-sm flex items-center gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="w-full py-3 text-sm sm:text-base"
              isLoading={isLoading}
              disabled={!identifier || !password}
            >
              {isLoading ? 'Memproses...' : 'Masuk'}
            </Button>
          </form>

          {/* Help Text */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-gray-200">
            <p className="text-center text-xs text-gray-500">
              Format: NIM (8 digit), OP-XX-XXXX, atau ADM-XX-XXXX
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
