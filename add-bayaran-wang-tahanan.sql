-- Bayaran: Wang Tahanan (retention) amount, optional, kept as text like nilai_bayaran
-- ("12,345.00"). NULL when the record has no Wang Tahanan.
ALTER TABLE bayaran ADD COLUMN IF NOT EXISTS wang_tahanan TEXT;
