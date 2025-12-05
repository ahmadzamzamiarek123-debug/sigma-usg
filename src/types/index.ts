// ============================================
// ROLE TYPES
// ============================================

export type Role = 'USER' | 'OPERATOR' | 'ADMIN'

export type TransactionType = 'TOPUP' | 'PAYMENT' | 'TRANSFER_IN' | 'TRANSFER_OUT'

export type TagihanJenis = 'KAS' | 'ACARA' | 'SEMINAR' | 'OTHER'

export type TopupStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

// ============================================
// SESSION TYPES
// ============================================

export interface SessionUser {
  id: string
  identifier: string
  name: string
  role: Role
  prodi: string | null
  angkatan: string | null
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

// ============================================
// ENTITY TYPES (simplified from Prisma)
// ============================================

export interface UserProfile {
  id: string
  identifier: string
  name: string
  role: Role
  prodi: string | null
  angkatan: string | null
  createdAt: Date
}

export interface BalanceInfo {
  balance: number
  updatedAt: Date
}

export interface TransactionRecord {
  id: string
  type: TransactionType
  amount: number
  balanceBefore: number
  balanceAfter: number
  description: string | null
  relatedUserName?: string
  createdAt: Date
}

export interface TagihanItem {
  id: string
  title: string
  description: string | null
  jenis: TagihanJenis
  prodiTarget: string | null
  angkatanTarget: string | null
  nominal: number
  deadline: Date
  isActive: boolean
  createdByName: string
  isPaid?: boolean
  paidAt?: Date | null
}

export interface TopupRequestItem {
  id: string
  amount: number
  status: TopupStatus
  evidenceUrl: string | null
  rejectionReason: string | null
  createdAt: Date
  validatedAt: Date | null
  userName?: string
  userProdi?: string
}

export interface PembayaranRecord {
  id: string
  tagihanTitle: string
  nominal: number
  status: PaymentStatus
  paidAt: Date | null
  createdAt: Date
}

// ============================================
// DASHBOARD STATS
// ============================================

export interface UserDashboardStats {
  balance: number
  pendingTopups: number
  unpaidTagihan: number
  recentTransactions: TransactionRecord[]
}

export interface OperatorDashboardStats {
  totalIncomeThisMonth: number
  activeTagihan: number
  paidCount: number
  unpaidCount: number
  recentPayments: PembayaranRecord[]
}

export interface AdminDashboardStats {
  totalUsers: number
  totalOperators: number
  totalBalance: number
  totalIncome: number
  pendingTopups: number
  recentAuditLogs: AuditLogItem[]
}

export interface AuditLogItem {
  id: string
  actorName: string
  actorRole: Role
  action: string
  detail: string
  createdAt: Date
}

// ============================================
// REPORT TYPES
// ============================================

export interface ReportFilter {
  prodi?: string
  jenis?: TagihanJenis
  startDate?: string
  endDate?: string
}

export interface ReportSummary {
  totalIncome: number
  totalTransactions: number
  byJenis: {
    jenis: TagihanJenis
    count: number
    total: number
  }[]
  byProdi?: {
    prodi: string
    count: number
    total: number
  }[]
}
