-- ─── Onboarding fields on profiles ───────────────────────────────────────────
-- role         : which of the 6 persona cards the user picked
-- goal_id      : which specific goal they selected within that role
-- onboarding_complete : false until the wizard is submitted (or skipped)

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS role              text,
  ADD COLUMN IF NOT EXISTS goal_id           text,
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false;

-- ─── RLS for profiles table ───────────────────────────────────────────────────
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
