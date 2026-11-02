-- Kawasan: master list of kawasan (nama + kod lokasi) for Tetapan → Kawasan
-- Run once in the Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS kawasan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kawasan TEXT NOT NULL,
  kod_lokasi TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS kawasan_nama_unique ON kawasan (upper(nama_kawasan));

-- Only the server (service role) may read or write.
ALTER TABLE kawasan ENABLE ROW LEVEL SECURITY;

-- Seed with the kawasan already used in kontrak.
INSERT INTO kawasan (nama_kawasan)
SELECT DISTINCT upper(trim(kawasan))
FROM kontrak
WHERE coalesce(trim(kawasan), '') <> ''
ON CONFLICT DO NOTHING;
