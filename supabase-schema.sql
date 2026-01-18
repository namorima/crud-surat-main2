-- Supabase Database Schema for CRUD Surat Application
-- Run this SQL in Supabase SQL Editor to create all tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: SURAT
CREATE TABLE IF NOT EXISTS surat (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bil INTEGER NOT NULL,
  daripada_kepada TEXT NOT NULL,
  tarikh DATE NOT NULL,
  perkara TEXT NOT NULL,
  kategori TEXT NOT NULL,
  unit TEXT NOT NULL,
  fail TEXT,
  tindakan_pic TEXT,
  status TEXT NOT NULL DEFAULT 'BELUM PROSES',
  tarikh_selesai DATE,
  nota TEXT,
  komen TEXT,
  reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 2: BAYARAN
CREATE TABLE IF NOT EXISTS bayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  daripada TEXT NOT NULL,
  tarikh_terima DATE NOT NULL,
  perkara TEXT NOT NULL,
  nilai_bayaran TEXT NOT NULL,
  bayaran_ke TEXT,
  kategori TEXT,
  no_kontrak TEXT,
  nama_kontraktor TEXT,
  tarikh_memo_ladang DATE,
  status_ladang TEXT,
  tarikh_hantar DATE,
  tarikh_ppnp DATE,
  tarikh_pn DATE,
  penerima TEXT,
  status_bayaran TEXT,
  tarikh_bayar DATE,
  nombor_baucer TEXT,
  nota_kaki TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 3: FAIL
CREATE TABLE IF NOT EXISTS fail (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  part TEXT NOT NULL,
  no_locker TEXT,
  no_fail TEXT NOT NULL,
  pecahan TEXT,
  pecahan_kecil TEXT,
  unit TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 4: USERS (AUTH)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  type TEXT,
  email TEXT,
  is_password_changed BOOLEAN DEFAULT false,
  must_change_password BOOLEAN DEFAULT true,
  last_password_change TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 5: AUDIT_BAYARAN
CREATE TABLE IF NOT EXISTS audit_bayaran (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bayaran_id UUID REFERENCES bayaran(id) ON DELETE CASCADE,
  user_name TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 6: UNIT_PIC
CREATE TABLE IF NOT EXISTS unit_pic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit TEXT NOT NULL,
  pic TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 7: KONTRAK
CREATE TABLE IF NOT EXISTS kontrak (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kawasan TEXT NOT NULL,
  no_kontrak TEXT NOT NULL,
  kategori TEXT,
  nama_kontraktor TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 8: STATUS_CONFIG
CREATE TABLE IF NOT EXISTS status_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  status TEXT NOT NULL,
  color_hex TEXT NOT NULL,
  kategori TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table 9: SHARE_LINKS
CREATE TABLE IF NOT EXISTS share_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  link_id TEXT UNIQUE NOT NULL,
  filter_json JSONB NOT NULL,
  created_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  description TEXT,
  access_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_surat_bil ON surat(bil);
CREATE INDEX IF NOT EXISTS idx_surat_tarikh ON surat(tarikh);
CREATE INDEX IF NOT EXISTS idx_surat_status ON surat(status);
CREATE INDEX IF NOT EXISTS idx_surat_unit ON surat(unit);

CREATE INDEX IF NOT EXISTS idx_bayaran_tarikh_terima ON bayaran(tarikh_terima);
CREATE INDEX IF NOT EXISTS idx_bayaran_status_bayaran ON bayaran(status_bayaran);
CREATE INDEX IF NOT EXISTS idx_bayaran_no_kontrak ON bayaran(no_kontrak);

CREATE INDEX IF NOT EXISTS idx_fail_unit ON fail(unit);
CREATE INDEX IF NOT EXISTS idx_fail_no_fail ON fail(no_fail);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

CREATE INDEX IF NOT EXISTS idx_audit_bayaran_bayaran_id ON audit_bayaran(bayaran_id);
CREATE INDEX IF NOT EXISTS idx_audit_bayaran_created_at ON audit_bayaran(created_at);

CREATE INDEX IF NOT EXISTS idx_unit_pic_unit ON unit_pic(unit);

CREATE INDEX IF NOT EXISTS idx_kontrak_kawasan ON kontrak(kawasan);
CREATE INDEX IF NOT EXISTS idx_kontrak_no_kontrak ON kontrak(no_kontrak);

CREATE INDEX IF NOT EXISTS idx_status_config_kategori ON status_config(kategori);

CREATE INDEX IF NOT EXISTS idx_share_links_link_id ON share_links(link_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_surat_updated_at BEFORE UPDATE ON surat
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bayaran_updated_at BEFORE UPDATE ON bayaran
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fail_updated_at BEFORE UPDATE ON fail
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) - Optional, can be configured later
-- ALTER TABLE surat ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE bayaran ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE fail ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE audit_bayaran ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE unit_pic ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kontrak ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE status_config ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE share_links ENABLE ROW LEVEL SECURITY;

-- Grant permissions (adjust as needed)
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
