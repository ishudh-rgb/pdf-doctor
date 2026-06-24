-- Security hardening: block privilege escalation on user_profiles

CREATE OR REPLACE FUNCTION public.protect_user_profile_privileged_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND auth.role() = 'authenticated' THEN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
      RAISE EXCEPTION 'profile_role_update_forbidden';
    END IF;
    IF NEW.plan IS DISTINCT FROM OLD.plan THEN
      RAISE EXCEPTION 'profile_plan_update_forbidden';
    END IF;
    IF NEW.plan_expires_at IS DISTINCT FROM OLD.plan_expires_at THEN
      RAISE EXCEPTION 'profile_plan_expires_update_forbidden';
    END IF;
    IF NEW.total_files_processed IS DISTINCT FROM OLD.total_files_processed THEN
      RAISE EXCEPTION 'profile_stats_update_forbidden';
    END IF;
    IF NEW.ai_credits_used IS DISTINCT FROM OLD.ai_credits_used THEN
      RAISE EXCEPTION 'profile_stats_update_forbidden';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS protect_user_profile_privileged_fields ON user_profiles;
CREATE TRIGGER protect_user_profile_privileged_fields
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_user_profile_privileged_fields();

-- Payment order tracking + idempotency
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_name TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS plan_duration TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS coupon_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_order_id
  ON payments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_razorpay_payment_id
  ON payments (razorpay_payment_id)
  WHERE razorpay_payment_id IS NOT NULL;

-- Guest file ownership via session id
CREATE INDEX IF NOT EXISTS idx_uploaded_files_guest_session
  ON uploaded_files (guest_session_id)
  WHERE guest_session_id IS NOT NULL;
