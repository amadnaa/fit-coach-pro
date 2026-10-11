ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
UPDATE public.exercises SET category = 'strength' WHERE category NOT IN ('warmup', 'strength', 'stretching', 'cardio');
ALTER TABLE public.exercises ALTER COLUMN category SET DEFAULT 'strength';
DROP POLICY IF EXISTS "Senders view sent notifications" ON public.notifications;
CREATE POLICY "Senders view sent notifications" ON public.notifications FOR SELECT TO authenticated USING (sender_id = auth.uid());