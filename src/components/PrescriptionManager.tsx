import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Pill,
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  SortDesc
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Prescription, NewPrescriptionForm } from "@/types/dental";

interface PrescriptionManagerProps {
  patientId: string;
  dentistId: string;
}

export function PrescriptionManager({ patientId, dentistId }: PrescriptionManagerProps) {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [filteredPrescriptions, setFilteredPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<'medication' | 'date' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'completed' | 'discontinued'>('all');
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState<NewPrescriptionForm>({
    medication_name: '',
    dosage: '',
    frequency: '',
    duration: '',
    instructions: '',
    expiry_date: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId, dentistId]);

  useEffect(() => {
    filterAndSortPrescriptions();
  }, [searchTerm, prescriptions, sortBy, sortOrder, filterStatus]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .eq('dentist_id', dentistId)
        .order('prescribed_date', { ascending: false });

      if (error) {
        console.error('Error fetching prescriptions:', error);
        throw error;
      }

      setPrescriptions(data || []);
    } catch (error) {
      console.error('Error in fetchPrescriptions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch prescriptions. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortPrescriptions = () => {
    let filtered = [...prescriptions];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(prescription =>
        prescription.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.dosage.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.frequency.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(prescription => prescription.status === filterStatus);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'medication':
          comparison = a.medication_name.localeCompare(b.medication_name);
          break;
        case 'date':
          comparison = new Date(a.prescribed_date).getTime() - new Date(b.prescribed_date).getTime();
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    setFilteredPrescriptions(filtered);
  };

  const handleCreatePrescription = async () => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          ...formData,
          prescribed_date: new Date().toISOString(),
          status: 'active'
        });

      if (error) {
        console.error('Error creating prescription:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Prescription created successfully.",
      });

      setIsDialogOpen(false);
      resetForm();
      fetchPrescriptions();
    } catch (error) {
      console.error('Error in handleCreatePrescription:', error);
      toast({
        title: "Error",
        description: "Failed to create prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePrescription = async () => {
    if (!selectedPrescription) return;

    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedPrescription.id);

      if (error) {
        console.error('Error updating prescription:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Prescription updated successfully.",
      });

      setIsDialogOpen(false);
      setIsEditMode(false);
      setSelectedPrescription(null);
      resetForm();
      fetchPrescriptions();
    } catch (error) {
      console.error('Error in handleUpdatePrescription:', error);
      toast({
        title: "Error",
        description: "Failed to update prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeletePrescription = async (prescriptionId: string) => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .delete()
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error deleting prescription:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Prescription deleted successfully.",
      });

      fetchPrescriptions();
    } catch (error) {
      console.error('Error in handleDeletePrescription:', error);
      toast({
        title: "Error",
        description: "Failed to delete prescription. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleStatusChange = async (prescriptionId: string, newStatus: 'active' | 'completed' | 'discontinued') => {
    try {
      const { error } = await supabase
        .from('prescriptions')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', prescriptionId);

      if (error) {
        console.error('Error updating prescription status:', error);
        throw error;
      }

      toast({
        title: "Success",
        description: "Prescription status updated successfully.",
      });

      fetchPrescriptions();
    } catch (error) {
      console.error('Error in handleStatusChange:', error);
      toast({
        title: "Error",
        description: "Failed to update prescription status. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setFormData({
      medication_name: prescription.medication_name,
      dosage: prescription.dosage,
      frequency: prescription.frequency,
      duration: prescription.duration,
      instructions: prescription.instructions || '',
      expiry_date: prescription.expiry_date || ''
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleView = (prescription: Prescription) => {
    setSelectedPrescription(prescription);
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      medication_name: '',
      dosage: '',
      frequency: '',
      duration: '',
      instructions: '',
      expiry_date: ''
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'discontinued': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <Clock className="h-4 w-4" />;
      case 'discontinued': return <XCircle className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading prescriptions...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Prescriptions</h2>
          <p className="text-gray-600">Manage patient prescriptions</p>
        </div>
        <Button onClick={() => {
          setSelectedPrescription(null);
          setIsEditMode(false);
          resetForm();
          setIsDialogOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          New Prescription
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search prescriptions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Select value={sortBy} onValueChange={(value: 'medication' | 'date' | 'status') => setSortBy(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medication">Medication</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="status">Status</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
          <Select value={filterStatus} onValueChange={(value: 'all' | 'active' | 'completed' | 'discontinued') => setFilterStatus(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="discontinued">Discontinued</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Prescriptions List */}
      <div className="space-y-2">
        {filteredPrescriptions.map((prescription) => (
          <Card key={prescription.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Pill className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="font-medium">{prescription.medication_name}</p>
                    <p className="text-sm text-gray-600">
                      {prescription.dosage} - {prescription.frequency}
                    </p>
                    <p className="text-xs text-gray-500">
                      Duration: {prescription.duration} | Prescribed: {formatDate(prescription.prescribed_date)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(prescription.status)}>
                    {getStatusIcon(prescription.status)}
                    <span className="ml-1">{prescription.status}</span>
                  </Badge>
                  <Button variant="ghost" size="sm" onClick={() => handleView(prescription)}>
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(prescription)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeletePrescription(prescription.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrescriptions.length === 0 && !loading && (
        <div className="text-center py-8">
          <Pill className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No prescriptions found</h3>
          <p className="text-gray-600">
            {searchTerm ? 'Try adjusting your search terms.' : 'No prescriptions have been added yet.'}
          </p>
        </div>
      )}

      {/* Prescription Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Edit Prescription' : selectedPrescription ? 'View Prescription' : 'New Prescription'}
            </DialogTitle>
          </DialogHeader>
          
          {!selectedPrescription || isEditMode ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="medication_name">Medication Name</Label>
                <Input
                  id="medication_name"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  placeholder="Enter medication name"
                />
              </div>
              <div>
                <Label htmlFor="dosage">Dosage</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 500mg"
                />
              </div>
              <div>
                <Label htmlFor="frequency">Frequency</Label>
                <Input
                  id="frequency"
                  value={formData.frequency}
                  onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                  placeholder="e.g., Twice daily"
                />
              </div>
              <div>
                <Label htmlFor="duration">Duration</Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g., 7 days"
                />
              </div>
              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Additional instructions..."
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="expiry_date">Expiry Date (Optional)</Label>
                <Input
                  id="expiry_date"
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-600">Medication Name</Label>
                <p className="text-sm">{selectedPrescription.medication_name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Dosage</Label>
                <p className="text-sm">{selectedPrescription.dosage}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Frequency</Label>
                <p className="text-sm">{selectedPrescription.frequency}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Duration</Label>
                <p className="text-sm">{selectedPrescription.duration}</p>
              </div>
              {selectedPrescription.instructions && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Instructions</Label>
                  <p className="text-sm">{selectedPrescription.instructions}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-600">Prescribed Date</Label>
                <p className="text-sm">{formatDate(selectedPrescription.prescribed_date)}</p>
              </div>
              {selectedPrescription.expiry_date && (
                <div>
                  <Label className="text-sm font-medium text-gray-600">Expiry Date</Label>
                  <p className="text-sm">{formatDate(selectedPrescription.expiry_date)}</p>
                </div>
              )}
              <div>
                <Label className="text-sm font-medium text-gray-600">Status</Label>
                <Badge className={getStatusColor(selectedPrescription.status)}>
                  {selectedPrescription.status}
                </Badge>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            {!selectedPrescription && (
              <Button onClick={handleCreatePrescription}>
                Create Prescription
              </Button>
            )}
            {isEditMode && (
              <Button onClick={handleUpdatePrescription}>
                Update Prescription
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}