import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Palette, Upload, Save } from 'lucide-react';

interface OrganizationBrandingManagerProps {
  organizationId: string;
}

export const OrganizationBrandingManager: React.FC<OrganizationBrandingManagerProps> = ({
  organizationId,
}) => {
  const queryClient = useQueryClient();
  const [primaryColor, setPrimaryColor] = useState('#2D5D7B');
  const [secondaryColor, setSecondaryColor] = useState('#8B9BA5');
  const [logoUrl, setLogoUrl] = useState('');
  const [tagline, setTagline] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['organization_settings', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      
      if (error) throw error;
      
      // Initialize state with existing values
      if (data) {
        setPrimaryColor(data.primary_color || '#2D5D7B');
        setSecondaryColor(data.secondary_color || '#8B9BA5');
        setLogoUrl(data.logo_url || '');
        setTagline(data.tagline || '');
      }
      
      return data;
    },
  });

  const updateBranding = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organizationId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization_settings', organizationId] });
      toast.success('Branding updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update branding: ' + error.message);
    },
  });

  const handleSave = () => {
    updateBranding.mutate({
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      logo_url: logoUrl,
      tagline: tagline,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${organizationId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('dental-photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('dental-photos')
        .getPublicUrl(filePath);

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error: any) {
      toast.error('Failed to upload logo: ' + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            <CardTitle>Brand Colors</CardTitle>
          </div>
          <CardDescription>Customize your organization's color scheme</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="primary-color">Primary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  placeholder="#2D5D7B"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="secondary-color">Secondary Color</Label>
              <div className="flex gap-2">
                <Input
                  id="secondary-color"
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  placeholder="#8B9BA5"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 border rounded-lg">
            <p className="text-sm font-medium mb-2">Preview</p>
            <div className="flex gap-2">
              <div
                className="w-20 h-20 rounded-lg shadow-sm border"
                style={{ backgroundColor: primaryColor }}
              />
              <div
                className="w-20 h-20 rounded-lg shadow-sm border"
                style={{ backgroundColor: secondaryColor }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            <CardTitle>Logo & Branding</CardTitle>
          </div>
          <CardDescription>Upload your organization's logo and set a tagline</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo</Label>
            <Input
              id="logo"
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
            />
            {logoUrl && (
              <div className="mt-2">
                <img src={logoUrl} alt="Logo preview" className="h-20 object-contain" />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="tagline">Tagline</Label>
            <Textarea
              id="tagline"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Your organization's tagline or motto"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateBranding.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateBranding.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};
