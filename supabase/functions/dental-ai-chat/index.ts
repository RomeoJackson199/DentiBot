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

// Environment-based CORS configuration
const getCorsHeaders = () => {
  const environment = Deno.env.get('ENVIRONMENT') || 'development';
  
  if (environment === 'production') {
    return {
      'Access-Control-Allow-Origin': 'https://gjvxcisbaxhhblhsytar.supabase.co', // Production domain
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
    };
  }
  
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
    const { message, conversation_history, user_profile, patient_context, mode, dentist_id } = await req.json();

    // Log request in development only
    if (Deno.env.get('ENVIRONMENT') === 'development') {
      console.log('Received request:', { message, user_profile, mode, dentist_id });
    }
    
    // Fetch clinic settings for customization
    let clinicSettings = null;
    if (dentist_id) {
      try {
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        const { data } = await supabase
          .from('clinic_settings')
          .select('specialty_type, ai_instructions, ai_tone, ai_response_length, welcome_message, clinic_name, primary_color, secondary_color')
          .eq('dentist_id', dentist_id)
          .maybeSingle();
        
        clinicSettings = data;
      } catch (error) {
        console.error('Error fetching clinic settings:', error);
      }
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

    // Check if OpenAI API key is available
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      console.warn('OpenAI API key not found, using fallback responses');
      
      // Provide fallback responses based on message content
      const lowerMessage = sanitizedMessage.toLowerCase(); // Use sanitized message
      let fallbackResponse = "I'm here to help you with your dental care. How can I assist you today?";
      let suggestions: string[] = [];
      const recommendedDentist: string[] = [];
      
      // Use the sanitized message for the AI request
      const context = buildConversationContext(sanitizedMessage, conversation_history);
      const patientInfoPresent = hasPatientInfo(context);
      const symptomsPresent = hasSymptomInfo(context);

      if (lowerMessage.includes('douleur') || lowerMessage.includes('pain') || lowerMessage.includes('mal aux dents')) {
        fallbackResponse = "I understand you're experiencing dental pain. Let me help you find the right dentist for your needs. Can you tell me who the appointment is for and describe the pain (sharp, throbbing, or constant)?";
      } else if (lowerMessage.includes('appointment') || lowerMessage.includes('rendez-vous') || lowerMessage.includes('booking')) {
        fallbackResponse = "I can help you book an appointment. First, who is the appointment for? Then tell me about your symptoms so I can recommend the right dentist.";
      } else if (lowerMessage.includes('dentist') || lowerMessage.includes('dentiste')) {
        fallbackResponse = "I can recommend a dentist based on your specific needs. Who is this for, and what symptoms are you experiencing?";
      } else if (lowerMessage.includes('cleaning') || lowerMessage.includes('nettoyage') || lowerMessage.includes('routine')) {
        fallbackResponse = "For routine cleaning, I can help you find the right dentist. Is this for you or someone else? Any specific concerns?";
      } else if (lowerMessage.includes('child') || lowerMessage.includes('enfant') || lowerMessage.includes('kid')) {
        fallbackResponse = "For pediatric care, I can recommend specialists. How old is your child and what symptoms are they experiencing?";
      } else if (lowerMessage.includes('braces') || lowerMessage.includes('orthodontie') || lowerMessage.includes('align')) {
        fallbackResponse = "For orthodontic treatment, I can help you find a specialist. Is this for you or someone else, and what are the concerns?";
      }
      
      // Only suggest dentist widget when BOTH patient info and symptoms are present
      if (patientInfoPresent && symptomsPresent) {
        suggestions = ['recommend-dentist'];
      } else if (!symptomsPresent) {
        suggestions = ['symptom-intake'];
      }
      
      return new Response(JSON.stringify({ 
        response: fallbackResponse,
        suggestions,
        urgency_detected: false,
        emergency_detected: false,
        recommended_dentist: recommendedDentist,
        consultation_reason: "General consultation"
      }), {
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
- VOOR ALLE INTERACTIES: Laat de conversatie natuurlijk verlopen zonder keyword-detectie
- VOOR NIEUWE AFSPRAKEN: Verzamel eerst voldoende informatie voordat je tandarts aanbevelingen doet
  - Vraag eerst wie de afspraak is voor (patiënt zelf, kind, partner, etc.)
  - Vraag dan naar specifieke symptomen of behoeften
  - WACHT op hun antwoord voordat je tandarts aanbevelingen doet
  - STEL ALLEEN ÉÉN VRAAG tegelijk om de behoeften van de patiënt beter te begrijpen
- ALTIJD de patiënt toestaan door te gaan spreken als ze meer informatie willen verstrekken
- GEEN spoedgevallen detecteren - behandel alle gevallen als reguliere consulten
- GEEF HELPFULLE, SPECIFIEKE ANTWOORDEN die de patiënt natuurlijk begeleiden
- NOOIT specifieke tandartsnamen noemen in je antwoorden - laat het systeem aanbevelingen afhandelen
- NOOIT praten over tijd, datum of beschikbaarheid - focus alleen op symptomen en behoeften
- Alle afspraken beschikbaar van 9:00 tot 17:00

WIDGET BEHEER:
- BESLISSING OVER WIDGETS: Jij beslist wanneer widgets moeten worden getoond op basis van de conversatie
- GEEN KEYWORD-DETECTIE: Vertrouw op je natuurlijke taalbegrip, niet op keywords
- VOOR AFSPRAAKEN: "U kunt uw afspraken bekijken en wijzigen in de afsprakenlijst bovenaan"
- VOOR ANNULEREN: "Ga naar uw afsprakenlijst om afspraken te annuleren"

ANTWOORD STRATEGIE:
- Wees warm, professioneel en behulpzaam
- Stel specifieke vragen over symptomen en behoeften
- Geef geruststelling en begeleiding
- Focus op het begrijpen van de situatie van de patiënt
- Vermijd generieke antwoorden - wees specifiek en behulpzaam
- Begeleid patiënten natuurlijk naar het juiste type zorg
- BESLISSING OVER WIDGETS: Jij bepaalt wanneer widgets moeten verschijnen op basis van de conversatie`,
            
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
- POUR TOUTES LES INTERACTIONS: Laissez la conversation se dérouler naturellement sans détection de mots-clés
- POUR NOUVEAUX RENDEZ-VOUS: Collectez d'abord suffisamment d'informations avant de faire des recommandations de dentistes
  - Demandez d'abord pour qui est le rendez-vous (patient lui-même, enfant, partenaire, etc.)
  - Demandez ensuite les symptômes ou besoins spécifiques
  - ATTENDEZ leur réponse avant de faire des recommandations de dentistes
  - POSEZ SEULEMENT UNE QUESTION à la fois pour mieux comprendre les besoins du patient
- TOUJOURS permettre au patient de continuer à parler s'il veut fournir plus d'informations
- NE PAS détecter les urgences - traiter tous les cas comme des consultations régulières
- DONNEZ DES RÉPONSES UTILES ET SPÉCIFIQUES qui guident naturellement le patient
- NE JAMAIS mentionner de noms de dentistes spécifiques dans vos réponses - laissez le système gérer les recommandations
- NE JAMAIS parler de temps, date ou disponibilité - concentrez-vous uniquement sur les symptômes et les besoins
- Tous les rendez-vous disponibles de 9h00 à 17h00

GESTION DES WIDGETS:
- DÉCISION SUR LES WIDGETS: Vous décidez quand les widgets doivent être affichés sur la base de la conversation
- AUCUNE DÉTECTION DE MOTS-CLÉS: Faites confiance à votre compréhension naturelle du langage, pas aux mots-clés
- POUR LES RENDEZ-VOUS: "Vous pouvez consulter et modifier vos rendez-vous dans la liste en haut"
- POUR ANNULER: "Allez dans votre liste de rendez-vous pour annuler"

STRATÉGIE DE RÉPONSE:
- Soyez chaleureux, professionnel et serviable
- Posez des questions spécifiques sur les symptômes et les besoins
- Fournissez rassurance et guidance
- Concentrez-vous sur la compréhension de la situation du patient
- Évitez les réponses génériques - soyez spécifique et utile
- Guidez naturellement les patients vers le bon type de soins
- DÉCISION SUR LES WIDGETS: Vous déterminez quand les widgets doivent apparaître sur la base de la conversation`,
            
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
            persona: `You are DentiBot, a professional English dental virtual assistant. You know the patient ${user_profile?.first_name} ${user_profile?.last_name} and can help them book, reschedule, or cancel appointments.`,
            guidelines: `
IMPORTANT INSTRUCTIONS:
- You know the patient: ${user_profile?.first_name} ${user_profile?.last_name}
- FOR ALL INTERACTIONS: Let the conversation flow naturally without keyword detection
- FOR NEW APPOINTMENTS: Collect sufficient information first before making dentist recommendations
  - Ask first who the appointment is for (patient themselves, child, partner, etc.)
  - Then ask about specific symptoms or needs
  - WAIT for their response before making dentist recommendations
  - ASK ONLY ONE QUESTION at a time to better understand the patient's needs
- ALWAYS allow the patient to continue speaking if they want to provide more information
- DO NOT detect emergencies - treat all cases as regular consultations
- PROVIDE HELPFUL, SPECIFIC RESPONSES that guide the patient naturally
- NEVER mention specific dentist names in your responses - let the system handle recommendations
- NEVER talk about time, date, or availability - focus only on symptoms and needs
- All appointments are available from 9:00 AM to 5:00 PM

WIDGET MANAGEMENT:
- WIDGET DECISIONS: You decide when widgets should be shown based on the conversation
- NO KEYWORD DETECTION: Trust your natural language understanding, not keywords
- FOR APPOINTMENTS: "You can view and reschedule your appointments in the appointments list above"
- FOR CANCELING: "Go to your appointments list to cancel appointments"

RESPONSE STRATEGY:
- Be warm, professional, and helpful
- Ask specific questions about symptoms and needs
- Provide reassurance and guidance
- Focus on understanding the patient's situation
- Avoid generic responses - be specific and helpful
- Guide patients toward the right type of care naturally
- WIDGET DECISIONS: You determine when widgets should appear based on the conversation`,
            
            dentists: `
AVAILABLE DENTISTS & THEIR SPECIALIZATIONS:

Dr. Virginie Pauwels - Pediatric Dentist
  * Specializes in: Children's dental care, pediatric emergencies, preventive care for kids
  * Best for: Patients under 16 years old, children with dental anxiety, pediatric treatments

Dr. Emeline Hubin - Pediatric Dentist
  * Specializes in: Pediatric procedures, child-friendly approach, behavioral management
  * Best for: Young children, first dental visits, children with special needs

Dr. Firdaws Benhsain - General Dentist
  * Specializes in: General dental care, routine cleanings, fillings, extractions, emergency care
  * Best for: Adult patients, general maintenance, dental emergencies, routine check-ups

Dr. Justine Peters - Orthodontist
  * Specializes in: Traditional braces, teeth alignment, bite correction, orthodontic consultations
  * Best for: Teenagers and adults needing braces, bite problems, teeth straightening

Dr. Anne-Sophie Haas - Orthodontist
  * Specializes in: Adult orthodontics, Invisalign, complex alignment cases, aesthetic treatments
  * Best for: Adults seeking discreet treatment, complex cases, professional appearance needs`,
            
            examples: `
PROFESSIONAL LANGUAGE EXAMPLES:
- "Good day ${user_profile?.first_name}! How can I help you with your dental care today?"
- "I understand you're experiencing [symptom]. Can you tell me more about when this started and how it feels?"
- "For routine cleaning, I can help you find a dentist who specializes in general dental care. Do you have any specific concerns?"
- "For pediatric care, I can recommend dentists who specialize in children's dentistry. How old is your child?"
- "For orthodontic treatment, I can help you find a specialist. What specific concerns do you have about your teeth alignment?"
- "To reschedule appointments, check your appointments list above"
- "To cancel an appointment, go to your appointments list"
- "Is there anything else you'd like to tell me about your dental situation?"`
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

      // Customize based on clinic settings
      let customPersona = content.persona;
      let customGuidelines = content.guidelines;
      
      if (clinicSettings) {
        const specialty = clinicSettings.specialty_type || 'dentist';
        const tone = clinicSettings.ai_tone || 'professional';
        const responseLength = clinicSettings.ai_response_length || 'normal';
        
        // Customize persona based on specialty
        const specialtyNames = {
          dentist: 'dental',
          neurologist: 'neurology',
          cardiologist: 'cardiology',
          pediatrician: 'pediatric',
          dermatologist: 'dermatology',
          orthopedist: 'orthopedic',
          psychiatrist: 'mental health',
          general_practitioner: 'general practice'
        };
        
        const specialtyName = specialtyNames[specialty] || 'medical';
        customPersona = `You are an AI assistant for ${clinicSettings.clinic_name || 'our practice'}, specializing in ${specialtyName} care. You know the patient ${user_profile?.first_name} ${user_profile?.last_name}.`;
        
        // Apply custom AI instructions if provided
        if (clinicSettings.ai_instructions) {
          customGuidelines = clinicSettings.ai_instructions + '\n\n' + content.guidelines;
        }
        
        // Add tone guidance
        const toneGuidance = {
          professional: 'Maintain a professional, respectful tone in all communications.',
          friendly: 'Be warm, approachable, and conversational while remaining professional.',
          casual: 'Use a relaxed, informal tone to make patients feel comfortable.',
          empathetic: 'Show deep understanding and compassion for patient concerns.',
          formal: 'Use formal, precise language appropriate for medical communications.'
        };
        
        customGuidelines += `\n\nCOMMUNICATION STYLE: ${toneGuidance[tone] || toneGuidance.professional}`;
        
        // Add response length guidance
        const lengthGuidance = {
          brief: 'Keep responses concise and to the point.',
          normal: 'Provide balanced, informative responses.',
          detailed: 'Give comprehensive explanations with thorough detail.'
        };
        
        customGuidelines += `\nRESPONSE LENGTH: ${lengthGuidance[responseLength] || lengthGuidance.normal}`;
      }

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
        customPersona,
        customGuidelines,
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

            // OpenAI request logging for development
        if (Deno.env.get('ENVIRONMENT') === 'development') {
          console.log('Sending to OpenAI:', { messageCount: messages.length });
        }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + openAIApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: mode === 'dentist_consultation' ? 1000 : 500,
        temperature: 0.7,
        presence_penalty: 0.1,
        frequency_penalty: 0.1,
        ...responseFormat
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error('OpenAI API error: ' + response.status);
    }

    const data = await response.json();
            // Response logging for development
        if (Deno.env.get('ENVIRONMENT') === 'development') {
          console.log('OpenAI response received');
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

    return new Response(JSON.stringify({ 
      response: botResponse,
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