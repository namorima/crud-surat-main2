# Product Requirements Document (PRD)

## Sistem Pengurusan Surat dan Bayaran

**Versi:** 1.0  
**Tarikh:** 4 Januari 2026  
**Status:** Active Development  
**URL Produksi:** https://crudladang.vercel.app

---

## 1. Ringkasan Eksekutif

### 1.1 Tujuan Produk

Sistem Pengurusan Surat dan Bayaran adalah aplikasi web moden yang direka untuk memudahkan pengurusan surat masuk dan rekod pembayaran bagi organisasi perladangan. Sistem ini menggantikan proses manual dengan platform digital yang membolehkan staf merekod, menjejak, dan mengurus aliran kerja surat-menyurat dan kewangan dengan lebih efisien.

### 1.2 Objektif Perniagaan

- **Meningkatkan Kecekapan:** Mengurangkan masa pemprosesan surat dan bayaran sebanyak 60%
- **Meningkatkan Ketepatan:** Menghapuskan ralat manual dalam rekod data
- **Meningkatkan Ketelusan:** Menyediakan jejak audit lengkap untuk semua transaksi
- **Memudahkan Kolaborasi:** Membolehkan berbilang staf mengakses dan mengemas kini data secara serentak
- **Meningkatkan Keselamatan:** Kawalan akses berasaskan peranan untuk melindungi data sensitif

### 1.3 Pengguna Sasaran

- **Staf Kewangan:** Menguruskan rekod pembayaran dan status bayaran
- **Staf Pentadbiran:** Merekod dan menjejak surat masuk/keluar
- **Pengurus/Ketua Unit:** Memantau status tindakan dan kelulusan
- **Perancang/Pemasaran:** Mengakses data untuk perancangan dan laporan
- **Pihak Luar (Limited):** Melihat data bayaran melalui pautan kongsi

---

## 2. Ciri-ciri Utama

### 2.1 Modul Pengurusan Surat

#### 2.1.1 Operasi CRUD Surat

**Keutamaan:** P0 (Critical)

**Keperluan Fungsional:**

- ✅ Tambah surat baru dengan maklumat lengkap:

  - Bil (auto-increment)
  - Daripada/Kepada
  - Tarikh surat
  - Perkara (dengan autocomplete dari senarai yang sedia ada)
  - Kategori
  - Unit yang bertanggungjawab
  - Fail/dokumen berkaitan
  - PIC Tindakan
  - Status (BELUM PROSES, HOLD/KIV, DALAM TINDAKAN, SELESAI, BATAL)
  - Tarikh selesai
  - Nota
  - Komen
  - Reference (untuk surat balasan)

- ✅ Edit surat sedia ada dengan pengesahan
- ✅ Padam surat dengan dialog pengesahan
- ✅ Lihat butiran penuh surat dalam dialog terperinci

**Keperluan Bukan Fungsional:**

- Masa respons < 2 saat untuk operasi CRUD
- Validasi input di frontend dan backend
- Mesej ralat yang jelas dan informatif

#### 2.1.2 Carian dan Penapisan Surat

**Keutamaan:** P0 (Critical)

**Keperluan Fungsional:**

- ✅ Carian teks penuh merentasi semua medan
- ✅ Penapis mengikut:
  - Unit
  - Status
  - Kategori
  - Tarikh (kalendar picker)
- ✅ Pengisihan mengikut mana-mana lajur (ascending/descending)
- ✅ Pagination dengan 10/25/50/100 rekod per halaman
- ✅ Butang "Clear All Filters"

#### 2.1.3 Sistem Rujukan Surat

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Kemampuan untuk membuat surat balasan yang merujuk surat asal
- ✅ Pautan visual antara surat dan balasannya
- ✅ Paparan rujukan dalam butiran surat

#### 2.1.4 Sistem Komen dan Notifikasi

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Tambah komen pada surat
- ✅ Notifikasi visual untuk surat dengan komen baru
- ✅ Dialog komen dengan sejarah lengkap

---

### 2.2 Modul Pengurusan Bayaran

#### 2.2.1 Operasi CRUD Bayaran

**Keutamaan:** P0 (Critical)

**Keperluan Fungsional:**

