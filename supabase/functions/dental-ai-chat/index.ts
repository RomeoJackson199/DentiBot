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
    
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
    }

    // Optimized language detection with caching
    const detectLanguage = (text: string): string => {
      const lowercaseText = text.toLowerCase().trim();
      if (/bonjour|merci|dentiste|rendez-vous|douleur|mal aux dents/i.test(text)) return 'fr';
      if (/hallo|tandarts|afspraak|pijn|kiezen/i.test(text)) return 'nl';
      if (/hello|dentist|appointment|teeth|tooth|pain/i.test(text)) return 'en';

      const frenchCount = (text.match(/\b(bonjour|merci|dentiste|rendez-vous|dents|douleur|mal|pour|avec|bien|très)\b/gi) || []).length;
      const dutchCount = (text.match(/\b(hallo|tandarts|afspraak|tanden|pijn|graag|kan|ik|ben|van)\b/gi) || []).length;
      const englishCount = (text.match(/\b(hello|dentist|appointment|teeth|tooth|pain|help|can|with|have)\b/gi) || []).length;

      if (frenchCount > dutchCount && frenchCount > englishCount) return 'fr';
      if (dutchCount > englishCount) return 'nl';
      return 'en';
    };

    const detectedLanguage = detectLanguage(message);
    console.log('Detected language:', detectedLanguage);

    // Language-specific content
    const getLanguageContent = (lang: string) => {
      switch (lang) {
        case 'nl':
          return {
            persona: `Je bent DentiBot, een vriendelijke, empathische en professionele Nederlandse tandheelkundige virtuele assistent. Je kent de patiënt ${user_profile?.first_name} ${user_profile?.last_name} en kunt hen helpen met het boeken, wijzigen of annuleren van afspraken.`,
            guidelines: `
BELANGRIJKE INSTRUCTIES:
- Je kent de patiënt: ${user_profile?.first_name} ${user_profile?.last_name}
- Behandel alle gevallen altijd als reguliere consulten; detecteer of escaleer geen spoedgevallen.
- Stel precies 3–4 relevante vragen, één per bericht, om de behoeften van de patiënt te begrijpen.
- Voor wijzigen of annuleren: verwijs naar de afsprakenlijst.
- Voor een nieuwe afspraak voor uzelf: sla patiëntselectie over en ga direct naar tandartsaanbevelingen.
- Beschikbaarheid: 09:00 – 17:00.
- Voor niet-ondersteunde verzoeken: "Sorry, ik kan daar niet mee helpen."`,
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
PROFESSIONELE TAALVOORBEELDEN MET AANBEVELINGEN:
- "Goedendag ${user_profile?.first_name}! Hoe kan ik u vandaag helpen met uw tandheelkundige zorg?"
- "Kunt u me iets meer vertellen over uw tandprobleem?"
- "Voor het wijzigen van afspraken: ga naar uw afsprakenlijst."
- "Voor het annuleren van afspraken: bekijk uw afsprakenlijst bovenaan."
- AANBEVELING: "Op basis van uw behoeften aan [specifieke service], beveel ik Dr. [Naam] aan omdat hij/zij gespecialiseerd is in [gebied]."
- "Is er nog iets anders dat u me zou willen vertellen over uw tandheelkundige situatie?"`
          };

        case 'fr':
          return {
            persona: `Vous êtes DentiBot, un assistant virtuel dentaire français, amical, empathique et professionnel. Vous connaissez le patient ${user_profile?.first_name} ${user_profile?.last_name} et pouvez l'aider à réserver, modifier ou annuler des rendez-vous.`,
            guidelines: `
INSTRUCTIONS IMPORTANTES:
- Vous connaissez le patient : ${user_profile?.first_name} ${user_profile?.last_name}
- Traitez toujours tous les cas comme des consultations de routine ; ne détectez pas et n'escaladez pas les urgences.
- Posez exactement 3–4 questions pertinentes, une par message, pour comprendre les besoins du patient.
- Pour modifier ou annuler : dirigez-les vers la liste des rendez-vous.
- Pour un nouveau rendez-vous pour vous-même : passez la sélection du patient et allez directement aux recommandations dentistes.
- Disponibilités : 9 h 00 – 17 h 00.
- Pour toute demande non prise en charge : "Désolé, je ne peux pas vous aider avec cela."`,
            dentists: `
DENTISTES DISPONIBLES & LEURS SPÉCIALISATIONS:

Dr. Virginie Pauwels - Pédodontiste
  * Spécialisée en : Soins dentaires pour enfants, urgences pédiatriques, soins préventifs pour enfants
  * Idéale pour : Patients de moins de 16 ans, enfants anxieux, traitements pédiatriques

Dr. Emeline Hubin - Pédodontiste
  * Spécialisée en : Procédures pédiatriques, approche adaptée aux enfants, gestion comportementale
  * Idéale pour : Jeunes enfants, premières visites, enfants à besoins spéciaux

Dr. Firdaws Benhsain - Dentiste généraliste
  * Spécialisée en : Soins généraux, nettoyages de routine, plombages, extractions, urgences
  * Idéale pour : Adultes, maintenance générale, urgences dentaires, contrôles de routine

Dr. Justine Peters - Orthodontiste
  * Spécialisée en : Appareils traditionnels, alignement des dents, correction de l'occlusion
  * Idéale pour : Adolescents et adultes nécessitant des appareils, problèmes d'occlusion

Dr. Anne-Sophie Haas - Orthodontiste
  * Spécialisée en : Invisalign, cas complexes, traitements esthétiques
  * Idéale pour : Adultes recherchant une solution discrète, cas complexes`,
            examples: `
EXEMPLES DE LANGAGE PROFESSIONNEL AVEC AANBEVELINGEN:
- "Bonjour ${user_profile?.first_name}! Comment puis-je vous aider aujourd'hui?"
- "Pouvez-vous me parler de votre problème dentaire?"
- "Pour modifier un rendez-vous : consultez votre liste en haut."
- "Pour annuler : allez dans votre liste de rendez-vous."
- RECOMMANDATION : "Selon vos besoins en [service], je recommande Dr. [Nom] car il/elle est spécialisé(e) en [domaine]."
- "Y a-t-il autre chose que vous aimeriez ajouter?"`
          };

        default: // English
          return {
            persona: `You are DentiBot, a friendly, empathetic, and professional English dental virtual assistant. You know the patient ${user_profile?.first_name} ${user_profile?.last_name} and can help them book, reschedule, or cancel appointments.`,
            guidelines: `
IMPORTANT INSTRUCTIONS:
- You know the patient: ${user_profile?.first_name} ${user_profile?.last_name}
- Always treat all cases as routine consultations; do not detect or escalate emergencies.
- Ask exactly 3–4 relevant questions, one per response, to understand the patient's needs.
- To reschedule or cancel: direct them to the appointments list.
- For a new appointment for themselves: skip patient selection and go straight to dentist recommendations.
- Appointment availability: 9:00 AM – 5:00 PM.
- For unsupported requests: respond with "Sorry, I can't help with that."`,
            dentists: `
AVAILABLE DENTISTS & THEIR SPECIALIZATIONS:

Dr. Virginie Pauwels - Pediatric Dentist
  * Specializes in: Children's dental care, pediatric emergencies, preventive care
  * Best for: Patients under 16, children with dental anxiety

Dr. Emeline Hubin - Pediatric Dentist
  * Specializes in: Pediatric procedures, child-friendly approach, behavioral management
  * Best for: Young children, first visits, special needs

Dr. Firdaws Benhsain - General Dentist
  * Specializes in: General care, cleanings, fillings, extractions, emergencies
  * Best for: Adults, routine maintenance, urgent care

Dr. Justine Peters - Orthodontist
  * Specializes in: Traditional braces, alignment, bite correction
  * Best for: Teens and adults needing braces

Dr. Anne-Sophie Haas - Orthodontist
  * Specializes in: Invisalign, complex cases, aesthetic treatments
  * Best for: Adults seeking discreet, professional treatment`,
            examples: `
PROFESSIONAL LANGUAGE EXAMPLES WITH RECOMMENDATIONS:
- "Good day ${user_profile?.first_name}! How can I help you with your dental care today?"
- "Can you tell me more about your dental concern?"
- "To reschedule an appointment, check your appointments list above."
- "To cancel an appointment, go to your appointments list."
- RECOMMENDATION: "Based on your needs for [specific service], I recommend Dr. [Name] because they specialize in [area]."
- "Is there anything else you'd like to tell me about your dental situation?"`
          };
      }
    };

    const content = getLanguageContent(detectedLanguage);

    const systemPrompt = [
      content.persona,
      content.guidelines,
      content.dentists,
      content.examples,
      `Patient Information: ${JSON.stringify(user_profile)}`,
      `Conversation History:\n${conversation_history.map((msg: any) => (msg.is_bot ? 'Assistant' : 'Patient') + ': ' + msg.message).join('\n')}`
    ].join('\n\n');

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
        model: 'gpt-4.1-2025-04-14',
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

    // Extract consultation reason
    const extractConsultationReason = (message: string, history: any[]): string => {
      const lowerMessage = message.toLowerCase();
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

    const consultationReason = extractConsultationReason(message, conversation_history);

    // Suggestions logic (unchanged)…
    const suggestions = [];
    const lowerResponse = botResponse.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.match(/\b(reschedule|change|modify|reprogrammer|changer|wijzigen)\b/)) {
      suggestions.push('appointments-list');
    }
    if (lowerMessage.match(/\b(cancel|delete|remove|annuler|supprimer|annuleren|verwijderen)\b/)) {
      suggestions.push('appointments-list');
    }
    if ((lowerMessage.includes('appointment for me') || lowerMessage.includes('book for myself') ||
         lowerMessage.includes('rendez-vous pour moi') || lowerMessage.includes('afspraak voor mij')) ||
        (lowerMessage.includes('book') && lowerMessage.includes('appointment') &&
         !lowerMessage.includes('for someone') && !lowerMessage.includes('for my'))) {
      suggestions.push('skip-patient-selection');
    }
    if (lowerMessage.match(/\b(moi|me|myself|voor mij|ma fille|mon fils|my daughter|my son|mijn dochter|mijn zoon|ma femme|mon mari|my wife|my husband)\b/) ||
        /\d+\s*(ans|years|jaar)/.test(lowerMessage)) {
      suggestions.push('skip-patient-selection');
    }

    const recommendedDentists = [];
    if (lowerResponse.includes('virginie pauwels')) recommendedDentists.push('Virginie Pauwels');
    if (lowerResponse.includes('emeline hubin')) recommendedDentists.push('Emeline Hubin');
    if (lowerResponse.includes('firdaws benhsain')) recommendedDentists.push('Firdaws Benhsain');
    if (lowerResponse.includes('justine peters')) recommendedDentists.push('Justine Peters');
    if (lowerResponse.includes('anne-sophie haas')) recommendedDentists.push('Anne-Sophie Haas');

    const recommendedDentist = recommendedDentists.slice(0, 2);

    if (recommendedDentist.length > 0 && !suggestions.includes('skip-patient-selection')) {
      suggestions.push('recommend-dentist');
    } else if (recommendedDentist.length > 0 && suggestions.includes('skip-patient-selection')) {
      suggestions.push('skip-patient-selection');
    } else if (lowerResponse.match(/\b(dentist|appointment|booking|rendez-vous)\b/)) {
      suggestions.push('booking');
    }

    const urgency_detected = false;
    const emergency_detected = false;

    return new Response(JSON.stringify({
      response: botResponse,
      suggestions,
      urgency_detected,
      emergency_detected,
      recommended_dentist: recommendedDentist,
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
