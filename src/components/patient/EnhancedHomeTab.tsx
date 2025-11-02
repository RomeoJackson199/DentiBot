import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Calendar, 
  Pill, 
  CreditCard, 
  MessageSquare, 
  Clock,
  FileText,
  Heart,
  Gift,
  ChevronRight,
  Sparkles
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";
import { useCurrency } from "@/hooks/useCurrency";
import { User } from "@supabase/supabase-js";
import { logger } from '@/lib/logger';
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';

interface EnhancedHomeTabProps {
  user: User;
  onNavigate?: (tab: string) => void;
  onOpenAssistant?: () => void;
}

export const EnhancedHomeTab: React.FC<EnhancedHomeTabProps> = ({
  user,
  onNavigate,
  onOpenAssistant
}) => {
  const { t } = useLanguage();
  const { settings } = useCurrency();
  const formatCurrency = settings.format;
  const { hasFeature } = useBusinessTemplate();
  const hasAIChat = hasFeature('aiChat');
  const [greeting, setGreeting] = useState("");
  const [userName, setUserName] = useState("");
  const [nextAppointment, setNextAppointment] = useState<any>(null);
  const [prescriptionCount, setPrescriptionCount] = useState(0);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");

    fetchUserData();
  }, [user.id]);

  const fetchUserData = async () => {
    try {
      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, id')
        .eq('user_id', user.id)
        .single();

      if (profile) {
        setUserName(profile.first_name || "");

        // Get next appointment
        const { data: appointments } = await supabase
          .from('appointments')
          .select(`
            *,
            dentists:dentist_id(
              profiles:profile_id(first_name, last_name)
            )
          `)
          .eq('patient_id', profile.id)
          .gte('appointment_date', new Date().toISOString())
          .eq('status', 'confirmed')
          .order('appointment_date', { ascending: true })
          .limit(1);

        if (appointments && appointments.length > 0) {
          setNextAppointment(appointments[0]);
        }

        // Get active prescriptions count
        const { data: prescriptions } = await supabase
          .from('prescriptions')
          .select('id')
          .eq('patient_id', profile.id)
          .eq('status', 'active');

        setPrescriptionCount(prescriptions?.length || 0);

        // Calculate outstanding balance
        const { data: paymentRequests } = await supabase
          .from('payment_requests')
          .select('amount, status')
          .eq('patient_id', profile.id)
          .in('status', ['pending', 'overdue']);

        const totalBalance = (paymentRequests || []).reduce((sum, pr) => sum + (pr.amount || 0), 0);
        setBalance(totalBalance / 100); // Convert cents to euros
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatAppointmentDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: custom * 0.1,
        duration: 0.4,
        ease: [0.4, 0, 0.2, 1] as any
      }
    })
  };

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-48 bg-muted rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 md:p-6">
      {/* Smart Greeting Bar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-primary text-white rounded-2xl p-6 shadow-elegant"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-6 w-6" />
          <div>
            <h2 className="text-2xl font-bold font-heading">
              {greeting}, {userName || "there"} 👋
            </h2>
            <p className="text-white/90 mt-1">
              {nextAppointment 
                ? `You're all set for your next appointment on ${formatAppointmentDate(nextAppointment.appointment_date)}`
                : "No upcoming appointments scheduled"}
            </p>
          </div>
        </div>
      </motion.div>

      {/* 2x2 Card Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Upcoming Appointment Card */}
        <motion.div
          custom={0}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card 
            className="h-full rounded-2xl border-2 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-elegant"
            onClick={() => onNavigate?.('appointments')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Calendar className="h-8 w-8 text-primary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Upcoming Appointment</h3>
              {nextAppointment ? (
                <div className="space-y-2">
                  <p className="text-2xl font-bold text-primary">
                    {formatAppointmentDate(nextAppointment.appointment_date).split(' at ')[0]}
                  </p>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    {formatAppointmentDate(nextAppointment.appointment_date).split(' at ')[1] || 'Time TBD'}
                  </p>
                  {nextAppointment.dentist?.profile && (
                    <p className="text-sm text-muted-foreground">
                      Dr. {nextAppointment.dentist.profile.first_name} {nextAppointment.dentist.profile.last_name}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-muted-foreground mb-3">No appointments scheduled</p>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenAssistant?.();
                    }}
                  >
                    Book Now
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Unpaid Balance Card */}
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card 
            className="h-full rounded-2xl border-2 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-elegant"
            onClick={() => onNavigate?.('payments')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-secondary/10 rounded-xl group-hover:scale-110 transition-transform">
                  <CreditCard className="h-8 w-8 text-secondary" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Outstanding Balance</h3>
              <p className="text-3xl font-bold text-secondary mb-2">
                {formatCurrency(balance)}
              </p>
              {balance > 0 ? (
                <Button 
                  size="sm" 
                  variant="aqua"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate?.('payments');
                  }}
                >
                  Pay Now
                </Button>
              ) : (
                <p className="text-sm text-muted-foreground">All caught up! ✅</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Prescriptions Card */}
        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          <Card 
            className="h-full rounded-2xl border-2 hover:border-primary/50 transition-all cursor-pointer group hover:shadow-elegant"
            onClick={() => onNavigate?.('care')}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-accent/10 rounded-xl group-hover:scale-110 transition-transform">
                  <Pill className="h-8 w-8 text-accent-foreground" />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="font-heading font-semibold text-lg mb-2">Active Prescriptions</h3>
              <p className="text-3xl font-bold text-accent-foreground mb-2">
                {prescriptionCount}
              </p>
              <p className="text-sm text-muted-foreground">
                {prescriptionCount === 0 ? "No active medications" : "Active medications"}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Assistant Card */}
        {hasAIChat && (
          <motion.div
            custom={3}
            initial="hidden"
            animate="visible"
            variants={cardVariants}
          >
            <Card 
              className="h-full rounded-2xl border-2 border-primary/30 hover:border-primary transition-all cursor-pointer group bg-gradient-to-br from-primary/5 to-secondary/5 hover:shadow-glow"
              onClick={onOpenAssistant}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <MessageSquare className="h-8 w-8 text-primary animate-pulse-soft" />
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">AI Assistant</h3>
                <p className="text-muted-foreground mb-3">
                  Ask questions, book appointments, or get dental advice
                </p>
                <Button 
                  size="sm" 
                  variant="gradient"
                  className="w-full"
                >
                  Chat Now
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="font-heading font-semibold text-lg mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onNavigate?.('care')}
          >
            <FileText className="h-5 w-5" />
            <span className="text-xs">Treatment Plans</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onNavigate?.('care')}
          >
            <Heart className="h-5 w-5" />
            <span className="text-xs">Health Records</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={onOpenAssistant}
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Emergency</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => onNavigate?.('care')}
          >
            <Gift className="h-5 w-5" />
            <span className="text-xs">Rewards</span>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};
