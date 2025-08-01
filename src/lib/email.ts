import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";

/**
 * Send a consultation summary email to the dentist.
 * Returns the generated patient ID used in the email.
 */
export const sendEmailSummary = async (
  userId: string,
  messages: ChatMessage[],
  photoUrl?: string,
  appointmentData?: any,
  urgencyLevel?: string
): Promise<string | undefined> => {
  const recentMessages = messages.slice(-10);
  const chatSummary = recentMessages
    .map((msg) => `${msg.is_bot ? "DentiBot" : "Patient"}: ${msg.message}`)
    .join("\n\n");

  const { data, error } = await supabase.functions.invoke('send-patient-email', {
    body: {
      userId,
      chatSummary,
      photoUrl,
      appointmentData,
      urgencyLevel,
    },
  });

  if (error) throw error;
  return data.patientId as string | undefined;
};
