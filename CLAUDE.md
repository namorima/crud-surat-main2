# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- `pnpm dev` - Start development server (Next.js)
- `pnpm build` - Build application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint to check code quality

### Package Management

- Use `pnpm` as the package manager (not npm or yarn)
- `pnpm install` - Install dependencies

## Architecture Overview

### Application Type

Next.js 15 application with TypeScript, using App Router and React 19. This is a Malaysian government letter and payment management system ("Sistem Pengurusan Surat dan Bayaran").

### Data Storage Architecture

- **Primary Database**: Google Sheets API (not traditional database)
- **Image Storage**: ImgBB API for file uploads
- **Authentication**: Custom implementation with localStorage
- **Key Sheets**:
  - `SURAT` - Letter records
  - `REKOD BAYARAN` - Payment records (includes auto-populated NAMA KONTRAKTOR in column S)
  - `AUTH` - User authentication and configuration data
  - `UNIT` - Unit and PIC (Person in Charge) mappings
  - `KONTRAK` - Contract and category data (KAWASAN, NO KONTRAK, KATEGORI, NAMA KONTRAKTOR)
  - `AUDIT_BAYARAN` - Payment audit trail
  - `STATUS` - Status configurations for Status Ladang and Status Bayaran

### Core Data Types

- `Surat` - Letter management with status tracking (types/surat.ts:11)
- `Bayaran` - Payment records with extensive financial workflow (types/bayaran.ts)
- `User` - Authentication with role-based access (types/user.ts)

### Key Business Logic

- **Role-based Access**: Different dashboards for different user roles
  - `KEWANGAN` users → `/dashboard/bayaran` (Finance dashboard)
  - Other users → `/dashboard/surat` (Letter dashboard)
- **Google Sheets Integration**: All CRUD operations go through Google Sheets API (lib/google-sheets.ts)
- **Audit Trail**: Payment operations are logged to `AUDIT_BAYARAN` sheet
- **Bulk Operations**: Support for bulk status updates on payment records
- **Auto-populated Contractor Names**: When adding/updating payment records, contractor names are automatically looked up from KONTRAK sheet and stored in REKOD BAYARAN column S
- **Display Logic**: Payment tables show contractor names instead of contract numbers for better readability

### Authentication Flow

- Custom auth provider using Google Sheets as user store (lib/auth-provider.tsx)
- User credentials stored in `AUTH` sheet
- Session persistence via localStorage
- Protected routes with role-based redirection

### UI Architecture

- **Styling**: Tailwind CSS with shadcn/ui components
- **Forms**: React Hook Form with Zod validation
- **State Management**: React Context for authentication
- **Theme**: Dark/light mode toggle support

## Environment Setup

### Required Environment Variables

```env
NEXT_PUBLIC_IMGBB_API_KEY="your_imgbb_api_key"
GOOGLE_SHEET_ID="your_google_sheet_id"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL="your_service_account_email"
```

### Google Sheets Setup

The application expects specific sheet structures:

- Sheets must exist: `SURAT`, `REKOD BAYARAN`, `AUTH`, `UNIT`, `KONTRAK`, `AUDIT_BAYARAN`, `STATUS`
- Column mappings are hardcoded in `lib/google-sheets.ts`
- Service account needs Sheets API access
- `KONTRAK` sheet structure: Column A=KAWASAN, B=NO KONTRAK, C=KATEGORI, D=NAMA KONTRAKTOR
- `REKOD BAYARAN` sheet: Column S=NAMA KONTRAKTOR (auto-populated from KONTRAK sheet)
- `STATUS` sheet structure: Column A=STATUS, B=COLOR_HEX, C=KATEGORI (either "STATUS LADANG" or "STATUS BAYARAN")
- `AUTH` sheet structure: Column A=USER_ID, B=PASSWORD, C=NAME, D=UNIT/ROLE, E=TYPE 
  - For users: E is empty or contains role info, D contains user role
  - For recipients: E contains "PENERIMA", C contains recipient name, D contains unit

## Development Guidelines

### Working with Google Sheets

- All data operations go through `lib/google-sheets.ts`
- Row indices are 0-based but sheet operations add +2 for headers
- Use `getAllSurat()`, `getAllBayaran()` for data fetching
- Audit logging is automatic for payment operations

### Adding New Features

- Follow existing patterns in `app/dashboard/` for new pages
- Use shadcn/ui components from `components/ui/`
- TypeScript types are defined in `types/` directory
- API routes follow Next.js App Router conventions in `app/api/`

### Authentication Integration

- Use `useAuth()` hook from `lib/auth-provider.tsx`
- Check user roles for feature access
- Protected pages should redirect unauthenticated users

### Error Handling

- Google Sheets operations include comprehensive error handling
- Display user-friendly error messages for sheet access issues
- ImgBB upload failures should be gracefully handled
