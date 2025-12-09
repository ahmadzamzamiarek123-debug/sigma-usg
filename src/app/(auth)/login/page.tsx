'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { SketchCard, SketchCardContent } from '@/components/sketch'
import { SketchButton } from '@/components/sketch'
import { SketchInput } from '@/components/sketch'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const result = await signIn('credentials', {
        identifier,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('NIM/ID atau password salah')
      } else {
        router.push('/user/dashboard')
        router.refresh()
      }
    } catch {
      setError('Terjadi kesalahan. Coba lagi.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 sketch-page"
      style={{ 
        fontFamily: "'Patrick Hand', 'Comic Neue', cursive",
        background: 'var(--sketch-bg)'
      }}
    >
      <SketchCard className="w-full max-w-sm" noPushpin>
        <SketchCardContent className="p-6 sm:p-8">
          {/* Logo */}
          <div className="text-center mb-6">
            <div className="text-5xl mb-2">✏️</div>
            <h1 
              className="text-xl sm:text-2xl font-bold text-[var(--sketch-text)]"
              style={{ fontFamily: "'Comic Neue', 'Patrick Hand', cursive" }}
            >
              Fintech Kampus
            </h1>
            <p className="text-sm text-[var(--sketch-text-muted)] mt-1">
              ~ Lo-Fi Campus Finance ~
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div 
              className="mb-4 p-3 text-sm text-center sketch-card"
              style={{ 
                background: 'rgba(194, 84, 80, 0.1)',
                borderColor: 'var(--sketch-danger)',
                color: 'var(--sketch-danger)'
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <SketchInput
              label="📝 NIM / ID Operator"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="contoh: 20230001"
              required
            />

            <SketchInput
              label="🔒 Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="masukkan password..."
              required
            />

            <SketchButton
              type="submit"
              variant="primary"
              className="w-full mt-6"
              isLoading={isLoading}
            >
              {isLoading ? 'Sedang masuk...' : '🚀 Masuk'}
            </SketchButton>
          </form>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t-2 border-dashed border-[var(--sketch-border-light)] text-center">
            <p className="text-xs text-[var(--sketch-text-muted)]">
              ✨ Hand-drawn UI Edition ✨
            </p>
          </div>
        </SketchCardContent>
      </SketchCard>
    </div>
  )
}
