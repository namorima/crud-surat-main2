-- Rekod bayaran: Jenis Bayaran (KEMAJUAN | WCP | WANG TAHANAN). NULL on records
-- keyed before it; Tambah Rekod Bayaran starts at KEMAJUAN.
ALTER TABLE bayaran ADD COLUMN IF NOT EXISTS jenis_bayaran TEXT;
ALTER TABLE bayaran DROP CONSTRAINT IF EXISTS bayaran_jenis_bayaran_check;
ALTER TABLE bayaran ADD CONSTRAINT bayaran_jenis_bayaran_check
  CHECK (jenis_bayaran IS NULL OR jenis_bayaran IN ('KEMAJUAN', 'WCP', 'WANG TAHANAN'));
