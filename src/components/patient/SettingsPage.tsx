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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export interface SettingsPageProps {
  user: User;
}

const SECTIONS = [
  'Profile & Personal Info',
  'Medical & Insurance Info',
  'Preferences',
  'Security',
  'Linked Accounts',
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
  const [medical, setMedical] = useState({ allergies: '', notes: '' });

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
          <ProfileForm profile={profile} setProfile={setProfile} onSave={handleSave} saving={saving} email={user.email || ''} />
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="medical">
        <AccordionTrigger>Medical & Insurance Info</AccordionTrigger>
        <AccordionContent>
          <MedicalForm medical={medical} setMedical={setMedical} onSave={() => {}} />
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
      <AccordionItem value="linked">
        <AccordionTrigger>Linked Accounts</AccordionTrigger>
        <AccordionContent>
          <LinkedAccounts />
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
          <ProfileForm profile={profile} setProfile={setProfile} onSave={handleSave} saving={saving} email={user.email || ''} />
        )}
        {active === 'Medical & Insurance Info' && (
          <MedicalForm medical={medical} setMedical={setMedical} onSave={() => {}} />
        )}
        {active === 'Preferences' && (
          <Preferences theme={theme} setTheme={setTheme} />
        )}
        {active === 'Security' && <Security />}
        {active === 'Linked Accounts' && <LinkedAccounts />}
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
}

const ProfileForm: React.FC<ProfileFormProps> = ({ email, profile, setProfile, onSave, saving }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile & Personal Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        <div className="flex justify-end">
          <Button onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface MedicalFormProps {
  medical: { allergies: string; notes: string };
  setMedical: (m: { allergies: string; notes: string }) => void;
  onSave: () => void;
}

const MedicalForm: React.FC<MedicalFormProps> = ({ medical, setMedical }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Medical & Insurance Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label>Mutuality / Insurance</Label>
          <Input placeholder="Provider name / Policy" />
        </div>
        <div>
          <Label>Allergies</Label>
          <Textarea value={medical.allergies} onChange={(e) => setMedical({ ...medical, allergies: e.target.value })} />
        </div>
        <div>
          <Label>Medical Notes</Label>
          <Textarea value={medical.notes} onChange={(e) => setMedical({ ...medical, notes: e.target.value })} />
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
  const { toast } = useToast();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Security</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label>Change Password</Label>
            <div className="mt-2 flex gap-2">
              <Input type="password" placeholder="New password" />
              <Button>Update</Button>
            </div>
          </div>
          <div>
            <Label>Two-Factor Authentication</Label>
            <div className="mt-2 flex items-center gap-4">
              <Switch 
                checked={false}
                onCheckedChange={(checked) => {
                  if (checked) {
                    toast({
                      title: "2FA Setup",
                      description: "Two-factor authentication setup will be available soon. Your account is currently protected by secure password authentication.",
                    });
                  }
                }}
              />
              <div className="text-sm text-muted-foreground">
                Enhance your account security with 2FA
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const LinkedAccounts: React.FC = () => {
  const { toast } = useToast();
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Linked Accounts</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center text-white text-sm">
                G
              </div>
              <div>
                <div className="font-medium">Google Account</div>
                <div className="text-sm text-muted-foreground">Not connected</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast({
                title: "Google Integration",
                description: "Google account linking will be available in a future update.",
              })}
            >
              Connect
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white text-sm">
                F
              </div>
              <div>
                <div className="font-medium">Facebook Account</div>
                <div className="text-sm text-muted-foreground">Not connected</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast({
                title: "Facebook Integration",
                description: "Facebook account linking will be available in a future update.",
              })}
            >
              Connect
            </Button>
          </div>
          
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white text-sm">
                A
              </div>
              <div>
                <div className="font-medium">Apple ID</div>
                <div className="text-sm text-muted-foreground">Not connected</div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => toast({
                title: "Apple Integration",
                description: "Apple ID linking will be available in a future update.",
              })}
            >
              Connect
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-muted-foreground border-t pt-4">
          <div className="font-medium mb-2">Connected Devices</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Current Device (Web Browser)</span>
              <Badge variant="secondary">Active</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
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