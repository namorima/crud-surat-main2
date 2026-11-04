-- Rekod bayaran: the surat (BIL) it was made from with "Respon To Bayaran".
-- NULL for records keyed directly. Maklumat Surat lists these as Reference Bayaran.
ALTER TABLE bayaran ADD COLUMN IF NOT EXISTS surat_bil INTEGER;
CREATE INDEX IF NOT EXISTS bayaran_surat_bil_idx ON bayaran (surat_bil) WHERE surat_bil IS NOT NULL;
