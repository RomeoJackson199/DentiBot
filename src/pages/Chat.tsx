import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RealTimeChatSystem } from '@/components/chat/RealTimeChatSystem';
import { PWAFeatures } from '@/components/mobile/PWAFeatures';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Smartphone, Users, Bot } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
import { InteractiveDentalChat } from '@/components/chat/InteractiveDentalChat';

interface ChatParticipant {
  id: string;
  name: string;
  avatar?: string;
  role: 'patient' | 'dentist';
  status: 'online' | 'offline' | 'busy';
  last_seen?: string;
}

export default function Chat() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [selectedParticipant, setSelectedParticipant] = useState<ChatParticipant | undefined>();
  const isMobile = useIsMobile();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      setUser(authUser);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', authUser.id)
        .single();

      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-dental-primary"></div>
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="min-h-screen bg-gradient-subtle p-4">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
            <TabsTrigger value="mobile" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" />
              Mobile
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Messages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RealTimeChatSystem
                  currentUserId={profile.id}
                  currentUserType={profile.role}
                  selectedParticipant={selectedParticipant}
                  onParticipantSelect={setSelectedParticipant}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5" />
                  AI Dental Assistant
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[70vh]">
                  <InteractiveDentalChat user={user} />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mobile" className="space-y-4">
            <PWAFeatures />
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-text bg-clip-text text-transparent">
              Communication Center
            </h1>
            <p className="text-dental-muted-foreground mt-1">
              Chat with {profile.role === 'patient' ? 'your dentist' : 'your patients'} in real-time
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-dental-primary" />
            <span className="text-sm text-dental-muted-foreground">
              {profile.role === 'patient' ? 'Connect with dentists' : 'Manage patient communications'}
            </span>
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Tabs defaultValue="chat" className="w-full">
              <TabsList className="mb-4">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </TabsTrigger>
                <TabsTrigger value="ai" className="flex items-center gap-2">
                  <Bot className="h-4 w-4" />
                  AI Assistant
                </TabsTrigger>
              </TabsList>
              <TabsContent value="chat" className="space-y-4">
                <div className="grid lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-3">
                    <RealTimeChatSystem
                      currentUserId={profile.id}
                      currentUserType={profile.role}
                      selectedParticipant={selectedParticipant}
                      onParticipantSelect={setSelectedParticipant}
                    />
                  </div>
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <Smartphone className="h-5 w-5" />
                          Mobile Features
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <PWAFeatures />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="ai">
                <div className="h-[70vh]">
                  <InteractiveDentalChat user={user} />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}