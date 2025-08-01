import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Calendar, User as UserIcon, ArrowLeft } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/loading-skeleton";

interface MedicalRecord {
  id: string;
  title: string;
  description: string;
  findings: string;
  recommendations: string;
  visit_date: string;
  record_type: string;
  created_at: string;
  dentist_id?: string | null;
  dentist?: {
    profile?: {
      first_name: string;
      last_name: string;
      specialization?: string;
    };
  } | null;
}

interface PatientDossierProps {
  user: User;
  onBack?: () => void;
}

export const PatientDossier = ({ user, onBack }: PatientDossierProps) => {
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientProfile, setPatientProfile] = useState<any>(null);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    loadPatientDossier();
  }, [user]);

  const loadPatientDossier = async () => {
    try {
      setIsLoading(true);

      // Load patient profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) {
        console.error('Error loading profile:', profileError);
        return;
      }

      setPatientProfile(profile);

      // Load medical records without joins
      const { data: records, error: recordsError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('patient_id', profile.id)
        .order('visit_date', { ascending: false });

      if (recordsError) {
        console.error('Error loading medical records:', recordsError);
        toast({
          title: "Error",
          description: "Failed to load your medical records",
          variant: "destructive",
        });
        return;
      }

      const dentistIds = Array.from(
        new Set((records || [])
          .map((r) => r.dentist_id)
          .filter((id): id is string => Boolean(id))
        )
      );

      let dentistsMap: Record<string, any> = {};
      if (dentistIds.length > 0) {
        const { data: dentistsData, error: dentistsError } = await supabase
          .from('dentists')
          .select('id, profile:profiles(first_name, last_name, specialization)')
          .in('id', dentistIds);
        if (dentistsError) {
          console.error('Error loading dentists info:', dentistsError);
        } else {
          dentistsMap = Object.fromEntries(
            (dentistsData || []).map((d) => [d.id, d])
          );
        }
      }

      const recordsWithDentists = (records || []).map((r) => ({
        ...r,
        dentist: dentistsMap[r.dentist_id as string] || null,
      }));

      setMedicalRecords(recordsWithDentists as MedicalRecord[]);
    } catch (error) {
      console.error('Error loading dossier:', error);
      toast({
        title: "Error",
        description: "Failed to load your dossier",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card className="floating-card">
        <CardHeader className="bg-gradient-primary text-white rounded-t-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <div>
                <CardTitle className="text-xl">Mon Dossier Médical</CardTitle>
                <p className="text-white/80 text-sm">
                  {patientProfile?.first_name} {patientProfile?.last_name}
                </p>
              </div>
            </div>
            {onBack && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBack}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <UserIcon className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Patient</p>
                <p className="font-medium">
                  {patientProfile?.first_name} {patientProfile?.last_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Date de naissance</p>
                <p className="font-medium">
                  {patientProfile?.date_of_birth 
                    ? formatDate(patientProfile.date_of_birth)
                    : 'Non renseigné'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total consultations</p>
                <p className="font-medium">{medicalRecords.length}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Medical Records */}
      <Card className="floating-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Historique Médical
          </CardTitle>
        </CardHeader>
        
        <CardContent className="p-0">
          {medicalRecords.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Aucun dossier médical trouvé</p>
              <p className="text-sm">Vos consultations apparaîtront ici après confirmation</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <div className="p-6 space-y-4">
                {medicalRecords.map((record) => (
                  <Card key={record.id} className="border border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">{record.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.visit_date)}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline">
                            {record.record_type}
                          </Badge>
                          {record.dentist?.profile && (
                            <p className="text-xs text-muted-foreground text-right">
                              Dr. {record.dentist.profile.first_name} {record.dentist.profile.last_name}
                              {record.dentist.profile.specialization && (
                                <span className="block">{record.dentist.profile.specialization}</span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                      
                      {record.description && (
                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-1">Description:</h4>
                          <p className="text-sm text-muted-foreground">{record.description}</p>
                        </div>
                      )}
                      
                      {record.findings && (
                        <div className="mb-3">
                          <h4 className="font-medium text-sm mb-1">Observations:</h4>
                          <p className="text-sm text-muted-foreground">{record.findings}</p>
                        </div>
                      )}
                      
                      {record.recommendations && (
                        <div>
                          <h4 className="font-medium text-sm mb-1">Recommandations:</h4>
                          <p className="text-sm text-muted-foreground">{record.recommendations}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
};