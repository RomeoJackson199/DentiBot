import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Building2, Edit, Save, X, Eye, EyeOff, Palette } from "lucide-react";
import { EditableSection } from "./EditableSection";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface HomepageSettings {
  hero_title: string;
  hero_subtitle: string;
  hero_image_url?: string;
  show_services: boolean;
  show_about: boolean;
  about_title: string;
  about_content: string;
  cta_text: string;
  cta_link: string;
  theme_config?: {
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  };
}

interface Business {
  id: string;
  name: string;
  tagline?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
}

interface CustomizableHomepageProps {
  business: Business;
  settings: HomepageSettings;
  services?: any[];
  onCTAClick: () => void;
  isOwner?: boolean;
}

export function CustomizableHomepage({ business, settings: initialSettings, services = [], onCTAClick, isOwner = false }: CustomizableHomepageProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [settings, setSettings] = useState(initialSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  useEffect(() => {
    setHasChanges(JSON.stringify(settings) !== JSON.stringify(initialSettings));
  }, [settings, initialSettings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("homepage_settings")
        .upsert({
          business_id: business.id,
          ...settings,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      toast({
        title: "Saved!",
        description: "Your homepage has been updated.",
      });
      setHasChanges(false);
      setIsEditMode(false);
    } catch (error) {
      console.error("Error saving homepage:", error);
      toast({
        title: "Error",
        description: "Failed to save changes.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSettings(initialSettings);
    setIsEditMode(false);
    setHasChanges(false);
  };

  const updateSetting = <K extends keyof HomepageSettings>(key: K, value: HomepageSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const themeColors = settings.theme_config || {};
  const primaryColor = themeColors.primary_color || business.primary_color || "#0ea5e9";

  return (
    <div className="min-h-screen bg-background" style={{
      ['--primary-color' as any]: primaryColor
    }}>
      {/* Edit Mode Toolbar */}
      {isOwner && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          {!isEditMode ? (
            <Button onClick={() => setIsEditMode(true)} size="lg" className="shadow-lg">
              <Edit className="mr-2 h-4 w-4" />
              Edit Homepage
            </Button>
          ) : (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="lg" className="shadow-lg">
                    <Palette className="mr-2 h-4 w-4" />
                    Colors
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <div className="space-y-4">
                    <h4 className="font-medium">Theme Colors</h4>
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <Input
                          id="primary_color"
                          type="color"
                          value={themeColors.primary_color || primaryColor}
                          onChange={(e) =>
                            updateSetting("theme_config", {
                              ...themeColors,
                              primary_color: e.target.value,
                            })
                          }
                          className="w-20 h-10"
                        />
                        <Input
                          value={themeColors.primary_color || primaryColor}
                          onChange={(e) =>
                            updateSetting("theme_config", {
                              ...themeColors,
                              primary_color: e.target.value,
                            })
                          }
                          placeholder="#0ea5e9"
                        />
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>

              <Button
                onClick={handleSave}
                disabled={!hasChanges || isSaving}
                size="lg"
                className="shadow-lg"
              >
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                size="lg"
                className="shadow-lg"
              >
                <X className="mr-2 h-4 w-4" />
                Cancel
              </Button>
            </>
          )}
        </div>
      )}

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logo_url ? (
              <img src={business.logo_url} alt={business.name} className="h-10 w-10 object-contain" />
            ) : (
              <Building2 className="h-8 w-8 text-primary" />
            )}
            <div>
              <h1 className="text-xl font-bold">{business.name}</h1>
              {business.tagline && <p className="text-sm text-muted-foreground">{business.tagline}</p>}
            </div>
          </div>
          <EditableSection
            value={settings.cta_text}
            onSave={(value) => updateSetting("cta_text", value)}
            isEditing={isEditMode}
            placeholder="Button text"
          >
            <Button onClick={onCTAClick} size="lg">
              {settings.cta_text}
            </Button>
          </EditableSection>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 px-4">
        {settings.hero_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center opacity-20"
            style={{ backgroundImage: `url(${settings.hero_image_url})` }}
          />
        )}
        <div className="container mx-auto max-w-4xl text-center relative z-10">
          <EditableSection
            value={settings.hero_title}
            onSave={(value) => updateSetting("hero_title", value)}
            isEditing={isEditMode}
            placeholder="Hero title"
            className="mb-6"
          >
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              {settings.hero_title}
            </h2>
          </EditableSection>

          <EditableSection
            value={settings.hero_subtitle}
            onSave={(value) => updateSetting("hero_subtitle", value)}
            isEditing={isEditMode}
            placeholder="Hero subtitle"
            className="mb-8"
          >
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              {settings.hero_subtitle}
            </p>
          </EditableSection>

          {isEditMode && (
            <div className="mb-8 max-w-md mx-auto">
              <Label htmlFor="hero_image">Background Image URL</Label>
              <Input
                id="hero_image"
                value={settings.hero_image_url || ""}
                onChange={(e) => updateSetting("hero_image_url", e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="mt-2"
              />
            </div>
          )}

          <Button onClick={onCTAClick} size="lg" className="text-lg px-8 py-6">
            {settings.cta_text}
          </Button>
        </div>
      </section>

      {/* Services Section */}
      {(settings.show_services || isEditMode) && services.length > 0 && (
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl">
            {isEditMode && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Switch
                  checked={settings.show_services}
                  onCheckedChange={(checked) => updateSetting("show_services", checked)}
                />
                <Label>Show Services Section</Label>
              </div>
            )}
            <h3 className="text-3xl font-bold text-center mb-12">Nos Prestations</h3>
            <div className="space-y-4">
              {services.map((service) => (
                <Card key={service.id} className="hover:shadow-md transition-shadow">
                  <div className="p-6 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold mb-1">{service.name}</h4>
                      {service.description && (
                        <p className="text-muted-foreground text-sm">{service.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        {service.duration_minutes && (
                          <p className="text-sm text-muted-foreground whitespace-nowrap">
                            {Math.floor(service.duration_minutes / 60) > 0 && `${Math.floor(service.duration_minutes / 60)}h`}
                            {service.duration_minutes % 60 > 0 && ` ${service.duration_minutes % 60}min`}
                          </p>
                        )}
                        {service.price_cents > 0 && (
                          <p className="text-base font-semibold whitespace-nowrap">
                            à partir de {(service.price_cents / 100).toFixed(0)} €
                          </p>
                        )}
                      </div>
                      <Button
                        onClick={onCTAClick}
                        className="whitespace-nowrap"
                        size="default"
                      >
                        Choisir
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      {(settings.show_about || isEditMode) && (
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            {isEditMode && (
              <div className="flex items-center justify-center gap-2 mb-4">
                <Switch
                  checked={settings.show_about}
                  onCheckedChange={(checked) => updateSetting("show_about", checked)}
                />
                <Label>Show About Section</Label>
              </div>
            )}

            <EditableSection
              value={settings.about_title}
              onSave={(value) => updateSetting("about_title", value)}
              isEditing={isEditMode}
              placeholder="Section title"
              className="mb-8"
            >
              <h3 className="text-3xl font-bold text-center mb-8">{settings.about_title}</h3>
            </EditableSection>

            <EditableSection
              value={settings.about_content}
              onSave={(value) => updateSetting("about_content", value)}
              isEditing={isEditMode}
              multiline
              placeholder="Tell your story..."
            >
              <div className="prose prose-lg mx-auto text-muted-foreground whitespace-pre-line">
                {settings.about_content}
              </div>
            </EditableSection>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to Get Started?</h3>
          <p className="text-xl text-muted-foreground mb-8">
            Book your appointment today and experience quality care
          </p>
          <Button onClick={onCTAClick} size="lg" className="text-lg px-8 py-6">
            {settings.cta_text}
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 bg-card">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} {business.name}. All rights reserved.</p>
          <p className="mt-2 text-sm">Powered by Caberu</p>
        </div>
      </footer>
    </div>
  );
}
