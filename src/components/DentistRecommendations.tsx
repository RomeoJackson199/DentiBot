import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { 
  Star, 
  Clock, 
  MessageCircle, 
  Award,
  TrendingUp,
  MapPin,
  Phone,
  Calendar
} from "lucide-react";

interface DentistRecommendation {
  id: string;
  profile_id: string;
  specialization: string;
  average_rating: number;
  total_ratings: number;
  expertise_score: number;
  communication_score: number;
  wait_time_score: number;
  profiles: {
    first_name: string;
    last_name: string;
    phone?: string;
    address?: string;
  };
  recommendation_score?: number;
  recommendation_reason?: string;
}

interface DentistRecommendationsProps {
  urgencyLevel?: 1 | 2 | 3 | 4 | 5;
  symptoms?: string[];
  onSelectDentist: (dentist: DentistRecommendation) => void;
}

export const DentistRecommendations = ({ 
  urgencyLevel = 3, 
  symptoms = [], 
  onSelectDentist 
}: DentistRecommendationsProps) => {
  const { t } = useLanguageDetection();
  const [recommendations, setRecommendations] = useState<DentistRecommendation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [urgencyLevel, symptoms]);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      
      const { data: dentists, error } = await supabase
        .from('dentists')
        .select(`
          id,
          profile_id,
          specialization,
          average_rating,
          total_ratings,
          expertise_score,
          communication_score,
          wait_time_score,
          profiles (
            first_name,
            last_name,
            phone,
            address
          )
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Calculate recommendation scores
      const scoredDentists = (dentists || []).map(dentist => {
        const recommendation = calculateRecommendationScore(dentist, urgencyLevel, symptoms);
        return {
          ...dentist,
          recommendation_score: recommendation.score,
          recommendation_reason: recommendation.reason
        };
      });

      // Sort by recommendation score
      scoredDentists.sort((a, b) => (b.recommendation_score || 0) - (a.recommendation_score || 0));

      setRecommendations(scoredDentists);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateRecommendationScore = (
    dentist: any, 
    urgency: number, 
    symptoms: string[]
  ): { score: number; reason: string } => {
    let score = 0;
    const reasons = [];

    // Base rating weight (40% of total score)
    const ratingScore = (dentist.average_rating || 0) * 8;
    score += ratingScore;
    if (dentist.average_rating >= 4.5) {
      reasons.push("Excellentes évaluations");
    }

    // Experience weight (20% of total score) - based on total ratings
    const experienceScore = Math.min((dentist.total_ratings || 0) * 2, 20);
    score += experienceScore;
    if (dentist.total_ratings >= 10) {
      reasons.push("Dentiste expérimenté");
    }

    // Specialization matching (20% of total score)
    const specializationScore = getSpecializationScore(dentist.specialization, symptoms, urgency);
    score += specializationScore.score;
    if (specializationScore.reason) {
      reasons.push(specializationScore.reason);
    }

    // Communication score for urgent cases (10% of total score)
    if (urgency >= 4) {
      const commScore = (dentist.communication_score || 0) * 2;
      score += commScore;
      if (dentist.communication_score >= 4.5) {
        reasons.push("Excellente communication");
      }
    }

    // Wait time score for urgent cases (10% of total score)
    if (urgency >= 3) {
      const waitScore = (dentist.wait_time_score || 0) * 2;
      score += waitScore;
      if (dentist.wait_time_score >= 4.5) {
        reasons.push("Temps d'attente courts");
      }
    }

    return {
      score: Math.round(score),
      reason: reasons.length > 0 ? reasons.join(", ") : "Dentiste recommandé"
    };
  };

  const getSpecializationScore = (
    specialization: string,
    symptoms: string[],
    urgency: number
  ): { score: number; reason?: string } => {
    const spec = specialization?.toLowerCase() || '';
    
    // Emergency and oral surgery for trauma/bleeding
    if (symptoms.includes('trauma') || symptoms.includes('bleeding')) {
      if (spec.includes('urgence') || spec.includes('chirurgie')) {
        return { score: 20, reason: "Spécialiste des urgences" };
      }
    }

    // Endodontist for severe pain
    if (urgency >= 4 && spec.includes('endodontie')) {
      return { score: 18, reason: "Spécialiste de la douleur dentaire" };
    }

    // Periodontist for gum issues
    if (symptoms.includes('bleeding') || symptoms.includes('swelling')) {
      if (spec.includes('parodontie')) {
        return { score: 18, reason: "Spécialiste des gencives" };
      }
    }

    // General dentistry gets standard score
    if (spec.includes('générale') || spec.includes('general')) {
      return { score: 10, reason: "Dentiste généraliste" };
    }

    return { score: 5 };
  };

  const StarRating = ({ rating, size = "sm" }: { rating: number; size?: "sm" | "lg" }) => {
    const starSize = size === "lg" ? "h-5 w-5" : "h-4 w-4";
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= rating
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getRecommendationBadge = (score: number) => {
    if (score >= 80) return { text: "⭐ Top Recommandé", variant: "default" as const };
    if (score >= 70) return { text: "🏆 Hautement Recommandé", variant: "secondary" as const };
    if (score >= 60) return { text: "✅ Recommandé", variant: "outline" as const };
    return { text: "Disponible", variant: "outline" as const };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-primary" />
          Dentistes Recommandés
        </h3>
        {urgencyLevel >= 4 && (
          <Badge variant="destructive" className="animate-pulse">
            Urgence Élevée
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {recommendations.slice(0, 5).map((dentist) => {
          const badge = getRecommendationBadge(dentist.recommendation_score || 0);
          
          return (
            <Card key={dentist.id} className="hover:shadow-md transition-shadow border-l-4 border-l-primary/20">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-lg">
                          Dr. {dentist.profiles.first_name} {dentist.profiles.last_name}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {dentist.specialization}
                        </p>
                      </div>
                      <Badge variant={badge.variant}>
                        {badge.text}
                      </Badge>
                    </div>

                    {/* Ratings */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-400" />
                        <div>
                          <StarRating rating={dentist.average_rating} />
                          <p className="text-xs text-muted-foreground">
                            {dentist.total_ratings} avis
                          </p>
                        </div>
                      </div>

                      {dentist.expertise_score > 0 && (
                        <div className="flex items-center space-x-2">
                          <Award className="h-4 w-4 text-blue-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {dentist.expertise_score.toFixed(1)}/5
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Expertise
                            </p>
                          </div>
                        </div>
                      )}

                      {dentist.wait_time_score > 0 && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-green-500" />
                          <div>
                            <p className="text-sm font-medium">
                              {dentist.wait_time_score.toFixed(1)}/5
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ponctualité
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Recommendation reason */}
                    {dentist.recommendation_reason && (
                      <div className="flex items-center space-x-2 text-sm text-blue-600 bg-blue-50 p-2 rounded">
                        <TrendingUp className="h-4 w-4" />
                        <span>{dentist.recommendation_reason}</span>
                      </div>
                    )}

                    {/* Contact info */}
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      {dentist.profiles.phone && (
                        <div className="flex items-center space-x-1">
                          <Phone className="h-4 w-4" />
                          <span>{dentist.profiles.phone}</span>
                        </div>
                      )}
                      {dentist.profiles.address && (
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-4 w-4" />
                          <span className="truncate">{dentist.profiles.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="mt-4 pt-3 border-t">
                  <Button 
                    onClick={() => onSelectDentist(dentist)}
                    className="w-full"
                    variant={dentist.recommendation_score && dentist.recommendation_score >= 80 ? "default" : "outline"}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Choisir ce dentiste
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {recommendations.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">
              Aucun dentiste disponible pour le moment.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};