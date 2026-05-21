# 🔧 Bug Fix Plan — Fintech Kampus (SIGMA)

Laporan lengkap semua bug yang ditemukan di seluruh proyek, mencakup **3 role** (Admin, Operator, User), **shared components**, **global CSS**, dan **API routes**.

---

## Ringkasan Temuan

| Kategori | Jumlah Bug | Severity |
|----------|-----------|----------|
| 🎨 Theme/Dark Mode tidak sinkron | **90+** instance | 🔴 Critical |
| 🧩 Shared Components tidak theme-aware | **7** komponen | 🔴 Critical |
| 📊 Chart/Diagram warna hardcoded | **5** komponen | 🟡 Medium |
| ⚡ Functional bugs (API, logic) | **38** issue | 🔴 Critical |
| 📱 Layout/Responsive issues | **15+** issue | 🟡 Medium |
| 🔒 Security issues | **5** issue | 🔴 Critical |
| 🏗️ Performance issues | **8** issue | 🟡 Medium |

---

## 🔴 MASALAH UTAMA: Dua Sistem Theme yang Bertabrakan

> [!CAUTION]
> Ini adalah ROOT CAUSE dari hampir semua bug visual. Project memiliki **CSS variables yang sudah didefinisikan dengan baik** di `globals.css`, tetapi **hampir semua komponen dan halaman TIDAK menggunakannya**. Sebagai gantinya, mereka menggunakan 3 pendekatan berbeda yang tidak konsisten.

| Pendekatan | Dipakai Oleh | Masalah |
|-----------|-------------|---------|
| **CSS Variables** (`var(--bg-primary)`) | `globals.css` classes, `DashboardLayout`, `Sidebar`, Login page | ✅ Bekerja dengan baik |
| **Tailwind `dark:` prefix** (`dark:bg-gray-800`) | `Card.tsx`, `StatsCard.tsx`, Chart components, beberapa page | 🟡 Bekerja tapi warna berbeda dari CSS vars |
| **Hardcoded tanpa dark mode** (`bg-white`, `text-gray-900`) | `Badge.tsx`, `Button.tsx`, `Input.tsx`, `Modal.tsx`, mayoritas page | 🔴 RUSAK total di dark mode |

---

## Proposed Changes

### Kategori 1: Unifikasi Sistem Theme

> [!IMPORTANT]
> Semua perubahan harus menggunakan CSS variables yang sudah ada di `globals.css`. Tidak boleh ada lagi `isDark ? '#hex1' : '#hex2'` atau hardcoded Tailwind colors tanpa `dark:` variant.

---

#### [MODIFY] [globals.css](file:///d:/Fintech/fintech-kampus/src/app/globals.css)

**Bug yang ditemukan:**

1. **Line 204**: `.btn-danger:hover` menggunakan hardcoded `#b91c1c` — seharusnya CSS variable
2. **Lines 309-330**: Dark mode table overrides menggunakan hardcoded hex (`#1f2937`, `#374151`, `#f3f4f6`) alih-alih CSS variables yang sudah ada
3. **Lines 546-548**: Dark sidebar duplikat dan hardcoded hex
4. **Lines 554-572**: Dark card/stats/input overrides semua hardcoded hex alih-alih CSS variables
5. **Lines 372-375 & 541-544**: `.sidebar` didefinisikan **DUA KALI** — aturan duplikat
6. **Line 365**: `.badge-accent` background menggunakan hardcoded `rgba(245, 166, 35, 0.15)`
7. **Line 82-84**: `color-scheme: light` hardcoded — seharusnya responsif terhadap theme
8. **Missing**: Tidak ada CSS classes untuk loading skeleton, alert/result messages, dan beberapa utility yang sering dipakai inline

**Perubahan yang diperlukan:**
- Hapus duplikasi `.sidebar`
- Ganti semua hardcoded hex di dark mode overrides dengan CSS variables
- Tambah CSS class baru: `.skeleton`, `.alert-success`, `.alert-danger`, `.alert-warning`
- Tambah CSS variable untuk: `--color-accent-bg` (untuk badge accent), loading skeleton colors
- Pastikan `color-scheme` responsif

---

#### [MODIFY] [layout.tsx](file:///d:/Fintech/fintech-kampus/src/app/layout.tsx)

**Bug yang ditemukan:**

1. **Line 24**: Body class `bg-gray-50 text-gray-900` — hardcoded Tailwind yang **meng-override** CSS variable body styles dari `globals.css`
2. **Line 22**: `<html lang="id">` **TIDAK** punya `suppressHydrationWarning` — menyebabkan hydration mismatch warning ketika `useTheme` menambahkan class `dark`

**Perubahan yang diperlukan:**
- Hapus `bg-gray-50 text-gray-900` dari body class (biarkan CSS variables dari `globals.css` yang mengatur)
- Tambah `suppressHydrationWarning` pada tag `<html>`

---

#### [MODIFY] [useTheme.ts](file:///d:/Fintech/fintech-kampus/src/lib/useTheme.ts)

**Bug yang ditemukan:**

