/**
 * Break Manager - Type A (Solo Stylist)
 *
 * Quick break and blocked time management
 * Features:
 * - One-tap preset breaks (15m, 30m, 1h)
 * - Custom break duration
 * - "Close early" functionality
 * - Blocks time slots from booking
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Coffee, Clock, Home, Pause } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

interface BreakManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stylistId: string;
  businessId: string;
  onComplete?: () => void;
}

type BreakPreset = {
  label: string;
  minutes: number;
  icon: React.ReactNode;
  variant: 'default' | 'outline' | 'secondary';
};

const BREAK_PRESETS: BreakPreset[] = [
  { label: 'Quick Break', minutes: 15, icon: <Pause className="h-4 w-4" />, variant: 'outline' },
  { label: 'Lunch Break', minutes: 60, icon: <Coffee className="h-4 w-4" />, variant: 'default' },
  { label: 'Extended Break', minutes: 120, icon: <Clock className="h-4 w-4" />, variant: 'outline' },
  { label: 'Close Early', minutes: 240, icon: <Home className="h-4 w-4" />, variant: 'secondary' },
];

export function BreakManager({
  open,
  onOpenChange,
  stylistId,
  businessId,
  onComplete,
}: BreakManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<number>(30);
  const [reason, setReason] = useState('');

  const handlePresetBreak = async (minutes: number, label: string) => {
    await createBreak(minutes, label);
  };

  const handleCustomBreak = async () => {
    if (customMinutes < 5) {
      toast({
        title: 'Invalid Duration',
        description: 'Break must be at least 5 minutes',
        variant: 'destructive',
      });
      return;
    }
    await createBreak(customMinutes, reason || 'Break');
  };

  const createBreak = async (durationMinutes: number, breakReason: string) => {
    setLoading(true);
    try {
      // Get the next available slot time (now or next 15-min increment)
      const now = new Date();
      const minutes = now.getMinutes();
      const roundedMinutes = Math.ceil(minutes / 15) * 15;
      const startTime = new Date(now);
      startTime.setMinutes(roundedMinutes, 0, 0);

      // Call database function to create break
      const { data, error } = await supabase.rpc('create_break_block', {
        stylist_id_param: stylistId,
        business_id_param: businessId,
        start_time_param: startTime.toISOString(),
        duration_minutes_param: durationMinutes,
        block_type_param: 'break',
        reason_param: breakReason,
      });

      if (error) throw error;

      const endTime = addMinutes(startTime, durationMinutes);

      toast({
        title: 'Break Created',
        description: `${breakReason} blocked from ${format(startTime, 'h:mm a')} to ${format(endTime, 'h:mm a')}`,
      });

      // Reset form
      setCustomMode(false);
      setCustomMinutes(30);
      setReason('');

      onComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating break:', error);
      toast({
        title: 'Error',
        description: 'Failed to create break. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Take a Break</DialogTitle>
          <DialogDescription>
            Block time in your schedule. Online bookings will be prevented during this time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {!customMode ? (
            <>
              {/* Preset Breaks */}
              <div className="grid grid-cols-2 gap-3">
                {BREAK_PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant={preset.variant}
                    className="h-20 flex flex-col items-center justify-center"
                    onClick={() => handlePresetBreak(preset.minutes, preset.label)}
                    disabled={loading}
                  >
                    <div className="mb-2">{preset.icon}</div>
                    <div className="font-semibold text-sm">{preset.label}</div>
                    <div className="text-xs text-muted-foreground">{preset.minutes} min</div>
                  </Button>
                ))}
              </div>

              {/* Custom Break Button */}
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => setCustomMode(true)}
              >
                <Clock className="mr-2 h-4 w-4" />
                Custom Duration
              </Button>
            </>
          ) : (
            <>
              {/* Custom Break Form */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Input
                    id="duration"
                    type="number"
                    min={5}
                    max={480}
                    value={customMinutes}
                    onChange={(e) => setCustomMinutes(parseInt(e.target.value) || 30)}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Between 5 minutes and 8 hours
                  </p>
                </div>

                <div>
                  <Label htmlFor="reason">Reason (optional)</Label>
                  <Textarea
                    id="reason"
                    placeholder="Lunch, appointment, errand..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setCustomMode(false)}
                    disabled={loading}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCustomBreak}
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create Break'}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Info */}
        <div className="text-xs text-muted-foreground border-t pt-4">
          <p>
            💡 <strong>Tip:</strong> Your break will start at the next 15-minute increment and block online bookings during this time.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
