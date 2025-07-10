import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock, ArrowRight, Sparkles, CheckCircle, LinkIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedCard } from "@/components/ui/animated-card";
import { toast } from "sonner";

interface ChatCalendarProps {
  onDateSelect: (date: Date) => void;
  onTimeSelect: (time: string) => void;
  selectedDate?: Date;
  selectedTime?: string;
  onConfirm?: () => void;
}

export const ChatCalendar = ({ 
  onDateSelect, 
  onTimeSelect, 
  selectedDate, 
  selectedTime,
  onConfirm 
}: ChatCalendarProps) => {
  const [step, setStep] = useState<'date' | 'time'>('date');
  const [availableTimes, setAvailableTimes] = useState<{ time: string; available: boolean }[]>([]);
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [oauthTokens, setOauthTokens] = useState<any>(null);
  const [isAuthorizing, setIsAuthorizing] = useState(false);

  // Check for OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode && !oauthTokens) {
      exchangeAuthCode(authCode);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [oauthTokens]);

  const initiateOAuthFlow = async () => {
    setIsAuthorizing(true);
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: { action: 'getAuthUrl' }
      });

      if (error) {
        throw error;
      }

      if (data?.authUrl) {
        // Store current page state before redirect and set proper return URL
        sessionStorage.setItem('calendarOAuthReturn', window.location.href);
        // Ensure we return to the main page after OAuth
        const returnUrl = `${window.location.origin}/`;
        const authUrlWithReturn = `${data.authUrl}&state=${encodeURIComponent(returnUrl)}`;
        window.location.href = authUrlWithReturn;
      }
    } catch (error) {
      console.error('Failed to initiate OAuth flow:', error);
      toast.error('Failed to start Google Calendar authorization');
      setIsAuthorizing(false);
    }
  };

  const exchangeAuthCode = async (authCode: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: { 
          action: 'exchangeToken', 
          authCode 
        }
      });

      if (error) {
        throw error;
      }

      if (data?.tokens) {
        setOauthTokens(data.tokens);
        toast.success('Google Calendar connected successfully!');
      }
    } catch (error) {
      console.error('Failed to exchange auth code:', error);
      toast.error('Failed to connect Google Calendar');
    }
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  const fetchAvailability = async (date: Date) => {
    setLoadingTimes(true);
    try {
      console.log('Fetching availability for date:', date.toISOString().split('T')[0]);
      
      if (!oauthTokens) {
        console.warn('No OAuth tokens available, using fallback times');
        throw new Error('Google Calendar not connected');
      }

      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: {
          action: 'getAvailability',
          date: date.toISOString().split('T')[0],
          tokens: oauthTokens
        },
      });

      console.log('Calendar function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw new Error('Failed to fetch calendar availability');
      }

      const availableSlots = data?.availability || [];
      console.log('Received available slots:', availableSlots);
      
      const timeSlots = availableSlots.length > 0 ? 
        availableSlots.map((time: string) => ({
          time,
          available: true,
        })) : 
        [
          { time: "09:00", available: true },
          { time: "10:00", available: true },
          { time: "11:00", available: true },
          { time: "14:00", available: true },
          { time: "15:00", available: true },
          { time: "16:00", available: true },
        ];

      setAvailableTimes(timeSlots);
      
    } catch (error) {
      console.error('Failed to fetch availability:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load available times';
      
      if (!oauthTokens) {
        toast.error('Google Calendar not connected. Using default time slots.');
      } else {
        toast.error(errorMessage);
      }
      
      // Provide fallback times when API fails
      setAvailableTimes([
        { time: "09:00", available: true },
        { time: "10:00", available: true },
        { time: "11:00", available: true },
        { time: "14:00", available: true },
        { time: "15:00", available: true },
        { time: "16:00", available: true },
      ]);
    } finally {
      setLoadingTimes(false);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onDateSelect(date);
      setStep('time');
      fetchAvailability(date);
    }
  };

  const handleTimeSelect = (time: string) => {
    onTimeSelect(time);
  };

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
  };

  return (
    <AnimatedCard className="w-full max-w-2xl mx-auto" gradient glow>
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-t-lg" />
        <CardHeader className="pb-6 relative z-10">
          <CardTitle className="flex items-center text-2xl text-dental-primary font-bold">
            <div className="p-3 bg-dental-primary/10 rounded-xl mr-4">
              <CalendarDays className="h-7 w-7 text-dental-primary" />
            </div>
            {step === 'date' ? 'Choose Your Perfect Date' : 'Select Your Ideal Time'}
          </CardTitle>
          {selectedDate && (
            <div className="flex items-center space-x-4 mt-6">
              <Badge className="bg-dental-primary text-dental-primary-foreground border-0 px-6 py-3 text-base font-semibold rounded-full shadow-elegant">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long'
                })}
              </Badge>
              {selectedTime && (
                <>
                  <ArrowRight className="w-6 h-6 text-dental-secondary animate-pulse" />
                  <Badge className="bg-dental-secondary text-dental-secondary-foreground border-0 px-6 py-3 text-base font-semibold rounded-full shadow-elegant">
                    <Clock className="w-5 h-5 mr-2" />
                    {selectedTime}
                  </Badge>
                </>
              )}
            </div>
          )}
        </CardHeader>
      </div>
      
      <CardContent className="p-8">
        {step === 'date' ? (
          <div className="space-y-6">
            {!oauthTokens && (
              <div className="bg-gradient-to-r from-dental-accent/10 to-dental-primary/5 border border-dental-accent/20 rounded-xl p-6 mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-dental-accent/20 rounded-lg">
                      <LinkIcon className="w-6 h-6 text-dental-accent" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-dental-primary">Connect Google Calendar</h4>
                      <p className="text-dental-muted-foreground mt-1">
                        Sync with your dentist's real-time availability for accurate scheduling
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={initiateOAuthFlow}
                    disabled={isAuthorizing}
                    className="bg-dental-accent hover:bg-dental-accent/90 text-white font-semibold px-6 py-3 rounded-xl shadow-elegant hover:shadow-glow transition-all duration-300"
                  >
                    {isAuthorizing ? (
                      <>
                        <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-5 h-5 mr-2" />
                        Connect Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
            
            <div className="text-center mb-6">
              <p className="text-dental-muted-foreground text-lg">
                Select your preferred appointment date
              </p>
              <p className="text-sm text-dental-muted-foreground/70 mt-2">
                • Weekend appointments are not available
                • Dates in the past are disabled
              </p>
            </div>
            
            <div className="bg-gradient-card rounded-2xl p-6 shadow-subtle">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                disabled={isDateDisabled}
                className="rounded-xl border-0 pointer-events-auto w-full"
                classNames={{
                  months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                  month: "space-y-6 w-full flex flex-col",
                  caption: "flex justify-center pt-2 pb-4 relative items-center",
                  caption_label: "text-lg font-bold text-dental-primary",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-10 w-10 bg-dental-primary/10 hover:bg-dental-primary/20 rounded-xl transition-all duration-200 hover:scale-105",
                  nav_button_previous: "absolute left-2",
                  nav_button_next: "absolute right-2",
                  table: "w-full border-collapse space-y-2",
                  head_row: "flex justify-between w-full mb-2",
                  head_cell: "text-dental-muted-foreground rounded-lg w-12 h-12 font-semibold text-sm flex items-center justify-center",
                  row: "flex w-full mt-3 justify-between",
                  cell: "relative p-0 text-center text-base focus-within:relative focus-within:z-20 w-12 h-12",
                  day: "h-12 w-12 p-0 font-semibold hover:bg-dental-primary/10 hover:text-dental-primary rounded-xl transition-all duration-300 hover:scale-110 hover:shadow-lg flex items-center justify-center",
                  day_selected: "bg-dental-primary text-dental-primary-foreground hover:bg-dental-primary hover:text-dental-primary-foreground shadow-elegant scale-110",
                  day_today: "bg-dental-accent/20 text-dental-accent font-bold ring-2 ring-dental-accent/30",
                  day_outside: "text-dental-muted-foreground/40 opacity-40 hover:opacity-60",
                  day_disabled: "text-dental-muted-foreground/20 opacity-20 cursor-not-allowed hover:bg-transparent hover:scale-100",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                onClick={() => setStep('date')}
                className="text-dental-primary hover:text-dental-primary hover:bg-dental-primary/10 transition-all duration-200 font-medium"
              >
                ← Back to date selection
              </Button>
              <div className="text-sm text-dental-muted-foreground">
                Step 2 of 2
              </div>
            </div>
            
            {loadingTimes ? (
              <div className="text-center py-12">
                <div className="inline-flex flex-col items-center space-y-4">
                  <div className="relative">
                    <div className="w-16 h-16 bg-dental-primary/10 rounded-full flex items-center justify-center">
                      <Sparkles className="w-8 h-8 animate-spin text-dental-primary" />
                    </div>
                  </div>
                  <div className="text-center">
                    <h3 className="text-lg font-semibold text-dental-primary">Finding perfect times</h3>
                    <p className="text-dental-muted-foreground mt-1">Checking dentist's availability...</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-dental-primary flex items-center justify-center">
                    <Clock className="w-6 h-6 mr-2" />
                    Available Time Slots
                  </h3>
                  <p className="text-dental-muted-foreground mt-2">
                    Choose the time that works best for you
                  </p>
                </div>
                
                <div className="bg-gradient-card rounded-2xl p-6 shadow-subtle">
                  <div className="grid grid-cols-2 gap-4">
                    {availableTimes.map(({ time, available }) => (
                      <Button
                        key={time}
                        variant={selectedTime === time ? "default" : "outline"}
                        disabled={!available}
                        onClick={() => handleTimeSelect(time)}
                        className={cn(
                          "py-6 px-6 font-bold transition-all duration-300 rounded-xl text-base relative overflow-hidden",
                          !available && "opacity-30 cursor-not-allowed bg-muted/50 text-muted-foreground",
                          selectedTime === time && "bg-dental-primary text-dental-primary-foreground shadow-elegant scale-105 ring-2 ring-dental-primary/20",
                          available && selectedTime !== time && "hover:bg-dental-primary/10 hover:border-dental-primary hover:text-dental-primary hover:scale-105 hover:shadow-lg border-2"
                        )}
                      >
                        <div className="flex items-center justify-center space-x-3">
                          <div className={cn(
                            "p-2 rounded-lg transition-all duration-200",
                            selectedTime === time ? "bg-white/20" : "bg-dental-primary/10"
                          )}>
                            <Clock className="w-5 h-5" />
                          </div>
                          <span className="text-lg">{time}</span>
                          {selectedTime === time && (
                            <CheckCircle className="w-5 h-5 animate-pulse" />
                          )}
                        </div>
                        {!available && (
                          <div className="absolute inset-0 bg-muted/80 rounded-xl flex items-center justify-center">
                            <span className="text-xs font-semibold text-muted-foreground">Unavailable</span>
                          </div>
                        )}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {selectedTime && (
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-dental-primary/5 to-dental-secondary/5 border border-dental-primary/20 rounded-xl p-6">
                  <div className="flex items-center space-x-4">
                    <div className="p-3 bg-dental-primary/10 rounded-xl">
                      <CheckCircle className="w-6 h-6 text-dental-primary" />
                    </div>
                    <div>
                      <h4 className="font-bold text-lg text-dental-primary">Perfect! You're all set</h4>
                      <p className="text-dental-muted-foreground">
                        Ready to confirm your appointment for {selectedDate?.toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric' 
                        })} at {selectedTime}
                      </p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={handleConfirm}
                  className="w-full bg-gradient-primary text-white font-bold py-6 shadow-elegant hover:shadow-glow transition-all duration-300 rounded-xl text-lg hover:scale-105"
                >
                  <CheckCircle className="w-6 h-6 mr-3" />
                  Confirm My Appointment
                  <Sparkles className="w-5 h-5 ml-3" />
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};