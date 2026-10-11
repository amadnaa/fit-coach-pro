-- Coaches could insert any coach_clients row linking themselves to any existing
-- client, and every "coach views client data" policy would then pass — i.e. a coach
-- could read another coach's clients' health data.
--
-- The app never inserts into coach_clients from the client: links are created only by
-- the create-client edge function and the seed scripts, which use the service role and
-- bypass RLS. So the authenticated INSERT policy can simply go. Existing links, and the
-- SELECT policies for coaches and clients, are untouched.
DROP POLICY IF EXISTS "Coaches can add clients" ON public.coach_clients;
