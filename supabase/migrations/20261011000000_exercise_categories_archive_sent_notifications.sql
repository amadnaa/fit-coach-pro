-- 1. Soft delete for exercises.
-- An exercise that is used in a client's plan can't be hard-deleted: workout_exercises
-- (and the client's logged sets behind it) reference it. The library archives those
-- instead, which hides them from the coach's library and the "add exercise" picker
-- while keeping the client's history intact.
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- 2. Exercise categories are now only: warmup, strength, stretching, cardio.
-- Older rows used muscle groups (chest, legs, ...) or 'other' as the category;
-- those are all strength exercises. The muscle group lives in muscle_group.
UPDATE public.exercises
SET category = 'strength'
WHERE category NOT IN ('warmup', 'strength', 'stretching', 'cardio');

ALTER TABLE public.exercises ALTER COLUMN category SET DEFAULT 'strength';

-- 3. A coach can see the notifications she has sent (previously only the recipient
-- could read a direct notification, so it vanished from the sender's list).
DROP POLICY IF EXISTS "Senders view sent notifications" ON public.notifications;
CREATE POLICY "Senders view sent notifications" ON public.notifications
  FOR SELECT TO authenticated
  USING (sender_id = auth.uid());
