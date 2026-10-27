-- Unit PIC status. A disabled PIC is not offered as Tindakan PIC in the Surat
-- form; surat store the PIC's name, so existing letters are unchanged.
-- Set per person (every unit row of that PIC) from Pengguna → Unit PIC.
ALTER TABLE unit_pic ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE unit_pic ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ;
