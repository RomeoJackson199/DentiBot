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

const CALENDAR_ID = 'c_50174c89acc6fea0584af32c11327187da9807dd25a8f82c6397d67da5df566c@group.calendar.google.com';

async function getGoogleAccessToken(): Promise<string> {
  // For demo purposes, we'll simulate the calendar integration
  // In production, you'd need a proper service account or OAuth flow
  console.log('Google Calendar integration running in demo mode');
  return 'demo_access_token';
}

async function getCalendarAvailability(accessToken: string, date?: string): Promise<string[]> {
  console.log('Fetching availability for date:', date);
  
  // For demo purposes, return available slots
  // In production, this would query the actual Google Calendar
  const availableSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
  ];
  
  console.log('Returning available slots:', availableSlots);
  return availableSlots;
}

async function createCalendarEvent(accessToken: string, eventDetails: any): Promise<any> {
  console.log('Creating calendar event:', {
    summary: eventDetails.summary,
    start: eventDetails.startTime,
    attendee: eventDetails.attendeeEmail
  });

  // For demo purposes, simulate successful calendar event creation
  // In production, this would create an actual Google Calendar event
  const mockEvent = {
    id: 'demo_event_' + Date.now(),
    summary: eventDetails.summary,
    start: { dateTime: eventDetails.startTime },
    end: { dateTime: eventDetails.endTime },
    attendees: [{ email: eventDetails.attendeeEmail }],
    htmlLink: 'https://calendar.google.com/calendar/event?eid=demo',
    status: 'confirmed'
  };

  console.log('Calendar event created (demo):', mockEvent.id);
  return mockEvent;
}

serve(handler);