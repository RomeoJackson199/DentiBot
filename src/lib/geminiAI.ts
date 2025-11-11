import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/integrations/supabase/client';
import { getCurrentBusinessId } from '@/lib/businessScopedSupabase';
import { TimeSlot } from './appointmentAvailability';
import { getSlotUsageStatistics, getUnderutilizedSlots, SlotUsageStats } from './slotUsageTracking';
import { PatientPreferences } from './smartScheduling';
import { format, getDay } from 'date-fns';
import type {
  IntakeAIRequest,
  IntakeAIResponse,
  Symptom,
  IntakeStatus,
  DentistMatchingRequest,
  DentistMatchingResponse,
  DentistInfo,
  DentistMatchResult,
  UrgencyAssessment,
  ChatMessage
} from '@/types/intake';

// Initialize Gemini AI
const getGeminiAI = () => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured. Please add it to your .env file.');
  }
  return new GoogleGenerativeAI(apiKey);
};

export interface GeminiSlotRecommendation {
  time: string;
  score: number; // 0-100
  reasons: string[];
  aiReasoning: string;
  isUnderutilized: boolean;
  bookingRate: number;
  shouldPromote: boolean; // AI decision to actively promote this slot
}

export interface GeminiAnalysis {
  recommendations: GeminiSlotRecommendation[];
  summary: string;
  distributionStrategy: string;
  balanceScore: number;
}

/**
 * Uses Gemini AI to analyze appointment patterns and recommend slots
 * This is the REAL AI making intelligent decisions about slot distribution
 */
