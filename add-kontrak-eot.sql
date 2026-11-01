-- Kontrak: Sambung Masa (EOT, extension of time), a list of { kali, tarikh }:
-- kali = the extension number (1, 2, ...), tarikh = YYYY-MM-DD. [] when none.
ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS eot JSONB NOT NULL DEFAULT '[]'::jsonb;
