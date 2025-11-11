/**
 * AI Intake Flow Service
 *
 * Manages the conversational intake flow:
 * - Session management
 * - AI conversation coordination
 * - Dentist matching
 * - State persistence
 * - Widget determination
 */

import { supabase } from '@/integrations/supabase/client';
import { getCurrentBusinessId } from '@/lib/businessScopedSupabase';
import {
  processIntakeConversation,
  matchPatientToDentists,
  generateAppointmentSummaryForDentist,
  assessUrgency
} from '@/lib/geminiAI';
import type {
  IntakeSession,
  IntakeStatus,
  Symptom,
  IntakeAIRequest,
  IntakeAIResponse,
  DentistMatchingRequest,
  DentistMatchingResponse,
  ChatMessage,
  IntakeWidget,
  DentistInfo
} from '@/types/intake';

/**
 * Creates a new intake session
 */
export async function createIntakeSession(
  patientId?: string
): Promise<IntakeSession | null> {
  const businessId = await getCurrentBusinessId();
  const sessionId = `intake_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    const { data, error } = await supabase
      .from('ai_intake_sessions')
      .insert({
        business_id: businessId,
        patient_id: patientId,
        session_id: sessionId,
        status: 'started',
        symptoms_collected: [],
        conversation_history: [],
        ai_questions_asked: [],
        total_messages: 0,
        patient_response_count: 0,
        alternative_dentists_shown: false,
        started_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating intake session:', error);
      return null;
    }

    return data as IntakeSession;
  } catch (error) {
    console.error('Error creating intake session:', error);
    return null;
  }
}

/**
 * Gets an existing intake session
 */
export async function getIntakeSession(
  sessionId: string
): Promise<IntakeSession | null> {
  try {
    const { data, error } = await supabase
      .from('ai_intake_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) {
      console.error('Error fetching intake session:', error);
      return null;
    }

    return data as IntakeSession;
  } catch (error) {
    console.error('Error fetching intake session:', error);
    return null;
  }
}

/**
 * Updates an intake session
 */
export async function updateIntakeSession(
  sessionId: string,
  updates: Partial<IntakeSession>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('ai_intake_sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('session_id', sessionId);

    if (error) {
      console.error('Error updating intake session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating intake session:', error);
    return false;
  }
}

/**
 * Processes a patient message and determines next response
 */
export async function processPatientMessage(
  sessionId: string,
  message: string
): Promise<{
  aiResponse: IntakeAIResponse;
  widget?: IntakeWidget;
  session: IntakeSession;
}> {
  // Get current session
  const session = await getIntakeSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Add patient message to conversation history
  const updatedHistory: ChatMessage[] = [
    ...session.conversation_history,
    {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    }
  ];

  // Prepare AI request
  const aiRequest: IntakeAIRequest = {
    session_id: sessionId,
    patient_message: message,
    conversation_history: updatedHistory,
    current_step: session.status,
    collected_symptoms: session.symptoms_collected,
    business_id: session.business_id
  };

  // Get AI response
  const aiResponse = await processIntakeConversation(aiRequest);

  // Add AI response to conversation history
  updatedHistory.push({
    role: 'assistant',
    content: aiResponse.response_message,
    timestamp: new Date().toISOString()
  });

  // Update symptoms if AI extracted any
  const updatedSymptoms = aiResponse.extracted_symptoms
    ? [...session.symptoms_collected, ...aiResponse.extracted_symptoms]
    : session.symptoms_collected;

  // Update urgency if AI assessed it
  const urgencyUpdate = aiResponse.urgency_assessment
    ? {
        urgency_score: aiResponse.urgency_assessment.score,
        urgency_reasoning: aiResponse.urgency_assessment.reasoning
      }
    : {};

  // Update session in database
  await updateIntakeSession(sessionId, {
    status: aiResponse.next_step,
    conversation_history: updatedHistory,
    symptoms_collected: updatedSymptoms,
    total_messages: session.total_messages + 2, // patient + AI
    patient_response_count: session.patient_response_count + 1,
    ...urgencyUpdate
  });

  // Determine if we should show a widget
  const widget = determineWidget(aiResponse, session);

  // Get updated session
  const updatedSession = await getIntakeSession(sessionId);

  return {
    aiResponse,
    widget,
    session: updatedSession!
  };
}

/**
 * Determines which widget to show based on AI response and session state
 */
function determineWidget(
  aiResponse: IntakeAIResponse,
  session: IntakeSession
): IntakeWidget | undefined {
  const { next_step, extracted_symptoms, urgency_assessment } = aiResponse;

  switch (next_step) {
    case 'collecting_symptoms':
      // Show symptom selector if no symptoms collected yet
      if (session.symptoms_collected.length === 0) {
        return {
          type: 'symptom-selector',
          data: {},
          title: 'What brings you in today?',
          description: 'Select your symptoms'
        };
      }
      // Show pain scale if pain symptom mentioned but no severity
      if (session.symptoms_collected.some(s => s.category === 'pain') && !session.pain_level) {
        return {
          type: 'pain-scale',
          data: {},
          title: 'Rate your pain level'
        };
      }
      break;

    case 'assessing_urgency':
      // Show urgency indicator if assessed
      if (urgency_assessment) {
        return {
          type: 'urgency-assessment',
          data: urgency_assessment,
          title: 'Urgency Assessment'
        };
      }
      break;

    case 'collecting_history':
      // Show medical history form
      return {
        type: 'medical-history',
        data: {},
        title: 'Medical History',
        description: 'Help us provide safer care'
      };

    case 'matching_dentist':
      // Widget will be shown after matching is complete
      return undefined;

    case 'selecting_appointment':
      // Show calendar widget (handled separately)
      return {
        type: 'appointment-calendar',
        data: { dentistId: session.selected_dentist_id },
        title: 'Select Appointment Time'
      };

    default:
      return undefined;
  }
}

/**
 * Performs dentist matching based on collected intake data
 */
export async function performDentistMatching(
  sessionId: string
): Promise<DentistMatchingResponse | null> {
  const session = await getIntakeSession(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Fetch available dentists
  const dentists = await fetchAvailableDentists(session.business_id);
  if (!dentists || dentists.length === 0) {
    console.error('No dentists available');
    return null;
  }

  // Prepare matching request
  const matchingRequest: DentistMatchingRequest = {
    session_id: sessionId,
    symptoms: session.symptoms_collected,
    urgency_score: session.urgency_score || 5,
    available_dentists: dentists,
    business_id: session.business_id,
    patient_preferences: undefined // TODO: Fetch patient preferences
  };

  // Perform AI matching
  const matchingResponse = await matchPatientToDentists(matchingRequest);

  // Update session with matched dentists
  await updateIntakeSession(sessionId, {
    status: 'matching_dentist',
    matched_dentist_ids: matchingResponse.matched_dentists.map(m => m.dentist_id),
    matching_reasoning: matchingResponse.matched_dentists.map(m => ({
      dentist_id: m.dentist_id,
      score: m.overall_match_score,
      reasoning: m.match_reasoning,
      highlights: m.match_highlights,
      specialization_match: {
        matched_categories: [],
        matched_keywords: [],
        confidence: m.specialization_match_score
      },
      availability: {
        earliest_slot: m.dentist_info.next_available_slot || 'Check availability',
        total_available_slots: 0
      }
    }))
  });

  return matchingResponse;
}

/**
 * Fetches available dentists for a business
 */
async function fetchAvailableDentists(businessId: string): Promise<DentistInfo[]> {
  try {
    const { data: dentists, error } = await supabase
      .from('dentists')
      .select(`
        id,
        profile_id,
        specialization,
        profiles!inner (
          id,
          user_id,
          first_name,
          last_name,
          email,
          phone,
          avatar_url
        )
      `)
      .eq('profiles.business_id', businessId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching dentists:', error);
      return [];
    }

    // Fetch specializations for each dentist
    const dentistInfos: DentistInfo[] = await Promise.all(
      (dentists || []).map(async (dentist) => {
        const { data: specializations } = await supabase
          .from('dentist_specializations')
          .select('*')
          .eq('dentist_id', dentist.id);

        const profile = (dentist as any).profiles;

        return {
          id: dentist.id,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
          phone: profile.phone,
          avatar_url: profile.avatar_url,
          specializations: specializations || [],
          bio: '', // TODO: Fetch from profile
          experience_years: 5, // TODO: Fetch from profile
          languages: ['English'], // TODO: Fetch from profile
          next_available_slot: 'tomorrow', // TODO: Calculate from availability
          clinic_address: '' // TODO: Fetch from business
        };
      })
    );

    return dentistInfos;
  } catch (error) {
    console.error('Error fetching dentists:', error);
    return [];
  }
}

/**
 * Selects a dentist and moves to appointment booking
 */
export async function selectDentist(
  sessionId: string,
  dentistId: string
): Promise<boolean> {
  try {
    await updateIntakeSession(sessionId, {
      selected_dentist_id: dentistId,
      status: 'selecting_appointment'
    });

    // Update match results to mark selected dentist
    const session = await getIntakeSession(sessionId);
    if (session) {
      const { data: intakeRecord } = await supabase
        .from('ai_intake_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      if (intakeRecord) {
        await supabase
          .from('intake_match_results')
          .update({ was_selected: true })
          .eq('intake_session_id', intakeRecord.id)
          .eq('dentist_id', dentistId);
      }
    }

    return true;
  } catch (error) {
    console.error('Error selecting dentist:', error);
    return false;
  }
}

/**
 * Marks intake as abandoned
 */
export async function abandonIntake(
  sessionId: string,
  currentStep: IntakeStatus
): Promise<boolean> {
  try {
    await updateIntakeSession(sessionId, {
      status: 'abandoned',
      abandoned_at_step: currentStep
    });
    return true;
  } catch (error) {
    console.error('Error abandoning intake:', error);
    return false;
  }
}

/**
 * Completes the intake session
 */
export async function completeIntake(
  sessionId: string,
  appointmentId: string
): Promise<boolean> {
  try {
    const session = await getIntakeSession(sessionId);
    if (!session) return false;

    const duration = Math.floor(
      (new Date().getTime() - new Date(session.started_at).getTime()) / 1000
    );

    await updateIntakeSession(sessionId, {
      status: 'completed',
      appointment_id: appointmentId,
      completed_at: new Date().toISOString(),
      intake_duration_seconds: duration,
      conversion_score: calculateConversionScore(session)
    });

    // Generate summary for dentist
    const summary = await generateAppointmentSummaryForDentist(sessionId);

    // Store summary with appointment (you may want to add a field to appointments table)
    await supabase
      .from('appointments')
      .update({
        notes: summary
      })
      .eq('id', appointmentId);

    return true;
  } catch (error) {
    console.error('Error completing intake:', error);
    return false;
  }
}

/**
 * Calculates a conversion quality score for the intake
 */
function calculateConversionScore(session: IntakeSession): number {
  let score = 50; // Base score

  // More symptoms collected = better
  score += Math.min(session.symptoms_collected.length * 5, 20);

  // Pain level specified = +10
  if (session.pain_level !== undefined && session.pain_level !== null) {
    score += 10;
  }

  // Urgency assessed = +10
  if (session.urgency_score) {
    score += 10;
  }

  // Medical history collected = +10
  if (session.medical_history_notes || session.allergies?.length || session.current_medications?.length) {
    score += 10;
  }

  // Good conversation engagement (more messages = better)
  if (session.patient_response_count >= 5) {
    score += 10;
  }

  // Dentist selected (not just shown) = +10
  if (session.selected_dentist_id) {
    score += 10;
  }

  return Math.min(score, 100);
}

/**
 * Gets intake session statistics
 */
export async function getIntakeStatistics(
  businessId: string,
  startDate?: Date,
  endDate?: Date
): Promise<{
  total_started: number;
  total_completed: number;
  total_abandoned: number;
  completion_rate: number;
  average_duration: number;
  top_symptoms: { symptom: string; count: number }[];
}> {
  try {
    let query = supabase
      .from('ai_intake_sessions')
      .select('*')
      .eq('business_id', businessId);

    if (startDate) {
      query = query.gte('started_at', startDate.toISOString());
    }
    if (endDate) {
      query = query.lte('started_at', endDate.toISOString());
    }

    const { data: sessions, error } = await query;

    if (error || !sessions) {
      return {
        total_started: 0,
        total_completed: 0,
        total_abandoned: 0,
        completion_rate: 0,
        average_duration: 0,
        top_symptoms: []
      };
    }

    const completed = sessions.filter(s => s.status === 'completed');
    const abandoned = sessions.filter(s => s.status === 'abandoned');

    // Calculate average duration
    const completedDurations = completed
      .map(s => s.intake_duration_seconds)
      .filter(d => d !== null && d !== undefined);
    const avgDuration = completedDurations.length > 0
      ? completedDurations.reduce((a, b) => a + b, 0) / completedDurations.length
      : 0;

    // Count symptoms
    const symptomCounts: Record<string, number> = {};
    sessions.forEach(session => {
      session.symptoms_collected?.forEach((symptom: Symptom) => {
        symptomCounts[symptom.text] = (symptomCounts[symptom.text] || 0) + 1;
      });
    });

    const topSymptoms = Object.entries(symptomCounts)
      .map(([symptom, count]) => ({ symptom, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total_started: sessions.length,
      total_completed: completed.length,
      total_abandoned: abandoned.length,
      completion_rate: sessions.length > 0 ? (completed.length / sessions.length) * 100 : 0,
      average_duration: avgDuration,
      top_symptoms: topSymptoms
    };
  } catch (error) {
    console.error('Error getting intake statistics:', error);
    return {
      total_started: 0,
      total_completed: 0,
      total_abandoned: 0,
      completion_rate: 0,
      average_duration: 0,
      top_symptoms: []
    };
  }
}
