import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";
import { Languages, Check } from "lucide-react";

interface LanguageSelectorProps {
  onLanguageChange?: (language: string) => void;
}

export const LanguageSelector = ({ onLanguageChange }: LanguageSelectorProps) => {
  const { language, setLanguage } = useLanguage();
  
  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  ];

  const handleLanguageSelect = (langCode: 'en' | 'fr' | 'nl') => {
    setLanguage(langCode);
    onLanguageChange?.(langCode);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Langue / Language
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {languages.map((lang) => (
          <Button
            key={lang.code}
            variant={language === lang.code ? "default" : "outline"}
            className="w-full justify-between"
            onClick={() => handleLanguageSelect(lang.code as 'en' | 'fr' | 'nl')}
          >
            <span className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </span>
            {language === lang.code && (
              <Check className="h-4 w-4" />
            )}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};