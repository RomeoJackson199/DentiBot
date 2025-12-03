import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        // Get the authorization header
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'Missing authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        // Create Supabase client with service role for admin operations
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        );

        // Create regular client to verify the user
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        );

        // Get the authenticated user
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log('Deleting account for user:', user.id);

        // Delete user data in order (respecting foreign key constraints)

        // 1. Delete messages
        await supabaseAdmin.from('messages').delete().eq('user_id', user.id);

        // 2. Delete appointments
        await supabaseAdmin.from('appointments').delete().eq('patient_id', user.id);

        // 3. Delete verification codes
        await supabaseAdmin.from('verification_codes').delete().eq('email', user.email);

        // 4. Delete invitation tokens
        await supabaseAdmin.from('invitation_tokens').delete().eq('email', user.email);

        // 5. Delete profile
        await supabaseAdmin.from('profiles').delete().eq('user_id', user.id);

        // 6. Delete dentist record if exists
        await supabaseAdmin.from('dentists').delete().eq('user_id', user.id);

        // 7. Delete staff memberships
        await supabaseAdmin.from('staff_members').delete().eq('user_id', user.id);

        // 8. Finally, delete the auth user
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

        if (deleteError) {
            console.error('Error deleting user from auth:', deleteError);
            throw deleteError;
        }

        console.log('Successfully deleted account for user:', user.id);

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Account and all associated data have been permanently deleted'
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    } catch (error) {
        console.error('Error in delete-user-account:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Failed to delete account' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }
});
