import { z } from 'zod'

// ============================================
// AUTH SCHEMAS
// ============================================

export const loginSchema = z.object({
  identifier: z
    .string()
    .min(1, 'Identifier tidak boleh kosong')
    .refine(
      (val) => {
        // NIM: 8 digit angka
        // Operator: OP-XX-XXXX
        // Admin: ADM-XX-XXXX
        const isNIM = /^\d{8}$/.test(val)
        const isOperator = /^OP-[A-Z]{2,3}-\d{4}$/.test(val)
        const isAdmin = /^ADM-\d{2}-\d{4}$/.test(val)
        return isNIM || isOperator || isAdmin
      },
      { message: 'Format identifier tidak valid' }
    ),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export type LoginInput = z.infer<typeof loginSchema>

// ============================================
// USER SCHEMAS
// ============================================

export const transferSchema = z.object({
  toNim: z
    .string()
    .regex(/^\d{8}$/, 'NIM tujuan harus 8 digit angka'),
  amount: z
    .number()
    .positive('Nominal harus lebih dari 0')
    .max(10000000, 'Maksimal transfer Rp 10.000.000'),
  pin: z.string().length(6, 'PIN harus 6 digit'),
})

export type TransferInput = z.infer<typeof transferSchema>

export const topupRequestSchema = z.object({
  amount: z
    .number()
    .positive('Nominal harus lebih dari 0')
    .min(10000, 'Minimal top-up Rp 10.000')
    .max(10000000, 'Maksimal top-up Rp 10.000.000'),
})

export type TopupRequestInput = z.infer<typeof topupRequestSchema>

export const paymentSchema = z.object({
  tagihanId: z.string().min(1, 'ID tagihan tidak valid'),
  pin: z.string().length(6, 'PIN harus 6 digit'),
})

export type PaymentInput = z.infer<typeof paymentSchema>

export const updateProfileSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').optional(),
  currentPassword: z.string().min(6).optional(),
  newPassword: z.string().min(6, 'Password baru minimal 6 karakter').optional(),
  currentPin: z.string().length(6).optional(),
  newPin: z.string().length(6, 'PIN baru harus 6 digit').optional(),
})

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>

// ============================================
// OPERATOR SCHEMAS
// ============================================

export const createTagihanSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().optional(),
  jenis: z.enum(['KAS', 'ACARA', 'SEMINAR', 'OTHER']),
  prodiTarget: z.string().optional().nullable(),
  angkatanTarget: z.string().optional().nullable(),
  nominal: z
    .number()
    .positive('Nominal harus lebih dari 0')
    .max(10000000, 'Maksimal Rp 10.000.000'),
  deadline: z.string().or(z.date()),
})

export type CreateTagihanInput = z.infer<typeof createTagihanSchema>

export const updateTagihanSchema = createTagihanSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export type UpdateTagihanInput = z.infer<typeof updateTagihanSchema>

// ============================================
// ADMIN SCHEMAS
// ============================================

export const createOperatorSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  prodi: z.string().min(2, 'Prodi harus diisi'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
})

export type CreateOperatorInput = z.infer<typeof createOperatorSchema>

export const topupActionSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT']),
  reason: z.string().optional(), // Required when rejecting
})

export type TopupActionInput = z.infer<typeof topupActionSchema>

// ============================================
// COMMON QUERY SCHEMAS
// ============================================

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
})

export type PaginationInput = z.infer<typeof paginationSchema>

export const dateRangeSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
})

export type DateRangeInput = z.infer<typeof dateRangeSchema>
