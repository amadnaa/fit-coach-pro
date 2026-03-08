
DROP POLICY IF EXISTS "Coaches can insert roles" ON user_roles;
CREATE POLICY "Coaches can insert client roles only" ON user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'coach') AND role = 'client');