1. **Line 6**: Initial state selalu `'light'` — menyebabkan flash of light content jika user preference-nya dark
2. **Tidak ada SSR safety script** di `<head>` untuk set theme class sebelum hydration → FOUC (Flash of Unstyled Content)
3. **Multiple instances problem**: Setiap komponen yang pakai `useTheme()` buat state independen. Jika ada 2 ThemeToggle (mobile + desktop), klik satu tidak update state yang lain

**Perubahan yang diperlukan:**
- Tambah inline script di layout.tsx `<head>` untuk deteksi theme sebelum hydration
- Gunakan `useSyncExternalStore` atau state management yang di-share agar semua ThemeToggle sinkron
- Default ke system preference (`prefers-color-scheme`)

---

#### [MODIFY] [colors.ts](file:///d:/Fintech/fintech-kampus/src/lib/colors.ts)

**Bug yang ditemukan:**

1. **Line 4**: `chartGrid: "#374151"` — hardcoded gray-700, hanya cocok untuk dark mode
2. **Semua chart colors** hardcoded hex — tidak adapt ke light/dark theme
3. **Missing prodi colors**: `constants.ts` define 10 prodi tapi `PRODI_COLORS` hanya punya 7 entry. Missing: ILMU KOMUNIKASI, PENDIDIKAN AGAMA ISLAM, PENDIDIKAN GURU SEKOLAH DASAR, TEKNIK SIPIL

**Perubahan yang diperlukan:**
- Sediakan variant warna chart untuk light DAN dark mode
- Lengkapi mapping PRODI_COLORS untuk semua 10 prodi
- Gunakan CSS variables di mana memungkinkan

---

#### [MODIFY] [utils.ts](file:///d:/Fintech/fintech-kampus/src/lib/utils.ts)

**Bug yang ditemukan:**

1. **Lines 95-108**: `getStatusColor()` mengembalikan hardcoded light-mode Tailwind classes (`bg-green-100 text-green-600`) — tanpa dark mode variant
2. **Lines 110-123**: `getTransactionTypeColor()` — sama, hardcoded tanpa dark mode

**Perubahan yang diperlukan:**
- Ganti return values dengan CSS classes dari `globals.css` (`.badge-success`, `.badge-danger`, dll.) yang sudah theme-aware
- Atau tambahkan `dark:` variants ke semua return values

---

### Kategori 2: Fix Bug di Role ADMIN (5 Halaman)

---

#### [MODIFY] [admin/dashboard/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/admin/dashboard/page.tsx)

**🔴 DARK MODE: COMPLETELY MISSING — ~25+ elemen hardcoded**

| Line | Bug | Severity |
|------|-----|----------|
| 91, 96 | `bg-gray-200` skeleton tanpa `dark:` | 🔴 |
| 109 | `text-gray-900` — tidak terbaca di dark mode | 🔴 |
| 112 | `text-gray-500` — tanpa dark variant | 🔴 |
| 130, 156, 184, 231, 328 | `bg-white border-gray-100` — card putih polos | 🔴 |
| 148, 150, 178, 204 | `text-gray-900` — tidak terbaca di dark mode | 🔴 |
| 233, 240, 258, 287, 316 | Header, hover, text tanpa dark mode | 🔴 |
| 347, 349, 356 | Badge dan text hardcoded | 🔴 |

**Functional bugs:**
- Tidak ada abort controller di useEffect untuk cleanup
- Tidak ada error state ditampilkan ke user (hanya console.error)
- Loading state tidak menampilkan skeleton yang proper

**Perubahan yang diperlukan:**
- Ganti semua hardcoded colors dengan CSS variables/classes dari `globals.css`
- Gunakan class `.card`, `.stats-card`, `.badge-*`, `.table-wrapper`, `.table` yang sudah ada
- Tambah error state UI
- Tambah abort controller

---

#### [MODIFY] [admin/audit/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/admin/audit/page.tsx)

**🔴 DARK MODE: COMPLETELY MISSING — ~15+ elemen hardcoded**

| Line | Bug | Severity |
|------|-----|----------|
| 88, 89 | Title/subtitle `text-gray-900`/`text-gray-500` tanpa dark | 🔴 |
| 121 | `bg-gray-50` table header tanpa dark | 🔴 |
| 123-127 | Semua `text-gray-500` tanpa dark | 🔴 |
| 130 | `divide-gray-100` tanpa dark | 🔴 |
| 147, 148, 153, 163, 166, 177 | Text colors tanpa dark | 🔴 |
| 190, 191 | Border dan text hardcoded | 🔴 |
| 63-67 | `roleColors` badge hardcoded tanpa dark | 🟡 |

**Layout bugs:**
- Header `text-2xl` fixed — tidak responsive (harusnya `text-lg sm:text-xl md:text-2xl`)
- Filter row `w-64` hardcoded width tanpa `flex-wrap` — overflow di mobile

**Perubahan yang diperlukan:**
- Ganti ke CSS class `.table-wrapper`, `.table`, `.badge-*` dari `globals.css`
- Buat responsive header dan filter layout
- Tambah `overflow-x: auto` pada table container

---

#### [MODIFY] [admin/operators/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/admin/operators/page.tsx)

**🔴 DARK MODE: ALMOST COMPLETELY MISSING**

