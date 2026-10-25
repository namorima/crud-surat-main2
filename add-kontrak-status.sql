-- Contract status. Only AKTIF contracts are offered in Tambah Rekod Bayaran;
-- SELESAI and TIDAK AKTIF ones stay on old records and in Tetapan → Kontrak.
-- Rows sharing a no_kontrak (one per kategori) keep the same status.
ALTER TABLE kontrak
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'AKTIF'
  CHECK (status IN ('AKTIF', 'SELESAI', 'TIDAK AKTIF'));
