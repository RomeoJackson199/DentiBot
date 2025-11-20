import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, PlayCircle, Shield, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccessibleLoadingIndicator } from "@/components/ui/skip-to-content";
import { DemoTourFlow } from "@/components/demo/DemoTourFlow";
import { AnimatedBackground } from "@/components/homepage/AnimatedBackground";
import { ScrollAnimatedSection } from "@/components/homepage/ScrollAnimatedSection";
import { BentoGridFeatures } from "@/components/homepage/BentoGridFeatures";
import { motion } from "framer-motion";

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDemoTour, setShowDemoTour] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check for existing session
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // Redirect authenticated users to auth redirect handler
      if (currentUser) {
        navigate('/auth-redirect', { replace: true });
      }
    }).catch(() => {
      setLoading(false);
    });

    // Set up auth state listener
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setLoading(false);
      
      // Redirect authenticated users to auth redirect handler
      if (currentUser) {
        navigate('/auth-redirect', { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AccessibleLoadingIndicator message="Loading Caberu" size="lg" />
      </div>
    );
  }

  // Homepage for non-authenticated users
  return (
    <div className="min-h-screen bg-white font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      <Header user={user} minimal />

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-32 lg:pb-40 px-4 sm:px-6 lg:px-8 overflow-hidden">
          {/* Animated Background */}
          <AnimatedBackground />

          <div className="max-w-5xl mx-auto relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 backdrop-blur-md border border-blue-100 shadow-sm text-blue-700 font-medium mb-8"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              <span>Next-Gen Practice Management</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-8"
            >
              Your Clinic, <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Autopilot Enabled
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10"
            >
              A receptionist you can call, personalized to your clinic.
              It books appointments, answers questions, and is available 24/7.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Button size="lg" className="h-14 px-8 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" onClick={() => navigate('/signup')}>
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg border-2 rounded-full hover:bg-gray-50 transition-all duration-300"
                onClick={() => setShowDemoTour(true)}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="pt-12 flex items-center justify-center gap-6 text-sm text-gray-500 font-medium"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-500" /> 4.9/5 Average Rating
              </div>
            </motion.div>
          </div>
        </section>

        {/* Comprehensive Features Grid */}
        <BentoGridFeatures />

        {/* Pricing Section Redesigned */}
        <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <ScrollAnimatedSection className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Transparent Pricing
              </h2>
              <p className="text-lg text-gray-600">
                No hidden fees. Cancel anytime. 14-day free trial.
              </p>
            </ScrollAnimatedSection>

            <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Starter */}
              <ScrollAnimatedSection delay={0}>
                <Card className="p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-all bg-white h-full flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Starter</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-gray-900">€99</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {["Up to 500 patients", "Basic Calendar", "Email Reminders", "Standard Support"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full rounded-xl h-12 border-gray-300" onClick={() => navigate('/pricing')}>
                    Choose Starter
                  </Button>
                </Card>
              </ScrollAnimatedSection>

              {/* Professional - Highlighted */}
              <ScrollAnimatedSection delay={0.1}>
                <Card className="relative p-8 rounded-3xl border-2 border-blue-600 shadow-2xl bg-white h-full flex flex-col scale-105 z-10">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                    Most Popular
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Professional</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-gray-900">€250</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {["Up to 2,500 patients", "AI Receptionist (Basic)", "SMS & Email Reminders", "Billing & Invoicing", "Priority Support"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-gray-700 text-sm font-medium">
                        <CheckCircle2 className="w-5 h-5 text-blue-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full rounded-xl h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg" onClick={() => navigate('/pricing')}>
                    Start Free Trial
                  </Button>
                </Card>
              </ScrollAnimatedSection>

              {/* Enterprise */}
              <ScrollAnimatedSection delay={0.2}>
                <Card className="p-8 rounded-3xl border border-gray-200 shadow-sm hover:shadow-lg transition-all bg-white h-full flex flex-col">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Enterprise</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-bold text-gray-900">€999</span>
                    <span className="text-gray-500">/mo</span>
                  </div>
                  <ul className="space-y-4 mb-8 flex-1">
                    {["Unlimited patients", "Advanced AI & Analytics", "Multi-location Support", "Dedicated Manager", "Custom Integrations"].map((item) => (
                      <li key={item} className="flex items-center gap-3 text-gray-700 text-sm">
                        <CheckCircle2 className="w-5 h-5 text-purple-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button variant="outline" className="w-full rounded-xl h-12 border-gray-300" onClick={() => navigate('/pricing')}>
                    Contact Sales
                  </Button>
                </Card>
              </ScrollAnimatedSection>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-900">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
           <div className="relative z-10 max-w-4xl mx-auto text-center">
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
               Ready to modernize your clinic?
             </h2>
             <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
               Join thousands of healthcare professionals who trust Caberu to manage their practice.
             </p>
             <Button
               size="lg"
               className="h-16 px-10 text-lg bg-white text-gray-900 hover:bg-gray-100 rounded-full shadow-2xl font-semibold transition-all hover:scale-105"
               onClick={() => navigate('/signup')}
             >
               Get Started Now
               <ArrowRight className="ml-2 h-5 w-5" />
             </Button>
             <p className="mt-6 text-sm text-gray-500">
               No credit card required • 14-day free trial • Cancel anytime
             </p>
           </div>
        </section>
      </main>

      <Footer />
      
      {/* Demo Tour Modal */}
      <DemoTourFlow 
        isOpen={showDemoTour} 
        onClose={() => setShowDemoTour(false)} 
      />
    </div>
  );
};

export default Index;
