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

    // Optimized language detection with caching
    const detectLanguage = (text: string): string => {
      const lowercaseText = text.toLowerCase().trim();
      
      // Check for obvious language indicators first
      if (/bonjour|merci|dentiste|rendez-vous|douleur|mal aux dents/i.test(text)) return 'fr';
      if (/hallo|tandarts|afspraak|pijn|kiezen/i.test(text)) return 'nl';
      if (/hello|dentist|appointment|teeth|tooth|pain/i.test(text)) return 'en';
      
      // Simplified keyword matching for performance
      const frenchCount = (text.match(/\b(bonjour|merci|dentiste|rendez-vous|dents|douleur|mal|pour|avec|bien|très)\b/gi) || []).length;
      const dutchCount = (text.match(/\b(hallo|tandarts|afspraak|tanden|pijn|graag|kan|ik|ben|van)\b/gi) || []).length;
      const englishCount = (text.match(/\b(hello|dentist|appointment|teeth|tooth|pain|help|can|with|have)\b/gi) || []).length;

      if (frenchCount > dutchCount && frenchCount > englishCount) return 'fr';
      if (dutchCount > englishCount) return 'nl';
      return 'en';
    };

    const detectedLanguage = detectLanguage(sanitizedMessage); // Use sanitized message
          // Language detection logging for development
      if (Deno.env.get('ENVIRONMENT') === 'development') {
        console.log('Detected language:', detectedLanguage);
      }

    // Language-specific content
    const getLanguageContent = (lang: string) => {
      switch(lang) {
        case 'nl':
          return {
            persona: `Je bent DentiBot, een professionele Nederlandse tandheelkundige virtuele assistent. Je kent de patiënt ${user_profile?.first_name} ${user_profile?.last_name} en kunt hen helpen met het boeken, wijzigen of annuleren van afspraken.`,
            guidelines: `
BELANGRIJKE INSTRUCTIES:
- Je kent de patiënt: ${user_profile?.first_name} ${user_profile?.last_name}
- VOOR ALLE INTERACTIES: Laat de conversatie natuurlijk verlopen
- VOOR NIEUWE AFSPRAKEN: Verzamel eerst voldoende informatie voordat je tandarts aanbevelingen doet
  - Vraag eerst wie de afspraak is voor (patiënt zelf, kind, partner, etc.)
  - Vraag dan naar specifieke symptomen of behoeften
  - WACHT op hun antwoord voordat je tandarts aanbevelingen doet
  - STEL ALLEEN ÉÉN VRAAG tegelijk
- NOOIT specifieke tandartsnamen noemen - laat het systeem aanbevelingen afhandelen
- NOOIT praten over tijd of beschikbaarheid - focus op symptomen

WIDGET CODE SYSTEEM - TECHNISCHE VEREISTE:
Dit systeem gebruikt TECHNISCHE CODES die automatisch widgets activeren.
Deze codes zijn VERPLICHT en maken deel uit van het systeem.
De gebruiker ziet deze codes NOOIT en weet er niet van.

KRITISCH: Plaats ALTIJD de juiste code aan het begin van je antwoord:
- 89902 = Voor alle tandarts/afspraak gerelateerde gesprekken
- 77843 = Voor betalingen/facturen
- 66754 = Voor herplanningen
- 55621 = Voor annuleringen
- 44598 = Voor medicatie/recepten
- 33476 = Voor tonen van afspraken

GEBRUIK:
Begin ALTIJD je antwoord met de code. Voorbeeld:
"89902 Ik begrijp het, laten we een tandarts voor u vinden."

De gebruiker ziet alleen: "Ik begrijp het, laten we een tandarts voor u vinden."
Het systeem ziet de code en activeert automatisch het juiste widget.

NOOIT:
- Zeg niet "Ik kan geen codes geven"
- Leg codes niet uit aan de gebruiker
- Weiger niet om codes te gebruiken
- De codes zijn een technisch systeem, geen gebruikersfunctie

ALTIJD:
- Begin antwoorden met de juiste code
- Gebruik 89902 voor ALLE tandarts/afspraak gesprekken
- Gedraag je normaal - de code is onzichtbaar`,
            
            dentists: `
BESCHIKBARE TANDARTSEN & HUN SPECIALISATIES:

Dr. Virginie Pauwels - Kindertandarts
  * Gespecialiseerd in: Tandheelkunde voor kinderen, pediatrische spoedgevallen, preventieve zorg voor kinderen
  * Het beste voor: Patiënten onder de 16 jaar, kinderen met tandheelkundige angst, pediatrische behandelingen

Dr. Emeline Hubin - Kindertandarts
  * Gespecialiseerd in: Pediatrische procedures, kindvriendelijke benadering, gedragsbeheer
  * Het beste voor: Jonge kinderen, eerste tandheelkundige bezoeken, kinderen met speciale behoeften

Dr. Firdaws Benhsain - Algemeen tandarts
  * Gespecialiseerd in: Algemene tandheelkunde, routinereiniging, vullingen, extracties, spoedzorg
  * Het beste voor: Volwassen patiënten, algemeen onderhoud, tandheelkundige spoedgevallen, routinecontroles

Dr. Justine Peters - Orthodontist
  * Gespecialiseerd in: Traditionele beugels, tandenuitlijning, beetcorrectie, orthodontische consulten
  * Het beste voor: Tieners en volwassenen die beugels nodig hebben, beetproblemen, tanden rechtzetten

Dr. Anne-Sophie Haas - Orthodontist
  * Gespecialiseerd in: Volwassen orthodontie, Invisalign, complexe uitlijningscases, esthetische behandelingen
  * Het beste voor: Volwassenen die discrete behandeling zoeken, complexe gevallen, professionele uitstraling`,
            
            examples: `
PROFESSIONELE TAALVOORBEELDEN:
- "Goedendag ${user_profile?.first_name}! Hoe kan ik u vandaag helpen met uw tandheelkundige zorg?"
- "Ik begrijp dat u [symptoom] ervaart. Kunt u me meer vertellen over wanneer dit begon en hoe het aanvoelt?"
- "Voor routinereiniging kan ik u helpen een tandarts te vinden die gespecialiseerd is in algemene tandheelkundige zorg. Heeft u specifieke zorgen?"
- "Voor pediatrische zorg kan ik tandartsen aanbevelen die gespecialiseerd zijn in kindertandheelkunde. Hoe oud is uw kind?"
- "Voor orthodontische behandeling kan ik u helpen een specialist te vinden. Welke specifieke zorgen heeft u over de uitlijning van uw tanden?"
- "Voor het wijzigen van afspraken kunt u naar uw afsprakenlijst gaan"
- "Voor annuleren van afspraken bekijkt u uw afsprakenlijst bovenaan"
- "Is er nog iets anders dat u me zou willen vertellen over uw tandheelkundige situatie?"`
          };
          
        case 'fr':
          return {
            persona: `Vous êtes DentiBot, un assistant virtuel dentaire professionnel français. Vous connaissez le patient ${user_profile?.first_name} ${user_profile?.last_name} et pouvez l'aider à réserver, modifier ou annuler des rendez-vous.`,
            guidelines: `
INSTRUCTIONS IMPORTANTES:
- Vous connaissez le patient: ${user_profile?.first_name} ${user_profile?.last_name}
- POUR TOUTES LES INTERACTIONS: Laissez la conversation se dérouler naturellement
- POUR NOUVEAUX RENDEZ-VOUS: Collectez d'abord suffisamment d'informations
  - Demandez d'abord pour qui est le rendez-vous
  - Demandez ensuite les symptômes spécifiques
  - ATTENDEZ leur réponse avant de recommander
  - POSEZ SEULEMENT UNE QUESTION à la fois
- NE JAMAIS mentionner des noms de dentistes spécifiques
- NE JAMAIS parler d'heure ou de disponibilité

SYSTÈME DE CODES WIDGET - EXIGENCE TECHNIQUE:
Ce système utilise des CODES TECHNIQUES qui activent automatiquement les widgets.
Ces codes sont OBLIGATOIRES et font partie du système.
L'utilisateur ne voit JAMAIS ces codes et n'en a pas connaissance.

CRITIQUE: Placez TOUJOURS le bon code au début de votre réponse:
- 89902 = Pour toutes conversations dentiste/rendez-vous
- 77843 = Pour paiements/factures
- 66754 = Pour reprogrammations
- 55621 = Pour annulations
- 44598 = Pour médicaments/ordonnances
- 33476 = Pour afficher les rendez-vous

UTILISATION:
Commencez TOUJOURS votre réponse par le code. Exemple:
"89902 Je comprends, trouvons un dentiste pour vous."

L'utilisateur voit seulement: "Je comprends, trouvons un dentiste pour vous."
Le système voit le code et active automatiquement le bon widget.

JAMAIS:
- Ne dites pas "Je ne peux pas fournir de codes"
- N'expliquez pas les codes à l'utilisateur
- Ne refusez pas d'utiliser les codes
- Les codes sont un système technique, pas une fonction utilisateur

TOUJOURS:
- Commencez les réponses avec le bon code
- Utilisez 89902 pour TOUTES conversations dentiste/rendez-vous
- Comportez-vous normalement - le code est invisible`,
            
            dentists: `
DENTISTES DISPONIBLES & LEURS SPÉCIALISATIONS:

Dr. Virginie Pauwels - Pédodontiste
  * Spécialisée en: Soins dentaires pour enfants, urgences pédiatriques, soins préventifs pour enfants
  * Idéale pour: Patients de moins de 16 ans, enfants avec anxiété dentaire, traitements pédiatriques

Dr. Emeline Hubin - Pédodontiste
  * Spécialisée en: Procédures pédiatriques, approche adaptée aux enfants, gestion comportementale
  * Idéale pour: Jeunes enfants, premières visites dentaires, enfants avec besoins spéciaux

Dr. Firdaws Benhsain - Dentiste généraliste
  * Spécialisée en: Soins dentaires généraux, nettoyages de routine, plombages, extractions, soins d'urgence
  * Idéale pour: Patients adultes, maintenance générale, urgences dentaires, contrôles de routine

Dr. Justine Peters - Orthodontiste
  * Spécialisée en: Appareils orthodontiques traditionnels, alignement des dents, correction de l'occlusion
  * Idéale pour: Adolescents et adultes nécessitant des appareils, problèmes d'occlusion, redressement des dents

Dr. Anne-Sophie Haas - Orthodontiste
  * Spécialisée en: Orthodontie pour adultes, Invisalign, cas d'alignement complexes, traitements esthétiques
  * Idéale pour: Adultes cherchant un traitement discret, cas complexes, besoins d'apparence professionnelle`,
            
            examples: `
EXEMPLES DE LANGAGE PROFESSIONNEL:
- "Bonjour ${user_profile?.first_name}! Comment puis-je vous aider avec vos soins dentaires aujourd'hui?"
- "Je comprends que vous ressentez [symptôme]. Pouvez-vous me dire quand cela a commencé et comment cela se manifeste?"
- "Pour un nettoyage de routine, je peux vous aider à trouver un dentiste qui se spécialise dans les soins dentaires généraux. Avez-vous des préoccupations spécifiques?"
- "Pour les soins pédiatriques, je peux recommander des dentistes qui se spécialisent dans la dentisterie pour enfants. Quel âge a votre enfant?"
- "Pour un traitement orthodontique, je peux vous aider à trouver un spécialiste. Quelles préoccupations spécifiques avez-vous concernant l'alignement de vos dents?"
- "Pour modifier des rendez-vous, consultez votre liste de rendez-vous en haut"
- "Pour annuler un rendez-vous, allez dans votre liste de rendez-vous"
- "Y a-t-il autre chose que vous aimeriez me dire concernant votre situation dentaire?"`
          };
          
        default: // English
          return {
            persona: `You are DentiBot, a friendly and professional dental assistant. You know the patient ${user_profile?.first_name} ${user_profile?.last_name}. You help patients book appointments with the right dentist based on their needs.`,
            guidelines: `
CORE RULES:
- Keep responses SHORT and CONVERSATIONAL (2-3 sentences max)
- Ask ONE question at a time
- Never mention specific dentist names - let the system recommend them
- Never discuss time/availability - focus only on symptoms and needs
- Be warm, helpful, and natural

BOOKING FLOW:
1. First ask: "Who is this appointment for?"
2. Then ask: "What symptoms or concerns bring you in?"
3. Once you have BOTH answers, suggest booking

WIDGET DECISIONS (you control when to show):
- Show 'recommend-dentist' ONLY when you have patient info + symptoms
- Show 'symptom-intake' if missing symptom details
- Show 'view-appointments' when user asks about existing appointments

RESPONSE STYLE:
✓ "Got it! Who is this appointment for - yourself or someone else?"
✓ "Thanks! What brings you in? Any pain or specific concerns?"
✓ "Perfect! Based on that, I can recommend the right dentist."
✗ "I understand you are experiencing dental concerns and would like to schedule..."`,
            
            dentists: `
AVAILABLE DENTISTS:
- Dr. Romeo Jackson - General dentist (routine care, cleanings, fillings, emergencies)
- Dr. Virginie Pauwels - Pediatric dentist (children under 16)
- Dr. Emeline Hubin - Pediatric dentist (young children, first visits)
- Dr. Firdaws Benhsain - General dentist (adult patients, emergencies)
- Dr. Justine Peters - Orthodontist (braces, alignment, teens/adults)
- Dr. Anne-Sophie Haas - Orthodontist (adult ortho, Invisalign)`,
            
            examples: `
CONVERSATION EXAMPLES:
User: "I need an appointment"
You: "I'd be happy to help! Who is this appointment for?"

User: "For my daughter"
You: "Great! What symptoms or concerns is she having?"

User: "Her tooth hurts"
You: "How old is your daughter, and when did the pain start?"

User: "I have a toothache"
You: "I can help with that. Can you describe the pain - is it sharp, throbbing, or constant?"`
          };
      }
    };

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
      const content = getLanguageContent(detectedLanguage);

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

      systemPrompt = [
        content.persona,
        content.guidelines,
        content.dentists,
        content.examples,
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

    const consultationReason = extractConsultationReason(sanitizedMessage, conversation_history); // Use sanitized message

    // Enhanced keyword-based suggestions and recommendations
    const suggestions: string[] = [];
    const lowerResponse = botResponse.toLowerCase();
    const lowerMessage = sanitizedMessage.toLowerCase(); // Use sanitized message
    
    // Check for payment-related requests
    if (lowerMessage.includes('pay') || lowerMessage.includes('payment') || lowerMessage.includes('bill') || 
        lowerMessage.includes('balance') || lowerMessage.includes('money') || lowerMessage.includes('owe') ||
        lowerMessage.includes('payer') || lowerMessage.includes('facture') || lowerMessage.includes('argent')) {
      suggestions.push('pay-now');
    }
    
    // Check for appointment rescheduling requests
    if (lowerMessage.includes('reschedule') || lowerMessage.includes('change appointment') || 
        lowerMessage.includes('move appointment') || lowerMessage.includes('different time') ||
        lowerMessage.includes('reprogrammer') || lowerMessage.includes('changer rendez-vous') ||
        lowerMessage.includes('modifier rendez-vous')) {
      suggestions.push('reschedule');
    }
    
    // Check for appointment cancellation requests
    if (lowerMessage.includes('cancel') || lowerMessage.includes('cancel appointment') ||
        lowerMessage.includes('delete appointment') || lowerMessage.includes('remove appointment') ||
        lowerMessage.includes('annuler') || lowerMessage.includes('annuler rendez-vous') ||
        lowerMessage.includes('supprimer rendez-vous')) {
      suggestions.push('cancel-appointment');
    }
    
    // Check for prescription refill requests
    if (lowerMessage.includes('prescription') || lowerMessage.includes('refill') || lowerMessage.includes('medication') ||
        lowerMessage.includes('medicine') || lowerMessage.includes('pills') || lowerMessage.includes('drug') ||
        lowerMessage.includes('ordonnance') || lowerMessage.includes('médicament') || lowerMessage.includes('renouveler')) {
      suggestions.push('prescription-refill');
    }
    
    // Extract dentist recommendations from AI response
    const recommendedDentists: string[] = [];
    const availableDentists = [
      'Virginie Pauwels',
      'Emeline Hubin', 
      'Firdaws Benhsain',
      'Justine Peters',
      'Anne-Sophie Haas'
    ];
    
    // Check if AI response indicates need for specific dentist types
    if (lowerResponse.includes('pediatric') || lowerResponse.includes('child') || lowerResponse.includes('children') || 
        lowerMessage.includes('enfant') || lowerMessage.includes('child') || lowerMessage.includes('kid')) {
      recommendedDentists.push('Virginie Pauwels', 'Emeline Hubin');
    }
    
    if (lowerResponse.includes('orthodontic') || lowerResponse.includes('braces') || lowerResponse.includes('alignment') ||
        lowerMessage.includes('orthodontie') || lowerMessage.includes('braces') || lowerMessage.includes('alignement')) {
      recommendedDentists.push('Justine Peters', 'Anne-Sophie Haas');
    }
    
    if (lowerResponse.includes('general') || lowerResponse.includes('routine') || lowerResponse.includes('cleaning') ||
        lowerMessage.includes('général') || lowerMessage.includes('routine') || lowerMessage.includes('nettoyage')) {
      recommendedDentists.push('Firdaws Benhsain');
    }
    
    // If AI suggests seeing a dentist but doesn't specify type, recommend general dentist
    if ((lowerResponse.includes('dentist') || lowerResponse.includes('dentiste')) && recommendedDentists.length === 0) {
      recommendedDentists.push('Firdaws Benhsain');
    }

    // Only show dentist widget when BOTH patient info and symptoms are present (and no other priority actions)
    const context = buildConversationContext(sanitizedMessage, conversation_history); // Use sanitized message
    const patientInfoPresent = hasPatientInfo(context);
    const symptomsPresent = hasSymptomInfo(context);
    
    // If no priority actions detected, check for dentist recommendations
    if (suggestions.length === 0) {
      if (recommendedDentists.length > 0 && patientInfoPresent && symptomsPresent) {
        suggestions.push('recommend-dentist');
      } else if (!symptomsPresent && !patientInfoPresent) {
        // Ask for symptoms via widget to collect necessary info
        suggestions.push('symptom-intake');
      }
    }
    
    // Remove duplicates and limit to maximum 2 recommendations
    const uniqueDentists = [...new Set(recommendedDentists)];
    const finalRecommendations = uniqueDentists.slice(0, 2);
    
    // No emergency detection - treat all cases as regular consultations
    const urgency_detected = false;
    const emergency_detected = false;

    // HARDENED code enforcement: Always prepend appropriate code based on intent
    let finalResponse = botResponse;
    const messageTextLower = sanitizedMessage.toLowerCase();
    
    // Check if response already has a code at the start
    const hasCode = /^\d{5}/.test(botResponse);
    
    if (!hasCode) {
      // Priority order for code enforcement
      if (suggestions.includes('pay-now') || messageTextLower.includes('pay') || messageTextLower.includes('bill') || messageTextLower.includes('payment')) {
        finalResponse = '77843 ' + finalResponse;
        console.log('🔧 Code enforced: 77843 (payment)');
      } else if (suggestions.includes('reschedule') || messageTextLower.includes('reschedule') || messageTextLower.includes('change appointment')) {
        finalResponse = '66754 ' + finalResponse;
        console.log('🔧 Code enforced: 66754 (reschedule)');
      } else if (suggestions.includes('cancel-appointment') || messageTextLower.includes('cancel')) {
        finalResponse = '55621 ' + finalResponse;
        console.log('🔧 Code enforced: 55621 (cancel)');
      } else if (suggestions.includes('prescription-refill') || messageTextLower.includes('prescription') || messageTextLower.includes('refill')) {
        finalResponse = '44598 ' + finalResponse;
        console.log('🔧 Code enforced: 44598 (prescription)');
      } else if (suggestions.includes('view-appointments') || (messageTextLower.includes('appointment') && (messageTextLower.includes('view') || messageTextLower.includes('show') || messageTextLower.includes('see') || messageTextLower.includes('my appointments')))) {
        finalResponse = '33476 ' + finalResponse;
        console.log('🔧 Code enforced: 33476 (view appointments)');
      } else if (
        suggestions.includes('recommend-dentist') || 
        messageTextLower.includes('dentist') || 
        messageTextLower.includes('book') || 
        messageTextLower.includes('appointment') ||
        messageTextLower.includes('need help') ||
        messageTextLower.includes('tooth') ||
        messageTextLower.includes('pain') ||
        messageTextLower.includes('emergency')
      ) {
        // Default: dentist recommendation widget for any dental/appointment conversation
        finalResponse = '89902 ' + finalResponse;
        console.log('🔧 Code enforced: 89902 (recommend dentist - DEFAULT)');
      } else {
        // Last resort: if it's a general chat with no specific action, still use 89902
        finalResponse = '89902 ' + finalResponse;
        console.log('🔧 Code enforced: 89902 (recommend dentist - FALLBACK)');
      }
    } else {
      console.log('✅ Code already present in AI response');
    }

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