import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface TwoFactorVerificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  email: string;
  onSuccess: () => void;
}

export function TwoFactorVerificationDialog({ 
  open, 
  onOpenChange, 
  email, 
  onSuccess 
}: TwoFactorVerificationDialogProps) {
  const [verificationCode, setVerificationCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const { toast } = useToast();

  const sendVerificationCode = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('send-2fa-code', {
        body: { email }
      });

      if (error) throw error;

      setCodeSent(true);
      toast({
        title: "Verification Code Sent",
        description: "Check your email for the 6-digit code",
      });
    } catch (error: any) {
      console.error('Error sending code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send verification code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter a 6-digit code",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-2fa-code', {
        body: { email, code: verificationCode }
      });

      if (error) throw error;

      if (data?.verified) {
        toast({
          title: "2FA Enabled",
          description: "Two-factor authentication has been enabled successfully",
        });
        onSuccess();
        onOpenChange(false);
      } else {
        toast({
          title: "Invalid Code",
          description: "The verification code you entered is incorrect",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error verifying code:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify code",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Enable Two-Factor Authentication
          </DialogTitle>
          <DialogDescription>
            We'll send a verification code to your email to confirm setup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!codeSent ? (
            <>
              <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Email Address</p>
                  <p className="text-sm text-muted-foreground">{email}</p>
                </div>
              </div>

              <Button 
                onClick={sendVerificationCode} 
                disabled={loading}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Verification Code
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="code">Verification Code</Label>
                <Input
                  id="code"
                  placeholder="Enter 6-digit code"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-digit code sent to {email}
                </p>
              </div>

              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={sendVerificationCode} 
                  disabled={loading}
                  className="flex-1"
                >
                  Resend Code
                </Button>
                <Button 
                  onClick={verifyCode} 
                  disabled={loading || verificationCode.length !== 6}
                  className="flex-1"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Verify & Enable"
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
