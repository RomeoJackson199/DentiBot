import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { computeAverageRating } from "@/lib/utils";
import { 
  Star, 
  MessageCircle, 
  Clock, 
  Award,
  User,
  Calendar,
  TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { fr, nl, enUS } from "date-fns/locale";

interface DentistRating {
  id: string;
  rating: number;
  review?: string;
  expertise_rating?: number;
  communication_rating?: number;
  wait_time_rating?: number;
  created_at: string;
  patient_id: string;
  profiles?: {
    first_name: string;
    last_name: string;
  };
}

interface DentistReviewsProps {
  dentistId: string;
  compact?: boolean;
}

export const DentistReviews = ({ dentistId, compact = false }: DentistReviewsProps) => {
  const { language } = useLanguageDetection();
  const [reviews, setReviews] = useState<DentistRating[]>([]);
  const [stats, setStats] = useState({
    averageRating: 0,
    totalReviews: 0,
    averageExpertise: 0,
    averageCommunication: 0,
    averageWaitTime: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, [dentistId]);

  const fetchReviews = async () => {
    try {
      setLoading(true);

      // Fetch reviews - simplified query to avoid relation issues
      const { data: reviewsData, error } = await supabase
        .from('dentist_ratings')
        .select(`
          id,
          rating,
          review,
          expertise_rating,
          communication_rating,
          wait_time_rating,
          created_at,
          patient_id
        `)
        .eq('dentist_id', dentistId)
        .order('created_at', { ascending: false })
        .limit(compact ? 3 : 10);

      if (error) throw error;

      const reviews = (reviewsData || []).map(review => ({
        ...review,
        profiles: { first_name: 'Patient', last_name: '' } // Anonymous for privacy
      }));
      setReviews(reviews);

      // Calculate statistics
      if (reviews.length > 0) {
        const avgRating = computeAverageRating(reviews);
        const avgExpertise =
          reviews.filter(r => r.expertise_rating).reduce((sum, r) => sum + (r.expertise_rating || 0), 0) /
            (reviews.filter(r => r.expertise_rating).length || 1);
        const avgCommunication =
          reviews.filter(r => r.communication_rating).reduce((sum, r) => sum + (r.communication_rating || 0), 0) /
            (reviews.filter(r => r.communication_rating).length || 1);
        const avgWaitTime =
          reviews.filter(r => r.wait_time_rating).reduce((sum, r) => sum + (r.wait_time_rating || 0), 0) /
            (reviews.filter(r => r.wait_time_rating).length || 1);

        setStats({
          averageRating: avgRating,
          totalReviews: reviews.length,
          averageExpertise: avgExpertise,
          averageCommunication: avgCommunication,
          averageWaitTime: avgWaitTime
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ rating, showText = false }: { rating: number; showText?: boolean }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
      {showText && (
        <span className="text-sm font-medium ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );

  const getLocale = () => {
    switch (language) {
      case 'fr': return fr;
      case 'nl': return nl;
      default: return enUS;
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase() || 'U';
  };

  if (loading) {
    return (
      <Card className={compact ? "h-48" : ""}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-lg">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            Évaluations ({stats.totalReviews})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <StarRating rating={stats.averageRating} showText />
              </div>
              <p className="text-xs text-muted-foreground">Note générale</p>
            </div>

            {stats.averageExpertise > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Award className="h-4 w-4 text-blue-500" />
                  <span className="text-sm font-medium">{stats.averageExpertise.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Expertise</p>
              </div>
            )}

            {stats.averageCommunication > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <MessageCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">{stats.averageCommunication.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Communication</p>
              </div>
            )}

            {stats.averageWaitTime > 0 && (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-1 mb-1">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium">{stats.averageWaitTime.toFixed(1)}</span>
                </div>
                <p className="text-xs text-muted-foreground">Ponctualité</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Individual Reviews */}
      {reviews.length > 0 && (
        <div className="space-y-3">
          {reviews.map((review) => (
            <Card key={review.id} className="border-l-4 border-l-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>
                        {getInitials(review.profiles?.first_name, review.profiles?.last_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">
                        {review.profiles?.first_name || 'Patient'}
                      </p>
                      <p className="text-xs text-muted-foreground flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(review.created_at), 'dd MMM yyyy', { locale: getLocale() })}
                      </p>
                    </div>
                  </div>
                  <StarRating rating={review.rating} />
                </div>

                {/* Detailed ratings */}
                {(review.expertise_rating || review.communication_rating || review.wait_time_rating) && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {review.expertise_rating && (
                      <Badge variant="outline" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        Expertise: {review.expertise_rating}/5
                      </Badge>
                    )}
                    {review.communication_rating && (
                      <Badge variant="outline" className="text-xs">
                        <MessageCircle className="h-3 w-3 mr-1" />
                        Communication: {review.communication_rating}/5
                      </Badge>
                    )}
                    {review.wait_time_rating && (
                      <Badge variant="outline" className="text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        Ponctualité: {review.wait_time_rating}/5
                      </Badge>
                    )}
                  </div>
                )}

                {/* Review text */}
                {review.review && (
                  <p className="text-sm text-gray-700 leading-relaxed">
                    "{review.review}"
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {reviews.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center">
            <MessageCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Aucun avis disponible pour ce dentiste.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};