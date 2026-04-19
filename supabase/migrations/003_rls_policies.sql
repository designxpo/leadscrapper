-- ─── Enable RLS and add per-user policies ───────────────────────────────────
-- Each authenticated user can only read/write their own campaigns and the
-- leads attached to those campaigns.

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads     ENABLE ROW LEVEL SECURITY;

-- Campaigns: user owns rows where user_id = auth.uid()
DROP POLICY IF EXISTS "campaigns_select_own" ON campaigns;
CREATE POLICY "campaigns_select_own" ON campaigns
  FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "campaigns_insert_own" ON campaigns;
CREATE POLICY "campaigns_insert_own" ON campaigns
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "campaigns_update_own" ON campaigns;
CREATE POLICY "campaigns_update_own" ON campaigns
  FOR UPDATE USING (user_id = auth.uid());

DROP POLICY IF EXISTS "campaigns_delete_own" ON campaigns;
CREATE POLICY "campaigns_delete_own" ON campaigns
  FOR DELETE USING (user_id = auth.uid());

-- Leads: inherit ownership through campaign_id
DROP POLICY IF EXISTS "leads_select_own" ON leads;
CREATE POLICY "leads_select_own" ON leads
  FOR SELECT USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "leads_insert_own" ON leads;
CREATE POLICY "leads_insert_own" ON leads
  FOR INSERT WITH CHECK (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "leads_update_own" ON leads;
CREATE POLICY "leads_update_own" ON leads
  FOR UPDATE USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "leads_delete_own" ON leads;
CREATE POLICY "leads_delete_own" ON leads
  FOR DELETE USING (
    campaign_id IN (SELECT id FROM campaigns WHERE user_id = auth.uid())
  );

-- Profiles: user manages own profile row
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid());
