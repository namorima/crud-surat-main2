-- Bayaran: "Akhir" tick (the last kemajuan payment of a kontrak). Only set for
-- jenis_bayaran KEMAJUAN; false on everything else and on older records.
ALTER TABLE bayaran ADD COLUMN IF NOT EXISTS bayaran_akhir BOOLEAN NOT NULL DEFAULT false;
