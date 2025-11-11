import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Calendar, ChevronRight, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface RecommendedDentistWidgetProps {
  dentistNames: string[];
  matchReason?: string;
  symptoms?: string;
  onSelectDentist: (dentist: any) => void;
  onSeeAlternatives: () => void;
}

interface DentistProfile {
  id: string;
  profile_id: string;
  first_name: string;
  last_name: string;
  specialty: string;
  bio?: string;
  profiles?: {
    avatar_url?: string;
  };
}

export const RecommendedDentistWidget = ({
  dentistNames,
  matchReason,
  symptoms,
  onSelectDentist,
  onSeeAlternatives,
}: RecommendedDentistWidgetProps) => {
  const [dentist, setDentist] = useState<DentistProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendedDentist();
  }, [dentistNames]);

  const fetchRecommendedDentist = async () => {
    if (!dentistNames || dentistNames.length === 0) return;

    try {
      const firstName = dentistNames[0].split(' ')[0];
      const lastName = dentistNames[0].split(' ').slice(1).join(' ');

      const { data, error } = await supabase
        .from("dentists")
        .select(`
          id,
          profile_id,
          first_name,
          last_name,
          specialty,
          bio,
          profiles:profile_id (
            avatar_url
          )
        `)
        .ilike('first_name', `%${firstName}%`)
        .ilike('last_name', `%${lastName}%`)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        setDentist(data as DentistProfile);
      }
    } catch (error) {
      console.error("Error fetching dentist:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg animate-pulse">
        <CardContent className="p-6">
          <div className="h-24 bg-muted rounded"></div>
        </CardContent>
      </Card>
    );
  }

  if (!dentist) return null;

  const getInitials = () => {
    return `${dentist.first_name?.charAt(0) || ''}${dentist.last_name?.charAt(0) || ''}`;
  };

  const getMatchReasonText = () => {
    if (matchReason) return matchReason;
    
    if (symptoms?.toLowerCase().includes('child') || symptoms?.toLowerCase().includes('enfant')) {
      return "Specialized in pediatric dentistry and excellent with children";
    }
    if (symptoms?.toLowerCase().includes('orthodontic') || symptoms?.toLowerCase().includes('braces')) {
      return "Expert in orthodontics and teeth alignment";
    }
    if (symptoms?.toLowerCase().includes('pain') || symptoms?.toLowerCase().includes('douleur')) {
      return "Available for urgent consultations and pain management";
    }
    return "Highly experienced in general dentistry and patient care";
  };

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3 pb-4 border-b">
            <div className="rounded-full bg-primary/10 p-3">
              <Star className="h-6 w-6 text-primary fill-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">Perfect Match Found</h3>
              <p className="text-sm text-muted-foreground">
                Based on your needs
              </p>
            </div>
          </div>

          {/* Dentist Profile */}
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-2 border-primary/20">
                <AvatarImage 
                  src={dentist.profiles?.avatar_url} 
                  alt={`Dr. ${dentist.first_name} ${dentist.last_name}`} 
                />
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-2">
                <div>
                  <h4 className="font-semibold text-lg">
                    Dr. {dentist.first_name} {dentist.last_name}
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    {dentist.specialty || 'General Dentist'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Recommended
                  </Badge>
                </div>
              </div>
            </div>

            {/* Bio */}
            {dentist.bio && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {dentist.bio}
              </p>
            )}

            {/* Match Reason */}
            <div className="bg-primary/5 rounded-lg p-3 space-y-1">
              <p className="text-xs font-medium text-primary/80 flex items-center gap-1">
                <Users className="h-3 w-3" />
                Why this match?
              </p>
              <p className="text-sm">
                {getMatchReasonText()}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2 pt-2">
            <Button 
              onClick={() => onSelectDentist(dentist)}
              className="w-full group"
              size="lg"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Book with Dr. {dentist.last_name}
              <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>

            <Button 
              onClick={onSeeAlternatives}
              variant="outline"
              className="w-full"
              size="sm"
            >
              See other available dentists
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
