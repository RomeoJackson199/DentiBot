import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { 
  Eye, 
  Ear, 
  Hand, 
  Type, 
  Contrast, 
  Volume2, 
  MousePointer,
  Keyboard,
  Settings,
  Check,
  X
} from 'lucide-react';
import { analytics, ANALYTICS_EVENTS } from '@/lib/analytics';
import { cn } from '@/lib/utils';

interface AccessibilitySettings {
  highContrast: boolean;
  reduceMotion: boolean;
  largerText: boolean;
  focusIndicators: boolean;
  keyboardNavigation: boolean;
  screenReader: boolean;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  colorTheme: 'default' | 'high-contrast' | 'dark-high' | 'yellow-black';
  soundEnabled: boolean;
  voicePrompts: boolean;
}

const defaultSettings: AccessibilitySettings = {
  highContrast: false,
  reduceMotion: false,
  largerText: false,
  focusIndicators: true,
  keyboardNavigation: true,
  screenReader: false,
  fontSize: 16,
  lineHeight: 1.5,
  letterSpacing: 0,
  colorTheme: 'default',
  soundEnabled: true,
  voicePrompts: false,
};

export const AccessibilityManager: React.FC = () => {
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);
  const [isApplied, setIsApplied] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedSettings = localStorage.getItem('accessibility-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsed });
      } catch (e) {
        console.error('Failed to parse accessibility settings:', e);
      }
    }

    // Detect if user is using assistive technology
    detectAssistiveTechnology();

    // Apply settings on load
    applySettings();
  }, []);

  const detectAssistiveTechnology = async () => {
    // Detect screen reader
    if (typeof window !== 'undefined') {
      // Check for common screen readers
      const hasScreenReader = 
        'speechSynthesis' in window ||
        navigator.userAgent.includes('NVDA') ||
        navigator.userAgent.includes('JAWS') ||
        navigator.userAgent.includes('VoiceOver');

      if (hasScreenReader) {
        setSettings(prev => ({ ...prev, screenReader: true }));
        await analytics.track(ANALYTICS_EVENTS.SCREEN_READER_DETECTED);
      }

      // Check for high contrast preference
      if (window.matchMedia('(prefers-contrast: high)').matches) {
        setSettings(prev => ({ ...prev, highContrast: true }));
        await analytics.track(ANALYTICS_EVENTS.HIGH_CONTRAST_ENABLED, { source: 'system' });
      }

      // Check for reduced motion preference
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setSettings(prev => ({ ...prev, reduceMotion: true }));
      }

      // Detect keyboard navigation
      const handleKeyboardNavigation = () => {
        analytics.track(ANALYTICS_EVENTS.KEYBOARD_NAVIGATION_USED);
      };

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          handleKeyboardNavigation();
        }
      });
    }
  };

  const applySettings = () => {
    const root = document.documentElement;
    
    // Apply CSS custom properties
    root.style.setProperty('--accessibility-font-size', `${settings.fontSize}px`);
    root.style.setProperty('--accessibility-line-height', settings.lineHeight.toString());
    root.style.setProperty('--accessibility-letter-spacing', `${settings.letterSpacing}px`);

    // Apply theme classes
    root.classList.remove('accessibility-high-contrast', 'accessibility-reduce-motion', 'accessibility-large-text');
    
    if (settings.highContrast) {
      root.classList.add('accessibility-high-contrast');
    }
    
    if (settings.reduceMotion) {
      root.classList.add('accessibility-reduce-motion');
    }
    
    if (settings.largerText) {
      root.classList.add('accessibility-large-text');
    }

    // Apply color theme
    root.setAttribute('data-accessibility-theme', settings.colorTheme);

    // Enhanced focus indicators
    if (settings.focusIndicators) {
      root.classList.add('accessibility-enhanced-focus');
    } else {
      root.classList.remove('accessibility-enhanced-focus');
    }

    setIsApplied(true);
    setTimeout(() => setIsApplied(false), 2000);
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));

    // Track accessibility usage
    analytics.track('accessibility_setting_changed', {
      setting: key,
      value: value,
    });

    applySettings();
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
    applySettings();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Accessibility Settings</h2>
          <p className="text-muted-foreground">Customize your experience for better accessibility</p>
        </div>
        {isApplied && (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <Check className="h-3 w-3 mr-1" />
            Settings Applied
          </Badge>
        )}
      </div>

      {/* Visual Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Visual Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="high-contrast">High Contrast Mode</Label>
                <p className="text-xs text-muted-foreground">
                  Increases contrast for better visibility
                </p>
              </div>
              <Switch
                id="high-contrast"
                checked={settings.highContrast}
                onCheckedChange={(checked) => updateSetting('highContrast', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="reduce-motion">Reduce Motion</Label>
                <p className="text-xs text-muted-foreground">
                  Minimizes animations and transitions
                </p>
              </div>
              <Switch
                id="reduce-motion"
                checked={settings.reduceMotion}
                onCheckedChange={(checked) => updateSetting('reduceMotion', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="larger-text">Larger Text</Label>
                <p className="text-xs text-muted-foreground">
                  Increases default text size
                </p>
              </div>
              <Switch
                id="larger-text"
                checked={settings.largerText}
                onCheckedChange={(checked) => updateSetting('largerText', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="focus-indicators">Enhanced Focus</Label>
                <p className="text-xs text-muted-foreground">
                  Stronger focus indicators for keyboard navigation
                </p>
              </div>
              <Switch
                id="focus-indicators"
                checked={settings.focusIndicators}
                onCheckedChange={(checked) => updateSetting('focusIndicators', checked)}
              />
            </div>
          </div>

          {/* Font Size Control */}
          <div className="space-y-3">
            <Label>Font Size: {settings.fontSize}px</Label>
            <Slider
              value={[settings.fontSize]}
              onValueChange={([value]) => updateSetting('fontSize', value)}
              max={24}
              min={12}
              step={1}
              className="w-full"
            />
          </div>

          {/* Line Height Control */}
          <div className="space-y-3">
            <Label>Line Height: {settings.lineHeight}</Label>
            <Slider
              value={[settings.lineHeight]}
              onValueChange={([value]) => updateSetting('lineHeight', value)}
              max={2}
              min={1}
              step={0.1}
              className="w-full"
            />
          </div>

          {/* Color Theme */}
          <div className="space-y-3">
            <Label htmlFor="color-theme">Color Theme</Label>
            <Select
              value={settings.colorTheme}
              onValueChange={(value) => updateSetting('colorTheme', value as any)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="high-contrast">High Contrast</SelectItem>
                <SelectItem value="dark-high">Dark High Contrast</SelectItem>
                <SelectItem value="yellow-black">Yellow on Black</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Navigation Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="keyboard-nav">Keyboard Navigation</Label>
              <p className="text-xs text-muted-foreground">
                Enable full keyboard accessibility
              </p>
            </div>
            <Switch
              id="keyboard-nav"
              checked={settings.keyboardNavigation}
              onCheckedChange={(checked) => updateSetting('keyboardNavigation', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Audio Accessibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Audio Accessibility
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="sound-enabled">Sound Feedback</Label>
              <p className="text-xs text-muted-foreground">
                Play sounds for interactions
              </p>
            </div>
            <Switch
              id="sound-enabled"
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => updateSetting('soundEnabled', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="voice-prompts">Voice Prompts</Label>
              <p className="text-xs text-muted-foreground">
                Audio descriptions for actions
              </p>
            </div>
            <Switch
              id="voice-prompts"
              checked={settings.voicePrompts}
              onCheckedChange={(checked) => updateSetting('voicePrompts', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Screen Reader Support */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ear className="h-5 w-5" />
            Screen Reader Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Screen Reader Detected</Label>
              <p className="text-xs text-muted-foreground">
                {settings.screenReader ? 'Screen reader support is active' : 'No screen reader detected'}
              </p>
            </div>
            <Badge 
              variant={settings.screenReader ? 'default' : 'outline'}
              className={settings.screenReader ? 'bg-green-100 text-green-800' : ''}
            >
              {settings.screenReader ? 'Active' : 'Inactive'}
            </Badge>
          </div>

          {settings.screenReader && (
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-medium text-blue-900 mb-2">Screen Reader Tips:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use Tab to navigate between interactive elements</li>
                <li>• Press Enter or Space to activate buttons</li>
                <li>• Use arrow keys to navigate within menus</li>
                <li>• Press Escape to close dialogs</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button onClick={applySettings} className="flex-1">
          <Settings className="h-4 w-4 mr-2" />
          Apply Settings
        </Button>
        <Button variant="outline" onClick={resetSettings}>
          <X className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>
      </div>
    </div>
  );
};

// CSS to be added to index.css
export const accessibilityCSS = `
/* Accessibility enhancements */
.accessibility-high-contrast {
  filter: contrast(150%);
}

.accessibility-reduce-motion,
.accessibility-reduce-motion * {
  animation-duration: 0.01s !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01s !important;
  scroll-behavior: auto !important;
}

.accessibility-large-text {
  font-size: 1.125rem !important;
  line-height: 1.75 !important;
}

.accessibility-enhanced-focus *:focus-visible {
  outline: 3px solid hsl(var(--primary)) !important;
  outline-offset: 2px !important;
  box-shadow: 0 0 0 1px hsl(var(--background)), 0 0 0 4px hsl(var(--primary) / 0.3) !important;
}

/* High contrast theme */
[data-accessibility-theme="high-contrast"] {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --muted: 0 0% 90%;
  --muted-foreground: 0 0% 20%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 0%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 0%;
  --border: 0 0% 60%;
  --input: 0 0% 90%;
  --primary: 0 0% 0%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 80%;
  --secondary-foreground: 0 0% 0%;
}

[data-accessibility-theme="dark-high"] {
  --background: 0 0% 0%;
  --foreground: 0 0% 100%;
  --muted: 0 0% 20%;
  --muted-foreground: 0 0% 80%;
  --popover: 0 0% 0%;
  --popover-foreground: 0 0% 100%;
  --card: 0 0% 0%;
  --card-foreground: 0 0% 100%;
  --border: 0 0% 40%;
  --input: 0 0% 20%;
  --primary: 0 0% 100%;
  --primary-foreground: 0 0% 0%;
  --secondary: 0 0% 30%;
  --secondary-foreground: 0 0% 100%;
}

[data-accessibility-theme="yellow-black"] {
  --background: 60 100% 0%;
  --foreground: 60 100% 100%;
  --muted: 60 100% 20%;
  --muted-foreground: 60 100% 80%;
  --popover: 60 100% 0%;
  --popover-foreground: 60 100% 100%;
  --card: 60 100% 0%;
  --card-foreground: 60 100% 100%;
  --border: 60 100% 40%;
  --input: 60 100% 20%;
  --primary: 60 100% 100%;
  --primary-foreground: 60 100% 0%;
  --secondary: 60 100% 30%;
  --secondary-foreground: 60 100% 100%;
}

/* Skip to main content link */
.skip-to-main {
  position: absolute;
  top: -40px;
  left: 6px;
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  padding: 8px;
  text-decoration: none;
  border-radius: 4px;
  z-index: 1000;
}

.skip-to-main:focus {
  top: 6px;
}
`;