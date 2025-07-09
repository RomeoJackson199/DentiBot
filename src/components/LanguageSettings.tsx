import { useState, useEffect } from "react";
import { Settings, Globe, Check, Moon, Sun, User, Heart } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
];

export const LanguageSettings = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('fr');
  const [theme, setTheme] = useState('dark');
  const [isOpen, setIsOpen] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    dateOfBirth: '',
    medicalHistory: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    // Load saved preferences
    const savedLanguage = localStorage.getItem('preferred-language') || 'fr';
    const savedTheme = localStorage.getItem('theme') || 'dark';
    const savedPersonalInfo = localStorage.getItem('personal-info');
    
    setSelectedLanguage(savedLanguage);
    setTheme(savedTheme);
    
    if (savedPersonalInfo) {
      setPersonalInfo(JSON.parse(savedPersonalInfo));
    }
    
    // Apply theme
    document.documentElement.className = savedTheme;
  }, []);

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode);
    const language = languages.find(lang => lang.code === languageCode);
    toast({
      title: "Language Updated",
      description: `Language changed to ${language?.name}`,
    });
    localStorage.setItem('preferred-language', languageCode);
  };

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    document.documentElement.className = newTheme;
    localStorage.setItem('theme', newTheme);
    toast({
      title: "Theme Updated",
      description: `Switched to ${newTheme} mode`,
    });
  };

  const handlePersonalInfoChange = (field: string, value: string) => {
    const updatedInfo = { ...personalInfo, [field]: value };
    setPersonalInfo(updatedInfo);
    localStorage.setItem('personal-info', JSON.stringify(updatedInfo));
  };

  const savePersonalInfo = () => {
    toast({
      title: "Personal Information Saved",
      description: "Your information has been updated successfully.",
    });
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
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden bg-card border-border/50 shadow-glow">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent flex items-center gap-2">
            <Settings className="h-6 w-6 text-dental-primary" />
            Settings
          </DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">General</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              {theme === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
              <span className="hidden sm:inline">Theme</span>
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Personal</span>
            </TabsTrigger>
          </TabsList>

          <div className="max-h-[60vh] overflow-y-auto pr-2">
            <TabsContent value="general" className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Preferred Language
                </Label>
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
            </TabsContent>

            <TabsContent value="appearance" className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium text-foreground">
                  Theme
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant={theme === 'light' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('light')}
                    className="flex items-center gap-2 h-12"
                  >
                    <Sun className="h-4 w-4" />
                    Light
                  </Button>
                  <Button
                    variant={theme === 'dark' ? 'default' : 'outline'}
                    onClick={() => handleThemeChange('dark')}
                    className="flex items-center gap-2 h-12"
                  >
                    <Moon className="h-4 w-4" />
                    Dark
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="personal" className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={personalInfo.firstName}
                    onChange={(e) => handlePersonalInfoChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={personalInfo.lastName}
                    onChange={(e) => handlePersonalInfoChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={personalInfo.phone}
                    onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Date of Birth</Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) => handlePersonalInfoChange('dateOfBirth', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="medicalHistory" className="flex items-center gap-2">
                  <Heart className="h-4 w-4" />
                  Medical History
                </Label>
                <Textarea
                  id="medicalHistory"
                  value={personalInfo.medicalHistory}
                  onChange={(e) => handlePersonalInfoChange('medicalHistory', e.target.value)}
                  placeholder="Enter relevant medical history, allergies, medications, etc."
                  className="min-h-[80px]"
                />
              </div>
              <Button onClick={savePersonalInfo} className="w-full">
                Save Personal Information
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};