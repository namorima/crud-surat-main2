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

- **Role-based Access**: Different dashboards for different user roles with multi-layer filtering
  - Navigation is filtered based on both `user.role` and `user.type` fields
  - `KEWANGAN` users → `/dashboard/bayaran` (Finance dashboard only)
  - Other users → `/dashboard/surat` (Letter dashboard)
  - **Role Access Matrix**:
    - `semua`, `admin` - Full access to all pages
    - `KEWANGAN` - Bayaran page only
    - `PERLADANGAN`, `PENGURUS` - Dashboard, Surat, Bayaran, Statistik, Tetapan
    - `PEMASARAN`, `PERANCANG`, `MSPO` - Surat, Statistik, Tetapan (NO Dashboard, NO Bayaran)
    - `VIEW` type users - Blocked from Surat and Tetapan pages
    - `PENERIMA` type users - Blocked from Surat and Tetapan pages
- **Google Sheets Integration**: All CRUD operations go through Google Sheets API (lib/google-sheets.ts)
- **Audit Trail**: Payment operations are logged to `AUDIT_BAYARAN` sheet
- **Bulk Operations**: Support for bulk status updates on payment records
- **Auto-populated Contractor Names**: When adding/updating payment records, contractor names are automatically looked up from KONTRAK sheet and stored in REKOD BAYARAN column S
- **Display Logic**: Payment tables show contractor names instead of contract numbers for better readability
- **Fail (File) Management**: Setup Fail page accessible from Surat module with back navigation support

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
  - For view-only users: E contains "VIEW"
- `FAIL` sheet structure: Stores file/fail data with unit associations (managed through Setup Fail page)

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

## Navigation and UI Patterns

### Role-Based Navigation (components/dashboard/sidebar.tsx)

The sidebar navigation uses multi-layer filtering logic:

```typescript
// Layer 1: Type-based blocking
if (user?.type && (user.type === "VIEW" || user.type === "PENERIMA")) {
  if (item.name === "Surat" || item.name === "Tetapan") {
    return false
  }
}

// Layer 2: KEWANGAN special case
if (user?.role === "KEWANGAN") {
  return item.name === "Bayaran"
}

// Layer 3: Standard role array checking
return item.roles.includes(user?.role || "")
```

Each navigation item has a `roles` array defining which roles can access it:
- Dashboard: `["semua", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN"]`
- Surat: `["semua", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]`
- Bayaran: `["semua", "PERLADANGAN", "PENGURUS", "KEWANGAN"]`
- Statistik: `["semua", "admin", "PERLADANGAN", "PENGURUS", "PEMASARAN", "PERANCANG", "MSPO"]`
- Pengguna: `["semua", "admin"]`
- Tetapan: `["semua", "admin", "PERLADANGAN", "PENGURUS", "KEWANGAN", "PEMASARAN", "PERANCANG", "MSPO"]`

### Query Parameter Navigation

The application uses query parameters for navigation tracking:

- **Setup Fail Access**: When navigating from Surat page to Setup Fail, append `?from=surat` to the URL
- **Back Button Logic**: In Setup Fail page, check `searchParams.get("from") === "surat"` to conditionally show Back button

Example implementation:
```typescript
// In source page (app/dashboard/surat/page.tsx)
<Link href="/dashboard/tetapan?from=surat">Setup Fail</Link>

// In destination page (app/dashboard/tetapan/page.tsx)
const searchParams = useSearchParams()
const fromSurat = searchParams.get("from") === "surat"
{fromSurat && <Button onClick={() => router.back()}>Kembali</Button>}
```

### Fail (File) Selection UI

When users add new Surat records:
- If no Fail options exist for selected unit, display helper text with link to Setup Fail
- Link styling: Bold red text (`text-red-600 hover:text-red-700 font-bold`)
- Link includes query parameter for back navigation
- Implementation in both Add and Edit Surat dialogs (app/dashboard/surat/page.tsx)

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