| Line | Bug | Severity |
|------|-----|----------|
| 133, 136 | Title `text-gray-900`, subtitle `text-gray-500` | 🔴 |
| 180 | Skeleton `bg-gray-200` tanpa dark | 🔴 |
| 221-225 | **Inline style** gradient avatar — tidak bisa di-override theme | 🟡 |
| 251-258 | **Inline style** status badge pakai `ChartColors` — tidak theme-aware | 🔴 |
| 122-126 | `prodiColors` badge hardcoded tanpa dark | 🟡 |
| 230, 233, 264, 332 | Text colors tanpa dark | 🔴 |

**Functional bugs:**
- Tidak ada confirmation dialog sebelum delete
- API error tidak di-handle (empty list tanpa error message)
- Password handling saat edit bisa kirim empty string

**Perubahan yang diperlukan:**
- Ganti inline styles dengan CSS classes
- Tambah confirmation dialog untuk delete
- Tambah error handling UI
- Validasi password field saat edit mode

---

#### [MODIFY] [admin/topup/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/admin/topup/page.tsx)

**🔴 DARK MODE: COMPLETELY MISSING**

| Line | Bug | Severity |
|------|-----|----------|
| 102, 103 | Title/subtitle tanpa dark | 🔴 |
| 112-116 | Filter tabs hardcoded (`bg-indigo-600` / `bg-gray-100`) | 🔴 |
| 134 | `bg-gray-50` table header tanpa dark | 🔴 |
| 136-142, 147, 160-164 | Text/hover colors tanpa dark | 🔴 |
| 175, 200, 202, 206, 210, 214, 218 | Modal, info, text tanpa dark | 🔴 |

**Functional bugs:**
- Tidak ada confirmation dialog sebelum reject
- Filter tidak reset pagination saat berubah
- **Line 90**: `pendingCount` variable defined tapi TIDAK PERNAH dipakai (dead code)
- **Line 7**: `Input` di-import tapi TIDAK dipakai (unused import)

**Perubahan yang diperlukan:**
- Ganti semua ke CSS classes dari `globals.css`
- Hapus dead code (`pendingCount`, unused `Input` import)
- Tambah pagination reset saat filter berubah
- Tambah confirmation dialog untuk reject

---

#### [MODIFY] [admin/users/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/admin/users/page.tsx)

**🟡 DARK MODE: PARTIALLY IMPLEMENTED — Paling inkonsisten!**

Table area punya `dark:` variants, tapi **semua yang di luar table TIDAK punya**:

| Line | Bug | Severity |
|------|-----|----------|
| 189 | Title `text-gray-900` tanpa dark | 🔴 |
| 192 | Subtitle `text-gray-500` tanpa dark | 🔴 |
| 218 | Filter card `bg-white border-gray-100` tanpa dark | 🔴 |
| 257-261 | Result message `bg-green-50`/`bg-red-50` tanpa dark | 🔴 |
| 381-382 | Pagination tanpa dark | 🔴 |
| 478 | Warning `bg-yellow-50` tanpa dark | 🔴 |
| 541-558 | Modal info card tanpa dark | 🔴 |

**Inkonsistensi visual yang sangat mengganggu** — table gelap tapi header, filter, dan modal terang. UX sangat buruk.

**Functional bugs:**
- Delete tanpa confirmation dialog
- Search hanya filter `name` dan `email`, TIDAK bisa search NIM/prodi
- Password field saat edit bisa kirim empty string
- Tidak ada client-side form validation

**Perubahan yang diperlukan:**
- Konsistenkan semua elemen dengan CSS variables
- Tambah search untuk NIM dan prodi
- Tambah confirmation dialog delete
- Tambah form validation

---

### Kategori 3: Fix Bug di Role OPERATOR (6 Halaman)

---

#### [MODIFY] [operator/dashboard/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/operator/dashboard/page.tsx)

**Bug yang ditemukan:**

| Line | Bug | Severity |
|------|-----|----------|
| 137, 153, 169 | Cards pakai `bg-white dark:bg-gray-800` — inkonsisten dengan CSS vars | 🟡 |
| — | Missing error UI state — jika API fail, tampil kosong tanpa pesan | 🔴 |

**Perubahan yang diperlukan:**
- Ganti Tailwind `dark:` variant dengan CSS variable classes
- Tambah error state UI

---

#### [MODIFY] [operator/laporan/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/operator/laporan/page.tsx)

**🔴🔴 DARK MODE: PALING PARAH — ~20+ elemen tanpa dark mode sama sekali**

| Line | Bug | Severity |
|------|-----|----------|
| 75 | `text-gray-900` — TIDAK TERBACA di dark mode | 🔴 |
| 76 | `text-gray-500` tanpa dark | 🔴 |
| 123 | Loading skeleton `bg-gray-200` tanpa dark | 🔴 |
| 140 | `bg-green-100` tanpa dark | 🔴 |
| 146, 147, 154, 157, 163, 165 | Text tanpa dark | 🔴 |
| 176, 177 | Border dan text tanpa dark | 🔴 |
| 187 | `bg-gray-50` table header tanpa dark | 🔴 |
| 189-194 | Semua `text-gray-500` tanpa dark | 🔴 |
| 197, 200, 206 | Divider, text, hover tanpa dark | 🔴 |
| 207-216 | SEMUA table cell colors tanpa dark | 🔴 |

