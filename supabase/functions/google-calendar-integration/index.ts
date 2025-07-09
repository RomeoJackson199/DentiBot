import { GoogleAuth } from "npm:google-auth-library";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CALENDAR_ID = 'c_50174c89acc6fea0584af32c11327187da9807dd25a8f82c6397d67da5df566c@group.calendar.google.com';
const SERVICE_ACCOUNT_PATH = './gpt2sheets-433311-6d41e95ac83d.json'; // Adjust if different!

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

// Read and parse service account JSON ONCE at cold start
const serviceAccountJson = JSON.parse(await Deno.readTextFile(SERVICE_ACCOUNT_PATH));

async function getGoogleAccessToken(): Promise<string> {
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
  const res = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${CALENDAR_ID}/events`, {
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

async function getCalendarAvailability(accessToken: string, date?: string): Promise<any[]> {
  // Returns "busy" slots for the selected day; you can transform this to "available" slots if you want.
  const timeMin = date ? `${date}T00:00:00+02:00` : new Date().toISOString();
  const timeMax = date ? `${date}T23:59:59+02:00` : new Date(Date.now() + 24*60*60*1000).toISOString();

  const res = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      timeZone: "Europe/Brussels",
      items: [{ id: CALENDAR_ID }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`FreeBusy API error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const busySlots = data.calendars[CALENDAR_ID].busy;
  return busySlots;
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
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, date, eventDetails } = requestData;

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
