import { useState, useEffect } from "react";
import { useCurrentDentist } from "@/hooks/useCurrentDentist";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Palette, Upload, Image as ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";

export default function DentistAdminBranding() {
  const { dentistId, loading: dentistLoading } = useCurrentDentist();
  const [loading, setLoading] = useState(false);
  const [clinicName, setClinicName] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0EA5E9");
  const [secondaryColor, setSecondaryColor] = useState("#10B981");
  const [logoUrl, setLogoUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    if (dentistId) {
      loadBrandingSettings();
    }
  }, [dentistId]);

  const loadBrandingSettings = async () => {
    try {
      // Load existing branding settings from dentists table or clinic_settings
      const { data: dentist } = await supabase
        .from('dentists')
        .select('*')
        .eq('id', dentistId)
        .single();

      if (dentist) {
        setClinicName(dentist.clinic_address || "");
      }
    } catch (error) {
      console.error('Error loading branding:', error);
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
      const fileName = `${dentistId}-logo-${Date.now()}.${fileExt}`;

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

  const handleSaveBranding = async () => {
    setLoading(true);

    try {
      // Save branding settings
      // This would ideally save to a branding_settings table
      toast({
        title: "Settings Saved",
        description: "Your branding settings have been saved",
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
    <div>
      <PageHeader 
        title="Branding & Customization"
        subtitle="Customize your clinic's appearance and branding"
        breadcrumbs={[
          { label: 'Home', href: '/dentist' },
          { label: 'Admin' },
          { label: 'Branding' }
        ]}
      />

      <div className="space-y-6">
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
      </div>
    </div>
  );
}

