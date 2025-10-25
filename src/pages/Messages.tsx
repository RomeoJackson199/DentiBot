import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Users } from 'lucide-react';
import { ConversationList } from '@/components/messaging/ConversationList';
import { ChatWindow } from '@/components/messaging/ChatWindow';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Messages() {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<{
    id: string;
    name: string;
    businessId: string;
  } | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  if (!currentUserId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-subtle">
        {!selectedRecipient ? (
          <div className="p-4">
            <div className="mb-4">
              <h1 className="text-2xl font-bold">Messages</h1>
              <p className="text-muted-foreground">Chat with your dentist or patients</p>
            </div>
            <ConversationList
              currentUserId={currentUserId}
              onSelectRecipient={setSelectedRecipient}
            />
          </div>
        ) : (
          <ChatWindow
            currentUserId={currentUserId}
            recipient={selectedRecipient}
            onBack={() => setSelectedRecipient(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-text bg-clip-text text-transparent">
            Messages
          </h1>
          <p className="text-muted-foreground mt-1">
            Communicate with your dentist or patients
          </p>
        </div>

        <Card className="overflow-hidden">
          <div className="grid grid-cols-12 h-[calc(100vh-16rem)]">
            <div className="col-span-4 border-r border-border">
              <ConversationList
                currentUserId={currentUserId}
                onSelectRecipient={setSelectedRecipient}
              />
            </div>
            <div className="col-span-8">
              {selectedRecipient ? (
                <ChatWindow
                  currentUserId={currentUserId}
                  recipient={selectedRecipient}
                  onBack={null}
                />
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
