# Gemini Code Assistant Configuration

This file helps Gemini understand your project's conventions and configurations.

## Project Overview

- **Description:** Web `crud-surat` ini bertujuan untuk memrekod setiap surat masuk dan status bayaran, ia dibina bagi memudahkan staf terpilih untuk tambah, edit, dan padam sesuatu surat atau rekod bayaran.
- **Tech Stack:** Next.js, TypeScript, Tailwind CSS, Google Sheets API

## Getting Started

1.  **Prerequisites:**
    - Node.js (v18 or later)
    - pnpm
2.  **Installation:**
    ```bash
    pnpm install
    ```
3.  **Running the Development Server:**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Development

- **Code Style:** Prettier (dikonfigurasikan dalam `package.json`)
- **Linting:** ESLint (dikonfigurasikan dalam `package.json`)
- **File Structure:**
  - `app/`: Routing, UI, dan logic utama aplikasi.
  - `components/`: Komponen UI yang boleh diguna semula.
  - `lib/`: Fungsi bantuan dan servis (cth: Google Sheets, ImgBB).
  - `types/`: Definisi jenis TypeScript.

## Penambahbaikan Terkini (Oleh Gemini)

Berikut adalah ringkasan penambahbaikan yang telah dilaksanakan:

1.  **UI Status "BATAL" Dipertingkat:**
    - Pada halaman "Rekod Bayaran", baris rekod yang berstatus "BATAL" kini diserlahkan dengan warna merah untuk pengenalan visual yang pantas.
    - Lencana (badge) ID untuk rekod "BATAL" juga diwarnakan merah.

2.  **Paparan Detail Rekod Lebih Informatif:**
    - Dalam tetingkap "Detail Rekod Bayaran", jejak masa (timeline) kini memaparkan ikon `!` merah untuk langkah-langkah yang telah selesai sebelum rekod dibatalkan.
    - Lencana "BATAL" yang jelas telah ditambah pada bahagian "Nota Kaki" untuk pengesahan status.

3.  **Logik Pengambilan Data Dikemaskini:**
    - Fungsi dalam `lib/google-sheets.ts` telah dirombak (refactored) untuk mengambil data dari lokasi baru dalam Google Sheets.
    - Aplikasi kini berjaya menarik data "UNIT" dan "PIC TINDAKAN" dari sheet `UNIT` (lajur A & B).
    - Fungsi `getUnitAndPicData` telah ditambah semula dan dikonfigurasi untuk berfungsi dengan sumber data yang baru, memastikan komponen yang bergantung padanya kekal berfungsi.

## Cadangan Penambahbaikan (Oleh Gemini)

Berikut adalah beberapa cadangan untuk meningkatkan kualiti, prestasi, dan kebolehselenggaraan (maintainability) projek ini pada masa hadapan.

### 1. Refactoring & Prestasi

- **Pecahkan Komponen (Component Abstraction):** Fail `app/dashboard/bayaran/page.tsx` sangat besar. Pertimbangkan untuk memecahkan logik UI kepada komponen yang lebih kecil dan boleh diguna semula (cth: `BayaranTable.tsx`, `DetailDialog.tsx`, `AddEditForm.tsx`). Ini akan menjadikan kod lebih mudah dibaca dan diurus.
- **Pengurusan State (State Management):** Komponen `BayaranPage` menggunakan banyak `useState`. Untuk komponen yang kompleks, penggunaan `useReducer` atau library seperti **Zustand** boleh mempermudahkan logik state dan mengurangkan kerumitan.
- **Pengambilan Data (Data Fetching):** Gunakan library seperti **SWR** atau **React Query** (seperti yang disebut dalam konfigurasi) untuk pengurusan cache yang lebih mantap, pengesahan semula automatik (automatic revalidation), dan kod yang lebih bersih berbanding `fetch` manual di dalam `useEffect`.

### 2. Pengalaman Pengguna (UX)

- **Penapisan Lanjutan (Advanced Filtering):** Tambah keupayaan untuk menapis mengikut julat tarikh (cth: dari 1 Ogos hingga 31 Ogos) berbanding hanya satu tarikh.
- **Tindakan Pukal (Bulk Actions):** Benarkan pengguna memilih beberapa rekod menggunakan checkbox dan melakukan tindakan serentak, seperti menukar status beberapa bayaran sekali gus.
- **Jejak Audit (Audit Trail):** Wujudkan log sejarah ringkas untuk setiap rekod bayaran (cth: "Status ditukar dari 'MENUNGGU' ke 'DALAM PROSES' oleh Pengguna A pada Tarikh B"). Ini boleh dilaksanakan sebagai sheet baru atau lajur tambahan di Google Sheets.

### 3. Backend & Keselamatan

- **Pengendalian Ralat (Error Handling):** Fungsi dalam `lib/google-sheets.ts` sering mengembalikan `[]` apabila berlaku ralat. Adalah lebih baik untuk `throw error` dan mengendalikannya dengan betul di laluan API (API routes) untuk membezakan antara "tiada data" dan "ralat berlaku".
- **Pengesahan Input Sebelah Backend (Backend-side Validation):** Laksanakan pengesahan data yang lebih kukuh di backend (API routes) menggunakan library seperti **Zod**. Ini adalah lapisan pertahanan kedua untuk memastikan data yang disimpan dalam Google Sheets adalah sah dan mengikut format yang betul.

## Custom Instructions for Gemini

- **Preferred Libraries:**
  - UI Components: `shadcn/ui`
  - State Management: (Nyatakan jika ada, cth: Zustand, Redux)
  - Data Fetching: `SWR` atau `React Query` (jika digunakan)
- **Code Generation Preferences:**
  - "Gunakan `pnpm` untuk semua arahan shell yang berkaitan dengan pakej."
  - "Sentiasa gunakan absolute imports untuk modul dalaman (cth: `import { MyComponent } from '@/components/my-component'`)."
  - "Untuk komponen UI baharu, ikut struktur dan gaya yang sedia ada dalam direktori `components/ui`."
- **Do Not Touch:**
  - (Senaraikan fail atau direktori yang tidak sepatutnya diubah oleh Gemini, cth: `.env.local`, `next.config.mjs` melainkan diminta secara spesifik).

## Environment Variables

1. NEXT_PUBLIC_IMGBB_API_KEY
2. GOOGLE_APPLICATION_CREDENTIALS
3. GOOGLE_SHEET_ID
4. GOOGLE_PRIVATE_KEY
5. GOOGLE_CLIENT_EMAIL