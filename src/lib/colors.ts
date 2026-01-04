// Chart color utilities and constants

export const ChartColors = {
  chartGrid: "#374151", // gray-700
  chartLine: "#818CF8", // indigo-400
  chartArea: "rgba(129, 140, 248, 0.2)",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",
  active: "#10B981", // green for active status
  inactive: "#6B7280", // gray for inactive status
};

// Prodi-specific colors for charts
const PRODI_COLORS: Record<string, string> = {
  "SISTEM INFORMASI": "#6366F1", // indigo
  "TEKNIK INFORMATIKA": "#10B981", // emerald
  "MANAJEMEN INFORMATIKA": "#F59E0B", // amber
  AKUNTANSI: "#EC4899", // pink
  MANAJEMEN: "#8B5CF6", // violet
  HUKUM: "#14B8A6", // teal
  PENDIDIKAN: "#F97316", // orange
};

// Default colors for unknown prodi
const DEFAULT_COLORS = [
  "#6366F1",
  "#10B981",
  "#F59E0B",
  "#EC4899",
  "#8B5CF6",
  "#14B8A6",
  "#F97316",
  "#EF4444",
];

export function getProdiColor(prodi: string): string {
  if (PRODI_COLORS[prodi]) {
    return PRODI_COLORS[prodi];
  }
  // Generate consistent color for unknown prodi
  const hash = prodi
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return DEFAULT_COLORS[hash % DEFAULT_COLORS.length];
}
