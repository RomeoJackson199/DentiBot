import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, changeLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ChatSettingsManagerProps {
  user: User;
  onResponse: (message: string, actionButtons?: any[]) => void;
}

export const ChatSettingsManager = ({ user, onResponse }: ChatSettingsManagerProps) => {
  const { t, currentLanguage } = useLanguage();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const [showPersonalInfoForm, setShowPersonalInfoForm] = useState(false);
  const [personalInfo, setPersonalInfo] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    emergency_contact: '',
    medical_history: ''
  });
  const [loading, setLoading] = useState(false);

  const handleLanguageChange = (lang: string) => {
    const validLangs = ['en', 'fr', 'nl'];
    if (validLangs.includes(lang)) {
      changeLanguage(lang as 'en' | 'fr' | 'nl');
      localStorage.setItem('preferred-language', lang);
      
      const langNames = {
        en: 'English',
        fr: 'French',
        nl: 'Dutch'
      };
      
      onResponse(`✅ Language changed to ${langNames[lang as keyof typeof langNames]} successfully!`);
      
      toast({
        title: t.success,
        description: `Language changed to ${langNames[lang as keyof typeof langNames]}`
      });
    } else {
      onResponse("I support English, French (français), and Dutch (Nederlands). Please specify one of these languages.");
    }
  };

  const handleThemeChange = (newTheme: string) => {
    if (newTheme === 'dark' || newTheme === 'light') {
      setTheme(newTheme);
      onResponse(`✅ Theme changed to ${newTheme} mode successfully!`);
      
      toast({
        title: t.success,
        description: `Theme changed to ${newTheme} mode`
      });
    } else {
      onResponse("I can set the theme to either 'light' or 'dark' mode. Which would you prefer?");
    }
  };

  const showPersonalInfoEditor = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('first_name, last_name, phone, address, emergency_contact, medical_history')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setPersonalInfo({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          address: data.address || '',
          emergency_contact: data.emergency_contact || '',
          medical_history: data.medical_history || ''
        });
      }
      
      setShowPersonalInfoForm(true);
      onResponse("I'll help you update your personal information. Please fill in the form below:");
      
    } catch (error) {
      console.error('Error fetching profile:', error);
      onResponse("I couldn't load your current information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const savePersonalInfo = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: personalInfo.first_name,
          last_name: personalInfo.last_name,
          phone: personalInfo.phone,
          address: personalInfo.address,
          emergency_contact: personalInfo.emergency_contact,
          medical_history: personalInfo.medical_history
        })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowPersonalInfoForm(false);
      onResponse("✅ Your personal information has been updated successfully!");
      
      toast({
        title: t.success,
        description: "Personal information saved successfully"
      });
      
    } catch (error) {
      console.error('Error saving profile:', error);
      onResponse("I couldn't save your information right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const processSettingsCommand = (message: string) => {
    const lowerMessage = message.toLowerCase();
    
    // Language change commands
    if (lowerMessage.includes('change') && lowerMessage.includes('language')) {
      if (lowerMessage.includes('english') || lowerMessage.includes('en')) {
        handleLanguageChange('en');
      } else if (lowerMessage.includes('french') || lowerMessage.includes('français') || lowerMessage.includes('fr')) {
        handleLanguageChange('fr');
      } else if (lowerMessage.includes('dutch') || lowerMessage.includes('nederlands') || lowerMessage.includes('nl')) {
        handleLanguageChange('nl');
      } else {
        onResponse("Which language would you like to use? I support English, French (français), and Dutch (Nederlands).");
      }
      return true;
    }

    // Theme change commands
    if (lowerMessage.includes('dark') && lowerMessage.includes('mode')) {
      handleThemeChange('dark');
      return true;
    }
    
    if (lowerMessage.includes('light') && lowerMessage.includes('mode')) {
      handleThemeChange('light');
      return true;
    }

    if (lowerMessage.includes('switch') && lowerMessage.includes('theme')) {
      const newTheme = theme === 'dark' ? 'light' : 'dark';
      handleThemeChange(newTheme);
      return true;
    }

    // Personal info update commands
    if ((lowerMessage.includes('update') || lowerMessage.includes('change')) && 
        (lowerMessage.includes('personal') || lowerMessage.includes('profile') || 
         lowerMessage.includes('information') || lowerMessage.includes('details'))) {
      showPersonalInfoEditor();
      return true;
    }

    return false;
  };

  const PersonalInfoForm = () => {
    if (!showPersonalInfoForm) return null;

    return (
      <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
        <CardContent className="p-6 space-y-4">
          <h3 className="font-semibold text-center">Update Personal Information</h3>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="firstName" className="text-sm">First Name</Label>
                <Input
                  id="firstName"
                  value={personalInfo.first_name}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, first_name: e.target.value }))}
                  className="text-sm"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-sm">Last Name</Label>
                <Input
                  id="lastName"
                  value={personalInfo.last_name}
                  onChange={(e) => setPersonalInfo(prev => ({ ...prev, last_name: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="phone" className="text-sm">Phone Number</Label>
              <Input
                id="phone"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-sm">Address</Label>
              <Input
                id="address"
                value={personalInfo.address}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, address: e.target.value }))}
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="emergency" className="text-sm">Emergency Contact</Label>
              <Input
                id="emergency"
                value={personalInfo.emergency_contact}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, emergency_contact: e.target.value }))}
                placeholder="Name and phone number"
                className="text-sm"
              />
            </div>

            <div>
              <Label htmlFor="medical" className="text-sm">Medical History</Label>
              <Textarea
                id="medical"
                value={personalInfo.medical_history}
                onChange={(e) => setPersonalInfo(prev => ({ ...prev, medical_history: e.target.value }))}
                placeholder="Allergies, medications, conditions..."
                className="text-sm min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setShowPersonalInfoForm(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              onClick={savePersonalInfo}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return {
    processSettingsCommand,
    PersonalInfoForm,
    handleLanguageChange,
    handleThemeChange,
    showPersonalInfoEditor,
    loading
  };
};