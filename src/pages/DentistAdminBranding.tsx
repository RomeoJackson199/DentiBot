import { useState, useEffect } from "react";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Loader2, Palette, Upload, Image as ImageIcon, Bot, Sparkles, Building2 } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { SPECIALTY_TEMPLATES, getSpecialtyList } from "@/lib/specialtyTemplates";

export default function DentistAdminBranding() {
  const { dentistId, loading: dentistLoading } = useCurrentDentist();
  const [loading, setLoading] = useState(false);
  
  // Basic Branding
  const [clinicName, setClinicName] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0EA5E9");
  const [secondaryColor, setSecondaryColor] = useState("#10B981");
  const [logoUrl, setLogoUrl] = useState("");
  
  // Specialty & AI
  const [specialtyType, setSpecialtyType] = useState("dentist");
  const [aiInstructions, setAiInstructions] = useState("");
  const [aiTone, setAiTone] = useState("professional");
  const [aiResponseLength, setAiResponseLength] = useState("normal");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  
  // Display Settings
  const [showLogoInChat, setShowLogoInChat] = useState(true);
  const [showBrandingInEmails, setShowBrandingInEmails] = useState(true);
  
  const { toast } = useToast();
  const specialtyList = getSpecialtyList();

  useEffect(() => {
    if (dentistId) {
      loadBrandingSettings();
    }
  }, [dentistId]);

  const loadBrandingSettings = async () => {
    try {
      const { data: settings, error } = await supabase
        .from('clinic_settings')
        .select('*')
        .eq('dentist_id', dentistId)
        .maybeSingle();

      if (error) throw error;

      if (settings) {
        setClinicName(settings.clinic_name || "");
        setTagline(settings.tagline || "");
        setPrimaryColor(settings.primary_color || "#2D5D7B");
        setSecondaryColor(settings.secondary_color || "#8B5CF6");
        setLogoUrl(settings.logo_url || "");
        setSpecialtyType(settings.specialty_type || "dentist");
        setAiInstructions(settings.ai_instructions || "");
        setAiTone(settings.ai_tone || "professional");
        setAiResponseLength(settings.ai_response_length || "normal");
        setWelcomeMessage(settings.welcome_message || "");
        setShowLogoInChat(settings.show_logo_in_chat ?? true);
        setShowBrandingInEmails(settings.show_branding_in_emails ?? true);
      }
    } catch (error) {
      console.error('Error loading branding:', error);
      toast({
        title: "Error",
        description: "Failed to load branding settings",
        variant: "destructive",
      });
    }
  };

  const applyTemplate = (templateId: string) => {
    const template = SPECIALTY_TEMPLATES[templateId];
    if (!template) return;

    setSpecialtyType(template.id);
    setPrimaryColor(template.primaryColor);
    setSecondaryColor(template.secondaryColor);
    setAiInstructions(template.aiInstructions);
    setAiTone(template.aiTone);
    setWelcomeMessage(template.welcomeMessage);

    toast({
      title: "Template Applied",
      description: `Applied ${template.name} template. Review and customize as needed.`,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Logo must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${dentistId}-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('dental-photos')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dental-photos')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);

      toast({
        title: "Logo Uploaded",
        description: "Your clinic logo has been uploaded successfully",
      });
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBranding = async () => {
    if (!dentistId) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('clinic_settings')
        .upsert({
          dentist_id: dentistId,
          clinic_name: clinicName,
          tagline: tagline,
          logo_url: logoUrl,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          specialty_type: specialtyType,
          ai_instructions: aiInstructions,
          ai_tone: aiTone,
          ai_response_length: aiResponseLength,
          welcome_message: welcomeMessage,
          show_logo_in_chat: showLogoInChat,
          show_branding_in_emails: showBrandingInEmails,
        }, {
          onConflict: 'dentist_id'
        });

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your branding settings have been saved successfully",
      });
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save branding settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (dentistLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader 
        title="Branding & AI Customization"
        subtitle="Customize your practice's appearance and AI assistant behavior"
        breadcrumbs={[
          { label: 'Home', href: '/dentist' },
          { label: 'Admin' },
          { label: 'Branding' }
        ]}
      />

      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">
            <Building2 className="h-4 w-4 mr-2" />
            Basic Info
          </TabsTrigger>
          <TabsTrigger value="visual">
            <Palette className="h-4 w-4 mr-2" />
            Visual Brand
          </TabsTrigger>
          <TabsTrigger value="ai">
            <Bot className="h-4 w-4 mr-2" />
            AI Assistant
          </TabsTrigger>
          <TabsTrigger value="templates">
            <Sparkles className="h-4 w-4 mr-2" />
            Templates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Practice Information</CardTitle>
              <CardDescription>
                Basic information about your practice
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty Type</Label>
                <Select value={specialtyType} onValueChange={setSpecialtyType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {specialtyList.map(specialty => (
                      <SelectItem key={specialty.value} value={specialty.value}>
                        {specialty.icon} {specialty.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clinic-name">Practice Name</Label>
                <Input
                  id="clinic-name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Enter your practice name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Your practice's motto or tagline"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="visual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Practice Logo
              </CardTitle>
              <CardDescription>
                Upload your practice logo (recommended size: 512x512px, max 2MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoUrl && (
                <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                  <img 
                    src={logoUrl} 
                    alt="Practice Logo" 
                    className="h-32 w-32 object-contain rounded-lg"
                  />
                </div>
              )}
              
              <div className="flex items-center gap-3">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={loading}
                  className="hidden"
                  id="logo-upload"
                />
                <Label htmlFor="logo-upload" className="cursor-pointer">
                  <Button asChild disabled={loading} variant="outline">
                    <span>
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : (
                        <>
                          <Upload className="mr-2 h-4 w-4" />
                          Upload Logo
                        </>
                      )}
                    </span>
                  </Button>
                </Label>
                {logoUrl && (
                  <Button 
                    variant="ghost" 
                    onClick={() => setLogoUrl("")}
                    disabled={loading}
                  >
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Brand Colors
              </CardTitle>
              <CardDescription>
                Choose colors that represent your practice's brand
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="primary-color">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="primary-color"
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#0EA5E9"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for buttons, links, and primary actions
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondary-color">Secondary Color</Label>
                  <div className="flex items-center gap-3">
                    <Input
                      id="secondary-color"
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-12 w-20 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#10B981"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Used for secondary actions and accents
                  </p>
                </div>
              </div>

              <div className="p-6 rounded-lg border bg-card space-y-3">
                <h4 className="font-medium">Preview</h4>
                <div className="flex flex-wrap gap-3">
                  <Button style={{ backgroundColor: primaryColor, color: 'white' }}>
                    Primary Button
                  </Button>
                  <Button 
                    variant="outline" 
                    style={{ 
                      borderColor: secondaryColor, 
                      color: secondaryColor 
                    }}
                  >
                    Secondary Button
                  </Button>
                  <div 
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${primaryColor}20`, 
                      color: primaryColor 
                    }}
                  >
                    Badge
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Settings</CardTitle>
              <CardDescription>
                Control where your branding appears
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-logo-chat">Show logo in AI chat</Label>
                  <p className="text-sm text-muted-foreground">Display your logo in the chat interface</p>
                </div>
                <Switch
                  id="show-logo-chat"
                  checked={showLogoInChat}
                  onCheckedChange={setShowLogoInChat}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="show-branding-emails">Show branding in emails</Label>
                  <p className="text-sm text-muted-foreground">Include your logo and colors in email notifications</p>
                </div>
                <Switch
                  id="show-branding-emails"
                  checked={showBrandingInEmails}
                  onCheckedChange={setShowBrandingInEmails}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5" />
                AI Assistant Personality
              </CardTitle>
              <CardDescription>
                Customize how your AI assistant communicates with patients
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="welcome-message">Welcome Message</Label>
                <Input
                  id="welcome-message"
                  value={welcomeMessage}
                  onChange={(e) => setWelcomeMessage(e.target.value)}
                  placeholder="Hi! How can I help you today?"
                />
                <p className="text-xs text-muted-foreground">
                  First message patients see when opening the chat
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-tone">Communication Tone</Label>
                <Select value={aiTone} onValueChange={setAiTone}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="casual">Casual</SelectItem>
                    <SelectItem value="empathetic">Empathetic</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ai-response-length">Response Length</Label>
                <Select value={aiResponseLength} onValueChange={setAiResponseLength}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="brief">Brief - Short and concise</SelectItem>
                    <SelectItem value="normal">Normal - Balanced detail</SelectItem>
                    <SelectItem value="detailed">Detailed - Comprehensive explanations</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom AI Instructions</CardTitle>
              <CardDescription>
                Detailed instructions for how the AI should behave and respond
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={aiInstructions}
                onChange={(e) => setAiInstructions(e.target.value)}
                placeholder="Enter specific instructions for your AI assistant..."
                className="min-h-[200px] font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground mt-2">
                These instructions guide the AI's behavior, responses, and decision-making
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Specialty Templates
              </CardTitle>
              <CardDescription>
                Quick-start templates optimized for different medical specialties
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {specialtyList.map(specialty => {
                  const template = SPECIALTY_TEMPLATES[specialty.value];
                  return (
                    <Card key={specialty.value} className="cursor-pointer hover:border-primary transition-colors">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          {specialty.icon} {specialty.label}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex gap-2">
                          <div 
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: template.primaryColor }}
                          />
                          <div 
                            className="w-8 h-8 rounded"
                            style={{ backgroundColor: template.secondaryColor }}
                          />
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {template.aiInstructions.substring(0, 100)}...
                        </p>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => applyTemplate(specialty.value)}
                        >
                          Apply Template
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-3 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-4 border-t">
        <Button variant="outline" onClick={loadBrandingSettings}>
          Reset
        </Button>
        <Button onClick={handleSaveBranding} disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
}
