import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Mail, X, RefreshCw } from "lucide-react";
import { User } from "@supabase/supabase-js";

interface EmailVerificationBannerProps {
  user: User;
  onDismiss: () => void;
}

export const EmailVerificationBanner = ({ user, onDismiss }: EmailVerificationBannerProps) => {
  const [isResending, setIsResending] = useState(false);
  const { toast } = useToast();

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const redirectUrl = `${window.location.origin}/confirm-email`;
      
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email!,
        options: {
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      toast({
        title: "Email envoyé !",
        description: "Un nouveau lien de confirmation a été envoyé à votre adresse email.",
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer l'email de confirmation.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
      <Mail className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between w-full">
        <div className="flex-1 mr-4">
          <p className="font-medium">Vérifiez votre email</p>
          <p className="text-sm">
            Un lien de confirmation a été envoyé à <strong>{user.email}</strong>. 
            Cliquez sur le lien pour activer votre compte.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendEmail}
            disabled={isResending}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            {isResending ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Mail className="h-4 w-4 mr-1" />
                Renvoyer
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            className="text-amber-700 hover:bg-amber-100"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};