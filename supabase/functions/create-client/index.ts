import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify the caller is authenticated and is a coach
    const authHeader = req.headers.get('Authorization')!;
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Check coach role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', caller.id).eq('role', 'coach').maybeSingle();
    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Only coaches can create clients' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const full_name = typeof body.full_name === 'string' ? body.full_name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!password || password.length < 8) {
      return new Response(JSON.stringify({ error: 'Password must be at least 8 characters' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Create the user via admin API with the coach-provided initial password.
    // must_change_password forces the client to set their own password on first login.
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, must_change_password: true },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const clientId = newUser.user.id;

    // Assign client role
    const { error: roleError } = await adminClient.from('user_roles').insert({ user_id: clientId, role: 'client' });

    // Link coach to client
    const { error: linkError } = await adminClient.from('coach_clients').insert({ coach_id: caller.id, client_id: clientId });

    // If the follow-up records failed, roll back the auth user so the coach can retry cleanly.
    if (roleError || linkError) {
      await adminClient.auth.admin.deleteUser(clientId);
      return new Response(
        JSON.stringify({ error: (roleError || linkError)?.message || 'Failed to finish setting up client' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, client_id: clientId }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
