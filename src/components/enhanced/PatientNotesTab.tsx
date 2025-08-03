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
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2,
  Calendar,
  Eye,
  EyeOff
} from "lucide-react";
import { Patient, PatientNote } from "@/types/dental";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PatientNotesTabProps {
  patientNotes: PatientNote[];
  patient: Patient;
  dentistId: string;
  onRefresh: () => void;
}

export function PatientNotesTab({
  patientNotes,
  patient,
  dentistId,
  onRefresh
}: PatientNotesTabProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingNote, setEditingNote] = useState<PatientNote | null>(null);
  const [formData, setFormData] = useState({
    note_type: 'general' as const,
    title: '',
    content: '',
    is_private: false
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const noteData = {
        patient_id: patient.id,
        dentist_id: dentistId,
        ...formData
      };

      if (editingNote) {
        const { error } = await supabase
          .from('patient_notes')
          .update(noteData)
          .eq('id', editingNote.id);

        if (error) throw error;
        toast({
          title: "Note Updated",
          description: "Patient note has been updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('patient_notes')
          .insert(noteData);

        if (error) throw error;
        toast({
          title: "Note Added",
          description: "New patient note has been added successfully",
        });
      }

      setShowAddDialog(false);
      setEditingNote(null);
      setFormData({
        note_type: 'general',
        title: '',
        content: '',
        is_private: false
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save note",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (note: PatientNote) => {
    setEditingNote(note);
    setFormData({
      note_type: note.note_type,
      title: note.title,
      content: note.content,
      is_private: note.is_private
    });
    setShowAddDialog(true);
  };

  const handleDelete = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('patient_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;
      toast({
        title: "Note Deleted",
        description: "Patient note has been deleted successfully",
      });
      onRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const getNoteTypeIcon = (type: string) => {
    switch (type) {
      case 'clinical':
        return '🩺';
      case 'billing':
        return '💰';
      case 'follow_up':
        return '📞';
      case 'emergency':
        return '🚨';
      default:
        return '📝';
    }
  };

  const getNoteTypeColor = (type: string) => {
    switch (type) {
      case 'clinical':
        return 'text-blue-600';
      case 'billing':
        return 'text-green-600';
      case 'follow_up':
        return 'text-purple-600';
      case 'emergency':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Patient Notes</h3>
        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingNote ? 'Edit Note' : 'Add New Note'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="note_type">Note Type</Label>
                <Select
                  value={formData.note_type}
                  onValueChange={(value) => setFormData({ ...formData, note_type: value as any })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="clinical">Clinical</SelectItem>
                    <SelectItem value="billing">Billing</SelectItem>
                    <SelectItem value="follow_up">Follow Up</SelectItem>
                    <SelectItem value="emergency">Emergency</SelectItem>
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
                <Label htmlFor="content">Content</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="min-h-[120px]"
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="is_private"
                  checked={formData.is_private}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked as boolean })}
                />
                <Label htmlFor="is_private">Private Note (Only visible to dentists)</Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editingNote ? 'Update' : 'Add'} Note
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-4">
        {patientNotes.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Notes</h3>
              <p className="text-muted-foreground">No notes have been added for this patient yet.</p>
            </CardContent>
          </Card>
        ) : (
          patientNotes.map((note) => (
            <Card key={note.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`text-2xl ${getNoteTypeColor(note.note_type)}`}>
                      {getNoteTypeIcon(note.note_type)}
                    </div>
                    <div>
                      <h4 className="font-semibold">{note.title}</h4>
                      <div className="flex items-center space-x-2">
                        <p className="text-sm text-muted-foreground capitalize">
                          {note.note_type.replace('_', ' ')}
                        </p>
                        {note.is_private && (
                          <Badge variant="outline" className="text-xs">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      {new Date(note.created_at).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{note.content}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Created: {new Date(note.created_at).toLocaleString()}
                    {note.updated_at !== note.created_at && (
                      <span className="ml-2">
                        Updated: {new Date(note.updated_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(note)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(note.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
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