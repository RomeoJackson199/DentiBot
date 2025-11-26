import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ArrowRight, PlayCircle, Shield, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccessibleLoadingIndicator } from "@/components/ui/skip-to-content";
import { DemoTourFlow } from "@/components/demo/DemoTourFlow";
import { AnimatedBackground } from "@/components/homepage/AnimatedBackground";
import { ScrollAnimatedSection } from "@/components/homepage/ScrollAnimatedSection";
import { BentoGridFeatures } from "@/components/homepage/BentoGridFeatures";
import { ProblemSection } from "@/components/homepage/ProblemSection";
import { StatsSection } from "@/components/homepage/StatsSection";
import { ResultsSection } from "@/components/homepage/ResultsSection";
import { PricingSection } from "@/components/homepage/PricingSection";
import { FloatingChatBubble } from "@/components/chat/FloatingChatBubble";
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
              <span>AI-Powered Reception</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 tracking-tight leading-[1.1] mb-8"
            >
              Never Miss Another <br />
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Patient Call
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed mb-10"
            >
              AI-powered phone reception that answers every call instantly, books appointments in real-time, and keeps your practice running 24/7.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-4"
            >
              <Button size="lg" className="h-14 px-8 text-lg bg-gray-900 hover:bg-gray-800 text-white rounded-full shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300" onClick={() => navigate('/signup')}>
                Sign Up
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg border-2 rounded-full hover:bg-gray-50 transition-all duration-300"
                onClick={() => setShowDemoTour(true)}
              >
                <PlayCircle className="mr-2 h-5 w-5" />
                Schedule a Demo
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1, delay: 1 }}
              className="pt-12 flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500 font-medium"
            >
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600" /> HIPAA Compliant
              </div>
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" /> Real-time Booking
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem Section */}
        <ProblemSection />

        {/* Comprehensive Features Grid */}
        <BentoGridFeatures />

        {/* Stats Section */}
        <StatsSection />

        {/* Results Section */}
        <ResultsSection />

        {/* Pricing Section */}
        <PricingSection />

        {/* Final CTA */}
        <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gray-900">
           <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:16px_16px]"></div>
           <div className="relative z-10 max-w-4xl mx-auto text-center">
             <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">
               Ready to Never Miss Another Call?
             </h2>
             <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
               Join forward-thinking practices transforming their patient experience.
             </p>
             <Button
               size="lg"
               className="h-16 px-10 text-lg bg-white text-gray-900 hover:bg-gray-100 rounded-full shadow-2xl font-semibold transition-all hover:scale-105"
               onClick={() => window.location.href = 'mailto:caberupreview.kevinjackson@agent.abundly.ai'}
             >
               Contact Us Today
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

      {/* Floating Chat Bubble */}
      <FloatingChatBubble />
    </div>
  );
};

export default Index;
