import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, MapPin, Clock, Check, User, Award, Heart, Shield } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

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
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');
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

  const getSpecialtyInfo = (specialty: string | null) => {
    switch (specialty?.toLowerCase()) {
      case 'orthodontics':
        return {
          name: 'Orthodontics',
          color: 'bg-gradient-to-r from-blue-500 to-purple-600',
          icon: '🦷',
          description: 'Braces & teeth alignment'
        };
      case 'pediatric':
        return {
          name: 'Pediatric',
          color: 'bg-gradient-to-r from-pink-500 to-rose-600',
          icon: '👶',
          description: 'Children\'s dental care'
        };
      case 'general':
        return {
          name: 'General',
          color: 'bg-gradient-to-r from-green-500 to-emerald-600',
          icon: '🦷',
          description: 'General dental care'
        };
      default:
        return {
          name: 'General',
          color: 'bg-gradient-to-r from-gray-500 to-slate-600',
          icon: '🦷',
          description: 'Dental care'
        };
    }
  };

  const isRecommended = (dentist: Dentist) => {
    if (!recommendedDentist) return false;
    const dentistFullName = `${dentist.profiles.first_name} ${dentist.profiles.last_name}`;
    
    if (Array.isArray(recommendedDentist)) {
      return recommendedDentist.includes(dentistFullName);
    }
    return recommendedDentist === dentistFullName;
  };

  const filteredDentists = selectedSpecialty === 'all' 
    ? dentists 
    : dentists.filter(dentist => dentist.specialty?.toLowerCase() === selectedSpecialty);

  const specialties = [
    { key: 'all', label: 'All Specialties', icon: '🦷' },
    { key: 'pediatric', label: 'Pediatric', icon: '👶' },
    { key: 'orthodontics', label: 'Orthodontics', icon: '🦷' },
    { key: 'general', label: 'General', icon: '🦷' }
  ];

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {specialties.map((specialty) => (
            <Skeleton key={specialty.key} className="h-10 w-24 rounded-full" />
          ))}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Specialty Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {specialties.map((specialty) => (
          <Button
            key={specialty.key}
            variant={selectedSpecialty === specialty.key ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSpecialty(specialty.key)}
            className="whitespace-nowrap rounded-full"
          >
            <span className="mr-2">{specialty.icon}</span>
            {specialty.label}
          </Button>
        ))}
      </div>

      {/* Dentists Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDentists.map((dentist) => {
          const specialtyInfo = getSpecialtyInfo(dentist.specialty);
          const isSelected = selectedDentistId === dentist.id;
          const isRecommendedDentist = isRecommended(dentist);

          return (
            <Card 
              key={dentist.id} 
              className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer ${
                isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:scale-105'
              } ${isRecommendedDentist ? 'border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50' : ''}`}
              onClick={() => onSelectDentist(dentist)}
            >
              {isRecommendedDentist && (
                <div className="absolute top-2 right-2 z-10">
                  <Badge className="bg-yellow-500 text-white border-0">
                    <Star className="w-3 h-3 mr-1" />
                    Recommended
                  </Badge>
                </div>
              )}

              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${getDentistInitials(dentist)}`} />
                    <AvatarFallback className={`${specialtyInfo.color} text-white font-semibold`}>
                      {getDentistInitials(dentist)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg font-semibold truncate">
                      Dr. {dentist.profiles.first_name} {dentist.profiles.last_name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">{specialtyInfo.name}</p>
                  </div>
                  {isSelected && (
                    <div className="flex-shrink-0">
                      <Check className="w-5 h-5 text-primary" />
                    </div>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* Specialty Badge */}
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className={`${specialtyInfo.color} text-white border-0`}>
                    <span className="mr-1">{specialtyInfo.icon}</span>
                    {specialtyInfo.name}
                  </Badge>
                </div>

                {/* Specializations */}
                <div className="space-y-2">
                  {dentist.specialty?.toLowerCase() === 'pediatric' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Heart className="w-4 h-4 text-pink-500" />
                      <span>Child-friendly approach</span>
                    </div>
                  )}
                  {dentist.specialty?.toLowerCase() === 'orthodontics' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Award className="w-4 h-4 text-blue-500" />
                      <span>Braces & Invisalign</span>
                    </div>
                  )}
                  {dentist.specialty?.toLowerCase() === 'general' && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Shield className="w-4 h-4 text-green-500" />
                      <span>General & emergency care</span>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full mt-3" 
                  variant={isSelected ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDentist(dentist);
                  }}
                >
                  {isSelected ? 'Selected' : 'Select Dentist'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredDentists.length === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-4">🦷</div>
          <h3 className="text-lg font-semibold mb-2">No dentists found</h3>
          <p className="text-muted-foreground">Try changing the specialty filter or contact support.</p>
        </div>
      )}
    </div>
  );
};