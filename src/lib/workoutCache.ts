import { Preferences } from "@capacitor/preferences";

// Offline cache for the client's active workout plan, keyed per user so a
// device shared between accounts never shows someone else's plan.

export interface CachedPlan {
  planInfo: { cycle_week: number; name: string };
  workouts: { id: string; name: string; day_number: number }[];
}

const planKey = (userId: string) => `workout-plan:${userId}`;
const exercisesKey = (userId: string, workoutId: string) =>
  `workout-exercises:${userId}:${workoutId}`;

export async function cachePlan(userId: string, plan: CachedPlan) {
  try {
    await Preferences.set({ key: planKey(userId), value: JSON.stringify(plan) });
  } catch {
    // caching is best-effort
  }
}

export async function getCachedPlan(userId: string): Promise<CachedPlan | null> {
  try {
    const { value } = await Preferences.get({ key: planKey(userId) });
    return value ? (JSON.parse(value) as CachedPlan) : null;
  } catch {
    return null;
  }
}

export async function cacheExercises(
  userId: string,
  workoutId: string,
  exercises: unknown[],
) {
  try {
    await Preferences.set({
      key: exercisesKey(userId, workoutId),
      value: JSON.stringify(exercises),
    });
  } catch {
    // caching is best-effort
  }
}

export async function getCachedExercises(
  userId: string,
  workoutId: string,
): Promise<unknown[] | null> {
  try {
    const { value } = await Preferences.get({
      key: exercisesKey(userId, workoutId),
    });
    return value ? (JSON.parse(value) as unknown[]) : null;
  } catch {
    return null;
  }
}