**🔴 FUNCTIONAL BUG:**
- **Line 182-183**: Tombol **"Export CSV" TIDAK BERFUNGSI** — tidak ada `onClick` handler!

**Perubahan yang diperlukan:**
- Rewrite seluruh styling ke CSS variables
- Implementasi handler Export CSV yang berfungsi
- Validasi startDate < endDate

---

#### [MODIFY] [operator/mahasiswa/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/operator/mahasiswa/page.tsx)

**✅ Theme: Bagus — menggunakan CSS variables**

**🔴 PERFORMANCE BUG:**
- **Lines 40-43**: Polling setiap **3 DETIK** (`setInterval(fetchUsersData, 3000)`) — terlalu agresif! Daftar mahasiswa tidak berubah secepat itu. Seharusnya 30-60 detik minimum.

**Minor:**
- `text-[var(--usg-accent)]` (golden yellow) mungkin low contrast di dark mode
- Tidak ada error UI state

**Perubahan yang diperlukan:**
- Ubah polling interval ke 30-60 detik, atau gunakan manual refresh
- Tambah error state UI

---

#### [MODIFY] [operator/pengeluaran/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/operator/pengeluaran/page.tsx)

**Bug yang ditemukan:**

| Line | Bug | Severity |
|------|-----|----------|
| 130 | Card `bg-white dark:bg-gray-800` — inkonsisten | 🟡 |
| — | Pakai Tailwind `dark:` prefix yang bekerja, tapi inkonsisten dengan CSS vars | 🟡 |

**Functional bugs:**
- Tidak ada validasi amount > 0 atau amount ≤ saldo
- Tidak ada confirmation dialog sebelum delete
- Form tidak reset setelah submit sukses

**Perubahan yang diperlukan:**
- Konsistenkan ke CSS variables
- Tambah validasi amount
- Tambah confirmation dialog delete
- Reset form setelah submit

---

#### [MODIFY] [operator/profil/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/operator/profil/page.tsx)

**Bug yang ditemukan:**

| Line | Bug | Severity |
|------|-----|----------|
| 129-133 | Result message `bg-green-50 text-green-700` / `bg-red-50 text-red-700` tanpa `dark:` | 🔴 |
| — | Sisanya menggunakan CSS variables dengan baik | ✅ |

**Perubahan yang diperlukan:**
- Tambah dark mode pada result messages (gunakan `var(--color-success-light)` / `var(--color-danger-light)`)

---

#### [MODIFY] [operator/tagihan/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/operator/tagihan/page.tsx)

**🔴 DARK MODE: BANYAK MASALAH — ~12+ elemen tanpa dark**

| Line | Bug | Severity |
|------|-----|----------|
| 198-199 | Loading skeleton `bg-gray-200` tanpa dark | 🔴 |
| 210, 211 | Title/subtitle `text-gray-900`/`text-gray-500` tanpa dark | 🔴 |
| 237-241 | Result message tanpa dark | 🔴 |
| 251, 253 | Badge/icon background tanpa dark | 🔴 |
| 266 | Text tanpa dark | 🔴 |
| 187-191 | `jenisColors` map pakai `bg-blue-100` dll. — **sangat buruk** di dark mode | 🔴 |
| 315 | `text-green-600` tanpa dark | 🟡 |
| 400-401 | `bg-blue-50`/`text-blue-700` info box tanpa dark | 🔴 |

**🟡 PERFORMANCE BUG:**
- **Lines 66-76**: Polling setiap **5 detik** — masih terlalu agresif

**UX Bug:**
- Card clickable DAN punya tombol "Lihat Detail" di dalamnya — redundant

**Perubahan yang diperlukan:**
- Ganti semua hardcoded colors ke CSS variables
- Kurangi polling ke 30-60 detik
- Validasi amount > 0 dan due date di masa depan
- Tambah confirmation dialog sebelum delete

---

### Kategori 4: Fix Bug di Role USER (8 Halaman)

---

#### [MODIFY] [user/dashboard/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/dashboard/page.tsx)

**✅ Theme: Bagus — menggunakan CSS variables**

**Bug yang ditemukan:**

| Line | Bug | Severity |
|------|-----|----------|
| 213, 243, 273 | `bg-[var(--usg-primary)] bg-opacity-10` — **Tailwind `bg-opacity` TIDAK BEKERJA** dengan CSS variables di Tailwind v4 | 🔴 |
| 80 | Polling setiap **3 detik** × 3 API calls = terlalu agresif | 🟡 |

**Perubahan yang diperlukan:**
- Ganti `bg-opacity-10` dengan `color-mix()` atau inline style `rgba()`
- Kurangi polling interval ke 15-30 detik

---

#### [MODIFY] [user/bayar/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/bayar/page.tsx)

**🔴🔴 DARK MODE: COMPLETELY BROKEN — ~30+ elemen hardcoded**

