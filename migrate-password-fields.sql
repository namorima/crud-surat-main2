-- Migration: Add Password Management Fields to Users Table
-- Run this in Supabase SQL Editor
-- Description: Adds email, password change tracking, and forced password change fields

-- Step 1: Add new columns to users table
ALTER TABLE users 
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS is_password_changed BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMPTZ;

-- Step 2: Add unique constraint for email (allows NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique 
  ON users(email) 
  WHERE email IS NOT NULL;

-- Step 3: Add index for performance
CREATE INDEX IF NOT EXISTS idx_users_must_change_password 
  ON users(must_change_password) 
  WHERE must_change_password = true;

-- Step 4: Update existing users - detect if password = username (first-time users)
-- Set must_change_password = true for users where password matches username
UPDATE users 
SET must_change_password = true,
    is_password_changed = false
WHERE password = username;

-- Set must_change_password = false for users who already changed password
UPDATE users 
SET must_change_password = false,
    is_password_changed = true
WHERE password != username;

-- Step 5: Verify migration
-- Run this to check results:
-- SELECT username, email, is_password_changed, must_change_password, last_password_change 
-- FROM users 
-- ORDER BY username;

-- Note: Email is nullable - users will be prompted to add email on first password change
