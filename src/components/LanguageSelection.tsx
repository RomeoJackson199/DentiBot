import { useState } from "react";
import { Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇺🇸', label: 'US English' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷', label: 'FR Français' },
  { code: 'nl' as const, name: 'Nederlands', flag: '🇳🇱', label: 'NL Nederlands' },
];

interface LanguageSelectionProps {
  onLanguageSelected: () => void;
}

export const LanguageSelection = ({ onLanguageSelected }: LanguageSelectionProps) => {
  const { language, setLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState<'en' | 'fr' | 'nl'>(language);

  const handleLanguageSelect = (languageCode: 'en' | 'fr' | 'nl') => {
    setSelectedLang(languageCode);
  };

  const handleConfirm = () => {
    setLanguage(selectedLang);
    onLanguageSelected();
  };

  return (
    <div className="min-h-screen flex items-center justify-center mesh-bg p-4">
      <Card className="w-full max-w-md glass-card border-dental-primary/20 shadow-glow">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="relative">
              <div className="pulse-ring w-16 h-16 -top-4 -left-4"></div>
              <div className="relative bg-gradient-primary p-4 rounded-2xl shadow-glow">
                <Globe className="h-8 w-8 text-white" />
              </div>
            </div>
          </div>
          <CardTitle className="text-2xl gradient-text">
            {t.selectPreferredLanguage}
          </CardTitle>
          <CardDescription className="text-dental-muted-foreground">
            {t.languageSelectionDescription}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="space-y-3">
            {languages.map((languageItem) => (
              <button
                key={languageItem.code}
                onClick={() => handleLanguageSelect(languageItem.code)}
                className={`w-full p-4 rounded-xl border-2 transition-all duration-300 hover:scale-105 ${
                  selectedLang === languageItem.code
                    ? 'border-dental-primary bg-dental-primary/10 shadow-elegant'
                    : 'border-dental-primary/20 bg-white/50 hover:border-dental-primary/40'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{languageItem.flag}</span>
                    <div className="text-left">
                      <div className="font-semibold text-dental-primary">
                        {languageItem.label}
                      </div>
                      <div className="text-sm text-dental-muted-foreground">
                        {languageItem.name}
                      </div>
                    </div>
                  </div>
                  {selectedLang === languageItem.code && (
                    <Check className="h-5 w-5 text-dental-primary" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <Button 
            onClick={handleConfirm}
            className="w-full bg-gradient-primary text-white hover:shadow-glow transition-all duration-300 hover:scale-105"
            size="lg"
          >
            {t.save}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
