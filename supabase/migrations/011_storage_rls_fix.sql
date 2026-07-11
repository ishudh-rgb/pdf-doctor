-- Fix pdf-files storage policies: deny client roles; service role manages objects.
-- Signed URLs from API remain the only client access path.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'Service role full access pdf-files'
  ) THEN
    DROP POLICY "Service role full access pdf-files" ON storage.objects;
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Cannot drop storage policy — configure bucket as private in Supabase dashboard.';
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pdf-files service role all'
  ) THEN
    CREATE POLICY "pdf-files service role all"
      ON storage.objects
      FOR ALL
      TO service_role
      USING (bucket_id = 'pdf-files')
      WITH CHECK (bucket_id = 'pdf-files');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND policyname = 'pdf-files deny anon authenticated'
  ) THEN
    CREATE POLICY "pdf-files deny anon authenticated"
      ON storage.objects
      FOR ALL
      TO anon, authenticated
      USING (false)
      WITH CHECK (false);
  END IF;
EXCEPTION
  WHEN insufficient_privilege THEN
    RAISE NOTICE 'Storage policies require superuser — set pdf-files bucket private in dashboard.';
END $$;
