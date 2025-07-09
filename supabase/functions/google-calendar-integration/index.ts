import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CalendarRequest {
  action: 'getAvailability' | 'createEvent';
  date?: string;
  eventDetails?: {
    summary: string;
    description: string;
    startTime: string;
    endTime: string;
    attendeeEmail: string;
    attendeeName: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, date, eventDetails }: CalendarRequest = await req.json();

    // Get Google Calendar access token
    const accessToken = await getGoogleAccessToken();
    
    if (action === 'getAvailability') {
      const availability = await getCalendarAvailability(accessToken, date);
      return new Response(JSON.stringify({ availability }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    
    if (action === 'createEvent' && eventDetails) {
      const event = await createCalendarEvent(accessToken, eventDetails);
      return new Response(JSON.stringify({ event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error in google-calendar-integration:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

async function getGoogleAccessToken(): Promise<string> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
  
  if (!clientId || !clientSecret) {
    throw new Error('Google Calendar credentials not configured');
  }

  // For service account or refresh token flow
  // This is a simplified version - you might need to implement proper OAuth flow
  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: clientId,
      client_secret: clientSecret,
      scope: 'https://www.googleapis.com/auth/calendar',
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get access token: ${data.error_description}`);
  }

  return data.access_token;
}

async function getCalendarAvailability(accessToken: string, date?: string): Promise<string[]> {
  const targetDate = date ? new Date(date) : new Date();
  const startTime = new Date(targetDate);
  startTime.setHours(8, 0, 0, 0); // Start at 8 AM
  
  const endTime = new Date(targetDate);
  endTime.setHours(18, 0, 0, 0); // End at 6 PM

  // Get busy times from Google Calendar
  const response = await fetch(`https://www.googleapis.com/calendar/v3/freeBusy`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      timeMin: startTime.toISOString(),
      timeMax: endTime.toISOString(),
      items: [{ id: 'primary' }], // Using primary calendar
    }),
  });

  const busyData = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to get calendar data: ${busyData.error?.message}`);
  }

  const busyTimes = busyData.calendars?.primary?.busy || [];
  
  // Generate available 30-minute slots
  const availableSlots: string[] = [];
  const current = new Date(startTime);
  
  while (current < endTime) {
    const slotEnd = new Date(current.getTime() + 30 * 60000); // 30 minutes
    
    // Check if this slot conflicts with any busy time
    const isAvailable = !busyTimes.some((busy: any) => {
      const busyStart = new Date(busy.start);
      const busyEnd = new Date(busy.end);
      return (current < busyEnd && slotEnd > busyStart);
    });
    
    if (isAvailable) {
      availableSlots.push(current.toTimeString().slice(0, 5)); // HH:MM format
    }
    
    current.setTime(current.getTime() + 30 * 60000); // Move to next 30-min slot
  }
  
  return availableSlots;
}

async function createCalendarEvent(accessToken: string, eventDetails: any): Promise<any> {
  const event = {
    summary: eventDetails.summary,
    description: eventDetails.description,
    start: {
      dateTime: eventDetails.startTime,
      timeZone: 'America/New_York', // Adjust timezone as needed
    },
    end: {
      dateTime: eventDetails.endTime,
      timeZone: 'America/New_York',
    },
    attendees: [
      {
        email: eventDetails.attendeeEmail,
        displayName: eventDetails.attendeeName,
      },
    ],
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 }, // 24 hours before
        { method: 'popup', minutes: 30 }, // 30 minutes before
      ],
    },
  };

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(event),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Failed to create calendar event: ${data.error?.message}`);
  }

  return data;
}

serve(handler);