import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, ExternalLink, CheckCircle, AlertCircle, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface DentistGoogleCalendarAuthProps {
  dentistId?: string;
  onAuthSuccess?: (tokens: any) => void;
  onAuthError?: (error: string) => void;
}

export const DentistGoogleCalendarAuth = ({ dentistId, onAuthSuccess, onAuthError }: DentistGoogleCalendarAuthProps) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [tokens, setTokens] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (dentistId) {
      checkDentistCalendarConnection();
    }
  }, [dentistId]);

  const checkDentistCalendarConnection = async () => {
    if (!dentistId) return;
    
    try {
      const { data, error } = await supabase
        .from('dentists')
        .select('google_calendar_connected, google_calendar_tokens')
        .eq('id', dentistId)
        .single();

      if (error) throw error;

      if (data?.google_calendar_connected && data?.google_calendar_tokens) {
        setIsConnected(true);
        setTokens(data.google_calendar_tokens);
        onAuthSuccess?.(data.google_calendar_tokens);
      }
    } catch (error) {
      console.error('Error checking dentist calendar connection:', error);
    }
  };

  const initiateGoogleAuth = async () => {
    if (!dentistId) {
      toast({
        title: "Erreur",
        description: "ID du dentiste manquant",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsConnecting(true);
      
      // Store dentist ID for OAuth callback
      localStorage.setItem('connecting_dentist_id', dentistId);
      
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

  const disconnectGoogle = async () => {
    if (!dentistId) return;

    try {
      const { error } = await supabase
        .from('dentists')
        .update({
          google_calendar_tokens: null,
          google_calendar_connected: false
        })
        .eq('id', dentistId);

      if (error) throw error;

      setTokens(null);
      setIsConnected(false);
      
      toast({
        title: "Calendrier déconnecté",
        description: "Le calendrier Google du dentiste a été déconnecté.",
      });
    } catch (error) {
      console.error('Error disconnecting Google calendar:', error);
      toast({
        title: "Erreur",
        description: "Impossible de déconnecter le calendrier.",
        variant: "destructive",
      });
    }
  };

  // Handle OAuth callback on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const authCode = urlParams.get('code');
    const storedDentistId = localStorage.getItem('connecting_dentist_id');
    
    if (authCode && storedDentistId && !isConnected) {
      handleOAuthCallback(authCode, storedDentistId);
    }
  }, []);

  const handleOAuthCallback = async (authCode: string, dentistIdForAuth: string) => {
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
        // Store tokens in dentist record
        const { error: updateError } = await supabase
          .from('dentists')
          .update({
            google_calendar_tokens: data.tokens,
            google_calendar_connected: true
          })
          .eq('id', dentistIdForAuth);

        if (updateError) throw updateError;

        setTokens(data.tokens);
        setIsConnected(true);
        
        // Clean up
        localStorage.removeItem('connecting_dentist_id');
        window.history.replaceState({}, document.title, window.location.pathname);
        
        toast({
          title: "Calendrier Google connecté !",
          description: "Les rendez-vous seront maintenant ajoutés au calendrier du dentiste.",
        });

        onAuthSuccess?.(data.tokens);
      }
    } catch (error) {
      console.error('OAuth callback error:', error);
      toast({
        title: "Erreur de connexion",
        description: "Impossible de connecter le calendrier Google du dentiste.",
        variant: "destructive",
      });
      onAuthError?.(error.message);
    } finally {
      setIsConnecting(false);
    }
  };

  if (!dentistId) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Sélectionnez un dentiste pour gérer le calendrier</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-blue-600" />
          Calendrier Google - Dentiste
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
              Les rendez-vous seront automatiquement ajoutés au calendrier Google de ce dentiste.
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
              Connectez le calendrier Google de ce dentiste pour que les rendez-vous y soient automatiquement ajoutés.
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
                  Connecter Calendrier Dentiste
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DentistGoogleCalendarAuth;