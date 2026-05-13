-- ─── Auto-updating updated_at columns ─────────────────────────────────────────
-- Adds updated_at to campaigns and leads so we can track when records change.
-- A single trigger function handles both tables.

ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE leads     ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows so updated_at == created_at for historical records.
UPDATE campaigns SET updated_at = created_at WHERE updated_at = now();
UPDATE leads     SET updated_at = created_at WHERE updated_at = now();

-- Trigger function — reusable across any table.
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER campaigns_set_updated_at
  BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE TRIGGER leads_set_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
