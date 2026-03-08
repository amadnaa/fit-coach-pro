import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: string[] = [];

  // Create coach
  const { data: coach, error: coachErr } = await supabaseAdmin.auth.admin.createUser({
    email: "coach@test.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: { full_name: "Demo Coach" },
  });

  if (coachErr && !coachErr.message.includes("already been registered")) {
    results.push(`Coach error: ${coachErr.message}`);
  } else if (coach?.user) {
    await supabaseAdmin.from("user_roles").upsert({ user_id: coach.user.id, role: "coach" }, { onConflict: "user_id,role" });
    results.push(`Coach created: coach@test.com`);
  } else {
    // Already exists, get user
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const existingCoach = users?.find(u => u.email === "coach@test.com");
    if (existingCoach) {
      await supabaseAdmin.from("user_roles").upsert({ user_id: existingCoach.id, role: "coach" }, { onConflict: "user_id,role" });
      results.push("Coach already exists, role ensured");
    }
  }

  // Create client
  const { data: client, error: clientErr } = await supabaseAdmin.auth.admin.createUser({
    email: "client@test.com",
    password: "Test1234!",
    email_confirm: true,
    user_metadata: { full_name: "Demo Client" },
  });

  if (clientErr && !clientErr.message.includes("already been registered")) {
    results.push(`Client error: ${clientErr.message}`);
  } else if (client?.user) {
    await supabaseAdmin.from("user_roles").upsert({ user_id: client.user.id, role: "client" }, { onConflict: "user_id,role" });
    results.push(`Client created: client@test.com`);

    // Link client to coach
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const coachUser = users?.find(u => u.email === "coach@test.com");
    if (coachUser) {
      await supabaseAdmin.from("coach_clients").upsert(
        { coach_id: coachUser.id, client_id: client.user.id },
        { onConflict: "id" }
      );
      // Create feature flags for client
      await supabaseAdmin.from("feature_flags").upsert(
        { user_id: client.user.id, food_tracking_enabled: true, sleep_tracking_enabled: true, cardio_tracking_enabled: true },
        { onConflict: "user_id" }
      );
    }
  } else {
    results.push("Client already exists");
  }

  // Create Apple review demo account (client role)
  const { data: reviewer, error: reviewerErr } = await supabaseAdmin.auth.admin.createUser({
    email: "demo@fitcoach.app",
    password: "Review1234!",
    email_confirm: true,
    user_metadata: { full_name: "Apple Reviewer" },
  });

  if (reviewerErr && !reviewerErr.message.includes("already been registered")) {
    results.push(`Reviewer error: ${reviewerErr.message}`);
  } else if (reviewer?.user) {
    await supabaseAdmin.from("user_roles").upsert({ user_id: reviewer.user.id, role: "client" }, { onConflict: "user_id,role" });
    // Link to coach
    const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
    const coachUser = users?.find(u => u.email === "coach@test.com");
    if (coachUser) {
      await supabaseAdmin.from("coach_clients").upsert(
        { coach_id: coachUser.id, client_id: reviewer.user.id },
        { onConflict: "id" }
      );
      await supabaseAdmin.from("feature_flags").upsert(
        { user_id: reviewer.user.id, food_tracking_enabled: true, sleep_tracking_enabled: true, cardio_tracking_enabled: true },
        { onConflict: "user_id" }
      );
    }
    results.push("Apple review account created: demo@fitcoach.app");
  } else {
    results.push("Apple review account already exists");
  }

  return new Response(JSON.stringify({ results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
