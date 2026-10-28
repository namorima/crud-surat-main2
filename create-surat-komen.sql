-- Komen thread per surat (replaces the single "Komen Pengurus" field) and
-- its notifications. RLS on with no policies: only the service role (API routes).

-- Who keyed the surat (username); comments notify them. NULL on surat keyed before this
ALTER TABLE surat ADD COLUMN IF NOT EXISTS created_by TEXT;

CREATE TABLE IF NOT EXISTS surat_komen (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_id UUID NOT NULL REFERENCES surat(id) ON DELETE CASCADE,
  user_id TEXT,              -- username; NULL for the migrated Komen Pengurus
  user_name TEXT NOT NULL,
  isi TEXT NOT NULL CHECK (char_length(trim(isi)) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS surat_komen_surat_idx ON surat_komen (surat_id, created_at);
ALTER TABLE surat_komen ENABLE ROW LEVEL SECURITY;

-- One row per recipient per komen; read_at set by "Buka komen", "Abaikan" or opening the thread
CREATE TABLE IF NOT EXISTS surat_komen_notifikasi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  komen_id UUID NOT NULL REFERENCES surat_komen(id) ON DELETE CASCADE,
  surat_id UUID NOT NULL REFERENCES surat(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS surat_komen_notifikasi_unread_idx ON surat_komen_notifikasi (user_id) WHERE read_at IS NULL;
ALTER TABLE surat_komen_notifikasi ENABLE ROW LEVEL SECURITY;

-- The old single Komen Pengurus becomes the first komen of its thread (author unknown)
INSERT INTO surat_komen (surat_id, user_id, user_name, isi, created_at)
SELECT s.id, NULL, 'Komen Pengurus', trim(s.komen), COALESCE(s.tarikh::timestamptz, now())
FROM surat s
WHERE COALESCE(trim(s.komen), '') <> ''
  AND NOT EXISTS (SELECT 1 FROM surat_komen k WHERE k.surat_id = s.id AND k.user_id IS NULL AND k.isi = trim(s.komen));
