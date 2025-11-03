import { useState, useEffect } from 'react';
import { useBusinessTemplate } from '@/hooks/useBusinessTemplate';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar as CalendarIcon, Clock, MessageSquare, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ReservationQRCode } from './ReservationQRCode';

interface RestaurantBookingFlowProps {
  businessId: string;
  businessSlug?: string;
}

export function RestaurantBookingFlow({ businessId, businessSlug }: RestaurantBookingFlowProps) {
  const { t } = useBusinessTemplate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [formData, setFormData] = useState({
    time: '',
    party_size: 2,
    special_requests: '',
    party_name: '',
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [completedReservation, setCompletedReservation] = useState<any>(null);
  const [completedAppointment, setCompletedAppointment] = useState<any>(null);
  const [businessName, setBusinessName] = useState<string>('');

  const availableTimes = [
    '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
  ];

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileData) {
          setProfile(profileData);
          setFormData(prev => ({
            ...prev,
            name: `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim(),
            email: profileData.email || user.email || '',
            phone: profileData.phone || '',
          }));
        }
      }

      // Load business name
      const { data: businessData } = await supabase
        .from('businesses')
        .select('name')
        .eq('id', businessId)
        .single();

      if (businessData) setBusinessName(businessData.name);
    };
    loadUserData();
  }, [businessId]);

  const handleSubmit = async () => {
    if (!date || !formData.time) {
      toast({ title: 'Please select date and time', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      let patientId;
      if (user && profile) {
        // Use existing profile
        patientId = profile.id;
      } else {
        // Create guest profile
        const { data: guestProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: formData.name.split(' ')[0],
            last_name: formData.name.split(' ').slice(1).join(' '),
            email: formData.email,
            phone: formData.phone,
          })
          .select()
          .single();
        
        if (profileError) throw profileError;
        patientId = guestProfile.id;
      }

      // Get an active dentist for the business (required by appointments table)
      const { data: dentist } = await supabase
        .from('dentists')
        .select('id, profile_id, business_members!inner(business_id)')
        .eq('business_members.business_id', businessId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      if (!dentist) throw new Error('No staff available');

      // Create appointment
      const appointmentDateTime = new Date(date);
      const [hours, minutes] = formData.time.split(':');
      appointmentDateTime.setHours(parseInt(hours), parseInt(minutes));

      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .insert({
          business_id: businessId,
          patient_id: patientId,
          dentist_id: dentist.id,
          appointment_date: appointmentDateTime.toISOString(),
          reason: 'Dining Reservation',
          duration_minutes: 120,
          status: 'pending',
        })
        .select()
        .single();

      if (apptError) throw apptError;

      // Create table reservation
      const { data: reservationData, error: reservationError } = await supabase
        .from('table_reservations')
        .insert({
          appointment_id: appointment.id,
          party_size: formData.party_size,
          special_requests: formData.special_requests,
          reservation_status: 'confirmed',
        })
        .select()
        .single();

      if (reservationError) throw reservationError;

      setCompletedReservation(reservationData);
      setCompletedAppointment(appointment);
      setBookingComplete(true);
      toast({ title: 'Reservation created successfully!' });
    } catch (error: any) {
      toast({ title: 'Error creating reservation', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  if (bookingComplete && completedReservation && completedAppointment) {
    const appointmentDateTime = new Date(completedAppointment.appointment_date);

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <CheckCircle className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Reservation Confirmed!</h2>
            <p className="text-muted-foreground text-center">
              We've received your reservation for {formData.party_size} {formData.party_size === 1 ? 'guest' : 'guests'}
            </p>
          </CardContent>
        </Card>

        <ReservationQRCode
          reservation={completedReservation}
          appointmentDate={appointmentDateTime}
          partySize={formData.party_size}
          customerName={formData.name}
          businessName={businessName}
        />

        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-center text-muted-foreground">
              📧 A confirmation email with this QR code has been sent to {formData.email}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`h-2 w-16 rounded-full ${
              s <= step ? 'bg-primary' : 'bg-muted'
            }`}
          />
        ))}
      </div>

      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              How many guests?
            </CardTitle>
            <CardDescription>Select the number of people in your party</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((size) => (
                <Button
                  key={size}
                  variant={formData.party_size === size ? 'default' : 'outline'}
                  onClick={() => setFormData({ ...formData, party_size: size })}
                  className="h-20"
                >
                  <Users className="h-5 w-5 mr-2" />
                  {size}
                </Button>
              ))}
            </div>
            <div>
              <Label>Custom party size</Label>
              <Input
                type="number"
                min="1"
                value={formData.party_size}
                onChange={(e) => setFormData({ ...formData, party_size: parseInt(e.target.value) || 1 })}
              />
            </div>
            <Button onClick={() => setStep(2)} className="w-full" size="lg">
              Continue
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Select Date & Time
            </CardTitle>
            <CardDescription>Choose when you'd like to dine</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Select Date</Label>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                disabled={(date) => date < new Date()}
                className="rounded-md border"
              />
            </div>
            {date && (
              <div>
                <Label>Select Time</Label>
                <Select value={formData.time} onValueChange={(value) => setFormData({ ...formData, time: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose time" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTimes.map((time) => (
                      <SelectItem key={time} value={time}>
                        <Clock className="h-4 w-4 inline mr-2" />
                        {time}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(3)} className="flex-1" disabled={!date || !formData.time}>
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Special Requests
            </CardTitle>
            <CardDescription>Any dietary restrictions or preferences? (Optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              placeholder="E.g., vegetarian options, allergies, celebration, window seat..."
              rows={4}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                Back
              </Button>
              <Button onClick={() => setStep(4)} className="flex-1">
                Continue
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>{user ? 'Reservation Name' : 'Contact Information'}</CardTitle>
            <CardDescription>
              {user ? "What name should we use for your reservation?" : "We'll send you a confirmation"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user ? (
              <>
                <div>
                  <Label>Group/Party Name</Label>
                  <Input
                    value={formData.party_name}
                    onChange={(e) => setFormData({ ...formData, party_name: e.target.value })}
                    placeholder="e.g., Smith Family, Birthday Party, Team Dinner"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional: This helps our staff identify your reservation
                  </p>
                </div>
                <div className="border rounded-lg p-3 bg-muted/30">
                  <p className="text-sm font-medium mb-2">Confirmation will be sent to:</p>
                  <p className="text-sm">{formData.name}</p>
                  <p className="text-sm text-muted-foreground">{formData.email}</p>
                  {formData.phone && <p className="text-sm text-muted-foreground">{formData.phone}</p>}
                </div>
              </>
            ) : (
              <>
                <div>
                  <Label>Full Name *</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div>
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john@example.com"
                    required
                  />
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </>
            )}

            <div className="border-t pt-4 space-y-2">
              <h3 className="font-semibold">Reservation Summary</h3>
              <p className="text-sm"><strong>Party Size:</strong> {formData.party_size} {formData.party_size === 1 ? 'guest' : 'guests'}</p>
              <p className="text-sm"><strong>Date:</strong> {date && format(date, 'PPPP')}</p>
              <p className="text-sm"><strong>Time:</strong> {formData.time}</p>
              {formData.special_requests && (
                <p className="text-sm"><strong>Special Requests:</strong> {formData.special_requests}</p>
              )}
              {user && formData.party_name && (
                <p className="text-sm"><strong>Reservation Name:</strong> {formData.party_name}</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(3)} className="flex-1">
                Back
              </Button>
              <Button 
                onClick={handleSubmit} 
                className="flex-1" 
                disabled={loading || (!user && (!formData.name || !formData.email))}
              >
                {loading ? 'Creating Reservation...' : 'Confirm Reservation'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
