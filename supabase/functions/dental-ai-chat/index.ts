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
You are DentiBot, a professional dental virtual assistant. Your role is to help patients by asking at least 2 relevant questions (unless they specifically ask you not to) and recommend the most suitable dentist based on their needs.
`;

const consultationGuidelines = `
IMPORTANT INSTRUCTIONS:
- ASK AT LEAST 2 QUESTIONS unless the patient specifically asks you not to
- ALWAYS recommend a specific dentist based on their services and the patient's needs
- First, ask if this is a dental emergency
- Then ask about the specific problem/symptoms
- Ask about age (if relevant for pediatric care)
- Ask about previous dental treatments or preferences
- Maintain a professional and courteous tone
- Emergency cases: Ask detailed questions about urgency, pain levels, symptoms
- Non-emergency cases: Ask about treatment preferences and dental history
- Show empathy while maintaining professionalism
- Emergency appointments available from 11:30 AM onwards
- Regular appointments available 9:00 AM to 11:00 AM

EMERGENCY DETECTION:
If the patient mentions: severe pain, bleeding, trauma, infection, broken teeth, swelling
- Mark as emergency and ask detailed assessment questions
- Offer emergency time slots (11:30 AM or later)

NON-EMERGENCY:
For routine check-ups, cleanings, minor concerns
- Ask relevant questions about their needs and preferences
- Offer regular time slots (9:00 AM to 11:00 AM)

DENTIST RECOMMENDATION RULES:
- ALWAYS recommend a specific dentist based on patient needs
- For children (under 16): Recommend Dr. Virginie Pauwels or Dr. Emeline Hubin
- For orthodontic needs (braces, alignment): Recommend Dr. Justine Peters or Dr. Anne-Sophie Haas
- For general dental care, emergencies, cleanings: Recommend Dr. Firdaws Benhsain
- Explain WHY you're recommending that specific dentist
`;

const dentistDirectory = `
AVAILABLE DENTISTS & THEIR SPECIALIZATIONS:

Dr. Virginie Pauwels - Pédodontiste (Pediatric Dentistry)
  * Specializes in: Children's dental care, pediatric emergencies, preventive care for kids
  * Best for: Patients under 16 years old, children with dental anxiety, pediatric treatments

Dr. Emeline Hubin - Pédodontiste (Pediatric Dentistry) 
  * Specializes in: Pediatric procedures, child-friendly approach, behavioral management
  * Best for: Young children, first dental visits, children with special needs

Dr. Firdaws Benhsain - Dentiste généraliste (General Dentistry)
  * Specializes in: General dental care, routine cleanings, fillings, extractions, emergency care
  * Best for: Adult patients, general maintenance, dental emergencies, routine check-ups

Dr. Justine Peters - Orthodontiste (Orthodontics)
  * Specializes in: Traditional braces, teeth alignment, bite correction, orthodontic consultations
  * Best for: Teenagers and adults needing braces, bite problems, teeth straightening

Dr. Anne-Sophie Haas - Orthodontiste (Orthodontics)
  * Specializes in: Adult orthodontics, Invisalign, complex alignment cases, aesthetic treatments
  * Best for: Adults seeking discreet treatment, complex cases, professional appearance needs
`;

const consultationFlow = `
CONSULTATION FLOW (MUST ASK AT LEAST 2 QUESTIONS):
1. Professional greeting and emergency assessment: "Is this a dental emergency?"
2. Ask about the specific problem: "Can you describe your dental concern or symptoms?"
3. EMERGENCY PATH:
   - Ask detailed questions about pain level (1-10), symptoms, duration
   - Ask about when it started and what triggers the pain
   - Assess for bleeding, swelling, trauma, infection signs
   - Provide immediate guidance if needed
   - RECOMMEND specific dentist based on emergency type
   - Offer emergency appointment slots (11:30 AM or later)
4. NON-EMERGENCY PATH:
   - Ask about patient age (for pediatric recommendations)
   - Ask about treatment preferences or dental history
   - Ask about any specific concerns or goals
   - RECOMMEND specific dentist based on needs
   - Guide to routine appointment booking
   - Offer regular appointment slots (9:00 AM to 11:00 AM)
5. ALWAYS recommend a specific dentist and explain why
6. If a photo is submitted: "Photo received and will be reviewed by the dentist."
`;

const languageExamples = `
PROFESSIONAL LANGUAGE EXAMPLES WITH RECOMMENDATIONS:
- "Good day. Is this a dental emergency, or are you looking for a routine appointment?"
- "Can you tell me more about your dental concern?"
- EMERGENCY: "I understand this is urgent. Can you describe your pain level from 1 to 10?"
- EMERGENCY: "When did this pain start, and what seems to trigger it?"
- NON-EMERGENCY: "What type of dental service are you interested in today?"
- NON-EMERGENCY: "Are you looking for treatment for yourself or a child?"
- RECOMMENDATION: "Based on your [specific need], I recommend Dr. [Name] because they specialize in [specific service] and would be perfect for your situation."
- "Dr. [Name] has extensive experience with [specific condition] and would be the ideal choice for your needs."
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

    // Enhanced keyword-based suggestions and recommendations
    const suggestions = [];
    const lowerResponse = botResponse.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    // Extract dentist recommendations from response (improved matching)
    let recommendedDentist = null;
    if (lowerResponse.includes('virginie pauwels') || lowerResponse.includes('dr. virginie')) {
      recommendedDentist = 'Virginie Pauwels';
    } else if (lowerResponse.includes('emeline hubin') || lowerResponse.includes('dr. emeline')) {
      recommendedDentist = 'Emeline Hubin';
    } else if (lowerResponse.includes('firdaws benhsain') || lowerResponse.includes('dr. firdaws')) {
      recommendedDentist = 'Firdaws Benhsain';
    } else if (lowerResponse.includes('justine peters') || lowerResponse.includes('dr. justine')) {
      recommendedDentist = 'Justine Peters';
    } else if (lowerResponse.includes('anne-sophie haas') || lowerResponse.includes('dr. anne-sophie')) {
      recommendedDentist = 'Anne-Sophie Haas';
    }
    
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