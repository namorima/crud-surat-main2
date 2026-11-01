-- Kontrak: Arahan Perubahan (VO, variation order) value in RM, optional. NULL when none.
ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS vo NUMERIC(14,2);
