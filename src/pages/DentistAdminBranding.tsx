import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Palette, Upload, Image as ImageIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export default function DentistAdminBranding() {
  const [loading, setLoading] = useState(true);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [businessName, setBusinessName] = useState("");
  const [businessSlug, setBusinessSlug] = useState("");
  const [tagline, setTagline] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#0F3D91");
  const [secondaryColor, setSecondaryColor] = useState("#66D2D6");
  const [logoUrl, setLogoUrl] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    loadBusinessData();
  }, []);

  const loadBusinessData = async () => {
    try {
      setLoading(true);
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        });
        return;
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        toast({
          title: "Error",
          description: "Profile not found",
          variant: "destructive",
        });
        return;
      }

      // Get user's business
      const { data: business, error } = await supabase
        .from('businesses' as any)
        .select('*')
        .eq('owner_profile_id', profile.id)
        .maybeSingle();

      if (error) throw error;

      if (business) {
        setBusinessId(business.id);
        setBusinessName(business.name || "");
        setBusinessSlug(business.slug || "");
        setTagline(business.tagline || "");
        setPrimaryColor(business.primary_color || "#0F3D91");
        setSecondaryColor(business.secondary_color || "#66D2D6");
        setLogoUrl(business.logo_url || "");
      }
    } catch (error: any) {
      console.error('Error loading business:', error);
      toast({
        title: "Error",
        description: "Failed to load business settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !businessId) return;

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
        description: "Your business logo has been uploaded successfully",
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
    if (!businessId) return;
    
    setLoading(true);

    try {
      const { error } = await supabase
        .from('businesses' as any)
        .update({
          name: businessName,
          tagline: tagline || null,
          logo_url: logoUrl || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
        })
        .eq('id', businessId);

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

  if (loading && !businessId) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Branding</h1>
        <p className="text-muted-foreground mt-2">
          Customize your business appearance and branding
        </p>
      </div>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Update your business name and details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name</Label>
            <Input
              id="businessName"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="Your Business Name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="businessSlug">Business URL</Label>
            <div className="flex gap-2 items-center">
              <span className="text-sm text-muted-foreground">yourapp.com/</span>
              <Input
                id="businessSlug"
                value={businessSlug}
                disabled
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              URL slug cannot be changed after creation
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Textarea
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Your business tagline (e.g., 'Your smile, our priority')"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Business Logo
          </CardTitle>
          <CardDescription>
            Upload your business logo (max 2MB)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {logoUrl && (
            <div className="flex justify-center p-4 bg-muted rounded-lg">
              <img 
                src={logoUrl} 
                alt="Business Logo" 
                className="max-h-32 object-contain"
              />
            </div>
          )}
          
          <div className="flex items-center gap-4">
            <Input
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={loading}
              className="flex-1"
            />
            {loading && (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Color Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Choose colors that represent your business
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="primaryColor"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-20 p-1 cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    placeholder="#0F3D91"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for buttons, links, and primary elements
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="secondaryColor">Secondary Color</Label>
              <div className="flex gap-3 items-center">
                <Input
                  id="secondaryColor"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-20 p-1 cursor-pointer"
                />
                <div className="flex-1">
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    placeholder="#66D2D6"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Used for accents and secondary elements
              </p>
            </div>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-6 space-y-4">
            <p className="text-sm font-medium">Preview</p>
            <div className="flex gap-3">
              <Button style={{ backgroundColor: primaryColor }} className="text-white">
                Primary Button
              </Button>
              <Button 
                variant="outline" 
                style={{ borderColor: secondaryColor, color: secondaryColor }}
              >
                Secondary Button
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSaveBranding}
          disabled={loading}
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Branding Settings'
          )}
        </Button>
      </div>
    </div>
  );
}
