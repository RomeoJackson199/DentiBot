import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

const PaymentSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    const handlePaymentSuccess = async () => {
      if (type === 'business') {
        // Handle business creation after payment
        setProcessing(true);
        try {
          const pendingData = sessionStorage.getItem('pending_business_data');
          if (!pendingData) {
            throw new Error('Business data not found');
          }

          const businessData = JSON.parse(pendingData);

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
            throw new Error('Profile not found');
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

          // Create business
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

          // Add owner to business_members
          const { error: roleError } = await supabase
            .from('business_members')
            .insert({
              business_id: business.id,
              profile_id: profile.id,
              role: 'owner',
            });

          if (roleError) throw roleError;

          // Ensure user has provider role
          await supabase.rpc('assign_provider_role');

          // Set current session business
          await supabase.from('session_business').upsert({
            user_id: user.id,
            business_id: business.id,
          }, { onConflict: 'user_id' });

          // Create services if any
          if (businessData.services && businessData.services.length > 0) {
            const servicesData = businessData.services.map((service: any) => ({
              business_id: business.id,
              name: service.name,
              price_cents: service.price * 100,
              duration_minutes: service.duration || 30,
            }));

            await supabase.from('business_services').insert(servicesData);
          }

          // Clear pending data
          sessionStorage.removeItem('pending_business_data');

          // Show business URL and copy to clipboard
          const businessUrl = `${window.location.origin}/${business.slug}`;
          toast.success(`Business created! Your URL: ${businessUrl}`);
          
          // Copy URL to clipboard
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(businessUrl);
            setTimeout(() => {
              toast.success('URL copied to clipboard! Share it with your patients.');
            }, 500);
          }
          
          // Redirect to dentist portal
          setTimeout(() => {
            navigate('/dentist-portal');
          }, 4000);
        } catch (error: any) {
          console.error('Error creating business:', error);
          toast.error(error.message || 'Failed to create business');
          setProcessing(false);
        }
      } else {
        // Handle regular payment success
        if (sessionId) {
          try {
            const { data, error } = await supabase.functions.invoke('update-payment-status', {
              body: { session_id: sessionId }
            });

            if (error) {
              console.error('Error updating payment status:', error);
            }
          } catch (error) {
            console.error('Failed to update payment status:', error);
          }
        }
      }
    };

    handlePaymentSuccess();
  }, [sessionId, type, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4">
            {processing ? (
              <Loader2 className="h-16 w-16 text-primary animate-spin" />
            ) : (
              <CheckCircle className="h-16 w-16 text-green-500" />
            )}
          </div>
          <CardTitle className="text-2xl text-green-600">
            {processing ? 'Setting up your business...' : 'Payment Successful!'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {processing ? (
            <p className="text-muted-foreground">
              Please wait while we create your business account...
            </p>
          ) : (
            <>
              <p className="text-muted-foreground">
                Your payment has been processed successfully. 
                {type === 'business' && ' Your business account is now active!'}
              </p>
              
              {sessionId && (
                <p className="text-sm text-muted-foreground">
                  Transaction ID: {sessionId.slice(0, 20)}...
                </p>
              )}

              {type !== 'business' && (
                <Button 
                  onClick={() => window.close()}
                  className="w-full"
                >
                  Close Window
                </Button>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;