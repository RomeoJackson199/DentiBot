import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, AlertTriangle, TrendingDown, Edit, Trash2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function InventoryDashboard({ dentistId }: { dentistId: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    quantity: "",
    min_quantity: "",
    unit: "piece",
    cost_per_unit: ""
  });

  const { data: items } = useQuery({
    queryKey: ['inventory', dentistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .eq('dentist_id', dentistId)
        .order('name');

      if (error) throw error;
      return data;
    }
  });

  const { data: stats } = useQuery({
    queryKey: ['inventory-stats', dentistId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('quantity, min_quantity, cost_per_unit')
        .eq('dentist_id', dentistId);

      if (error) throw error;

      const totalValue = data.reduce((sum, item) => 
        sum + (Number(item.quantity) * Number(item.cost_per_unit)), 0
      );
      const lowStock = data.filter(item => item.quantity <= item.min_quantity).length;

      return { totalValue, lowStock, totalItems: data.length };
    }
  });

  const createItem = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('inventory_items')
        .insert({
          dentist_id: dentistId,
          name: newItem.name,
          sku: newItem.sku,
          quantity: parseInt(newItem.quantity),
          min_quantity: parseInt(newItem.min_quantity),
          unit: newItem.unit,
          cost_per_unit: parseFloat(newItem.cost_per_unit)
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item added successfully" });
      setIsCreateOpen(false);
      setNewItem({
        name: "",
        sku: "",
        quantity: "",
        min_quantity: "",
        unit: "piece",
        cost_per_unit: ""
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to add item",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (itemId: string) => {
      const { error } = await supabase
        .from('inventory_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      toast({ title: "Item deleted successfully" });
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Item Name</Label>
                <Input
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Dental gloves, Syringes, etc."
                />
              </div>

              <div>
                <Label>SKU</Label>
                <Input
                  value={newItem.sku}
                  onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
                  placeholder="SKU-001"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Quantity</Label>
                  <Input
                    type="number"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div>
                  <Label>Min Quantity</Label>
                  <Input
                    type="number"
                    value={newItem.min_quantity}
                    onChange={(e) => setNewItem({ ...newItem, min_quantity: e.target.value })}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Unit</Label>
                  <Select value={newItem.unit} onValueChange={(v) => setNewItem({ ...newItem, unit: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="piece">Piece</SelectItem>
                      <SelectItem value="box">Box</SelectItem>
                      <SelectItem value="bottle">Bottle</SelectItem>
                      <SelectItem value="pack">Pack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Cost per Unit (€)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={newItem.cost_per_unit}
                    onChange={(e) => setNewItem({ ...newItem, cost_per_unit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <Button
                onClick={() => createItem.mutate()}
                disabled={!newItem.name || !newItem.quantity || createItem.isPending}
                className="w-full"
              >
                Add Item
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{stats?.totalValue?.toFixed(2) || '0.00'}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.lowStock || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {items?.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium">{item.name}</p>
                    {item.quantity <= item.min_quantity && (
                      <Badge variant="destructive" className="flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Low Stock
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  <div className="flex gap-4 text-sm mt-2">
                    <span>Quantity: {item.quantity} {item.unit}</span>
                    <span>Min: {item.min_quantity}</span>
                    <span>Cost: €{item.cost_per_unit}/{item.unit}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="icon" variant="outline">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => deleteItem.mutate(item.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
