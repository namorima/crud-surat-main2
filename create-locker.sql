-- Locker: the Part and No. Locker choices per unit for Tetapan → Setup Fail,
-- and the colour of each Part badge. Run once in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS locker (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit TEXT NOT NULL,
  part TEXT NOT NULL,
  no_locker TEXT NOT NULL,
  warna TEXT NOT NULL DEFAULT '#a3a3a3' CHECK (warna ~ '^#[0-9a-fA-F]{6}$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS locker_unit_part_no_unique ON locker (upper(unit), upper(part), upper(no_locker));

-- Only the server (service role) reads or writes it.
ALTER TABLE locker ENABLE ROW LEVEL SECURITY;

-- Seed with the unit / part / locker combinations already used by fail,
-- keeping the colours the Part badges had.
INSERT INTO locker (unit, part, no_locker, warna)
SELECT DISTINCT trim(unit), trim(part), trim(no_locker),
  CASE upper(trim(part))
    WHEN 'HASIL' THEN '#facc15'
    WHEN 'PERTANIAN AM' THEN '#84cc16'
    WHEN 'KONTRAK' THEN '#fb923c'
    WHEN 'PERLADANGAN' THEN '#f472b6'
    WHEN 'PEMASARAN' THEN '#60a5fa'
    WHEN 'PENJUALAN' THEN '#a78bfa'
    WHEN 'PERANCANG' THEN '#2dd4bf'
    WHEN 'GERAN TANAH' THEN '#f87171'
    WHEN 'PENGHASILAN' THEN '#22d3ee'
    ELSE '#a3a3a3'
  END
FROM fail
WHERE coalesce(trim(unit), '') <> '' AND coalesce(trim(part), '') <> '' AND coalesce(trim(no_locker), '') <> ''
ON CONFLICT DO NOTHING;
