-- Surat: how it was sent / received, and the "Untuk Makluman" tick.
-- kaedah: 'MELALUI EMEL' | 'SERAHAN TANGAN'; NULL on surat keyed before this column
-- untuk_makluman: for information only, saved as SELESAI with tarikh selesai on the day it was ticked
ALTER TABLE surat ADD COLUMN IF NOT EXISTS kaedah TEXT;
ALTER TABLE surat ADD COLUMN IF NOT EXISTS untuk_makluman BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE surat DROP CONSTRAINT IF EXISTS surat_kaedah_check;
ALTER TABLE surat ADD CONSTRAINT surat_kaedah_check CHECK (kaedah IS NULL OR kaedah IN ('MELALUI EMEL', 'SERAHAN TANGAN'));
