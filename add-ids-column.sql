-- Step 1: Add 'ids' column to bayaran table
-- Run this in Supabase SQL Editor

-- Add the ids column
ALTER TABLE bayaran ADD COLUMN ids INTEGER UNIQUE;

-- Create index for fast lookup
CREATE INDEX idx_bayaran_ids ON bayaran(ids);

-- Verify column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'bayaran' 
ORDER BY ordinal_position;