| Line | Bug | Severity |
|------|-----|----------|
| 109-110 | Skeleton `bg-gray-200` tanpa dark | 🔴 |
| 120-121 | Title/subtitle tanpa dark | 🔴 |
| 134 | Result message `bg-green-50`/`bg-red-50` tanpa dark | 🔴 |
| 141, 145-146, 150 | Section headers, empty state tanpa dark | 🔴 |
| 168, 170, 173, 175 | Card content tanpa dark | 🔴 |
| 198, 200, 204-205, 210-211, 214 | Paid items tanpa dark | 🔴 |
| 234-246 | Modal tanpa dark | 🔴 |
| 259 | Error message modal tanpa dark | 🔴 |
| 98-103 | `jenisColors` badge hardcoded tanpa dark | 🔴 |
| 173 | Pakai `text-indigo-600` bukan `var(--usg-primary)` — brand inconsistency | 🟡 |

**Functional bugs:**
- Tidak ada proteksi double-submit — user bisa klik "Bayar" berkali-kali
- Tidak ada validasi saldo cukup sebelum tampilkan tombol bayar
- Tidak ada auto-redirect ke riwayat setelah pembayaran sukses

**Perubahan yang diperlukan:**
- Rewrite seluruh styling ke CSS variables
- Tambah `isSubmitting` state untuk prevent double-submit
- Cek saldo kantong sebelum enable tombol bayar
- Redirect ke riwayat setelah sukses

---

#### [MODIFY] [user/kantong/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/kantong/page.tsx)

**🔴🔴 DARK MODE: COMPLETELY BROKEN — ~25+ elemen hardcoded**

| Line | Bug | Severity |
|------|-----|----------|
| 104-105 | Skeleton tanpa dark | 🔴 |
| 115-116 | Title/subtitle tanpa dark | 🔴 |
| 142 | Result message tanpa dark | 🔴 |
| 151-152, 154, 156 | Section content tanpa dark | 🔴 |
| 161-166 | Transaction icon backgrounds hardcoded | 🔴 |
| 168-186 | SVG icon colors hardcoded | 🔴 |
| 189-190, 206-207, 211, 216, 219, 238 | Text/borders tanpa dark | 🔴 |

**Functional bugs:**
- Delete tanpa confirmation dialog
- Tidak cek apakah kantong masih punya saldo sebelum hapus
- Transfer antar kantong tidak validasi source ≠ destination
- Transfer tidak validasi saldo cukup di source
- Tidak validasi nama kantong duplikat
- Form tidak reset setelah create sukses

**Perubahan yang diperlukan:**
- Rewrite styling ke CSS variables
- Tambah confirmation dialog delete
- Validasi transfer (source ≠ dest, saldo cukup)
- Validasi nama duplikat
- Reset form setelah create

---

#### [MODIFY] [user/profil/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/profil/page.tsx)

**🔴 DARK MODE: BROKEN — ~18+ elemen hardcoded**

| Line | Bug | Severity |
|------|-----|----------|
| 146-147 | Title/subtitle tanpa dark | 🔴 |
| 152 | First-time alert `bg-amber-50 border-amber-200 text-amber-800` tanpa dark | 🔴 |
| 205-208 | Tab buttons pakai `bg-indigo-600` bukan `var(--usg-primary)` — brand inconsistency | 🟡 |
| 222-225 | Result message tanpa dark | 🔴 |
| 235-262 | Semua label/value `text-gray-500`/`text-gray-900` tanpa dark | 🔴 |

**Functional bugs:**
- Tidak ada validasi format email
- Change password tidak cek new ≠ old
- Tidak ada password strength indicator
- Success/error message tidak auto-dismiss

**Perubahan yang diperlukan:**
- Ganti ke CSS variables
- Gunakan `var(--usg-primary)` untuk active tab
- Tambah email validation
- Tambah auto-dismiss untuk messages

---

#### [MODIFY] [user/riwayat/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/riwayat/page.tsx)

**✅ Theme: BAGUS — Menggunakan CSS variables dengan konsisten**

Tidak ada bug theme/dark mode signifikan.

---

#### [MODIFY] [user/saldo-prodi/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/saldo-prodi/page.tsx)

**🟡 DARK MODE: PARTIAL — Menggunakan Tailwind `dark:` prefix**

| Line | Bug | Severity |
|------|-----|----------|
| 48, 51 | Skeleton `bg-gray-200 dark:bg-gray-700` — bekerja tapi inkonsisten | 🟡 |
| 63-64, 100-131 | Semua pakai `dark:` prefix — bekerja tapi berbeda approach dari halaman lain | 🟡 |

**Perubahan yang diperlukan:**
- Konsistenkan ke CSS variables (opsional, karena `dark:` prefix tetap berfungsi)

---

#### [MODIFY] [user/topup/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/topup/page.tsx)

**✅ Theme: BAGUS — Menggunakan CSS variables dengan konsisten**

**Functional bugs:**
- Tidak ada validasi minimum/maximum amount
- Tidak ada proteksi double-submit
- Tidak menampilkan saldo saat ini untuk konteks

**Perubahan yang diperlukan:**
- Tambah validasi amount
- Tambah `isSubmitting` state
- Tampilkan current balance

---

#### [MODIFY] [user/transfer/page.tsx](file:///d:/Fintech/fintech-kampus/src/app/user/transfer/page.tsx)

**🔴 DARK MODE: BROKEN — ~20+ elemen hardcoded + PALING INKONSISTEN**

