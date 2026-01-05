# Setup Instructions: Supabase Migration

## Step 1: Create Database Schema in Supabase

1. Login to your Supabase project: https://refuygxelayzyupblnyb.supabase.co
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `supabase-schema.sql` file
5. Paste it into the SQL Editor
6. Click **Run** to execute the SQL and create all tables

## Step 2: Verify Tables Created

After running the SQL, verify that all 9 tables were created:

- `surat`
- `bayaran`
- `fail`
- `users`
- `audit_bayaran`
- `unit_pic`
- `kontrak`
- `status_config`
- `share_links`

You can check this in the **Table Editor** section.

## Step 3: Migrate Data from Google Sheets

**IMPORTANT**: Before running the migration, make sure:

- All tables are created successfully
- Your `.env.local` file has the correct Supabase credentials
- Your Google Sheets credentials are still valid (for reading data)

Run the migration script:

```powershell
# Install dependencies first if not done
npm install

# Run the migration script
npx tsx scripts/migrate-to-supabase.ts
```

The script will:

- Fetch all data from Google Sheets
- Transform and insert data into Supabase
- Show progress and report any errors
- Display a summary at the end

## Step 4: Verify Data Migration

After migration completes:

1. Go to Supabase **Table Editor**
2. Check each table to ensure data was migrated correctly
3. Verify record counts match your Google Sheets

## Step 5: Test the Application

The application is already configured to use Supabase! Just start the dev server:

```powershell
npm run dev
```

Then test:

- Login functionality
- View SURAT and BAYARAN pages
- Add/Edit/Delete operations
- Filters and search
- Audit logs

## Troubleshooting

### Migration Errors

If you see errors during migration:

1. Check the error messages in the console
2. Verify your Google Sheets credentials are valid
3. Ensure Supabase tables are created correctly
4. Check network connectivity

### Application Errors

If the app doesn't work after migration:

1. Verify `.env.local` has correct Supabase credentials
2. Check browser console for errors
3. Verify data exists in Supabase tables
4. Restart the dev server

## Rollback (if needed)

If you need to rollback to Google Sheets:

1. The Google Sheets data is still intact (we didn't delete anything)
2. Simply revert the code changes using Git
3. The app will work with Google Sheets again

## Notes

- Google Sheets integration is kept as backup
- You can still access your Google Sheets data
- The migration script can be run multiple times (it will create duplicates, so be careful)
- All environment variables for both Google Sheets and Supabase are in `.env.local`