- ✅ Tambah rekod bayaran baru dengan maklumat:

  - ID (auto-generated)
  - Daripada
  - Tarikh terima
  - Perkara
  - Nilai bayaran (dengan format mata wang automatik)
  - Bayaran ke (bulan/tempoh)
  - Kategori (ANGKUT BTS, PIECERATE, KIMIA, KONTRAK)
  - No. Kontrak (dengan autocomplete)
  - Nama Kontraktor (auto-populated dari kontrak)
  - Tarikh Memo Ladang
  - Status Ladang
  - Tarikh Hantar
  - Tarikh PPNP
  - Tarikh PN
  - Penerima
  - Status Bayaran
  - Tarikh Bayar
  - Nombor Baucer
  - Nota Kaki

- ✅ Edit rekod bayaran dengan audit trail
- ✅ Padam rekod bayaran dengan pengesahan
- ✅ Lihat butiran lengkap dengan timeline visual

**Keperluan Bukan Fungsional:**

- Validasi nilai bayaran (format mata wang)
- Auto-format input mata wang semasa menaip
- Sokongan untuk nilai hingga RM 999,999,999.99

#### 2.2.2 Carian dan Penapisan Bayaran

**Keutamaan:** P0 (Critical)

**Keperluan Fungsional:**

- ✅ Carian teks penuh
- ✅ Penapis mengikut:
  - Status Bayaran
  - Status Ladang
  - Kategori
  - No. Kontrak
  - Tarikh
- ✅ Penapis tahun (2025, 2026, dst.)
- ✅ Pengisihan multi-lajur
- ✅ Pagination

#### 2.2.3 Operasi Bulk

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Pilih berbilang rekod menggunakan checkbox
- ✅ Kemaskini status secara pukal:
  - Status Ladang
  - Status Bayaran
- ✅ Bar tindakan bulk dengan kiraan rekod dipilih
- ✅ Ikon visual untuk tindakan (bukan teks)

**Keperluan Keselamatan:**

- Hanya pengguna yang disahkan boleh melihat checkbox bulk edit
- Pengesahan sebelum melaksanakan operasi bulk

#### 2.2.4 Timeline dan Jejak Audit

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Timeline visual menunjukkan progres bayaran:
  1. Terima
  2. Memo Ladang
  3. Hantar
  4. PPNP
  5. PN
  6. Bayar
- ✅ Ikon status untuk setiap langkah (✓ selesai, ! dibatalkan)
- ✅ Paparan tarikh untuk setiap langkah
- ✅ Highlight merah untuk rekod BATAL

**Keperluan Bukan Fungsional:**

- Timeline mesti responsif pada semua saiz skrin
- Warna konsisten dengan sistem status

#### 2.2.5 Penjanaan Imej Kongsi

**Keutamaan:** P2 (Medium)

**Keperluan Fungsional:**

- ✅ Jana imej grafik untuk rekod bayaran
- ✅ Termasuk semua maklumat penting
- ✅ Branding organisasi
- ✅ Muat turun sebagai PNG

---

### 2.3 Modul Pengesahan dan Kawalan Akses

#### 2.3.1 Sistem Log Masuk

**Keutamaan:** P0 (Critical)

**Keperluan Fungsional:**

- ✅ Halaman log masuk dengan User ID dan Password
- ✅ Pengesahan terhadap Google Sheets (AUTH sheet)
- ✅ Sesi pengguna dengan token
- ✅ Log keluar

**Keperluan Keselamatan:**

- Password tidak disimpan dalam plaintext
- Sesi tamat selepas 24 jam atau log keluar
- Perlindungan terhadap brute force

#### 2.3.2 Role-Based Access Control (RBAC)

**Keutamaan:** P0 (Critical)

**Keperluan Fungsional:**

| Peranan           | Dashboard | Surat | Bayaran | Statistik | Pengguna | Tetapan |
| ----------------- | --------- | ----- | ------- | --------- | -------- | ------- |
| `semua` / `admin` | ✅        | ✅    | ✅      | ✅        | ✅       | ✅      |
| `KEWANGAN`        | ❌        | ❌    | ✅      | ❌        | ❌       | ❌      |
| `PERLADANGAN`     | ✅        | ✅    | ✅      | ✅        | ❌       | ✅      |
| `PENGURUS`        | ✅        | ✅    | ✅      | ✅        | ❌       | ✅      |
| `PEMASARAN`       | ❌        | ✅    | ❌      | ✅        | ❌       | ✅      |
| `PERANCANG`       | ❌        | ✅    | ❌      | ✅        | ❌       | ✅      |
| `MSPO`            | ❌        | ✅    | ❌      | ✅        | ❌       | ✅      |

**Jenis Pengguna Khas:**

- `VIEW` - Akses read-only, disekat dari Surat dan Tetapan
- `PENERIMA` - Penerima surat, disekat dari Surat dan Tetapan

