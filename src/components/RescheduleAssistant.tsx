import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Calendar, Clock, TrendingUp, Check } from "lucide-react";
import { findRescheduleOptions, acceptRescheduleSuggestion, RescheduleSuggestion } from "@/lib/autoRescheduling";
import { format } from "date-fns";

interface RescheduleAssistantProps {
  appointmentId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRescheduled: () => void;
  reason?: 'dentist_vacation' | 'dentist_cancelled' | 'patient_requested' | 'emergency';
}

export const RescheduleAssistant = ({
  appointmentId,
  open,
  onOpenChange,
  onRescheduled,
  reason = 'patient_requested'
}: RescheduleAssistantProps) => {
  const [suggestions, setSuggestions] = useState<RescheduleSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<RescheduleSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [rescheduling, setRescheduling] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && appointmentId) {
      fetchSuggestions();
    }
  }, [open, appointmentId]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const options = await findRescheduleOptions(appointmentId, {
        reason,
        searchDays: 14,
        sameDentist: true,
        minScore: 60
      });

      setSuggestions(options);

      if (options.length === 0) {
        toast({
          title: "No Suggestions Found",
          description: "Unable to find suitable alternative slots. Please try a different date range.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching reschedule suggestions:', error);
      toast({
        title: "Error",
        description: "Failed to find alternative slots",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuggestion = async () => {
    if (!selectedSuggestion) return;

    setRescheduling(true);
    try {
      const result = await acceptRescheduleSuggestion(
        appointmentId,
        selectedSuggestion.date,
        selectedSuggestion.slot.time
      );

      if (result.success) {
        toast({
          title: "Success!",
          description: "Your appointment has been rescheduled successfully",
        });
        onRescheduled();
        onOpenChange(false);
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      console.error('Error rescheduling:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reschedule appointment",
        variant: "destructive"
      });
    } finally {
      setRescheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Smart Rescheduling Assistant
          </DialogTitle>
          <DialogDescription>
            We've found the best alternative appointment times based on your preferences and availability
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              Finding the best alternative slots for you...
            </div>
          ) : suggestions.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select one of the recommended time slots below:
              </p>
              {suggestions.map((suggestion) => {
                const isSelected = selectedSuggestion?.rank === suggestion.rank;
                const slotDateTime = new Date(`${format(suggestion.date, 'yyyy-MM-dd')}T${suggestion.slot.time}`);

                return (
                  <Card
                    key={suggestion.rank}
                    className={`cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary border-2 bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedSuggestion(suggestion)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2 flex-1">
                          {/* Rank Badge */}
                          <div className="flex items-center gap-2">
                            {suggestion.rank === 1 && (
                              <Badge className="bg-primary">
                                <Sparkles className="h-3 w-3 mr-1" />
                                Best Match
                              </Badge>
                            )}
                            {suggestion.rank === 2 && (
                              <Badge variant="outline">
                                2nd Choice
                              </Badge>
                            )}
                            {suggestion.rank === 3 && (
                              <Badge variant="outline">
                                3rd Choice
                              </Badge>
                            )}
                          </div>

                          {/* Date and Time */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {format(suggestion.date, 'EEEE, MMMM d, yyyy')}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">
                                {format(slotDateTime, 'h:mm a')}
                              </span>
                            </div>
                          </div>

                          {/* Score */}
                          <div className="flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-muted-foreground">
                              Match Score: {suggestion.slot.score}/100
                            </span>
                          </div>

                          {/* Reasons */}
                          {suggestion.slot.reasons.length > 0 && (
                            <div className="space-y-1">
                              {suggestion.slot.reasons.map((reason, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Check className="h-3 w-3 text-green-600" />
                                  {reason}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Selection Indicator */}
                        {isSelected && (
                          <div className="ml-4">
                            <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                              <Check className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p>No alternative slots found.</p>
              <p className="text-sm mt-2">Please try contacting us directly to reschedule.</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleAcceptSuggestion}
            disabled={!selectedSuggestion || rescheduling}
          >
            {rescheduling ? "Rescheduling..." : "Confirm Reschedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
