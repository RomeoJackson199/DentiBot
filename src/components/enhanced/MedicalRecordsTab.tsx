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
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { 
  FileText, 
  Plus, 
  Edit, 
  Download,
  Eye,
  Calendar
} from "lucide-react";
import { Patient, MedicalRecord } from "@/types/dental";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface MedicalRecordsTabProps {
  medicalRecords: MedicalRecord[];
  patient: Patient;
  dentistId: string;
  onRefresh: () => void;
}

export function MedicalRecordsTab({
  medicalRecords,
  patient,
  dentistId,
  onRefresh
}: MedicalRecordsTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [formData, setFormData] = useState({
    record_type: 'examination' as const,
    title: '',
    description: '',
    file_url: '',
    record_date: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const recordData = {
        patient_id: patient.id,
        dentist_id: dentistId,
        ...formData,
        record_date: formData.record_date || new Date().toISOString()
      };

      if (editingRecord) {
        const { error } = await supabase
          .from('medical_records')
          .update(recordData)
          .eq('id', editingRecord.id);

        if (error) throw error;
        toast({
          title: "Medical Record Updated",
          description: "Medical record has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('medical_records')
          .insert(recordData);

        if (error) throw error;
        toast({
          title: "Medical Record Added",
          description: "New medical record has been added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingRecord(null);
      setFormData({
        record_type: 'examination',
        title: '',
        description: '',
        file_url: '',
        record_date: ''
      });
      onRefresh();
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (record: MedicalRecord) => {
    setEditingRecord(record);
    setFormData({
      record_type: record.record_type,
      title: record.title,
      description: record.description || '',
      file_url: record.file_url || '',
      record_date: record.record_date
    });
    setShowAddDialog(true);
  };

  const getRecordTypeIcon = (type: string) => {
    switch (type) {
      case 'xray':
        return '🦷';
      case 'lab_result':
        return '🔬';
      case 'consultation':
        return '👨‍⚕️';
      case 'surgery':
        return '⚕️';
      default:
        return '📋';
    }
  };

  const getRecordTypeColor = (type: string) => {
    switch (type) {
      case 'xray':
        return 'text-blue-600';
      case 'lab_result':
        return 'text-green-600';
      case 'consultation':
        return 'text-purple-600';
      case 'surgery':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Medical Records</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Medical Record
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingRecord ? 'Edit Medical Record' : 'Add New Medical Record'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="record_type">Record Type</Label>
                <Select
                  value={formData.record_type}
                  onValueChange={(value) => setFormData({ ...formData, record_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="examination">Examination</SelectItem>
                    <SelectItem value="xray">X-Ray</SelectItem>
                    <SelectItem value="lab_result">Lab Result</SelectItem>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="surgery">Surgery</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="file_url">File URL (Optional)</Label>
                <Input
                  id="file_url"
                  value={formData.file_url}
                  onChange={(e) => setFormData({ ...formData, file_url: e.target.value })}
                  placeholder="https://example.com/file.pdf"
                />
              </div>
              <div>
                <Label htmlFor="record_date">Record Date</Label>
                <Input
                  id="record_date"
                  type="date"
                  value={formData.record_date}
                  onChange={(e) => setFormData({ ...formData, record_date: e.target.value })}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingRecord ? 'Update' : 'Add'} Medical Record
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {medicalRecords.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Medical Records</h3>
              <p className="text-muted-foreground">No medical records have been added for this patient yet.</p>
            </CardContent>
          </Card>
        ) : (
          medicalRecords.map((record) => (
            <Card key={record.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl ${getRecordTypeColor(record.record_type)}`}>
                      {getRecordTypeIcon(record.record_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{record.title}</h4>
                      <p className="text-sm text-muted-foreground capitalize">
                        {record.record_type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(record.record_date).toLocaleDateString()}
                  </Badge>
                </div>

                {record.description && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground">{record.description}</p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {record.file_url && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={record.file_url} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4 mr-2" />
                          View File
                        </a>
                      </Button>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(record)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}