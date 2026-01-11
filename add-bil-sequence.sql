-- =====================================================
-- Migration: Add Sequence for BIL Auto-Increment
-- Purpose: Prevent duplicate BIL race condition
-- Run this SQL in Supabase SQL Editor
-- =====================================================

-- STEP 1: Check current max BIL and create sequence
DO $$
DECLARE
    max_bil INTEGER;
BEGIN
    -- Get current maximum BIL value
    SELECT COALESCE(MAX(bil), 0) INTO max_bil FROM surat;
    
    RAISE NOTICE 'Current max BIL: %', max_bil;
    
    -- Create sequence starting from max BIL + 1
    EXECUTE format('CREATE SEQUENCE IF NOT EXISTS surat_bil_seq START WITH %s', max_bil + 1);
    
    RAISE NOTICE 'Sequence created. Next BIL will be: %', max_bil + 1;
END $$;

-- STEP 2: Set default value for bil column to use sequence
ALTER TABLE surat ALTER COLUMN bil SET DEFAULT nextval('surat_bil_seq');

-- STEP 3: Associate sequence with column (for proper ownership)
ALTER SEQUENCE surat_bil_seq OWNED BY surat.bil;

-- STEP 4 (OPTIONAL): Add unique constraint to prevent duplicates
-- WARNING: This will fail if there are existing duplicate BIL values
-- If it fails, you need to fix duplicates first before adding constraint
-- Uncomment the line below to add unique constraint:
-- ALTER TABLE surat ADD CONSTRAINT surat_bil_unique UNIQUE (bil);

-- STEP 5: Verify sequence is working
-- Test by inserting a record without specifying BIL
-- The BIL should be auto-generated
-- Example:
-- INSERT INTO surat (daripada_kepada, tarikh, perkara, kategori, unit, status)
-- VALUES ('Test', '2026-01-11', 'Test', 'MASUK', 'TEST', 'BELUM PROSES')
-- RETURNING bil;

-- =====================================================
-- ROLLBACK (if needed)
-- =====================================================
-- To rollback this migration, run:
-- ALTER TABLE surat ALTER COLUMN bil DROP DEFAULT;
-- DROP SEQUENCE IF EXISTS surat_bil_seq;
-- ALTER TABLE surat DROP CONSTRAINT IF EXISTS surat_bil_unique;
