import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Role } from '@/types'

// ============================================
// TAILWIND UTILITY
// ============================================

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ============================================
// ROLE DETECTION
// ============================================

export function detectRole(identifier: string): Role | null {
  // NIM: 8 digit angka
  if (/^\d{8}$/.test(identifier)) {
    return 'USER'
  }
  // Operator: OP-XX-XXXX (e.g., OP-TI-2401)
  if (/^OP-[A-Z]{2,3}-\d{4}$/.test(identifier)) {
    return 'OPERATOR'
  }
  // Admin: ADM-XX-XXXX (e.g., ADM-00-2401)
  if (/^ADM-\d{2}-\d{4}$/.test(identifier)) {
    return 'ADMIN'
  }
  return null
}

export function getRedirectPath(role: Role): string {
  switch (role) {
    case 'USER':
      return '/user/dashboard'
    case 'OPERATOR':
      return '/operator/dashboard'
    case 'ADMIN':
      return '/admin/dashboard'
    default:
      return '/login'
  }
}

// ============================================
// FORMAT UTILITIES
// ============================================

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d)
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d)
}

// ============================================
// OPERATOR CODE GENERATOR
// ============================================

export function generateOperatorCode(prodi: string): string {
  const prodiCode = prodi.toUpperCase().slice(0, 3)
  const year = new Date().getFullYear()
  const yearCode = year.toString().slice(-2)
  const seqCode = Math.floor(Math.random() * 99 + 1).toString().padStart(2, '0')
  return `OP-${prodiCode}-${yearCode}${seqCode}`
}

// ============================================
// STATUS HELPERS
// ============================================

export function getStatusColor(status: string): string {
  switch (status) {
    case 'SUCCESS':
    case 'APPROVED':
      return 'text-green-600 bg-green-100'
    case 'PENDING':
      return 'text-yellow-600 bg-yellow-100'
    case 'FAILED':
    case 'REJECTED':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

export function getTransactionTypeColor(type: string): string {
  switch (type) {
    case 'TOPUP':
      return 'text-green-600'
    case 'TRANSFER_IN':
      return 'text-blue-600'
    case 'TRANSFER_OUT':
      return 'text-orange-600'
    case 'PAYMENT':
      return 'text-purple-600'
    default:
      return 'text-gray-600'
  }
}

export function getTransactionSign(type: string): string {
  switch (type) {
    case 'TOPUP':
    case 'TRANSFER_IN':
      return '+'
    case 'TRANSFER_OUT':
    case 'PAYMENT':
      return '-'
    default:
      return ''
  }
}

// ============================================
// DEADLINE CHECK
// ============================================

export function isDeadlineNear(deadline: Date | string, daysThreshold = 3): boolean {
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline
  const now = new Date()
  const diffTime = d.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays <= daysThreshold && diffDays >= 0
}

export function isDeadlinePassed(deadline: Date | string): boolean {
  const d = typeof deadline === 'string' ? new Date(deadline) : deadline
  return d < new Date()
}
