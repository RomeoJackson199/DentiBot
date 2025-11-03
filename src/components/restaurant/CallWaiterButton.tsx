import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Bell, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface CallWaiterButtonProps {
  reservationId: string;
  tableNumber?: string;
}

export function CallWaiterButton({ reservationId, tableNumber }: CallWaiterButtonProps) {
  const { toast } = useToast();
  const [showDialog, setShowDialog] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const quickReasons = [
    'Need assistance',
    'Ready to order',
    'Request refills',
    'Ready for the check',
    'Have a question',
    'Something is wrong'
  ];

  const callWaiter = async (selectedReason: string) => {
    setLoading(true);
    try {
      // Create a waiter request notification
      const { error } = await supabase
        .from('waiter_requests')
        .insert({
          reservation_id: reservationId,
          request_type: selectedReason,
          notes: reason,
          status: 'pending',
          requested_at: new Date().toISOString()
        });

      if (error) throw error;

      setSent(true);
      toast({
        title: 'Waiter notified!',
        description: 'Your waiter will be with you shortly'
      });

      setTimeout(() => {
        setShowDialog(false);
        setSent(false);
        setReason('');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <Card className="border-green-500 bg-green-50">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <CheckCircle className="h-12 w-12 text-green-600 mb-3" />
          <p className="text-lg font-semibold text-green-900">Waiter Notified!</p>
          <p className="text-sm text-green-700">They'll be with you shortly</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        size="lg"
        className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
      >
        <Bell className="h-6 w-6 mr-2" />
        Call Waiter
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Call Your Waiter</DialogTitle>
            <DialogDescription>
              {tableNumber && `Table ${tableNumber} • `}
              Let us know how we can help
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Reasons */}
            <div className="grid grid-cols-2 gap-2">
              {quickReasons.map((quickReason) => (
                <Button
                  key={quickReason}
                  variant="outline"
                  onClick={() => callWaiter(quickReason)}
                  disabled={loading}
                  className="h-auto py-3 text-sm"
                >
                  {quickReason}
                </Button>
              ))}
            </div>

            {/* Custom Note */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Additional notes (optional):</p>
              <Textarea
                placeholder="Let us know more details..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
              />
              <Button
                onClick={() => callWaiter('Custom request')}
                disabled={loading || !reason}
                className="w-full"
              >
                {loading ? 'Sending...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