**Keperluan Keselamatan:**

- Middleware untuk memeriksa peranan sebelum akses halaman
- API routes mesti mengesahkan peranan pengguna
- Redirect automatik jika akses ditolak

---

### 2.4 Modul Statistik dan Papan Pemuka

#### 2.4.1 Dashboard Utama

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Ringkasan statistik:
  - Jumlah surat (mengikut status)
  - Jumlah bayaran (mengikut status)
  - Trend bulanan
- ✅ Carta visualisasi data
- ✅ Akses pantas ke modul utama
- ✅ Notifikasi dan alert

#### 2.4.2 Halaman Statistik

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Penapis multi-dimensi:
  - Tahun
  - Jenis Projek
  - Nama Projek
- ✅ Carta garis multi-tahun
- ✅ Jadual data terperinci
- ✅ Export data (future)

**Keperluan Bukan Fungsional:**

- Carta mesti responsif
- Data mesti dikemas kini secara real-time
- Pengendalian nilai NaN dengan betul

---

### 2.5 Modul Pautan Kongsi (Share Links)

#### 2.5.1 Penjanaan Pautan

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Admin boleh menjana pautan kongsi untuk data bayaran yang ditapis
- ✅ Konfigurasi penapis:
  - Status Bayaran
  - Status Ladang
  - Kategori
  - Kontrak
  - Tarikh
- ✅ Tetapkan tarikh luput (optional)
- ✅ Tambah penerangan pautan
- ✅ Jana URL unik: `https://crudladang.vercel.app/share/[linkId]`

#### 2.5.2 Akses Pautan Kongsi

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Akses tanpa log masuk
- ✅ Paparan data yang ditapis sahaja
- ✅ Read-only (tiada edit/delete)
- ✅ Ringkasan penapis yang digunakan
- ✅ Kiraan akses automatik

**Keperluan Keselamatan:**

- Pautan luput selepas tarikh yang ditetapkan
- Tiada akses kepada data lain
- Rate limiting untuk mencegah abuse

#### 2.5.3 Pengurusan Pautan

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Senarai semua pautan kongsi
- ✅ Lihat statistik akses
- ✅ Padam pautan
- ✅ Salin pautan ke clipboard

---

### 2.6 Modul Pengurusan Pengguna

#### 2.6.1 Senarai Pengguna

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Paparan semua pengguna dari AUTH sheet
- ✅ Maklumat pengguna:
  - User ID
  - Nama
  - Unit/Peranan
  - Jenis (VIEW/PENERIMA/standard)
- ✅ Carian dan penapis pengguna

**Keperluan Keselamatan:**

- Hanya admin boleh akses
- Password tidak dipaparkan

---

### 2.7 Modul Tetapan

#### 2.7.1 Pengurusan Fail

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Senarai fail/dokumen dari FAIL sheet
- ✅ Maklumat fail:
  - No. Locker
  - No. Fail
  - Pecahan
  - Pecahan Kecil
  - Unit berkaitan
- ✅ Autocomplete dalam borang surat

#### 2.7.2 Pengurusan Kontrak

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Senarai kontrak dari KONTRAK sheet
- ✅ Maklumat kontrak:
  - Kawasan
  - No. Kontrak
  - Kategori
  - Nama Kontraktor
- ✅ Auto-populate nama kontraktor dalam borang bayaran

#### 2.7.3 Pengurusan Status

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Konfigurasi status dari STATUS sheet
- ✅ Tetapkan warna untuk setiap status (HEX)
- ✅ Kategori status (BAYARAN/LADANG)
- ✅ Warna konsisten di seluruh aplikasi

#### 2.7.4 Tab Pautan Kongsi

**Keutamaan:** P1 (High)

**Keperluan Fungsional:**

- ✅ Akses kepada pengurusan pautan kongsi
- ✅ Jana pautan baru
- ✅ Lihat dan urus pautan sedia ada

---

## 3. Keperluan Teknikal

### 3.1 Seni Bina Sistem

#### 3.1.1 Frontend

- **Framework:** Next.js 15.2.4 (App Router)
- **React:** Version 19
- **TypeScript:** Version 5
- **Styling:** Tailwind CSS 3.4.17
- **UI Components:** shadcn/ui + Radix UI
- **Form Management:** React Hook Form + Zod
- **State Management:** React Hooks (useState, useEffect, useCallback, useMemo)
- **Notifications:** Sonner
- **Charts:** Recharts
- **Icons:** Lucide React

