-- Kontrak: No Purchase Order (PO), optional free text. NULL on kontrak added before it.
ALTER TABLE kontrak ADD COLUMN IF NOT EXISTS no_po TEXT;
