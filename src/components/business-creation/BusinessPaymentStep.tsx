import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, CheckCircle2, CreditCard } from 'lucide-react';

interface BusinessPaymentStepProps {
  businessData: any;
  onComplete: (businessId: string) => void;
}

export function BusinessPaymentStep({ businessData, onComplete }: BusinessPaymentStepProps) {
  const [loading, setLoading] = useState(false);
  const [businessId, setBusinessId] = useState<string | null>(null);

  const createBusiness = async () => {
    setLoading(true);
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Profile not found. Please complete your profile first.');
      }

      // Create business slug
      const slug = businessData.name
        ?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'business';

      // Ensure unique slug
      const { data: existingBusiness } = await supabase
        .from('businesses')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      const finalSlug = existingBusiness 
        ? `${slug}-${Math.random().toString(36).substring(2, 8)}`
        : slug;

      // Create business with owner_profile_id
      const { data: business, error: businessError } = await supabase
        .from('businesses')
        .insert({
          name: businessData.name,
          slug: finalSlug,
          tagline: businessData.tagline,
          bio: businessData.bio,
          template_type: businessData.template || 'generic',
          owner_profile_id: profile.id,
        })
        .select()
        .single();

      if (businessError) throw businessError;

      // Assign owner role to business_members
      const { error: roleError } = await supabase
        .from('business_members')
        .insert({
          business_id: business.id,
          profile_id: profile.id,
          role: 'owner',
        });

      if (roleError) throw roleError;

      // Create services if any
      if (businessData.services && businessData.services.length > 0) {
        const servicesData = businessData.services.map((service: any) => ({
          business_id: business.id,
          name: service.name,
          price_cents: service.price * 100, // Convert to cents
          duration_minutes: service.duration || 30,
        }));

        await supabase.from('business_services').insert(servicesData);
      }

      setBusinessId(business.id);
      toast.success('Business created! Now complete payment to activate.');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create business');
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!businessId) {
      await createBusiness();
      return;
    }

    setLoading(true);
    try {
      // Create Stripe checkout session for $0.50
      const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
        body: {
          priceAmount: 50, // 50 cents
          businessId: businessId,
          successUrl: `${window.location.origin}/dentist-portal`,
          cancelUrl: `${window.location.origin}/create-business`,
        },
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      toast.error(error.message || 'Payment setup failed');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Complete Your Setup</h2>
        <p className="text-muted-foreground mt-2">
          Final step: Activate your business account
        </p>
      </div>

      <Card className="p-6 border-2 border-primary/20">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <CreditCard className="w-8 h-8 text-primary" />
          </div>

          <div>
            <h3 className="text-xl font-semibold">Activation Fee</h3>
            <p className="text-3xl font-bold text-primary my-2">$0.50</p>
            <p className="text-sm text-muted-foreground">
              One-time setup fee to activate your business account
            </p>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 text-left space-y-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Full access to all features</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Unlimited appointments</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Customer management</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" />
              <span className="text-sm">Analytics dashboard</span>
            </div>
          </div>

          <Button
            onClick={handlePayment}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {businessId ? 'Proceed to Payment' : 'Create Business & Pay'}
          </Button>

          <p className="text-xs text-muted-foreground">
            Secure payment powered by Stripe
          </p>
        </div>
      </Card>
    </div>
  );
}
