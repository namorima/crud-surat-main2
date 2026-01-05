-- Step 2: Clear bayaran table data
-- Run this in Supabase SQL Editor AFTER adding ids column

-- Clear all data from bayaran table (and cascade to audit_bayaran)
TRUNCATE TABLE bayaran CASCADE;

-- Verify table is empty
SELECT COUNT(*) as record_count FROM bayaran;
-- Should return 0

-- Verify audit_bayaran is also cleared
SELECT COUNT(*) as audit_count FROM audit_bayaran;
-- Should return 0