#### 3.1.2 Backend

- **Runtime:** Node.js 18+
- **API:** Next.js API Routes
- **Database:** Google Sheets API
- **Image Storage:** ImgBB API
- **Authentication:** Custom (Google Sheets-based)

#### 3.1.3 Deployment

- **Platform:** Vercel
- **URL:** https://crudladang.vercel.app
- **Environment:** Production

### 3.2 Struktur Google Sheets

#### 3.2.1 Sheet: SURAT

**Lajur:**

- A: ID
- B: BIL
- C: DARIPADA/KEPADA
- D: TARIKH
- E: PERKARA
- F: KATEGORI
- G: UNIT
- H: FAIL
- I: TINDAKAN PIC
- J: STATUS
- K: TARIKH SELESAI
- L: NOTA
- M: REFERENCE (Bil surat yang dilink)
- N: KOMEN

#### 3.2.2 Sheet: REKOD BAYARAN

**Lajur:**

- A: ID
- B: DARIPADA
- C: TARIKH TERIMA
- D: PERKARA
- E: NILAI BAYARAN
- F: BAYARAN KE
- G: KATEGORI
- H: NO KONTRAK
- I: TARIKH MEMO LADANG
- J: STATUS LADANG
- K: TARIKH HANTAR
- L: TARIKH PPNP
- M: TARIKH PN
- N: PENERIMA
- O: STATUS BAYARAN
- P: TARIKH BAYAR
- Q: NOMBOR BAUCER
- R: NOTA KAKI
- S: NAMA KONTRAKTOR (auto-populated)

#### 3.2.3 Sheet: AUTH

**Lajur:**

- A: USER_ID
- B: PASSWORD
- C: NAME
- D: UNIT/ROLE
- E: TYPE (VIEW/PENERIMA/standard)

#### 3.2.4 Sheet: UNIT

**Lajur:**

- A: UNIT
- B: PIC TINDAKAN

#### 3.2.5 Sheet: KONTRAK

**Lajur:**

- A: KAWASAN
- B: NO KONTRAK
- C: KATEGORI
- D: NAMA KONTRAKTOR

#### 3.2.6 Sheet: AUDIT_BAYARAN

**Lajur:**

- A: TIMESTAMP
- B: USER
- C: ACTION
- D: BAYARAN_ID
- E: CHANGES

#### 3.2.7 Sheet: STATUS

**Lajur:**

- A: STATUS
- B: COLOR_HEX
- C: KATEGORI (BAYARAN/LADANG)

#### 3.2.8 Sheet: FAIL

**Lajur:**

- A: NO LOCKER
- B: NO FAIL
- C: PECAHAN
- D: PECAHAN KECIL
- E: UNIT

#### 3.2.9 Sheet: SHARE_LINK

**Lajur:**

- A: LINK_ID
- B: FILTER_JSON
- C: CREATED_BY
- D: CREATED_AT
- E: EXPIRES_AT
- F: DESCRIPTION
- G: ACCESS_COUNT

### 3.3 Environment Variables

```env
# ImgBB API
NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key

# Google Sheets
GOOGLE_SHEET_ID=your_google_sheet_id
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----
GOOGLE_CLIENT_EMAIL=your_service_account_email@project.iam.gserviceaccount.com
```

### 3.4 Keperluan Prestasi

| Metrik            | Sasaran | Kritikal |
| ----------------- | ------- | -------- |
| Masa muat halaman | < 2s    | < 5s     |
| Masa respons API  | < 1s    | < 3s     |
| Operasi CRUD      | < 2s    | < 5s     |
| Carian/Penapis    | < 1s    | < 3s     |
| Bulk operations   | < 5s    | < 10s    |

### 3.5 Keperluan Keselamatan

- ✅ HTTPS untuk semua komunikasi
- ✅ Pengesahan pengguna untuk semua halaman (kecuali share links)
- ✅ Kawalan akses berasaskan peranan
- ✅ Validasi input di frontend dan backend
- ✅ Sanitasi data sebelum simpan
- ✅ Rate limiting untuk API
- ✅ Perlindungan terhadap XSS dan CSRF
- ✅ Audit trail untuk operasi sensitif

### 3.6 Keperluan Kebolehcapaian

- ✅ Responsif pada semua saiz skrin (mobile, tablet, desktop)
- ✅ Sokongan dark mode
- ✅ Keyboard navigation
- ✅ ARIA labels untuk screen readers
- ✅ Kontras warna yang mencukupi

---

