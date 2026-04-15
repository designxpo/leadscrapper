-- ─── Campaigns ────────────────────────────────────────────────────────────────
-- Each scraping session is recorded as a campaign.

CREATE TABLE IF NOT EXISTS campaigns (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text        NOT NULL,
  source      text        NOT NULL,                          -- scraper registry key
  config      jsonb       NOT NULL DEFAULT '{}'::jsonb,      -- snapshot of Apify payload
  status      text        NOT NULL DEFAULT 'active'
                          CHECK (status IN ('active', 'archived')),
  lead_count  int         NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- ─── Leads ────────────────────────────────────────────────────────────────────
-- Each lead belongs to one campaign and has a CRM progression status.

CREATE TABLE IF NOT EXISTS leads (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id  uuid        NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  name         text        NOT NULL,
  phone        text,
  email        text,
  website      text,
  address      text,
  rating       real,
  source_url   text,
  extra_data   jsonb,
  platform     text,
  description  text,
  budget       text,
  tier         text        NOT NULL DEFAULT 'cold'
                           CHECK (tier IN ('hot', 'warm', 'cold')),
  crm_status   text        NOT NULL DEFAULT 'new'
                           CHECK (crm_status IN ('new', 'contacted', 'replied', 'converted')),
  ai_line      text,
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leads_campaign_id ON leads(campaign_id);
CREATE INDEX IF NOT EXISTS idx_leads_crm_status  ON leads(crm_status);
CREATE INDEX IF NOT EXISTS idx_leads_tier        ON leads(tier);
CREATE INDEX IF NOT EXISTS idx_campaigns_status  ON campaigns(status);
