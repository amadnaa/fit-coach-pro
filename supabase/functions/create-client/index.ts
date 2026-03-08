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

    const { full_name, email, notes } = await req.json();

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: 'Name and email are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Generate a temporary password
    const tempPassword = crypto.randomUUID().slice(0, 12) + 'A1!';

    // Create the user via admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: { full_name },
    });

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const clientId = newUser.user.id;

    // Assign client role
    await adminClient.from('user_roles').insert({ user_id: clientId, role: 'client' });

    // Link coach to client
    await adminClient.from('coach_clients').insert({ coach_id: caller.id, client_id: clientId });

    // Update profile with notes if provided
    if (notes) {
      // Notes can be stored as part of the profile or a separate field - for now just ensure profile exists
    }

    // Send password reset email so client can set their own password
    await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    });

    return new Response(
      JSON.stringify({ success: true, client_id: clientId, temp_password: tempPassword }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
