
-- Drop the old policy that lets clients see their own created exercises + coach exercises
DROP POLICY IF EXISTS "Exercises visible to clients via coach" ON public.exercises;

-- Create new policy: clients can ONLY see exercises created by their coach
CREATE POLICY "Exercises visible to clients via coach"
ON public.exercises
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = exercises.created_by
      AND coach_clients.client_id = auth.uid()
  )
);
