
-- Add coach visibility to food_logs
CREATE POLICY "Coaches view client food logs"
ON public.food_logs
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM coach_clients
    WHERE coach_clients.coach_id = auth.uid()
    AND coach_clients.client_id = food_logs.user_id
  )
);
