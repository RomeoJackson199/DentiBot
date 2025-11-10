import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Clock, Bell, Shield, Users, CheckCircle2, ArrowRight, Sparkles, Zap, Star, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AccessibleLoadingIndicator } from "@/components/ui/skip-to-content";
import { DemoTourFlow } from "@/components/demo/DemoTourFlow";
import { AnimatedBackground } from "@/components/homepage/AnimatedBackground";
import { ScrollAnimatedSection } from "@/components/homepage/ScrollAnimatedSection";
import { RotatingBenefitsCarousel } from "@/components/homepage/RotatingBenefitsCarousel";
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
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <AccessibleLoadingIndicator message="Loading Caberu" size="lg" />
      </div>;
  }

  // Homepage for non-authenticated users
  return <div className="min-h-screen bg-white">
      <Header user={user} minimal />

      <main id="main-content">
        {/* Hero Section */}
        <section className="relative pt-20 pb-32 px-4 sm:px-6 lg:px-8 overflow-hidden bg-gradient-to-br from-blue-50 via-white to-purple-50">
          {/* Animated Background */}
          <AnimatedBackground />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center space-y-8">
              {/* Badge */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-100 text-blue-700 text-xl font-medium"
              >
                <Sparkles className="h-6 w-6" />
                <span>AI-Powered Appointment Management</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
                className="text-4xl sm:text-5xl lg:text-7xl font-bold text-gray-900 tracking-tight"
              >
                Your Complete Healthcare
                <span className="block bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-4">
                  Practice Management System
                </span>
              </motion.h1>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                className="w-full"
              >
                <RotatingBenefitsCarousel />
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center items-center pt-8"
              >
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-2xl shadow-lg hover:shadow-xl transition-all group w-full sm:w-auto" onClick={() => navigate('/signup')} aria-label="Book your first appointment free">
                  Book Your First Appointment Free
                  <ArrowRight className="ml-3 h-5 w-5 sm:h-7 sm:w-7 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-purple-300 hover:border-purple-600 hover:bg-purple-50 px-8 sm:px-12 py-6 sm:py-8 text-lg sm:text-2xl transition-all group w-full sm:w-auto"
                  onClick={() => setShowDemoTour(true)}
                  aria-label="Watch interactive demo"
                >
                  <PlayCircle className="mr-3 h-5 w-5 sm:h-7 sm:w-7 group-hover:scale-110 transition-transform" />
                  Watch Demo
                </Button>
              </motion.div>

              {/* Trust indicators */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
                className="flex flex-wrap justify-center items-center gap-12 pt-12 text-xl text-gray-600"
              >
                <div className="flex items-center gap-3">
                  <Shield className="h-8 w-8 text-blue-600" />
                  <span>HIPAA Compliant</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center gap-3">
                  <Sparkles className="h-8 w-8 text-purple-600" />
                  <span>AI-Powered Features</span>
                </div>
                <div className="flex items-center gap-3">
                  <Users className="h-8 w-8 text-green-600" />
                  <span>Multi-Location Support</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <ScrollAnimatedSection className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Everything Your Healthcare Practice Needs
              </h2>
              <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
                Comprehensive practice management tools designed by healthcare professionals, for healthcare professionals
              </p>
            </ScrollAnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {([{
              icon: Calendar,
              title: "Smart Appointment Scheduling",
              description: "Reduce no-shows by 40% with intelligent scheduling that sends automated SMS and email reminders to patients",
              gradient: "from-blue-500 to-cyan-500"
            }, {
              icon: Zap,
              title: "AI-Powered Patient Insights",
              description: "Predict patient needs and preferences before appointments, enabling personalized care and better preparation",
              gradient: "from-purple-500 to-pink-500"
            }, {
              icon: Bell,
              title: "Automated Reminders & Recalls",
              description: "Cut no-shows by 40% with automated appointment reminders via SMS, email, and recall systems for follow-ups",
              gradient: "from-orange-500 to-red-500"
            }, {
              icon: Users,
              title: "Centralized Patient Records",
              description: "Access complete patient history, treatment plans, and medical records instantly from one unified dashboard",
              gradient: "from-green-500 to-emerald-500"
            }, {
              icon: Shield,
              title: "HIPAA-Compliant Security",
              description: "Enterprise-grade encryption and HIPAA compliance keeps patient data secure with bank-level protection",
              gradient: "from-indigo-500 to-blue-500"
            }, {
              icon: CheckCircle2,
              title: "Streamlined Billing & Payments",
              description: "Automated payment reminders reduce outstanding balances, with integrated billing that saves 3+ hours per week",
              gradient: "from-teal-500 to-cyan-500"
            }] as const).map((feature, index) => <ScrollAnimatedSection key={index} delay={index * 0.1} direction="up">
                <Card className="group p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-2xl transition-all duration-300 cursor-pointer relative overflow-hidden h-full flex flex-col" role="article" tabIndex={0} aria-label={`Feature: ${feature.title}`}>
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                  <div className="relative flex flex-col h-full">
                    <div className={`inline-flex p-4 rounded-xl bg-gradient-to-br ${feature.gradient} mb-6 group-hover:scale-110 transition-transform duration-300 w-fit`}>
                      <feature.icon className="h-10 w-10 text-white" aria-hidden="true" />
                    </div>
                    <h3 className="text-2xl font-semibold text-gray-900 mb-4 group-hover:text-blue-600 transition-colors">
                      {feature.title}
                    </h3>
                    <p className="text-xl text-gray-600 leading-relaxed flex-grow">{feature.description}</p>
                  </div>
                </Card>
              </ScrollAnimatedSection>)}
            </div>

            {/* Additional features list */}
            <ScrollAnimatedSection className="mt-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 md:p-12" delay={0.3}>
              <h3 className="text-4xl font-bold text-gray-900 mb-8 text-center">Plus Much More</h3>
              <div className="grid grid-cols-2 gap-8">
                {["Multi-location & multi-provider support", "Inventory management with low-stock alerts", "Comprehensive analytics & reporting", "Mobile-responsive PWA design", "Customizable clinic templates", "Real-time notifications & messaging", "Prescription management system", "Treatment plan tracking", "Staff & team management", "Data import/export tools", "Custom branding & white-labeling", "Google Calendar synchronization"].map((feature, index) => <div key={index} className="flex items-center gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" aria-hidden="true" />
                    </div>
                    <span className="text-gray-700 font-medium text-xl">{feature}</span>
                  </div>)}
              </div>
            </ScrollAnimatedSection>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-blue-50">
          <div className="max-w-7xl mx-auto">
            <ScrollAnimatedSection className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Why Healthcare Practices Choose Caberu
              </h2>
              <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
                Built specifically for healthcare professionals with the features you actually need
              </p>
            </ScrollAnimatedSection>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-10">
              {[{
              title: "Save Time",
              description: "Reduce administrative work by up to 60% with automated scheduling, reminders, and patient communications",
              stat: "60% less admin time"
            }, {
              title: "Increase Revenue",
              description: "Reduce no-shows, improve appointment utilization, and streamline billing to boost practice income",
              stat: "40% fewer no-shows"
            }, {
              title: "Better Patient Care",
              description: "Access complete patient histories instantly, track treatment plans, and provide more personalized care",
              stat: "100% organized records"
            }].map((benefit, index) => <ScrollAnimatedSection key={index} delay={index * 0.15}>
                <Card className="p-8 lg:p-10 text-center bg-white border-2 border-blue-100 hover:border-blue-300 hover:shadow-xl transition-all duration-300">
                  <div className="text-5xl font-bold text-blue-600 mb-4">{benefit.stat}</div>
                  <h3 className="text-3xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                  <p className="text-xl text-gray-600">{benefit.description}</p>
                </Card>
              </ScrollAnimatedSection>)}
            </div>
          </div>
        </section>

        {/* Pricing Preview Section */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-7xl mx-auto">
            <ScrollAnimatedSection className="text-center mb-16">
              <h2 className="text-5xl font-bold text-gray-900 mb-6">
                Simple, Transparent Pricing
              </h2>
              <p className="text-2xl text-gray-600 max-w-4xl mx-auto">
                Start free, upgrade when you're ready. No hidden fees, cancel anytime.
              </p>
            </ScrollAnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
              {/* Starter Plan */}
              <ScrollAnimatedSection delay={0} direction="up">
                <Card className="p-6 lg:p-8 border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">€99</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Perfect for small practices</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Up to 500 customers", "Normal booking system", "Patient reminders", "Mobile app access", "Email support"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="w-full border-2"
                >
                  Get Started
                </Button>
              </Card>
              </ScrollAnimatedSection>

              {/* Professional Plan */}
              <ScrollAnimatedSection delay={0.15} direction="up">
                <Card className="p-6 lg:p-8 border-2 border-blue-600 bg-gradient-to-br from-blue-50 to-purple-50 relative shadow-xl hover:shadow-2xl duration-300 h-full">
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-1 rounded-full text-sm font-semibold shadow-lg">
                    Most Popular
                  </div>
                </div>
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Professional</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">€250</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">For growing practices</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Up to 2,500 customers", "AI booking system", "Custom training", "2,000 emails per month", "Billing & payments", "Analytics & reporting", "Priority support"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <span className="text-sm font-medium">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/pricing')}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg"
                >
                  Start Free Trial
                </Button>
              </Card>
              </ScrollAnimatedSection>

              {/* Enterprise Plan */}
              <ScrollAnimatedSection delay={0.3} direction="up">
                <Card className="p-6 lg:p-8 border-2 border-gray-200 hover:border-gray-300 hover:shadow-lg transition-all duration-300 h-full">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Enterprise</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-gray-900">€999</span>
                    <span className="text-gray-600">/month</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">For large organizations</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {["Up to 7,500 patients", "Unlimited AI triage system", "Custom training", "Multi-location system", "7,500 emails per month", "Dedicated account manager", "24/7 phone support"].map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle2 className="h-5 w-5 text-purple-600 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => navigate('/pricing')}
                  variant="outline"
                  className="w-full border-2"
                >
                  Get Started
                </Button>
              </Card>
              </ScrollAnimatedSection>
            </div>

            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">All plans include a 14-day free trial. No credit card required.</p>
              <Button
                onClick={() => navigate('/pricing')}
                variant="link"
                className="text-blue-600 hover:text-blue-700"
              >
                View detailed pricing →
              </Button>
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
              Ready to Transform Your Healthcare Practice?
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Join modern healthcare practices using Caberu to save time, reduce no-shows, and provide better patient care.
              Get started today—no credit card required.
            </p>

            <div className="flex flex-col md:flex-row gap-4 justify-center items-center pt-4">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-6 text-lg shadow-2xl hover:shadow-3xl transition-all group font-semibold" onClick={() => navigate('/signup')} aria-label="Start your free trial today">
                Start Your Free Trial
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
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
      
      {/* Demo Tour Modal */}
      <DemoTourFlow 
        isOpen={showDemoTour} 
        onClose={() => setShowDemoTour(false)} 
      />
    </div>;
};
export default Index;