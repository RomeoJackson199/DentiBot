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
        // Store current page state before redirect
        sessionStorage.setItem('calendarOAuthReturn', window.location.href);
        window.location.href = data.authUrl;
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
    <AnimatedCard className="w-full max-w-lg mx-auto" gradient glow>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary opacity-10 rounded-t-lg" />
        <CardHeader className="pb-4 relative z-10">
          <CardTitle className="flex items-center text-xl text-dental-primary font-semibold">
            <div className="p-2 bg-dental-primary/10 rounded-lg mr-3">
              <CalendarDays className="h-6 w-6 text-dental-primary" />
            </div>
            {step === 'date' ? 'Select Your Appointment Date' : 'Choose Your Preferred Time'}
          </CardTitle>
          {selectedDate && (
            <div className="flex items-center space-x-3 mt-4">
              <Badge className="bg-dental-primary text-dental-primary-foreground border-0 px-4 py-2 text-sm font-medium">
                {selectedDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  day: 'numeric',
                  month: 'long'
                })}
              </Badge>
              {selectedTime && (
                <>
                  <ArrowRight className="w-5 h-5 text-dental-secondary animate-pulse" />
                  <Badge className="bg-dental-secondary text-dental-secondary-foreground border-0 px-4 py-2 text-sm font-medium">
                    <Clock className="w-4 h-4 mr-1" />
                    {selectedTime}
                  </Badge>
                </>
              )}
            </div>
          )}
        </CardHeader>
      </div>
      
      <CardContent className="p-6">
        {step === 'date' ? (
          <div className="space-y-4">
            {!oauthTokens && (
              <div className="bg-dental-accent/10 border border-dental-accent/20 rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-dental-primary">Connect Google Calendar</h4>
                    <p className="text-sm text-dental-muted-foreground">
                      Connect to see real-time availability from your dentist's calendar
                    </p>
                  </div>
                  <Button 
                    onClick={initiateOAuthFlow}
                    disabled={isAuthorizing}
                    variant="outline"
                    size="sm"
                    className="ml-4"
                  >
                    <LinkIcon className="w-4 h-4 mr-2" />
                    {isAuthorizing ? 'Connecting...' : 'Connect'}
                  </Button>
                </div>
              </div>
            )}
            <p className="text-dental-muted-foreground text-center mb-4">
              Select a date for your appointment. Weekend appointments are not available.
            </p>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={isDateDisabled}
              className={cn("rounded-lg border-0 pointer-events-auto w-full bg-gradient-card p-4")}
              classNames={{
                months: "flex w-full flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 flex-1",
                month: "space-y-4 w-full flex flex-col",
                table: "w-full h-full border-collapse space-y-1",
                head_row: "",
                head_cell: "text-dental-muted-foreground rounded-md w-full font-medium text-sm",
                row: "w-full mt-2",
                cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
                day: "h-10 w-full p-0 font-medium hover:bg-dental-primary/10 hover:text-dental-primary rounded-lg transition-all duration-200",
                day_selected: "bg-dental-primary text-dental-primary-foreground hover:bg-dental-primary hover:text-dental-primary-foreground shadow-lg",
                day_today: "bg-dental-accent/20 text-dental-accent font-bold",
                day_outside: "text-dental-muted-foreground/50 opacity-50",
                day_disabled: "text-dental-muted-foreground/30 opacity-30 cursor-not-allowed",
                day_hidden: "invisible",
              }}
            />
          </div>
        ) : (
          <div className="space-y-6">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setStep('date')}
              className="mb-4 text-dental-primary hover:text-dental-primary hover:bg-dental-primary/10 transition-all duration-200"
            >
              ← Change date
            </Button>
            
            {loadingTimes ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center space-x-2 text-dental-muted-foreground">
                  <Sparkles className="w-5 h-5 animate-spin text-dental-primary" />
                  <span className="text-lg font-medium">Finding available times...</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-dental-primary flex items-center">
                  <Clock className="w-5 h-5 mr-2" />
                  Available Time Slots
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {availableTimes.map(({ time, available }) => (
                    <Button
                      key={time}
                      variant={selectedTime === time ? "default" : "outline"}
                      size="lg"
                      disabled={!available}
                      onClick={() => handleTimeSelect(time)}
                      className={cn(
                        "py-4 px-6 font-semibold transition-all duration-300 rounded-xl",
                        !available && "opacity-40 cursor-not-allowed bg-muted",
                        selectedTime === time && "bg-dental-primary text-dental-primary-foreground shadow-elegant scale-105",
                        available && selectedTime !== time && "hover:bg-dental-primary/10 hover:border-dental-primary hover:text-dental-primary hover:scale-105"
                      )}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>{time}</span>
                        {selectedTime === time && <CheckCircle className="w-4 h-4" />}
                      </div>
                      {!available && (
                        <div className="text-xs text-destructive mt-1">Unavailable</div>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {selectedTime && (
              <div className="pt-4">
                <Button 
                  onClick={handleConfirm}
                  className="w-full bg-gradient-primary text-white font-bold py-4 shadow-elegant hover:shadow-glow transition-all duration-300 rounded-xl text-lg"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Confirm Appointment
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </AnimatedCard>
  );
};