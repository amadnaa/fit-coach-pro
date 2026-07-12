-- Harden storage object policies so users can only write/delete their OWN files.
-- Previously these policies only checked bucket_id, which let any authenticated
-- user overwrite or delete any other user's avatar, and any coach delete any
-- other coach's exercise videos.
--
-- Both buckets store objects under a top-level folder named after the owner's
-- user id:
--   avatars/<uid>/avatar.<ext>
--   exercise-videos/<uid>/<timestamp>.<ext>
-- so we scope each policy to (storage.foldername(name))[1] = auth.uid().

-- ===== avatars bucket =====
DROP POLICY IF EXISTS "Users upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users delete own avatar" ON storage.objects;

CREATE POLICY "Users upload own avatar" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- upsert:true on avatar upload performs an UPDATE when the object already exists
CREATE POLICY "Users update own avatar" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users delete own avatar" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ===== exercise-videos bucket =====
DROP POLICY IF EXISTS "Coaches upload exercise videos" ON storage.objects;
DROP POLICY IF EXISTS "Coaches delete exercise videos" ON storage.objects;

CREATE POLICY "Coaches upload exercise videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'exercise-videos'
  AND has_role(auth.uid(), 'coach')
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Coaches delete exercise videos" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'exercise-videos'
  AND has_role(auth.uid(), 'coach')
  AND (storage.foldername(name))[1] = auth.uid()::text
);