export async function getGeminiSlotRecommendations(
  dentistId: string,
  patientId: string,
  date: Date,
  availableSlots: TimeSlot[],
  patientPreferences: PatientPreferences | null
): Promise<GeminiAnalysis> {
  const dayOfWeek = getDay(date);
  let slotStats: SlotUsageStats[] = [];

  try {
    // Get slot usage statistics
    slotStats = await getSlotUsageStatistics(dentistId);
    const underutilizedSlots = await getUnderutilizedSlots(dentistId, 50);

    // Prepare data for Gemini
    const dayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek];

    // Build context for AI
    const context = buildGeminiContext(
      availableSlots,
      slotStats,
      underutilizedSlots,
      patientPreferences,
      dayName
    );

    // Call Gemini AI
    const genAI = getGeminiAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are an AI scheduling assistant for a dental practice. Your goal is to help BALANCE the dentist's schedule by promoting time slots that are booked LESS frequently.

**Current Situation:**
${context}

**Your Task:**
Analyze the available time slots and recommend which ones to promote to the patient. Focus on:
1. **Under-utilized slots** (booking rate < 50%) should be PRIORITIZED and promoted
2. **Balance** - help distribute appointments more evenly throughout the day/week
3. **Patient preferences** - consider what times the patient usually prefers, but gently guide them toward under-utilized slots if possible
4. **Practical considerations** - some slots are naturally less popular (very early, late) so be realistic

**Output Format (JSON):**
{
  "recommendations": [
    {
      "time": "09:00",
      "score": 85,
      "reasons": ["Under-utilized slot", "Good for patients", "Helps balance schedule"],
      "aiReasoning": "This 9 AM slot is rarely booked (only 25% utilization) and would help balance your schedule. It's a good morning time that most patients find convenient.",
      "shouldPromote": true
    }
  ],
  "summary": "Your dentist's schedule shows that morning slots are under-utilized. I'm recommending these times to help balance the schedule.",
  "distributionStrategy": "Focus on promoting morning appointments (9-11 AM) which have low booking rates.",
  "balanceScore": 65
}

**Important:**
- Score slots from 0-100 (higher = better for schedule balance)
- Give HIGHER scores to under-utilized slots (they need promotion)
- Be persuasive but honest in your reasoning
- Provide 3-5 top recommendations
- Include at least one under-utilized slot in top 3 if available`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const aiAnalysis = JSON.parse(jsonMatch[0]);

    // Enrich recommendations with actual slot data
    const enrichedRecommendations = aiAnalysis.recommendations.map((rec: any) => {
      const slot = availableSlots.find(s => s.time === rec.time);
      const stats = slotStats.find(s => s.time_slot === rec.time && s.day_of_week === dayOfWeek);

      return {
        ...rec,
        isUnderutilized: stats ? stats.recent_booking_rate < 50 : false,
        bookingRate: stats ? stats.recent_booking_rate : 0,
        available: slot?.available || false
      };
    });

    // Log this AI recommendation for learning
    await logAIRecommendation(
      patientId,
      dentistId,
      date,
      enrichedRecommendations,
      aiAnalysis.summary
    );

    return {
      recommendations: enrichedRecommendations,
      summary: aiAnalysis.summary,
      distributionStrategy: aiAnalysis.distributionStrategy,
      balanceScore: aiAnalysis.balanceScore
    };

  } catch (error) {
    console.error('Error getting Gemini recommendations:', error);

    // Fallback to rule-based if AI fails
    return getFallbackRecommendations(availableSlots, dayOfWeek, slotStats);
  }
}

/**
 * Builds context string for Gemini AI
 */
function buildGeminiContext(
  availableSlots: TimeSlot[],
  slotStats: SlotUsageStats[],
  underutilizedSlots: any[],
  patientPreferences: PatientPreferences | null,
  dayName: string
): string {
  const availableTimes = availableSlots
    .filter(s => s.available)
    .map(s => s.time)
    .join(', ');

  const underutilizedInfo = underutilizedSlots
    .slice(0, 5)
    .map(s => `${s.time_slot} (${s.recent_booking_rate.toFixed(1)}% booked)`)
    .join(', ');

  const preferredTimes = patientPreferences?.preferred_time_of_day?.join(', ') || 'no preference';

  const statsOverview = slotStats.length > 0
    ? `Average booking rate: ${(slotStats.reduce((sum, s) => sum + s.recent_booking_rate, 0) / slotStats.length).toFixed(1)}%`
    : 'No historical data yet';

  return `
**Day:** ${dayName}
**Available Times:** ${availableTimes}
**Under-utilized Slots (need promotion):** ${underutilizedInfo || 'None identified yet'}
**Patient Usually Prefers:** ${preferredTimes}
**Overall Statistics:** ${statsOverview}
**Number of tracked slots:** ${slotStats.length}
`;
}

/**
 * Fallback recommendations if AI fails
 */
function getFallbackRecommendations(
  availableSlots: TimeSlot[],
  dayOfWeek: number,
  slotStats: SlotUsageStats[]
): GeminiAnalysis {
  const recommendations = availableSlots
    .filter(slot => slot.available)
    .map(slot => {
      const stats = slotStats.find(s =>
        s.time_slot === slot.time && s.day_of_week === dayOfWeek
      );

      const isUnderutilized = stats ? stats.recent_booking_rate < 50 : false;
      const bookingRate = stats ? stats.recent_booking_rate : 0;

      // Parse hour from time string (e.g., "09:00" -> 9)
      const hour = parseInt(slot.time.split(':')[0], 10);

      // If no historical data, use time-of-day heuristics
      let score = 50;
      let reasons: string[] = [];
      let shouldPromote = false;

      if (isUnderutilized) {
        // Has stats and is underutilized
        score = 80;
        reasons = ['Under-utilized time slot', 'Helps balance schedule'];
        shouldPromote = true;
      } else if (!stats) {
        // No historical data - use smart defaults based on time of day
        if (hour >= 9 && hour <= 11) {
          // Morning slots are generally popular
          score = 75;
          reasons = ['Popular morning time', 'Good for most patients'];
          shouldPromote = true;
        } else if (hour >= 14 && hour <= 16) {
          // Early afternoon is also good
          score = 70;
          reasons = ['Convenient afternoon time', 'Good availability'];
          shouldPromote = true;
        } else if (hour >= 8 && hour < 9) {
          // Early morning
          score = 60;
          reasons = ['Early morning slot', 'Beat the rush'];
          shouldPromote = false;
        } else if (hour >= 16 && hour < 18) {
          // Late afternoon
          score = 65;
          reasons = ['After-work hours', 'Convenient for working professionals'];
          shouldPromote = false;
        } else {
          score = 50;
          reasons = ['Available slot'];
          shouldPromote = false;
        }
      } else {
        // Has stats but well-utilized
        score = 50;
        reasons = ['Available slot'];
        shouldPromote = false;
      }

      return {
        time: slot.time,
        score,
        reasons,
        aiReasoning: shouldPromote
          ? `This ${slot.time} slot is recommended based on scheduling patterns and is a convenient time for most patients.`
          : `This is an available time slot.`,
        isUnderutilized,
        bookingRate,
        shouldPromote
      };
    })
    .sort((a, b) => b.score - a.score);

  // Ensure at least top 3 slots are promoted if we have that many
  const promotedCount = recommendations.filter(r => r.shouldPromote).length;
  if (promotedCount === 0 && recommendations.length > 0) {
    // Force promote top 3 slots
    recommendations.slice(0, Math.min(3, recommendations.length)).forEach(rec => {
      rec.shouldPromote = true;
      rec.score = Math.max(rec.score, 70);
      if (!rec.reasons.includes('Recommended time')) {
        rec.reasons.unshift('Recommended time');
      }
    });
  }

  return {
    recommendations,
    summary: promotedCount > 0 || recommendations.length > 0
      ? `I've highlighted ${Math.max(promotedCount, Math.min(3, recommendations.length))} time slots that work well based on scheduling patterns.`
      : 'Showing available slots.',
    distributionStrategy: 'Recommending optimal time slots based on time-of-day preferences and scheduling patterns.',
    balanceScore: 50
  };
}

