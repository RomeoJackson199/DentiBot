import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  Stethoscope, 
  Plus, 
  Save,
  Edit,
  Trash2,
  User,
  UserCheck
} from "lucide-react";
import { format } from "date-fns";

interface Note {
  id: string;
  content: string;
  created_at: string;
  patient_id: string;
  dentist_id?: string;
}

interface PatientNotesProps {
  patientId: string;
  dentistId: string;
}

export function PatientNotes({ patientId, dentistId }: PatientNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isAddingNote, setIsAddingNote] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchNotes();
  }, [patientId, dentistId, fetchNotes]);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('patient_notes')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [patientId, toast]);

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      const { data, error } = await supabase
        .from('patient_notes')
        .insert({
          patient_id: patientId,
          dentist_id: dentistId,
          title: 'Clinical Note',
          content: newNote.trim(),
          note_type: 'clinical'
        })
        .select()
        .single();

      if (error) throw error;

      setNotes(prev => [data, ...prev]);
      setNewNote("");
      setIsAddingNote(false);

      toast({
        title: "Success",
        description: "Note added successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleEditNote = (noteId: string, content: string) => {
    setEditingNote(noteId);
    setEditContent(content);
  };

  const handleUpdateNote = async (noteId: string) => {
    if (!editContent.trim()) return;

    try {
      const { error } = await supabase
        .from('patient_notes')
        .update({ content: editContent.trim() })
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => 
        prev.map(note => 
          note.id === noteId 
            ? { ...note, content: editContent.trim() }
            : note
        )
      );

      setEditingNote(null);
      setEditContent("");

      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) return;

    try {
      const { error } = await supabase
        .from('patient_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prev => prev.filter(note => note.id !== noteId));

      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
    } catch (error: unknown) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="glass-card">
        <CardContent className="p-8 text-center">
          <div className="animate-pulse">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="glass-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Stethoscope className="h-6 w-6 text-dental-primary" />
              <span>Clinical Notes</span>
            </CardTitle>
            <Button onClick={() => setIsAddingNote(true)} disabled={isAddingNote}>
              <Plus className="h-4 w-4 mr-2" />
              Add Note
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Add New Note */}
      {isAddingNote && (
        <Card className="glass-card border-dental-primary">
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Add New Clinical Note</h3>
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter clinical observations, treatment notes, patient behavior, follow-up instructions..."
              className="min-h-[120px] mb-4"
            />
            <div className="flex space-x-2">
              <Button onClick={handleAddNote} disabled={!newNote.trim()}>
                <Save className="h-4 w-4 mr-2" />
                Save Note
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote("");
                }}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Notes List */}
      {notes.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            <Stethoscope className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clinical notes recorded yet.</p>
            <p className="text-sm">Click "Add Note" to create your first clinical note.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <Card key={note.id} className="glass-card">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-dental-primary/10 rounded-full flex items-center justify-center">
                      {note.dentist_id ? (
                        <UserCheck className="h-4 w-4 text-dental-primary" />
                      ) : (
                        <User className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">
                        {note.dentist_id ? 'Dentist Note' : 'Patient Note'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(note.created_at), 'PPP p')}
                      </p>
                    </div>
                  </div>
                  
                  {note.dentist_id === dentistId && (
                    <div className="flex items-center space-x-2">
                      {editingNote === note.id ? (
                        <>
                          <Button 
                            size="sm" 
                            onClick={() => handleUpdateNote(note.id)}
                            disabled={!editContent.trim()}
                          >
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => {
                              setEditingNote(null);
                              setEditContent("");
                            }}
                          >
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditNote(note.id, note.content)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleDeleteNote(note.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  )}
                </div>
                
                {editingNote === note.id ? (
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <div className="bg-muted p-4 rounded-md">
                    <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}