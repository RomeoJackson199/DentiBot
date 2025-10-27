import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Add type definitions at the top of the file
interface MedicalRecord {
  visit_date: string;
  record_type: string;
  title: string;
  description?: string;
  findings?: string;
  recommendations?: string;
}

interface ClinicalNote {
  created_at: string;
  content: string;
}

interface TreatmentPlan {
  title: string;
  status: string;
  priority: string;
}

interface PatientContext {
  medical_history?: MedicalRecord[];
  notes?: ClinicalNote[];
  treatment_plans?: TreatmentPlan[];
}

// CORS configuration - permissive for all environments
const getCorsHeaders = () => {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };
};

const corsHeaders = getCorsHeaders();

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversation_history, user_profile, patient_context, mode } = await req.json();

    // Log request in development only
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('Received request:', { message, user_profile, mode });
    }
    
    // Enhanced input validation
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }
    
    // Sanitize input to prevent injection attacks
    const sanitizedMessage = message
      .trim()
      .replace(/[<>]/g, '') // Basic XSS protection
      .substring(0, 2000); // Limit message length
    
    if (sanitizedMessage.length === 0) {
      throw new Error('Message cannot be empty');
    }

    // Helper functions to determine when to show widgets
    const buildConversationContext = (msg: string, history: any[] = []): string => {
      const historyText = (history || []).map((m) => (m.message || m.content || '')).join(' ');
      return `${historyText} ${msg}`.toLowerCase();
    };

    const hasPatientInfo = (context: string): boolean => {
      // English
      if (/\b(for me|myself|for my (child|daughter|son|wife|husband|partner|mom|mother|dad|father))\b/i.test(context)) return true;
      if (/\b(my (child|daughter|son|wife|husband|partner))\b/i.test(context)) return true;
      // French
      if (/(pour moi|ma fille|mon fils|ma femme|mon mari|mon enfant|ma mère|mon père)/i.test(context)) return true;
      // Dutch
      if (/(voor mij|mijn dochter|mijn zoon|mijn vrouw|mijn man|mijn kind|mijn moeder|mijn vader)/i.test(context)) return true;
      return false;
    };

    const hasSymptomInfo = (context: string): boolean => {
      const patterns = [
        // English
        /tooth( |-)?(ache|pain|hurts|sensitive|sensitivity)/i,
        /gum(s)? (pain|bleeding|swelling|swollen)/i,
        /cavity|decay|broken tooth|chipped tooth|lost filling|wisdom tooth/i,
        /orthodontic|braces|align(ment)?|invisalign/i,
        /cleaning|check[- ]?up|whitening|cosmetic/i,
        // French
        /mal aux dents|douleur dentaire|dents sensibles|sensibilit\u00e9/i,
        /gencives? (douleur|saignent|gonfl(\u00e9|ee)s?)/i,
        /carie|dent cass\u00e9e|plombage perdu|dent de sagesse/i,
        /orthodontie|appareils?|alignement|invisalign/i,
        /nettoyage|contr\u00f4le|blanchiment|esth\u00e9tique/i,
        // Dutch
        /kiespijn|tandpijn|gevoelige tanden|gevoeligheid/i,
        /tanden?vlees (pijn|bloeden|gezwollen)/i,
        /gaatje|tandbederf|gebroken tand|afgebroken tand|vulling kwijt|verstandskies/i,
        /orthodontie|beugel|uitlijning|invisalign/i,
        /reiniging|controle|bleken|cosmetisch/i,
      ];
      return patterns.some((p) => p.test(context));
    };

    // Check if Lovable API key is available
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not found');
      return new Response(JSON.stringify({ 
        response: "AI service is currently unavailable. Please try again later.",
        suggestions: [],
        urgency_detected: false,
        emergency_detected: false,
        recommended_dentist: [],
        consultation_reason: "General consultation"
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let systemPrompt = '';
    let responseFormat = {};

    if (mode === 'dentist_consultation') {
      systemPrompt = `You are an advanced dental AI assistant helping a dentist with patient care. You have access to comprehensive patient information and clinical context.

PATIENT INFORMATION:
${patient_context?.patient ? `
Patient Name: ${patient_context.patient.first_name} ${patient_context.patient.last_name}
Email: ${patient_context.patient.email || 'Not provided'}
Phone: ${patient_context.patient.phone || 'Not provided'}
Date of Birth: ${patient_context.patient.date_of_birth || 'Not provided'}
Medical History: ${patient_context.patient.medical_history || 'No medical history recorded'}
` : 'No patient profile information available'}

CLINICAL HISTORY:
${patient_context?.medical_history?.length > 0 ? `
Previous Medical Records:
${patient_context.medical_history.map((record: MedicalRecord) => `
- Date: ${record.visit_date}
- Type: ${record.record_type}
- Title: ${record.title}
- Description: ${record.description || 'No description'}
- Findings: ${record.findings || 'No findings recorded'}
- Recommendations: ${record.recommendations || 'No recommendations'}
`).join('\n')}` : 'No previous medical records found'}

${patient_context?.notes?.length > 0 ? `
Clinical Notes:
${patient_context.notes.map((note: ClinicalNote) => `
- Date: ${note.created_at}
- Note: ${note.content}
`).join('\n')}` : 'No clinical notes found'}

${patient_context?.treatment_plans?.length > 0 ? `
Treatment Plans:
${patient_context.treatment_plans.map((plan: TreatmentPlan) => `
- Title: ${plan.title}
- Status: ${plan.status}
- Priority: ${plan.priority}
- Description: ${plan.description || 'No description'}
- Diagnosis: ${plan.diagnosis || 'No diagnosis recorded'}
- Estimated Duration: ${plan.estimated_duration_weeks || 'Not specified'} weeks
- Estimated Cost: €${plan.estimated_cost || 'Not specified'}
- Start Date: ${plan.start_date || 'Not scheduled'}
- Treatment Steps: ${plan.treatment_steps ? JSON.stringify(plan.treatment_steps) : 'No steps defined'}
`).join('\n')}` : 'No treatment plans found'}

Your role is to:
1. Analyze patient information and provide clinical insights
2. Suggest appropriate clinical notes, prescriptions, or treatment plans
3. Help the dentist make informed decisions
4. Provide professional medical language and recommendations

When suggesting actions, format your response to include actionable suggestions in this JSON structure:
{
  "response": "Your conversational response",
  "suggestions": [
    {
      "id": "unique_id",
      "type": "note|prescription|treatment_plan",
      "data": {
        // Relevant data based on type
      }
    }
  ]
}

For notes: data should include "content"
For prescriptions: data should include "medication_name", "dosage", "frequency", "duration_days", "instructions"
For treatment_plans: data should include "title", "description", "diagnosis", "treatment_steps", "estimated_duration_weeks", "estimated_cost", "priority"

Always maintain professional medical standards and suggest only appropriate treatments.`;

      responseFormat = {
        response_format: { type: "json_object" }
      };
    } else {
      // Build patient context string if available
      let patientContextString = '';
      if (patient_context) {
        patientContextString = `\n\nPATIENT INFORMATION:
${patient_context.next_appointment ? `Next Appointment: ${new Date(patient_context.next_appointment.date).toLocaleString()} with ${patient_context.next_appointment.dentist_name}
Reason: ${patient_context.next_appointment.reason}` : 'No upcoming appointments'}

${patient_context.balance ? `Outstanding Balance: €${patient_context.balance.outstanding}
Total Billed: €${patient_context.balance.total_billed}
Total Paid: €${patient_context.balance.total_paid}` : ''}

${patient_context.active_prescriptions && patient_context.active_prescriptions.length > 0 ? `Active Medications:
${patient_context.active_prescriptions.map((p: any) => `- ${p.medication}: ${p.dosage}, ${p.instructions}`).join('\n')}` : 'No active prescriptions'}

${patient_context.recent_payments && patient_context.recent_payments.length > 0 ? `Recent Payments:
${patient_context.recent_payments.slice(0, 3).map((p: any) => `- €${p.amount} on ${new Date(p.date).toLocaleDateString()} (${p.method})`).join('\n')}` : ''}
`;
      }

      const unifiedPersona = `You are DentiBot, a friendly and professional dental assistant. You are multilingual and can communicate fluently in English, French, and Dutch.

VERY IMPORTANT: You must auto-detect the user's language from their message and respond ONLY in that language.`;

      const unifiedGuidelines = `
---
GENERAL GUIDELINES (ALL LANGUAGES):
- Your persona varies by language, so adapt your tone accordingly.
- You know the patient: ${user_profile?.first_name} ${user_profile?.last_name}.
- Keep conversations natural and flowing.
- For new appointments, always gather enough information before recommending a dentist.
  1. First, ask who the appointment is for (the patient, their child, partner, etc.).
  2. Then, ask for specific symptoms or needs.
  3. WAIT for their response before making recommendations.
  4. Ask ONLY ONE question at a time.
- NEVER mention specific dentist names—let the system handle recommendations.
- NEVER talk about time or availability—focus on symptoms.

---
ENGLISH-SPECIFIC GUIDELINES:
- Persona: Friendly, warm, and natural.
- Keep responses SHORT and CONVERSATIONAL (2-3 sentences max).

---
FRENCH-SPECIFIC GUIDELINES:
- Persona: Professional and helpful.

---
DUTCH-SPECIFIC GUIDELINES:
- Persona: Professional and helpful.
`;

      const unifiedDentists = `
---
AVAILABLE DENTISTS & THEIR SPECIALIZATIONS (SAME FOR ALL LANGUAGES):

Dr. Virginie Pauwels - Pediatric Dentist
  * Specializes in: Dental care for children, pediatric emergencies, preventive care for kids.
  * Best for: Patients under 16, children with dental anxiety, pediatric treatments.

Dr. Emeline Hubin - Pediatric Dentist
  * Specializes in: Pediatric procedures, child-friendly approach, behavioral management.
  * Best for: Young children, first dental visits, children with special needs.

Dr. Firdaws Benhsain - General Dentist
  * Specializes in: General dentistry, routine cleanings, fillings, extractions, emergency care.
  * Best for: Adult patients, general maintenance, dental emergencies, routine check-ups.

Dr. Justine Peters - Orthodontist
  * Specializes in: Traditional braces, teeth alignment, bite correction, orthodontic consultations.
  * Best for: Teenagers and adults needing braces, bite issues, teeth straightening.

Dr. Anne-Sophie Haas - Orthodontist
  * Specializes in: Adult orthodontics, Invisalign, complex alignment cases, aesthetic treatments.
  * Best for: Adults seeking discreet treatment, complex cases, professional appearance needs.

Dr. Romeo Jackson - General Dentist (English Only)
  * Specializes in: Routine care, cleanings, fillings, emergencies.
`;

      const unifiedExamples = `
---
CONVERSATIONAL EXAMPLES:

ENGLISH:
User: "I need an appointment"
You: "I'd be happy to help! Who is this appointment for?"

User: "For my daughter"
You: "Great! What symptoms or concerns is she having?"

User: "Her tooth hurts"
You: "How old is your daughter, and when did the pain start?"

FRENCH:
- "Bonjour ${user_profile?.first_name}! Comment puis-je vous aider avec vos soins dentaires aujourd'hui?"
- "Je comprends que vous ressentez [symptôme]. Pouvez-vous me dire quand cela a commencé et comment cela se manifeste?"
- "Pour les soins pédiatriques, je peux recommander des dentistes qui se spécialisent dans la dentisterie pour enfants. Quel âge a votre enfant?"

DUTCH:
- "Goedendag ${user_profile?.first_name}! Hoe kan ik u vandaag helpen met uw tandheelkundige zorg?"
- "Ik begrijp dat u [symptoom] ervaart. Kunt u me meer vertellen over wanneer dit begon en hoe het aanvoelt?"
- "Voor pediatrische zorg kan ik tandartsen aanbevelen die gespecialiseerd zijn in kindertandheelkunde. Hoe oud is uw kind?"
`;

      const widgetSystem = `
---
WIDGET CODE SYSTEM (OPTIONAL - FOR INTERNAL USE):
This system supports TECHNICAL CODES that activate widgets when needed.
Use these codes ONLY when you want to show a widget.

AVAILABLE CODES:
- 12345 = Ready to book widget (use when you have collected enough information and are ready to proceed to booking)
- 89902 = Dentist recommendation widget (use ONLY if you have enough info to recommend)
- 77843 = Payment widget
- 66754 = Reschedule widget
- 55621 = Cancel widget
- 44598 = Prescription widget
- 33476 = View appointments widget

USAGE:
If you want to show a widget, start your response with the code:
"12345 Perfect! I have all the information I need to help you book an appointment."

If you DON'T need a widget, DON'T use a code:
"Who is this appointment for? Yourself or someone else?"

IMPORTANT:
- Use code 12345 when you have: 1) Who the appointment is for, AND 2) Symptoms/reason for visit
- Use codes ONLY when you want to activate a widget
- For general questions and gathering info: NO code
- Codes are invisible to the user
`;

      systemPrompt = [
        unifiedPersona,
        unifiedGuidelines,
        unifiedDentists,
        unifiedExamples,
        widgetSystem,
        `Patient Information: ${JSON.stringify(user_profile)}`,
        patientContextString,
        `Conversation History:\n${conversation_history.map((msg: any) => (msg.is_bot ? 'Assistant' : 'Patient') + ': ' + msg.message).join('\n')}`
      ].join('\n\n');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversation_history || []).map((msg: any) => ({
        role: msg.is_bot || msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.message || msg.content
      })),
      { role: 'user', content: sanitizedMessage } // Use sanitized message
    ];

            // Lovable AI (Gemini) request logging for development
        if (Deno.env.get('ENVIRONMENT') === 'development') {
          console.log('Sending to Lovable AI Gateway (Gemini):', { messageCount: messages.length });
        }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + lovableApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: messages,
        max_completion_tokens: mode === 'dentist_consultation' ? 1000 : 300,
        ...responseFormat
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Lovable AI Gateway error:', errorData);
      throw new Error('Lovable AI Gateway error: ' + response.status);
    }

    const data = await response.json();
            // Response logging for development
        if (Deno.env.get('ENVIRONMENT') === 'development') {
          console.log('Lovable AI response received');
        }

    const result = data.choices[0].message.content;

    if (mode === 'dentist_consultation') {
      try {
        const parsedResult = JSON.parse(result);
        return new Response(JSON.stringify(parsedResult), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } catch (e) {
        // If JSON parsing fails, return as simple response
        return new Response(JSON.stringify({
          response: result,
          suggestions: []
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    const botResponse = result;

    // Extract consultation reason from conversation
    const extractConsultationReason = (message: string, history: any[]): string => {
      const lowerMessage = message.toLowerCase();
      
      // Extract from current message
      if (lowerMessage.includes('douleur') || lowerMessage.includes('mal aux dents') || lowerMessage.includes('pain')) {
        return 'Douleur dentaire';
      }
      if (lowerMessage.includes('nettoyage') || lowerMessage.includes('cleaning')) {
        return 'Nettoyage dentaire';
      }
      if (lowerMessage.includes('contrôle') || lowerMessage.includes('checkup') || lowerMessage.includes('routine')) {
        return 'Contrôle de routine';
      }
      if (lowerMessage.includes('urgence') || lowerMessage.includes('emergency')) {
        return 'Urgence dentaire';
      }
      if (lowerMessage.includes('esthétique') || lowerMessage.includes('cosmetic') || lowerMessage.includes('whitening') || lowerMessage.includes('blanchiment')) {
        return 'Consultation esthétique';
      }
      
      // Extract from conversation history (last 5 messages)
      const recentMessages = history.slice(-5);
      const fullContext = recentMessages.map(m => m.message).join(' ').toLowerCase();
      
      if (fullContext.includes('douleur') || fullContext.includes('mal aux dents')) {
        return 'Douleur dentaire';
      }
      if (fullContext.includes('nettoyage')) {
        return 'Nettoyage dentaire';
      }
      if (fullContext.includes('contrôle') || fullContext.includes('routine')) {
        return 'Contrôle de routine';
      }
      if (fullContext.includes('urgence')) {
        return 'Urgence dentaire';
      }
      if (fullContext.includes('esthétique') || fullContext.includes('blanchiment')) {
        return 'Consultation esthétique';
      }
      
      return 'Consultation générale';
    };

    const consultationReason = extractConsultationReason(sanitizedMessage, conversation_history);

    // Parse suggestions from AI response (no forced keyword matching)
    const suggestions: string[] = [];
    
    // Extract recommendations from AI if they added widget codes
    const codeMatch = botResponse.match(/^(\d{5})\s/);
    if (codeMatch) {
      const code = codeMatch[1];
      switch(code) {
        case '89902':
          suggestions.push('recommend-dentist');
          break;
        case '77843':
          suggestions.push('pay-now');
          break;
        case '66754':
          suggestions.push('reschedule');
          break;
        case '55621':
          suggestions.push('cancel-appointment');
          break;
        case '44598':
          suggestions.push('prescription-refill');
          break;
        case '33476':
          suggestions.push('view-appointments');
          break;
      }
    }
    
    // Extract dentist recommendations based on conversation context
    const recommendedDentists: string[] = [];
    const lowerResponse = botResponse.toLowerCase();
    const lowerMessage = sanitizedMessage.toLowerCase();
    
    // Only recommend dentists if AI decided to show the widget
    if (suggestions.includes('recommend-dentist')) {
      if (lowerResponse.includes('pediatric') || lowerResponse.includes('child') || 
          lowerMessage.includes('enfant') || lowerMessage.includes('child') || lowerMessage.includes('kid')) {
        recommendedDentists.push('Virginie Pauwels', 'Emeline Hubin');
      }
      
      if (lowerResponse.includes('orthodontic') || lowerResponse.includes('braces') || 
          lowerMessage.includes('orthodontie') || lowerMessage.includes('alignement')) {
        recommendedDentists.push('Justine Peters', 'Anne-Sophie Haas');
      }
      
      if (lowerResponse.includes('general') || lowerResponse.includes('routine') || 
          lowerMessage.includes('général') || lowerMessage.includes('nettoyage')) {
        recommendedDentists.push('Firdaws Benhsain');
      }
      
      // Default to general dentist if no specific match
      if (recommendedDentists.length === 0) {
        recommendedDentists.push('Firdaws Benhsain');
      }
    }
    
    const uniqueDentists = [...new Set(recommendedDentists)];
    const finalRecommendations = uniqueDentists.slice(0, 2);
    
    const urgency_detected = false;
    const emergency_detected = false;

    // AI has full control - no forced code enforcement
    const finalResponse = botResponse;
    console.log('✅ AI response used as-is. Widget control delegated to AI.');

    return new Response(JSON.stringify({ 
      response: finalResponse,
      suggestions,
      urgency_detected,
      emergency_detected,
      recommended_dentist: finalRecommendations, // Pass the recommended dentists to frontend
      consultation_reason: consultationReason
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