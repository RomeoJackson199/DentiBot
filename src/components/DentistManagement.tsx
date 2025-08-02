import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Plus, UserPlus, Mail, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

interface DentistManagementProps {
  currentDentistId: string;
}

export const DentistManagement = ({ currentDentistId }: DentistManagementProps) => {
  const [newDentistEmail, setNewDentistEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
        .select('id, first_name, last_name, role')
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
        // User doesn't exist - they need to sign up first
        toast({
          title: "User Not Found",
          description: `${newDentistEmail} needs to create an account first. Please ask them to sign up on the platform before adding them as a dentist.`,
          variant: "destructive",
        });
      }

      setNewDentistEmail("");
    } catch (error: any) {
      console.error('Error adding dentist:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add dentist",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
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
                Enter the email of someone who already has an account. They will be promoted to dentist status and gain access to the dentist dashboard.
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

        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <User className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-900 dark:text-amber-100">Important Note</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                The person must already have an account on the platform. If they don't have an account, ask them to sign up first at the main page.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};