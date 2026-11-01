-- Kontrak: Wang Cagaran Prestasi (WCP) in RM, optional. NULL on kontrak added before it.
ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS wcp NUMERIC(14,2) CHECK (wcp IS NULL OR wcp >= 0);
