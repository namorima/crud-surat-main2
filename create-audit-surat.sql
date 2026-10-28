-- Audit trail for surat (who created, edited or deleted it, and what changed),
-- and the same detail for bayaran. Read only by admin / Super Admin through
-- GET /api/audit; written by the API routes with the signed-in user.

CREATE TABLE IF NOT EXISTS audit_surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  surat_id UUID,
  bil INTEGER,
  action TEXT NOT NULL,          -- CREATE | UPDATE | DELETE
  user_id TEXT,                  -- username of the signed-in user
  user_name TEXT,
  details TEXT,
  changes JSONB,                 -- [{ field, label, from, to }]
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS audit_surat_surat_id_idx ON audit_surat (surat_id, created_at DESC);
CREATE INDEX IF NOT EXISTS audit_surat_bil_idx ON audit_surat (bil);
ALTER TABLE audit_surat ENABLE ROW LEVEL SECURITY;

-- Bayaran already has audit_bayaran (action, user_name, details); add who by
-- username and the changed fields. Older rows keep NULL here.
ALTER TABLE audit_bayaran ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE audit_bayaran ADD COLUMN IF NOT EXISTS changes JSONB;
CREATE INDEX IF NOT EXISTS audit_bayaran_bayaran_id_idx ON audit_bayaran (bayaran_id, created_at DESC);
