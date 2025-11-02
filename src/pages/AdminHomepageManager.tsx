import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, Save, Eye, Building2 } from "lucide-react";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AdminHomepageManager() {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [settings, setSettings] = useState({
    hero_title: "Welcome to Our Practice",
    hero_subtitle: "Quality care for your whole family",
    hero_image_url: "",
    show_services: true,
    show_about: true,
    about_title: "About Us",
    about_content: "We are dedicated to providing exceptional care...",
    cta_text: "Book Appointment",
    is_active: true,
  });

  useEffect(() => {
    loadBusinesses();
  }, []);

  useEffect(() => {
    if (selectedBusiness) {
      loadHomepageSettings(selectedBusiness);
    }
  }, [selectedBusiness]);

  const loadBusinesses = async () => {
    try {
      const { data, error } = await supabase
        .from("businesses")
        .select("id, name, slug, tagline")
        .order("name");

      if (error) throw error;
      setBusinesses(data || []);
    } catch (error) {
      console.error("Error loading businesses:", error);
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadHomepageSettings = async (businessId: string) => {
    try {
      const { data, error } = await supabase
        .from("homepage_settings")
        .select("*")
        .eq("business_id", businessId)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setSettings({
          hero_title: data.hero_title || settings.hero_title,
          hero_subtitle: data.hero_subtitle || settings.hero_subtitle,
          hero_image_url: data.hero_image_url || "",
          show_services: data.show_services ?? true,
          show_about: data.show_about ?? true,
          about_title: data.about_title || settings.about_title,
          about_content: data.about_content || settings.about_content,
          cta_text: data.cta_text || settings.cta_text,
          is_active: data.is_active ?? true,
        });
      } else {
        // Reset to defaults for new business
        setSettings({
          hero_title: "Welcome to Our Practice",
          hero_subtitle: "Quality care for your whole family",
          hero_image_url: "",
          show_services: true,
          show_about: true,
          about_title: "About Us",
          about_content: "We are dedicated to providing exceptional care...",
          cta_text: "Book Appointment",
          is_active: true,
        });
      }
    } catch (error) {
      console.error("Error loading homepage settings:", error);
    }
  };

  const handleSave = async () => {
    if (!selectedBusiness) {
      toast({
        title: "Error",
        description: "Please select a business first",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("homepage_settings")
        .upsert({
          business_id: selectedBusiness,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Homepage settings saved successfully",
      });
    } catch (error) {
      console.error("Error saving homepage settings:", error);
      toast({
        title: "Error",
        description: "Failed to save homepage settings",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    const business = businesses.find(b => b.id === selectedBusiness);
    if (business?.slug) {
      window.open(`/${business.slug}`, "_blank");
    }
  };

  const filteredBusinesses = businesses.filter(b =>
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <ModernLoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Homepage Manager</h1>
            <p className="text-muted-foreground">
              Customize business homepages for support requests
            </p>
          </div>
        </div>

        {/* Business Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Business</CardTitle>
            <CardDescription>
              Choose the business you want to customize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Business</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search by name or slug..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Business</Label>
              <Select value={selectedBusiness} onValueChange={setSelectedBusiness}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a business..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredBusinesses.map((business) => (
                    <SelectItem key={business.id} value={business.id}>
                      {business.name} ({business.slug})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBusiness && (
              <div className="flex gap-2">
                <Button onClick={handlePreview} variant="outline" className="flex-1">
                  <Eye className="mr-2 h-4 w-4" />
                  Preview Homepage
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1">
                  <Save className="mr-2 h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Homepage Settings */}
        {selectedBusiness && (
          <>
            {/* Active Status */}
            <Card>
              <CardHeader>
                <CardTitle>Homepage Status</CardTitle>
                <CardDescription>
                  Enable or disable the custom homepage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="is_active" className="text-base">Custom Homepage Active</Label>
                    <p className="text-sm text-muted-foreground">
                      When disabled, the business will show the default auth page
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={settings.is_active}
                    onCheckedChange={(checked) => setSettings({ ...settings, is_active: checked })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Hero Section */}
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>The main banner visitors see first</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hero_title">Hero Title</Label>
                  <Input
                    id="hero_title"
                    value={settings.hero_title}
                    onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_subtitle">Hero Subtitle</Label>
                  <Input
                    id="hero_subtitle"
                    value={settings.hero_subtitle}
                    onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hero_image_url">Background Image URL (optional)</Label>
                  <Input
                    id="hero_image_url"
                    value={settings.hero_image_url}
                    onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>About Section</CardTitle>
                    <CardDescription>Tell visitors about the practice</CardDescription>
                  </div>
                  <Switch
                    checked={settings.show_about}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_about: checked })}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="about_title">Section Title</Label>
                  <Input
                    id="about_title"
                    value={settings.about_title}
                    onChange={(e) => setSettings({ ...settings, about_title: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="about_content">Content</Label>
                  <Textarea
                    id="about_content"
                    value={settings.about_content}
                    onChange={(e) => setSettings({ ...settings, about_content: e.target.value })}
                    rows={6}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Services Section */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Services Section</CardTitle>
                    <CardDescription>Display their services automatically</CardDescription>
                  </div>
                  <Switch
                    checked={settings.show_services}
                    onCheckedChange={(checked) => setSettings({ ...settings, show_services: checked })}
                  />
                </div>
              </CardHeader>
            </Card>

            {/* CTA Button */}
            <Card>
              <CardHeader>
                <CardTitle>Call-to-Action Button</CardTitle>
                <CardDescription>The main action button text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cta_text">Button Text</Label>
                  <Input
                    id="cta_text"
                    value={settings.cta_text}
                    onChange={(e) => setSettings({ ...settings, cta_text: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex gap-2">
              <Button onClick={handlePreview} variant="outline" className="flex-1" size="lg">
                <Eye className="mr-2 h-5 w-5" />
                Preview Homepage
              </Button>
              <Button onClick={handleSave} disabled={saving} className="flex-1" size="lg">
                <Save className="mr-2 h-5 w-5" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
