-- Kontraktor: contractor master data (vendor and bank details)
-- Run once in the Supabase SQL Editor. Kontrak's Nama Kontraktor dropdown
-- reads from this table.

CREATE TABLE IF NOT EXISTS kontraktor (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_kontraktor TEXT NOT NULL,
  no_vendor TEXT,
  nama_akaun TEXT,
  nombor_akaun TEXT,
  jenis_bank TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS kontraktor_nama_unique ON kontraktor (upper(nama_kontraktor));

-- Bank details: only the server (service role) may read or write.
ALTER TABLE kontraktor ENABLE ROW LEVEL SECURITY;

-- Seed with the contractor names already used in kontrak.
INSERT INTO kontraktor (nama_kontraktor)
SELECT DISTINCT upper(trim(nama_kontraktor))
FROM kontrak
WHERE coalesce(trim(nama_kontraktor), '') <> ''
ON CONFLICT DO NOTHING;
