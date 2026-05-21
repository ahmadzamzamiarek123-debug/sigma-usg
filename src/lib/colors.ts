// Chart color utilities and constants

export const ChartColors = {
  chartGrid: "var(--border-secondary)",
  chartLine: "var(--color-info)",
  chartArea: "var(--color-info-light)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  info: "var(--color-info)",
  active: "var(--color-success)",
  inactive: "var(--text-muted)",
};

// Prodi-specific colors for charts
const PRODI_COLORS: Record<string, string> = {
  "SISTEM INFORMASI": "#6366F1", // indigo
  "TEKNIK INFORMATIKA": "#10B981", // emerald
  "MANAJEMEN INFORMATIKA": "#F59E0B", // amber
  "AKUNTANSI": "#EC4899", // pink
  "MANAJEMEN": "#8B5CF6", // violet
  "HUKUM": "#14B8A6", // teal
  "PENDIDIKAN": "#F97316", // orange
  "ILMU KOMUNIKASI": "#0EA5E9", // light blue
  "PENDIDIKAN AGAMA ISLAM": "#84CC16", // lime
  "PENDIDIKAN GURU SEKOLAH DASAR": "#EAB308", // yellow
  "TEKNIK SIPIL": "#64748B", // gray
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
