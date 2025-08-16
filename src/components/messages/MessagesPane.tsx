import { useState } from 'react';
import { MessagesInbox } from './MessagesInbox';
import { ConversationView } from './ConversationView';

export function MessagesPane() {
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  if (activeConversationId) {
    return <ConversationView conversationId={activeConversationId} />;
  }

  return <MessagesInbox onOpenConversation={(id) => setActiveConversationId(id)} />;
}