| Line | Bug | Severity |
|------|-----|----------|
| 155-156 | Skeleton tanpa dark | 🔴 |
| 166-167 | Title/subtitle tanpa dark | 🔴 |
| 210-231 | Recipient lookup pakai `dark:` prefix — **campur** approach | 🟡 |
| 245, 247, 257 | Label/hint tanpa dark | 🔴 |
| 255 | **Textarea style FULL hardcoded** — `bg-white`, `text-gray-900`, `border-gray-200`, `focus:border-indigo-500` — RUSAK TOTAL di dark mode | 🔴 |
| 289-291 | Result message tanpa dark | 🔴 |
| 325-345 | Modal tanpa dark | 🔴 |
| 255, 332 | Pakai `indigo-600`/`indigo-500` bukan `var(--usg-primary)` — brand inconsistency | 🟡 |

**Functional bugs:**
- Tidak ada debounce pada recipient search — setiap keystroke trigger API call
- Tidak validasi recipient ≠ self
- Tidak ada minimum amount validation
- Tidak ada proteksi double-submit
- Tidak cek saldo cukup sebelum submit
- Recipient lookup: jika tidak ada hasil, user tidak dapat feedback yang jelas

**Perubahan yang diperlukan:**
- Rewrite styling ke CSS variables
- Gunakan `var(--usg-primary)` untuk brand colors
- Tambah debounce 300ms pada recipient search
- Validasi: recipient ≠ self, amount > 0, saldo cukup
- Tambah `isSubmitting` state
- Tambah clear empty state message

---

### Kategori 5: Fix Shared Components (7 Komponen)

---

#### [MODIFY] [Badge.tsx](file:///d:/Fintech/fintech-kampus/src/components/ui/Badge.tsx)

**🔴 CRITICAL: NO DARK MODE SUPPORT**

- **Lines 11-15**: Semua badge variants hardcoded light mode:
  - `success: 'bg-green-100 text-green-700'`
  - `warning: 'bg-yellow-100 text-yellow-700'`
  - `danger: 'bg-red-100 text-red-700'`
  - Light-colored backgrounds akan sangat buruk di dark mode

- **StatusBadge** (line 36-56): Pakai `getStatusColor()` yang juga hardcoded light mode

**Ada CSS classes `.badge-success`, `.badge-danger`, dll. di `globals.css` yang SUDAH theme-aware** — tapi komponen ini TIDAK menggunakannya!

**Perubahan yang diperlukan:**
- Gunakan CSS classes dari `globals.css` (.badge-success, .badge-danger, dll.)
- Atau tambah `dark:` variants ke semua badge

---

#### [MODIFY] [Button.tsx](file:///d:/Fintech/fintech-kampus/src/components/ui/Button.tsx)

**🔴 CRITICAL: DARK MODE + BRAND INCONSISTENCY**

| Line | Bug | Severity |
|------|-----|----------|
| 22 | Primary pakai `bg-gradient-to-r from-indigo-600 to-purple-600` — BUKAN warna USG! | 🔴 |
| 23 | Secondary `bg-gray-100 text-gray-900` — buruk di dark mode | 🔴 |
| 25 | Ghost `hover:bg-gray-100 text-gray-700` tanpa dark | 🔴 |
| 26 | Outline `border-indigo-600 text-indigo-600` — bukan USG + tanpa dark | 🔴 |

**Ada CSS classes `.btn-primary`, `.btn-secondary` di `globals.css` yang SUDAH benar** — komponen TIDAK menggunakannya!

**Perubahan yang diperlukan:**
- Gunakan CSS classes dari `globals.css` (.btn-primary, .btn-secondary, dll.)
- Ganti indigo/purple gradient dengan USG brand color

---

#### [MODIFY] [Card.tsx](file:///d:/Fintech/fintech-kampus/src/components/ui/Card.tsx)

**🟡 THEME MISMATCH: Pakai `slate` bukan `gray`**

| Line | Bug | Severity |
|------|-----|----------|
| 16 | `dark:bg-slate-800 dark:border-slate-700` — pakai **slate** | 🟡 |
| 20 | Glass variant juga pakai **slate** | 🟡 |
| 93 | Footer mix **gray** DAN **slate** di baris yang sama | 🔴 |

**CSS class `.card` di `globals.css` pakai `gray-800`/`gray-700`** — inkonsisten!

**Perubahan yang diperlukan:**
- Konsistenkan palette ke gray (sesuai `globals.css`)
- Atau gunakan CSS class `.card` dari `globals.css`

---

#### [MODIFY] [Input.tsx](file:///d:/Fintech/fintech-kampus/src/components/ui/Input.tsx)

**🔴 CRITICAL: NO DARK MODE AT ALL**

| Line | Bug | Severity |
|------|-----|----------|
| 25 | Label `text-gray-700` — hampir tidak terlihat di dark mode | 🔴 |
| 39 | Input `bg-white text-gray-900 border-gray-300` — putih di dark mode | 🔴 |
| 42 | Disabled `bg-gray-100` — tanpa dark | 🔴 |
| 76, 84, 120, 128 | Textarea/Select — sama semua | 🔴 |

**CSS class `.input` dan `.input-label` di `globals.css` SUDAH theme-aware** — komponen TIDAK menggunakannya!

**Perubahan yang diperlukan:**
- Gunakan CSS classes `.input` dan `.input-label` dari `globals.css`

