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
  specialty: string;
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
  recommendedDentist?: string[] | string | null;
}

export const DentistSelection = ({ onSelectDentist, selectedDentistId, recommendedDentist }: DentistSelectionProps) => {
  const [dentists, setDentists] = useState<Dentist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchDentists = async () => {
      try {
        const { data, error } = await supabase
          .from("dentists")
          .select(`
            *,
            profiles:profile_id (
              first_name,
              last_name,
              email
            )
          `)
          .eq("is_active", true);

        if (error) {
          console.error("Error fetching dentists:", error);
          toast({
            title: "Error",
            description: "Unable to load dentists. Please try again.",
            variant: "destructive",
          });
          return;
        }

        setDentists(data || []);
      } catch (error) {
        console.error("Error:", error);
        toast({
          title: "Error",
          description: "Unable to load dentists. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDentists();
  }, [toast]);

  const getDentistInitials = (dentist: Dentist) => {
    return `${dentist.profiles.first_name[0]}${dentist.profiles.last_name[0]}`;
  };

  const getSpecialtyColor = (specialty: string | null) => {
    switch (specialty?.toLowerCase()) {
      case 'orthodontics':
        return 'bg-blue-100 text-blue-800';
      case 'oral surgery':
        return 'bg-red-100 text-red-800';
      case 'endodontics':
        return 'bg-green-100 text-green-800';
      case 'periodontics':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isRecommended = (dentist: Dentist) => {
    if (!recommendedDentist) return false;
    const dentistFullName = `${dentist.profiles.first_name} ${dentist.profiles.last_name}`;
    
    // Handle both string and array formats
    if (Array.isArray(recommendedDentist)) {
      return recommendedDentist.includes(dentistFullName);
    }
    return dentistFullName === recommendedDentist;
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
            Choose your dentist
          </h3>
          <p className="text-sm text-gray-600">
            {recommendedDentist && (Array.isArray(recommendedDentist) ? recommendedDentist.length > 1 : true) 
              ? "We've highlighted our recommendations based on your needs" 
              : "Select the dentist you'd like to book an appointment with"}
          </p>
        </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {dentists.map((dentist) => {
          const recommended = isRecommended(dentist);
          return (
            <Card 
              key={dentist.id} 
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-105 ${
                selectedDentistId === dentist.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : recommended
                  ? 'ring-2 ring-green-500 bg-green-50 shadow-lg'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onSelectDentist(dentist)}
            >
            <CardContent className="p-6">
              <div className="flex items-start space-x-4">
                <div className="relative">
                  <Avatar className="w-16 h-16">
                    <AvatarImage 
                      src={`https://images.unsplash.com/photo-155983973420${dentist.id}?w=150&h=150&fit=crop&crop=face`} 
                      alt={`Dr ${dentist.profiles.first_name} ${dentist.profiles.last_name}`}
                    />
                    <AvatarFallback className="bg-blue-100 text-blue-800 font-semibold">
                      {getDentistInitials(dentist)}
                    </AvatarFallback>
                  </Avatar>
                  {recommended && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                  {selectedDentistId === dentist.id && !recommended && (
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-lg font-semibold text-gray-900 truncate">
                      Dr {dentist.profiles.first_name} {dentist.profiles.last_name}
                    </h4>
                    {recommended && (
                      <Badge variant="default" className="bg-green-500 text-white text-xs">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  
                  <Badge 
                    variant="secondary" 
                    className={`mt-1 ${getSpecialtyColor(dentist.specialty)}`}
                  >
                    {dentist.specialty || 'General Dentist'}
                  </Badge>

                  <div className="flex items-center mt-3 space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-400 mr-1" />
                      <span>4.8</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>Available today</span>
                    </div>
                  </div>

                  <div className="flex items-center mt-2 text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1" />
                    <span>Downtown Dental Office</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Next availability</span>
                  <span className="text-sm font-medium text-green-600">Today 2:30 PM</span>
                </div>
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>
    </div>
  );
};