## 4. Aliran Kerja Pengguna

### 4.1 Aliran Kerja Surat

```mermaid
graph TD
    A[Surat Masuk] --> B[Staf Pentadbiran Log Masuk]
    B --> C[Tambah Rekod Surat]
    C --> D[Assign Unit & PIC]
    D --> E[Status: BELUM PROSES]
    E --> F{PIC Ambil Tindakan}
    F -->|Mulakan| G[Status: DALAM TINDAKAN]
    F -->|Tangguh| H[Status: HOLD / KIV]
    G --> I{Selesai?}
    I -->|Ya| J[Status: SELESAI + Tarikh Selesai]
    I -->|Tidak| K[Kemaskini Komen/Nota]
    K --> G
    H --> L{Review Semula}
    L -->|Sambung| G
    L -->|Batal| M[Status: BATAL]
```

### 4.2 Aliran Kerja Bayaran

```mermaid
graph TD
    A[Terima Dokumen Bayaran] --> B[Staf Kewangan Log Masuk]
    B --> C[Tambah Rekod Bayaran]
    C --> D[Tarikh Terima + Maklumat Asas]
    D --> E[Tarikh Memo Ladang]
    E --> F[Status Ladang: MENUNGGU/DALAM PROSES/SELESAI]
    F --> G[Tarikh Hantar]
    G --> H[Tarikh PPNP]
    H --> I[Tarikh PN]
    I --> J[Status Bayaran: MENUNGGU/DALAM PROSES/SELESAI]
    J --> K[Tarikh Bayar + Nombor Baucer]
    K --> L[Status Bayaran: SELESAI]

    F -->|Masalah| M[Status Ladang: BATAL]
    J -->|Masalah| N[Status Bayaran: BATAL]
```

### 4.3 Aliran Kerja Pautan Kongsi

```mermaid
graph TD
    A[Admin Log Masuk] --> B[Pergi ke Tetapan > Pautan Kongsi]
    B --> C[Klik 'Jana Pautan Baru']
    C --> D[Tetapkan Penapis]
    D --> E[Tetapkan Tarikh Luput & Penerangan]
    E --> F[Jana Pautan]
    F --> G[Salin URL]
    G --> H[Kongsi dengan Pihak Luar]
    H --> I[Pihak Luar Akses URL]
    I --> J{Pautan Valid?}
    J -->|Ya| K[Paparan Data Read-Only]
    J -->|Tidak| L[Mesej Ralat: Pautan Luput/Tidak Sah]
    K --> M[Kiraan Akses +1]
```

---

## 5. Rancangan Pembangunan

### 5.1 Fasa 1: Core Features (✅ SELESAI)

- ✅ Sistem pengesahan dan RBAC
- ✅ Modul Surat (CRUD)
- ✅ Modul Bayaran (CRUD)
- ✅ Carian dan penapisan
- ✅ Dashboard asas
- ✅ Deployment ke Vercel

### 5.2 Fasa 2: Enhanced Features (✅ SELESAI)

- ✅ Operasi bulk untuk bayaran
- ✅ Timeline visual untuk bayaran
- ✅ Sistem rujukan surat
- ✅ Komen dan notifikasi
- ✅ Pautan kongsi
- ✅ Penjanaan imej kongsi
- ✅ Pengurusan fail dan kontrak

### 5.3 Fasa 3: Optimizations (🔄 DALAM PROSES)

- ✅ UI/UX improvements (dark mode, responsif)
- ✅ Prestasi dan caching
- ✅ Pembaikan bug
- 🔄 Refactoring komponen besar
- 🔄 State management dengan Zustand/React Query
- 🔄 Data fetching dengan SWR

### 5.4 Fasa 4: Advanced Features (📋 DIRANCANG)

- 📋 Export data (Excel, PDF)
- 📋 Laporan automatik
- 📋 Email notifications
- 📋 Advanced analytics
- 📋 Mobile app (React Native)
- 📋 Offline mode
- 📋 Bulk import dari Excel

---

## 6. Metrik Kejayaan

### 6.1 Metrik Penggunaan

- **Daily Active Users (DAU):** > 20 pengguna/hari
- **Jumlah Surat Direkod:** > 100 surat/bulan
- **Jumlah Bayaran Direkod:** > 50 bayaran/bulan
- **Kadar Penggunaan Pautan Kongsi:** > 10 pautan/bulan

### 6.2 Metrik Prestasi