/**
 * Logs AI recommendation to database for learning
 */
async function logAIRecommendation(
  patientId: string,
  dentistId: string,
  date: Date,
  recommendations: GeminiSlotRecommendation[],
  aiReasoning: string
): Promise<string | null> {
  const businessId = await getCurrentBusinessId();

  try {
    const { data, error } = await supabase
      .from('ai_slot_recommendations')
      .insert({
        business_id: businessId,
        patient_id: patientId,
        dentist_id: dentistId,
        recommended_slots: recommendations,
        ai_model_used: 'gemini-pro',
        ai_reasoning: aiReasoning,
        selected_date: format(date, 'yyyy-MM-dd')
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error logging AI recommendation:', error);
      return null;
    }

    return data.id;
  } catch (error) {
    console.error('Error logging AI recommendation:', error);
    return null;
  }
}

/**
 * Updates AI recommendation with user's selection
 */
export async function updateAIRecommendationSelection(
  recommendationId: string,
  selectedTime: string,
  appointmentId: string,
  wasAIRecommended: boolean
): Promise<void> {
  try {
    await supabase
      .from('ai_slot_recommendations')
      .update({
        selected_slot: selectedTime,
        appointment_id: appointmentId,
        was_ai_recommended: wasAIRecommended,
        updated_at: new Date().toISOString()
      })
      .eq('id', recommendationId);
  } catch (error) {
    console.error('Error updating AI recommendation:', error);
  }
}

/**
 * Gets AI recommendation success rate
 */
export async function getAIRecommendationSuccessRate(
  dentistId: string
): Promise<{
  total_recommendations: number;
  accepted_recommendations: number;
  success_rate: number;
  completed_appointments: number;
}> {
  const businessId = await getCurrentBusinessId();

  try {
    const { data, error } = await supabase
      .from('ai_slot_recommendations')
      .select('was_ai_recommended, appointment_completed')
      .eq('business_id', businessId)
      .eq('dentist_id', dentistId);

    if (error || !data) {
      return {
        total_recommendations: 0,
        accepted_recommendations: 0,
        success_rate: 0,
        completed_appointments: 0
      };
    }

    const total = data.length;
    const accepted = data.filter(r => r.was_ai_recommended).length;
    const completed = data.filter(r => r.appointment_completed === true).length;

    return {
      total_recommendations: total,
      accepted_recommendations: accepted,
      success_rate: total > 0 ? (accepted / total) * 100 : 0,
      completed_appointments: completed
    };
  } catch (error) {
    console.error('Error getting AI success rate:', error);
    return {
      total_recommendations: 0,
      accepted_recommendations: 0,
      success_rate: 0,
      completed_appointments: 0
    };
  }
}

/**
 * Simple function to test if Gemini AI is configured
 */
export async function testGeminiConnection(): Promise<{
  success: boolean;
  message: string;
}> {
  try {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      return {
        success: false,
        message: 'VITE_GEMINI_API_KEY is not configured'
      };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const result = await model.generateContent('Say "hello" if you can hear me');
    const response = result.response.text();

    return {
      success: true,
      message: `Gemini AI connected successfully! Response: ${response}`
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to connect to Gemini AI: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

// =====================================================
// AI CONVERSATIONAL INTAKE FUNCTIONS
// =====================================================

/**
 * Processes patient message during intake and determines next steps
 * This is the core AI conversational intake engine
 */
export async function processIntakeConversation(
  request: IntakeAIRequest
): Promise<IntakeAIResponse> {
  try {
    const genAI = getGeminiAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = buildIntakePrompt(request);
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI intake response');
    }

    const aiResponse: IntakeAIResponse = JSON.parse(jsonMatch[0]);

    // Log the intake interaction
    await logIntakeInteraction(request.session_id, request.patient_message, aiResponse);

    return aiResponse;
  } catch (error) {
    console.error('Error processing intake conversation:', error);

    // Fallback response
    return getFallbackIntakeResponse(request);
  }
}

/**
 * Builds the prompt for AI intake conversation
 */
function buildIntakePrompt(request: IntakeAIRequest): string {
  const conversationHistory = request.conversation_history
    .map(msg => `${msg.role === 'user' ? 'Patient' : 'AI'}: ${msg.content}`)
    .join('\n');

  const collectedSymptoms = request.collected_symptoms.length > 0
    ? JSON.stringify(request.collected_symptoms, null, 2)
    : 'None yet';

  return `You are a compassionate dental AI assistant conducting a patient intake interview. Your goal is to:
1. Collect information about the patient's dental concern naturally and conversationally
2. Ask relevant follow-up questions to understand their needs
3. Assess urgency level
4. Build enough information to match them with the right dentist

**Current Intake Step:** ${request.current_step}

**Conversation So Far:**
${conversationHistory}

**Patient's Latest Message:** "${request.patient_message}"

**Symptoms Collected So Far:**
${collectedSymptoms}

**Your Task:**
Based on the patient's message, respond naturally and determine:
1. What symptoms/information can be extracted from their message?
2. What's the urgency level (if assessable)?
3. What question should you ask next?
4. Should we move to the next step of intake?

**Guidelines:**
- Be warm, empathetic, and professional
- Ask ONE question at a time
- For pain: ask about severity (1-10), duration, triggers
- For dental issues: ask when it started, what makes it better/worse
- If they mention multiple issues, prioritize and address systematically
- Assess urgency: emergency (immediate), urgent (24-48hrs), routine (1-2 weeks)
- Once you have enough information (symptoms, urgency), suggest matching with a dentist

**Output Format (JSON):**
{
  "response_message": "Your compassionate response to the patient",
  "extracted_symptoms": [
    {
      "text": "symptom description",
      "category": "pain|bleeding|swelling|sensitivity|cosmetic|broken_tooth|missing_tooth|jaw_issues|gum_issues|routine_checkup|other",
      "severity": 7,
      "duration": "2 days"
    }
  ],
  "urgency_assessment": {
    "score": 8,
    "level": "urgent",
    "reasoning": "Why this urgency level",
    "requires_immediate_care": true,
    "recommended_timeframe": "within 24 hours"
  },
  "next_step": "${getNextStepOptions(request.current_step)}",
  "next_question": "Your next question if needed",
  "should_match_dentist": false,
  "metadata": {
    "confidence": 0.85,
    "reasoning": "Why you're making these decisions"
  }
}

**Important:**
- Extract ALL symptoms mentioned in patient's message
- Only include urgency_assessment if you have enough information
- Set should_match_dentist to true when you have: symptoms + pain level/urgency + basic history
- Be conversational and natural - don't sound robotic
- If patient expresses worry or fear, acknowledge and reassure`;
}

/**
 * Gets valid next steps based on current step
 */
function getNextStepOptions(currentStep: IntakeStatus): string {
  const stepFlow: Record<IntakeStatus, IntakeStatus[]> = {
    'started': ['collecting_symptoms'],
    'collecting_symptoms': ['collecting_symptoms', 'assessing_urgency'],
    'assessing_urgency': ['assessing_urgency', 'collecting_history'],
    'collecting_history': ['collecting_history', 'matching_dentist'],
    'matching_dentist': ['selecting_appointment'],
    'selecting_appointment': ['completed'],
    'completed': ['completed'],
    'abandoned': ['abandoned']
  };

  return stepFlow[currentStep]?.join('|') || currentStep;
}

/**
 * Fallback response if AI fails
 */
function getFallbackIntakeResponse(request: IntakeAIRequest): IntakeAIResponse {
  const responses: Record<IntakeStatus, string> = {
    'started': "Hi! I'm here to help you find the right dentist. Can you tell me what brings you in today?",
    'collecting_symptoms': "I understand. Can you tell me more about your symptoms? For example, when did this start?",
    'assessing_urgency': "On a scale of 1-10, how would you rate your pain or discomfort?",
    'collecting_history': "Have you had any recent dental work or do you have any medical conditions I should know about?",
    'matching_dentist': "Thank you for that information. Let me find the best dentist for your needs.",
    'selecting_appointment': "Great! Let's schedule your appointment.",
    'completed': "Your appointment is confirmed!",
    'abandoned': "Feel free to reach out if you need help."
  };

  return {
    response_message: responses[request.current_step],
    next_step: request.current_step,
    should_match_dentist: false,
    metadata: {
      confidence: 0.5,
      reasoning: 'Fallback response - AI unavailable'
    }
  };
}

/**
 * Logs intake interaction for analytics
 */
async function logIntakeInteraction(
  sessionId: string,
  patientMessage: string,
  aiResponse: IntakeAIResponse
): Promise<void> {
  try {
    // Update the intake session with the latest interaction
    const { error } = await supabase
      .from('ai_intake_sessions')
      .update({
        status: aiResponse.next_step,
        conversation_history: supabase.rpc('jsonb_append', {
          data: {
            role: 'user',
            content: patientMessage,
            timestamp: new Date().toISOString()
          }
        }),
        total_messages: supabase.rpc('increment'),
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error logging intake interaction:', error);
    }
  } catch (error) {
    console.error('Error logging intake interaction:', error);
  }
}

// =====================================================
// AI DENTIST MATCHING FUNCTIONS
// =====================================================

/**
 * Uses AI to match patient with best dentists based on symptoms and needs
 */
export async function matchPatientToDentists(
  request: DentistMatchingRequest
): Promise<DentistMatchingResponse> {
  try {
    const genAI = getGeminiAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = buildDentistMatchingPrompt(request);
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Parse JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI matching response');
    }

    const matchingData = JSON.parse(jsonMatch[0]);

    // Enrich with full dentist info
    const enrichedMatches: DentistMatchResult[] = matchingData.matches.map((match: any) => {
      const dentist = request.available_dentists.find(d => d.id === match.dentist_id);
      return {
        ...match,
        dentist_info: dentist!
      };
    });

    // Log matching results
    await logDentistMatching(request.session_id, enrichedMatches, matchingData.reasoning);

    return {
      matched_dentists: enrichedMatches,
      top_recommendation: enrichedMatches[0],
      matching_summary: matchingData.summary,
      alternative_recommendations: enrichedMatches.slice(1, 4),
      reasoning: matchingData.reasoning
    };
  } catch (error) {
    console.error('Error matching dentists:', error);
    return getFallbackDentistMatching(request);
  }
}

/**
 * Builds the prompt for dentist matching
 */
function buildDentistMatchingPrompt(request: DentistMatchingRequest): string {
  const symptomsText = request.symptoms
    .map(s => `- ${s.text} (${s.category}) - Severity: ${s.severity || 'N/A'}, Duration: ${s.duration || 'N/A'}`)
    .join('\n');

  const dentistsInfo = request.available_dentists.map(d => ({
    id: d.id,
    name: `Dr. ${d.first_name} ${d.last_name}`,
    specializations: d.specializations?.map(s => s.specialization_type).join(', ') || 'General Dentistry',
    experience: d.experience_years || 'N/A',
    languages: d.languages?.join(', ') || 'English',
    bio: d.bio || '',
    next_available: d.next_available_slot || 'Check availability'
  }));

  return `You are an expert dental AI assistant tasked with matching a patient to the best dentist based on their needs.

**Patient Information:**
**Urgency Score:** ${request.urgency_score}/10
**Symptoms:**
${symptomsText}

**Available Dentists:**
${JSON.stringify(dentistsInfo, null, 2)}

**Patient Preferences:**
${JSON.stringify(request.patient_preferences || 'No specific preferences', null, 2)}

**Your Task:**
Analyze the patient's symptoms and urgency level, then match them with the best dentists. Consider:

1. **Specialization Match:** Does the dentist's specialization align with the symptoms?
   - Pain/infection → General or Endodontics
   - Gum issues → Periodontics
   - Broken/missing teeth → Prosthodontics or Oral Surgery
   - Cosmetic concerns → Cosmetic Dentistry
   - Orthodontic needs → Orthodontics
   - Children → Pediatric Dentistry

2. **Urgency Compatibility:** Can they handle the urgency level?
   - Urgent cases (8-10) need emergency care capability
   - High urgency (6-7) need quick availability
   - Routine (1-5) can wait for specialist

3. **Availability:** Sooner available slots score higher for urgent cases

4. **Experience:** More experience with similar cases scores higher

5. **Patient Preferences:** Language, preferred dentist, etc.

**Scoring:**
Rate each dentist 0-100 on:
- Specialization match (0-100)
- Availability match (0-100)
- Patient preference match (0-100)
- Urgency compatibility (0-100)
- Overall match score (weighted average)

**Output Format (JSON):**
{
  "matches": [
    {
      "dentist_id": "uuid",
      "overall_match_score": 92,
      "specialization_match_score": 95,
      "availability_score": 88,
      "patient_preference_score": 90,
      "urgency_compatibility_score": 95,
      "match_reasoning": "Dr. Smith is an excellent match because...",
      "match_highlights": [
        "Specializes in endodontics (root canals)",
        "10+ years experience",
        "Available today",
        "Speaks French"
      ],
      "recommendation_rank": 1,
      "was_shown_to_patient": true,
      "was_selected": false
    }
  ],
  "summary": "Based on your root canal needs and pain level, I recommend Dr. Smith who specializes in endodontics.",
  "reasoning": "Detailed explanation of the matching logic"
}

**Important:**
- Rank dentists from best to worst match
- Provide clear, patient-friendly explanations
- Be honest about why each dentist is a good fit
- Include at least 3 recommendations if available
- For urgent cases, prioritize availability and emergency capability`;
}

/**
 * Fallback dentist matching if AI fails
 */
function getFallbackDentistMatching(request: DentistMatchingRequest): DentistMatchingResponse {
  // Simple rule-based matching
  const matches: DentistMatchResult[] = request.available_dentists.map((dentist, index) => ({
    dentist_id: dentist.id,
    dentist_info: dentist,
    overall_match_score: 75 - (index * 5),
    specialization_match_score: 70,
    availability_score: 75,
    patient_preference_score: 70,
    urgency_compatibility_score: request.urgency_score > 7 ? 90 : 70,
    match_reasoning: `Dr. ${dentist.first_name} ${dentist.last_name} is available to help with your dental needs.`,
    match_highlights: [
      dentist.specializations?.[0]?.specialization_type.replace(/_/g, ' ') || 'General dentistry',
      `${dentist.experience_years || 5}+ years experience`,
      'Available for appointments'
    ],
    recommendation_rank: index + 1,
    was_shown_to_patient: index < 3,
    was_selected: false
  }));

  return {
    matched_dentists: matches,
    top_recommendation: matches[0],
    matching_summary: `I've found ${matches.length} dentists who can help with your dental needs.`,
    alternative_recommendations: matches.slice(1, 4),
    reasoning: 'Matched based on availability and specialization'
  };
}

/**
 * Logs dentist matching results
 */
async function logDentistMatching(
  sessionId: string,
  matches: DentistMatchResult[],
  reasoning: string
): Promise<void> {
  const businessId = await getCurrentBusinessId();

  try {
    // Get the intake session to get the session ID
    const { data: session } = await supabase
      .from('ai_intake_sessions')
      .select('id')
      .eq('session_id', sessionId)
      .single();

    if (!session) return;

    // Insert match results
    const matchRecords = matches.map(match => ({
      business_id: businessId,
      intake_session_id: session.id,
      dentist_id: match.dentist_id,
      overall_match_score: match.overall_match_score,
      specialization_match_score: match.specialization_match_score,
      availability_score: match.availability_score,
      patient_preference_score: match.patient_preference_score,
      urgency_compatibility_score: match.urgency_compatibility_score,
      match_reasoning: match.match_reasoning,
      match_highlights: match.match_highlights,
      recommendation_rank: match.recommendation_rank,
      was_shown_to_patient: match.was_shown_to_patient,
      was_selected: match.was_selected
    }));

    await supabase.from('intake_match_results').insert(matchRecords);
  } catch (error) {
    console.error('Error logging dentist matching:', error);
  }
}

// =====================================================
// APPOINTMENT SUMMARY GENERATION
// =====================================================

/**
 * Generates a comprehensive summary of the intake for the dentist
 */
export async function generateAppointmentSummaryForDentist(
  sessionId: string
): Promise<string> {
  try {
    // Get the full intake session
    const { data: session, error } = await supabase
      .from('ai_intake_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error || !session) {
      throw new Error('Failed to fetch intake session');
    }

    const genAI = getGeminiAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const prompt = `You are creating a professional clinical summary for a dentist based on a patient's AI intake conversation.

**Patient Intake Data:**
${JSON.stringify(session, null, 2)}

**Task:**
Create a concise, professional summary that includes:
1. **Chief Complaint:** Main reason for visit (in patient's words)
2. **Symptoms:** List all symptoms with severity and duration
3. **Urgency Level:** Score and reasoning
4. **Medical History:** Relevant medical information, allergies, medications
5. **Patient Concerns:** Any specific worries or questions mentioned
6. **Recommended Action:** What the dentist should focus on

**Format:**
Use clear, clinical language but maintain the patient's voice in the chief complaint.
Keep it concise (200-300 words) but include all critical information.

**Output:**
Return ONLY the summary text, no JSON or special formatting.`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('Error generating appointment summary:', error);
    return 'Summary generation unavailable. Please review full intake conversation.';
  }
}

/**
 * Assesses urgency from patient symptoms and description
 */
export async function assessUrgency(
  symptoms: Symptom[],
  patientDescription: string
): Promise<UrgencyAssessment> {
  try {
    const genAI = getGeminiAI();
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

    const symptomsText = symptoms.map(s =>
      `${s.text} (severity: ${s.severity}/10, duration: ${s.duration})`
    ).join(', ');

    const prompt = `You are a dental triage AI. Assess the urgency of this patient's situation.

**Symptoms:** ${symptomsText}
**Patient Description:** "${patientDescription}"

**Urgency Levels:**
- 9-10 (Emergency): Severe pain, heavy bleeding, trauma, swelling affecting breathing
- 7-8 (Urgent): Significant pain, infection signs, broken tooth with pain
- 5-6 (High): Moderate pain, sensitivity, minor bleeding
- 3-4 (Medium): Mild discomfort, cosmetic concerns
- 1-2 (Low): Routine checkup, preventive care

**Output Format (JSON):**
{
  "score": 7,
  "level": "urgent",
  "reasoning": "Patient has severe tooth pain (8/10) for 2 days with sensitivity to temperature, indicating possible infection or deep cavity requiring prompt attention.",
  "requires_immediate_care": true,
  "recommended_timeframe": "within 24-48 hours"
}`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();
    const jsonMatch = response.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    throw new Error('Failed to parse urgency assessment');
  } catch (error) {
    console.error('Error assessing urgency:', error);

    // Fallback urgency assessment
    const maxSeverity = Math.max(...symptoms.map(s => s.severity || 5));
    return {
      score: maxSeverity,
      level: maxSeverity >= 7 ? 'urgent' : maxSeverity >= 5 ? 'high' : 'medium',
      reasoning: 'Based on reported symptom severity',
      requires_immediate_care: maxSeverity >= 8,
      recommended_timeframe: maxSeverity >= 7 ? 'within 24-48 hours' : 'within 1-2 weeks'
    };
  }
}
