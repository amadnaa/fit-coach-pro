
-- 1. Fix exercise visibility: only visible to creating coach + their trainees
DROP POLICY IF EXISTS "Exercises viewable by authenticated" ON public.exercises;

CREATE POLICY "Exercises visible to creator and their trainees"
ON public.exercises FOR SELECT TO authenticated
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = exercises.created_by
    AND coach_clients.client_id = auth.uid()
  )
  OR has_role(auth.uid(), 'coach')
);

-- 2. Create workout_sessions table for start/end flow
CREATE TABLE public.workout_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  workout_id uuid REFERENCES public.workouts(id),
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  exercises_completed integer DEFAULT 0,
  total_exercises integer DEFAULT 0,
  total_sets_completed integer DEFAULT 0,
  total_reps integer DEFAULT 0,
  completed boolean DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.workout_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own sessions" ON public.workout_sessions
FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Coaches view client sessions" ON public.workout_sessions
FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = workout_sessions.user_id)
);

-- 3. Create storage bucket for exercise videos
INSERT INTO storage.buckets (id, name, public) VALUES ('exercise-videos', 'exercise-videos', false);

-- Storage RLS: coaches can upload videos
CREATE POLICY "Coaches upload exercise videos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'exercise-videos' AND has_role(auth.uid(), 'coach')
);

-- Storage RLS: coaches and their clients can view videos
CREATE POLICY "Authenticated users view exercise videos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exercise-videos');

-- Storage RLS: coaches can delete their own videos
CREATE POLICY "Coaches delete exercise videos"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'exercise-videos' AND has_role(auth.uid(), 'coach'));
