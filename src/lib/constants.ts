// Daftar Program Studi yang tersedia
export const PRODI_LIST = [
  "TEKNIK INFORMATIKA",
  "SISTEM INFORMASI",
  "MANAJEMEN INFORMATIKA",
  "AKUNTANSI",
  "MANAJEMEN",
  "HUKUM",
  "ILMU KOMUNIKASI",
  "PENDIDIKAN AGAMA ISLAM",
  "PENDIDIKAN GURU SEKOLAH DASAR",
  "TEKNIK SIPIL",
] as const;

export type ProdiType = (typeof PRODI_LIST)[number];

// Daftar Angkatan yang tersedia
export const ANGKATAN_LIST = [
  "2020",
  "2021",
  "2022",
  "2023",
  "2024",
  "2025",
] as const;

export type AngkatanType = (typeof ANGKATAN_LIST)[number];

// Helper untuk dropdown options
export const PRODI_OPTIONS = PRODI_LIST.map((prodi) => ({
  value: prodi,
  label: prodi,
}));

export const ANGKATAN_OPTIONS = ANGKATAN_LIST.map((angkatan) => ({
  value: angkatan,
  label: `Angkatan ${angkatan}`,
}));
