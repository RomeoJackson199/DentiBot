import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Dentist {
  id: string;
  profile_id: string;
  specialization: string;
  is_active: boolean;
  profiles: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

interface DentistSelectionProps {
  onSelectDentist: (dentist: Dentist) => void;
  selectedDentistId?: string;
}

export const DentistSelection = ({ onSelectDentist, selectedDentistId }: DentistSelectionProps) => {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDentists();
  }, []);

  const fetchDentists = async () => {
    try {
      const { data, error } = await supabase
        .from("dentists")
        .select(`
          id,
          profile_id,
          specialization,
          is_active,
          profiles:profile_id (
            first_name,
            last_name,
            email
          )
        `)
        .eq("is_active", true);

      if (error) throw error;
      setDentists(data || []);
    } catch (error) {
      console.error("Error fetching dentists:", error);
      toast({
        title: "Erreur",
        description: "Impossible de charger la liste des dentistes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getDentistInitials = (dentist: Dentist) => {
    return `${dentist.profiles.first_name[0]}${dentist.profiles.last_name[0]}`;
  };

  const getSpecializationColor = (specialization: string | null) => {
    switch (specialization?.toLowerCase()) {
      case 'orthodontie':
        return 'bg-blue-100 text-blue-800';
      case 'chirurgie':
        return 'bg-red-100 text-red-800';
      case 'endodontie':
        return 'bg-green-100 text-green-800';
      case 'parodontologie':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choisissez votre dentiste
        </h3>
        <p className="text-sm text-gray-600">
          Sélectionnez le dentiste avec qui vous souhaitez prendre rendez-vous
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dentists.map((dentist) => (
          <Card 
            key={dentist.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              selectedDentistId === dentist.id 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:bg-gray-50'
            }`}
            onClick={() => onSelectDentist(dentist)}
          >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={`https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=150&h=150&fit=crop&crop=face`} 
                      alt={`Dr ${dentist.profiles.first_name} ${dentist.profiles.last_name}`}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                      {getDentistInitials(dentist)}
                    </AvatarFallback>
                  </Avatar>
                  {selectedDentistId === dentist.id && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-lg font-semibold text-gray-900 truncate">
                    Dr {dentist.profiles.first_name} {dentist.profiles.last_name}
                  </h4>
                  
                  <Badge 
                    variant="secondary" 
                    className={`mt-1 ${getSpecializationColor(dentist.specialization)}`}
                  >
                    {dentist.specialization || 'Dentiste généraliste'}
                  </Badge>

                  <div className="flex items-center mt-3 space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>4.8</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Dispo aujourd'hui</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>Cabinet dentaire du centre</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Prochaine disponibilité</span>
                  <span className="text-sm font-medium text-green-600">Aujourd'hui 14h30</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};