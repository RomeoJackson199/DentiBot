export interface ChatMessage {
  id: string;
  session_id: string;
  user_id?: string;
  message: string;
  is_bot: boolean;
  message_type: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}