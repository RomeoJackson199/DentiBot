import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { UnifiedDashboard } from "@/components/UnifiedDashboard";
import { ProgressiveAuthForm } from "@/components/ProgressiveAuthForm";
import { OnboardingPopup } from "@/components/OnboardingPopup";
import { LanguageSelection } from "@/components/LanguageSelection";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import { AppointmentBookingWithAuth } from "@/components/AppointmentBookingWithAuth";
import { EmergencyTriageForm } from "@/components/EmergencyTriageForm";
import { useToast } from "@/hooks/use-toast";
import {
  Stethoscope,
  Bot,
  CalendarCheck,
  MessageCircle,
  ShieldCheck,
  Sparkles,
  BarChart3,
  Users,
  ClipboardCheck,
  GaugeCircle,
  Star
} from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { createDossierAfterSignup } from "@/lib/medicalRecords";
import { SimpleDatabaseSaveTest } from "@/components/SimpleDatabaseSaveTest";
import { EmailTest } from "@/components/EmailTest";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BusinessPickerHomepage } from "@/components/BusinessPickerHomepage";


const Index = () => {
  const {
    t,
    setLanguage
  } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showLanguageSelection, setShowLanguageSelection] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
  const [showEmergencyTriage, setShowEmergencyTriage] = useState(false);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(
    localStorage.getItem("selected_business_id")
  );

  const isMountedRef = useRef(true);
  const {
    toast
  } = useToast();

  // Ensure a default language preference is seeded without overriding user choice
  useEffect(() => {
    const savedLanguage = localStorage.getItem('preferred-language');

    if (!savedLanguage) {
      localStorage.setItem('preferred-language', 'en');
      setLanguage('en');
    }
  }, [setLanguage]);
  useEffect(() => {
    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Use setTimeout to defer async operations and prevent deadlocks
      if (event === 'SIGNED_IN' && session?.user) {
        const timeoutId = setTimeout(() => {
          // Only proceed if component is still mounted
          if (!isMountedRef.current) return;
          
          const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
          if (!hasSeenOnboarding) {
            setShowOnboarding(true);
          }

          // Create initial dossier for new users (skip if no business context yet)
          import("@/lib/businessUtils").then(({ getBusinessIdOrNull }) => {
            getBusinessIdOrNull().then(businessId => {
              if (businessId) {
                createDossierAfterSignup(session.user.id).catch(console.error);
              }
            }).catch(console.error);
          }).catch(console.error);
        }, 0);
      }
    });

    // Check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);

      // Check onboarding for existing session
      if (session?.user) {
        const hasSeenOnboarding = localStorage.getItem(`onboarding_${session.user.id}`);
        if (!hasSeenOnboarding) {
          setShowOnboarding(true);
        }
      }
    }).catch(error => {
      console.error('Error getting session:', error);
      setLoading(false);
    });
    return () => subscription.unsubscribe();
  }, []);
  
  // Cleanup mounted state on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  const handleLanguageSelected = () => {
    setShowLanguageSelection(false);
    const hasSeenOnboarding = user ? localStorage.getItem(`onboarding_${user.id}`) : null;
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  };
  const handleOnboardingClose = () => {
    setShowOnboarding(false);
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'true');
    }
    toast({
      description: t.aiDisclaimer
    });
  };

  const handleAppointmentComplete = () => {
    setShowAppointmentBooking(false);
    toast({
      title: "Appointment Booked",
      description: "Your appointment has been successfully scheduled.",
    });
  };

  const handleTriageComplete = () => {
    setShowEmergencyTriage(false);
    toast({
      title: "Triage Complete",
      description: "Your emergency assessment has been completed.",
    });
  };

  const workspaceHighlights = [
    {
      title: "Smart scheduling",
      stat: "80% faster",
      description: "Automated reminders and AI-driven follow-ups keep calendars full."
    },
    {
      title: "Stronger revenue",
      stat: "+32%",
      description: "Recurring payments, autopay, and no-show protection built in."
    },
    {
      title: "Client retention",
      stat: "+45%",
      description: "Personalized journeys and timely nudges bring clients back."
    }
  ];

  const automationFeatures = [
    {
      title: "AI assistant",
      description: "An always-on copilot that handles intake, follow-ups, and routine conversations.",
      bullets: ["Custom-trained knowledge", "Secure, compliant messaging", "Instant escalations to your team"],
      icon: Bot
    },
    {
      title: "Smart scheduling",
      description: "Automatically balance availability, preferences, and production goals across locations.",
      bullets: ["Two-way calendar sync", "Waitlist automation", "Fill last-minute openings"],
      icon: CalendarCheck
    },
    {
      title: "Payments & revenue",
      description: "Checkout, membership plans, and recurring billing in one secure workspace.",
      bullets: ["Instant deposits", "Automated reminders", "No-show protection"],
      icon: ShieldCheck
    },
    {
      title: "Actionable insights",
      description: "Track utilization, conversion, and satisfaction with AI-generated recommendations.",
      bullets: ["Real-time dashboards", "Predictive alerts", "Goal tracking"],
      icon: BarChart3
    }
  ];

  const servicePlaybooks = [
    {
      title: "Dental & orthodontics",
      description: "Recall automation, treatment acceptance, and specialist coordination handled for you.",
      icon: ClipboardCheck
    },
    {
      title: "Medspa & aesthetics",
      description: "Membership billing, cross-sell flows, and personalized campaigns that convert.",
      icon: Sparkles
    },
    {
      title: "Wellness clinics",
      description: "Streamline recurring care plans, insurance follow-up, and patient retention initiatives.",
      icon: GaugeCircle
    },
    {
      title: "Professional services",
      description: "From onboarding to renewals, automate every step of the client journey in one platform.",
      icon: Users
    }
  ];

  const testimonials = [
    {
      quote: "We replaced four different tools with Denti Bot and saw immediate increases in show-up rate.",
      name: "Dr. Amelia Park",
      role: "Founder, Park Dental Studio"
    },
    {
      quote: "The AI assistant feels like a team member—clients book themselves and always get answers fast.",
      name: "Jordan Michaels",
      role: "Operations Lead, Glow Aesthetics"
    }
  ];
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center mesh-bg">
        <div className="text-center space-y-8 animate-fade-in">
          <div className="relative">
            {/* Enhanced pulse rings */}
            <div className="pulse-ring w-40 h-40 -top-10 -left-10"></div>
            <div className="pulse-ring-secondary w-32 h-32 -top-6 -left-6"></div>
            
            {/* Enhanced main card */}
            <Card 
              variant="glass-strong" 
              className="relative p-8 rounded-3xl shadow-glow animate-float border-dental-primary/20"
            >
              <div className="w-16 h-16 bg-gradient-primary rounded-2xl flex items-center justify-center mx-auto shadow-elegant">
                <Stethoscope className="w-8 h-8 text-white" />
              </div>
            </Card>
          </div>
          
          <div className="space-y-6">
            <h1 className="text-4xl font-bold gradient-text animate-slide-up">
              Denti Bot Unified
            </h1>
            
            <p className="text-2xl font-semibold text-dental-primary animate-slide-up" style={{ animationDelay: "0.2s" }}>
              {t.initializingExperience}
            </p>
            
            <p className="text-dental-muted-foreground max-w-md mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: "0.4s" }}>
              {t.preparingAssistant}
            </p>
            
            {/* Enhanced loading dots */}
            <div className="flex justify-center animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="flex space-x-3">
                <div className="w-3 h-3 bg-gradient-primary rounded-full animate-bounce shadow-soft"></div>
                <div className="w-3 h-3 bg-gradient-primary rounded-full animate-bounce shadow-soft" style={{ animationDelay: "0.1s" }}></div>
                <div className="w-3 h-3 bg-gradient-primary rounded-full animate-bounce shadow-soft" style={{ animationDelay: "0.2s" }}></div>
              </div>
            </div>
            
            {/* Progress indicator */}
            <div className="w-64 mx-auto">
              <div className="w-full bg-dental-muted/20 rounded-full h-2 animate-fade-in" style={{ animationDelay: "0.8s" }}>
                <div className="bg-gradient-primary h-2 rounded-full animate-pulse" style={{ width: "75%" }}></div>
              </div>
              <p className="text-xs text-dental-muted-foreground mt-2 animate-fade-in" style={{ animationDelay: "1.0s" }}>
                Setting up your personalized experience...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // If user is authenticated, show the dashboard
  if (user) {
    // For testing purposes, show the database test component
    if (window.location.search.includes('test=database')) {
      return <SimpleDatabaseSaveTest />;
    }
    // For testing purposes, show the email test component
    if (window.location.search.includes('test=email')) {
      return (
        <div className="min-h-screen p-8 flex items-center justify-center">
          <EmailTest />
        </div>
      );
    }
    return <UnifiedDashboard user={user} />;
  }

  // Show appointment booking modal
  if (showAppointmentBooking) {
    return (
      <AppointmentBookingWithAuth
        user={user}
        onComplete={handleAppointmentComplete}
        onCancel={() => setShowAppointmentBooking(false)}
      />
    );
  }

  // Show emergency triage modal
  if (showEmergencyTriage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 p-4">
        <div className="max-w-4xl mx-auto">
          <EmergencyTriageForm
            onComplete={handleTriageComplete}
            onCancel={() => setShowEmergencyTriage(false)}
          />
        </div>
      </div>
    );
  }

  // Show the new professional homepage for non-authenticated users
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Header user={user} minimal />
      <main className="pb-24">
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-emerald-50" />
          <div className="relative container mx-auto px-6 pt-20 pb-24">
            <div className="grid gap-16 lg:grid-cols-[1.1fr_0.9fr] items-center">
              <div className="space-y-10">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm backdrop-blur">
                  <Sparkles className="h-4 w-4 text-emerald-500" />
                  AI powered automation for modern practices
                </span>
                <div className="space-y-6">
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold leading-tight text-slate-900">
                    Run your business on autopilot — with AI.
                  </h1>
                  <p className="text-lg text-slate-600 max-w-xl">
                    Denti Bot unifies scheduling, payments, messaging, and analytics so your entire team can deliver effortless patient experiences.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => setShowAppointmentBooking(true)}>
                    Start free trial
                  </Button>
                  <Button size="lg" variant="outline" onClick={() => window.location.href = '/chat'}>
                    Book a walkthrough
                  </Button>
                </div>
                <div className="flex flex-wrap gap-6 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-amber-500" />
                    Loved by modern dental teams
                  </div>
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-emerald-500" />
                    Human handoffs in a click
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 rounded-[40px] bg-gradient-to-br from-sky-200/70 to-emerald-200/70 blur-3xl" />
                <div className="relative rounded-[32px] bg-white shadow-2xl ring-1 ring-slate-200/60 p-8 space-y-8">
                  <div className="space-y-2">
                    <h2 className="text-2xl font-semibold text-slate-900">Everything in one workspace</h2>
                    <p className="text-sm text-slate-500">Scheduling, payments, chat, automations, and analytics—synced across your entire practice.</p>
                  </div>
                  <div className="grid gap-4">
                    {workspaceHighlights.map((item) => (
                      <div key={item.title} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-900 font-semibold">
                          {item.stat}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{item.title}</p>
                          <p className="text-sm text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="mx-auto max-w-3xl text-center space-y-6">
            <h2 className="text-3xl font-semibold text-slate-900">Everything clients expect — fully automated</h2>
            <p className="text-slate-600 text-lg">Deliver smooth, personalized journeys with prebuilt AI playbooks that keep your front office running around the clock.</p>
          </div>
          <div className="mt-16 grid gap-8 md:grid-cols-2">
            {automationFeatures.map(({ title, description, bullets, icon: Icon }) => (
              <div key={title} className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-sm">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-100 text-sky-600">
                  <Icon className="h-6 w-6" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-xl font-semibold text-slate-900">{title}</h3>
                  <p className="text-slate-600">{description}</p>
                  <ul className="space-y-2 text-sm text-slate-500">
                    {bullets.map((bullet) => (
                      <li key={bullet} className="flex items-start gap-2">
                        <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white py-20">
          <div className="container mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold text-slate-900">Built for every professional service team</h2>
                <p className="text-lg text-slate-600">
                  Whether you run a multi-location practice or a boutique studio, Denti Bot adapts to your workflows with industry-specific automations.
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-500" /> HIPAA-ready infrastructure
                  </div>
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-sky-500" /> Custom AI models
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-slate-500" /> Seamless scheduling stack
                  </div>
                </div>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                {servicePlaybooks.map(({ title, description, icon: Icon }) => (
                  <div key={title} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-inner">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-slate-700 mb-4">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
                    <p className="mt-2 text-sm text-slate-600">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-semibold text-slate-900">Clients stay longer when every touchpoint is proactive</h2>
              <p className="text-lg text-slate-600">Automate journeys from first inquiry to lifelong loyalty with AI that understands intent and context.</p>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/80 p-5">
                  <p className="text-sm font-medium text-emerald-800">Smart journeys</p>
                  <p className="mt-2 text-sm text-emerald-700">Trigger personalized flows for recalls, treatment plans, and follow-ups automatically.</p>
                </div>
                <div className="rounded-2xl border border-sky-100 bg-sky-50/80 p-5">
                  <p className="text-sm font-medium text-sky-800">Real-time insights</p>
                  <p className="mt-2 text-sm text-sky-700">Dashboards surface bottlenecks, projected revenue, and segments that need attention.</p>
                </div>
              </div>
            </div>
            <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl space-y-6">
              <h3 className="text-xl font-semibold text-slate-900">What teams are saying</h3>
              <div className="space-y-6">
                {testimonials.map(({ quote, name, role }) => (
                  <div key={name} className="space-y-3">
                    <p className="text-slate-600">“{quote}”</p>
                    <div className="text-sm font-medium text-slate-900">{name}</div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">{role}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-900 py-20">
          <div className="container mx-auto px-6">
            <div className="grid gap-12 lg:grid-cols-[1.1fr_0.9fr] items-center text-white">
              <div className="space-y-6">
                <h2 className="text-3xl font-semibold">Bring every workflow into one AI-powered HQ</h2>
                <p className="text-slate-300 text-lg">Connect your scheduling, messaging, marketing, and billing in minutes. Denti Bot keeps your front office running smoothly so you can focus on care.</p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100" onClick={() => setShowAppointmentBooking(true)}>
                    Get started now
                  </Button>
                  <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10" onClick={() => setShowEmergencyTriage(true)}>
                    Try emergency triage
                  </Button>
                </div>
              </div>
              <div className="rounded-[32px] border border-white/10 bg-white/10 p-8 backdrop-blur">
                <h3 className="text-xl font-semibold">What you'll unlock</h3>
                <ul className="mt-6 space-y-4 text-slate-200 text-sm">
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    Unified AI assistant trained on your knowledge base
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    Automated follow-ups, reminders, and payments
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                    Insights that surface risks before they impact revenue
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-6 py-20">
          {!selectedBusinessId ? (
            <div className="rounded-[32px] border border-slate-200 bg-white p-10 shadow-lg">
              <div className="mx-auto max-w-2xl text-center space-y-4">
                <h2 className="text-3xl font-semibold text-slate-900">Connect to your clinic</h2>
                <p className="text-slate-600">Choose your location to personalize automations and dashboards for your team.</p>
              </div>
              <div className="mt-10">
                <BusinessPickerHomepage onBusinessSelected={setSelectedBusinessId} />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6 text-center">
              <h2 className="text-3xl font-semibold text-slate-900">Ready when you are</h2>
              <p className="text-slate-600">Sign in to manage your workspace or invite teammates to collaborate.</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Button size="lg" asChild className="bg-slate-900 text-white hover:bg-slate-800">
                  <a href="/create-business">Create your business</a>
                </Button>
                <Button size="lg" asChild>
                  <a href="/login">Sign in</a>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <a href="/signup">Create account</a>
                </Button>
              </div>
              <Button
                variant="ghost"
                onClick={() => {
                  localStorage.removeItem("selected_business_id");
                  setSelectedBusinessId(null);
                }}
              >
                Choose a different clinic
              </Button>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Language Selection Modal */}
      {showLanguageSelection && <LanguageSelection onLanguageSelected={handleLanguageSelected} />}

      {/* Onboarding Popup */}
      <OnboardingPopup isOpen={showOnboarding} onClose={handleOnboardingClose} />
    </div>
  );
};
export default Index;
