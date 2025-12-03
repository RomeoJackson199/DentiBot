import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Shield, Key } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TwoFactorVerificationDialog } from "@/components/auth/TwoFactorVerificationDialog";

export function PatientSecuritySettings() {
    const [loading, setLoading] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
    const [enablingTwoFactor, setEnablingTwoFactor] = useState(false);
    const [show2FADialog, setShow2FADialog] = useState(false);
    const [userEmail, setUserEmail] = useState("");
    const { toast } = useToast();

    useEffect(() => {
        loadUserData();
        checkTwoFactorStatus();
    }, []);

    const loadUserData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.email) {
                setUserEmail(user.email);
            }
        } catch (error) {
            console.error('Error loading user data:', error);
        }
    };

    const checkTwoFactorStatus = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const enabled = user.user_metadata?.two_factor_enabled === true;
                setTwoFactorEnabled(enabled);
            }
        } catch (error) {
            console.error('Error checking 2FA status:', error);
        }
    };

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast({
                title: "Passwords Don't Match",
                description: "Please make sure your new passwords match",
                variant: "destructive",
            });
            return;
        }

        if (newPassword.length < 8) {
            toast({
                title: "Password Too Short",
                description: "Password must be at least 8 characters long",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            // Send password change notification email
            try {
                await supabase.functions.invoke('send-password-change-notification', {
                    body: {
                        email: userEmail,
                        timestamp: new Date().toISOString(),
                    }
                });
                console.log('Password change notification sent');
            } catch (emailError) {
                console.error('Failed to send password change email:', emailError);
            }

            toast({
                title: "✅ Password Updated",
                description: "Your password has been changed successfully. A confirmation email has been sent to your inbox.",
                duration: 8000,
                className: "bg-green-50 border-green-200 text-green-900 dark:bg-green-950 dark:border-green-800 dark:text-green-100",
            });

            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (error: any) {
            console.error('Error updating password:', error);
            toast({
                title: "❌ Error",
                description: error.message || "Failed to update password",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleTwoFactorToggle = async (enabled: boolean) => {
        if (!enabled) {
            // Disable 2FA
            setEnablingTwoFactor(true);
            try {
                const { error } = await supabase.auth.updateUser({
                    data: { two_factor_enabled: false }
                });

                if (error) throw error;

                // Log 2FA disable event
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        await supabase.from('security_audit_logs').insert({
                            user_id: user.id,
                            event_type: '2fa_disabled',
                            metadata: { timestamp: new Date().toISOString() }
                        });
                    }
                } catch (logError) {
                    console.error('Failed to log 2FA disable:', logError);
                }

                setTwoFactorEnabled(false);
                toast({
                    title: "2FA Disabled",
                    description: "Two-factor authentication has been disabled",
                });
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message || "Failed to disable 2FA",
                    variant: "destructive",
                });
            } finally {
                setEnablingTwoFactor(false);
            }
        } else {
            // Enable 2FA - show email verification dialog
            setShow2FADialog(true);
        }
    };

    const handle2FASuccess = async () => {
        try {
            const { error } = await supabase.auth.updateUser({
                data: { two_factor_enabled: true }
            });

            if (error) throw error;

            // Log 2FA enable event
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await supabase.from('security_audit_logs').insert({
                        user_id: user.id,
                        event_type: '2fa_enabled',
                        metadata: { timestamp: new Date().toISOString() }
                    });
                }
            } catch (logError) {
                console.error('Failed to log 2FA enable:', logError);
            }

            setTwoFactorEnabled(true);
            checkTwoFactorStatus();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to enable 2FA",
                variant: "destructive",
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Password Change Card */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Key className="h-5 w-5" />
                        Change Password
                    </CardTitle>
                    <CardDescription>
                        Update your password regularly to keep your account secure
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="current-password">Current Password</Label>
                            <Input
                                id="current-password"
                                type="password"
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Enter current password"
                                disabled={loading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="new-password">New Password</Label>
                            <Input
                                id="new-password"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Enter new password (min 8 characters)"
                                disabled={loading}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirm New Password</Label>
                            <Input
                                id="confirm-password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Confirm new password"
                                disabled={loading}
                                required
                            />
                        </div>

                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                "Update Password"
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Two-Factor Authentication Card */}
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
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                            <p className="font-medium">Enable 2FA</p>
                            <p className="text-sm text-muted-foreground">
                                Require a verification code in addition to your password
                            </p>
                        </div>
                        <Switch
                            checked={twoFactorEnabled}
                            onCheckedChange={handleTwoFactorToggle}
                            disabled={enablingTwoFactor}
                        />
                    </div>
                    {twoFactorEnabled && (
                        <Alert>
                            <AlertDescription>
                                Two-factor authentication is enabled. You will receive a verification code via email when logging in.
                            </AlertDescription>
                        </Alert>
                    )}
                </CardContent>
            </Card>

            {/* 2FA Verification Dialog */}
            <TwoFactorVerificationDialog
                open={show2FADialog}
                onOpenChange={setShow2FADialog}
                email={userEmail}
                onSuccess={handle2FASuccess}
                mode="setup"
            />
        </div>
    );
}
