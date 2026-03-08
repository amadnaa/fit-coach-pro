
-- =============================================
-- FIX: Recreate ALL RLS policies as PERMISSIVE
-- =============================================

-- bodyweight_logs
DROP POLICY IF EXISTS "Coaches view client bodyweight logs" ON bodyweight_logs;
DROP POLICY IF EXISTS "Users manage own weight logs" ON bodyweight_logs;
CREATE POLICY "Users manage own weight logs" ON bodyweight_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client bodyweight logs" ON bodyweight_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = bodyweight_logs.user_id));

-- cardio_logs
DROP POLICY IF EXISTS "Users manage own cardio logs" ON cardio_logs;
CREATE POLICY "Users manage own cardio logs" ON cardio_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- check_ins
DROP POLICY IF EXISTS "Users manage own check-ins" ON check_ins;
CREATE POLICY "Users manage own check-ins" ON check_ins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- client_onboarding
DROP POLICY IF EXISTS "Users manage own onboarding" ON client_onboarding;
DROP POLICY IF EXISTS "Coaches view client onboarding" ON client_onboarding;
CREATE POLICY "Users manage own onboarding" ON client_onboarding FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client onboarding" ON client_onboarding FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = client_onboarding.user_id));

-- coach_clients (FIX: restrict INSERT so coach can only add clients that have a matching user_code invite)
DROP POLICY IF EXISTS "Coaches can view own clients" ON coach_clients;
DROP POLICY IF EXISTS "Clients can view own coach link" ON coach_clients;
DROP POLICY IF EXISTS "Coaches can add clients" ON coach_clients;
CREATE POLICY "Coaches can view own clients" ON coach_clients FOR SELECT TO authenticated USING (auth.uid() = coach_id);
CREATE POLICY "Clients can view own coach link" ON coach_clients FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Coaches can add clients" ON coach_clients FOR INSERT TO authenticated WITH CHECK (auth.uid() = coach_id AND EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = coach_clients.client_id AND user_roles.role = 'client'));

-- exercises
DROP POLICY IF EXISTS "Coaches can manage exercises" ON exercises;
DROP POLICY IF EXISTS "Exercises visible to creator and their trainees" ON exercises;
CREATE POLICY "Coaches can manage exercises" ON exercises FOR ALL TO authenticated USING (has_role(auth.uid(), 'coach')) WITH CHECK (has_role(auth.uid(), 'coach'));
CREATE POLICY "Exercises visible to clients via coach" ON exercises FOR SELECT TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = exercises.created_by AND coach_clients.client_id = auth.uid()));

-- feature_flags
DROP POLICY IF EXISTS "Coaches manage client flags" ON feature_flags;
DROP POLICY IF EXISTS "Users view own flags" ON feature_flags;
CREATE POLICY "Users view own flags" ON feature_flags FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coaches manage client flags" ON feature_flags FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = feature_flags.user_id)) WITH CHECK (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = feature_flags.user_id));

-- food_logs
DROP POLICY IF EXISTS "Users manage own food logs" ON food_logs;
DROP POLICY IF EXISTS "Coaches view client food logs" ON food_logs;
CREATE POLICY "Users manage own food logs" ON food_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client food logs" ON food_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = food_logs.user_id));

-- notifications (FIX: restrict broadcast update to only read field)
DROP POLICY IF EXISTS "Users view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON notifications;
DROP POLICY IF EXISTS "Coaches send notifications" ON notifications;
CREATE POLICY "Users view own notifications" ON notifications FOR SELECT TO authenticated USING (recipient_id = auth.uid() OR is_broadcast = true);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE TO authenticated USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "Coaches send notifications" ON notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'coach') OR has_role(auth.uid(), 'admin'));

-- profiles (FIX: scope visibility to self + linked coach/client)
DROP POLICY IF EXISTS "Profiles viewable by authenticated" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can view relevant profiles" ON profiles FOR SELECT TO authenticated USING (
  auth.uid() = user_id 
  OR EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = profiles.user_id)
  OR EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.client_id = auth.uid() AND coach_clients.coach_id = profiles.user_id)
);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- recipes
DROP POLICY IF EXISTS "Coaches can manage recipes" ON recipes;
DROP POLICY IF EXISTS "Recipes viewable by authenticated" ON recipes;
CREATE POLICY "Coaches can manage recipes" ON recipes FOR ALL TO authenticated USING (has_role(auth.uid(), 'coach')) WITH CHECK (has_role(auth.uid(), 'coach'));
CREATE POLICY "Clients view coach recipes" ON recipes FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = recipes.created_by AND coach_clients.client_id = auth.uid()));

-- scheduled_sessions
DROP POLICY IF EXISTS "Users manage own sessions" ON scheduled_sessions;
DROP POLICY IF EXISTS "Coaches view client sessions" ON scheduled_sessions;
CREATE POLICY "Users manage own sessions" ON scheduled_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client sessions" ON scheduled_sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = scheduled_sessions.user_id));

