-- Rekod bayaran: Jenis Bayaran (KEMAJUAN | WCP | WANG TAHANAN | PIECERATE). NULL on
-- records keyed before it; Tambah Rekod Bayaran starts at KEMAJUAN. A PIECERATE
-- bayaran has kategori PIECERATE, no no_kontrak, and the contractor picked by name.
ALTER TABLE bayaran ADD COLUMN IF NOT EXISTS jenis_bayaran TEXT;
ALTER TABLE bayaran DROP CONSTRAINT IF EXISTS bayaran_jenis_bayaran_check;
ALTER TABLE bayaran ADD CONSTRAINT bayaran_jenis_bayaran_check
  CHECK (jenis_bayaran IS NULL OR jenis_bayaran IN ('KEMAJUAN', 'WCP', 'WANG TAHANAN', 'PIECERATE'));
