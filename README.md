# Sistem Pengurusan Surat dan Bayaran

Aplikasi web moden yang dibina untuk merekod, mengurus, dan menjejaki surat masuk serta status pembayaran yang berkaitan. Sistem ini direka untuk memudahkan staf yang bertanggungjawab dalam menguruskan aliran kerja surat-menyurat dan kewangan.

![Contoh Antara Muka Aplikasi](public/placeholder.jpg)
*(Gantikan imej ini dengan tangkapan skrin sebenar aplikasi anda)*

## ✨ Ciri-ciri Utama

- **Pengurusan Surat (CRUD):** Tambah, kemaskini, padam, dan lihat rekod surat dengan mudah.
- **Pengurusan Bayaran:** Jejaki dan kemaskini status bayaran untuk setiap surat yang berkaitan.
- **Papan Pemuka (Dashboard):** Antara muka pusat untuk visualisasi data, statistik ringkas, dan navigasi pantas.
- **Kawalan Akses Berasaskan Peranan:** Sistem role-based access control (RBAC) yang komprehensif dengan 8+ peranan pengguna berbeza.
- **Pengesahan Pengguna:** Sistem log masuk selamat untuk memastikan hanya staf yang dibenarkan boleh mengakses dan mengurus data.
- **Pautan Kongsi (Share Links):** Admin boleh menjana pautan selamat untuk berkongsi data bayaran yang ditapis dengan pihak luar (tanpa perlu log masuk).
- **Pengurusan Fail:** Setup dan pengurusan fail/dokumen dengan kaitan unit.
- **Jejak Audit:** Log automatik untuk semua operasi pembayaran.
- **Operasi Bulk:** Kemaskini status bayaran secara pukal untuk kecekapan.
- **Muat Naik Imej:** Membenarkan lampiran fail imej sebagai bukti bayaran atau rujukan surat, dihoskan melalui servis ImgBB.
- **Rekod Data Masa Nyata:** Menggunakan Google Sheets sebagai pangkalan data, membolehkan kolaborasi dan akses data yang mudah.

## 🚀 Teknologi yang Digunakan

