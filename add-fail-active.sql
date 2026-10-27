-- Fail status. A disabled fail is no longer offered in the Surat form; surat
-- rows keep their stored fail text, so old letters are unchanged.
ALTER TABLE fail ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE fail ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;
