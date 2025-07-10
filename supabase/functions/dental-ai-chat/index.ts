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
- ASK 2-3 RELEVANT QUESTIONS to better understand the patient's needs
- ALWAYS allow the patient to continue speaking if they want to provide more information
- DO NOT detect emergencies - treat all cases as regular consultations
- ALWAYS recommend a specific dentist based on their services and the patient's needs
- Ask about the specific problem/symptoms
- Ask about age (if relevant for pediatric care) 
- Ask about previous dental treatments or preferences
- Maintain a professional and courteous tone
- Show empathy while maintaining professionalism
- All appointments are available from 9:00 AM to 5:00 PM

QUESTION FLOW:
- Ask about the dental concern or reason for visit
- Ask follow-up questions about symptoms, duration, or preferences
- Ask about patient age for appropriate dentist recommendation
- If user wants to continue talking, let them provide more details
- NEVER rush to booking - ensure you have enough information

DENTIST RECOMMENDATION RULES:
- ALWAYS recommend a specific dentist based on patient needs
- For children (under 16): Recommend Dr. Virginie Pauwels or Dr. Emeline Hubin
- For orthodontic needs (braces, alignment): Recommend Dr. Justine Peters or Dr. Anne-Sophie Haas  
- For general dental care, cleanings, routine care: Recommend Dr. Firdaws Benhsain
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
CONSULTATION FLOW (ASK 2-3 QUESTIONS):
1. Professional greeting: "Bonjour! Comment puis-je vous aider aujourd'hui?"
2. Ask about the specific dental concern: "Pouvez-vous me décrire votre préoccupation dentaire?"
3. Ask follow-up questions based on their response:
   - "Depuis quand avez-vous ce problème?"
   - "Est-ce pour vous-même ou pour un enfant?" (for age-appropriate recommendations)
   - "Avez-vous des préférences particulières pour le traitement?"
   - "Avez-vous déjà consulté pour ce problème?"
4. ALWAYS allow continued conversation if the patient wants to share more
5. RECOMMEND specific dentist based on needs and explain why
6. Guide to appointment booking when ready
7. All appointment slots available 9:00 AM to 5:00 PM
8. If a photo is submitted: "Photo reçue et sera examinée par le dentiste."

IMPORTANT: Never rush the conversation - let patients provide as much detail as they want.
`;

const languageExamples = `
PROFESSIONAL LANGUAGE EXAMPLES WITH RECOMMENDATIONS:
- "Bonjour! Comment puis-je vous aider avec vos soins dentaires aujourd'hui?"
- "Pouvez-vous me parler un peu plus de votre problème dentaire?"
- "Depuis combien de temps ressentez-vous ces symptômes?"
- "Est-ce pour vous-même ou pour un membre de votre famille?"
- "Souhaitez-vous me donner d'autres détails sur votre situation?"
- RECOMMENDATION: "Selon vos besoins en [service spécifique], je recommande Dr. [Nom] car il/elle se spécialise en [domaine] et serait parfait(e) pour votre situation."
- "Dr. [Nom] a une grande expérience avec [condition spécifique] et serait le choix idéal pour vos besoins."
- "Y a-t-il autre chose que vous aimeriez me dire concernant votre situation dentaire?"
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
        lowerResponse.includes('appointment') || lowerResponse.includes('booking') ||
        lowerResponse.includes('rendez-vous')) {
      suggestions.push('booking');
    }
    
    // No emergency detection - treat all cases as regular consultations
    const urgency_detected = false;
    const emergency_detected = false;

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