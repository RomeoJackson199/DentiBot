import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";
import type { UserProfile } from "@/types/common";
import { logger } from '@/lib/logger';

/**
 * Generate a detailed symptom summary for the dentist using the dental AI function.
 * This creates a comprehensive summary of patient symptoms, concerns, and relevant details.
 */
export const generateSymptomSummary = async (
  messages: ChatMessage[],
  userProfile: UserProfile
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('dental-ai-chat', {
      body: {
        message: 'Based on the entire conversation, create a detailed clinical summary for the dentist. Include: 1) Chief complaint and symptoms, 2) Duration and severity, 3) Any relevant medical history mentioned, 4) Patient concerns and questions, 5) Urgency level. Format it in clear paragraphs suitable for a dental professional.',
        conversation_history: messages,
        user_profile: userProfile,
      },
    });
    if (error) throw error;
    return (data.response || data.fallback_response || 'Patient expressed dental concerns during intake conversation.').trim();
  } catch (err) {
    console.error('Error generating symptom summary:', err);
    return 'Patient expressed dental concerns during intake conversation.';
  }
};

/**
 * Generate a concise appointment reason (2-5 words) from chat conversation.
 */
export const generateAppointmentReason = async (
  messages: ChatMessage[],
  userProfile: UserProfile
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('dental-ai-chat', {
      body: {
        message: 'Based on this conversation, generate a very concise appointment reason in 2-5 words (e.g., "Tooth pain", "Routine checkup", "Crown replacement"). Only return the reason, nothing else.',
        conversation_history: messages,
        user_profile: userProfile,
      },
    });
    if (error) throw error;
    const reason = (data.response || data.fallback_response || '').trim();
    return reason || 'General consultation';
  } catch (err) {
    console.error('Error generating appointment reason:', err);
    return 'General consultation';
  }
};
