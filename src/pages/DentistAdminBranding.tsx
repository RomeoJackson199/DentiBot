import { useState, useEffect, useRef } from "react";
import { useBusinessContext } from "@/hooks/useBusinessContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Palette, Upload, Image as ImageIcon, Briefcase, Package, Copy, Check, QrCode, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { BusinessTemplateSelector } from "@/components/BusinessTemplateSelector";
import { TemplateType, getTemplateConfig, TemplateFeatures, TemplateTerminology } from "@/lib/businessTemplates";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AIBehaviorSettings } from "@/components/admin/AIBehaviorSettings";
import { AITestChatDialog } from "@/components/admin/AITestChatDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ServiceManager } from "@/components/services/ServiceManager";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { QRCodeCanvas } from "qrcode.react";

export default function DentistAdminBranding() {
  const { businessId, loading: businessLoading } = useBusinessContext();
  const [loading, setLoading] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugError, setSlugError] = useState("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQrDialog, setShowQrDialog] = useState(false);
  const [tagline, setTagline] = useState("");
  const [address, setAddress] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0EA5E9");
  const [secondaryColor, setSecondaryColor] = useState("#10B981");
  const [logoUrl, setLogoUrl] = useState("");
  const [templateType, setTemplateType] = useState<TemplateType>("dentist");
  const [customFeatures, setCustomFeatures] = useState<TemplateFeatures | undefined>();
  const [customTerminology, setCustomTerminology] = useState<TemplateTerminology | undefined>();
  const [showTemplateWarning, setShowTemplateWarning] = useState(false);
  const [pendingTemplate, setPendingTemplate] = useState<{
    type: TemplateType;
    features?: TemplateFeatures;
    terminology?: TemplateTerminology;
  } | null>(null);
  const [aiSystemBehavior, setAiSystemBehavior] = useState("");
  const [aiGreeting, setAiGreeting] = useState("");
  const [aiPersonalityTraits, setAiPersonalityTraits] = useState<string[]>([]);
  const [showTestChat, setShowTestChat] = useState(false);
  const { toast } = useToast();
  const qrCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const baseOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const businessLink = slug
    ? baseOrigin
      ? `${baseOrigin}/${slug}`
      : `/${slug}`
    : baseOrigin;

  useEffect(() => {
    if (businessId) {
      loadBrandingSettings();
    }
  }, [businessId]);

  const loadBrandingSettings = async () => {
    try {
      const { data: business, error } = await supabase
        .from('businesses')
        .select('name, slug, tagline, logo_url, primary_color, secondary_color, template_type, ai_system_behavior, ai_greeting, ai_personality_traits')
        .eq('id', businessId)
        .single();

      if (error) throw error;

      if (business) {
        setClinicName(business.name || "");
        setSlug(business.slug || "");
        setTagline(business.tagline || "");
        setAddress(""); // Address is not on businesses table
        setPrimaryColor(business.primary_color || "#2D5D7B");
        setSecondaryColor(business.secondary_color || "#8B5CF6");
        setLogoUrl(business.logo_url || "");
        setTemplateType((business.template_type as TemplateType) || "dentist");
        
        // Load AI behavior settings or use template defaults
        const template = getTemplateConfig((business.template_type as TemplateType) || "dentist");
        setAiSystemBehavior(business.ai_system_behavior || template.aiBehaviorDefaults.systemBehavior);
        setAiGreeting(business.ai_greeting || template.aiBehaviorDefaults.greeting);
        setAiPersonalityTraits(
          (business.ai_personality_traits as string[]) || template.aiBehaviorDefaults.personalityTraits
        );
      }
    } catch (error: any) {
      console.error('Error loading branding:', error);
      toast({
        title: "Error",
        description: `Failed to load branding settings${error?.code ? ` (${error.code})` : ''}${error?.hint ? ` - ${error.hint}` : ''}`,
        variant: "destructive",
      });
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
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
      const fileName = `${businessId}-logo-${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
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

  const handleTemplateSelect = (
    newTemplateType: string,
    features?: TemplateFeatures,
    terminology?: TemplateTerminology
  ) => {
    const newType = newTemplateType as TemplateType;
    if (newType !== templateType) {
      setPendingTemplate({
        type: newType,
        features,
        terminology,
      });
      setShowTemplateWarning(true);
    }
  };

  const confirmTemplateChange = () => {
    if (pendingTemplate) {
      setTemplateType(pendingTemplate.type);
      if (pendingTemplate.features) setCustomFeatures(pendingTemplate.features);
      if (pendingTemplate.terminology) setCustomTerminology(pendingTemplate.terminology);
      setPendingTemplate(null);
      setShowTemplateWarning(false);
      toast({
        title: "Template Changed",
        description: "Remember to save your changes",
      });
    }
  };

  const validateSlug = (value: string): boolean => {
    // Check for invalid characters
    if (value.includes('/')) {
      setSlugError("Slug cannot contain forward slashes (/)");
      return false;
    }
    if (value.includes(' ')) {
      setSlugError("Slug cannot contain spaces");
      return false;
    }
    // Count dots
    const dotCount = (value.match(/\./g) || []).length;
    if (dotCount > 1) {
      setSlugError("Slug can only contain one dot (.)");
      return false;
    }
    setSlugError("");
    return true;
  };

  const handleSlugChange = (value: string) => {
    setSlug(value);
    validateSlug(value);
  };

  const copyBusinessLink = async () => {
    if (!businessLink) return;
    try {
      await navigator.clipboard.writeText(businessLink);
      setCopiedLink(true);
      toast({
        title: "Link copied!",
        description: "Business link copied to clipboard",
      });
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleDownloadQr = () => {
    if (!businessLink) return;

    try {
      const canvas = qrCanvasRef.current;
      if (!canvas) {
        throw new Error("QR code is not ready yet");
      }

      const dataUrl = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${slug || "business"}-qr.png`;
      link.click();

      toast({
        title: "QR Code Downloaded",
        description: "The QR code for your business link has been downloaded",
      });
    } catch (error) {
      console.error("Error downloading QR code", error);
      toast({
        title: "Download Failed",
        description: "We couldn't download the QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSaveBranding = async () => {
    if (!businessId) return;
    
    // Validate slug before saving
    if (!validateSlug(slug)) {
      toast({
        title: "Invalid Slug",
        description: slugError,
        variant: "destructive",
      });
      return;
    }
    
    setLoading(true);

    try {
      const updateData: any = {
        name: clinicName,
        slug: slug,
        tagline: tagline,
        logo_url: logoUrl,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        template_type: templateType,
        ai_system_behavior: aiSystemBehavior,
        ai_greeting: aiGreeting,
        ai_personality_traits: aiPersonalityTraits,
      };

      // Store custom configuration if template is custom
      if (templateType === 'custom' && (customFeatures || customTerminology)) {
        updateData.custom_features = customFeatures;
        updateData.custom_terminology = customTerminology;
      }

      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: "Settings Saved",
        description: "Your branding settings have been saved successfully",
      });

      // Reload page to apply new template
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving branding:', error);
      toast({
        title: "Error",
        description: `Failed to save branding settings${error?.code ? ` (${error.code})` : ''}${error?.hint ? ` - ${error.hint}` : ''}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (businessLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Branding & Settings"
        subtitle="Customize your business appearance, services, and AI behavior"
        breadcrumbs={[
          { label: 'Home', href: '/dentist' },
          { label: 'Admin' },
          { label: 'Branding & Settings' }
        ]}
      />

      <Tabs defaultValue="branding" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="services">
            <Package className="h-4 w-4 mr-2" />
            Services
          </TabsTrigger>
          <TabsTrigger value="ai">AI Behavior</TabsTrigger>
        </TabsList>

        <TabsContent value="branding" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Briefcase className="h-5 w-5" />
                Business Template
              </CardTitle>
              <CardDescription>
                Choose the template that best fits your business type. This controls which features are available and the terminology used throughout the platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BusinessTemplateSelector 
                selectedTemplate={templateType}
                onSelect={handleTemplateSelect}
              />
              <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium mb-2">Current Template Features:</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.entries(getTemplateConfig(templateType).features).map(([feature, enabled]) => (
                    <div key={feature} className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
                      <span className="capitalize text-muted-foreground">
                        {feature.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Clinic Logo
              </CardTitle>
              <CardDescription>
                Upload your clinic logo (recommended size: 512x512px, max 2MB)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {logoUrl && (
                <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
                  <img 
                    src={logoUrl} 
                    alt="Clinic Logo" 
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
                Choose colors that represent your clinic's brand
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
              <CardTitle>Clinic Information</CardTitle>
              <CardDescription>
                Basic information about your clinic
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="clinic-name">Clinic Name</Label>
                <Input
                  id="clinic-name"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  placeholder="Enter your clinic name"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug">Business URL</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {baseOrigin ? `${baseOrigin}/` : "/"}
                  </span>
                  <Input
                    id="slug"
                    value={slug}
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="your-business-name"
                    className={slugError ? "border-destructive" : ""}
                  />
                </div>
                {slugError && (
                  <p className="text-xs text-destructive">{slugError}</p>
                )}
                {!slugError && slug && (
                  <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Your business link:</p>
                        <a
                          href={businessLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline font-mono"
                        >
                          {businessLink}
                        </a>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => setShowQrDialog(true)}
                        >
                          <QrCode className="h-4 w-4" />
                          QR Code
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={copyBusinessLink}
                          className="h-8 w-8 p-0"
                        >
                          {copiedLink ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      ⚠️ Cannot contain spaces or slashes (/) • Maximum one dot (.)
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g., Modern dental care excellence"
                />
                <p className="text-xs text-muted-foreground">
                  A short phrase that describes your clinic (optional)
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Clinic Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main St, City, State, ZIP"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
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
        </TabsContent>

        <TabsContent value="services">
          <ServiceManager />
        </TabsContent>

        <TabsContent value="ai" className="space-y-6">
          <AIBehaviorSettings
            systemBehavior={aiSystemBehavior}
            greeting={aiGreeting}
            personalityTraits={aiPersonalityTraits}
            onSystemBehaviorChange={setAiSystemBehavior}
            onGreetingChange={setAiGreeting}
            onPersonalityTraitsChange={setAiPersonalityTraits}
            onTestChat={() => setShowTestChat(true)}
          />

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={loadBrandingSettings}>
              Reset to Template Defaults
            </Button>
            <Button onClick={handleSaveBranding} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save AI Settings"
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Business QR Code</DialogTitle>
            <DialogDescription>
              Share this QR code so patients can easily access your business page.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4">
            <div className="p-4 bg-white rounded-lg shadow-sm">
              <QRCodeCanvas
                ref={qrCanvasRef}
                value={businessLink || baseOrigin || ""}
                size={200}
                level="H"
                includeMargin
                bgColor="#FFFFFF"
                style={{ width: "200px", height: "200px" }}
              />
            </div>
            <Button onClick={handleDownloadQr} className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Download QR Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AITestChatDialog
        open={showTestChat}
        onOpenChange={setShowTestChat}
        greeting={aiGreeting}
        systemBehavior={aiSystemBehavior}
        personalityTraits={aiPersonalityTraits}
        businessName={clinicName}
      />

      <AlertDialog open={showTemplateWarning} onOpenChange={setShowTemplateWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Change Business Template?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Changing your business template will modify which features are available in your account.
              </p>
              <p className="font-medium">
                Some features may be hidden, but your existing data will not be deleted.
              </p>
              <p className="text-sm text-muted-foreground">
                For example, if you switch to a template without prescriptions, the prescription feature will be hidden but any existing prescriptions will remain in the database.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingTemplate(null);
              setShowTemplateWarning(false);
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmTemplateChange}>
              Change Template
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

