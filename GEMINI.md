# Gemini Code Assistant Configuration

This file helps Gemini understand your project's conventions and configurations.

## Project Overview

- **Description:** (Cadangan: Terangkan secara ringkas tentang projek `crud-surat` ini, tujuan utamanya, dan untuk siapa ia dibina.)
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
