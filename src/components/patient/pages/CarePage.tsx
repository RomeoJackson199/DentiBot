import React, { useState, useEffect, useMemo } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useMediaQuery } from "@/hooks/use-media-query";
import { format, formatDistanceToNow, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { MedicalRecordViewer } from "../components/MedicalRecordViewer";
import { 
  Search,
  Filter,
  FileText,
  Pill,
  Calendar,
  ChevronDown,
  ChevronRight,
  Download,
  Eye,
  MessageSquare,
  RefreshCw,
  Image,
  File,
  X,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity,
  ClipboardList,
  User as UserIcon,
  QrCode,
  FileImage,
  FilePlus
} from "lucide-react";

interface CarePageProps {
  user: User;
  onTabChange?: (tabId: string) => void;
}

interface TreatmentPlan {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'active' | 'completed';
  progress: number;
  next_step: string;
  next_step_date: string;
  created_at: string;
  updated_at: string;
}

interface Prescription {
  id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date: string;
  status: 'active' | 'expired' | 'cancelled';
  instructions: string;
  prescribed_by: string;
  visit_id?: string;
}

interface CompletedVisit {
  id: string;
  appointment_date: string;
  appointment_time: string;
  service_type: string;
  dentist_name: string;
  procedures: string[];
  notes: string;
  prescriptions: Prescription[];
  records: MedicalRecord[];
  treatment_plan_updates: any[];
}

interface MedicalRecord {
  id: string;
  title: string;
  type: 'xray' | 'report' | 'image' | 'document';
  file_url: string;
  file_size: number;
  created_at: string;
  visit_id?: string;
}

type FilterType = 'all' | 'plans' | 'prescriptions' | 'visits' | 'records';

export const CarePage: React.FC<CarePageProps> = ({ user, onTabChange }) => {
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [dateRange, setDateRange] = useState("all");
  
  // Data states
  const [treatmentPlans, setTreatmentPlans] = useState<TreatmentPlan[]>([]);
  const [activePrescriptions, setActivePrescriptions] = useState<Prescription[]>([]);
  const [pastPrescriptions, setPastPrescriptions] = useState<Prescription[]>([]);
  const [completedVisits, setCompletedVisits] = useState<CompletedVisit[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  
  // UI states
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['plans', 'prescriptions', 'visits', 'records']));
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [selectedVisit, setSelectedVisit] = useState<CompletedVisit | null>(null);
  
  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 599px)");
  const isTablet = useMediaQuery("(min-width: 600px) and (max-width: 1023px)");
  const isDesktop = useMediaQuery("(min-width: 1024px)");

  useEffect(() => {
    fetchCareData();
  }, [user.id]);

  const fetchCareData = async () => {
    try {
      setLoading(true);
      
      // First, get the user's profile ID
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (profileError || !userProfile) {
        console.error('Error fetching user profile:', profileError);
        toast({
          title: "Error",
          description: "Could not load user profile. Please refresh the page.",
          variant: "destructive",
        });
        return;
      }

      const profileId = userProfile.id;

      // Fetch all care data in parallel
      const [plansRes, prescriptionsRes, visitsRes, recordsRes] = await Promise.all([
        // Treatment plans
        supabase
          .from('treatment_plans')
          .select('*')
          .eq('patient_id', profileId)
          .order('created_at', { ascending: false }),
        
        // Prescriptions
        supabase
          .from('prescriptions')
          .select('*')
          .eq('patient_id', profileId)
          .order('created_at', { ascending: false }),
        
        // Completed visits
        supabase
          .from('appointments')
          .select(`
            *,
            dentist:dentists(
              full_name,
              specialization
            ),
            medical_records(*)
          `)
          .eq('patient_id', profileId)
          .eq('status', 'completed')
          .order('appointment_date', { ascending: false }),
        
        // Medical records
        supabase
          .from('medical_records')
          .select('*')
          .eq('patient_id', profileId)
          .order('created_at', { ascending: false })
      ]);

      if (!plansRes.error && plansRes.data) {
        setTreatmentPlans(plansRes.data);
      }

      if (!prescriptionsRes.error && prescriptionsRes.data) {
        const active = prescriptionsRes.data.filter(p => p.status === 'active');
        const past = prescriptionsRes.data.filter(p => p.status !== 'active');
        setActivePrescriptions(active);
        setPastPrescriptions(past);
      }

      if (!visitsRes.error && visitsRes.data) {
        const formattedVisits = visitsRes.data.map(visit => ({
          id: visit.id,
          appointment_date: visit.appointment_date,
          appointment_time: visit.appointment_time,
          service_type: visit.service_type,
          dentist_name: visit.dentist?.full_name || 'Unknown',
          procedures: visit.procedures || [],
          notes: visit.notes?.[0]?.content || '',
          prescriptions: visit.prescriptions || [],
          records: visit.medical_records || [],
          treatment_plan_updates: []
        }));
        setCompletedVisits(formattedVisits);
      }

      if (!recordsRes.error && recordsRes.data) {
        setMedicalRecords(recordsRes.data);
      }

    } catch (error) {
      console.error('Error fetching care data:', error);
      toast({
        title: "Error",
        description: "Failed to load care data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(section)) {
        newSet.delete(section);
      } else {
        newSet.add(section);
      }
      return newSet;
    });
  };

  const handleRequestRenewal = async (prescriptionId: string) => {
    try {
      // Create a renewal request
      const { error } = await supabase
        .from('prescription_renewals')
        .insert({
          prescription_id: prescriptionId,
          patient_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Renewal Requested",
        description: "Your prescription renewal request has been sent. The clinic typically responds within 1 business day.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to request renewal",
        variant: "destructive",
      });
    }
  };

  const handleShowQR = (prescription: Prescription) => {
    // Generate QR code or proof token
    toast({
      title: "QR Code Generated",
      description: "Present this at the pharmacy",
    });
  };

  // Filter logic
  const filteredData = useMemo(() => {
    let results = {
      plans: treatmentPlans,
      activePrescriptions,
      pastPrescriptions,
      visits: completedVisits,
      records: medicalRecords
    };

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      results = {
        plans: treatmentPlans.filter(p => 
          p.title.toLowerCase().includes(term) || 
          p.description?.toLowerCase().includes(term)
        ),
        activePrescriptions: activePrescriptions.filter(p => 
          p.medication_name.toLowerCase().includes(term)
        ),
        pastPrescriptions: pastPrescriptions.filter(p => 
          p.medication_name.toLowerCase().includes(term)
        ),
        visits: completedVisits.filter(v => 
          v.service_type.toLowerCase().includes(term) ||
          v.notes.toLowerCase().includes(term) ||
          v.dentist_name.toLowerCase().includes(term)
        ),
        records: medicalRecords.filter(r => 
          r.title.toLowerCase().includes(term)
        )
      };
    }

    // Apply type filter
    if (filterType !== 'all') {
      results = {
        plans: filterType === 'plans' ? results.plans : [],
        activePrescriptions: filterType === 'prescriptions' ? results.activePrescriptions : [],
        pastPrescriptions: filterType === 'prescriptions' ? results.pastPrescriptions : [],
        visits: filterType === 'visits' ? results.visits : [],
        records: filterType === 'records' ? results.records : []
      };
    }

    return results;
  }, [searchTerm, filterType, treatmentPlans, activePrescriptions, pastPrescriptions, completedVisits, medicalRecords]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex gap-4">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-32" />
        </div>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Care</h1>
        <p className="text-muted-foreground">Your complete care history and medical records</p>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-0 z-10 bg-background pb-4 space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search plans, prescriptions, records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
            <SelectTrigger className="w-[140px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="plans">Plans</SelectItem>
              <SelectItem value="prescriptions">Prescriptions</SelectItem>
              <SelectItem value="visits">Visits</SelectItem>
              <SelectItem value="records">Records</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Treatment Plans Section */}
      {(filterType === 'all' || filterType === 'plans') && filteredData.plans.length > 0 && (
        <Collapsible open={expandedSections.has('plans')}>
          <Card>
            <CollapsibleTrigger 
              className="w-full"
              onClick={() => toggleSection('plans')}
            >
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5" />
                    <CardTitle>Treatment Plans</CardTitle>
                  </div>
                  {expandedSections.has('plans') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {filteredData.plans.map((plan) => (
                  <div key={plan.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">{plan.title}</p>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                      <Badge variant={
                        plan.status === 'active' ? 'default' : 
                        plan.status === 'completed' ? 'secondary' : 
                        'outline'
                      }>
                        {plan.status}
                      </Badge>
                    </div>
                    
                    {plan.status === 'active' && (
                      <>
                        <Progress value={plan.progress || 0} className="h-2" />
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Next: {plan.next_step}</span>
                          {plan.next_step_date && (
                            <span className="text-muted-foreground">
                              {format(new Date(plan.next_step_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </>
                    )}
                    
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4 mr-1" />
                        View Plan
                      </Button>
                      {plan.status === 'active' && (
                        <Button size="sm" variant="outline">
                          <Calendar className="h-4 w-4 mr-1" />
                          Schedule Next
                        </Button>
                      )}
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message Clinic
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Prescriptions Section */}
      {(filterType === 'all' || filterType === 'prescriptions') && (
        <Collapsible open={expandedSections.has('prescriptions')}>
          <Card>
            <CollapsibleTrigger 
              className="w-full"
              onClick={() => toggleSection('prescriptions')}
            >
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="h-5 w-5" />
                    <CardTitle>Prescriptions</CardTitle>
                    {filteredData.activePrescriptions.length > 0 && (
                      <Badge>{filteredData.activePrescriptions.length} Active</Badge>
                    )}
                  </div>
                  {expandedSections.has('prescriptions') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-4">
                {/* Active Prescriptions */}
                {filteredData.activePrescriptions.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-muted-foreground">Active Prescriptions</p>
                    {filteredData.activePrescriptions.map((prescription) => (
                      <div key={prescription.id} className="p-4 border rounded-lg border-green-200 bg-green-50/50">
                        <div className="flex items-start justify-between mb-3">
                          <div className="space-y-1">
                            <p className="font-medium">{prescription.medication_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {prescription.dosage} • {prescription.frequency}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Prescribed: {format(new Date(prescription.start_date), 'MMM d, yyyy')}
                              {prescription.end_date && ` • Expires: ${format(new Date(prescription.end_date), 'MMM d, yyyy')}`}
                            </p>
                          </div>
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            Active
                          </Badge>
                        </div>
                        
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleShowQR(prescription)}>
                            <QrCode className="h-4 w-4 mr-1" />
                            Show QR/Proof
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRequestRenewal(prescription.id)}>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Request Renewal
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download PDF
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Past Prescriptions */}
                {filteredData.pastPrescriptions.length > 0 && (
                  <Collapsible>
                    <CollapsibleTrigger className="text-sm font-medium text-muted-foreground hover:text-foreground">
                      Past Prescriptions ({filteredData.pastPrescriptions.length})
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-3 space-y-3">
                      {filteredData.pastPrescriptions.map((prescription) => (
                        <div key={prescription.id} className="p-4 border rounded-lg opacity-75">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <p className="font-medium">{prescription.medication_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {prescription.dosage} • {prescription.frequency}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(prescription.start_date), 'MMM d')} - {format(new Date(prescription.end_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Badge variant="outline">
                              {prescription.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {filteredData.activePrescriptions.length === 0 && filteredData.pastPrescriptions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Pill className="h-12 w-12 mx-auto mb-3 opacity-20" />
                    <p>No prescriptions found</p>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Completed Visits Section */}
      {(filterType === 'all' || filterType === 'visits') && filteredData.visits.length > 0 && (
        <Collapsible open={expandedSections.has('visits')}>
          <Card>
            <CollapsibleTrigger 
              className="w-full"
              onClick={() => toggleSection('visits')}
            >
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <CardTitle>Completed Visits</CardTitle>
                  </div>
                  {expandedSections.has('visits') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="space-y-3">
                {filteredData.visits.map((visit) => (
                  <div key={visit.id} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-medium">
                          {format(new Date(visit.appointment_date), 'EEEE, MMMM d, yyyy')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {visit.appointment_time} • {visit.service_type}
                        </p>
                        <p className="text-sm">Dr. {visit.dentist_name}</p>
                      </div>
                    </div>
                    
                    {visit.procedures.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">Procedures:</p>
                        <div className="flex flex-wrap gap-1">
                          {visit.procedures.map((proc, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                              {proc}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {visit.notes && (
                      <div className="p-3 bg-muted/50 rounded-md">
                        <p className="text-sm font-medium mb-1">Dentist Notes:</p>
                        <p className="text-sm text-muted-foreground">{visit.notes}</p>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {visit.prescriptions.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Pill className="h-3 w-3" />
                          {visit.prescriptions.length} prescription{visit.prescriptions.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {visit.records.length > 0 && (
                        <span className="flex items-center gap-1">
                          <FileImage className="h-3 w-3" />
                          {visit.records.length} file{visit.records.length > 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                    
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setSelectedVisit(visit)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      View Visit Details
                    </Button>
                  </div>
                ))}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Medical Records Section */}
      {(filterType === 'all' || filterType === 'records') && filteredData.records.length > 0 && (
        <Collapsible open={expandedSections.has('records')}>
          <Card>
            <CollapsibleTrigger 
              className="w-full"
              onClick={() => toggleSection('records')}
            >
              <CardHeader className="cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileImage className="h-5 w-5" />
                    <CardTitle>Medical Records</CardTitle>
                  </div>
                  {expandedSections.has('records') ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                {isDesktop ? (
                  // Desktop: Table view
                  <div className="border rounded-lg">
                    <table className="w-full">
                      <thead className="border-b bg-muted/50">
                        <tr>
                          <th className="text-left p-3 font-medium">Title</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Date</th>
                          <th className="text-left p-3 font-medium">Size</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.records.map((record) => (
                          <tr key={record.id} className="border-b hover:bg-muted/50">
                            <td className="p-3">{record.title}</td>
                            <td className="p-3">
                              <Badge variant="outline">
                                {record.type === 'xray' && 'X-Ray'}
                                {record.type === 'report' && 'Report'}
                                {record.type === 'image' && 'Image'}
                                {record.type === 'document' && 'Document'}
                              </Badge>
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {format(new Date(record.created_at), 'MMM d, yyyy')}
                            </td>
                            <td className="p-3 text-sm text-muted-foreground">
                              {(record.file_size / 1024).toFixed(1)} KB
                            </td>
                            <td className="p-3">
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => setSelectedRecord(record)}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="ghost">
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  // Mobile/Tablet: Card view
                  <div className="space-y-3">
                    {filteredData.records.map((record) => (
                      <div key={record.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div className="space-y-1">
                            <p className="font-medium">{record.title}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {record.type === 'xray' && 'X-Ray'}
                                {record.type === 'report' && 'Report'}
                                {record.type === 'image' && 'Image'}
                                {record.type === 'document' && 'Document'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(record.created_at), 'MMM d, yyyy')}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {(record.file_size / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedRecord(record)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4 mr-1" />
                            Download
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Empty State */}
      {filteredData.plans.length === 0 && 
       filteredData.activePrescriptions.length === 0 && 
       filteredData.pastPrescriptions.length === 0 &&
       filteredData.visits.length === 0 && 
       filteredData.records.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              {searchTerm || filterType !== 'all' 
                ? 'No results found. Try adjusting your search or filters.'
                : 'No records yet — your dentist will upload files after your first visit.'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Medical Record Viewer */}
      {selectedRecord && (
        <MedicalRecordViewer
          record={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          isMobile={isMobile}
        />
      )}

      {/* Visit Details Sheet */}
      <Sheet open={!!selectedVisit} onOpenChange={(open) => !open && setSelectedVisit(null)}>
        <SheetContent className={cn("overflow-y-auto", isMobile ? "w-full" : "w-[500px]")}>
          {selectedVisit && (
            <>
              <SheetHeader>
                <SheetTitle>Visit Details</SheetTitle>
                <SheetDescription>
                  {format(new Date(selectedVisit.appointment_date), 'EEEE, MMMM d, yyyy')} at {selectedVisit.appointment_time}
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-6">
                <div>
                  <p className="font-medium mb-2">Service Type</p>
                  <p className="text-muted-foreground">{selectedVisit.service_type}</p>
                </div>
                
                <div>
                  <p className="font-medium mb-2">Dentist</p>
                  <p className="text-muted-foreground">Dr. {selectedVisit.dentist_name}</p>
                </div>
                
                {selectedVisit.procedures.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Procedures Performed</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedVisit.procedures.map((proc, idx) => (
                        <Badge key={idx} variant="secondary">
                          {proc}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedVisit.notes && (
                  <div>
                    <p className="font-medium mb-2">Dentist Notes</p>
                    <div className="p-3 bg-muted/50 rounded-md">
                      <p className="text-sm">{selectedVisit.notes}</p>
                    </div>
                  </div>
                )}
                
                {selectedVisit.prescriptions.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Prescriptions</p>
                    <div className="space-y-2">
                      {selectedVisit.prescriptions.map((prescription) => (
                        <div key={prescription.id} className="p-3 border rounded-lg">
                          <p className="font-medium text-sm">{prescription.medication_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {prescription.dosage} • {prescription.frequency}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                {selectedVisit.records.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Files & Records</p>
                    <div className="space-y-2">
                      {selectedVisit.records.map((record) => (
                        <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2">
                            <FileImage className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{record.title}</span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedRecord(record);
                              setSelectedVisit(null);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};