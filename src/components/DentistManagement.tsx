import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, UserPlus, Mail, User, Trash2, Edit, Eye, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface DentistManagementProps {
  currentDentistId: string;
}

export const DentistManagement = ({ currentDentistId }: DentistManagementProps) => {
  const [newDentistEmail, setNewDentistEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [dentists, setDentists] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDentist, setSelectedDentist] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    try {
      const { data, error } = await supabase
        .from('dentists')
        .select(`
          id,
          is_active,
          created_at,
          profiles (
            id,
            first_name,
            last_name,
            email,
            phone,
            role
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDentists(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleAddDentist = async () => {
    if (!newDentistEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newDentistEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if user already exists in the system
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, role, user_id')
        .eq('email', newDentistEmail)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking existing profile:', profileError);
      }

      if (existingProfile) {
        // Check if already a dentist
        const { data: existingDentist, error: dentistError } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', existingProfile.id)
          .maybeSingle();

        if (dentistError) {
          console.error('Error checking existing dentist:', dentistError);
        }

        if (existingDentist) {
          toast({
            title: "Already a Dentist",
            description: `${newDentistEmail} is already registered as a dentist`,
            variant: "destructive",
          });
          setNewDentistEmail("");
          return;
        }

        // If they have a user_id, they're already signed up - just promote them
        if (existingProfile.user_id) {
          // Update existing profile to dentist role and create dentist entry
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'dentist' })
            .eq('id', existingProfile.id);

          if (updateError) throw updateError;

          const { error: createDentistError } = await supabase
            .from('dentists')
            .insert({
              profile_id: existingProfile.id,
              is_active: true
            });

          if (createDentistError) throw createDentistError;

          toast({
            title: "Dentist Added Successfully",
            description: `${existingProfile.first_name} ${existingProfile.last_name} (${newDentistEmail}) has been promoted to dentist`,
          });
        } else {
          // Profile exists but no user_id - resend invitation
          const { data: tokenData, error: tokenError } = await supabase.rpc(
            'create_invitation_token_with_cleanup',
            {
              p_profile_id: existingProfile.id,
              p_email: newDentistEmail,
              p_expires_hours: 72,
            }
          );

          if (tokenError) throw tokenError;

          // Send invitation email
          const { error: emailError } = await supabase.functions.invoke('send-import-invitations', {
            body: {
              invitations: [{
                email: newDentistEmail,
                token: tokenData,
                firstName: existingProfile.first_name || '',
                lastName: existingProfile.last_name || '',
                role: 'dentist',
              }],
            },
          });

          if (emailError) throw emailError;

          toast({
            title: "Invitation Resent",
            description: `A new invitation has been sent to ${newDentistEmail}`,
          });
        }
      } else {
        // User doesn't exist - create profile and send invitation
        // Extract first and last name from email if not provided
        const emailName = newDentistEmail.split('@')[0];
        const nameParts = emailName.split('.');
        const firstName = nameParts[0]?.charAt(0).toUpperCase() + nameParts[0]?.slice(1) || 'New';
        const lastName = nameParts[1]?.charAt(0).toUpperCase() + nameParts[1]?.slice(1) || 'Dentist';

        // Create profile
        const { data: profileData, error: profileCreateError } = await supabase
          .from('profiles')
          .insert({
            email: newDentistEmail,
            first_name: firstName,
            last_name: lastName,
            role: 'dentist',
          })
          .select()
          .single();

        if (profileCreateError) throw profileCreateError;

        // Create invitation token
        const { data: tokenData, error: tokenError } = await supabase.rpc(
          'create_invitation_token_with_cleanup',
          {
            p_profile_id: profileData.id,
            p_email: newDentistEmail,
            p_expires_hours: 72,
          }
        );

        if (tokenError) throw tokenError;

        // Send invitation email
        const { error: emailError } = await supabase.functions.invoke('send-import-invitations', {
          body: {
            invitations: [{
              email: newDentistEmail,
              token: tokenData,
              firstName,
              lastName,
              role: 'dentist',
            }],
          },
        });

        if (emailError) throw emailError;

        toast({
          title: "Invitation Sent",
          description: `An invitation has been sent to ${newDentistEmail}. They will receive an email with instructions to set up their account.`,
        });
      }

      setNewDentistEmail("");
      fetchDentists(); // Refresh the list
    } catch (error: unknown) {
      console.error('Error adding dentist:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveDentist = async (dentistId: string) => {
    try {
      const { error } = await supabase
        .from('dentists')
        .delete()
        .eq('id', dentistId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Dentist removed successfully",
      });
      fetchDentists();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const filteredDentists = dentists.filter(dentist => {
    const profile = dentist.profiles;
    const searchLower = searchTerm.toLowerCase();
    return !searchTerm || 
      profile.first_name?.toLowerCase().includes(searchLower) ||
      profile.last_name?.toLowerCase().includes(searchLower) ||
      profile.email?.toLowerCase().includes(searchLower);
  });

  return (
    <div className="space-y-6">
      {/* Add New Dentist */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-dental-primary">
            <UserPlus className="h-5 w-5" />
            <span>Add New Dentist</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">How it works</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Enter the email address of the dentist you want to add. We'll send them an invitation email with instructions to set up their account and access the dentist dashboard.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="dentistEmail" className="text-sm font-medium">
                Dentist Email Address
              </Label>
              <div className="flex space-x-2 mt-2">
                <Input
                  id="dentistEmail"
                  type="email"
                  placeholder="doctor@example.com"
                  value={newDentistEmail}
                  onChange={(e) => setNewDentistEmail(e.target.value)}
                  className="flex-1"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddDentist();
                    }
                  }}
                />
                <Button 
                  onClick={handleAddDentist}
                  disabled={loading || !newDentistEmail.trim()}
                  className="bg-dental-primary hover:bg-dental-primary/90 text-white"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
            <div className="flex items-start space-x-3">
              <UserPlus className="h-5 w-5 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <div>
                <h4 className="font-medium text-emerald-900 dark:text-emerald-100">New User?</h4>
                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                  No problem! If they don't have an account yet, we'll create one and send them an invitation email. If they already have an account, they'll be promoted to dentist automatically.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dentist List */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-dental-primary">
            <User className="h-5 w-5" />
            <span>Dentist Profiles</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search dentists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Dentist List */}
          <div className="space-y-3">
            {filteredDentists.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No dentists found</p>
              </div>
            ) : (
              filteredDentists.map((dentist) => {
                const profile = dentist.profiles;
                const isCurrentUser = dentist.id === currentDentistId;
                
                return (
                  <div
                    key={dentist.id}
                    className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                      isCurrentUser ? 'bg-dental-primary/10 border-dental-primary/20' : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-dental-primary/10 rounded-full flex items-center justify-center">
                        <User className="h-5 w-5 text-dental-primary" />
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">
                            {profile.first_name} {profile.last_name}
                          </h4>
                          {isCurrentUser && (
                            <Badge variant="secondary" className="text-xs">You</Badge>
                          )}
                          <Badge variant={dentist.is_active ? "default" : "secondary"}>
                            {dentist.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{profile.email}</p>
                        {profile.phone && (
                          <p className="text-xs text-muted-foreground">{profile.phone}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedDentist(dentist)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      {!isCurrentUser && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Remove Dentist</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <p className="text-muted-foreground">
                                Are you sure you want to remove {profile.first_name} {profile.last_name} as a dentist? 
                                They will lose access to the dentist dashboard.
                              </p>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Cancel</Button>
                                <Button 
                                  variant="destructive"
                                  onClick={() => handleRemoveDentist(dentist.id)}
                                >
                                  Remove
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dentist Details Dialog */}
      {selectedDentist && (
        <Dialog open={!!selectedDentist} onOpenChange={() => setSelectedDentist(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Dentist Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-dental-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-dental-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">
                    {selectedDentist.profiles.first_name} {selectedDentist.profiles.last_name}
                  </h3>
                  <p className="text-muted-foreground">{selectedDentist.profiles.email}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Status:</span>
                  <Badge variant={selectedDentist.is_active ? "default" : "secondary"}>
                    {selectedDentist.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Role:</span>
                  <span className="text-muted-foreground capitalize">{selectedDentist.profiles.role}</span>
                </div>
                {selectedDentist.profiles.phone && (
                  <div className="flex justify-between">
                    <span className="font-medium">Phone:</span>
                    <span className="text-muted-foreground">{selectedDentist.profiles.phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="font-medium">Joined:</span>
                  <span className="text-muted-foreground">
                    {new Date(selectedDentist.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};