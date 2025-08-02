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
    const { message, conversation_history, user_profile, patient_context, mode } = await req.json();

    console.log('Received request:', { message, user_profile, mode });
    
    // Validate input
    if (!message || typeof message !== 'string') {
      throw new Error('Invalid message format');
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

    const detectedLanguage = detectLanguage(message);
    console.log('Detected language:', detectedLanguage);

    // Language-specific content
    const getLanguageContent = (lang: string) => {
      switch(lang) {
        case 'nl':
          return {
            persona: `Je bent DentiBot, een professionele Nederlandse tandheelkundige virtuele assistent. Je kent de patiënt ${user_profile?.first_name} ${user_profile?.last_name} en kunt hen helpen met het boeken, wijzigen of annuleren van afspraken.`,
            guidelines: `
BELANGRIJKE INSTRUCTIES:
- Je kent de patiënt: ${user_profile?.first_name} ${user_profile?.last_name}
- Voor wijzigen/annuleren van afspraken: stuur hen naar de afsprakenlijst
- Als ze vragen om een afspraak voor zichzelf: ga direct naar tandarts aanbevelingen
  - STEL 2-5 RELEVANTE VRAGEN om de behoeften van de patiënt beter te begrijpen
- ALTIJD de patiënt toestaan door te gaan spreken als ze meer informatie willen verstrekken
- GEEN spoedgevallen detecteren - behandel alle gevallen als reguliere consulten
- ALTIJD een specifieke tandarts aanbevelen op basis van hun diensten en behoeften van de patiënt
- Alle afspraken beschikbaar van 9:00 tot 17:00

AFSPRAAK BEHEER:
- Voor wijzigen afspraken: "U kunt uw afspraken bekijken en wijzigen in de afsprakenlijst bovenaan"
- Voor annuleren: "Ga naar uw afsprakenlijst om afspraken te annuleren"
- Voor nieuwe afspraak voor uzelf: sla patiënt selectie over en ga direct naar tandarts aanbevelingen`,
            
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
- "Voor het wijzigen van afspraken kunt u naar uw afsprakenlijst gaan"
- "Voor annuleren van afspraken bekijkt u uw afsprakenlijst bovenaan"
- AANBEVELING: "Op basis van uw behoeften aan [specifieke service], beveel ik Dr. [Naam] aan omdat hij/zij gespecialiseerd is in [gebied] en perfect zou zijn voor uw situatie."
- "Is er nog iets anders dat u me zou willen vertellen over uw tandheelkundige situatie?"`
          };
          
        case 'fr':
          return {
            persona: `Vous êtes DentiBot, un assistant virtuel dentaire professionnel français. Vous connaissez le patient ${user_profile?.first_name} ${user_profile?.last_name} et pouvez l'aider à réserver, modifier ou annuler des rendez-vous.`,
            guidelines: `
INSTRUCTIONS IMPORTANTES:
- Vous connaissez le patient: ${user_profile?.first_name} ${user_profile?.last_name}
- Pour modifier/annuler des rendez-vous: dirigez-les vers la liste des rendez-vous
- S'ils demandent un rendez-vous pour eux-mêmes: allez directement aux recommandations de dentistes
  - POSEZ 2-5 QUESTIONS PERTINENTES pour mieux comprendre les besoins du patient
- TOUJOURS permettre au patient de continuer à parler s'il veut fournir plus d'informations
- NE PAS détecter les urgences - traiter tous les cas comme des consultations régulières
- TOUJOURS recommander un dentiste spécifique basé sur leurs services et les besoins du patient
- Tous les rendez-vous disponibles de 9h00 à 17h00

GESTION DES RENDEZ-VOUS:
- Pour modifier des rendez-vous: "Vous pouvez consulter et modifier vos rendez-vous dans la liste en haut"
- Pour annuler: "Allez dans votre liste de rendez-vous pour annuler"
- Pour nouveau rendez-vous pour vous-même: passer la sélection patient et aller directement aux recommandations dentistes`,
            
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
EXEMPLES DE LANGAGE PROFESSIONNEL AVEC RECOMMANDATIONS:
- "Bonjour ${user_profile?.first_name}! Comment puis-je vous aider avec vos soins dentaires aujourd'hui?"
- "Pouvez-vous me parler un peu plus de votre problème dentaire?"
- "Pour modifier des rendez-vous, consultez votre liste de rendez-vous en haut"
- "Pour annuler un rendez-vous, allez dans votre liste de rendez-vous"
- RECOMMANDATION: "Selon vos besoins en [service spécifique], je recommande Dr. [Nom] car il/elle se spécialise en [domaine] et serait parfait(e) pour votre situation."
- "Y a-t-il autre chose que vous aimeriez me dire concernant votre situation dentaire?"`
          };
          
        default: // English
          return {
            persona: `You are DentiBot, a professional English dental virtual assistant. You know the patient ${user_profile?.first_name} ${user_profile?.last_name} and can help them book, reschedule, or cancel appointments.`,
            guidelines: `
IMPORTANT INSTRUCTIONS:
- You know the patient: ${user_profile?.first_name} ${user_profile?.last_name}
- For rescheduling/canceling appointments: direct them to the appointments list
- If they ask for an appointment for themselves: skip patient selection and go directly to dentist recommendations
  - ASK 2-5 RELEVANT QUESTIONS to better understand the patient's needs
- ALWAYS allow the patient to continue speaking if they want to provide more information
- DO NOT detect emergencies - treat all cases as regular consultations
- ALWAYS recommend a specific dentist based on their services and the patient's needs
- All appointments are available from 9:00 AM to 5:00 PM

APPOINTMENT MANAGEMENT:
- For rescheduling appointments: "You can view and reschedule your appointments in the appointments list above"
- For canceling: "Go to your appointments list to cancel appointments"
- For new appointment for yourself: skip patient selection and go directly to dentist recommendations`,
            
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
PROFESSIONAL LANGUAGE EXAMPLES WITH RECOMMENDATIONS:
- "Good day ${user_profile?.first_name}! How can I help you with your dental care today?"
- "Can you tell me more about your dental concern?"
- "To reschedule appointments, check your appointments list above"
- "To cancel an appointment, go to your appointments list"
- RECOMMENDATION: "Based on your needs for [specific service], I recommend Dr. [Name] because they specialize in [area] and would be perfect for your situation."
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
${patient_context.medical_history.map((record: any) => `
- Date: ${record.visit_date}
- Type: ${record.record_type}
- Title: ${record.title}
- Description: ${record.description || 'No description'}
- Findings: ${record.findings || 'No findings recorded'}
- Recommendations: ${record.recommendations || 'No recommendations'}
`).join('\n')}` : 'No previous medical records found'}

${patient_context?.notes?.length > 0 ? `
Clinical Notes:
${patient_context.notes.map((note: any) => `
- Date: ${note.created_at}
- Note: ${note.content}
`).join('\n')}` : 'No clinical notes found'}

${patient_context?.treatment_plans?.length > 0 ? `
Treatment Plans:
${patient_context.treatment_plans.map((plan: any) => `
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

      systemPrompt = [
        content.persona,
        content.guidelines,
        content.dentists,
        content.examples,
        `Patient Information: ${JSON.stringify(user_profile)}`,
        `Conversation History:\n${conversation_history.map((msg: any) => (msg.is_bot ? 'Assistant' : 'Patient') + ': ' + msg.message).join('\n')}`
      ].join('\n\n');
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(conversation_history || []).map((msg: any) => ({
        role: msg.is_bot || msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.message || msg.content
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
    console.log('OpenAI response received');

    let result = data.choices[0].message.content;

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

    const consultationReason = extractConsultationReason(message, conversation_history);

    // Enhanced keyword-based suggestions and recommendations
    const suggestions = [];
    const lowerResponse = botResponse.toLowerCase();
    const lowerMessage = message.toLowerCase();
    
    // Check for appointment management requests
    if (lowerMessage.includes('reschedule') || lowerMessage.includes('change') || 
        lowerMessage.includes('modify') || lowerMessage.includes('reprogrammer') || 
        lowerMessage.includes('changer') || lowerMessage.includes('modifier') ||
        lowerMessage.includes('verschuiven') || lowerMessage.includes('wijzigen')) {
      suggestions.push('appointments-list');
    }
    
    if (lowerMessage.includes('cancel') || lowerMessage.includes('delete') || 
        lowerMessage.includes('remove') || lowerMessage.includes('annuler') || 
        lowerMessage.includes('supprimer') || lowerMessage.includes('annuleren') ||
        lowerMessage.includes('verwijderen')) {
      suggestions.push('appointments-list');
    }
    
    // Check for new appointment requests for themselves
    if ((lowerMessage.includes('appointment for me') || lowerMessage.includes('book for myself') ||
        lowerMessage.includes('rendez-vous pour moi') || lowerMessage.includes('afspraak voor mij')) ||
        (lowerMessage.includes('book') && lowerMessage.includes('appointment') && 
         !lowerMessage.includes('for someone') && !lowerMessage.includes('for my'))) {
      suggestions.push('skip-patient-selection');
    }
    
    // Extract dentist recommendations from response (improved matching for multiple dentists)
    let recommendedDentists = [];
    if (lowerResponse.includes('virginie pauwels') || lowerResponse.includes('dr. virginie')) {
      recommendedDentists.push('Virginie Pauwels');
    }
    if (lowerResponse.includes('emeline hubin') || lowerResponse.includes('dr. emeline')) {
      recommendedDentists.push('Emeline Hubin');
    }
    if (lowerResponse.includes('firdaws benhsain') || lowerResponse.includes('dr. firdaws')) {
      recommendedDentists.push('Firdaws Benhsain');
    }
    if (lowerResponse.includes('justine peters') || lowerResponse.includes('dr. justine')) {
      recommendedDentists.push('Justine Peters');
    }
    if (lowerResponse.includes('anne-sophie haas') || lowerResponse.includes('dr. anne-sophie')) {
      recommendedDentists.push('Anne-Sophie Haas');
    }
    
    // Limit to maximum 2 recommendations
    const recommendedDentist = recommendedDentists.slice(0, 2);
    
    // Detect patient selection responses (when bot asked who the appointment is for)
    if (lowerMessage.includes('moi') || lowerMessage.includes('me') || 
        lowerMessage.includes('myself') || lowerMessage.includes('voor mij') ||
        lowerMessage.includes('for me')) {
      suggestions.push('skip-patient-selection');
    } else if (lowerMessage.includes('ma fille') || lowerMessage.includes('mon fils') ||
               lowerMessage.includes('my daughter') || lowerMessage.includes('my son') ||
               lowerMessage.includes('mijn dochter') || lowerMessage.includes('mijn zoon') ||
               /\d+\s*(ans|years|jaar)/.test(lowerMessage) ||
               lowerMessage.includes('ma femme') || lowerMessage.includes('mon mari') ||
               lowerMessage.includes('my wife') || lowerMessage.includes('my husband')) {
      suggestions.push('skip-patient-selection');
    }

    // Suggest recommend-dentist for recommendations instead of direct booking
    if (recommendedDentist.length > 0 && !suggestions.includes('skip-patient-selection')) {
      suggestions.push('recommend-dentist');
    } else if (recommendedDentist.length > 0 && suggestions.includes('skip-patient-selection')) {
      // If we have both a recommendation and patient info, go directly to dentist selection
      suggestions.push('skip-patient-selection');
    } else if (lowerResponse.includes('dentist') ||
        lowerResponse.includes('appointment') || lowerResponse.includes('booking') ||
        lowerResponse.includes('rendez-vous')) {
      suggestions.push('booking');
    }

    // Detect language change requests
    if (lowerMessage.includes('change') && lowerMessage.includes('language')) {
      if (lowerMessage.includes('english') || lowerMessage.includes('anglais')) {
        suggestions.push('language-en');
      } else if (lowerMessage.includes('french') || lowerMessage.includes('francais') || lowerMessage.includes('français')) {
        suggestions.push('language-fr');
      } else if (lowerMessage.includes('dutch') || lowerMessage.includes('nederlands')) {
        suggestions.push('language-nl');
      } else {
        suggestions.push('language-options');
      }
    }

    // Detect theme change requests
    if (lowerMessage.includes('dark mode') || (lowerMessage.includes('dark') && lowerMessage.includes('theme'))) {
      suggestions.push('theme-dark');
    } else if (lowerMessage.includes('light mode') || (lowerMessage.includes('light') && lowerMessage.includes('theme'))) {
      suggestions.push('theme-light');
    } else if (lowerMessage.includes('theme')) {
      suggestions.push('theme-options');
    }
    
    // No emergency detection - treat all cases as regular consultations
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