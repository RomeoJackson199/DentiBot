import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { Download, Trash2, Shield, Eye, EyeOff } from 'lucide-react';

interface PatientSettingsProps {
  user: User | null;
  onAiModeChange?: (enabled: boolean) => void;
}

export const PatientSettings: React.FC<PatientSettingsProps> = ({ user, onAiModeChange }) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiModeEnabled, setAiModeEnabled] = useState(true);
  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    appointments: true,
    prescriptions: true
  });

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const updateProfile = async (updates: any) => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('user_id', user.id);

      if (error) throw error;
      
      setProfile({ ...profile, ...updates });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update profile.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = async () => {
    if (!user) return;
    
    try {
      // Get all user data
      const [profileData, appointmentsData, prescriptionsData, medicalRecordsData] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id),
        supabase.from('appointments').select('*').eq('patient_id', profile?.id),
        supabase.from('prescriptions').select('*').eq('patient_id', profile?.id),
        supabase.from('medical_records').select('*').eq('patient_id', profile?.id)
      ]);

      const exportData = {
        profile: profileData.data,
        appointments: appointmentsData.data,
        prescriptions: prescriptionsData.data,
        medicalRecords: medicalRecordsData.data,
        exportDate: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `my-medical-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported",
        description: "Your data has been downloaded successfully.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export your data.",
        variant: "destructive",
      });
    }
  };

  const deleteAccount = async () => {
    if (!user) return;
    
    try {
      // Delete all related data first
      await Promise.all([
        supabase.from('appointments').delete().eq('patient_id', profile?.id),
        supabase.from('prescriptions').delete().eq('patient_id', profile?.id),
        supabase.from('medical_records').delete().eq('patient_id', profile?.id),
        supabase.from('profiles').delete().eq('user_id', user.id)
      ]);

      // Sign out and redirect
      await supabase.auth.signOut();
      
      toast({
        title: "Account deleted",
        description: "Your account and all data have been permanently deleted.",
      });
    } catch (error) {
      toast({
        title: "Deletion failed",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
          <TabsTrigger value="data">Data</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.first_name || ''}
                    onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.last_name || ''}
                    onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profile.email || ''}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={profile.phone || ''}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  value={profile.address || ''}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="emergencyContact">Emergency Contact</Label>
                <Input
                  id="emergencyContact"
                  value={profile.emergency_contact || ''}
                  onChange={(e) => setProfile({ ...profile, emergency_contact: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="medicalHistory">Medical History</Label>
                <Textarea
                  id="medicalHistory"
                  value={profile.medical_history || ''}
                  onChange={(e) => setProfile({ ...profile, medical_history: e.target.value })}
                  placeholder="Any allergies, medications, or medical conditions..."
                />
              </div>

              <Button onClick={() => updateProfile(profile)} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI and Booking Preferences</CardTitle>
              <CardDescription>Configure how you interact with the system</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="aiMode">AI-Assisted Booking</Label>
                  <p className="text-sm text-muted-foreground">Use AI to help with appointment booking and triage</p>
                </div>
                <Switch
                  id="aiMode"
                  checked={aiModeEnabled}
                  onCheckedChange={(checked) => {
                    setAiModeEnabled(checked);
                    onAiModeChange?.(checked);
                  }}
                />
              </div>
              
              <div>
                <Label htmlFor="language">Preferred Language</Label>
                <Select value={profile.preferred_language} onValueChange={(value) => updateProfile({ preferred_language: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emailNotif">Email Notifications</Label>
                <Switch
                  id="emailNotif"
                  checked={notifications.email}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, email: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="smsNotif">SMS Notifications</Label>
                <Switch
                  id="smsNotif"
                  checked={notifications.sms}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, sms: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="appointmentNotif">Appointment Reminders</Label>
                <Switch
                  id="appointmentNotif"
                  checked={notifications.appointments}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, appointments: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="prescriptionNotif">Prescription Alerts</Label>
                <Switch
                  id="prescriptionNotif"
                  checked={notifications.prescriptions}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, prescriptions: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Privacy Settings</CardTitle>
              <CardDescription>Control your data privacy and visibility</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Profile Visibility</Label>
                  <p className="text-sm text-muted-foreground">Who can see your basic profile information</p>
                </div>
                <Select defaultValue="dentists">
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dentists">My Dentists Only</SelectItem>
                    <SelectItem value="all">All Healthcare Providers</SelectItem>
                    <SelectItem value="none">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label>Medical History Sharing</Label>
                  <p className="text-sm text-muted-foreground">Allow sharing medical history with new dentists</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
              <CardDescription>Export or delete your data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export Your Data</h4>
                  <p className="text-sm text-muted-foreground">Download all your medical records, appointments, and profile data</p>
                </div>
                <Button onClick={exportData} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
                <div>
                  <h4 className="font-medium text-destructive">Delete Account</h4>
                  <p className="text-sm text-muted-foreground">Permanently delete your account and all associated data</p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Account
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={deleteAccount} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        Delete Account
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};