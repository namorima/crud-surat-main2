# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Essential Commands

- `pnpm dev` - Start development server (Next.js on http://localhost:3000)
- `pnpm build` - Build application for production
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint to check code quality

### Package Management

- Use `pnpm` as the package manager (not npm or yarn)
- `pnpm install` - Install dependencies

## Architecture Overview

### Application Type

**Next.js 15** application with **TypeScript** and **React 19**, using the **App Router**. This is a Malaysian government/plantation letter and payment management system ("Sistem Pengurusan Surat dan Bayaran").

**Production URL**: https://crudladang.vercel.app

### Data Storage Architecture

The application uses a **dual-database architecture**:

- **Primary Database**: **Supabase** (PostgreSQL) - All CRUD operations now use Supabase
- **Legacy Database**: Google Sheets API (kept as backup, code preserved in `lib/google-sheets.ts`)
- **Image Storage**: ImgBB API for file uploads
- **Authentication**: Custom implementation with localStorage and session management

#### Supabase Database Tables

1. **`surat`** - Letter/mail records
   - Columns: `id`, `bil`, `daripada_kepada`, `tarikh`, `perkara`, `kategori`, `unit`, `fail`, `tindakan_pic`, `status`, `tarikh_selesai`, `nota`, `komen`, `reference`
   - Auto-increment: `bil` field uses sequence `surat_bil_seq`

2. **`bayaran`** - Payment records
   - Columns: `id`, `ids`, `daripada`, `tarikh_terima`, `perkara`, `nilai_bayaran`, `bayaran_ke`, `kategori`, `no_kontrak`, `nama_kontraktor`, `tarikh_memo_ladang`, `status_ladang`, `tarikh_hantar`, `tarikh_ppnp`, `tarikh_pn`, `penerima`, `status_bayaran`, `tarikh_bayar`, `nombor_baucer`, `nota_kaki`, `created_at`, `updated_at`
   - Auto-populated: `nama_kontraktor` via trigger function

3. **`fail`** - File/document management
   - Columns: `id`, `part`, `no_locker`, `no_fail`, `pecahan`, `pecahan_kecil`, `unit`, `created_at`
   - Parts: "HASIL", "PERTANIAN AM", "KONTRAK"

4. **`users`** - User authentication and profile
   - Columns: `id`, `username`, `password`, `name`, `role`, `role_id`, `type`, `email`, `is_password_changed`, `must_change_password`, `last_password_change`, `created_at`, `updated_at`
   - Password: bcrypt hashed
   - User types: normal (empty), "VIEW", "PENERIMA"

5. **`audit_bayaran`** - Payment audit trail
   - Columns: `id`, `bayaran_id`, `action`, `changed_by`, `old_values`, `new_values`, `timestamp`

6. **`unit_pic`** - Unit and PIC (Person in Charge) mappings
   - Columns: `id`, `unit`, `pic`, `created_at`

7. **`kontrak`** - Contract and category data
   - Columns: `id`, `kawasan`, `no_kontrak`, `kategori`, `nama_kontraktor`, `tarikh_mula`, `tarikh_akhir`, `tahun_kontrak` (generated from `tarikh_mula`), `jenis_kerja`, `kerja` (work name, free text), `nilai_kontrak` (RM, numeric(14,2), optional), `created_at`
   - New columns come from [add-kontrak-fields.sql](add-kontrak-fields.sql), [add-kontrak-kerja.sql](add-kontrak-kerja.sql) and [add-kontrak-nilai.sql](add-kontrak-nilai.sql); kategori and jenis kerja options are in [lib/kontrak-input.ts](lib/kontrak-input.ts)

8. **`kontraktor`** - Contractor master data (vendor and bank details)
   - Columns: `id`, `nama_kontraktor` (unique, case-insensitive), `no_vendor`, `nama_akaun`, `nombor_akaun`, `jenis_bank`, `created_at`, `updated_at`
   - Created by [create-kontraktor.sql](create-kontraktor.sql); RLS enabled with no policies, so only the service role (API routes) can access it
   - Feeds the Nama Kontraktor dropdown in Tetapan → Kontrak; renaming a contractor rewrites `kontrak.nama_kontraktor` and `bayaran.nama_kontraktor`

9. **`status_config`** - Status configurations
   - Columns: `id`, `status`, `color_hex`, `kategori`, `created_at`
   - Categories: "STATUS LADANG", "STATUS BAYARAN"

10. **`share_links`** - Share link data
   - Columns: `id`, `link_id`, `filter_json`, `created_by`, `created_at`, `expires_at`, `description`, `access_count`

11. **`permissions`** - RBAC permissions
    - Columns: `id`, `resource`, `action`, `display_name`, `description`, `created_at`

12. **`roles`** - RBAC roles
    - Columns: `id`, `name`, `display_name`, `description`, `is_system_role`, `created_at`, `updated_at`

13. **`role_permissions`** - RBAC role-permission junction
    - Columns: `id`, `role_id`, `permission_id`, `created_at`

14. **`password_reset_tokens`** - One-time reset links (SHA-256 of the token only)
    - Columns: `id`, `user_id`, `token_hash`, `expires_at`, `used_at`, `created_at`

### Core Data Types

Located in `types/` directory:

- **`Surat`** ([types/surat.ts](types/surat.ts)) - Letter management with status tracking
  - Status: "BELUM PROSES" | "HOLD / KIV" | "DALAM TINDAKAN" | "SELESAI" | "BATAL"
  - Reference field: Links to related letters (for responses)

- **`Bayaran`** ([types/bayaran.ts](types/bayaran.ts)) - Payment records with financial workflow
  - Includes auto-populated `namaKontraktor` field
  - Multiple date fields: `tarikhTerima`, `tarikhMemoLadang`, `tarikhHantar`, `tarikhPpnP`, `tarikhPn`, `tarikhBayar`

- **`User`** ([types/user.ts](types/user.ts)) - Authentication with role-based access
  - Legacy role field + new RBAC role_id field
  - Optional type field: "VIEW", "PENERIMA", or empty
  - Password management fields: `is_password_changed`, `must_change_password`, `last_password_change`

- **`Fail`** ([types/fail.ts](types/fail.ts)) - File/document management
  - Parts: "HASIL" | "PERTANIAN AM" | "KONTRAK"

- **`ShareLink`** ([types/share-link.ts](types/share-link.ts)) - Share link data

- **RBAC Types** ([types/rbac.ts](types/rbac.ts)) - Permission, Role, RolePermission, PermissionCheck

### Key Business Logic

#### Authentication & Authorization

0. **Server-side session (API protection)**
   - Login ([app/api/auth/login/route.ts](app/api/auth/login/route.ts)) sets an HttpOnly signed cookie `crud_session` ([lib/session.ts](lib/session.ts), HMAC-SHA256 with `SESSION_SECRET`, falling back to `SUPABASE_SERVICE_ROLE_KEY`); `/api/auth/logout` clears it
   - [middleware.ts](middleware.ts) rejects every `/api` request without a valid cookie (401), except login/logout, forgot/reset password and the public share-link routes (`GET /api/share-link/[id]`, `GET /api/share-link/[id]/bayaran`, `POST /api/share-link/[id]/increment`)
   - Sensitive routes also check permissions server-side with `requirePermission()` ([lib/server-auth.ts](lib/server-auth.ts)): users/roles/permissions (pengguna), kontrak/kontraktor and share-link management (tetapan)
   - The client logs out on any 401 from `/api` ([lib/auth-provider.tsx](lib/auth-provider.tsx))
   - `/share/[id]` fetches only its rows from `/api/share-link/[id]/bayaran` (filtered server-side by [lib/share-filter.ts](lib/share-filter.ts))
   - RLS: run [enable-rls.sql](enable-rls.sql) once this code is deployed everywhere; the app only uses the service-role client

1. **Custom Auth Provider** ([lib/auth-provider.tsx](lib/auth-provider.tsx))
   - User credentials stored in Supabase `users` table
   - Session persistence via localStorage
   - Password hashing using bcrypt ([lib/password.ts](lib/password.ts))
   - Automatic migration from plain-text to bcrypt passwords
   - First-time password change enforcement
   - Permission fetching and caching

2. **Role-Based Access Control (RBAC)** ([lib/rbac.ts](lib/rbac.ts))
   - Dual system: New RBAC + Legacy role-based access
   - Permission-based navigation filtering ([components/dashboard/sidebar.tsx](components/dashboard/sidebar.tsx))
   - RBAC functions: `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`, `canView()`, `canCreate()`, `canEdit()`, `canDelete()`

3. **Legacy Role Access Matrix**
   - `semua`, `Super Admin`, `admin` - Full access to all pages
   - `KEWANGAN` - Bayaran page only
   - `PERLADANGAN`, `PENGURUS` - Dashboard, Surat, Bayaran, Tetapan
   - `PEMASARAN`, `PERANCANG`, `MSPO` - Dashboard (Surat analysis only), Surat, Tetapan (NO Bayaran)
   - `VIEW` type users - Filtered access based on RBAC permissions
   - `PENERIMA` type users - Filtered access based on RBAC permissions

4. **Navigation Item Permissions** ([components/dashboard/sidebar.tsx](components/dashboard/sidebar.tsx:22-65))
   - Dashboard: `{ resource: 'dashboard', action: 'view' }`
   - Surat: `{ resource: 'surat', action: 'view' }`
   - Bayaran: `{ resource: 'bayaran', action: 'view' }`
   - Dashboard also opens for `{ resource: 'statistik', action: 'view' }` (Statistik was merged into Dashboard; `/dashboard/statistik` redirects)
   - Pengguna: `{ resource: 'pengguna', action: 'view' }`
   - Tetapan: `{ resource: 'tetapan', action: 'view' }`

#### Database Operations

1. **Supabase Integration** ([lib/supabase-db.ts](lib/supabase-db.ts))
   - All CRUD operations use Supabase PostgreSQL
   - Date formatting: Database uses YYYY-MM-DD, Display uses DD/MM/YYYY
   - Helper functions: `formatDateToDB()`, `formatDateFromDB()`
   - Auto-increment BIL field using database sequence
   - Audit logging for payment operations

2. **Key Functions**:
   - Surat: `getAllSurat()`, `addSurat()`, `updateSurat()`, `deleteSurat()`
   - Bayaran: `getAllBayaran()`, `addBayaran()`, `updateBayaran()`, `deleteBayaran()`, `bulkUpdateBayaran()`
   - Users: `getAllUsers()`, `getUserById()`, `addUser()`, `updateUser()`, `deleteUser()`, `updateUserPassword()`
   - Fail: `getAllFail()`, `addFail()`, `updateFail()`, `deleteFail()`
   - Kontrak: `getAllKontrak()`, `addKontrak()`, `updateKontrak()`, `deleteKontrak()`, `syncAllBayaranKontraktor()`
   - Kontraktor: `getAllKontraktor()`, `addKontraktor()`, `updateKontraktor()`, `deleteKontraktor()` (refuses while a kontrak uses the name)
   - Share Links: `getAllShareLinks()`, `getShareLinkById()`, `addShareLink()`, `deleteShareLink()`, `incrementShareLinkAccess()`
   - RBAC: `getAllRoles()`, `getRoleById()`, `createRole()`, `updateRole()`, `deleteRole()`, `assignPermissionsToRole()`, `getUserPermissions()`

3. **Audit Trail**
   - Payment operations automatically logged to `audit_bayaran` table
   - Tracks: action type, user, old values, new values, timestamp

4. **Bulk Operations**
   - Support for bulk status updates on payment records
   - Single transaction for data integrity

5. **Auto-populated Fields**
   - Contractor names (`nama_kontraktor`) automatically looked up from `kontrak` table via trigger function
   - Display logic: Payment tables show contractor names instead of contract numbers

#### Password Management

1. **Password Reset Flow**
   - **On hold**: both routes return 410 and the login page says "Hubungi pentadbir" unless `NEXT_PUBLIC_PASSWORD_RESET="on"` ([lib/password-reset-flag.ts](lib/password-reset-flag.ts)); turn it on once a sending domain is verified in Resend
   - Forgot Password ([app/forgot-password/page.tsx](app/forgot-password/page.tsx)): emails a one-time link via Resend (`RESEND_API_KEY`, optional `RESEND_FROM`, link base `NEXT_PUBLIC_SITE_URL`). Same reply whether or not the email exists; one email per user per minute
   - Reset Password ([app/reset-password/page.tsx](app/reset-password/page.tsx)): link is `/reset-password#token=...`; token valid 1 hour, single use. Only its SHA-256 is stored in `password_reset_tokens` ([create-password-reset-tokens.sql](create-password-reset-tokens.sql)); logic in [lib/password-reset.ts](lib/password-reset.ts)
   - Users without an email in `users` cannot self-reset; an admin resets them from Pengguna
   - Change Password: Authenticated user changes password ([app/change-password/page.tsx](app/change-password/page.tsx))
   - Admin Reset: Admin can reset any user's password ([app/api/auth/reset-password-admin/route.ts](app/api/auth/reset-password-admin/route.ts))

2. **Password Security**
   - bcrypt hashing with salt rounds
   - Automatic migration from plain-text to bcrypt on login
   - First-time password change enforcement
   - Password validation with strength indicator ([components/auth/PasswordStrengthIndicator.tsx](components/auth/PasswordStrengthIndicator.tsx))

### UI Architecture

- **Styling**: Tailwind CSS v4 (CSS-first config in [app/globals.css](app/globals.css)) with BoardUI design tokens ([styles/theme.css](styles/theme.css), [styles/typography.css](styles/typography.css))
- **BoardUI**: source-owned components in [components/base/](components/base/), [components/application/](components/application/), [components/foundations/](components/foundations/); merge classes with `cx()` from [utils/cx.ts](utils/cx.ts). The dashboard frame is [components/dashboard/app-shell.tsx](components/dashboard/app-shell.tsx)
- **Components**: shadcn/ui + Radix UI primitives ([components/ui/](components/ui/))
- **Forms**: React Hook Form with Zod validation ([types/bayaran-schema.ts](types/bayaran-schema.ts))
- **State Management**: React Context for authentication
- **Theme**: Dark/light mode toggle support ([components/theme-provider.tsx](components/theme-provider.tsx))
- **Charts**: Recharts + HTML bar lists on the Dashboard ([components/dashboard/charts.tsx](components/dashboard/charts.tsx)); chart colours are `--viz-*` tokens in [app/globals.css](app/globals.css)
- **Notifications**: Sonner toast notifications ([hooks/use-toast.ts](hooks/use-toast.ts))
- **Motion**: CSS-only, defined at the end of [app/globals.css](app/globals.css) (`--ease-out-soft`, `--ease-sheet`)
  - `motion-page`: page rise, from [app/dashboard/template.tsx](app/dashboard/template.tsx)
  - `motion-panel`: BoardUI tab panels
  - `motion-stagger`: put on a list's `ul`/`tbody` and its first 12 children come in one by one (rows only fade)
  - `motion-bar`: Dashboard bar lists
  - `motion-press`: tap feedback
  - Dialogs slide up as a sheet on phones and zoom on desktop; the nav drawer animates out
  - Entrances use fill-mode `backwards` so no transform stays behind; `prefers-reduced-motion` turns all of it off except spinners

## Environment Setup

### Required Environment Variables

Create a `.env.local` file in the project root:

```env
# ImgBB API for image uploads
NEXT_PUBLIC_IMGBB_API_KEY="your_imgbb_api_key"

# Password reset emails (Resend). Off unless NEXT_PUBLIC_PASSWORD_RESET="on"; RESEND_FROM must use a domain verified in Resend
NEXT_PUBLIC_PASSWORD_RESET="off"
RESEND_API_KEY="re_..."
RESEND_FROM="Sistem Surat & Bayaran <noreply@your-domain>"
NEXT_PUBLIC_SITE_URL="https://crudladang.vercel.app"

# Session cookie signing (recommended; falls back to SUPABASE_SERVICE_ROLE_KEY)
SESSION_SECRET="a-long-random-string"

# Supabase (Primary Database)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_SERVICE_ROLE_KEY="your_service_role_key"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_anon_key"

# Google Sheets (Legacy - Kept as backup)
GOOGLE_SHEET_ID="your_google_sheet_id"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key\n-----END PRIVATE KEY-----"
GOOGLE_CLIENT_EMAIL="your_service_account_email@project.iam.gserviceaccount.com"
```

### Supabase Setup

1. **Create Database Schema**
   - Run the SQL in [supabase-schema.sql](supabase-schema.sql) in Supabase SQL Editor
   - Creates all 12 tables with proper relationships and indexes

2. **Setup RBAC Tables**
   - Run the SQL in [rbac-schema.sql](rbac-schema.sql) to create RBAC structure
   - Run [rbac-seed.sql](rbac-seed.sql) to populate default roles and permissions

3. **Verify Tables Created**
   - Check Supabase Table Editor for all tables
   - Verify Row Level Security (RLS) is disabled (service role bypasses RLS)

4. **Migration from Google Sheets** (Optional)
   - If migrating from Google Sheets, use migration script: `npx tsx scripts/migrate-to-supabase.ts`
   - See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions

## Development Guidelines

### Working with Supabase

1. **Database Operations**
   - All CRUD operations go through [lib/supabase-db.ts](lib/supabase-db.ts)
   - Use helper functions: `getAllSurat()`, `addSurat()`, `updateSurat()`, `deleteSurat()`
   - Never access database directly from components - always use API routes

2. **Date Handling**
   - Database stores dates in `YYYY-MM-DD` format
   - Display shows dates in `DD/MM/YYYY` format
   - Use `formatDateToDB()` and `formatDateFromDB()` helpers

3. **Error Handling**
   - Supabase operations include comprehensive error handling
   - Display user-friendly error messages
   - Log errors to console for debugging

4. **Audit Logging**
   - Payment operations automatically logged to `audit_bayaran` table
   - No manual logging required

### Adding New Features

1. **Page Structure**
   - Follow existing patterns in [app/dashboard/](app/dashboard/)
   - Use shadcn/ui components from [components/ui/](components/ui/)
   - Create feature-specific components in [components/](components/)

2. **TypeScript Types**
   - Define types in [types/](types/) directory
   - Export types for reuse across components

3. **API Routes**
   - Follow Next.js App Router conventions in [app/api/](app/api/)
   - **IMPORTANT**: Next.js 15 requires `params` in dynamic routes to be awaited:
   ```typescript
   export async function GET(
     request: Request,
     { params }: { params: Promise<{ id: string }> }
   ) {
     const { id } = await params
     // ...
   }
   ```

4. **Form Validation**
   - Use React Hook Form + Zod
   - Define schemas in [types/](types/) directory
   - Example: [types/bayaran-schema.ts](types/bayaran-schema.ts)

### Authentication Integration

1. **Using the Auth Hook**
   ```typescript
   import { useAuth } from "@/lib/auth-provider"

   const { user, login, logout, refreshPermissions, loading } = useAuth()
   ```

2. **Protected Routes**
   - Use layout wrapper: [app/dashboard/layout.tsx](app/dashboard/layout.tsx)
   - Redirects unauthenticated users to login

3. **Permission Checks**
   ```typescript
   import { hasPermission, canView, canEdit } from "@/lib/rbac"

   // Check specific permission
   if (hasPermission(user.permissions, { resource: 'surat', action: 'edit' })) {
     // Show edit button
   }

   // Convenience functions
   if (canView(user.permissions, 'bayaran')) {
     // Show bayaran section
   }
   ```

4. **Legacy Role Checks**
   ```typescript
   // For backward compatibility
   if (user?.role === "semua" || user?.role === "admin") {
     // Admin-only feature
   }
   ```

### Error Handling

1. **API Error Handling**
   - Return appropriate HTTP status codes
   - Include error details in response body
   - Log errors server-side

2. **Client Error Handling**
   - Show toast notifications for user feedback
   - Display inline error messages in forms
   - Gracefully handle network errors

3. **Database Error Handling**
   - Catch Supabase errors
   - Handle unique constraint violations
   - Handle foreign key violations

## Navigation and UI Patterns

### Role-Based Navigation

The sidebar navigation ([components/dashboard/sidebar.tsx](components/dashboard/sidebar.tsx)) uses permission-based filtering:

```typescript
// RBAC permission check (primary)
if (user?.permissions && user.permissions.length > 0) {
  return hasPermission(user.permissions, item.requiredPermission)
}

// Fallback to legacy role check
if (item.legacyRoles && user?.role) {
  if (user.role === "KEWANGAN") {
    return item.name === "Bayaran"
  }
  return item.legacyRoles.includes(user.role)
}
```

### Query Parameter Navigation

The application uses query parameters for navigation tracking:

- **Setup Fail Access**: Navigate with `?from=surat` to enable back button
- **Implementation**:
  ```typescript
  // In source page
  <Link href="/dashboard/tetapan?from=surat">Setup Fail</Link>

  // In destination page
  const searchParams = useSearchParams()
  const fromSurat = searchParams.get("from") === "surat"
  {fromSurat && <Button onClick={() => router.back()}>Kembali</Button>}
  ```

### Fail (File) Selection UI

When users add new Surat records:
- If no Fail options exist for selected unit, display helper text with link to Setup Fail
- Link styling: Bold red text (`text-red-600 hover:text-red-700 font-bold`)
- Link includes query parameter for back navigation
- Implementation in both Add and Edit Surat dialogs

## Share Link Feature (Pautan Kongsi)

### Overview

The Share Link feature allows admin users (role "semua") to generate secure, shareable links for filtered payment records. These links can be shared with external parties for read-only access to specific payment data.

### Key Features

- **Role-Based Access**: Only "semua" role can create and manage share links
- **Multiple Filters**: Support for filtering by category, contract, area, status, contractor, and date range
- **Optional Expiry**: Links can have expiry dates or be permanent
- **Access Tracking**: Tracks how many times each link has been accessed
- **URL Encoding**: Uses random 12-character IDs to prevent manipulation
- **Public Access**: No authentication required to view shared links
- **Responsive Design**: Desktop and mobile-optimized views

### Architecture

#### Database Structure

**`share_links` Table**:
- `id` (UUID) - Primary key
- `link_id` (TEXT) - Unique random 12-character string
- `filter_json` (JSONB) - Filter criteria
- `created_by` (TEXT) - Name of user who created the link
- `created_at` (TIMESTAMP) - Creation timestamp
- `expires_at` (TIMESTAMP) - Expiry timestamp (optional)
- `description` (TEXT) - User-provided description (optional)
- `access_count` (INTEGER) - Number of times link was accessed

#### Filter JSON Structure

```json
{
  "kategori": ["PERTANIAN AM", "KONTRAK"],
  "noKontrak": ["K001", "K002"],
  "kawasan": ["LADANG A", "LADANG B"],
  "statusBayaran": ["DALAM PROSES"],
  "namaKontraktor": ["CONTRACTOR SDN BHD"],
  "dateRange": {
    "from": "2025-01-01T00:00:00.000Z",
    "to": "2025-12-31T23:59:59.999Z"
  }
}
```

### Components

#### Admin Components (Role "semua" only)

1. **ShareLinkForm** ([components/share/ShareLinkForm.tsx](components/share/ShareLinkForm.tsx))
   - Multi-filter selection interface
   - Optional expiry date picker
   - Optional description field
   - Fetches form options from `/api/bayaran-form-data`
   - Validates at least one filter is selected

2. **ShareLinkTable** ([components/share/ShareLinkTable.tsx](components/share/ShareLinkTable.tsx))
   - Displays list of all share links
   - Shows link ID, filters, creator, dates, access count, status
   - Actions: Copy link, Open in new tab, Delete
   - Status badges: "Aktif" (green) or "Tamat Tempoh" (red)

3. **FilterSummaryBadges** ([components/share/FilterSummaryBadges.tsx](components/share/FilterSummaryBadges.tsx))
   - Displays active filters as badge pills
   - Used in both admin and public views
   - Shows filter values in readable format

#### Public Components

4. **PublicBayaranTable** ([components/share/PublicBayaranTable.tsx](components/share/PublicBayaranTable.tsx))
   - Simplified read-only payment table
   - Desktop: Full table with essential columns
   - Mobile: Card-based layout
   - No action buttons or edit capabilities

### API Routes

#### Admin Routes (Auth Required)

- `GET /api/share-link` - Fetch all share links ([app/api/share-link/route.ts](app/api/share-link/route.ts))
- `POST /api/share-link` - Create new share link
- `DELETE /api/share-link/[id]` - Delete share link ([app/api/share-link/[id]/route.ts](app/api/share-link/[id]/route.ts))

#### Public Routes (No Auth)

- `GET /api/share-link/[id]` - Get link details (checks expiry)
- `POST /api/share-link/[id]/increment` - Increment access count ([app/api/share-link/[id]/increment/route.ts](app/api/share-link/[id]/increment/route.ts))

### Usage Flow

#### Creating a Share Link

1. Admin navigates to Tetapan > Pautan Kongsi tab
2. Selects desired filters (kategori, kontrak, kawasan, etc.)
3. Optionally sets expiry date and description
4. Clicks "Jana Pautan" button
5. System generates random link ID
6. Link is automatically copied to clipboard
7. Link appears in the share links table

#### Accessing a Share Link

1. User visits `https://crudladang.vercel.app/share/[linkId]`
2. System fetches link details and checks validity
3. If valid, increments access count
4. Fetches all payment records from database
5. Applies filters specified in the link
6. Displays filtered results in read-only table
7. Shows filter criteria and expiry info (if any)

### Integration Points

#### Tetapan Page

- Tab "Pautan Kongsi" in [app/dashboard/tetapan/page.tsx](app/dashboard/tetapan/page.tsx)
- Only visible to users with role "semua"
- Fetches share links on mount
- Handles create and delete operations
- Displays success/error toasts

#### Supabase Functions

- `getAllShareLinks()` - Fetches all links from `share_links` table
- `getShareLinkById(id)` - Fetches single link by ID
- `addShareLink(data)` - Creates new link with generated ID
- `deleteShareLink(id)` - Removes link from table
- `incrementShareLinkAccess(id)` - Updates access count

### Security Considerations

1. **Random Link IDs**: 12-character UUIDs prevent guessing
2. **Expiry Enforcement**: Backend validates expiry before serving data
3. **Read-Only Access**: Public page has no mutation capabilities
4. **Role-Based Management**: Only "semua" role can create/delete links
5. **No Sensitive Data**: Public view shows filtered subset only

### URL Patterns

- Admin management: `https://crudladang.vercel.app/dashboard/tetapan` (Tab: Pautan Kongsi)
- Public share link: `https://crudladang.vercel.app/share/[linkId]`
- Example: `https://crudladang.vercel.app/share/a1b2c3d4e5f6`

### Error Handling

- **404**: Link not found or invalid ID
- **410**: Link has expired
- **500**: Server error (Database access issues)
- Public page shows user-friendly error messages
- Admin operations show toast notifications

## Page Structure

### Dashboard Pages

1. **Main Dashboard** ([app/dashboard/page.tsx](app/dashboard/page.tsx)) - Dashboard and Statistik in one page
   - Bayaran / Surat toggle (each shown only with that page's permission) and a period filter (12 bulan, tahun ini, semua)
   - Bayaran: KPIs, monthly paid vs unpaid value, process funnel, unpaid ageing, value by kawasan/kategori/kontraktor, unpaid by penerima, status
   - Surat: KPIs, monthly masuk vs keluar, status, open-letter ageing, open letters by PIC, by unit
   - Aggregations are pure functions in [lib/dashboard-stats.ts](lib/dashboard-stats.ts)

2. **Surat (Letters)** ([app/dashboard/surat/page.tsx](app/dashboard/surat/page.tsx))
   - Full CRUD operations
   - Search, filter, pagination
   - Status tracking
   - Reference linking

3. **Bayaran (Payments)** ([app/dashboard/bayaran/page.tsx](app/dashboard/bayaran/page.tsx))
   - Payment record management
   - Bulk status updates
   - Audit trail
   - Export functionality

4. **Pengguna (Users)** ([app/dashboard/pengguna/page.tsx](app/dashboard/pengguna/page.tsx))
   - User management
   - Role assignment
   - Permission management
   - PIC mapping

5. **Tetapan (Settings)** ([app/dashboard/tetapan/page.tsx](app/dashboard/tetapan/page.tsx))
   - Status configuration
   - Unit PIC management
   - Fail/file setup
   - Share links management

### Auth Pages

- **Login** ([app/login/page.tsx](app/login/page.tsx))
- **Forgot Password** ([app/forgot-password/page.tsx](app/forgot-password/page.tsx))
- **Reset Password** ([app/reset-password/page.tsx](app/reset-password/page.tsx))
- **Change Password** ([app/change-password/page.tsx](app/change-password/page.tsx))

### Public Pages

- **Share Link View** ([app/share/[id]/page.tsx](app/share/[id]/page.tsx))

## Component Structure

### Feature Components

1. **Bayaran Components** ([components/bayaran/](components/bayaran/))
   - `AddEditForm.tsx` - Add/Edit payment form in three numbered sections (Maklumat Bayaran, Proses Ladang, Kewangan); later sections show a hint until the earlier date is filled; KEWANGAN/PENERIMA edits are locked except status bayaran, tarikh bayar, baucer
   - `BayaranTable.tsx` - BoardUI table (md+: ID, Terima, Perkara, Nilai, Kontraktor from lg, Status with stage dots) and neutral phone cards; rows are not tinted
   - `BayaranHeader.tsx` - Header with bulk actions
   - `BulkEditDialog.tsx` - Bulk update dialog
   - `DetailDialog.tsx` - "Rekod Bayaran #…" detail: amount, fields (incl. Kerja and Nilai Kontrak of its kontrak, from `kontrakInfo` in `/api/bayaran-form-data`, loaded on first open), tracking timeline; Padam / Tutup / Edit / Share
   - `progress.tsx` - process steps (Memo → PPN(P) → PN → Hantar → Bayar) and the `StageDots` indicator

2. **Share Components** ([components/share/](components/share/))
   - `ShareLinkForm.tsx` - Create share link form (renders the dialog body and footer; the page owns the dialog header)
   - `ShareLinkTable.tsx` - Share links management table (table from `lg`, cards below, RowActions)
   - `PublicBayaranTable.tsx` - Public payment table
   - `FilterSummaryBadges.tsx` - Filter badges display

3. **Pengguna Components** ([components/pengguna/](components/pengguna/)) — the page uses BoardUI `Tabs`, a users table from `md` (cards below) and AlertDialogs for delete / reset password (no `confirm()`/`alert()`)
   - `UserForm.tsx` - User add/edit dialog
   - `RoleManager.tsx` - RBAC role management; permissions dialog grouped by resource with "Pilih semua" per group
   - `UnitPicManager.tsx` - Unit PIC management with search
   - Dialog frame classes and `FormField` are shared from [components/dashboard/form-field.tsx](components/dashboard/form-field.tsx)

4. **Dashboard Components** ([components/dashboard/](components/dashboard/))
   - `app-shell.tsx` - BoardUI page frame: sidebar from `lg`, drawer below, `NavTrigger` for iPad portrait
   - `bottom-tab-bar.tsx` - iPhone (below `sm`) bottom tab bar; "Lagi" opens the drawer
   - `sidebar.tsx` - Navigation sidebar and `useNavigation()` (RBAC-filtered nav items)
   - `row-actions.tsx` - "…" row menu (BoardUI Dropdown)
   - `header.tsx` - Page header

5. **Surat Components** ([components/surat/](components/surat/))
   - `SuratList.tsx` - BoardUI table (md+: Bil, Tarikh, Perkara, Unit/PIC from lg, Status, Ref) and compact neutral cards (phones) with pagination; status shows as a chip, rows are not tinted
   - `SuratDetailDialog.tsx` - "Maklumat Surat #…" dialog (Tutup / Respon / Edit / Share)
   - `SuratFormDialog.tsx` - Tambah and Edit Surat form (one component, `mode` add/edit): Maklumat Surat, Tindakan, Status sections; the page keeps form state, validation and saving
   - `bil-links.tsx` - renders notes as plain text with `#123` as buttons; never render notes as HTML

6. **Tetapan Components** ([components/tetapan/](components/tetapan/)) — the page uses BoardUI underline `Tabs` ([components/base/tabs/tabs.tsx](components/base/tabs/tabs.tsx)); tab items are `[role=tab]` divs, not buttons
   - `FailManager.tsx` - Tetapan → Setup Fail tab: fail list (table from `md`, cards below), one add/edit dialog; non-admin users see and add only their own unit
   - `KontraktorManager.tsx` - Tetapan → Kontraktor tab: vendor no and bank details per contractor
   - `KontrakManager.tsx` - Tetapan → Kontrak tab: manage the `kontrak` table (table from `xl`, cards below). Editing a contractor name also updates sibling kontrak rows and every bayaran with that `no_kontrak` (bayaran keeps a copy of the name)

7. **Auth Components** ([components/auth/](components/auth/))
   - `PasswordStrengthIndicator.tsx` - Password strength meter
   - `AuthScreen.tsx` - BoardUI auth page frame and card class

### UI Components

All UI components are located in [components/ui/](components/ui/) and are based on shadcn/ui:

- Buttons, Inputs, Selects, Checkboxes, Radio Groups
- Dialogs, Alerts, Toasts
- Tables, Cards, Badges
- Forms, Labels, Validation
- Charts, Calendars, Date Pickers
- Dropdowns, Popovers, Tooltips
- Accordions, Tabs, Carousels

## API Routes Structure

### Auth Routes ([app/api/auth/](app/api/auth/))

- `/api/auth` - Main auth endpoint
- `/api/auth/login` - Login endpoint
- `/api/auth/change-password` - Change password
- `/api/auth/forgot-password` - Forgot password
- `/api/auth/reset-password` - Reset password (public)
- `/api/auth/reset-password-admin` - Admin reset password
- `/api/auth/permissions` - Fetch user permissions

### Data Routes

- `/api/surat` - Surat CRUD operations ([app/api/surat/route.ts](app/api/surat/route.ts))
- `/api/surat/[bil]` - Single surat operations ([app/api/surat/[bil]/route.ts](app/api/surat/[bil]/route.ts))
- `/api/bayaran` - Bayaran CRUD operations ([app/api/bayaran/route.ts](app/api/bayaran/route.ts))
- `/api/bayaran/[id]` - Single bayaran operations ([app/api/bayaran/[id]/route.ts](app/api/bayaran/[id]/route.ts))
- `/api/bayaran/bulk-update` - Bulk bayaran updates ([app/api/bayaran/bulk-update/route.ts](app/api/bayaran/bulk-update/route.ts))
- `/api/fail` - Fail CRUD operations ([app/api/fail/route.ts](app/api/fail/route.ts))
- `/api/fail/[id]` - Single fail operations ([app/api/fail/[id]/route.ts](app/api/fail/[id]/route.ts))

### Configuration Routes

- `/api/daripada-kepada` - Fetch daripada/kepada options ([app/api/daripada-kepada/route.ts](app/api/daripada-kepada/route.ts))
- `/api/bayaran-form-data` - Fetch form data for bayaran ([app/api/bayaran-form-data/route.ts](app/api/bayaran-form-data/route.ts))
- `/api/unit-pic` - Unit PIC management ([app/api/unit-pic/route.ts](app/api/unit-pic/route.ts))
- `/api/kontraktor` - Kontraktor list/add; `/api/kontraktor/[id]` edit/delete ([app/api/kontraktor/route.ts](app/api/kontraktor/route.ts))
- `/api/kontrak` - Kontrak list/add; `/api/kontrak/[id]` edit/delete; `/api/kontrak/sync` re-copies `nama_kontraktor` onto all bayaran ([app/api/kontrak/route.ts](app/api/kontrak/route.ts))

### RBAC Routes

- `/api/roles` - Role management ([app/api/roles/route.ts](app/api/roles/route.ts))
- `/api/permissions` - Permission management ([app/api/permissions/route.ts](app/api/permissions/route.ts))

### Share Link Routes

- `/api/share-link` - Share link CRUD ([app/api/share-link/route.ts](app/api/share-link/route.ts))
- `/api/share-link/[id]` - Single share link operations
- `/api/share-link/[id]/increment` - Increment access count

### Utility Routes

- `/api/upload-image` - ImgBB image upload ([app/api/upload-image/route.ts](app/api/upload-image/route.ts))
- `/api/fx-notifications` - FX notifications ([app/api/fx-notifications/route.ts](app/api/fx-notifications/route.ts))
- `/api/debug/rbac` - RBAC debug endpoint ([app/api/debug/rbac/route.ts](app/api/debug/rbac/route.ts))

## Testing and Debugging

### Debug Endpoints

- `/api/debug/rbac` - Debug RBAC permissions and roles

### Browser DevTools

- Check console for client-side errors
- Network tab for API call inspection
- Application tab for localStorage inspection

### Server Logs

- Check terminal for server-side errors
- Supabase logs in dashboard
- Vercel logs for production

## Deployment

### Vercel Deployment

The application is deployed on Vercel at: https://crudladang.vercel.app

1. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Ensure Supabase credentials are correct

2. **Build Settings**
   - Framework: Next.js
   - Build Command: `pnpm build`
   - Output Directory: `.next`

3. **Domain Configuration**
   - Custom domain: crudladang.vercel.app
   - SSL certificate automatically managed

### Database Maintenance

1. **Backups**
   - Supabase provides automatic backups
   - Export data regularly for additional safety

2. **Migrations**
   - Use Supabase migrations for schema changes
   - Test migrations in staging environment first

## Troubleshooting

### Common Issues

1. **Login Fails**
   - Check Supabase credentials in `.env.local`
   - Verify `users` table has correct data
   - Check password hashing (bcrypt)

2. **Data Not Showing**
   - Verify Supabase connection
   - Check user permissions
   - Inspect API route responses

3. **Permission Errors**
   - Refresh permissions using sidebar button
   - Check RBAC configuration
   - Verify role assignments

4. **Build Errors**
   - TypeScript errors: Check type definitions
   - ESLint errors: Run `pnpm lint` to check
   - Missing dependencies: Run `pnpm install`

### Error Messages

- **"Missing Supabase environment variables"** - Check `.env.local` file
- **"Failed to fetch data from Supabase"** - Check database connection
- **"Invalid credentials"** - Check username/password
- **"Permission denied"** - Check user role and permissions

## Migration Notes

### From Google Sheets to Supabase

The application has been migrated from Google Sheets to Supabase. The Google Sheets code is preserved in [lib/google-sheets.ts](lib/google-sheets.ts) for reference and potential rollback.

**Key Changes**:
- All CRUD operations now use Supabase
- Date format handling changed (YYYY-MM-DD in DB, DD/MM/YYYY in display)
- Auto-increment BIL field using database sequence
- Password hashing with bcrypt
- RBAC implementation with permissions and roles

**Migration Script**: [scripts/migrate-to-supabase.ts](scripts/migrate-to-supabase.ts)

## Additional Resources

- **Product Requirements**: [PRD.md](PRD.md)
- **README**: [README.md](README.md)
- **Supabase Setup**: [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
- **Error Documentation**: [ERROR.md](ERROR.md)
- **Gemini Guide**: [GEMINI.md](GEMINI.md)

## Code Style Guidelines

1. **TypeScript**
   - Use strict type checking
   - Define interfaces for all data structures
   - Avoid `any` type

2. **React**
   - Use functional components with hooks
   - Prefer composition over inheritance
   - Keep components small and focused

3. **Naming Conventions**
   - Components: PascalCase (`UserForm.tsx`)
   - Functions: camelCase (`getUserById()`)
   - Constants: UPPER_CASE (`API_BASE_URL`)
   - Files: kebab-case for utilities, PascalCase for components

4. **File Organization**
   - Group related components in feature folders
   - Keep API routes organized by resource
   - Separate types from implementation

5. **Comments**
   - Document complex business logic
   - Explain non-obvious code
   - Keep comments up to date

## Performance Optimization

1. **Code Splitting**
   - Use dynamic imports for heavy components
   - Lazy load routes

2. **Data Fetching**
   - Use React Query for caching (future enhancement)
   - Implement pagination for large datasets
   - Optimize database queries

3. **Image Optimization**
   - Use Next.js Image component
   - Compress images before upload
   - Use appropriate image formats

4. **Bundle Size**
   - Monitor bundle size regularly
   - Remove unused dependencies
   - Use tree shaking

## Security Best Practices

1. **Authentication**
   - Never store plain-text passwords
   - Use secure session management
   - Implement proper logout

2. **Authorization**
   - Check permissions on server-side
   - Never trust client-side checks
   - Use principle of least privilege

3. **Data Validation**
   - Validate all user input
   - Sanitize data before storage
   - Use Zod schemas for validation

4. **API Security**
   - Use environment variables for secrets
   - Implement rate limiting (future enhancement)
   - Log security events

## Future Enhancements

- [ ] React Query for data caching
- [ ] WebSocket for real-time updates
- [ ] Advanced search with Elasticsearch
- [ ] Email notifications
- [ ] File attachments for letters
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Export to PDF/Excel
- [ ] Two-factor authentication
- [ ] API rate limiting
