import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building2, UserPlus } from "lucide-react";

interface Invitation {
  id: string;
  business_id: string;
  businesses: {
    name: string;
    slug: string;
  } | null;
}

export const DentistInvitationDialog = () => {
  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkForInvitations();
  }, []);

  const checkForInvitations = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("email")
        .eq("user_id", user.id)
        .single();

      if (!profile?.email) return;

      // Check for pending invitations
      const { data: invitations, error } = await supabase
        .from("dentist_invitations")
        .select(`
          id,
          business_id,
          businesses (
            name,
            slug
          )
        `)
        .eq("invitee_email", profile.email)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .limit(1);

      if (error) throw error;

      if (invitations && invitations.length > 0) {
        const inv = invitations[0];
        setInvitation({
          id: inv.id,
          business_id: inv.business_id,
          businesses: Array.isArray(inv.businesses) ? inv.businesses[0] : inv.businesses
        });
      }
    } catch (error) {
      console.error("Error checking invitations:", error);
    }
  };

  const handleAccept = async () => {
    if (!invitation) return;
    
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!profile) throw new Error("Profile not found");

      // Start a transaction-like operation
      // 1. Update invitation status
      const { error: inviteError } = await supabase
        .from("dentist_invitations")
        .update({
          status: "accepted",
          responded_at: new Date().toISOString(),
          invitee_profile_id: profile.id
        })
        .eq("id", invitation.id);

      if (inviteError) throw inviteError;

      // 2. Add provider role
      const { error: roleError } = await supabase.rpc("assign_provider_role");
      if (roleError) throw roleError;

      // 3. Create or update dentist record
      const { data: existingDentist } = await supabase
        .from("dentists")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!existingDentist) {
        const { error: dentistError } = await supabase
          .from("dentists")
          .insert({
            profile_id: profile.id,
            is_active: true
          });

        if (dentistError) throw dentistError;
      }

      // 4. Get the dentist ID for business membership
      const { data: dentist } = await supabase
        .from("dentists")
        .select("id")
        .eq("profile_id", profile.id)
        .single();

      if (!dentist) throw new Error("Dentist record not found");

      // 5. Add to business_members
      const { error: memberError } = await supabase
        .from("business_members")
        .insert({
          business_id: invitation.business_id,
          profile_id: profile.id,
          role: "dentist"
        });

      if (memberError && !memberError.message.includes("duplicate")) {
        throw memberError;
      }

      toast({
        title: "Invitation Accepted! 🎉",
        description: `You're now part of ${invitation.businesses?.name || 'the clinic'}`,
      });

      setInvitation(null);
      
      // Redirect to dentist portal
      setTimeout(() => {
        navigate("/dentist");
        window.location.reload(); // Refresh to update roles
      }, 1000);

    } catch (error: any) {
      console.error("Error accepting invitation:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to accept invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!invitation) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from("dentist_invitations")
        .update({
          status: "rejected",
          responded_at: new Date().toISOString()
        })
        .eq("id", invitation.id);

      if (error) throw error;

      toast({
        title: "Invitation Declined",
        description: "You can accept it later if you change your mind",
      });

      setInvitation(null);
    } catch (error: any) {
      console.error("Error rejecting invitation:", error);
      toast({
        title: "Error",
        description: "Failed to decline invitation",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!invitation) return null;

  return (
    <Dialog open={!!invitation} onOpenChange={() => !loading && setInvitation(null)}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <UserPlus className="w-6 h-6 text-primary" />
            </div>
            <div>
              <DialogTitle>Join as Dentist</DialogTitle>
              <DialogDescription>
                You've been invited to join a clinic
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
            <Building2 className="w-8 h-8 text-primary" />
            <div>
              <p className="font-medium text-lg">{invitation.businesses?.name || 'Dental Clinic'}</p>
              <p className="text-sm text-muted-foreground">
                Join this clinic as a dentist/provider
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleReject}
            disabled={loading}
          >
            Decline
          </Button>
          <Button
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? "Accepting..." : "Accept Invitation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
