import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { CreditCard } from 'lucide-react';

interface PaymentRequestFormProps {
  patientId: string;
  patientName: string;
  patientEmail: string;
  onClose: () => void;
}

export const PaymentRequestForm: React.FC<PaymentRequestFormProps> = ({
  patientId,
  patientName,
  patientEmail,
  onClose
}) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !description) return;

    setLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      if (!profile) throw new Error('Dentist profile not found');

      const { data: dentist } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!dentist) throw new Error('Dentist not found');

      const { data, error } = await supabase.functions.invoke('create-payment-request', {
        body: {
          patient_id: patientId,
          dentist_id: dentist.id,
          amount: Math.round(parseFloat(amount) * 100), // Convert to cents
          description,
          patient_email: patientEmail,
          patient_name: patientName
        }
      });

      if (error) throw error;

      toast({
        title: "Payment request sent",
        description: `Payment request for €${amount} has been sent to ${patientName}`,
      });

      // Open payment link in new tab
      if (data.payment_url) {
        window.open(data.payment_url, '_blank');
      }

      onClose();
    } catch (error) {
      console.error('Error creating payment request:', error);
      toast({
        title: "Error",
        description: "Failed to create payment request",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Request
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Send payment request to {patientName}
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="amount">Amount (€)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the treatment or service..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount || !description}
              className="flex-1"
            >
              {loading ? 'Sending...' : 'Send Request'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};