---

#### [MODIFY] [Modal.tsx](file:///d:/Fintech/fintech-kampus/src/components/ui/Modal.tsx)

**🔴 CRITICAL: NO DARK MODE + MISSING FEATURES**

| Line | Bug | Severity |
|------|-----|----------|
| 52 | `bg-white` — putih terang di dark mode | 🔴 |
| 58 | `border-gray-100` — hampir tidak terlihat | 🔴 |
| 59 | `text-gray-900` tanpa dark | 🔴 |
| 62 | `hover:bg-gray-100` tanpa dark | 🔴 |

**CSS classes `.modal`, `.modal-header`, `.modal-title` di `globals.css` SUDAH theme-aware** — komponen TIDAK menggunakannya!

**Missing UX features:**
- Tidak handle `Escape` key untuk close
- Tidak prevent body scroll ketika modal open
- Backdrop click behavior inkonsisten

**Perubahan yang diperlukan:**
- Gunakan CSS classes dari `globals.css`
- Tambah Escape key handler
- Tambah body scroll lock
- Konsistenkan backdrop click behavior

---

#### [MODIFY] [StatsCard.tsx](file:///d:/Fintech/fintech-kampus/src/components/charts/StatsCard.tsx)

**🟡 THEME + BRAND INCONSISTENCY**

| Line | Bug | Severity |
|------|-----|----------|
| 20 | Pakai Tailwind `dark:` — inkonsisten dengan CSS vars | 🟡 |
| 29 | Icon gradient `from-indigo-500/10 to-purple-500/10` — bukan USG palette | 🟡 |
| 73 | Gradient variant `from-indigo-500 via-purple-500 to-pink-500` — bukan USG | 🟡 |

**CSS class `.stats-card` di `globals.css` SUDAH ada dan theme-aware.**

**Perubahan yang diperlukan:**
- Gunakan CSS class `.stats-card` atau konsistenkan warna ke USG palette

---

#### [MODIFY] [AdminProdiChart.tsx](file:///d:/Fintech/fintech-kampus/src/components/charts/AdminProdiChart.tsx)

**🔴 CRITICAL: HARDCODED DARK-ONLY THEME**

| Line | Bug | Severity |
|------|-----|----------|
| 47, 91, 148 | Container `bg-gray-900` — **SALAH di light mode** | 🔴 |
| 48, 92, 149 | `text-white` — tidak terlihat di light mode | 🔴 |
| 55-56, 60-61 | Axis stroke/fill hardcoded `#9CA3AF` | 🟡 |
| 67-71, 110-114 | Tooltip `backgroundColor: '#1F2937'` — inline hardcoded | 🔴 |
| 73, 117 | Label `color: '#F9FAFB'` — hardcoded | 🔴 |
| 126 | Legend `text-gray-300` — hardcoded dark | 🔴 |
| 52, 96 | `ChartColors.chartGrid` hardcoded `#374151` | 🟡 |

**Komponen ini 100% di-style untuk dark mode saja — RUSAK TOTAL di light mode.**

**Perubahan yang diperlukan:**
- Rewrite semua styling untuk respons ke light/dark theme
- Gunakan CSS variables atau conditional classes
- Tambah ke export di `charts/index.ts`

---

### Kategori 6: Fix Chart Components

---

#### [MODIFY] [BarChart.tsx](file:///d:/Fintech/fintech-kampus/src/components/charts/BarChart.tsx)

- Default colors `['indigo', 'purple']` bukan USG brand
- Pakai `dark:bg-gray-800` — inkonsisten dgn CSS vars
- Tidak ada handling untuk empty data

#### [MODIFY] [DonutChart.tsx](file:///d:/Fintech/fintech-kampus/src/components/charts/DonutChart.tsx)

- Same issues sebagai BarChart
- Default colors tidak match USG brand
- Tidak ada empty data handling

#### [MODIFY] [LineChart.tsx](file:///d:/Fintech/fintech-kampus/src/components/charts/LineChart.tsx)

- Same issues
- Grid dan axis colors hardcoded

#### [MODIFY] [charts/index.ts](file:///d:/Fintech/fintech-kampus/src/components/charts/index.ts)

- `AdminProdiChart` TIDAK di-export dari barrel file

---

### Kategori 7: Fix API & Backend Bugs

> [!WARNING]
> Beberapa bug ini adalah **masalah keamanan dan integritas data yang kritis** untuk aplikasi fintech.

---

#### 7.1 Security Issues

