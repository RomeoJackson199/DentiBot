import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { startDate, endDate } = await req.json();
    
    const googleClientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const googleClientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from request
    const authHeader = req.headers.get('Authorization')?.split('Bearer ')[1];
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader);
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    // Get dentist record with refresh token
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    const { data: dentist } = await supabase
      .from('dentists')
      .select('id, google_calendar_refresh_token, google_calendar_connected')
      .eq('profile_id', profile.id)
      .single();
    
    if (!dentist?.google_calendar_connected || !dentist.google_calendar_refresh_token) {
      return new Response(
        JSON.stringify({ events: [], connected: false }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Get access token from refresh token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        refresh_token: dentist.google_calendar_refresh_token,
        client_id: googleClientId!,
        client_secret: googleClientSecret!,
        grant_type: 'refresh_token',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      throw new Error('Failed to get access token');
    }
    
    // Fetch calendar events
    const timeMin = new Date(startDate).toISOString();
    const timeMax = new Date(endDate).toISOString();
    
    const calendarResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events?` +
      `timeMin=${encodeURIComponent(timeMin)}&` +
      `timeMax=${encodeURIComponent(timeMax)}&` +
      `singleEvents=true&` +
      `orderBy=startTime`,
      {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      }
    );
    
    const calendarData = await calendarResponse.json();
    
    if (!calendarResponse.ok) {
      console.error('Calendar API error:', calendarData);
      throw new Error('Failed to fetch calendar events');
    }
    
    // Update last sync time
    await supabase
      .from('dentists')
      .update({ google_calendar_last_sync: new Date().toISOString() })
      .eq('id', dentist.id);
    
    // Transform events to match our format and mark slots as unavailable
    const events = (calendarData.items || []).map((event: any) => ({
      id: `gcal_${event.id}`,
      summary: event.summary || 'Untitled Event',
      description: event.description || '',
      start: event.start?.dateTime || event.start?.date,
      end: event.end?.dateTime || event.end?.date,
      location: event.location || '',
      isGoogleCalendarEvent: true,
    }));

    // Block appointment slots for Google Calendar events
    for (const event of events) {
      if (event.start) {
        const startTime = new Date(event.start);
        const slotDate = startTime.toISOString().split('T')[0];
        const slotTime = startTime.toISOString().split('T')[1].substring(0, 5);
        
        // Mark slot as unavailable
        await supabase
          .from('appointment_slots')
          .update({ 
            is_available: false,
            updated_at: new Date().toISOString()
          })
          .eq('dentist_id', dentist.id)
          .eq('slot_date', slotDate)
          .eq('slot_time', slotTime);
      }
    }
    
    return new Response(
      JSON.stringify({ events, connected: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Error in google-calendar-sync:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
