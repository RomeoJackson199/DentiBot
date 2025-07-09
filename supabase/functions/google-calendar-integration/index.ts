import { GoogleAuth } from "npm:google-auth-library";
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

async function getGoogleAccessToken(): Promise<string> {
  // Get service account credentials from environment
  const serviceAccountKey = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_KEY');
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
  
  if (!serviceAccountKey || !calendarId) {
    throw new Error("Missing required Google Calendar configuration");
  }

  const serviceAccountJson = JSON.parse(serviceAccountKey);
  
  const auth = new GoogleAuth({
    credentials: serviceAccountJson,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });
  
  const client = await auth.getClient();
  const accessTokenResponse = await client.getAccessToken();
  
  if (!accessTokenResponse || !accessTokenResponse.token) {
    throw new Error("Unable to obtain Google access token");
  }
  
  return accessTokenResponse.token;
}

async function createCalendarEvent(accessToken: string, eventDetails: any): Promise<any> {
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
  
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      summary: eventDetails.summary,
      description: eventDetails.description,
      start: { dateTime: eventDetails.startTime, timeZone: "Europe/Brussels" },
      end: { dateTime: eventDetails.endTime, timeZone: "Europe/Brussels" },
      attendees: [
        { email: eventDetails.attendeeEmail, displayName: eventDetails.attendeeName }
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google Calendar API error: ${res.status} ${text}`);
  }
  
  return await res.json();
}

function generateAvailableTimeSlots(busySlots: any[], date: string): string[] {
  // Define business hours (9 AM to 6 PM)
  const startHour = 9;
  const endHour = 18;
  const slotDuration = 60; // 60 minutes per slot
  
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
    const isSlotBusy = busySlots.some(busySlot => {
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

async function getCalendarAvailability(accessToken: string, date?: string): Promise<string[]> {
  const calendarId = Deno.env.get('GOOGLE_CALENDAR_ID');
  
  // Use provided date or today
  const targetDate = date ? new Date(date) : new Date();
  const timeMin = new Date(targetDate);
  timeMin.setHours(0, 0, 0, 0);
  const timeMax = new Date(targetDate);
  timeMax.setHours(23, 59, 59, 999);

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      timeZone: "Europe/Brussels",
      items: [{ id: calendarId }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FreeBusy API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const busySlots = data.calendars[calendarId]?.busy || [];
  
  // Convert busy slots to available time slots
  const availableSlots = generateAvailableTimeSlots(busySlots, targetDate.toISOString().split('T')[0]);
  
  return availableSlots;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.text();
    let requestData: CalendarRequest;

    try {
      requestData = JSON.parse(body);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, date, eventDetails } = requestData;
    console.log('Calendar request:', { action, date });

    // Get Google Calendar access token
    const accessToken = await getGoogleAccessToken();

    if (action === 'getAvailability') {
      const availability = await getCalendarAvailability(accessToken, date);
      console.log('Available slots:', availability);
      
      return new Response(JSON.stringify({ availability }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'createEvent' && eventDetails) {
      const event = await createCalendarEvent(accessToken, eventDetails);
      console.log('Event created:', event.id);
      
      return new Response(JSON.stringify({ event }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Calendar integration error:', error);
    return new Response(JSON.stringify({
      error: error.message || 'Internal server error',
      details: error.stack || 'No stack trace available'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);