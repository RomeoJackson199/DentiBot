import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, UserPlus, Shield } from "lucide-react";
import { useUserRole } from "@/hooks/useUserRole";

interface AddUserDialogProps {
  onUserAdded?: () => void;
}

export function AddUserDialog({ onUserAdded }: AddUserDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [role, setRole] = useState<"patient" | "dentist" | "staff" | "admin">("patient");
  const { toast } = useToast();
  const { isAdmin, isDentist, loading: roleLoading } = useUserRole();

  // Security check - admins and dentists can add users
  if (roleLoading) {
    return null;
  }

  if (!isAdmin && !isDentist) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, user_id')
        .eq('email', email)
        .maybeSingle();

      let profileId: string;
      let userId: string | null = null;
      
      if (existingProfile) {
        profileId = existingProfile.id;
        userId = existingProfile.user_id;
      } else {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .insert({
            email,
            first_name: firstName,
            last_name: lastName,
          })
          .select()
          .single();

        if (profileError) throw profileError;
        profileId = profileData.id;
        userId = profileData.user_id;
      }

      // If adding as dentist, create dentist record if it doesn't exist
      if (role === 'dentist') {
        const { data: existingDentist } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', profileId)
          .maybeSingle();

        if (!existingDentist) {
          const { error: dentistError } = await supabase
            .from('dentists')
            .insert({
              profile_id: profileId,
              first_name: firstName,
              last_name: lastName,
              email: email,
              is_active: true,
            });

          if (dentistError) throw dentistError;
        }

        // If user exists, add provider role
        if (userId) {
          const { error: roleError } = await supabase
            .from('user_roles')
            .insert({
              user_id: userId,
              role: 'provider',
            })
            .select()
            .maybeSingle();

          // Ignore conflict errors (role already exists)
          if (roleError && !roleError.message.includes('duplicate')) {
            console.error('Role error:', roleError);
          }
        }

        toast({
          title: "Dentist Added Successfully",
          description: existingProfile?.user_id 
            ? `${firstName} ${lastName} can now switch between patient and dentist views`
            : `${firstName} ${lastName} has been added as dentist`,
        });
      } else {
        toast({
          title: "User Added Successfully",
          description: `${firstName} ${lastName} has been added as ${role}`,
        });
      }

      setOpen(false);
      setEmail("");
      setFirstName("");
      setLastName("");
      setRole("patient");
      onUserAdded?.();
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add user",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Shield className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Add New User
          </DialogTitle>
          <DialogDescription>
            Add a new user to the system. For dentists, they will be added directly without email confirmation.
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            This action is logged for security purposes. Only add users you have verified.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john.doe@example.com"
              required
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={role} onValueChange={(v: any) => setRole(v)} disabled={loading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="patient">Patient</SelectItem>
                <SelectItem value="dentist">Dentist</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="admin">Admin (Full Access)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                "Add User"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
