import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { QrCode, Camera, Users, Calendar, CheckCircle, X } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface WaiterQRScannerProps {
  businessId: string;
  onSeatComplete?: () => void;
}

export function WaiterQRScanner({ businessId, onSeatComplete }: WaiterQRScannerProps) {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [manualReservationId, setManualReservationId] = useState('');
  const [selectedTable, setSelectedTable] = useState('');
  const [tables, setTables] = useState<any[]>([]);
  const [scannedReservation, setScannedReservation] = useState<any>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    loadTables();
    return () => {
      // Cleanup camera on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [businessId]);

  const loadTables = async () => {
    const { data } = await supabase
      .from('restaurant_tables')
      .select('*')
      .eq('business_id', businessId)
      .order('table_number');

    if (data) setTables(data);
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' }
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setScanning(true);
      toast({ title: 'Camera activated', description: 'Point camera at QR code' });
    } catch (error) {
      toast({
        title: 'Camera access denied',
        description: 'Please allow camera access or use manual entry',
        variant: 'destructive'
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setScanning(false);
  };

  const processReservationCode = async (qrData: string) => {
    try {
      const data = JSON.parse(qrData);

      if (data.type !== 'restaurant_reservation') {
        throw new Error('Invalid QR code');
      }

      await loadReservation(data.reservationId);
    } catch (error: any) {
      toast({
        title: 'Invalid QR code',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const loadReservation = async (reservationId: string) => {
    try {
      const { data: reservation, error } = await supabase
        .from('table_reservations')
        .select(`
          *,
          appointment:appointment_id (
            appointment_date,
            patient_id,
            profiles:patient_id (
              first_name,
              last_name,
              email,
              phone
            )
          )
        `)
        .eq('id', reservationId)
        .single();

      if (error) throw error;

      if (!reservation) {
        throw new Error('Reservation not found');
      }

      if (reservation.reservation_status === 'completed' || reservation.reservation_status === 'cancelled') {
        throw new Error('This reservation has already been used');
      }

      setScannedReservation(reservation);
      setShowConfirmation(true);
      stopCamera();
    } catch (error: any) {
      toast({
        title: 'Error loading reservation',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  const handleManualEntry = () => {
    if (!manualReservationId) {
      toast({ title: 'Please enter a reservation ID', variant: 'destructive' });
      return;
    }
    loadReservation(manualReservationId);
  };

  const seatCustomer = async () => {
    if (!selectedTable || !scannedReservation) {
      toast({ title: 'Please select a table', variant: 'destructive' });
      return;
    }

    try {
      // Get current waiter profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      // Update reservation: assign table, mark as seated, assign to waiter
      const { error: updateError } = await supabase
        .from('table_reservations')
        .update({
          table_id: selectedTable,
          reservation_status: 'seated',
          seated_at: new Date().toISOString(),
          assigned_waiter_id: profile?.id
        })
        .eq('id', scannedReservation.id);

      if (updateError) throw updateError;

      toast({
        title: 'Customer seated!',
        description: `Table ${tables.find(t => t.id === selectedTable)?.table_number} is ready`
      });

      setShowConfirmation(false);
      setScannedReservation(null);
      setSelectedTable('');
      setManualReservationId('');

      if (onSeatComplete) onSeatComplete();
    } catch (error: any) {
      toast({
        title: 'Error seating customer',
        description: error.message,
        variant: 'destructive'
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Seat Customers
          </CardTitle>
          <CardDescription>
            Scan reservation QR code or enter manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Camera Scanner */}
          {!scanning ? (
            <Button onClick={startCamera} className="w-full" size="lg">
              <Camera className="h-5 w-5 mr-2" />
              Scan QR Code
            </Button>
          ) : (
            <div className="space-y-2">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg border"
              />
              <Button onClick={stopCamera} variant="destructive" className="w-full">
                <X className="h-4 w-4 mr-2" />
                Stop Camera
              </Button>
              <p className="text-xs text-center text-muted-foreground">
                Position QR code in the camera view
              </p>
            </div>
          )}

          {/* Manual Entry */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or enter manually</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reservation ID</Label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter reservation ID"
                value={manualReservationId}
                onChange={(e) => setManualReservationId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleManualEntry()}
              />
              <Button onClick={handleManualEntry}>Load</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Seating</DialogTitle>
          </DialogHeader>
          {scannedReservation && (
            <div className="space-y-4">
              {/* Customer Info */}
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Users className="h-5 w-5" />
                  {scannedReservation.appointment?.profiles?.first_name}{' '}
                  {scannedReservation.appointment?.profiles?.last_name}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(scannedReservation.appointment?.appointment_date), 'PPp')}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4" />
                  Party of {scannedReservation.party_size}
                </div>
                {scannedReservation.special_requests && (
                  <div className="pt-2 border-t">
                    <p className="text-xs font-medium">Special Requests:</p>
                    <p className="text-sm text-muted-foreground">
                      {scannedReservation.special_requests}
                    </p>
                  </div>
                )}
              </div>

              {/* Table Selection */}
              <div className="space-y-2">
                <Label>Assign Table</Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a table" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables
                      .filter(t => t.capacity >= scannedReservation.party_size)
                      .map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.table_number} (Capacity: {table.capacity})
                          {table.location_notes && ` - ${table.location_notes}`}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Only showing tables with capacity ≥ {scannedReservation.party_size}
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConfirmation(false);
                    setScannedReservation(null);
                    setSelectedTable('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={seatCustomer}
                  disabled={!selectedTable}
                  className="flex-1"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Seat Customer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
