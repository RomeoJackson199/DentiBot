import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBusinessContext } from '@/hooks/useBusinessContext';
import { Search, Plus, User, Clock, Star } from 'lucide-react';
import { format, addMinutes } from 'date-fns';

interface WalkInManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preselectedStylistId?: string;
}

interface ClientSearchResult {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  lastVisit: Date | null;
  lastService: string | null;
  preferredStylistId: string | null;
  lifetimeValue: number;
}

interface AvailableStylist {
  id: string;
  name: string;
  profilePhoto: string | null;
  status: 'free' | 'busy';
  finishTime?: Date;
  specialties: string[];
  isPreferred: boolean;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export function WalkInManager({ open, onOpenChange, preselectedStylistId }: WalkInManagerProps) {
  const { businessId } = useBusinessContext();
  const { toast } = useToast();

  const [step, setStep] = useState<'search' | 'service' | 'stylist'>('search');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ClientSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // New client fields
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');

  // Selected data
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStylist, setSelectedStylist] = useState<string | null>(preselectedStylistId || null);

  const [services, setServices] = useState<Service[]>([]);
  const [availableStylists, setAvailableStylists] = useState<AvailableStylist[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (open && businessId) {
      loadServices();
    }
  }, [open, businessId]);

  useEffect(() => {
    if (step === 'stylist' && selectedClient) {
      loadAvailableStylists();
    }
  }, [step, selectedClient]);

  const loadServices = async () => {
    if (!businessId) return;

    const { data, error } = await supabase
      .from('business_services')
      .select('id, name, duration_minutes, price_cents')
      .eq('business_id', businessId)
      .eq('is_retail', false)
      .eq('is_active', true)
      .order('name');

    if (!error && data) {
      setServices(
        data.map((s) => ({
          id: s.id,
          name: s.name,
          duration: s.duration_minutes || 30,
          price: s.price_cents / 100,
        }))
      );
    }
  };

  const loadAvailableStylists = async () => {
    if (!businessId) return;

    // Get all stylists
    const { data: membersData } = await supabase
      .from('business_members')
      .select('profile_id')
      .eq('business_id', businessId);

    if (!membersData) return;

    const { data: stylistsData } = await supabase
      .from('dentists')
      .select('id, specialization, profiles(first_name, last_name)')
      .in('profile_id', membersData.map((m) => m.profile_id))
      .eq('is_active', true);

    if (!stylistsData) return;

    // Get status for each
    const stylistsWithStatus = await Promise.all(
      stylistsData.map(async (stylist) => {
        const { data: statusData } = await supabase.rpc('get_stylist_status', {
          stylist_id_param: stylist.id,
          business_id_param: businessId,
        });

        const status = statusData?.[0];

        const profile = Array.isArray(stylist.profiles) ? stylist.profiles[0] : stylist.profiles;
        const firstName = profile?.first_name || '';
        const lastName = profile?.last_name || '';

        return {
          id: stylist.id,
          name: `${firstName} ${lastName}`,
          profilePhoto: null,
          status: status?.status || 'free',
          finishTime: status?.finish_time ? new Date(status.finish_time) : undefined,
          specialties: [stylist.specialization].filter(Boolean),
          isPreferred: selectedClient?.preferredStylistId === stylist.id,
        };
      })
    );

    // Sort: preferred first, then free, then busy
    stylistsWithStatus.sort((a, b) => {
      if (a.isPreferred && !b.isPreferred) return -1;
      if (!a.isPreferred && b.isPreferred) return 1;
      if (a.status === 'free' && b.status !== 'free') return -1;
      if (a.status !== 'free' && b.status === 'free') return 1;
      return 0;
    });

    setAvailableStylists(stylistsWithStatus);
  };

  const handleSearch = async () => {
    if (!businessId || searchQuery.length < 2) return;

    setIsSearching(true);

    try {
      // Search profiles by name or phone
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          first_name,
          last_name,
          phone,
          email
        `)
        .or(
          `first_name.ilike.%${searchQuery}%,last_name.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`
        )
        .limit(10);

      if (error) throw error;

      // Get last appointment date for each profile
      const profilesWithHistory = await Promise.all(
        data.map(async (p) => {
          const { data: lastAppt } = await supabase
            .from('appointments')
            .select('appointment_date')
            .eq('patient_id', p.id)
            .order('appointment_date', { ascending: false })
            .limit(1)
            .single();

          return {
            id: p.id,
            firstName: p.first_name || '',
            lastName: p.last_name || '',
            phone: p.phone,
            email: p.email,
            lastVisit: lastAppt?.appointment_date ? new Date(lastAppt.appointment_date) : null,
            lastService: null,
            preferredStylistId: null,
            lifetimeValue: 0,
          };
        })
      );

      setSearchResults(profilesWithHistory);
    } catch (error) {
      console.error('Search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Could not search clients',
        variant: 'destructive',
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleNewClient = () => {
    if (!newClientName.trim()) {
      toast({
        title: 'Name Required',
        description: 'Please enter client name',
        variant: 'destructive',
      });
      return;
    }

    // Create temporary client object
    const tempClient: ClientSearchResult = {
      id: 'new',
      firstName: newClientName.split(' ')[0] || newClientName,
      lastName: newClientName.split(' ').slice(1).join(' ') || '',
      phone: newClientPhone,
      email: null,
      lastVisit: null,
      lastService: null,
      preferredStylistId: null,
      lifetimeValue: 0,
    };

    setSelectedClient(tempClient);
    setStep('service');
  };

  const handleClientSelect = (client: ClientSearchResult) => {
    setSelectedClient(client);
    setStep('service');
  };

  const handleServiceSelect = (service: Service) => {
    setSelectedService(service);
    setStep('stylist');
  };

  const handleComplete = async () => {
    if (!businessId || !selectedClient || !selectedService || !selectedStylist) return;

    setIsProcessing(true);

    try {
      let profileId = selectedClient.id;

      // If new client, create profile first
      if (selectedClient.id === 'new') {
        const { data: newProfile, error: profileError } = await supabase
          .from('profiles')
          .insert({
            first_name: selectedClient.firstName,
            last_name: selectedClient.lastName,
            phone: selectedClient.phone,
            role: 'patient',
          })
          .select()
          .single();

        if (profileError) throw profileError;
        profileId = newProfile.id;
      }

      // Create appointment for NOW
      const appointmentTime = new Date();
      const endTime = addMinutes(appointmentTime, selectedService.duration);

      const { data: appointment, error: apptError } = await supabase
        .from('appointments')
        .insert({
          patient_id: profileId,
          dentist_id: selectedStylist,
          business_id: businessId,
          appointment_date: appointmentTime.toISOString(),
          service_id: selectedService.id,
          duration_minutes: selectedService.duration,
          reason: selectedService.name,
          status: 'in_progress',
          patient_name: `${selectedClient.firstName} ${selectedClient.lastName}`,
        })
        .select()
        .single();

      if (apptError) throw apptError;

      toast({
        title: 'Walk-in Added!',
        description: `${selectedClient.firstName} assigned to stylist`,
      });

      // Reset and close
      handleReset();
      onOpenChange(false);
    } catch (error) {
      console.error('Walk-in error:', error);
      toast({
        title: 'Failed',
        description: error instanceof Error ? error.message : 'Could not add walk-in',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setStep('search');
    setSearchQuery('');
    setSearchResults([]);
    setNewClientName('');
    setNewClientPhone('');
    setSelectedClient(null);
    setSelectedService(null);
    setSelectedStylist(preselectedStylistId || null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">🚶 Add Walk-in</DialogTitle>
        </DialogHeader>

        {/* STEP 1: Search or New Client */}
        {step === 'search' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Search Existing Client</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Name or phone..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="pl-8"
                  />
                </div>
                <Button onClick={handleSearch} disabled={isSearching}>
                  Search
                </Button>
              </div>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="space-y-2">
                {searchResults.map((client) => (
                  <Card
                    key={client.id}
                    className="p-4 cursor-pointer hover:bg-accent"
                    onClick={() => handleClientSelect(client)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{client.phone}</p>
                        {client.lastVisit && (
                          <p className="text-xs text-muted-foreground">
                            Last visit: {format(client.lastVisit, 'MMM d, yyyy')}
                          </p>
                        )}
                      </div>
                      {client.lifetimeValue > 0 && (
                        <Badge variant="secondary">€{client.lifetimeValue.toFixed(0)}</Badge>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* New Client */}
            <div className="space-y-3">
              <Label>New Client</Label>
              <Input
                placeholder="Full name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
              />
              <Input
                placeholder="Phone (optional)"
                value={newClientPhone}
                onChange={(e) => setNewClientPhone(e.target.value)}
              />
              <Button className="w-full" onClick={handleNewClient}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Client
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Select Service */}
        {step === 'service' && selectedClient && (
          <div className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Client:</p>
              <p className="font-semibold">
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
            </div>

            <Label className="text-lg">Select Service</Label>
            <div className="grid grid-cols-2 gap-3">
              {services.map((service) => (
                <Card
                  key={service.id}
                  className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleServiceSelect(service)}
                >
                  <p className="font-semibold">{service.name}</p>
                  <p className="text-sm text-muted-foreground">{service.duration} min</p>
                  <p className="text-lg font-bold text-primary mt-2">€{service.price}</p>
                </Card>
              ))}
            </div>

            <Button variant="outline" className="w-full" onClick={() => setStep('search')}>
              Back
            </Button>
          </div>
        )}

        {/* STEP 3: Select Stylist */}
        {step === 'stylist' && selectedClient && selectedService && (
          <div className="space-y-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Client:</p>
              <p className="font-semibold">
                {selectedClient.firstName} {selectedClient.lastName}
              </p>
              <p className="text-sm text-muted-foreground">
                {selectedService.name} ({selectedService.duration} min)
              </p>
            </div>

            <Label className="text-lg">Assign to Stylist</Label>

            <div className="space-y-3">
              {availableStylists.map((stylist) => (
                <Card
                  key={stylist.id}
                  className={`p-4 cursor-pointer transition-all ${
                    selectedStylist === stylist.id
                      ? 'ring-2 ring-primary'
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedStylist(stylist.id)}
                >
                  <div className="flex items-center gap-3">
                    {stylist.profilePhoto ? (
                      <img
                        src={stylist.profilePhoto}
                        className="w-12 h-12 rounded-full object-cover"
                        alt={stylist.name}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                        {stylist.name
                          .split(' ')
                          .map((n) => n[0])
                          .join('')}
                      </div>
                    )}

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{stylist.name}</p>
                        {stylist.isPreferred && (
                          <Badge variant="secondary" className="text-xs">
                            <Star className="h-3 w-3 mr-1" />
                            Preferred
                          </Badge>
                        )}
                        {stylist.status === 'free' ? (
                          <Badge className="bg-green-500">🟢 Free</Badge>
                        ) : (
                          <Badge className="bg-red-500">🔴 Busy</Badge>
                        )}
                      </div>

                      {stylist.status === 'busy' && stylist.finishTime && (
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Free at {format(stylist.finishTime, 'h:mm a')}
                        </p>
                      )}

                      {stylist.status === 'free' && (
                        <p className="text-sm text-green-600 font-medium">
                          Available now!
                        </p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('service')}>
                Back
              </Button>
              <Button
                className="flex-1"
                onClick={handleComplete}
                disabled={!selectedStylist || isProcessing}
              >
                {isProcessing ? 'Adding...' : 'Start Now'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
