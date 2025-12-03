import React, { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { LanguageSettings } from "@/components/LanguageSettings";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { saveProfileData, loadProfileData, ProfileData } from "@/lib/profileUtils";
import { useToast } from "@/hooks/use-toast";
import { ProfilePictureUpload } from "@/components/ProfilePictureUpload";
import { PatientSecuritySettings } from "@/components/patient/PatientSecuritySettings";

export interface SettingsPageProps {
  user: User;
}

const SECTIONS = [
  'Profile & Personal Info',
  'Preferences',
  'Security',
  'Legal & Support',
] as const;

type Section = typeof SECTIONS[number];

export const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [active, setActive] = useState<Section>('Profile & Personal Info');
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '', last_name: '', phone: '', date_of_birth: '', medical_history: '', address: '', emergency_contact: '', ai_opt_out: false,
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await loadProfileData(user);
        setProfile(data);
      } catch {
        // ignore profile load errors in settings
      }
    })();
  }, [user]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveProfileData(user, profile);
      toast({
        title: "Success",
        description: "Your profile has been saved successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const mobile = (
    <Accordion type="single" collapsible className="md:hidden px-4 py-4">
      <AccordionItem value="profile">
        <AccordionTrigger>Profile & Personal Info</AccordionTrigger>
        <AccordionContent>
          <ProfileForm profile={profile} setProfile={setProfile} onSave={handleSave} saving={saving} email={user.email || ''} userId={user.id} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="preferences">
        <AccordionTrigger>Preferences</AccordionTrigger>
        <AccordionContent>
          <Preferences theme={theme} setTheme={setTheme} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="security">
        <AccordionTrigger>Security</AccordionTrigger>
        <AccordionContent>
          <Security />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="legal">
        <AccordionTrigger>Legal & Support</AccordionTrigger>
        <AccordionContent>
          <LegalSupport />
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  const desktop = (
    <div className="hidden md:flex h-[calc(100vh-56px)]">
      <div className="w-64 border-r border-border p-4 space-y-2">
        {SECTIONS.map(s => (
          <Button key={s} variant={active === s ? 'secondary' : 'ghost'} className="w-full justify-start" onClick={() => setActive(s)}>
            {s}
          </Button>
        ))}
      </div>
      <div className="flex-1 overflow-auto p-4">
        {active === 'Profile & Personal Info' && (
          <ProfileForm profile={profile} setProfile={setProfile} onSave={handleSave} saving={saving} email={user.email || ''} userId={user.id} />
        )}
        {active === 'Preferences' && (
          <Preferences theme={theme} setTheme={setTheme} />
        )}
        {active === 'Security' && <Security />}
        {active === 'Legal & Support' && <LegalSupport />}
      </div>
    </div>
  );

  return (
    <div className="px-4 md:px-6 py-4">
      <h2 className="text-xl font-semibold mb-4">Settings</h2>
      {mobile}
      {desktop}
    </div>
  );
};

interface ProfileFormProps {
  email: string;
  profile: ProfileData;
  setProfile: (p: ProfileData) => void;
  onSave: () => Promise<void> | void;
  saving: boolean;
  userId: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ email, profile, setProfile, onSave, saving, userId }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile & Personal Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ProfilePictureUpload
          currentUrl={profile.profile_picture_url}
          userId={userId}
          onUploadComplete={(url) => setProfile({ ...profile, profile_picture_url: url })}
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>First Name</Label>
            <Input value={profile.first_name} onChange={(e) => setProfile({ ...profile, first_name: e.target.value })} />
          </div>
          <div>
            <Label>Last Name</Label>
            <Input value={profile.last_name} onChange={(e) => setProfile({ ...profile, last_name: e.target.value })} />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
          </div>
          <div>
            <Label>Address</Label>
            <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} />
          </div>
          <div>
            <Label>Date of Birth</Label>
            <Input type="date" value={profile.date_of_birth} onChange={(e) => setProfile({ ...profile, date_of_birth: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Emergency Contact</Label>
            <Input value={profile.emergency_contact} onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Medical History</Label>
          <Textarea value={profile.medical_history} onChange={(e) => setProfile({ ...profile, medical_history: e.target.value })} />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => window.location.reload()}>Reset</Button>
          <Button type="button" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

const Preferences: React.FC<{ theme?: string; setTheme: (t: string) => void; }> = ({ theme, setTheme }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Language</Label>
          <div className="mt-2">
            <LanguageSettings />
          </div>
        </div>
        <div>
          <Label>Theme</Label>
          <div className="mt-2 flex gap-2">
            <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')}>Light</Button>
            <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')}>Dark</Button>
          </div>
        </div>
        <div>
          <Label>Notifications</Label>
          <div className="text-sm text-muted-foreground mt-1">Manage notification settings in your device/system preferences.</div>
        </div>
      </CardContent>
    </Card>
  );
};

const Security: React.FC = () => {
  return <PatientSecuritySettings />;
};

const LegalSupport: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Legal & Support</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span>Privacy Policy</span>
          <Button variant="outline" asChild>
            <a href="/privacy">View</a>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span>Terms of Service</span>
          <Button variant="outline" asChild>
            <a href="/terms">View</a>
          </Button>
        </div>
        <div className="flex items-center justify-between">
          <span>Contact Support</span>
          <Button asChild>
            <a href="/support">Get Help</a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};