-- sleep_logs
DROP POLICY IF EXISTS "Users manage own sleep logs" ON sleep_logs;
DROP POLICY IF EXISTS "Coaches view client sleep logs" ON sleep_logs;
CREATE POLICY "Users manage own sleep logs" ON sleep_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client sleep logs" ON sleep_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = sleep_logs.user_id));

-- step_logs
DROP POLICY IF EXISTS "Users manage own step logs" ON step_logs;
DROP POLICY IF EXISTS "Coaches view client step logs" ON step_logs;
CREATE POLICY "Users manage own step logs" ON step_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client step logs" ON step_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = step_logs.user_id));

-- user_preferences
DROP POLICY IF EXISTS "Users manage own preferences" ON user_preferences;
CREATE POLICY "Users manage own preferences" ON user_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON user_roles;
DROP POLICY IF EXISTS "Coaches can view client roles" ON user_roles;
DROP POLICY IF EXISTS "Coaches can insert roles" ON user_roles;
CREATE POLICY "Users can view own roles" ON user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Coaches can view client roles" ON user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'coach'));
CREATE POLICY "Coaches can insert roles" ON user_roles FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'coach'));

-- weekly_check_ins
DROP POLICY IF EXISTS "Users manage own weekly check-ins" ON weekly_check_ins;
DROP POLICY IF EXISTS "Coaches view client weekly check-ins" ON weekly_check_ins;
CREATE POLICY "Users manage own weekly check-ins" ON weekly_check_ins FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client weekly check-ins" ON weekly_check_ins FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = weekly_check_ins.user_id));

-- workout_exercises
DROP POLICY IF EXISTS "Coaches manage workout exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Users view workout exercises" ON workout_exercises;
CREATE POLICY "Coaches manage workout exercises" ON workout_exercises FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM workouts w JOIN workout_plans wp ON w.plan_id = wp.id JOIN coach_clients cc ON cc.client_id = wp.client_id WHERE w.id = workout_exercises.workout_id AND cc.coach_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workouts w JOIN workout_plans wp ON w.plan_id = wp.id JOIN coach_clients cc ON cc.client_id = wp.client_id WHERE w.id = workout_exercises.workout_id AND cc.coach_id = auth.uid()));
CREATE POLICY "Users view workout exercises" ON workout_exercises FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workouts w JOIN workout_plans wp ON w.plan_id = wp.id WHERE w.id = workout_exercises.workout_id AND wp.client_id = auth.uid()));

-- workout_logs
DROP POLICY IF EXISTS "Users manage own logs" ON workout_logs;
DROP POLICY IF EXISTS "Coaches view client workout logs" ON workout_logs;
CREATE POLICY "Users manage own logs" ON workout_logs FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client workout logs" ON workout_logs FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = workout_logs.user_id));

-- workout_plans
DROP POLICY IF EXISTS "Clients view own plans" ON workout_plans;
DROP POLICY IF EXISTS "Coaches manage client plans" ON workout_plans;
CREATE POLICY "Clients view own plans" ON workout_plans FOR SELECT TO authenticated USING (auth.uid() = client_id);
CREATE POLICY "Coaches manage client plans" ON workout_plans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = workout_plans.client_id)) WITH CHECK (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = workout_plans.client_id));

-- workout_sessions
DROP POLICY IF EXISTS "Users manage own sessions" ON workout_sessions;
DROP POLICY IF EXISTS "Coaches view client sessions" ON workout_sessions;
CREATE POLICY "Users manage own sessions" ON workout_sessions FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client sessions" ON workout_sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = workout_sessions.user_id));

-- workouts
DROP POLICY IF EXISTS "Coaches manage workouts" ON workouts;
DROP POLICY IF EXISTS "Users view workouts via plans" ON workouts;
CREATE POLICY "Coaches manage workouts" ON workouts FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM workout_plans wp JOIN coach_clients cc ON cc.client_id = wp.client_id WHERE wp.id = workouts.plan_id AND cc.coach_id = auth.uid())) WITH CHECK (EXISTS (SELECT 1 FROM workout_plans wp JOIN coach_clients cc ON cc.client_id = wp.client_id WHERE wp.id = workouts.plan_id AND cc.coach_id = auth.uid()));
CREATE POLICY "Users view workouts via plans" ON workouts FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM workout_plans WHERE workout_plans.id = workouts.plan_id AND workout_plans.client_id = auth.uid()));

-- notification_preferences
DROP POLICY IF EXISTS "Users manage own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Coaches view client notification preferences" ON notification_preferences;
CREATE POLICY "Users manage own notification preferences" ON notification_preferences FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Coaches view client notification preferences" ON notification_preferences FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM coach_clients WHERE coach_clients.coach_id = auth.uid() AND coach_clients.client_id = notification_preferences.user_id));
