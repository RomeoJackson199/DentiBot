import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Copy, Share2, QrCode, ExternalLink } from 'lucide-react';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

export default function MarketingTools() {
  const [loading, setLoading] = useState(true);
  const [businessSlug, setBusinessSlug] = useState<string>('');
  const [clinicName, setClinicName] = useState<string>('');

  useEffect(() => {
    fetchClinicInfo();
  }, []);

  const fetchClinicInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) return;

      const { data: dentist } = await supabase
        .from('dentists')
        .select('id')
        .eq('profile_id', profile.id)
        .single();

      if (!dentist) return;

      const { data: settings } = await supabase
        .from('clinic_settings')
        .select('business_slug, clinic_name')
        .eq('dentist_id', dentist.id)
        .single();

      if (settings) {
        setBusinessSlug(settings.business_slug || '');
        setClinicName(settings.clinic_name || '');
      }
    } catch (error) {
      console.error('Error fetching clinic info:', error);
      toast.error('Failed to load clinic information');
    } finally {
      setLoading(false);
    }
  };

  const publicUrl = businessSlug ? `${window.location.origin}/${businessSlug}` : '';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(publicUrl);
    toast.success('Link copied to clipboard!');
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: clinicName,
          text: `Book an appointment at ${clinicName}`,
          url: publicUrl,
        });
      } catch (error) {
        console.log('Share cancelled');
      }
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner size="lg" />
      </div>
    );
  }

  if (!businessSlug) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Please set up your business URL in clinic settings first.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Marketing Tools</h1>
        <p className="text-muted-foreground">
          Share your clinic's booking page with patients
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Public Booking Link</CardTitle>
          <CardDescription>
            Share this link with patients so they can book appointments online
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input value={publicUrl} readOnly className="flex-1" />
            <Button onClick={copyToClipboard} variant="outline">
              <Copy className="h-4 w-4" />
            </Button>
            <Button onClick={shareLink} variant="outline">
              <Share2 className="h-4 w-4" />
            </Button>
            <Button onClick={() => window.open(publicUrl, '_blank')} variant="outline">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code
            </CardTitle>
            <CardDescription>
              Generate a QR code for easy scanning
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-square bg-muted rounded-lg flex items-center justify-center">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(publicUrl)}`}
                alt="QR Code"
                className="w-full h-full object-contain p-4"
              />
            </div>
            <Button 
              className="w-full mt-4" 
              variant="outline"
              onClick={() => {
                const link = document.createElement('a');
                link.href = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(publicUrl)}`;
                link.download = `${businessSlug}-qr-code.png`;
                link.click();
              }}
            >
              Download QR Code
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketing Ideas</CardTitle>
            <CardDescription>
              Ways to promote your booking page
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Add the link to your email signature</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Print the QR code on business cards and flyers</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Share on social media (Facebook, Instagram, LinkedIn)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Add to your website or Google Business profile</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Send via SMS to existing patients</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-primary">•</span>
                <span>Display QR code in your waiting room</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Signature Template</CardTitle>
          <CardDescription>
            Copy this template for your email signature
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-lg">
            <pre className="text-sm whitespace-pre-wrap">
{`${clinicName}
Book your appointment online: ${publicUrl}

---
This is an automated email signature.`}
            </pre>
          </div>
          <Button 
            className="mt-4"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(`${clinicName}\nBook your appointment online: ${publicUrl}\n\n---\nThis is an automated email signature.`);
              toast.success('Email signature copied!');
            }}
          >
            Copy Template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}