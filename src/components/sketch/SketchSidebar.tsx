'use client'

import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

interface SketchSidebarProps {
  isOpen: boolean
  onClose: () => void
}

interface NavItem {
  label: string
  href: string
  icon: string
}

const userNav: NavItem[] = [
  { label: '📊 Dashboard', href: '/user/dashboard', icon: '📊' },
  { label: '💳 Bayar Tagihan', href: '/user/bayar', icon: '💳' },
  { label: '🔄 Transfer', href: '/user/transfer', icon: '🔄' },
  { label: '📜 Riwayat', href: '/user/riwayat', icon: '📜' },
  { label: '🏛️ Saldo Prodi', href: '/user/saldo-prodi', icon: '🏛️' },
]

const operatorNav: NavItem[] = [
  { label: '📊 Dashboard', href: '/operator/dashboard', icon: '📊' },
  { label: '📋 Kelola Tagihan', href: '/operator/tagihan', icon: '📋' },
  { label: '💰 Pengeluaran', href: '/operator/pengeluaran', icon: '💰' },
  { label: '📈 Laporan', href: '/operator/laporan', icon: '📈' },
]

const adminNav: NavItem[] = [
  { label: '📊 Dashboard', href: '/admin/dashboard', icon: '📊' },
  { label: '👥 Kelola Users', href: '/admin/users', icon: '👥' },
  { label: '🧑‍💼 Kelola Operator', href: '/admin/operators', icon: '🧑‍💼' },
  { label: '💵 Validasi Top-up', href: '/admin/topup', icon: '💵' },
  { label: '📜 Audit Log', href: '/admin/audit', icon: '📜' },
]

export function SketchSidebar({ isOpen, onClose }: SketchSidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const navItems = role === 'ADMIN' ? adminNav : role === 'OPERATOR' ? operatorNav : userNav
  const roleLabel = role === 'ADMIN' ? '🔐 Admin' : role === 'OPERATOR' ? '🔧 Operator' : '🎓 Mahasiswa'

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 sketch-sidebar transform transition-transform duration-200',
          'flex flex-col',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
        style={{ fontFamily: "'Patrick Hand', 'Comic Neue', cursive" }}
      >
        {/* Header */}
        <div className="p-4 border-b-2 border-dashed border-[var(--sketch-border-light)]">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold" style={{ fontFamily: "'Comic Neue', cursive" }}>
              ✏️ Fintech Kampus
            </h1>
            <button 
              onClick={onClose}
              className="md:hidden text-xl"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-[var(--sketch-text-muted)] mt-1">{roleLabel}</p>
        </div>

        {/* User Info */}
        <div className="p-4 border-b-2 border-dashed border-[var(--sketch-border-light)]">
          <div className="sketch-card p-3" style={{ borderStyle: 'dashed' }}>
            <p className="font-bold text-sm truncate">👤 {session?.user?.name}</p>
            <p className="text-xs text-[var(--sketch-text-muted)] font-mono">{session?.user?.identifier}</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => onClose()}
                    className={cn(
                      'sketch-sidebar-link block text-sm',
                      isActive && 'active'
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-4 border-t-2 border-dashed border-[var(--sketch-border-light)]">
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="sketch-btn sketch-btn-outline w-full text-sm"
            style={{ borderStyle: 'dashed' }}
          >
            🚪 Logout
          </button>
        </div>
      </aside>
    </>
  )
}
