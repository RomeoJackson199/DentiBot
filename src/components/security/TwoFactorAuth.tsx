import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Smartphone, Mail, Key } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type TwoFactorMethod = 'email' | 'authenticator' | 'sms';

export function TwoFactorAuth() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [verificationCode, setVerificationCode] = useState("");

  const { data: settings } = useQuery({
    queryKey: ['2fa-settings'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('user_2fa_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    }
  });

  const toggle2FA = useMutation({
    mutationFn: async ({ enabled, method }: { enabled: boolean; method?: TwoFactorMethod }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (enabled && method) {
        // Enable 2FA
        const { error } = await supabase
          .from('user_2fa_settings')
          .upsert({
            user_id: user.id,
            is_enabled: true,
            method,
            secret: Math.random().toString(36).substring(2, 15) // In production, use proper secret generation
          });

        if (error) throw error;
      } else {
        // Disable 2FA
        const { error } = await supabase
          .from('user_2fa_settings')
          .update({ is_enabled: false })
          .eq('user_id', user.id);

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['2fa-settings'] });
      toast({ title: "2FA settings updated successfully" });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update 2FA settings",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const [selectedMethod, setSelectedMethod] = useState<TwoFactorMethod>('email');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable 2FA</p>
              <p className="text-sm text-muted-foreground">
                {settings?.is_enabled ? 'Two-factor authentication is enabled' : 'Enable two-factor authentication'}
              </p>
            </div>
            <Switch
              checked={settings?.is_enabled || false}
              onCheckedChange={(checked) => {
                if (checked) {
                  toggle2FA.mutate({ enabled: true, method: selectedMethod });
                } else {
                  toggle2FA.mutate({ enabled: false });
                }
              }}
            />
          </div>

          {!settings?.is_enabled && (
            <>
              <div className="space-y-4">
                <Label>Authentication Method</Label>
                <RadioGroup value={selectedMethod} onValueChange={(v) => setSelectedMethod(v as TwoFactorMethod)}>
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="email" id="email" />
                    <Mail className="h-4 w-4" />
                    <Label htmlFor="email" className="flex-1 cursor-pointer">
                      Email
                      <span className="block text-sm text-muted-foreground">
                        Receive codes via email
                      </span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="authenticator" id="authenticator" />
                    <Smartphone className="h-4 w-4" />
                    <Label htmlFor="authenticator" className="flex-1 cursor-pointer">
                      Authenticator App
                      <span className="block text-sm text-muted-foreground">
                        Use an authenticator app like Google Authenticator
                      </span>
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 p-3 border rounded-lg">
                    <RadioGroupItem value="sms" id="sms" />
                    <Key className="h-4 w-4" />
                    <Label htmlFor="sms" className="flex-1 cursor-pointer">
                      SMS
                      <span className="block text-sm text-muted-foreground">
                        Receive codes via SMS
                      </span>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </>
          )}

          {settings?.is_enabled && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Current Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  {settings.method === 'email' && <Mail className="h-4 w-4" />}
                  {settings.method === 'authenticator' && <Smartphone className="h-4 w-4" />}
                  {settings.method === 'sms' && <Key className="h-4 w-4" />}
                  <span className="capitalize">{settings.method}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {settings?.is_enabled && (
            <div className="space-y-4">
              <div>
                <Label>Backup Codes</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  Save these codes in a safe place. You can use them to access your account if you lose your 2FA device.
                </p>
                <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
                  {settings.backup_codes?.map((code, idx) => (
                    <div key={idx}>{code}</div>
                  ))}
                </div>
                <Button variant="outline" className="mt-2" size="sm">
                  Regenerate Codes
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
