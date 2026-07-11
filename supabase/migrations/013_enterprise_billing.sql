-- Enterprise billing: org plan state, shared usage, invites, GST invoices.

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS plan_status TEXT NOT NULL DEFAULT 'inactive'
    CHECK (plan_status IN ('inactive', 'active', 'past_due', 'cancelled')),
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS daily_tool_limit INTEGER NOT NULL DEFAULT 500,
  ADD COLUMN IF NOT EXISTS daily_usage_date DATE,
  ADD COLUMN IF NOT EXISTS daily_usage_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_organizations_razorpay_sub ON organizations(razorpay_subscription_id);

CREATE TABLE IF NOT EXISTS organization_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  token TEXT NOT NULL UNIQUE,
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (organization_id, email)
);

CREATE TABLE IF NOT EXISTS billing_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL UNIQUE,
  razorpay_invoice_id TEXT,
  razorpay_payment_id TEXT,
  amount_paise INTEGER NOT NULL,
  tax_paise INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'INR',
  gstin_seller TEXT,
  billing_name TEXT,
  billing_email TEXT,
  billing_state TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'paid', 'void')),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_billing_invoices_user ON billing_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_invoices_payment ON billing_invoices(payment_id);

ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS razorpay_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_mode TEXT DEFAULT 'one_time'
    CHECK (billing_mode IN ('one_time', 'subscription'));

ALTER TABLE organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "deny organization_invites client" ON organization_invites FOR ALL TO anon, authenticated USING (false);
CREATE POLICY "deny billing_invoices client" ON billing_invoices FOR ALL TO anon, authenticated USING (false);
