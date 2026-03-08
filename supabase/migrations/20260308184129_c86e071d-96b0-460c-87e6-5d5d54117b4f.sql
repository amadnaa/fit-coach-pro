
-- Expand client_onboarding table with new questionnaire fields
ALTER TABLE public.client_onboarding 
ADD COLUMN IF NOT EXISTS fitness_goal text NOT NULL DEFAULT 'general_fitness',
ADD COLUMN IF NOT EXISTS experience_level text NOT NULL DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS equipment_access text NOT NULL DEFAULT 'full_gym',
ADD COLUMN IF NOT EXISTS cardio_preference text NOT NULL DEFAULT 'some';

-- Allow coaches to view client onboarding data
CREATE POLICY "Coaches view client onboarding"
ON public.client_onboarding
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = client_onboarding.user_id
  )
);

-- Allow clients to view their own coach_clients row (needed to find their coach)
CREATE POLICY "Clients can view own coach link"
ON public.coach_clients
FOR SELECT
TO authenticated
USING (auth.uid() = client_id);
