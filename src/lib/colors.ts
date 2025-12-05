// Chart Colors - Konsisten di seluruh dashboard

export const ChartColors = {
  // Transaction Types
  topup: "#FFD700",       // Kuning
  payment: "#FF4D4D",     // Merah
  transfer_out: "#A855F7", // Ungu
  transfer_in: "#3B82F6",  // Biru

  // Prodi Colors
  TI: "#FACC15",    // Kuning
  SI: "#3B82F6",    // Biru
  MI: "#10B981",    // Hijau
  Agro: "#EF4444",  // Merah
  Hukum: "#6366F1", // Indigo
  Ekonomi: "#14B8A6", // Teal
  default: "#8B5CF6", // Ungu

  // Status Colors
  active: "#22C55E",   // Hijau
  inactive: "#EF4444", // Merah
  pending: "#F59E0B",  // Kuning

  // Chart Background
  chartBg: "#1F2937",
  chartGrid: "#374151",
} as const

export const TransactionTypeLabels: Record<string, string> = {
  TOPUP: "Top-up",
  PAYMENT: "Bayar Tagihan",
  TRANSFER_OUT: "Transfer Keluar",
  TRANSFER_IN: "Transfer Masuk",
}

export function getProdiColor(prodi: string): string {
  const colors = ChartColors as Record<string, string>
  return colors[prodi] || ChartColors.default
}

export function getTransactionColor(type: string): string {
  const typeMap: Record<string, string> = {
    TOPUP: ChartColors.topup,
    PAYMENT: ChartColors.payment,
    TRANSFER_OUT: ChartColors.transfer_out,
    TRANSFER_IN: ChartColors.transfer_in,
  }
  return typeMap[type] || ChartColors.default
}
