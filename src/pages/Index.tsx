import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Bell, Shield, Users, CheckCircle2 } from "lucide-react";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the dashboard
  if (user) {
    return <UnifiedDashboard user={user} />;
  }

  // Homepage for non-authenticated users
  return (
    <div className="min-h-screen bg-white">
      <Header user={user} minimal />

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center space-y-8">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Smart Appointment Booking
                <span className="block text-blue-600 mt-2">Made Simple</span>
              </h1>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                Manage appointments, schedules, and client communications in one easy-to-use platform.
                Perfect for any business that books appointments.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button
                  size="lg"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
                  onClick={() => window.location.href = '/signup'}
                >
                  Get Started Free
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-gray-300 px-8 py-6 text-lg"
                  onClick={() => window.location.href = '/login'}
                >
                  Sign In
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Everything You Need to Manage Appointments
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Simple, powerful tools to streamline your scheduling and grow your business
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Smart Scheduling",
                  description: "Easy-to-use calendar interface for managing all your appointments in one place"
                },
                {
                  icon: Clock,
                  title: "Time Management",
                  description: "Set your availability and let clients book when it works for both of you"
                },
                {
                  icon: Bell,
                  title: "Automated Reminders",
                  description: "Reduce no-shows with automatic email and SMS reminders"
                },
                {
                  icon: Users,
                  title: "Client Management",
                  description: "Keep track of client information, history, and preferences"
                },
                {
                  icon: Shield,
                  title: "Secure & Private",
                  description: "Your data is encrypted and protected with enterprise-grade security"
                },
                {
                  icon: CheckCircle2,
                  title: "Easy to Use",
                  description: "Intuitive interface designed for businesses of all sizes"
                }
              ].map((feature, index) => (
                <Card key={index} className="p-6 border border-gray-200 hover:border-blue-300 transition-colors">
                  <feature.icon className="h-10 w-10 text-blue-600 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-600 to-purple-600">
          <div className="max-w-4xl mx-auto text-center text-white space-y-8">
            <h2 className="text-3xl sm:text-4xl font-bold">
              Ready to Simplify Your Scheduling?
            </h2>
            <p className="text-xl text-blue-100">
              Join thousands of professionals who trust our platform for their appointment management
            </p>
            <Button
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg"
              onClick={() => window.location.href = '/signup'}
            >
              Start Your Free Account
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
