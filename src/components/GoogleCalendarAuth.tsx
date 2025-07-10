import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GoogleCalendarAuthProps {
  onAuthSuccess?: (tokens: any) => void;
  onAuthError?: (error: string) => void;
}

export const GoogleCalendarAuth = ({ onAuthSuccess, onAuthError }: GoogleCalendarAuthProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tokens, setTokens] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Check if we have stored tokens
    const storedTokens = localStorage.getItem('google_calendar_tokens');
    if (storedTokens) {
      try {
        const parsedTokens = JSON.parse(storedTokens);
        setTokens(parsedTokens);
        setIsConnected(true);
        onAuthSuccess?.(parsedTokens);
      } catch (error) {
        console.error('Invalid stored tokens:', error);
        localStorage.removeItem('google_calendar_tokens');
      }
    }

    // Check for OAuth callback code in URL
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    
    if (authCode && !isConnected) {
      handleOAuthCallback(authCode);
    }
  }, []);

  const handleOAuthCallback = async (authCode: string) => {
    try {
      setIsConnecting(true);
      
      // Exchange authorization code for tokens
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: {
          action: 'exchangeToken',
          authCode: authCode
        }
      });

      if (error) throw error;

      if (data?.tokens) {
        // Store tokens securely
        localStorage.setItem('google_calendar_tokens', JSON.stringify(data.tokens));
        setTokens(data.tokens);
        setIsConnected(true);
        
        // Test access to verify tokens work
        await testCalendarAccess(data.tokens);
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast({
          title: "Calendrier Google connecté !",
          description: "Vos rendez-vous seront maintenant ajoutés à votre calendrier Google.",
        });

        onAuthSuccess?.(data.tokens);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter votre calendrier Google. Veuillez réessayer.",
        variant: "destructive",
      });
      onAuthError?.(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  const testCalendarAccess = async (testTokens: any) => {
    try {
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: {
          action: 'testAccess',
          tokens: testTokens
        }
      });

      if (error) throw error;
      
      console.log('Calendar access test successful:', data);
      return true;
    } catch (error) {
      console.error('Calendar access test failed:', error);
      throw error;
    }
  };

  const initiateGoogleAuth = async () => {
    try {
      setIsConnecting(true);
      
      // Get OAuth authorization URL
      const { data, error } = await supabase.functions.invoke('google-calendar-integration', {
        body: {
          action: 'getAuthUrl'
        }
      });

      if (error) throw error;

      if (data?.authUrl) {
        // Redirect to Google OAuth
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Error initiating Google auth:', error);
      toast({
        title: "Erreur",
        description: "Impossible de démarrer l'authentification Google.",
        variant: "destructive",
      });
      setIsConnecting(false);
    }
  };

  const disconnectGoogle = () => {
    localStorage.removeItem('google_calendar_tokens');
    setTokens(null);
    setIsConnected(false);
    
    toast({
      title: "Calendrier déconnecté",
      description: "Votre calendrier Google a été déconnecté.",
    });
  };

  const getStoredTokens = () => {
    return tokens;
  };

  // Expose tokens getter for parent components
  useEffect(() => {
    (window as any).getGoogleCalendarTokens = getStoredTokens;
  }, [tokens]);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Calendrier Google
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">Calendrier connecté</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Vos rendez-vous seront automatiquement ajoutés à votre calendrier Google.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={disconnectGoogle}
              className="w-full"
            >
              Déconnecter
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <span className="text-orange-800 font-medium">Calendrier non connecté</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Connectez votre calendrier Google pour que vos rendez-vous y soient automatiquement ajoutés.
            </p>
            <Button
              onClick={initiateGoogleAuth}
              disabled={isConnecting}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isConnecting ? (
                "Connexion en cours..."
              ) : (
                <>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Connecter Google Calendar
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleCalendarAuth;