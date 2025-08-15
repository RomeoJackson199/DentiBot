import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

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

const QuickActionCard = ({ 
  icon: Icon, 
  title, 
  subtitle, 
  onClick, 
  color, 
  badge,
  delay = 0 
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  onClick: () => void;
  color: string;
  badge?: string | number;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
  >
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary/30 relative overflow-hidden group h-full"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
      <CardContent className="p-5 md:p-6 relative h-full flex flex-col">
        <div className="flex items-start justify-between mb-4">
          <div className={cn("p-3 rounded-xl transition-transform group-hover:scale-110", color)}>
            <Icon className="h-6 w-6 md:h-7 md:w-7" />
          </div>
          {badge && (
            <Badge variant="secondary" className="animate-pulse font-semibold">
              {badge}
            </Badge>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <h3 className="font-semibold text-base md:text-lg mb-2">{title}</h3>
          <p className="text-sm md:text-base text-muted-foreground">{subtitle}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

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

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  const quickActions = [
    {
      icon: Calendar,
      title: "Book Appointment",
      subtitle: "Schedule with AI assistant",
      onClick: onOpenAssistant || (() => {}),
      color: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
      badge: "AI"
    },
    {
      icon: MessageSquare,
      title: "AI Assistant",
      subtitle: "Get instant help",
      onClick: onOpenAssistant || (() => {}),
      color: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
      badge: "AI"
    },
    {
      icon: Pill,
      title: "Prescriptions",
      subtitle: `${activePrescriptions} active`,
      onClick: () => onNavigateTo('care'),
      color: "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
      badge: activePrescriptions > 0 ? activePrescriptions : undefined
    },
    {
      icon: CreditCard,
      title: unpaid ? "Pay Balance" : "Payments",
      subtitle: unpaid ? `€${(totalDueCents/100).toFixed(2)} due` : "All paid",
      onClick: () => onNavigateTo('payments'),
      color: unpaid 
        ? "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
        : "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
      badge: unpaid ? "!" : undefined
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Enhanced Header with Avatar and Stats */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-xl border-b border-border shadow-sm">
        <div className="px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <Avatar className="h-12 w-12 md:h-14 md:w-14 ring-2 ring-primary/20">
                  {profileImageUrl ? (
                    <AvatarImage src={profileImageUrl} />
                  ) : (
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60">
                      <UserIcon className="h-6 w-6 text-primary-foreground" />
                    </AvatarFallback>
                  )}
                </Avatar>
              </motion.div>
              <div>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-xs text-muted-foreground"
                >
                  {greeting}
                </motion.p>
                <motion.p 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-base md:text-lg font-semibold"
                >
                  {firstName ? `${firstName}` : 'Welcome back'}
                </motion.p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <NotificationButton userId={userId} />
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 md:px-6 py-4 md:py-6 space-y-4 md:space-y-6">
        {/* Quick Actions Grid - Responsive */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {quickActions.map((action, index) => (
            <QuickActionCard
              key={index}
              {...action}
              delay={index * 0.05}
            />
          ))}
        </div>

        {/* Next Appointment Card - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-primary" />
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center justify-between">
                <span className="flex items-center">
                  <Calendar className="h-4 w-4 md:h-5 md:w-5 mr-2 text-primary" />
                  Next Appointment
                </span>
                {nextAppointment?.status && (
                  <Badge variant="outline" className="capitalize">
                    {nextAppointment.status}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-4">
              {nextAppointment ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm md:text-base">
                          {nextAppointment.date}
                          {nextAppointment.time && ` at ${nextAppointment.time}`}
                        </p>
                        <p className="text-xs md:text-sm text-muted-foreground">
                          {nextAppointment.dentistName || 'Your dentist'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      variant="outline" 
                      size="default" 
                      onClick={onOpenAssistant || (() => onNavigateTo('appointments'))}
                      className="flex-1 h-11"
                    >
                      <RefreshCw className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Reschedule
                    </Button>
                    <Button 
                      variant="outline" 
                      size="default"
                      className="flex-1 h-11"
                    >
                      <Navigation2 className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                      Directions
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-3">
                    No upcoming appointments
                  </p>
                  <Button 
                    size="default" 
                    onClick={onOpenAssistant || (() => {})}
                    className="w-full md:w-auto px-6 h-11"
                  >
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Book with AI Assistant
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Treatment Overview - Responsive Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => onNavigateTo('care')}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400 group-hover:scale-110 transition-transform">
                      <ClipboardList className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base">Treatment Plans</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {activeTreatmentPlans} active plan{activeTreatmentPlans !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                {activeTreatmentPlans > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">60%</span>
                    </div>
                    <Progress value={60} className="h-1.5 mt-1" />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className="hover:shadow-lg transition-all cursor-pointer group"
              onClick={() => onNavigateTo('care')}
            >
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 rounded-xl bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 group-hover:scale-110 transition-transform">
                      <Pill className="h-5 w-5 md:h-6 md:w-6" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm md:text-base">Medications</p>
                      <p className="text-xs md:text-sm text-muted-foreground">
                        {activePrescriptions} active
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                </div>
                {activePrescriptions > 0 && (
                  <div className="pt-3 border-t">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-3 w-3 text-yellow-600" />
                      <span className="text-xs text-muted-foreground">
                        Remember to take medications
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Alerts & Tips - Enhanced */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base md:text-lg flex items-center">
                <Zap className="h-4 w-4 md:h-5 md:w-5 mr-2 text-yellow-600" />
                Daily Tips & Reminders
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {nextAppointment ? (
                  <div className="flex items-start space-x-2">
                    <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-yellow-600 flex-shrink-0" />
                    <p className="text-xs md:text-sm">
                      Remember to arrive 10 minutes early for your appointment on {nextAppointment.date}
                    </p>
                  </div>
                ) : null}
                <div className="flex items-start space-x-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-orange-600 flex-shrink-0" />
                  <p className="text-xs md:text-sm">
                    Brush your teeth twice daily for at least 2 minutes
                  </p>
                </div>
                <div className="flex items-start space-x-2">
                  <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-green-600 flex-shrink-0" />
                  <p className="text-xs md:text-sm">
                    Don't forget to floss daily to maintain healthy gums
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Stats - Mobile Optimized */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.45 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
        >
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-4">
              <Star className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
              <p className="text-2xl font-bold">4.8</p>
              <p className="text-xs text-muted-foreground">Health Rating</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-4">
              <Activity className="h-8 w-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">12</p>
              <p className="text-xs text-muted-foreground">Visits This Year</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-4">
              <Shield className="h-8 w-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">100%</p>
              <p className="text-xs text-muted-foreground">Coverage</p>
            </CardContent>
          </Card>
          <Card className="text-center hover:shadow-md transition-shadow">
            <CardContent className="p-3 md:p-4">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-purple-500" />
              <p className="text-2xl font-bold">+15%</p>
              <p className="text-xs text-muted-foreground">Health Improved</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};