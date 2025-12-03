import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, User, Calendar, Phone, ArrowRight } from "lucide-react";
import { validateName, validatePhone } from "@/lib/security";

const Onboarding = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        dateOfBirth: "",
        phone: "",
    });

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                navigate("/login");
                return;
            }

            // Check if profile is already complete
            const { data: profile } = await supabase
                .from("profiles")
                .select("first_name, last_name, date_of_birth, phone")
                .eq("user_id", user.id)
                .single();

            if (profile?.first_name && profile?.last_name && profile?.date_of_birth) {
                navigate("/dashboard");
            }

            // Pre-fill form if some data exists
            if (profile) {
                setFormData({
                    firstName: profile.first_name || "",
                    lastName: profile.last_name || "",
                    dateOfBirth: profile.date_of_birth || "",
                    phone: profile.phone || "",
                });
            }
        } catch (error) {
            console.error("Error checking user:", error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Validation
            if (!validateName(formData.firstName)) {
                throw new Error("First name contains invalid characters");
            }
            if (!validateName(formData.lastName)) {
                throw new Error("Last name contains invalid characters");
            }
            if (formData.phone && !validatePhone(formData.phone)) {
                throw new Error("Invalid phone number format");
            }
            if (!formData.dateOfBirth) {
                throw new Error("Date of birth is required");
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No user found");

            const { error } = await supabase
                .from("profiles")
                .update({
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    date_of_birth: formData.dateOfBirth,
                    phone: formData.phone,
                    updated_at: new Date().toISOString(),
                })
                .eq("user_id", user.id);

            if (error) throw error;

            toast({
                title: "Profile updated!",
                description: "Welcome to Caberu. Your account is now ready.",
            });

            navigate("/dashboard");
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (isChecking) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Welcome to Caberu</h1>
                    <p className="text-muted-foreground">
                        Let's get to know you better. Please complete your profile to continue.
                    </p>
                </div>

                <div className="bg-card border rounded-xl p-6 shadow-sm">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="firstName">First Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="firstName"
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        className="pl-10"
                                        placeholder="John"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName">Last Name</Label>
                                <Input
                                    id="lastName"
                                    value={formData.lastName}
                                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="dateOfBirth"
                                    type="date"
                                    value={formData.dateOfBirth}
                                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                                    className="pl-10"
                                    required
                                    max={new Date().toISOString().split("T")[0]}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="pl-10"
                                    placeholder="+1 (555) 000-0000"
                                    required
                                />
                            </div>
                        </div>

                        <Button type="submit" className="w-full h-12 text-base" disabled={isLoading}>
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Complete Profile
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </>
                            )}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Onboarding;