| File | Bug | Severity |
|------|-----|----------|
| [auth.ts](file:///d:/Fintech/fintech-kampus/src/lib/auth.ts) L153 | Hardcoded fallback secret `"your-secret-key-change-in-production"` | 🔴 |
| `api/admin/operators/[id]` L88 | Default password `"password123"` exposed di response | 🔴 |
| `api/admin/users/[id]` L74 | Default password hardcoded + exposed | 🔴 |
| `api/admin/users` L116 | Default PIN `"123456"` hardcoded | 🔴 |
| [middleware.ts](file:///d:/Fintech/fintech-kampus/src/middleware.ts) L24 | Fallback secret sama — security risk | 🔴 |

#### 7.2 Authorization & Access Control

| File | Bug | Severity |
|------|-----|----------|
| `api/tagihan/[id]` PUT | Any operator bisa edit ANY tagihan, tanpa cek ownership | 🔴 |
| `api/tagihan/[id]` DELETE | Any operator bisa DELETE any tagihan — **hard delete** menghapus audit trail | 🔴 |
| `api/charts/user` L18-28 | Leak data semua user dalam 1 prodi, bukan hanya user sendiri | 🔴 |
| `api/user/transfer` L68-74 | Recipient tidak dicek `isActive` — bisa transfer ke akun deleted | 🔴 |
| `api/user/lookup` | Return terlalu banyak data user (balance dll.) ke semua user | 🟡 |

#### 7.3 Business Logic Bugs

| File | Bug | Severity |
|------|-----|----------|
| `api/admin/topup` | Approval update status DAN balance **tanpa database transaction** — risk inkonsistensi | 🔴 |
| `api/user/transfer` L42 | Deduct sender + credit recipient **tanpa transaction** — risk inkonsistensi | 🔴 |
| `api/admin/users/[id]` L104-134 | Balance add **race condition** — read + write tanpa transaction | 🔴 |
| `api/user/tagihan` POST | Payment TIDAK cek apakah deadline sudah lewat | 🟡 |
| `api/tagihan/[id]` DELETE | **Hard delete** menghapus pembayaran records — menghancurkan audit trail keuangan | 🔴 |
| `api/admin/users/[id]` reset-password | TIDAK set `mustChangePassword: true` setelah reset | 🟡 |
| `api/admin/users` L142 | Audit action salah — pakai `'USER_STATUS_CHANGED'` untuk user creation | 🟡 |

#### 7.4 Data Validation Issues

| File | Bug | Severity |
|------|-----|----------|
| `api/admin/operators` POST | `createOperatorSchema` di-import tapi TIDAK dipakai — validasi manual | 🟡 |
| `api/tagihan/[id]` PUT | Tidak ada input validation — `Number(nominal)` bisa menghasilkan NaN | 🔴 |
| `api/user/topup` POST | Tidak ada min/max amount validation | 🟡 |
| `api/prodi/pengeluaran` POST | Tidak ada max amount validation | 🟡 |
| `api/user/lookup` | Return error tanpa HTTP status code (default 200 untuk error) | 🟡 |

#### 7.5 Database Issues

| File | Bug | Severity |
|------|-----|----------|
| [schema.prisma](file:///d:/Fintech/fintech-kampus/prisma/schema.prisma) | SEMUA field currency pakai `Float` — **floating point precision errors** untuk keuangan | 🔴 |
| `schema.prisma` | Comment says "SQLite doesn't support enum" tapi datasource PostgreSQL — **bisa pakai enum** | 🟡 |
| `schema.prisma` | AuditLog detail pakai `String` untuk JSON — seharusnya pakai type `Json` | 🟡 |
| `api/operator/tagihan` GET | **N+1 query** — setiap tagihan trigger extra `pembayaran.count()` | 🟡 |
| `api/admin/prodi-saldo-summary` | **N+1 query** — loop + individual aggregate per prodi | 🟡 |
| `api/admin/overview` | Full table scan untuk kalkulasi total income | 🟡 |
| `api/operator/tagihan` GET | Tidak filter `deletedAt: null` — soft-deleted tagihan masih muncul | 🟡 |
| `api/admin/overview` | User/operator counts include soft-deleted records | 🟡 |

---

## Verification Plan

### Automated Tests
1. Buka setiap halaman di browser dan toggle dark/light mode — verifikasi semua elemen visual sinkron
2. Test responsive layout di viewport 320px, 768px, 1024px, 1440px
3. Verifikasi semua form validation bekerja (submit kosong, amount negatif, dll.)
4. Test double-submit prevention pada halaman payment/transfer/topup
5. Verifikasi Export CSV di halaman operator laporan berfungsi

### Manual Verification
1. Login sebagai setiap role (Admin, Operator, User) dan navigasi ke semua halaman
2. Toggle theme berkali-kali di setiap halaman — pastikan tidak ada flash/flicker
3. Test alur pembayaran end-to-end (topup → transfer → bayar tagihan)
4. Verifikasi audit log tercatat dengan benar
5. Test di mobile browser untuk responsive layout

---

## Open Questions

> [!IMPORTANT]
> **Q1**: Apakah Anda ingin saya memprioritaskan fix **dark mode/theme** terlebih dahulu (dampak visual paling besar), atau fix **API/security bugs** terlebih dahulu (dampak keamanan)?

> [!IMPORTANT]
> **Q2**: Untuk `prisma/schema.prisma` — mengubah `Float` ke `Decimal` untuk semua currency fields akan memerlukan **migration database**. Apakah ini aman dilakukan sekarang, atau sudah ada data production?

> [!IMPORTANT]
> **Q3**: Apakah Anda ingin pendekatan theme yang **unified** (semua pakai CSS variables saja), atau Anda OK dengan **mixed approach** (CSS variables + Tailwind `dark:` prefix)?

> [!IMPORTANT]
> **Q4**: Hard delete pada tagihan yang menghapus data pembayaran — apakah ini memang disengaja, atau seharusnya hanya soft delete?
