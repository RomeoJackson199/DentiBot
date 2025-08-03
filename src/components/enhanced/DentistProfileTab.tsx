import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  User, 
  Edit, 
  MapPin,
  Phone,
  Mail,
  GraduationCap,
  Award,
  Clock
} from "lucide-react";
import { DentistProfile } from "@/types/dental";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DentistProfileTabProps {
  dentistProfile: DentistProfile | null;
  onRefresh: () => void;
}

export function DentistProfileTab({
  dentistProfile,
  onRefresh
}: DentistProfileTabProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    specialty: '',
    clinic_address: '',
    languages: [''],
    bio: '',
    experience_years: '',
    education: '',
    certifications: ['']
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const profileData = {
        ...formData,
        experience_years: formData.experience_years ? parseInt(formData.experience_years) : null,
        languages: formData.languages.filter(lang => lang.trim() !== ''),
        certifications: formData.certifications.filter(cert => cert.trim() !== '')
      };

      const { error } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', dentistProfile?.id);

      if (error) throw error;

      const { error: dentistError } = await supabase
        .from('dentists')
        .update({
          specialty: profileData.specialty,
          clinic_address: profileData.clinic_address,
          experience_years: profileData.experience_years,
          education: profileData.education,
          certifications: profileData.certifications
        })
        .eq('profile_id', dentistProfile?.id);

      if (dentistError) throw dentistError;

      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });

      setShowEditDialog(false);
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    if (!dentistProfile) return;
    
    setFormData({
      first_name: dentistProfile.first_name || '',
      last_name: dentistProfile.last_name || '',
      email: dentistProfile.email || '',
      phone: dentistProfile.phone || '',
      specialty: dentistProfile.specialty || '',
      clinic_address: dentistProfile.clinic_address || '',
      languages: dentistProfile.languages?.length ? dentistProfile.languages : [''],
      bio: dentistProfile.bio || '',
      experience_years: dentistProfile.experience_years?.toString() || '',
      education: dentistProfile.education || '',
      certifications: dentistProfile.certifications?.length ? dentistProfile.certifications : ['']
    });
    setShowEditDialog(true);
  };

  const addLanguage = () => {
    setFormData({
      ...formData,
      languages: [...formData.languages, '']
    });
  };

  const removeLanguage = (index: number) => {
    setFormData({
      ...formData,
      languages: formData.languages.filter((_, i) => i !== index)
    });
  };

  const updateLanguage = (index: number, value: string) => {
    const newLanguages = [...formData.languages];
    newLanguages[index] = value;
    setFormData({
      ...formData,
      languages: newLanguages
    });
  };

  const addCertification = () => {
    setFormData({
      ...formData,
      certifications: [...formData.certifications, '']
    });
  };

  const removeCertification = (index: number) => {
    setFormData({
      ...formData,
      certifications: formData.certifications.filter((_, i) => i !== index)
    });
  };

  const updateCertification = (index: number, value: string) => {
    const newCertifications = [...formData.certifications];
    newCertifications[index] = value;
    setFormData({
      ...formData,
      certifications: newCertifications
    });
  };

  if (!dentistProfile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
          <p className="text-muted-foreground">Unable to load dentist profile.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Dentist Profile</h3>
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogTrigger asChild>
            <Button onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Profile</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="first_name">First Name</Label>
                  <Input
                    id="first_name"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="last_name">Last Name</Label>
                  <Input
                    id="last_name"
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="specialty">Specialty</Label>
                <Input
                  id="specialty"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="clinic_address">Clinic Address</Label>
                <Textarea
                  id="clinic_address"
                  value={formData.clinic_address}
                  onChange={(e) => setFormData({ ...formData, clinic_address: e.target.value })}
                />
              </div>
              <div>
                <Label>Languages</Label>
                {formData.languages.map((language, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      value={language}
                      onChange={(e) => updateLanguage(index, e.target.value)}
                      placeholder="Enter language"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeLanguage(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addLanguage} className="mt-2">
                  Add Language
                </Button>
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="experience_years">Years of Experience</Label>
                <Input
                  id="experience_years"
                  type="number"
                  value={formData.experience_years}
                  onChange={(e) => setFormData({ ...formData, experience_years: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="education">Education</Label>
                <Textarea
                  id="education"
                  value={formData.education}
                  onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                />
              </div>
              <div>
                <Label>Certifications</Label>
                {formData.certifications.map((certification, index) => (
                  <div key={index} className="flex items-center space-x-2 mt-2">
                    <Input
                      value={certification}
                      onChange={(e) => updateCertification(index, e.target.value)}
                      placeholder="Enter certification"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeCertification(index)}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" onClick={addCertification} className="mt-2">
                  Add Certification
                </Button>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Update Profile
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {dentistProfile.first_name} {dentistProfile.last_name}
              </h2>
              {dentistProfile.specialty && (
                <p className="text-muted-foreground">{dentistProfile.specialty}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm">{dentistProfile.email}</span>
              </div>
              {dentistProfile.phone && (
                <div className="flex items-center space-x-3">
                  <Phone className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{dentistProfile.phone}</span>
                </div>
              )}
              {dentistProfile.clinic_address && (
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{dentistProfile.clinic_address}</span>
                </div>
              )}
              {dentistProfile.experience_years && (
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <span className="text-sm">{dentistProfile.experience_years} years of experience</span>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {dentistProfile.languages && dentistProfile.languages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Languages</h4>
                  <div className="flex flex-wrap gap-2">
                    {dentistProfile.languages.map((language, index) => (
                      <Badge key={index} variant="outline">
                        {language}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {dentistProfile.certifications && dentistProfile.certifications.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Certifications</h4>
                  <div className="space-y-1">
                    {dentistProfile.certifications.map((certification, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Award className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm">{certification}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {dentistProfile.bio && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-2">Bio</h4>
              <p className="text-sm text-muted-foreground">{dentistProfile.bio}</p>
            </div>
          )}

          {dentistProfile.education && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-medium mb-2">Education</h4>
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{dentistProfile.education}</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}