import { useState } from "react";
import { Settings, Globe, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export const LanguageSettings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('fr'); // Default to French
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    const language = languages.find(lang => lang.code === languageCode);
    toast({
      title: "Language Updated",
      description: `Language changed to ${language?.name}`,
    });
    // Here you would typically update the app's language context/i18n
    localStorage.setItem('preferred-language', languageCode);
  };

  const currentLanguage = languages.find(lang => lang.code === selectedLanguage);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0 text-dental-muted-foreground hover:text-dental-primary hover:bg-dental-primary/10 transition-all duration-300"
        >
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md bg-card border-border/50 shadow-glow">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
            <Globe className="h-6 w-6 text-dental-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 pt-4">
          <div className="space-y-3">
            <label className="text-sm font-medium text-foreground">
              Preferred Language
            </label>
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger className="w-full bg-muted/50 border-dental-primary/20 hover:border-dental-primary/40 transition-colors">
                <SelectValue placeholder="Select language">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{currentLanguage?.flag}</span>
                    <span>{currentLanguage?.name}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-card border-border/50 shadow-glow">
                {languages.map((language) => (
                  <SelectItem 
                    key={language.code} 
                    value={language.code}
                    className="flex items-center gap-2 hover:bg-dental-primary/10 focus:bg-dental-primary/10"
                  >
                    <div className="flex items-center gap-2 w-full">
                      <span className="text-lg">{language.flag}</span>
                      <span className="flex-1">{language.name}</span>
                      {selectedLanguage === language.code && (
                        <Check className="h-4 w-4 text-dental-primary" />
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-4 border-t border-border/50">
            <p className="text-xs text-dental-muted-foreground">
              Language preferences are saved automatically and will apply to future interactions.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};