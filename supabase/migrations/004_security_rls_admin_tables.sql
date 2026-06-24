-- Lock down tables that were missing RLS (admin settings, coupons, error logs, plans)

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE coupon_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

-- Plans: public read of active plans only (pricing UI)
CREATE POLICY "Public read active plans"
  ON plans FOR SELECT
  USING (is_active = true);

-- Admin tables: no direct client access (service role only)
CREATE POLICY "Deny client access to admin_settings"
  ON admin_settings FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client access to coupon_codes"
  ON coupon_codes FOR ALL
  USING (false)
  WITH CHECK (false);

CREATE POLICY "Deny client access to error_logs"
  ON error_logs FOR ALL
  USING (false)
  WITH CHECK (false);

-- Tighten guest job spam: anonymous inserts must include a session id
DROP POLICY IF EXISTS "Users can insert own jobs" ON tool_jobs;
CREATE POLICY "Users can insert own jobs"
  ON tool_jobs FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR (user_id IS NULL AND guest_session_id IS NOT NULL AND length(trim(guest_session_id)) > 0)
  );
