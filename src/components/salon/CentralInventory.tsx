/**
 * Central Inventory - Type C (Enterprise Multi-Location)
 *
 * Warehouse and distribution management
 * Features:
 * - View central warehouse stock levels
 * - Create transfer requests to locations
 * - Track pending/in-transit transfers
 * - Low stock alerts
 * - Reorder management
 */

import { useState, useEffect } from 'react';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Package, AlertTriangle, Send, CheckCircle, Clock } from 'lucide-react';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

interface InventoryItem {
  id: string;
  productId: string;
  productName: string;
  quantityOnHand: number;
  reorderThreshold: number;
  averageCost: number;
}

interface Location {
  id: string;
  name: string;
  city: string;
}

interface Transfer {
  id: string;
  productName: string;
  toLocationName: string;
  quantity: number;
  status: string;
  requestedAt: string;
}

export function CentralInventory() {
  const { businessId } = useBusinessContext();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [transferQuantity, setTransferQuantity] = useState<number>(1);

  useEffect(() => {
    if (!businessId) return;
    loadInventoryData();
  }, [businessId]);

  const loadInventoryData = async () => {
    if (!businessId) return;
    setLoading(true);

    try {
      // Load central inventory
      const { data: centralInv } = await supabase
        .from('central_inventory')
        .select(`
          id,
          product_id,
          quantity_on_hand,
          reorder_threshold,
          average_cost_cents,
          business_services(name)
        `)
        .eq('parent_business_id', businessId);

      if (centralInv) {
        const items = centralInv.map((item: any) => ({
          id: item.id,
          productId: item.product_id,
          productName: item.business_services?.name || 'Unknown Product',
          quantityOnHand: item.quantity_on_hand || 0,
          reorderThreshold: item.reorder_threshold || 0,
          averageCost: (item.average_cost_cents || 0) / 100,
        }));
        setInventory(items);
      }

      // Load locations
      const { data: locs } = await supabase
        .from('locations')
        .select('id, name, city')
        .eq('parent_business_id', businessId)
        .eq('is_active', true);

      if (locs) {
        setLocations(locs);
      }

      // Load pending transfers
      const { data: pendingTransfers } = await supabase
        .from('inventory_transfers')
        .select(`
          id,
          quantity,
          status,
          requested_at,
          business_services(name),
          to_location:to_location_id(name)
        `)
        .eq('parent_business_id', businessId)
        .in('status', ['pending', 'in_transit'])
        .order('requested_at', { ascending: false })
        .limit(10);

      if (pendingTransfers) {
        const transferList = pendingTransfers.map((t: any) => ({
          id: t.id,
          productName: t.business_services?.name || 'Unknown',
          toLocationName: t.to_location?.name || 'Unknown Location',
          quantity: t.quantity,
          status: t.status,
          requestedAt: t.requested_at,
        }));
        setTransfers(transferList);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTransfer = async () => {
    if (!selectedProduct || !selectedLocation || transferQuantity < 1) {
      toast({
        title: 'Invalid Input',
        description: 'Please select a product, location, and valid quantity',
        variant: 'destructive',
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('inventory_transfers').insert({
        parent_business_id: businessId,
        from_location_id: null, // null = central warehouse
        to_location_id: selectedLocation,
        product_id: selectedProduct,
        quantity: transferQuantity,
        status: 'pending',
        requested_by: user.id,
      });

      if (error) throw error;

      toast({
        title: 'Transfer Created',
        description: 'Transfer request has been created successfully',
      });

      setShowTransferDialog(false);
      setSelectedProduct('');
      setSelectedLocation('');
      setTransferQuantity(1);
      loadInventoryData();
    } catch (error) {
      console.error('Error creating transfer:', error);
      toast({
        title: 'Error',
        description: 'Failed to create transfer request',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <ModernLoadingSpinner variant="overlay" size="lg" message="Loading inventory..." />
      </div>
    );
  }

  const lowStockItems = inventory.filter((item) => item.quantityOnHand <= item.reorderThreshold);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Central Inventory</h1>
          <p className="text-muted-foreground">Warehouse stock management</p>
        </div>
        <Button onClick={() => setShowTransferDialog(true)}>
          <Send className="mr-2 h-4 w-4" />
          Create Transfer
        </Button>
      </div>

      {/* Low Stock Alerts */}
      {lowStockItems.length > 0 && (
        <Card className="border-orange-500">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-600">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Low Stock Alert ({lowStockItems.length} items)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 bg-orange-50 rounded"
                >
                  <span>{item.productName}</span>
                  <Badge variant="destructive">
                    {item.quantityOnHand} left (reorder at {item.reorderThreshold})
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory List */}
      <Card>
        <CardHeader>
          <CardTitle>Warehouse Stock</CardTitle>
          <CardDescription>{inventory.length} products in central warehouse</CardDescription>
        </CardHeader>
        <CardContent>
          {inventory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No inventory items found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {inventory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div>
                    <div className="font-semibold">{item.productName}</div>
                    <div className="text-sm text-muted-foreground">
                      Avg Cost: €{item.averageCost.toFixed(2)} • Reorder at {item.reorderThreshold}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{item.quantityOnHand}</div>
                    <div className="text-xs text-muted-foreground">units</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Transfers */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transfers</CardTitle>
          <CardDescription>Pending and in-transit shipments</CardDescription>
        </CardHeader>
        <CardContent>
          {transfers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Send className="mx-auto h-12 w-12 mb-3 opacity-50" />
              <p>No pending transfers</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transfers.map((transfer) => (
                <div
                  key={transfer.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {transfer.status === 'pending' ? (
                      <Clock className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <Send className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <div className="font-semibold">{transfer.productName}</div>
                      <div className="text-sm text-muted-foreground">
                        To: {transfer.toLocationName} • Qty: {transfer.quantity}
                      </div>
                    </div>
                  </div>
                  <Badge variant={transfer.status === 'pending' ? 'secondary' : 'default'}>
                    {transfer.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Inventory Transfer</DialogTitle>
            <DialogDescription>
              Transfer products from warehouse to a location
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label>Product</Label>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  {inventory.map((item) => (
                    <SelectItem key={item.productId} value={item.productId}>
                      {item.productName} ({item.quantityOnHand} available)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Destination Location</Label>
              <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.name} - {loc.city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                value={transferQuantity}
                onChange={(e) => setTransferQuantity(parseInt(e.target.value) || 1)}
              />
            </div>

            <div className="flex space-x-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreateTransfer}>
                Create Transfer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
