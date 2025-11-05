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
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const { dentistId, patientId, date, availableSlots } = await req.json();

    console.log('AI slot recommendation request:', { dentistId, patientId, date, slotsCount: availableSlots?.length });

    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get slot usage statistics
    const { data: slotStats } = await supabaseClient
      .from('slot_usage_statistics')
      .select('*')
      .eq('dentist_id', dentistId)
      .order('recent_booking_rate', { ascending: true });

    // Get patient preferences
    const { data: patientPrefs } = await supabaseClient
      .from('patient_preferences')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();

    // Prepare context for AI
    const dayOfWeek = new Date(date).getDay();
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

    const underutilizedSlots = (slotStats || [])
      .filter((s: any) => s.recent_booking_rate < 50 && s.day_of_week === dayOfWeek)
      .slice(0, 5)
      .map((s: any) => `${s.time_slot} (${s.recent_booking_rate.toFixed(1)}% booked)`)
      .join(', ');

    const preferredTimes = patientPrefs?.preferred_time_of_day?.join(', ') || 'no preference';

    const availableTimesStr = availableSlots.map((s: any) => s.time).join(', ');

    // Build prompt for AI
    const prompt = `You are an AI scheduling assistant for a dental practice. Your goal is to help BALANCE the dentist's schedule by promoting time slots that are booked LESS frequently.

**Current Situation:**
- Day: ${dayName}
- Available Times: ${availableTimesStr}
- Under-utilized Slots (need promotion): ${underutilizedSlots || 'None identified yet'}
- Patient Usually Prefers: ${preferredTimes}

**Your Task:**
Analyze the available time slots and recommend which ones to promote to the patient. Focus on:
1. **Under-utilized slots** (booking rate < 50%) should be PRIORITIZED
2. **Balance** - help distribute appointments evenly throughout the day
3. **Patient preferences** - consider what times the patient usually prefers, but gently guide them toward under-utilized slots if possible

**Output Format (JSON only):**
{
  "recommendations": [
    {
      "time": "10:00",
      "score": 85,
      "reasons": ["Under-utilized slot", "Helps balance schedule"],
      "aiReasoning": "This 10 AM slot is rarely booked and would help balance your schedule.",
      "shouldPromote": true
    }
  ],
  "summary": "Your dentist's schedule shows that morning slots are under-utilized."
}

Provide 3-5 top recommendations. Give HIGHER scores (80-95) to under-utilized slots.`;

    console.log('Calling Lovable AI with prompt length:', prompt.length);

    // Call Lovable AI
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a scheduling AI assistant. Always respond with valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: 'Payment required' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI API error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const aiText = aiData.choices?.[0]?.message?.content || '';

    console.log('AI response:', aiText.substring(0, 200));

    // Parse JSON from response
    const jsonMatch = aiText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response as JSON');
    }

    const aiAnalysis = JSON.parse(jsonMatch[0]);

    // Enrich recommendations with slot data
    const enrichedRecommendations = aiAnalysis.recommendations.map((rec: any) => {
      const slot = availableSlots.find((s: any) => s.time === rec.time);
      const stats = (slotStats || []).find((s: any) =>
        s.time_slot === rec.time && s.day_of_week === dayOfWeek
      );

      return {
        ...rec,
        isUnderutilized: stats ? stats.recent_booking_rate < 50 : false,
        bookingRate: stats ? stats.recent_booking_rate : 0,
        available: slot?.available || false
      };
    });

    // Log recommendation for analytics
    await supabaseClient
      .from('ai_slot_recommendations')
      .insert({
        patient_id: patientId,
        dentist_id: dentistId,
        recommended_slots: enrichedRecommendations,
        ai_model_used: 'google/gemini-2.5-flash',
        ai_reasoning: aiAnalysis.summary,
        selected_date: date
      });

    console.log('Successfully generated AI recommendations:', enrichedRecommendations.length);

    return new Response(
      JSON.stringify({
        recommendations: enrichedRecommendations,
        summary: aiAnalysis.summary
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in AI recommendations:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
