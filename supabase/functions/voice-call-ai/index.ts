import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Tool definitions for OpenAI function calling
const tools = [
  {
    type: "function",
    function: {
      name: "check_appointment_availability",
      description: "Check available appointment slots. Use this when patient asks about availability or wants to see open times.",
      parameters: {
        type: "object",
        properties: {
          start_date: {
            type: "string",
            description: "Start date in YYYY-MM-DD format"
          },
          end_date: {
            type: "string",
            description: "End date in YYYY-MM-DD format"
          },
          time_preference: {
            type: "string",
            enum: ["morning", "afternoon", "evening", "any"],
            description: "Preferred time of day"
          },
          dentist_id: {
            type: "string",
            description: "Optional: specific dentist ID if patient has a preference"
          }
        },
        required: ["start_date", "end_date"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "book_appointment",
      description: "Book an appointment for a patient. Tell the patient you're booking their appointment.",
      parameters: {
        type: "object",
        properties: {
          patient_phone: {
            type: "string",
            description: "Patient's phone number"
          },
          patient_name: {
            type: "string",
            description: "Patient's full name"
          },
          dentist_id: {
            type: "string",
            description: "Dentist ID for the appointment"
          },
          appointment_date: {
            type: "string",
            description: "Appointment date in YYYY-MM-DD format"
          },
          appointment_time: {
            type: "string",
            description: "Appointment time in HH:MM format (24-hour)"
          },
          reason: {
            type: "string",
            description: "Reason for the appointment"
          }
        },
        required: ["patient_phone", "patient_name", "dentist_id", "appointment_date", "appointment_time", "reason"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_patient_info",
      description: "Look up patient information and upcoming appointments. Use when patient asks about their appointments or profile.",
      parameters: {
        type: "object",
        properties: {
          phone: {
            type: "string",
            description: "Patient's phone number"
          },
          name: {
            type: "string",
            description: "Patient's name if phone not available"
          }
        }
      }
    }
  },
  {
    type: "function",
    function: {
      name: "cancel_appointment",
      description: "Cancel an existing appointment. Confirm with patient before canceling.",
      parameters: {
        type: "object",
        properties: {
          appointment_id: {
            type: "string",
            description: "ID of the appointment to cancel"
          }
        },
        required: ["appointment_id"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_clinic_info",
      description: "Get information about the clinic (hours, location, services).",
      parameters: {
        type: "object",
        properties: {
          info_type: {
            type: "string",
            enum: ["hours", "location", "services", "general"],
            description: "Type of information requested"
          }
        },
        required: ["info_type"]
      }
    }
  }
];

const systemPrompt = `You are a helpful dental receptionist AI assistant. You're speaking to patients over the phone.

Your responsibilities:
- Greet callers warmly and professionally
- Help book, reschedule, or cancel appointments
- Answer questions about the clinic (hours, location, services)
- Look up patient information when needed
- Provide appointment information

Guidelines:
- Be concise and clear (this is a phone conversation)
- Confirm important information by repeating it back
- Use natural, conversational language
- When using a tool, tell the patient what you're doing (e.g., "Let me check our availability...")
- Always confirm appointments with date, time, and dentist name
- For emergencies, advise to call emergency line or visit ER

Current date: ${new Date().toISOString().split('T')[0]}

Use the available tools to help patients with their requests.`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    
    // Check if this is a direct appointment creation call (from voice AI tool)
    if (body.name && body.appointment_date) {
      console.log('Direct appointment creation:', body);
      
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      );
      
      // Book appointment directly
      const result = await bookAppointment(supabase, {
        patient_name: body.name,
        patient_phone: body.phone,
        dentist_id: body.dentist_id || null, // Optional, will use first available
        appointment_date: body.appointment_date.split(' ')[0], // Extract date
        appointment_time: body.appointment_date.split(' ')[1] || '09:00', // Extract time or default
        reason: body.symptoms || 'General consultation'
      }, body.phone, body.business_id);
      
      if (result.error) {
        return new Response(
          JSON.stringify({ error: result.error }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ 
          success: true,
          message: result.confirmation,
          appointment_id: result.appointment_id
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // Original OpenAI conversation flow
    const { message, conversation_history = [], caller_phone, business_id } = body;
    
    console.log('Voice call AI request:', { message, caller_phone, business_id });

    if (!message) {
      throw new Error('No message provided');
    }

    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build conversation messages
    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history,
      { role: 'user', content: message }
    ];

    // Call OpenAI with tools
    console.log('Calling OpenAI with tools...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        tools: tools,
        tool_choice: 'auto',
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const aiResponse = await response.json();
    console.log('OpenAI response:', JSON.stringify(aiResponse, null, 2));

    const assistantMessage = aiResponse.choices[0].message;
    const toolCalls = assistantMessage.tool_calls;

    // If AI wants to use tools, execute them
    if (toolCalls && toolCalls.length > 0) {
      console.log('Executing tools:', toolCalls.map((tc: any) => tc.function.name));

      const toolResults = await Promise.all(
        toolCalls.map(async (toolCall: any) => {
          const result = await executeTool(toolCall, caller_phone, business_id);
          return {
            tool_call_id: toolCall.id,
            role: 'tool',
            name: toolCall.function.name,
            content: JSON.stringify(result)
          };
        })
      );

      // Call OpenAI again with tool results
      const finalMessages = [
        ...messages,
        assistantMessage,
        ...toolResults
      ];

      console.log('Calling OpenAI with tool results...');
      const finalResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: finalMessages,
          temperature: 0.7,
        }),
      });

      if (!finalResponse.ok) {
        const errorText = await finalResponse.text();
        console.error('OpenAI API error (final):', errorText);
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      const finalAiResponse = await finalResponse.json();
      const finalMessage = finalAiResponse.choices[0].message.content;

      return new Response(
        JSON.stringify({
          response: finalMessage,
          tool_calls_executed: toolCalls.map((tc: any) => tc.function.name)
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // No tools needed, return response directly
    return new Response(
      JSON.stringify({
        response: assistantMessage.content
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-call-ai function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

// Execute tool based on name
async function executeTool(toolCall: any, callerPhone: string, businessId?: string) {
  const functionName = toolCall.function.name;
  const args = JSON.parse(toolCall.function.arguments);
  
  console.log(`Executing tool: ${functionName}`, args);

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  try {
    switch (functionName) {
      case 'check_appointment_availability':
        return await checkAvailability(supabase, args, businessId);
        
      case 'book_appointment':
        return await bookAppointment(supabase, args, callerPhone, businessId);
        
      case 'get_patient_info':
        return await getPatientInfo(supabase, args, callerPhone, businessId);
        
      case 'cancel_appointment':
        return await cancelAppointment(supabase, args, businessId);
        
      case 'get_clinic_info':
        return await getClinicInfo(supabase, args, businessId);
        
      default:
        return { error: 'Unknown tool' };
    }
  } catch (error) {
    console.error(`Error executing ${functionName}:`, error);
    return { error: error.message };
  }
}

async function checkAvailability(supabase: any, args: any, businessId?: string) {
  const { start_date, end_date, time_preference = 'any', dentist_id } = args;
  
  let query = supabase
    .from('appointment_slots')
    .select('*, dentists!inner(id, first_name, last_name)')
    .eq('is_available', true)
    .gte('slot_date', start_date)
    .lte('slot_date', end_date)
    .order('slot_date', { ascending: true })
    .order('slot_time', { ascending: true });
  
  if (businessId) {
    query = query.eq('business_id', businessId);
  }
  
  if (dentist_id) {
    query = query.eq('dentist_id', dentist_id);
  }
  
  if (time_preference && time_preference !== 'any') {
    const timeRanges: Record<string, { start: string; end: string }> = {
      morning: { start: '08:00', end: '12:00' },
      afternoon: { start: '12:00', end: '17:00' },
      evening: { start: '17:00', end: '20:00' }
    };
    const range = timeRanges[time_preference];
    if (range) {
      query = query.gte('slot_time', range.start).lt('slot_time', range.end);
    }
  }
  
  const { data, error } = await query.limit(10);
  
  if (error) {
    console.error('Error checking availability:', error);
    return { error: error.message };
  }
  
  return {
    available_slots: data.map((slot: any) => ({
      slot_id: slot.id,
      dentist_id: slot.dentist_id,
      date: slot.slot_date,
      time: slot.slot_time,
      dentist: `Dr. ${slot.dentists.last_name}`
    })),
    count: data.length
  };
}

async function bookAppointment(supabase: any, args: any, callerPhone: string, businessId?: string) {
  const { patient_phone, patient_name, dentist_id, appointment_date, appointment_time, reason } = args;
  
  const phone = patient_phone || callerPhone;
  
  // 1. Find or create patient
  let { data: patient, error: patientError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name')
    .eq('phone', phone)
    .maybeSingle();
  
  if (!patient) {
    // Create new patient
    const nameParts = patient_name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || nameParts[0];
    
    const { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        first_name: firstName,
        last_name: lastName,
        phone: phone,
        email: `${phone.replace(/[^0-9]/g, '')}@temp.com`
      })
      .select()
      .single();
    
    if (createError) {
      console.error('Error creating patient:', createError);
      return { error: 'Failed to create patient profile' };
    }
    
    patient = newProfile;
  }
  
  // 2. Find and book the slot
  const { data: slot, error: slotError } = await supabase
    .from('appointment_slots')
    .select('id')
    .eq('dentist_id', dentist_id)
    .eq('slot_date', appointment_date)
    .eq('slot_time', appointment_time)
    .eq('is_available', true)
    .maybeSingle();
  
  if (!slot) {
    return { error: 'Slot no longer available' };
  }
  
  // 3. Create appointment
  const appointmentDateTime = `${appointment_date}T${appointment_time}:00`;
  
  const appointmentData: any = {
    patient_id: patient.id,
    dentist_id: dentist_id,
    appointment_date: appointmentDateTime,
    reason: reason,
    status: 'confirmed',
    patient_name: `${patient.first_name} ${patient.last_name}`
  };
  
  if (businessId) {
    appointmentData.business_id = businessId;
  }
  
  const { data: appointment, error: appointmentError } = await supabase
    .from('appointments')
    .insert(appointmentData)
    .select()
    .single();
  
  if (appointmentError) {
    console.error('Error creating appointment:', appointmentError);
    return { error: appointmentError.message };
  }
  
  // 4. Mark slot as unavailable
  await supabase
    .from('appointment_slots')
    .update({ 
      is_available: false,
      appointment_id: appointment.id 
    })
    .eq('id', slot.id);
  
  return {
    success: true,
    appointment_id: appointment.id,
    patient_name: `${patient.first_name} ${patient.last_name}`,
    confirmation: `Appointment booked for ${appointment_date} at ${appointment_time}`
  };
}

async function getPatientInfo(supabase: any, args: any, callerPhone: string, businessId?: string) {
  const { phone, name } = args;
  
  const searchPhone = phone || callerPhone;
  
  let query = supabase.from('profiles').select('id, first_name, last_name, phone, email, date_of_birth');
  
  if (searchPhone) {
    query = query.eq('phone', searchPhone);
  } else if (name) {
    const nameParts = name.toLowerCase().split(' ');
    if (nameParts.length > 0) {
      query = query.ilike('first_name', `%${nameParts[0]}%`);
    }
  } else {
    return { found: false, message: 'Please provide phone number or name' };
  }
  
  const { data: patients, error } = await query.limit(1);
  
  if (error || !patients || patients.length === 0) {
    return { found: false, message: 'No patient found with that information' };
  }
  
  const patient = patients[0];
  
  // Get upcoming appointments
  let appointmentQuery = supabase
    .from('appointments')
    .select('id, appointment_date, reason, status, dentists!inner(first_name, last_name)')
    .eq('patient_id', patient.id)
    .gte('appointment_date', new Date().toISOString())
    .order('appointment_date', { ascending: true })
    .limit(5);
  
  if (businessId) {
    appointmentQuery = appointmentQuery.eq('business_id', businessId);
  }
  
  const { data: appointments } = await appointmentQuery;
  
  return {
    found: true,
    patient: {
      name: `${patient.first_name} ${patient.last_name}`,
      phone: patient.phone,
      email: patient.email
    },
    upcoming_appointments: appointments?.map((apt: any) => ({
      id: apt.id,
      date: apt.appointment_date,
      dentist: `Dr. ${apt.dentists.last_name}`,
      reason: apt.reason,
      status: apt.status
    })) || []
  };
}

async function cancelAppointment(supabase: any, args: any, businessId?: string) {
  const { appointment_id } = args;
  
  // Get appointment details
  const { data: appointment, error: fetchError } = await supabase
    .from('appointments')
    .select('id, appointment_date, dentist_id')
    .eq('id', appointment_id)
    .single();
  
  if (fetchError || !appointment) {
    return { error: 'Appointment not found' };
  }
  
  // Update appointment status
  const { error: updateError } = await supabase
    .from('appointments')
    .update({ status: 'cancelled' })
    .eq('id', appointment_id);
  
  if (updateError) {
    console.error('Error canceling appointment:', updateError);
    return { error: 'Failed to cancel appointment' };
  }
  
  // Release the slot
  const appointmentDate = new Date(appointment.appointment_date);
  const slotDate = appointmentDate.toISOString().split('T')[0];
  const slotTime = appointmentDate.toTimeString().substring(0, 5);
  
  await supabase
    .from('appointment_slots')
    .update({ 
      is_available: true,
      appointment_id: null 
    })
    .eq('dentist_id', appointment.dentist_id)
    .eq('slot_date', slotDate)
    .eq('slot_time', slotTime);
  
  return {
    success: true,
    message: 'Appointment cancelled successfully'
  };
}

async function getClinicInfo(supabase: any, args: any, businessId?: string) {
  const { info_type } = args;
  
  let query = supabase
    .from('businesses')
    .select('name, business_hours, tagline, bio, specialty_type');
  
  if (businessId) {
    query = query.eq('id', businessId);
  }
  
  const { data: business } = await query.limit(1).single();
  
  switch (info_type) {
    case 'hours':
      return {
        hours: business?.business_hours || {
          monday: '8:00 AM - 6:00 PM',
          tuesday: '8:00 AM - 6:00 PM',
          wednesday: '8:00 AM - 6:00 PM',
          thursday: '8:00 AM - 6:00 PM',
          friday: '8:00 AM - 6:00 PM',
          saturday: '9:00 AM - 2:00 PM',
          sunday: 'Closed'
        }
      };
      
    case 'location':
      return {
        clinic_name: business?.name,
        info: 'Please visit our website or call for directions and parking information.'
      };
      
    case 'services':
      const { data: services } = await supabase
        .from('business_services')
        .select('name, description, price_cents, duration_minutes')
        .eq('is_active', true)
        .limit(10);
      
      return { 
        services: services?.map((s: any) => ({
          name: s.name,
          description: s.description,
          price: `$${(s.price_cents / 100).toFixed(2)}`,
          duration: `${s.duration_minutes} minutes`
        })) || [] 
      };
      
    case 'general':
    default:
      return {
        clinic_name: business?.name,
        tagline: business?.tagline,
        specialty: business?.specialty_type,
        description: business?.bio
      };
  }
}
