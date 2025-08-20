import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { NotificationButton } from "@/components/NotificationButton";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Navigation2,
  RefreshCw,
  Pill,
  ClipboardList,
  CreditCard,
  MessageSquare,
  User as UserIcon,
  Bell,
  Heart,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle,
  Sparkles,
  ChevronRight,
  Star,
  Shield,
  Zap,
  Video,
  ArrowRight,
  Info,
  CheckCircle,
  Target,
  Award
} from "lucide-react";
import { cn } from "@/lib/utils";
import { RecallBanner } from "@/components/patient/RecallBanner";
import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getPatientActiveRecall, RecallRecord } from "@/lib/recalls";
import { useLanguage } from "@/hooks/useLanguage";

export interface HomeTabProps {
  userId: string;
  firstName?: string | null;
  profileImageUrl?: string | null;
  nextAppointment?: {
    id: string;
    date: string;
    time?: string | null;
    dentistName?: string | null;
    status?: string;
  } | null;
  activePrescriptions: number;
  activeTreatmentPlans: number;
  totalDueCents: number;
  onNavigateTo: (section: 'appointments' | 'care' | 'payments') => void;
  onOpenAssistant?: () => void;
}

export const HomeTab: React.FC<HomeTabProps> = ({
  userId,
  firstName,
  profileImageUrl,
  nextAppointment,
  activePrescriptions,
  activeTreatmentPlans,
  totalDueCents,
  onNavigateTo,
  onOpenAssistant,
}) => {
  const [greeting, setGreeting] = useState("");
  const unpaid = totalDueCents > 0;
  const [activeRecall, setActiveRecall] = useState<RecallRecord | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    (async () => {
      // Load patient profile id and active recall
      const { data: profile } = await supabase.from('profiles').select('id').eq('user_id', userId).single();
      if (profile?.id) {
        const rec = await getPatientActiveRecall(profile.id);
        setActiveRecall(rec);
      }
    })();
  }, [userId]);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t.goodMorning);
    else if (hour < 18) setGreeting(t.goodAfternoon);
    else setGreeting(t.goodEvening);
  }, [t]);

  // Mock data for demonstration - would come from API
  const healthRating = 85;
  const visitsThisYear = 3;
  const coverageUsed = 65;
  const healthImprovement = 12;

  return (
    <div className="px-4 md:px-6 py-4 space-y-6 max-w-7xl mx-auto">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center space-x-4">
          <Avatar className="h-12 w-12 md:h-14 md:w-14">
            <AvatarImage src={profileImageUrl || undefined} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {firstName?.[0]?.toUpperCase() || 'P'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
              {greeting}, {firstName || 'Patient'}!
            </h1>
            <p className="text-muted-foreground">{t.hereIsYourHealthOverview}</p>
          </div>
        </div>
        <NotificationButton userId={userId} />
      </motion.div>

      {activeRecall && (
        <div>
          <RecallBanner recall={activeRecall} />
        </div>
      )}

      {/* Primary Cards Section - In specified order */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* 1. Next Appointment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-2 lg:col-span-2"
        >
          <Card className="h-full border-2 hover:border-primary/30 transition-all hover:shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-orange-600" />
                  {t.nextAppointment}
                </span>
                {nextAppointment && (
                  <Badge className="bg-green-100 text-green-800">{t.confirmed}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {nextAppointment ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold">{nextAppointment.date}</p>
                      <p className="text-muted-foreground">{nextAppointment.time || 'Time TBD'}</p>
                      {nextAppointment.dentistName && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Dr. {nextAppointment.dentistName}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" variant="outline" onClick={() => onNavigateTo('appointments')}>
                        Reschedule
                      </Button>
                      {/* Show Join button for online appointments - would check appointment type */}
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        <Video className="h-4 w-4 mr-1" />
                        Join
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">{t.noUpcomingAppointments}</p>
                  <Button onClick={() => onNavigateTo('appointments')} className="w-full">
                    {t.bookAppointment}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* 2. Prescriptions Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full hover:shadow-lg transition-all cursor-pointer group"
                onClick={() => onNavigateTo('care')}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <Pill className="h-5 w-5 text-purple-600" />
                  {t.prescriptions}
                </span>
                {activePrescriptions > 0 && (
                  <Badge className="bg-purple-100 text-purple-800">
                    {activePrescriptions} {t.active}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-2xl font-bold">{activePrescriptions}</p>
                <p className="text-sm text-muted-foreground">{t.activeMedications}</p>
                <Button variant="link" className="p-0 h-auto text-primary group-hover:underline">
                  {t.viewInCareTab}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 3. Outstanding Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className={cn(
            "h-full hover:shadow-lg transition-all",
            unpaid && "border-red-200 bg-red-50/50 dark:bg-red-900/10"
          )}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <CreditCard className={cn("h-5 w-5", unpaid ? "text-red-600" : "text-green-600")} />
                  {t.balance}
                </span>
                {unpaid && (
                  <Badge variant="destructive">{t.due}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className={cn("text-2xl font-bold", unpaid ? "text-red-600" : "text-green-600")}>
                  €{(totalDueCents/100).toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {unpaid ? t.amountDue : t.allPaid}
                </p>
                {unpaid && (
                  <Button 
                    onClick={() => onNavigateTo('payments')}
                    className="w-full bg-red-600 hover:bg-red-700"
                    size="sm"
                  >
                    {t.payNow}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* 4. AI Assistant Shortcut Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="md:col-span-2 lg:col-span-1"
        >
          <Card className="h-full bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 border-emerald-200 hover:shadow-lg transition-all cursor-pointer"
                onClick={onOpenAssistant}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-emerald-600" />
                  {t.aiAssistant}
                </span>
                <Badge className="bg-emerald-100 text-emerald-700">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm font-medium">{t.getInstantHelpWith}</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    {t.bookingAppointments}
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    {t.dentalQuestions}
                  </li>
                  <li className="flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-emerald-600" />
                    {t.emergencyTriage}
                  </li>
                </ul>
                <Button variant="secondary" className="w-full mt-3" size="sm">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t.startChat}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Secondary Section - Daily Tips & Health Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-8">
        
        {/* Daily Tips & Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-1"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-blue-600" />
                {t.dailyTipsReminders}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  {t.morningReminder}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.dontForgetToBrush}
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Heart className="h-4 w-4 text-green-600" />
                  {t.healthTip}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.flossingDaily}
                </p>
              </div>
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <p className="text-sm font-medium flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  {t.upcoming}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.dentalCleaningRecommended}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="lg:col-span-2"
        >
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Activity className="h-5 w-5 text-purple-600" />
                {t.healthStats}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Health Rating */}
                <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-900/20 dark:to-green-900/10 rounded-lg">
                  <div className="relative inline-flex items-center justify-center">
                    <Progress value={healthRating} className="h-16 w-16 rounded-full" />
                    <span className="absolute text-lg font-bold">{healthRating}%</span>
                  </div>
                  <p className="text-xs font-medium mt-2">{t.healthRating}</p>
                  <p className="text-xs text-muted-foreground">{t.excellent}</p>
                </div>

                {/* Visits This Year */}
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-900/20 dark:to-blue-900/10 rounded-lg">
                  <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{visitsThisYear}</p>
                  <p className="text-xs font-medium">{t.visitsThisYear}</p>
                  <p className="text-xs text-muted-foreground">{t.onTrack}</p>
                </div>

                {/* Coverage */}
                <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg">
                  <Shield className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">{coverageUsed}%</p>
                  <p className="text-xs font-medium">{t.coverageUsed}</p>
                  <p className="text-xs text-muted-foreground">€350 {t.remaining}</p>
                </div>

                {/* Health Improved */}
                <div className="text-center p-4 bg-gradient-to-br from-emerald-50 to-emerald-100/50 dark:from-emerald-900/20 dark:to-emerald-900/10 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold">+{healthImprovement}%</p>
                  <p className="text-xs font-medium">{t.healthImproved}</p>
                  <p className="text-xs text-muted-foreground">{t.lastSixMonths}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions - Optional additional row */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6"
      >
        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5"
          onClick={() => onNavigateTo('care')}
        >
          <ClipboardList className="h-5 w-5 text-orange-600" />
          <span className="text-xs">{t.treatmentPlans}</span>
          {activeTreatmentPlans > 0 && (
            <Badge variant="secondary" className="text-xs">{activeTreatmentPlans}</Badge>
          )}
        </Button>

        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5"
          onClick={() => onNavigateTo('care')}
        >
          <Heart className="h-5 w-5 text-red-600" />
          <span className="text-xs">Health Records</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5"
          onClick={onOpenAssistant}
        >
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <span className="text-xs">Emergency</span>
        </Button>

        <Button 
          variant="outline" 
          className="h-auto py-4 flex flex-col items-center gap-2 hover:bg-primary/5"
          onClick={() => onNavigateTo('appointments')}
        >
          <Award className="h-5 w-5 text-purple-600" />
          <span className="text-xs">Rewards</span>
        </Button>
      </motion.div>
    </div>
  );
};