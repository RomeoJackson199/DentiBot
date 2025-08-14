import { useState, useEffect } from "react";
import { Clock, Save, Plus, Trash2, Calendar, Coffee } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DentistAvailability {
  id?: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
  break_start_time?: string;
  break_end_time?: string;
}

interface VacationDay {
  id?: string;
  start_date: string;
  end_date: string;
  vacation_type: string;
  reason?: string;
  is_approved: boolean;
}

interface EnhancedAvailabilitySettingsProps {
  dentistId: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lundi', short: 'L' },
  { value: 2, label: 'Mardi', short: 'M' },
  { value: 3, label: 'Mercredi', short: 'M' },
  { value: 4, label: 'Jeudi', short: 'J' },
  { value: 5, label: 'Vendredi', short: 'V' },
  { value: 6, label: 'Samedi', short: 'S' },
  { value: 0, label: 'Dimanche', short: 'D' },
];

const VACATION_TYPES = [
  { value: 'vacation', label: 'Vacances', color: 'bg-blue-100 text-blue-800' },
  { value: 'sick', label: 'Congé maladie', color: 'bg-red-100 text-red-800' },
  { value: 'personal', label: 'Congé personnel', color: 'bg-green-100 text-green-800' },
];

export function EnhancedAvailabilitySettings({ dentistId }: EnhancedAvailabilitySettingsProps) {
  const [availability, setAvailability] = useState<DentistAvailability[]>([]);
  const [vacationDays, setVacationDays] = useState<VacationDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newVacation, setNewVacation] = useState<VacationDay>({
    start_date: '',
    end_date: '',
    vacation_type: 'vacation',
    reason: '',
    is_approved: true
  });
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([fetchAvailability(), fetchVacationDays()]);
  }, [dentistId]);

  const fetchAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('dentist_availability')
        .select('*')
        .eq('dentist_id', dentistId)
        .order('day_of_week');

      if (error) throw error;

      // Initialize with default availability for all days
      const defaultAvailability = DAYS_OF_WEEK.map(day => {
        const existing = data?.find(a => a.day_of_week === day.value);
        return existing || {
          day_of_week: day.value,
          start_time: '09:00',
          end_time: '17:00',
          is_available: day.value >= 1 && day.value <= 5, // Mon-Fri by default
          break_start_time: '12:00',
          break_end_time: '13:00',
        };
      });

      setAvailability(defaultAvailability);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de charger les horaires",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchVacationDays = async () => {
    try {
      const { data, error } = await supabase
        .from('dentist_vacation_days')
        .select('*')
        .eq('dentist_id', dentistId)
        .order('start_date', { ascending: false });

      if (error) throw error;
      setVacationDays(data || []);
    } catch (error) {
      console.error('Error fetching vacation days:', error);
    }
  };

  const updateAvailability = (dayIndex: number, field: keyof DentistAvailability, value: any) => {
    setAvailability(prev => 
      prev.map((day, index) => 
        index === dayIndex ? { ...day, [field]: value } : day
      )
    );
  };

  const saveAvailability = async () => {
    setSaving(true);
    try {
      // Delete existing availability for this dentist
      await supabase
        .from('dentist_availability')
        .delete()
        .eq('dentist_id', dentistId);

      // Insert new availability settings
      const availabilityData = availability
        .filter(day => day.is_available)
        .map(day => ({
          dentist_id: dentistId,
          day_of_week: day.day_of_week,
          start_time: day.start_time,
          end_time: day.end_time,
          is_available: day.is_available,
          break_start_time: day.break_start_time || null,
          break_end_time: day.break_end_time || null,
        }));

      if (availabilityData.length > 0) {
        const { error } = await supabase
          .from('dentist_availability')
          .insert(availabilityData);

        if (error) throw error;
      }

      toast({
        title: "Succès",
        description: "Horaires sauvegardés avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de sauvegarder les horaires",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const addVacationDay = async () => {
    if (!newVacation.start_date || !newVacation.end_date) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir toutes les dates",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('dentist_vacation_days')
        .insert({
          dentist_id: dentistId,
          ...newVacation
        })
        .select()
        .single();

      if (error) throw error;

      setVacationDays(prev => [data, ...prev]);
      setNewVacation({
        start_date: '',
        end_date: '',
        vacation_type: 'vacation',
        reason: '',
        is_approved: true
      });

      toast({
        title: "Succès",
        description: "Congé ajouté avec succès",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le congé",
        variant: "destructive",
      });
    }
  };

  const deleteVacationDay = async (id: string) => {
    try {
      const { error } = await supabase
        .from('dentist_vacation_days')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setVacationDays(prev => prev.filter(v => v.id !== id));
      toast({
        title: "Succès",
        description: "Congé supprimé",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le congé",
        variant: "destructive",
      });
    }
  };

  const getVacationTypeConfig = (type: string) => {
    return VACATION_TYPES.find(t => t.value === type) || VACATION_TYPES[0];
  };

  if (loading) {
    return <div className="flex justify-center p-8">Chargement des paramètres...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Clock className="h-6 w-6 text-primary" />
          <h2 className="text-xl sm:text-2xl font-bold">Gestion des Disponibilités</h2>
        </div>
        <Button 
          onClick={saveAvailability} 
          disabled={saving} 
          size="lg"
          className="h-12 px-6 rounded-xl bg-gradient-primary"
        >
          <Save className="h-5 w-5 mr-2" />
          {saving ? "Sauvegarde..." : "Sauvegarder"}
        </Button>
      </div>

      <Tabs defaultValue="schedule" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="schedule" className="text-sm sm:text-base">Horaires hebdomadaires</TabsTrigger>
          <TabsTrigger value="vacation" className="text-sm sm:text-base">Congés & Absences</TabsTrigger>
        </TabsList>

        <TabsContent value="schedule">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center text-lg sm:text-xl">
                <Calendar className="h-5 w-5 mr-2" />
                Planification hebdomadaire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Quick Preset Buttons - Improved layout */}
              <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                <span className="text-sm font-medium text-gray-700 block">Presets rapides:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 justify-start px-4 rounded-xl"
                    onClick={() => {
                      setAvailability(prev => prev.map(day => ({
                        ...day,
                        is_available: day.day_of_week >= 1 && day.day_of_week <= 5,
                        start_time: '09:00',
                        end_time: '17:00',
                        break_start_time: '12:00',
                        break_end_time: '13:00'
                      })));
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Lun-Ven 9h-17h
                  </Button>
                  <Button
                    variant="outline"
                    size="lg"
                    className="h-12 justify-start px-4 rounded-xl"
                    onClick={() => {
                      setAvailability(prev => prev.map(day => ({
                        ...day,
                        is_available: day.day_of_week >= 1 && day.day_of_week <= 6,
                        start_time: '08:00',
                        end_time: '18:00',
                        break_start_time: '12:00',
                        break_end_time: '13:00'
                      })));
                    }}
                  >
                    <Clock className="h-4 w-4 mr-2" />
                    Lun-Sam 8h-18h
                  </Button>
                </div>
              </div>

              {/* Day Schedule Grid */}
              <div className="grid gap-4">
                {DAYS_OF_WEEK.map((day, index) => {
                  const dayAvailability = availability[index];
                  
                  return (
                    <Card key={day.value} className={`border-2 transition-all ${dayAvailability.is_available ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'}`}>
                      <CardContent className="p-5">
                        <div className="space-y-4">
                          {/* Day Header */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${dayAvailability.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                {day.short}
                              </div>
                              <Label className="text-lg font-medium">{day.label}</Label>
                            </div>
                            <Switch
                              checked={dayAvailability.is_available}
                              onCheckedChange={(checked) => 
                                updateAvailability(index, 'is_available', checked)
                              }
                              className="scale-125"
                            />
                          </div>

                          {/* Time Settings - Improved responsive grid */}
                          {dayAvailability.is_available && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <Label htmlFor={`start-${day.value}`} className="text-sm font-medium">Début</Label>
                                <Input
                                  id={`start-${day.value}`}
                                  type="time"
                                  value={dayAvailability.start_time}
                                  onChange={(e) => 
                                    updateAvailability(index, 'start_time', e.target.value)
                                  }
                                  className="h-10 mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`end-${day.value}`} className="text-sm font-medium">Fin</Label>
                                <Input
                                  id={`end-${day.value}`}
                                  type="time"
                                  value={dayAvailability.end_time}
                                  onChange={(e) => 
                                    updateAvailability(index, 'end_time', e.target.value)
                                  }
                                  className="h-10 mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`break-start-${day.value}`} className="text-sm font-medium">
                                  <Coffee className="h-3 w-3 inline mr-1" />
                                  Pause début
                                </Label>
                                <Input
                                  id={`break-start-${day.value}`}
                                  type="time"
                                  value={dayAvailability.break_start_time || ''}
                                  onChange={(e) => 
                                    updateAvailability(index, 'break_start_time', e.target.value || null)
                                  }
                                  className="h-10 mt-1"
                                />
                              </div>
                              <div>
                                <Label htmlFor={`break-end-${day.value}`} className="text-sm font-medium">
                                  <Coffee className="h-3 w-3 inline mr-1" />
                                  Pause fin
                                </Label>
                                <Input
                                  id={`break-end-${day.value}`}
                                  type="time"
                                  value={dayAvailability.break_end_time || ''}
                                  onChange={(e) => 
                                    updateAvailability(index, 'break_end_time', e.target.value || null)
                                  }
                                  className="h-10 mt-1"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vacation">
          <div className="space-y-6">
            {/* Add New Vacation */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Ajouter un congé
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="start-date">Date de début</Label>
                    <Input
                      id="start-date"
                      type="date"
                      value={newVacation.start_date}
                      onChange={(e) => setNewVacation(prev => ({ ...prev, start_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">Date de fin</Label>
                    <Input
                      id="end-date"
                      type="date"
                      value={newVacation.end_date}
                      onChange={(e) => setNewVacation(prev => ({ ...prev, end_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Type de congé</Label>
                    <Select 
                      value={newVacation.vacation_type} 
                      onValueChange={(value: 'vacation' | 'sick' | 'personal') => 
                        setNewVacation(prev => ({ ...prev, vacation_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {VACATION_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={addVacationDay} className="w-full">
                      <Plus className="h-4 w-4 mr-2" />
                      Ajouter
                    </Button>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="vacation-reason">Raison (optionnel)</Label>
                  <Textarea
                    id="vacation-reason"
                    placeholder="Précisez la raison du congé..."
                    value={newVacation.reason || ''}
                    onChange={(e) => setNewVacation(prev => ({ ...prev, reason: e.target.value }))}
                    rows={2}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Vacation List */}
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Congés programmés</CardTitle>
              </CardHeader>
              <CardContent>
                {vacationDays.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Aucun congé programmé</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {vacationDays.map((vacation) => {
                      const typeConfig = getVacationTypeConfig(vacation.vacation_type);
                      const startDate = new Date(vacation.start_date);
                      const endDate = new Date(vacation.end_date);
                      const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      
                      return (
                        <Card key={vacation.id} className="border">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div className="space-y-2">
                                <div className="flex items-center space-x-3">
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}>
                                    {typeConfig.label}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    {duration} jour{duration > 1 ? 's' : ''}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-2 text-sm">
                                  <span>Du {startDate.toLocaleDateString('fr-FR')}</span>
                                  <span>au {endDate.toLocaleDateString('fr-FR')}</span>
                                </div>
                                {vacation.reason && (
                                  <p className="text-sm text-muted-foreground">{vacation.reason}</p>
                                )}
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => vacation.id && deleteVacationDay(vacation.id)}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}