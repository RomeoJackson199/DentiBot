import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarRequest {
  action: 'getAvailability' | 'createEvent' | 'getAuthUrl' | 'exchangeToken' | 'testAccess';
  date?: string;
  eventDetails?: {
    summary: string;
    startDateTime: string;
    endDateTime: string;
    timeZone?: string;
    attendeeEmail?: string;
    attendeeName?: string;
  };
  authCode?: string;
  tokens?: any;
}

// OAuth configuration
function getOAuthConfig() {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials not found');
  }
  
  return { clientId, clientSecret };
}

// Generate OAuth authorization URL
function generateAuthUrl(): string {
  const { clientId } = getOAuthConfig();
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-integration/callback`;
  
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/calendar',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

// Exchange authorization code for tokens
async function exchangeCodeForTokens(authCode: string): Promise<any> {
  const { clientId, clientSecret } = getOAuthConfig();
  const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-calendar-integration/callback`;
  
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: authCode,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri
    })
  });
  
  if (!response.ok) {
    const error = await response.text();
    console.error('Token exchange failed:', error);
    throw new Error('Failed to exchange authorization code for tokens');
  }
  
  return await response.json();
}

// Create a calendar event using OAuth tokens
async function createCalendarEvent(tokens: any, eventDetails: any): Promise<any> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary: eventDetails.summary,
          start: {
            dateTime: eventDetails.startDateTime,
            timeZone: eventDetails.timeZone || 'Europe/Brussels',
          },
          end: {
            dateTime: eventDetails.endDateTime,
            timeZone: eventDetails.timeZone || 'Europe/Brussels',
          },
          attendees: eventDetails.attendeeEmail ? [{
            email: eventDetails.attendeeEmail,
            displayName: eventDetails.attendeeName || ''
          }] : [],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calendar API error:', errorText);
      throw new Error(`Failed to create calendar event: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error creating calendar event:', error);
    throw error;
  }
}

function generateAvailableTimeSlots(busySlots: any[], date: string): string[] {
  // Define business hours (9 AM to 6 PM)
  const startHour = 9;
  const endHour = 18;
  
  const availableSlots: string[] = [];
  const selectedDate = new Date(date);
  
  // Generate all possible time slots
  for (let hour = startHour; hour < endHour; hour++) {
    const timeSlot = `${hour.toString().padStart(2, '0')}:00`;
    const slotStart = new Date(selectedDate);
    slotStart.setHours(hour, 0, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setHours(hour + 1, 0, 0, 0);
    
    // Check if this slot conflicts with any busy periods
    const isSlotBusy = busySlots.some((busySlot: any) => {
      const busyStart = new Date(busySlot.start);
      const busyEnd = new Date(busySlot.end);
      
      // Check for overlap
      return (slotStart < busyEnd) && (slotEnd > busyStart);
    });
    
    if (!isSlotBusy) {
      availableSlots.push(timeSlot);
    }
  }
  
  return availableSlots;
}

// Get calendar availability using FreeBusy API with OAuth tokens
async function getCalendarAvailability(tokens: any, date?: string): Promise<string[]> {
  try {
    const targetDate = date || new Date().toISOString().split('T')[0];
    const startTime = `${targetDate}T00:00:00Z`;
    const endTime = `${targetDate}T23:59:59Z`;
    
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/freeBusy',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          timeMin: startTime,
          timeMax: endTime,
          items: [{ id: 'primary' }]
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('FreeBusy API error:', errorText);
      throw new Error(`FreeBusy API failed: ${response.status}`);
    }

    const data = await response.json();
    const busySlots = data.calendars?.primary?.busy || [];
    
    return generateAvailableTimeSlots(busySlots, targetDate);
  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    throw error;
  }
}

// Test calendar access by fetching calendar list
async function testCalendarAccess(tokens: any): Promise<any> {
  try {
    const response = await fetch(
      'https://www.googleapis.com/calendar/v3/users/me/calendarList',
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Calendar list API error:', errorText);
      throw new Error(`Calendar list API failed: ${response.status}`);
    }

    const data = await response.json();
    return data.items?.map((cal: any) => ({ id: cal.id, summary: cal.summary })) || [];
  } catch (error) {
    console.error('Error testing calendar access:', error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    let requestData: CalendarRequest;

    if (req.method === 'GET') {
      // Handle OAuth callback from Google
      const url = new URL(req.url);
      const authCode = url.searchParams.get('code');
      
      if (authCode) {
        // This is an OAuth callback - redirect back to the app with the code
        const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://952bbe84-3a4d-4f46-b2b7-7a7945d9eaf0.lovableproject.com'}/?code=${authCode}`;
        
        return new Response(null, {
          status: 302,
          headers: {
            ...corsHeaders,
            'Location': redirectUrl
          }
        });
      }
      
      return new Response(JSON.stringify({ error: 'Invalid GET request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
      
    } else {
      // Handle POST requests from supabase.functions.invoke()
      try {
        requestData = await req.json();
        console.log('Received request data:', requestData);
        
        // Ensure we have a valid action
        if (!requestData.action) {
          console.error('Missing action in request:', requestData);
          return new Response(JSON.stringify({ 
            error: 'Missing action parameter',
            received: requestData 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        return new Response(JSON.stringify({ 
          error: 'Invalid JSON in request body', 
          details: parseError.message 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const { action, date, eventDetails, authCode, tokens } = requestData;
    console.log('Calendar request:', { action, date });

    let result;
    
    if (action === 'getAuthUrl') {
      console.log('Generating OAuth authorization URL');
      const authUrl = generateAuthUrl();
      result = { authUrl };
      
    } else if (action === 'exchangeToken') {
      console.log('Exchanging authorization code for tokens');
      if (!authCode) {
        throw new Error('Authorization code is required');
      }
      const tokenData = await exchangeCodeForTokens(authCode);
      result = { tokens: tokenData };
      
    } else if (action === 'testAccess') {
      console.log('Testing calendar access');
      if (!tokens) {
        throw new Error('OAuth tokens are required');
      }
      const calendarList = await testCalendarAccess(tokens);
      result = { calendarList };
      
    } else if (action === 'getAvailability') {
      console.log('Getting calendar availability for date:', date);
      if (!tokens) {
        throw new Error('OAuth tokens are required');
      }
      const availability = await getCalendarAvailability(tokens, date);
      result = { availability };
      
    } else if (action === 'createEvent') {
      console.log('Creating calendar event:', eventDetails);
      if (!eventDetails) {
        throw new Error('Event details are required');
      }
      if (!tokens) {
        throw new Error('OAuth tokens are required');
      }
      
      const event = await createCalendarEvent(tokens, eventDetails);
      
      // Test calendar access to verify permissions
      const calendarList = await testCalendarAccess(tokens);
      console.log('Accessible calendars:', calendarList);
      
      result = { event, calendarList };
      
    } else {
      throw new Error(`Unknown action: ${action}`);
    }

    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );

  } catch (error: any) {
    console.error('Function error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Internal server error',
        details: error.stack || 'No stack trace available'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
};

serve(handler);