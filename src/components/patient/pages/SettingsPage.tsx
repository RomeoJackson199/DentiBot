import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LanguageSettings } from "@/components/LanguageSettings";
import { useLanguage } from "@/hooks/useLanguage";
import { useTheme } from "next-themes";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ProfileData, loadProfileData, saveProfileData, testDatabaseConnection } from "@/lib/profileUtils";
import { Globe, Sun, Moon, User as UserIcon, Heart, Download, Trash2, LogOut } from "lucide-react";

interface SettingsPageProps {
  user: User;
}

type TabType = 'languages' | 'theme' | 'personal';

export const SettingsPage: React.FC<SettingsPageProps> = ({ user }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('personal');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    first_name: '',
    last_name: '',
    phone: '',
    date_of_birth: '',
    medical_history: '',
    address: '',
    emergency_contact: '',
    ai_opt_out: false,
  });

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await loadProfileData(user);
        setProfile(data);
      } catch (error) {
        toast({ title: "Error", description: "Failed to load profile data", variant: "destructive" });
      }
    };
    fetch();
  }, [user, toast]);

  const handleSave = async () => {
    setLoading(true);
    try {
      await saveProfileData(user, profile);
      toast({ title: "Saved", description: "Your information has been updated" });
    } catch (error) {
      toast({ title: "Error", description: "Could not save your information", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadData = async () => {
    const { data: prof } = await supabase.from('profiles').select('id,*').eq('user_id', user.id).single();
    const profileId = (prof as any)?.id;
    const { data: appointments } = profileId ? await supabase.from('appointments').select('*').eq('patient_id', profileId) : { data: [] } as any;
    const { data: notes } = profileId ? await supabase.from('notes').select('*').eq('patient_id', profileId) : { data: [] } as any;
    const exportData = { profile: prof, appointments, notes };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'dentibot_data.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(t.deleteAccountConfirm);
    if (!confirmed) return;
    const { data: prof } = await supabase.from('profiles').select('id').eq('user_id', user.id).single();
    const profileId = (prof as any)?.id;
    if (profileId) {
      await supabase.from('appointments').delete().eq('patient_id', profileId);
      await supabase.from('notes').delete().eq('patient_id', profileId);
      await supabase.from('profiles').delete().eq('user_id', user.id);
    }
    await supabase.auth.signOut();
    toast({ title: t.deleteAccount, description: 'Your account has been deleted.' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your personal information, preferences, and privacy</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-6">
            <Button variant={activeTab === 'personal' ? 'default' : 'outline'} onClick={() => setActiveTab('personal')} className="gap-2">
              <UserIcon className="h-4 w-4" /> Personal
            </Button>
            <Button variant={activeTab === 'languages' ? 'default' : 'outline'} onClick={() => setActiveTab('languages')} className="gap-2">
              <Globe className="h-4 w-4" /> Languages
            </Button>
            <Button variant={activeTab === 'theme' ? 'default' : 'outline'} onClick={() => setActiveTab('theme')} className="gap-2">
              <Sun className="h-4 w-4" /> Theme
            </Button>
          </div>

          {activeTab === 'languages' && (
            <div className="space-y-4">
              <LanguageSettings />
            </div>
          )}

          {activeTab === 'theme' && (
            <div className="space-y-4">
              <div className="flex gap-3">
                <Button variant={theme === 'light' ? 'default' : 'outline'} onClick={() => setTheme('light')} className="gap-2">
                  <Sun className="h-4 w-4" /> Light
                </Button>
                <Button variant={theme === 'dark' ? 'default' : 'outline'} onClick={() => setTheme('dark')} className="gap-2">
                  <Moon className="h-4 w-4" /> Dark
                </Button>
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" value={profile.first_name} onChange={(e) => setProfile(prev => ({ ...prev, first_name: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" value={profile.last_name} onChange={(e) => setProfile(prev => ({ ...prev, last_name: e.target.value }))} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={profile.phone} onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))} />
                </div>
                <div>
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input id="dob" type="date" value={profile.date_of_birth} onChange={(e) => setProfile(prev => ({ ...prev, date_of_birth: e.target.value }))} />
                </div>
              </div>

              <div>
                <Label htmlFor="address">Address</Label>
                <Input id="address" value={profile.address} onChange={(e) => setProfile(prev => ({ ...prev, address: e.target.value }))} />
              </div>

              <div>
                <Label htmlFor="emergency">Emergency Contact</Label>
                <Input id="emergency" value={profile.emergency_contact} onChange={(e) => setProfile(prev => ({ ...prev, emergency_contact: e.target.value }))} />
              </div>

              <div>
                <Label htmlFor="history" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" /> Medical History
                </Label>
                <Textarea id="history" value={profile.medical_history} onChange={(e) => setProfile(prev => ({ ...prev, medical_history: e.target.value }))} />
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save'}</Button>
                <Button variant="outline" onClick={async () => { await testDatabaseConnection(); toast({ title: 'DB OK' }); }}>Test Connection</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={handleDownloadData} className="gap-2">
            <Download className="h-4 w-4" /> {t.downloadMyData}
          </Button>
          <Button variant="destructive" onClick={handleDeleteAccount} className="gap-2">
            <Trash2 className="h-4 w-4" /> {t.deleteAccount}
          </Button>
          <Button variant="destructive" onClick={async () => { await supabase.auth.signOut(); toast({ title: t.signOut }); }} className="gap-2">
            <LogOut className="h-4 w-4" /> {t.signOut}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};