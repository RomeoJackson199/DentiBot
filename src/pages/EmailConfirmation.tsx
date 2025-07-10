import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2, Mail, ArrowLeft } from "lucide-react";

export const EmailConfirmation = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        // Get the token from URL params
        const token = searchParams.get('token');
        const type = searchParams.get('type');
        
        if (!token || type !== 'signup') {
          setStatus('error');
          setMessage('Lien de confirmation invalide ou expiré.');
          return;
        }

        // Verify the email confirmation
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'signup',
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          setMessage(error.message || 'Erreur lors de la confirmation de l\'email.');
        } else {
          setStatus('success');
          setMessage('Votre email a été confirmé avec succès !');
          
          toast({
            title: "Email confirmé !",
            description: "Votre compte est maintenant actif. Vous pouvez vous connecter.",
          });

          // Redirect to login after 3 seconds
          setTimeout(() => {
            navigate('/');
          }, 3000);
        }
      } catch (error) {
        console.error('Unexpected error:', error);
        setStatus('error');
        setMessage('Une erreur inattendue s\'est produite.');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate, toast]);

  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-16 w-16 text-dental-primary animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
      case 'expired':
        return <XCircle className="h-16 w-16 text-red-500" />;
      default:
        return <Mail className="h-16 w-16 text-dental-primary" />;
    }
  };

  const getStatusTitle = () => {
    switch (status) {
      case 'loading':
        return 'Confirmation en cours...';
      case 'success':
        return 'Email confirmé !';
      case 'error':
        return 'Erreur de confirmation';
      case 'expired':
        return 'Lien expiré';
      default:
        return 'Confirmation d\'email';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-dental-primary';
    }
  };

  return (
    <div className="min-h-screen hero-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="floating-card animate-scale-in">
          <CardHeader className="text-center pb-6">
            {/* Logo */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="pulse-ring w-20 h-20 -top-5 -left-5"></div>
                <div className="relative p-4 rounded-3xl shadow-glow animate-float bg-white">
                  <img 
                    src="/lovable-uploads/bd9069b9-f5b0-427d-8acb-8b6a25ccba24.png" 
                    alt="First Smile AI Logo" 
                    className="h-12 w-12 object-contain"
                  />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-secondary rounded-full animate-pulse shadow-float"></div>
              </div>
            </div>
            
            <CardTitle className="text-2xl font-bold gradient-text mb-2">
              First Smile AI
            </CardTitle>
            
            <div className="flex justify-center mb-4">
              {getStatusIcon()}
            </div>
            
            <h1 className={`text-xl font-semibold ${getStatusColor()}`}>
              {getStatusTitle()}
            </h1>
          </CardHeader>
          
          <CardContent className="text-center space-y-6">
            <p className="text-dental-muted-foreground leading-relaxed">
              {message}
            </p>
            
            {status === 'success' && (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Compte activé avec succès</span>
                  </div>
                  <p className="text-sm text-green-600 mt-2">
                    Vous serez redirigé automatiquement dans quelques secondes...
                  </p>
                </div>
                
                <Button 
                  onClick={() => navigate('/')}
                  className="w-full bg-gradient-primary text-white hover:shadow-glow transition-all duration-300"
                >
                  Accéder à DentiBot
                </Button>
              </div>
            )}
            
            {(status === 'error' || status === 'expired') && (
              <div className="space-y-4">
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-red-700">
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">Confirmation échouée</span>
                  </div>
                  <p className="text-sm text-red-600 mt-2">
                    Le lien de confirmation est invalide ou a expiré
                  </p>
                </div>
                
                <div className="flex flex-col space-y-3">
                  <Button 
                    onClick={() => navigate('/')}
                    className="w-full bg-gradient-primary text-white hover:shadow-glow transition-all duration-300"
                  >
                    Retourner à l'accueil
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/')}
                    className="w-full border-dental-primary/30 text-dental-primary hover:bg-dental-primary/10"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Réessayer l'inscription
                  </Button>
                </div>
              </div>
            )}
            
            {status === 'loading' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-600">
                    Vérification de votre email en cours...
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-dental-muted-foreground text-sm">
            Besoin d'aide ? Contactez notre support technique
          </p>
        </div>
      </div>
    </div>
  );
};