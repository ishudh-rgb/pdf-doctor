-- Block self-service unblocking + atomic coupon increment

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
    IF NEW.is_blocked IS DISTINCT FROM OLD.is_blocked THEN
      RAISE EXCEPTION 'profile_block_update_forbidden';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_coupon_usage(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  rows_updated INTEGER;
BEGIN
  UPDATE coupon_codes
  SET times_used = times_used + 1
  WHERE code = UPPER(TRIM(p_code))
    AND (max_uses = -1 OR times_used < max_uses);
  GET DIAGNOSTICS rows_updated = ROW_COUNT;
  RETURN rows_updated > 0;
END;
$$;
