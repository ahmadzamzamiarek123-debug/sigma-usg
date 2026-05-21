import { cn, getStatusColor } from '@/lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variants = {
    default: 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
  }

  return (
    <span
      className={cn(
        'badge',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  )
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusLabels: Record<string, string> = {
    PENDING: 'Menunggu',
    APPROVED: 'Disetujui',
    REJECTED: 'Ditolak',
    SUCCESS: 'Berhasil',
    FAILED: 'Gagal',
  }

  return (
    <span
      className={cn(
        'badge',
        getStatusColor(status),
        className
      )}
    >
      {statusLabels[status] || status}
    </span>
  )
}
