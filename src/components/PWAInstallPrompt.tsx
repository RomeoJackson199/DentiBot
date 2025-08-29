import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const PWAInstallPrompt = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Check if banner was dismissed recently
  const checkDismissalStatus = () => {
    const dismissedAt = localStorage.getItem('dentibot:pwaBannerDismissed');
    if (dismissedAt) {
      const dismissedTime = new Date(dismissedAt);
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
      return dismissedTime > thirtyDaysAgo;
    }
    return false;
  };

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      
      // Only show if not dismissed in last 30 days and not on login/booking pages
      const isDismissed = checkDismissalStatus();
      const isOnLoginOrBooking = window.location.pathname.includes('/auth') || 
                                window.location.pathname.includes('/book') ||
                                document.querySelector('[data-modal-open="true"]');
      
      if (!isDismissed && !isOnLoginOrBooking) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  // Check for modals and hide banner
  useEffect(() => {
    const checkForModals = () => {
      const hasModal = document.querySelector('[role="dialog"], .modal, [data-modal-open="true"]');
      if (hasModal && showPrompt) {
        setShowPrompt(false);
      }
    };

    const observer = new MutationObserver(checkForModals);
    observer.observe(document.body, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, [showPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    // Store dismissal with 30-day expiry
    localStorage.setItem('dentibot:pwaBannerDismissed', new Date().toISOString());
    setShowPrompt(false);
    setDeferredPrompt(null);
  };

  if (!showPrompt || !deferredPrompt) return null;

  return (
    <Card className="fixed bottom-4 left-4 right-4 md:left-auto md:w-80 glass-card border-dental-primary/20 z-[45] shadow-lg">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-5 w-5 text-dental-primary" />
              <h3 className="font-semibold text-dental-foreground">Install DentiSmart</h3>
            </div>
            <p className="text-sm text-dental-muted-foreground mb-3">
              Install our app for quick access and offline functionality.
            </p>
            <div className="flex gap-2">
              <Button onClick={handleInstall} size="sm" className="flex-1">
                Install
              </Button>
              <Button 
                onClick={handleDismiss} 
                variant="outline" 
                size="sm"
                className="min-w-[44px] min-h-[44px] p-2"
                aria-label="Dismiss install prompt"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};