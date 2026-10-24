-- Kontrak: nama kerja (e.g. "Kerja Mengangkut BTS Di Ladang ...")
-- Run once in the Supabase SQL Editor (after add-kontrak-fields.sql).

ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS kerja TEXT;
