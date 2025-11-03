import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface RestaurantTableManagerProps {
  businessId: string;
}

export function RestaurantTableManager({ businessId }: RestaurantTableManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<any>(null);
  const [formData, setFormData] = useState({
    table_number: '',
    capacity: 2,
    location_notes: '',
  });

  const { data: tables, isLoading } = useQuery({
    queryKey: ['restaurant-tables', businessId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .eq('business_id', businessId)
        .order('table_number');
      
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .insert({ ...data, business_id: businessId });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      setIsOpen(false);
      setFormData({ table_number: '', capacity: 2, location_notes: '' });
      toast({ title: 'Table created successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error creating table', description: error.message, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof formData }) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .update(data)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      setIsOpen(false);
      setEditingTable(null);
      setFormData({ table_number: '', capacity: 2, location_notes: '' });
      toast({ title: 'Table updated successfully' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('restaurant_tables')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['restaurant-tables'] });
      toast({ title: 'Table deleted successfully' });
    },
  });

  const handleSubmit = () => {
    if (editingTable) {
      updateMutation.mutate({ id: editingTable.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (table: any) => {
    setEditingTable(table);
    setFormData({
      table_number: table.table_number,
      capacity: table.capacity,
      location_notes: table.location_notes || '',
    });
    setIsOpen(true);
  };

  if (isLoading) {
    return <div>Loading tables...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Table Management</h2>
          <p className="text-muted-foreground">Configure your restaurant tables</p>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => {
          setIsOpen(open);
          if (!open) {
            setEditingTable(null);
            setFormData({ table_number: '', capacity: 2, location_notes: '' });
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTable ? 'Edit Table' : 'Add New Table'}</DialogTitle>
              <DialogDescription>Configure table details and capacity</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="table_number">Table Number/Name</Label>
                <Input
                  id="table_number"
                  value={formData.table_number}
                  onChange={(e) => setFormData({ ...formData, table_number: e.target.value })}
                  placeholder="e.g., Table 1, A1, Patio 3"
                />
              </div>
              <div>
                <Label htmlFor="capacity">Capacity (People)</Label>
                <Input
                  id="capacity"
                  type="number"
                  min="1"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="location_notes">Location Notes</Label>
                <Textarea
                  id="location_notes"
                  value={formData.location_notes}
                  onChange={(e) => setFormData({ ...formData, location_notes: e.target.value })}
                  placeholder="e.g., Window seat, Near bar, Patio area"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
              <Button onClick={handleSubmit}>
                {editingTable ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables?.map((table) => (
          <Card key={table.id}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{table.table_number}</span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEdit(table)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteMutation.mutate(table.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>Capacity: {table.capacity} people</CardDescription>
            </CardHeader>
            {table.location_notes && (
              <CardContent>
                <p className="text-sm text-muted-foreground">{table.location_notes}</p>
              </CardContent>
            )}
          </Card>
        ))}
      </div>

      {tables?.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No tables configured yet</p>
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Table
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
