-- Rekod bayaran: Jenis Bayaran LEBIH 5K. Like PIECERATE it has no kontrak (and no
-- kategori); the contractor is picked from the whole Kontraktor list in the form.
ALTER TABLE bayaran DROP CONSTRAINT IF EXISTS bayaran_jenis_bayaran_check;
ALTER TABLE bayaran ADD CONSTRAINT bayaran_jenis_bayaran_check
  CHECK (jenis_bayaran IS NULL OR jenis_bayaran IN ('KEMAJUAN', 'WCP', 'WANG TAHANAN', 'PIECERATE', 'LEBIH 5K'));
