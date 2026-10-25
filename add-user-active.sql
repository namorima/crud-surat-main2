-- Staff moving to another unit: a new account is created with the same staff
-- ID and the old one is kept, deactivated, so its history still reads right.
--
-- username stays unique (login and sessions use it). The old account's username
-- is renamed to "<staff_id>~<yyyymmddhhmi>" when it is replaced, and staff_id
-- keeps the real staff ID for both accounts.

ALTER TABLE users ADD COLUMN IF NOT EXISTS staff_id TEXT;
UPDATE users SET staff_id = username WHERE staff_id IS NULL;

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;
-- username of the account that replaced this one
ALTER TABLE users ADD COLUMN IF NOT EXISTS replaced_by TEXT;

CREATE INDEX IF NOT EXISTS users_staff_id_idx ON users (staff_id);
