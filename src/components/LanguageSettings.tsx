import { Check } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";

const languages = [
  { code: 'en' as const, name: 'English', flag: '🇺🇸', label: 'US English' },
  { code: 'fr' as const, name: 'Français', flag: '🇫🇷', label: 'FR Français' }
];

export const LanguageSettings = () => {
  const { language, setLanguage, t } = useLanguage('settings');
  const { toast } = useToast();

  const handleLanguageChange = (languageCode: 'en' | 'fr') => {
    setLanguage(languageCode);
    document.cookie = `i18next=${languageCode}; path=/; max-age=${60 * 60 * 24 * 365}`;
    const languageObj = languages.find(lang => lang.code === languageCode);
    toast({
      title: (t as any)('language.updated'),
      description: (t as any)('language.changedTo', { language: languageObj?.name })
    });
  };

  const currentLanguage = languages.find(lang => lang.code === language);

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-full bg-muted/50 border-border rounded-lg">
        <SelectValue>
          <div className="flex items-center gap-3">
            <span className="text-lg">{currentLanguage?.flag}</span>
            <span className="font-medium">{currentLanguage?.label}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-background border-border shadow-lg">
        {languages.map((languageItem) => (
          <SelectItem 
            key={languageItem.code} 
            value={languageItem.code}
            className="hover:bg-muted focus:bg-muted"
          >
            <div className="flex items-center gap-3 w-full">
              <span className="text-lg">{languageItem.flag}</span>
              <span className="flex-1 font-medium">{languageItem.label}</span>
              {language === languageItem.code && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};