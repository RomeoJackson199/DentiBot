import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, user_profile } = await req.json();

    console.log('Received request:', { message, user_profile });

    const assistantPersona = `
You are DentiBot, a professional dental virtual assistant.
`;

const consultationGuidelines = `
IMPORTANT INSTRUCTIONS:
- ALWAYS ask first if this is a dental emergency
- Maintain a professional and courteous tone
- Emergency cases: Ask detailed questions about urgency, pain levels, symptoms
- Non-emergency cases: Ask fewer, basic questions and guide to appointment booking
- Show empathy while maintaining professionalism
- Emergency appointments available from 11:30 AM onwards
- Regular appointments available 9:00 AM to 11:00 AM

EMERGENCY DETECTION:
If the patient mentions: severe pain, bleeding, trauma, infection, broken teeth, swelling
- Mark as emergency and ask detailed assessment questions
- Offer emergency time slots (11:30 AM or later)

NON-EMERGENCY:
For routine check-ups, cleanings, minor concerns
- Ask minimal questions and guide to regular appointment booking
- Offer regular time slots (9:00 AM to 11:00 AM)
`;

const dentistDirectory = `
AVAILABLE DENTISTS & RECOMMENDATIONS:
Dr. Virginie Pauwels - Pédodontiste (Pediatric Dentistry)
  * Best for: Children's dental care, pediatric emergencies, preventive care for kids
Dr. Emeline Hubin - Pédodontiste (Pediatric Dentistry) 
  * Best for: Pediatric procedures, child-friendly approach, behavioral management
Dr. Firdaws Benhsain - Dentiste généraliste (General Dentistry)
  * Best for: General dental care, routine cleanings, fillings, extractions, emergencies
Dr. Justine Peters - Orthodontiste (Orthodontics)
  * Best for: Braces, teeth alignment, bite correction, orthodontic consultations
Dr. Anne-Sophie Haas - Orthodontiste (Orthodontics)
  * Best for: Adult orthodontics, Invisalign, complex alignment cases
`;

const consultationFlow = `
CONSULTATION FLOW:
1. Professional greeting and emergency assessment: "Is this a dental emergency?"
2. EMERGENCY PATH:
   - Ask detailed questions about pain level (1-10), symptoms, duration
   - Assess for bleeding, swelling, trauma, infection signs
   - Provide immediate guidance if needed
   - Offer emergency appointment slots (11:30 AM or later)
3. NON-EMERGENCY PATH:
   - Ask basic questions about the reason for visit
   - Guide to routine appointment booking
   - Offer regular appointment slots (9:00 AM to 11:00 AM)
4. If a photo is submitted: "Photo received and will be reviewed by the dentist."
`;

const languageExamples = `
PROFESSIONAL LANGUAGE EXAMPLES:
- "Good day. Is this a dental emergency, or are you looking for a routine appointment?"
- EMERGENCY: "I understand this is urgent. Can you describe your pain level from 1 to 10?"
- EMERGENCY: "Are you experiencing any bleeding, swelling, or difficulty eating?"
- NON-EMERGENCY: "Thank you. What type of dental service are you interested in today?"
- NON-EMERGENCY: "I can help you book a routine appointment. When would you prefer?"
- "Based on your symptoms, I would recommend Dr. [Name] who specializes in this area."
`;

const userInfo = `Patient Information: ${JSON.stringify(user_profile)}`;
const convoHistory = `Conversation History:\n${conversation_history.map((msg: any) => (msg.is_bot ? 'Assistant' : 'Patient') + ': ' + msg.message).join('\n')}`;

const systemPrompt = [
  assistantPersona,
  consultationGuidelines,
  dentistDirectory,
  consultationFlow,
  languageExamples,
  userInfo,
  convoHistory
].join('\n');

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversation_history.map((msg: any) => ({
        role: msg.is_bot ? 'assistant' : 'user',
        content: msg.message
      })),
      { role: 'user', content: message }
    ];

    console.log('Sending to OpenAI:', { messageCount: messages.length });

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('OpenAI API error: ' + response.status);
    }

    const data = await response.json();
    console.log('OpenAI response received');

    const botResponse = data.choices[0].message.content;

    // Simple keyword-based suggestions and recommendations
    const suggestions = [];
    const lowerResponse = botResponse.toLowerCase();
    
    // Extract dentist recommendations from response
    let recommendedDentist = null;
    if (lowerResponse.includes('virginie pauwels')) recommendedDentist = 'Virginie Pauwels';
    else if (lowerResponse.includes('emeline hubin')) recommendedDentist = 'Emeline Hubin';
    else if (lowerResponse.includes('firdaws benhsain')) recommendedDentist = 'Firdaws Benhsain';
    else if (lowerResponse.includes('justine peters')) recommendedDentist = 'Justine Peters';
    else if (lowerResponse.includes('anne-sophie haas')) recommendedDentist = 'Anne-Sophie Haas';
    
    // Suggest booking after recommendation
    if (recommendedDentist || lowerResponse.includes('dentist') || 
        lowerResponse.includes('appointment') || lowerResponse.includes('booking')) {
      suggestions.push('booking');
    }
    
    // Enhanced emergency detection - check both user input and AI response
    const emergencyKeywords = [
      'emergency', 'urgent', 'severe pain', 'intense pain', 'excruciating', 'unbearable',
      'bleeding', 'blood', 'trauma', 'knocked out', 'swollen face', 'swelling',
      'broken tooth', 'cracked tooth', 'abscess', 'infection', 'pus',
      'accident', 'injury', 'immediate', 'can\'t eat', 'can\'t sleep', 'throbbing'
    ];
    
    const userInput = message?.toLowerCase() || '';
    const botResponseLower = botResponse.toLowerCase();
    
    // Check both user input and bot response for emergency indicators
    const emergency_detected = emergencyKeywords.some(keyword => 
      userInput.includes(keyword.toLowerCase()) || botResponseLower.includes(keyword.toLowerCase())
    );
    
    const urgencyKeywords = ['quickly', 'fast', 'now', 'today', 'asap'];
    const urgency_detected = urgencyKeywords.some(keyword => 
      userInput.includes(keyword.toLowerCase()) || botResponseLower.includes(keyword.toLowerCase())
    ) || emergency_detected;

    return new Response(JSON.stringify({ 
      response: botResponse,
      suggestions,
      urgency_detected,
      emergency_detected,
      recommended_dentist: recommendedDentist
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in dental-ai-chat function:', error);
    return new Response(JSON.stringify({ 
      error: 'An error occurred. Please try again.',
      fallback_response: "I'm sorry, I'm experiencing a technical issue. For a dental emergency, please contact the office directly or emergency services."
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});