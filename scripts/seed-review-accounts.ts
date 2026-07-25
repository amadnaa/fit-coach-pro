/**
 * Seed demo reviewer accounts for App Store / Play review.
 *
 * Creates one demo coach and one demo client, linked exactly the way the app's
 * own coach-creates-client flow does (supabase/functions/create-client):
 * auth user via the admin API -> user_roles row -> coach_clients link. The
 * profiles row is created automatically by the DB trigger handle_new_user.
 *
 * Differences from the real flow, on purpose:
 *  - must_change_password is set to FALSE so the reviewer is never bounced to
 *    the forced password-change screen at first login.
 *  - a client_onboarding row is inserted so the reviewer skips onboarding.
 *  - the client is pre-populated: active plan with exercises, 3 completed
 *    workouts on past dates, nutrition, bodyweight, steps, and a check-in.
 *
 * Idempotent: safe to run twice. Existing users get their password reset to
 * the printed one; existing data rows are detected and not duplicated.
 *
 * Usage (never hardcode or commit these values):
 *   SUPABASE_URL=https://<project>.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service-role-key> \
 *   npx tsx scripts/seed-review-accounts.ts
 *
 * Optional env: DEMO_COACH_EMAIL, DEMO_CLIENT_EMAIL, DEMO_COACH_PASSWORD,
 * DEMO_CLIENT_PASSWORD (passwords are generated when not provided).
 */
import { createClient, type User } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in the environment.\n" +
      "Find them in Supabase Dashboard -> Project Settings -> API (use the service_role key, not anon).",
  );
  process.exit(1);
}

const COACH_EMAIL = process.env.DEMO_COACH_EMAIL ?? "demo-coach@lafuerza-review.example";
const CLIENT_EMAIL = process.env.DEMO_CLIENT_EMAIL ?? "demo-client@lafuerza-review.example";
const COACH_PASSWORD = process.env.DEMO_COACH_PASSWORD ?? generatePassword();
const CLIENT_PASSWORD = process.env.DEMO_CLIENT_PASSWORD ?? generatePassword();

const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function generatePassword(): string {
  // URL-safe, no ambiguous chars, comfortably over the 8-char minimum.
  return "Rev-" + randomBytes(9).toString("base64url");
}

function daysAgo(n: number, hour = 17): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function mondayOfWeek(offsetWeeks: number): string {
  const d = new Date();
  const day = d.getDay();
  const diff = (day === 0 ? 6 : day - 1) + offsetWeeks * 7;
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

async function findUserByEmail(email: string): Promise<User | null> {
  let page = 1;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(`listUsers failed: ${error.message}`);
    const match = data.users.find(
      (u) => u.email?.toLowerCase() === email.toLowerCase(),
    );
    if (match) return match;
    if (data.users.length < 200) return null;
    page++;
  }
}

async function ensureUser(
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const existing = await findUserByEmail(email);
  if (existing) {
    // Reset the password so the printed credentials are always valid, and make
    // sure must_change_password is off even if the account was originally made
    // through the app's coach flow.
    const { error } = await admin.auth.admin.updateUserById(existing.id, {
      password,
      user_metadata: { full_name: fullName, must_change_password: false },
    });
    if (error) throw new Error(`updateUserById(${email}) failed: ${error.message}`);
    console.log(`  reusing existing user ${email} (password reset)`);
    return existing.id;
  }

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    // Same shape as the create-client flow, but must_change_password stays off.
    user_metadata: { full_name: fullName, must_change_password: false },
  });
  if (error) throw new Error(`createUser(${email}) failed: ${error.message}`);
  console.log(`  created user ${email}`);
  return data.user.id;
}

async function ensureRow(
  table: string,
  match: Record<string, unknown>,
  insert: Record<string, unknown>,
): Promise<void> {
  let query = admin.from(table).select("id");
  for (const [k, v] of Object.entries(match)) query = query.eq(k, v as never);
  const { data, error } = await query.limit(1);
  if (error) throw new Error(`select ${table} failed: ${error.message}`);
  if (data && data.length > 0) return;
  const { error: insErr } = await admin.from(table).insert(insert);
  if (insErr) throw new Error(`insert ${table} failed: ${insErr.message}`);
}

async function tableIsEmptyFor(table: string, userId: string): Promise<boolean> {
  const { data, error } = await admin
    .from(table)
    .select("id")
    .eq("user_id", userId)
    .limit(1);
  if (error) throw new Error(`select ${table} failed: ${error.message}`);
  return !data || data.length === 0;
}

