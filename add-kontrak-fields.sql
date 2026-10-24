-- Kontrak: tarikh mula/akhir, tahun kontrak and jenis kerja
-- Run this once in the Supabase SQL Editor before using the new fields in
-- Tetapan -> Kontrak.

ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS tarikh_mula DATE;
ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS tarikh_akhir DATE;
ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS jenis_kerja TEXT;

-- Tahun Kontrak is always the year of tarikh_mula (kept by the database).
ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS tahun_kontrak INTEGER
  GENERATED ALWAYS AS (EXTRACT(YEAR FROM tarikh_mula)::INTEGER) STORED;

-- Tarikh akhir may not be before tarikh mula.
ALTER TABLE kontrak DROP CONSTRAINT IF EXISTS kontrak_tarikh_check;
ALTER TABLE kontrak ADD CONSTRAINT kontrak_tarikh_check
  CHECK (tarikh_akhir IS NULL OR tarikh_mula IS NULL OR tarikh_akhir >= tarikh_mula);

-- Verify
SELECT column_name, data_type, is_generated
FROM information_schema.columns
WHERE table_name = 'kontrak'
ORDER BY ordinal_position;
