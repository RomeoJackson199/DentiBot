import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";

/**
 * Generate a short symptom description using the dental AI function.
 */
export const generateSymptomSummary = async (
  messages: ChatMessage[],
  userProfile: any
): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('dental-ai-chat', {
      body: {
        message: 'Summarize the patient symptoms in one or two sentences.',
        conversation_history: messages,
        user_profile: userProfile,
      },
    });
    if (error) throw error;
    return (data.response || data.fallback_response || '').trim();
  } catch (err) {
    console.error('Error generating symptom summary:', err);
    return '';
  }
};