- **Uptime:** > 99.5%
- **Masa Muat Halaman:** < 2 saat (75th percentile)
- **Error Rate:** < 1%
- **API Response Time:** < 1 saat (95th percentile)

### 6.3 Metrik Kepuasan Pengguna

- **User Satisfaction Score:** > 4.0/5.0
- **Task Completion Rate:** > 90%
- **Support Tickets:** < 5 tickets/bulan
- **Bug Reports:** < 10 bugs/bulan

---

## 7. Risiko dan Mitigasi

### 7.1 Risiko Teknikal

| Risiko                           | Kesan         | Kebarangkalian | Mitigasi                                                                |
| -------------------------------- | ------------- | -------------- | ----------------------------------------------------------------------- |
| Google Sheets API quota exceeded | Tinggi        | Sederhana      | Implement caching, rate limiting, consider migration to proper database |
| ImgBB API downtime               | Rendah        | Rendah         | Fallback to local storage, queue failed uploads                         |
| Vercel deployment issues         | Tinggi        | Rendah         | Setup CI/CD with automated rollback, maintain staging environment       |
| Data loss from Google Sheets     | Sangat Tinggi | Rendah         | Daily automated backups, version history enabled                        |

### 7.2 Risiko Keselamatan

| Risiko              | Kesan         | Kebarangkalian | Mitigasi                                          |
| ------------------- | ------------- | -------------- | ------------------------------------------------- |
| Unauthorized access | Tinggi        | Sederhana      | Strong authentication, RBAC, session management   |
| Data breach         | Sangat Tinggi | Rendah         | HTTPS, input validation, sanitization, audit logs |
| XSS/CSRF attacks    | Tinggi        | Sederhana      | CSP headers, CSRF tokens, sanitize user input     |
| Brute force login   | Sederhana     | Tinggi         | Rate limiting, account lockout, CAPTCHA           |

### 7.3 Risiko Perniagaan

| Risiko             | Kesan     | Kebarangkalian | Mitigasi                                           |
| ------------------ | --------- | -------------- | -------------------------------------------------- |
| Low user adoption  | Tinggi    | Sederhana      | User training, documentation, responsive support   |
| Scalability issues | Tinggi    | Tinggi         | Monitor usage, plan migration to scalable database |
| Maintenance burden | Sederhana | Tinggi         | Code refactoring, automated testing, documentation |

---

## 8. Sokongan dan Penyelenggaraan

### 8.1 Dokumentasi

- ✅ README.md dengan panduan pemasangan
- ✅ GEMINI.md dengan konfigurasi projek
- 📋 User manual (dalam pembangunan)
- 📋 API documentation (dalam pembangunan)
- 📋 Deployment guide (dalam pembangunan)

### 8.2 Penyelenggaraan Berkala

- **Daily:** Monitor uptime dan error logs
- **Weekly:** Review user feedback dan bug reports
- **Monthly:** Performance analysis, security audit
- **Quarterly:** Feature planning, major updates

### 8.3 Sokongan Pengguna

- **Saluran:** Email, in-app feedback
- **Masa Respons:** < 24 jam untuk isu kritikal
- **Latihan:** On-demand training sessions untuk pengguna baru

---

## 9. Lampiran

### 9.1 Glosari

| Istilah             | Definisi                                                            |
| ------------------- | ------------------------------------------------------------------- |
| **CRUD**            | Create, Read, Update, Delete - operasi asas pangkalan data          |
| **RBAC**            | Role-Based Access Control - kawalan akses berasaskan peranan        |
| **PIC**             | Person In Charge - orang yang bertanggungjawab                      |
| **PPNP**            | Penolong Pengurus Nombor Pejabat (atau singkatan khusus organisasi) |
| **PN**              | Pengurus Nombor (atau singkatan khusus organisasi)                  |
| **Bulk Operations** | Operasi yang dilakukan pada berbilang rekod sekaligus               |
| **Audit Trail**     | Rekod kronologi aktiviti sistem untuk tujuan audit                  |

### 9.2 Rujukan

- [Next.js Documentation](https://nextjs.org/docs)
- [Google Sheets API](https://developers.google.com/sheets/api)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/docs)

### 9.3 Sejarah Versi

| Versi | Tarikh     | Perubahan                                |
| ----- | ---------- | ---------------------------------------- |
| 1.0   | 4 Jan 2026 | Versi awal PRD berdasarkan kod sedia ada |

---

**Disediakan oleh:** Gemini Code Assistant  
**Untuk:** Projek crud-surat-main  
**Tarikh Terakhir Dikemaskini:** 4 Januari 2026
