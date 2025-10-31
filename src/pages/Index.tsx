import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Bell, Shield, Users, CheckCircle2, ArrowRight, Sparkles, Zap, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccessibleLoadingIndicator } from "@/components/ui/skip-to-content";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
        <AccessibleLoadingIndicator message="Loading DentiBot" size="lg" />
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

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto relative">
            <div className="text-center space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                <span>AI-Powered Appointment Management</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight">
                Your Complete Dental
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-2">
                  Practice Management System
                </span>
              </h1>

              <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
                From appointment scheduling to patient records, payments to inventory—manage your entire dental practice with AI-powered efficiency. Built specifically for modern dental professionals.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-6 text-lg shadow-lg hover:shadow-xl transition-all group"
                  onClick={() => navigate('/signup')}
                  aria-label="Get started with free account"
                >
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-gray-300 hover:border-blue-600 hover:bg-blue-50 px-8 py-6 text-lg transition-all"
                  onClick={() => navigate('/login')}
                  aria-label="Sign in to existing account"
                >
                  Sign In
                </Button>
              </div>

              {/* Trust indicators */}
              <div className="flex flex-wrap justify-center items-center gap-8 pt-8 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>AI-Powered Features</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-green-600" />
                  <span>Multi-Location Support</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Everything Your Dental Practice Needs
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Comprehensive practice management tools designed for dentists, by healthcare professionals
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: Calendar,
                  title: "Smart Scheduling",
                  description: "Intelligent appointment calendar with conflict detection, recurring appointments, and multi-provider scheduling",
                  gradient: "from-blue-500 to-cyan-500"
                },
                {
                  icon: Zap,
                  title: "AI-Powered Triage",
                  description: "AI chatbot assesses patient urgency, symptoms, and recommends appropriate appointment types automatically",
                  gradient: "from-purple-500 to-pink-500"
                },
                {
                  icon: Bell,
                  title: "Patient Reminders",
                  description: "Automated appointment reminders and recall systems reduce no-shows by up to 40%",
                  gradient: "from-orange-500 to-red-500"
                },
                {
                  icon: Users,
                  title: "Complete Patient Records",
                  description: "Digital health records, treatment history, prescriptions, X-rays, and insurance info in one place",
                  gradient: "from-green-500 to-emerald-500"
                },
                {
                  icon: Shield,
                  title: "HIPAA Compliant & Secure",
                  description: "Enterprise-grade encryption, audit logs, and role-based access control for complete data security",
                  gradient: "from-indigo-500 to-blue-500"
                },
                {
                  icon: CheckCircle2,
                  title: "Billing & Payments",
                  description: "Track payments, send invoices, record insurance claims, and manage practice revenue effortlessly",
                  gradient: "from-teal-500 to-cyan-500"
                }
              ].map((feature, index) => (
                <Card
                  key={index}
                  className="group p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                  style={{ animationDelay: `${index * 100}ms` }}
                  role="article"
                  tabIndex={0}
                  aria-label={`Feature: ${feature.title}`}
                >
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                  <div className="relative">
                    <div className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon className="h-6 w-6 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                </Card>
              ))}
            </div>

            {/* Additional features list */}
            <div className="mt-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 md:p-12">
              <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Plus Much More</h3>
              <div className="grid md:grid-cols-2 gap-6">
                {[
                  "Multi-location & multi-provider support",
                  "Inventory management with low-stock alerts",
                  "Comprehensive analytics & reporting",
                  "Mobile-responsive PWA design",
                  "Customizable clinic templates",
                  "Real-time notifications & messaging",
                  "Prescription management system",
                  "Treatment plan tracking",
                  "Staff & team management",
                  "Data import/export tools",
                  "Custom branding & white-labeling",
                  "Google Calendar synchronization"
                ].map((feature, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-gray-700 font-medium">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Why Dental Practices Choose DentiBot
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Built specifically for dental professionals with the features you actually need
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Save Time",
                  description: "Reduce administrative work by up to 60% with automated scheduling, reminders, and patient communications",
                  stat: "60% less admin time"
                },
                {
                  title: "Increase Revenue",
                  description: "Reduce no-shows, improve appointment utilization, and streamline billing to boost practice income",
                  stat: "40% fewer no-shows"
                },
                {
                  title: "Better Patient Care",
                  description: "Access complete patient histories instantly, track treatment plans, and provide more personalized care",
                  stat: "100% organized records"
                }
              ].map((benefit, index) => (
                <Card key={index} className="p-8 text-center bg-white border-2 border-blue-100 hover:border-blue-300 transition-all">
                  <div className="text-4xl font-bold text-blue-600 mb-2">{benefit.stat}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-20 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-10"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full mix-blend-soft-light filter blur-3xl opacity-10"></div>
          </div>

          <div className="max-w-4xl mx-auto text-center text-white space-y-8 relative">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-4">
              <Zap className="h-4 w-4" />
              <span>Start Your Free Trial</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight">
              Ready to Transform Your Dental Practice?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join modern dental practices using DentiBot to save time, reduce no-shows, and provide better patient care.
              Get started today—no credit card required.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
              <Button
                size="lg"
                className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all group font-semibold"
                onClick={() => navigate('/signup')}
                aria-label="Start your free trial today"
              >
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-6 text-lg transition-all"
                onClick={() => navigate('/chat')}
                aria-label="Talk to AI assistant"
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Try AI Assistant
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex flex-wrap justify-center items-center gap-6 pt-8 text-sm">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Shield className="h-4 w-4" />
                <span>HIPAA Compliant</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <CheckCircle2 className="h-4 w-4" />
                <span>No Credit Card Required</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
                <Clock className="h-4 w-4" />
                <span>Setup in 5 Minutes</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
