-- Kontrak: nilai kontrak (RM). Run once in the Supabase SQL Editor (after add-kontrak-kerja.sql).

ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS nilai_kontrak NUMERIC(14,2)
  CHECK (nilai_kontrak IS NULL OR nilai_kontrak >= 0);
