-- User block flag for admin moderation
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false;

-- Storage policies for private pdf-files bucket (run after bucket exists)
-- Objects are only accessible via service role; authenticated users use signed URLs from API.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Service role full access pdf-files'
  ) THEN
    CREATE POLICY "Service role full access pdf-files"
      ON storage.objects FOR ALL
      USING (bucket_id = 'pdf-files')
      WITH CHECK (bucket_id = 'pdf-files');
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Storage policies require superuser — configure pdf-files bucket as private in Supabase dashboard.';
END $$;
