import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to delete user data and auth record
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete all user data
    const tables = [
      { table: "notification_preferences", col: "user_id" },
      { table: "bodyweight_logs", col: "user_id" },
      { table: "workout_logs", col: "user_id" },
      { table: "food_logs", col: "user_id" },
      { table: "step_logs", col: "user_id" },
      { table: "sleep_logs", col: "user_id" },
      { table: "cardio_logs", col: "user_id" },
      { table: "weekly_check_ins", col: "user_id" },
      { table: "check_ins", col: "user_id" },
      { table: "workout_sessions", col: "user_id" },
      { table: "scheduled_sessions", col: "user_id" },
      { table: "user_preferences", col: "user_id" },
      { table: "feature_flags", col: "user_id" },
      { table: "client_onboarding", col: "user_id" },
      { table: "notifications", col: "recipient_id" },
      { table: "coach_clients", col: "client_id" },
      { table: "user_roles", col: "user_id" },
      { table: "profiles", col: "user_id" },
    ];

    for (const { table, col } of tables) {
      await adminClient.from(table).delete().eq(col, user.id);
    }

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);
    if (deleteError) {
      console.error("Failed to delete auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