async function main() {
  console.log("Seeding demo reviewer accounts…");

  // 1. Accounts, mirroring the create-client flow.
  const coachId = await ensureUser(COACH_EMAIL, COACH_PASSWORD, "Demo Coach");
  const clientId = await ensureUser(CLIENT_EMAIL, CLIENT_PASSWORD, "Demo Client");

  await ensureRow(
    "user_roles",
    { user_id: coachId, role: "coach" },
    { user_id: coachId, role: "coach" },
  );
  await ensureRow(
    "user_roles",
    { user_id: clientId, role: "client" },
    { user_id: clientId, role: "client" },
  );
  await ensureRow(
    "coach_clients",
    { coach_id: coachId, client_id: clientId },
    { coach_id: coachId, client_id: clientId },
  );

  // 2. Skip onboarding so the reviewer lands on the dashboard.
  await ensureRow(
    "client_onboarding",
    { user_id: clientId },
    {
      user_id: clientId,
      training_focus: "strength",
      training_frequency: 3,
      preferred_split: "push_pull_legs",
      workout_duration: 60,
      completed: true,
    },
  );

  // 3. Exercise library entries owned by the demo coach.
  const exerciseDefs = [
    { name: "Barbell Bench Press", muscle_group: "chest", movement_type: "push" },
    { name: "Overhead Press", muscle_group: "shoulders", movement_type: "push" },
    { name: "Barbell Back Squat", muscle_group: "legs", movement_type: "legs" },
    { name: "Romanian Deadlift", muscle_group: "hamstrings", movement_type: "pull" },
    { name: "Barbell Row", muscle_group: "back", movement_type: "pull" },
    { name: "Lat Pulldown", muscle_group: "back", movement_type: "pull" },
  ];
  const exerciseIds: Record<string, string> = {};
  for (const def of exerciseDefs) {
    const { data } = await admin
      .from("exercises")
      .select("id")
      .eq("name", def.name)
      .eq("created_by", coachId)
      .limit(1);
    if (data && data.length > 0) {
      exerciseIds[def.name] = data[0].id;
    } else {
      const { data: created, error } = await admin
        .from("exercises")
        .insert({
          ...def,
          description: `${def.name} — controlled tempo, full range of motion.`,
          created_by: coachId,
        })
        .select("id")
        .single();
      if (error) throw new Error(`insert exercise failed: ${error.message}`);
      exerciseIds[def.name] = created.id;
    }
  }

  // 4. Active plan with two workout days.
  const PLAN_NAME = "Demo Strength Block";
  let planId: string;
  const { data: existingPlan } = await admin
    .from("workout_plans")
    .select("id")
    .eq("client_id", clientId)
    .eq("name", PLAN_NAME)
    .limit(1);
  if (existingPlan && existingPlan.length > 0) {
    planId = existingPlan[0].id;
  } else {
    const { data: plan, error } = await admin
      .from("workout_plans")
      .insert({
        client_id: clientId,
        name: PLAN_NAME,
        split_type: "upper_lower",
        frequency: 3,
        cycle_week: 2,
        is_active: true,
      })
      .select("id")
      .single();
    if (error) throw new Error(`insert workout_plans failed: ${error.message}`);
    planId = plan.id;
  }

  const workoutDefs = [
    {
      name: "Upper Body",
      day_number: 1,
      exercises: ["Barbell Bench Press", "Overhead Press", "Barbell Row", "Lat Pulldown"],
      weights: [60, 35, 55, 50],
    },
    {
      name: "Lower Body",
      day_number: 2,
      exercises: ["Barbell Back Squat", "Romanian Deadlift"],
      weights: [80, 70],
    },
  ];

  const workoutIds: string[] = [];
  const workoutExerciseIds: string[][] = [];
  for (const w of workoutDefs) {
    let workoutId: string;
    const { data: existingWorkout } = await admin
      .from("workouts")
      .select("id")
      .eq("plan_id", planId)
      .eq("day_number", w.day_number)
      .limit(1);
    if (existingWorkout && existingWorkout.length > 0) {
      workoutId = existingWorkout[0].id;
    } else {
      const { data: workout, error } = await admin
        .from("workouts")
        .insert({ plan_id: planId, name: w.name, day_number: w.day_number })
        .select("id")
        .single();
      if (error) throw new Error(`insert workouts failed: ${error.message}`);
      workoutId = workout.id;
    }
    workoutIds.push(workoutId);

    const weIds: string[] = [];
    for (let i = 0; i < w.exercises.length; i++) {
      const exId = exerciseIds[w.exercises[i]];
      const { data: existingWe } = await admin
        .from("workout_exercises")
        .select("id")
        .eq("workout_id", workoutId)
        .eq("exercise_id", exId)
        .limit(1);
      if (existingWe && existingWe.length > 0) {
        weIds.push(existingWe[0].id);
      } else {
        const { data: we, error } = await admin
          .from("workout_exercises")
          .insert({
            workout_id: workoutId,
            exercise_id: exId,
            sets: 3,
            rep_range_min: 8,
            rep_range_max: 12,
            target_weight: w.weights[i],
            sort_order: i,
          })
          .select("id")
          .single();
        if (error) throw new Error(`insert workout_exercises failed: ${error.message}`);
        weIds.push(we.id);
      }
    }
    workoutExerciseIds.push(weIds);
  }

  // 5. Three completed workouts on past dates (sessions + per-set logs).
  if (await tableIsEmptyFor("workout_sessions", clientId)) {
    const sessionDays = [
      { day: 7, workoutIdx: 0 },
      { day: 4, workoutIdx: 1 },
      { day: 2, workoutIdx: 0 },
    ];
    for (const s of sessionDays) {
      const started = daysAgo(s.day);
      const weIds = workoutExerciseIds[s.workoutIdx];
      const durationSeconds = 52 * 60;
      const setsPerExercise = 3;

      const { error: sesErr } = await admin.from("workout_sessions").insert({
        user_id: clientId,
        workout_id: workoutIds[s.workoutIdx],
        started_at: started.toISOString(),
        ended_at: new Date(started.getTime() + durationSeconds * 1000).toISOString(),
        duration_seconds: durationSeconds,
        exercises_completed: weIds.length,
        total_exercises: weIds.length,
        total_sets_completed: weIds.length * setsPerExercise,
        total_reps: weIds.length * setsPerExercise * 10,
        completed: true,
      });
      if (sesErr) throw new Error(`insert workout_sessions failed: ${sesErr.message}`);

      const w = workoutDefs[s.workoutIdx];
      const logs = weIds.flatMap((weId, exIdx) =>
        Array.from({ length: setsPerExercise }, (_, setIdx) => ({
          user_id: clientId,
          workout_exercise_id: weId,
          set_number: setIdx + 1,
          reps: 10 - setIdx,
          weight: w.weights[exIdx],
          completed_at: new Date(
            started.getTime() + (exIdx * setsPerExercise + setIdx + 1) * 3 * 60 * 1000,
          ).toISOString(),
        })),
      );
      const { error: logErr } = await admin.from("workout_logs").insert(logs);
      if (logErr) throw new Error(`insert workout_logs failed: ${logErr.message}`);
    }
    console.log("  seeded 3 completed workouts");
  } else {
    console.log("  workout sessions already present, skipping");
  }

  // 6. Nutrition entries (today + yesterday so the nutrition screen isn't empty).
  if (await tableIsEmptyFor("food_logs", clientId)) {
    const meals = [
      { food_name: "Oatmeal with berries", calories: 420, protein: 14, carbs: 68, fat: 9, day: 0, hour: 8 },
      { food_name: "Chicken and rice bowl", calories: 650, protein: 48, carbs: 72, fat: 14, day: 0, hour: 13 },
      { food_name: "Greek yogurt with honey", calories: 220, protein: 18, carbs: 26, fat: 5, day: 0, hour: 16 },
      { food_name: "Salmon, potatoes and salad", calories: 580, protein: 42, carbs: 45, fat: 22, day: 1, hour: 19 },
      { food_name: "Protein shake", calories: 180, protein: 30, carbs: 8, fat: 3, day: 1, hour: 11 },
    ];
    const { error } = await admin.from("food_logs").insert(
      meals.map((m) => ({
        user_id: clientId,
        food_name: m.food_name,
        calories: m.calories,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        logged_at: daysAgo(m.day, m.hour).toISOString(),
      })),
    );
    if (error) throw new Error(`insert food_logs failed: ${error.message}`);
    console.log("  seeded nutrition entries");
  } else {
    console.log("  food logs already present, skipping");
  }

  // 7. Progress data: bodyweight trend, steps, and a weekly check-in.
  if (await tableIsEmptyFor("bodyweight_logs", clientId)) {
    const weights = [82.4, 82.1, 81.9, 81.6, 81.5, 81.2];
    const { error } = await admin.from("bodyweight_logs").insert(
      weights.map((weight, i) => ({
        user_id: clientId,
        weight,
        logged_at: daysAgo((weights.length - 1 - i) * 3, 7).toISOString(),
      })),
    );
    if (error) throw new Error(`insert bodyweight_logs failed: ${error.message}`);
  }

  if (await tableIsEmptyFor("step_logs", clientId)) {
    const steps = [9100, 11250, 7800, 10400, 8900];
    const { error } = await admin.from("step_logs").insert(
      steps.map((s, i) => ({
        user_id: clientId,
        steps: s,
        logged_at: daysAgo(steps.length - 1 - i, 21).toISOString(),
      })),
    );
    if (error) throw new Error(`insert step_logs failed: ${error.message}`);
  }

  await ensureRow(
    "weekly_check_ins",
    { user_id: clientId, week_start: mondayOfWeek(1) },
    {
      user_id: clientId,
      week_start: mondayOfWeek(1),
      training_difficulty: "moderate",
      recovery_level: "good",
      energy_level: "good",
      notes: "Felt strong this week, squats moving well.",
    },
  );

  console.log("\nDone. Demo credentials for the review consoles:\n");
  console.log(`  Coach:  ${COACH_EMAIL}  /  ${COACH_PASSWORD}`);
  console.log(`  Client: ${CLIENT_EMAIL}  /  ${CLIENT_PASSWORD}`);
  console.log(
    "\nPaste these into review-notes.md (gitignored), then into App Store Connect",
  );
  console.log("(App Review Information) and Play Console (App content -> App access).");
}

main().catch((err) => {
  console.error("Seed failed:", err.message ?? err);
  process.exit(1);
});
