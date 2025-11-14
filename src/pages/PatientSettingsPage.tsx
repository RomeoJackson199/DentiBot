import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, User, Shield } from 'lucide-react';
import { ReminderPreferences } from '@/components/patient/ReminderPreferences';
import { AnimatedBackground, SectionHeader } from '@/components/ui/polished-components';

export default function PatientSettingsPage() {
  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-gray-50 to-zinc-50 rounded-2xl p-6 border">
        <AnimatedBackground />
        
        <div className="relative z-10">
          <SectionHeader
            icon={User}
            title="Settings"
            description="Manage your account preferences and notification settings"
            gradient="from-slate-600 to-gray-600"
          />
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Profile</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <ReminderPreferences />
        </TabsContent>

        <TabsContent value="profile">
          <div className="text-center py-12 text-muted-foreground">
            Profile settings coming soon
          </div>
        </TabsContent>

        <TabsContent value="security">
          <div className="text-center py-12 text-muted-foreground">
            Security settings coming soon
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
