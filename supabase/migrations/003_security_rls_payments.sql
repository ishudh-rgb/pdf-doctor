-- Block client-side writes to payments/subscriptions (service role only)

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert payments" ON payments;
DROP POLICY IF EXISTS "Users can update payments" ON payments;
DROP POLICY IF EXISTS "Users can insert subscriptions" ON subscriptions;
DROP POLICY IF EXISTS "Users can update subscriptions" ON subscriptions;

-- Authenticated users: read own rows only (existing SELECT policies remain)
-- No INSERT/UPDATE/DELETE for authenticated on payments or subscriptions

CREATE POLICY "Deny client insert payments" ON payments
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny client update payments" ON payments
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "Deny client delete payments" ON payments
  FOR DELETE TO authenticated USING (false);

CREATE POLICY "Deny client insert subscriptions" ON subscriptions
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "Deny client update subscriptions" ON subscriptions
  FOR UPDATE TO authenticated USING (false);

CREATE POLICY "Deny client delete subscriptions" ON subscriptions
  FOR DELETE TO authenticated USING (false);