- **Framework:** [Next.js 15.2.4](https://nextjs.org/) (App Router)
- **Frontend:** [React 19](https://react.dev/)
- **Bahasa:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [shadcn/ui](https://ui.shadcn.com/) + [Radix UI](https://www.radix-ui.com/)
- **Form Management:** [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/)
- **Pangkalan Data:** [Google Sheets API](https://developers.google.com/sheets/api)
- **Servis Imej:** [ImgBB API](https://api.imgbb.com/)
- **Notifications:** [Sonner](https://sonner.emilkowal.ski/)
- **Charts:** [Recharts](https://recharts.org/)
- **Pengurus Pakej:** [pnpm](https://pnpm.io/)

## 🛠️ Pemasangan dan Konfigurasi

Ikuti langkah-langkah di bawah untuk menjalankan projek ini di persekitaran tempatan (local environment).

### 1. Prasyarat

- [Node.js](https://nodejs.org/) (versi 18 atau lebih baru)
- [pnpm](https://pnpm.io/installation)

### 2. Clone Repositori

```bash
git clone https://github.com/nama-pengguna-anda/crud-surat-main.git
cd crud-surat-main
```

### 3. Pasang Ketergantungan (Install Dependencies)

```bash
pnpm install
```

### 4. Konfigurasi Environment Variables

Buat satu fail bernama `.env.local` di direktori utama projek. Salin kandungan di bawah dan isikan nilainya mengikut konfigurasi anda.

```env
# Kunci API untuk servis ImgBB
NEXT_PUBLIC_IMGBB_API_KEY="your_imgbb_api_key"

# ID Google Sheet
GOOGLE_SHEET_ID="your_google_sheet_id"

# Maklumat daripada Google Service Account JSON
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL="your_service_account_email@project.iam.gserviceaccount.com"
```

### 6. Setup Google Sheets

Pastikan Google Sheet anda mempunyai sheets berikut dengan struktur yang betul:

- `SURAT` - Rekod surat
- `REKOD BAYARAN` - Rekod pembayaran (column S: NAMA KONTRAKTOR auto-populated)
- `AUTH` - Pengesahan pengguna (column A-E: USER_ID, PASSWORD, NAME, UNIT/ROLE, TYPE)
- `UNIT` - Unit dan PIC mappings
- `KONTRAK` - Data kontrak (column A-D: KAWASAN, NO KONTRAK, KATEGORI, NAMA KONTRAKTOR)
- `AUDIT_BAYARAN` - Audit trail pembayaran
- `STATUS` - Konfigurasi status (column A-C: STATUS, COLOR_HEX, KATEGORI)
- `FAIL` - Data fail/dokumen dengan unit associations
- `SHARE_LINK` - Data pautan kongsi (column A-G: LINK_ID, FILTER_JSON, CREATED_BY, CREATED_AT, EXPIRES_AT, DESCRIPTION, ACCESS_COUNT)

> **Nota:** Service account Google perlu mempunyai akses Editor/Writer ke Google Sheet tersebut.

### 7. Jalankan Aplikasi

```bash
pnpm dev
```

Buka [http://localhost:3000](http://localhost:3000) di pelayar web anda.

## 📂 Struktur Projek

Berikut adalah gambaran ringkas struktur fail dan direktori utama dalam projek ini.

```
.
├── app/              # Routing, UI, dan logik utama aplikasi
│   ├── api/          # Laluan API (API Routes)
│   ├── dashboard/    # Halaman-halaman papan pemuka
│   └── layout.tsx    # Layout utama
├── components/       # Komponen UI yang boleh diguna semula
│   └── ui/           # Komponen dari shadcn/ui
├── lib/              # Fungsi bantuan dan servis (Google Sheets, ImgBB)
├── public/           # Aset statik (imej, ikon)
└── types/            # Definisi jenis TypeScript
```

## 📜 Skrip Tersedia

Dalam fail `package.json`, anda akan menemui beberapa skrip:

- `pnpm dev` - Menjalankan aplikasi dalam mod pembangunan (http://localhost:3000)
- `pnpm build` - Membina aplikasi untuk produksi
- `pnpm start` - Memulakan server produksi selepas `build`
- `pnpm lint` - Menjalankan ESLint untuk memeriksa ralat kod

## 🔐 Peranan Pengguna (User Roles)

Sistem ini menyokong kawalan akses berasaskan peranan dengan matriks akses berikut:

| Peranan | Dashboard | Surat | Bayaran | Statistik | Pengguna | Tetapan |
|---------|-----------|-------|---------|-----------|----------|---------|
| `semua` / `admin` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `KEWANGAN` | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `PERLADANGAN` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `PENGURUS` | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| `PEMASARAN` | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `PERANCANG` | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |
| `MSPO` | ❌ | ✅ | ❌ | ✅ | ❌ | ✅ |

**Jenis Pengguna Khas:**
- `VIEW` type - Akses read-only, disekat dari Surat dan Tetapan
- `PENERIMA` type - Penerima surat, disekat dari Surat dan Tetapan

## 🔗 Ciri Pautan Kongsi (Share Links)

Pengguna dengan peranan `semua` boleh:
1. Menjana pautan kongsi untuk rekod bayaran yang ditapis
2. Tetapkan tarikh luput (optional)
3. Jejaki bilangan akses untuk setiap pautan
4. Kongsi pautan dengan pihak luar tanpa perlu log masuk

**Akses:** Dashboard → Tetapan → Tab "Pautan Kongsi"

**Format URL:** `https://crudladang.vercel.app/share/[linkId]`

## 🤝 Sumbangan

Sumbangan adalah dialu-alukan! Sila fork repositori ini dan buat *pull request* untuk sebarang penambahbaikan atau pembetulan pepijat.

## 📄 Lesen

Projek ini dilesenkan di bawah Lesen MIT.
