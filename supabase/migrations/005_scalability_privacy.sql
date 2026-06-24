-- Scalability indexes + GDPR consent records

CREATE TABLE IF NOT EXISTS consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_session_id TEXT,
  consent_version TEXT NOT NULL DEFAULT '1.0',
  essential BOOLEAN NOT NULL DEFAULT true,
  analytics BOOLEAN NOT NULL DEFAULT false,
  marketing BOOLEAN NOT NULL DEFAULT false,
  ip_hash TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_user_id ON consent_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_guest_session ON consent_records(guest_session_id);
CREATE INDEX IF NOT EXISTS idx_consent_records_created_at ON consent_records(created_at DESC);

ALTER TABLE consent_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deny all client access to consent_records"
  ON consent_records FOR ALL
  USING (false)
  WITH CHECK (false);

-- Cleanup query optimization
CREATE INDEX IF NOT EXISTS idx_uploaded_files_cleanup
  ON uploaded_files(is_deleted, expires_at)
  WHERE is_deleted = false;

-- Usage limit query optimization
CREATE INDEX IF NOT EXISTS idx_usage_logs_guest_daily
  ON usage_logs(guest_ip_hash, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_usage_logs_user_daily
  ON usage_logs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_tool_jobs_user_created
  ON tool_jobs(user_id, created_at DESC);
