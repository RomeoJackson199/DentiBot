import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Download, 
  Bell, 
  Wifi, 
  WifiOff, 
  Smartphone,
  Share,
  Home,
  Settings
} from 'lucide-react';
import { modernToast } from '@/components/enhanced/ModernNotificationToast';

interface PWAFeaturesProps {
  className?: string;
}

export function PWAFeatures({ className }: PWAFeaturesProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check if app is installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                        (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    // Listen for online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check notification permission
    setNotificationPermission(Notification.permission);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!installPrompt) {
      modernToast.info({
        title: 'Install Available',
        description: 'Use your browser menu to install this app'
      });
      return;
    }

    const result = await installPrompt.prompt();
    if (result.outcome === 'accepted') {
      modernToast.success({
        title: 'App Installing',
        description: 'DentiSmart is being installed on your device'
      });
      setInstallPrompt(null);
    }
  };

  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      modernToast.error({
        title: 'Not Supported',
        description: 'Your browser does not support notifications'
      });
      return;
    }

    if (notificationPermission === 'granted') {
      setPushEnabled(!pushEnabled);
      modernToast.success({
        title: pushEnabled ? 'Notifications Disabled' : 'Notifications Enabled',
        description: `Push notifications have been ${pushEnabled ? 'disabled' : 'enabled'}`
      });
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        setPushEnabled(true);
        modernToast.success({
          title: 'Notifications Enabled',
          description: 'You will now receive push notifications'
        });
        
        // Send test notification
        new Notification('DentiSmart', {
          body: 'Notifications are now enabled!',
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        });
      } else {
        modernToast.warning({
          title: 'Permission Denied',
          description: 'Enable notifications in your browser settings'
        });
      }
    } catch (error) {
      modernToast.error({
        title: 'Error',
        description: 'Failed to enable notifications'
      });
    }
  };

  const handleShareApp = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'DentiSmart - Smart Dental Scheduling',
          text: 'Check out this amazing dental appointment scheduling app!',
          url: window.location.origin
        });
        modernToast.success({
          title: 'Shared Successfully',
          description: 'Thanks for sharing DentiSmart!'
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback to copying URL
      navigator.clipboard.writeText(window.location.origin);
      modernToast.success({
        title: 'Link Copied',
        description: 'App link copied to clipboard'
      });
    }
  };

  const addToHomeScreen = () => {
    modernToast.info({
      title: 'Add to Home Screen',
      description: 'Use your browser menu to add DentiSmart to your home screen',
      action: {
        label: 'Learn More',
        onClick: () => window.open('https://support.google.com/chrome/answer/9658361', '_blank')
      }
    });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Connection Status */}
      <Card className="border-l-4 border-l-dental-primary">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-600" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600" />
              )}
              <div>
                <h3 className="font-semibold">Connection Status</h3>
                <p className="text-sm text-dental-muted-foreground">
                  {isOnline ? 'Online - All features available' : 'Offline - Limited features'}
                </p>
              </div>
            </div>
            <Badge variant={isOnline ? 'default' : 'destructive'}>
              {isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* App Installation */}
      {!isInstalled && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Download className="h-5 w-5" />
              Install App
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-dental-muted-foreground">
              Install DentiSmart on your device for faster access and offline features.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={handleInstallApp} className="w-full">
                <Smartphone className="h-4 w-4 mr-2" />
                Install App
              </Button>
              <Button variant="outline" onClick={addToHomeScreen} className="w-full">
                <Home className="h-4 w-4 mr-2" />
                Add to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-dental-muted-foreground">
                Get notified about appointments and important updates
              </p>
            </div>
            <Switch
              checked={pushEnabled && notificationPermission === 'granted'}
              onCheckedChange={handleEnableNotifications}
            />
          </div>
          
          {notificationPermission === 'denied' && (
            <div className="p-3 bg-dental-warning/10 border border-dental-warning/20 rounded-lg">
              <p className="text-sm text-dental-warning-foreground">
                Notifications are blocked. Enable them in your browser settings to receive updates.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Share App */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Share className="h-5 w-5" />
            Share App
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-dental-muted-foreground mb-4">
            Help others discover DentiSmart - share it with friends and family.
          </p>
          <Button onClick={handleShareApp} variant="outline" className="w-full">
            <Share className="h-4 w-4 mr-2" />
            Share DentiSmart
          </Button>
        </CardContent>
      </Card>

      {/* Mobile Optimizations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5" />
            Mobile Features
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm">Responsive Design</span>
            <Badge variant="default" className="bg-green-600">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Touch Optimized</span>
            <Badge variant="default" className="bg-green-600">Active</Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Offline Support</span>
            <Badge variant={isInstalled ? 'default' : 'outline'} 
                   className={isInstalled ? 'bg-green-600' : ''}>
              {isInstalled ? 'Available' : 'Install App'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Fast Loading</span>
            <Badge variant="default" className="bg-green-600">Optimized</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}