#### Google Sheets Structure
**SHARE_LINK Sheet** (needs to be created manually):
- Column A: `LINK_ID` - Unique random 12-character string
- Column B: `FILTER_JSON` - JSON string containing filter criteria
- Column C: `CREATED_BY` - Name of user who created the link
- Column D: `CREATED_AT` - ISO timestamp of creation
- Column E: `EXPIRES_AT` - ISO timestamp of expiry (optional)
- Column F: `DESCRIPTION` - User-provided description (optional)
- Column G: `ACCESS_COUNT` - Number of times link was accessed

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
1. **ShareLinkForm** (`components/share/ShareLinkForm.tsx`)
   - Multi-filter selection interface
   - Optional expiry date picker
   - Optional description field
   - Fetches form options from `/api/bayaran-form-data`
   - Validates at least one filter is selected

2. **ShareLinkTable** (`components/share/ShareLinkTable.tsx`)
   - Displays list of all share links
   - Shows link ID, filters, creator, dates, access count, status
   - Actions: Copy link, Open in new tab, Delete
   - Status badges: "Aktif" (green) or "Tamat Tempoh" (red)

3. **FilterSummaryBadges** (`components/share/FilterSummaryBadges.tsx`)
   - Displays active filters as badge pills
   - Used in both admin and public views
   - Shows filter values in readable format

#### Public Components
4. **PublicBayaranTable** (`components/share/PublicBayaranTable.tsx`)
   - Simplified read-only payment table
   - Desktop: Full table with essential columns
   - Mobile: Card-based layout
   - No action buttons or edit capabilities

### API Routes

#### Admin Routes (Auth Required)
- `GET /api/share-link` - Fetch all share links
- `POST /api/share-link` - Create new share link
- `DELETE /api/share-link/[id]` - Delete share link

#### Public Routes (No Auth)
- `GET /api/share-link/[id]` - Get link details (checks expiry)
- `POST /api/share-link/[id]/increment` - Increment access count

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

#### Tetapan Page (`app/dashboard/tetapan/page.tsx`)
- Tab "Pautan Kongsi" replaces "Notifikasi" tab
- Only visible to users with role "semua"
- Fetches share links on mount
- Handles create and delete operations
- Displays success/error toasts

#### Google Sheets Functions (`lib/google-sheets.ts`)
- `getAllShareLinks()` - Fetches all links from SHARE_LINK sheet
- `getShareLinkById(id)` - Fetches single link by ID
- `addShareLink(data)` - Creates new link with generated ID
- `deleteShareLink(id)` - Removes link from sheet
- `incrementShareLinkAccess(id)` - Updates access count

### Security Considerations

1. **Random Link IDs**: 12-character UUIDs prevent guessing
2. **Expiry Enforcement**: Backend validates expiry before serving data
3. **Read-Only Access**: Public page has no mutation capabilities
4. **Role-Based Management**: Only "semua" role can create/delete links
5. **No Sensitive Data**: Public view shows filtered subset only

### Setup Requirements

**IMPORTANT**: Before using this feature, you MUST manually create the `SHARE_LINK` sheet in your Google Sheets document with the following structure:

```
Header Row (Row 1):
LINK_ID | FILTER_JSON | CREATED_BY | CREATED_AT | EXPIRES_AT | DESCRIPTION | ACCESS_COUNT
```

### URL Patterns

- Admin management: `https://crudladang.vercel.app/dashboard/tetapan` (Tab: Pautan Kongsi)
- Public share link: `https://crudladang.vercel.app/share/[linkId]`
- Example: `https://crudladang.vercel.app/share/a1b2c3d4e5f6`

### Error Handling

- **404**: Link not found or invalid ID
- **410**: Link has expired
- **500**: Server error (Google Sheets access issues)
- Public page shows user-friendly error messages
- Admin operations show toast notifications
