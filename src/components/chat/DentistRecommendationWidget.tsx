/**
 * Dentist Recommendation Widget
 *
 * Displays the AI-matched dentist recommendation with:
 * - Dentist photo/avatar
 * - Brief bio
 * - Why they're a good match (AI reasoning)
 * - Match highlights
 * - Specializations
 * - Availability
 * - Action buttons (Book Now / See Alternatives)
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  Calendar,
  MapPin,
  Award,
  Clock,
  CheckCircle,
  Sparkles,
  ChevronRight,
  Info,
  Heart,
  Languages
} from 'lucide-react';
import { DentistMatchResult } from '@/types/intake';
import { cn } from '@/lib/utils';

interface DentistRecommendationWidgetProps {
  matchResult: DentistMatchResult;
  isTopRecommendation?: boolean;
  onBookAppointment: (dentistId: string) => void;
  onSeeAlternatives?: () => void;
  showAlternativesButton?: boolean;
}

export const DentistRecommendationWidget = ({
  matchResult,
  isTopRecommendation = true,
  onBookAppointment,
  onSeeAlternatives,
  showAlternativesButton = true
}: DentistRecommendationWidgetProps) => {
  const { dentist_info, match_highlights, match_reasoning, overall_match_score } = matchResult;
  const [isExpanded, setIsExpanded] = useState(false);

  // Get initials for avatar fallback
  const initials = `${dentist_info.first_name.charAt(0)}${dentist_info.last_name.charAt(0)}`;

  // Get match score color
  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 dark:text-green-400';
    if (score >= 80) return 'text-blue-600 dark:text-blue-400';
    if (score >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  // Get specialization display
  const primarySpecialization = dentist_info.specializations?.find(s => s.is_primary);
  const specializationDisplay = primarySpecialization
    ? primarySpecialization.specialization_type.replace(/_/g, ' ')
    : 'General Dentistry';

  return (
    <Card
      className={cn(
        "max-w-2xl mx-auto my-4 transition-all duration-300 hover:shadow-xl",
        isTopRecommendation && "border-primary/50 shadow-lg ring-2 ring-primary/20"
      )}
    >
      {/* Top Recommendation Badge */}
      {isTopRecommendation && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 z-10">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-white px-4 py-1 shadow-md">
            <Sparkles className="h-3 w-3 mr-1 inline" />
            AI Top Recommendation
          </Badge>
        </div>
      )}

      <CardHeader className="pb-3">
        {/* Dentist Info */}
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Avatar className="h-20 w-20 border-4 border-background shadow-md">
            {dentist_info.avatar_url ? (
              <AvatarImage src={dentist_info.avatar_url} alt={`Dr. ${dentist_info.first_name} ${dentist_info.last_name}`} />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>

          {/* Name and Title */}
          <div className="flex-1 space-y-2">
            <div>
              <CardTitle className="text-2xl font-bold">
                Dr. {dentist_info.first_name} {dentist_info.last_name}
              </CardTitle>
              <CardDescription className="text-base flex items-center gap-2 mt-1">
                <Award className="h-4 w-4" />
                {specializationDisplay}
                {dentist_info.experience_years && (
                  <span className="ml-2 text-xs">• {dentist_info.experience_years}+ years</span>
                )}
              </CardDescription>
            </div>

            {/* Match Score */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Match Score:</span>
                <span className={cn("text-2xl font-bold", getScoreColor(overall_match_score))}>
                  {Math.round(overall_match_score)}%
                </span>
              </div>
              {dentist_info.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium">{dentist_info.rating.toFixed(1)}</span>
                  {dentist_info.review_count && (
                    <span className="text-xs text-muted-foreground">({dentist_info.review_count})</span>
                  )}
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <Progress value={overall_match_score} className="h-2" />
          </div>
        </div>
      </CardHeader>

      <Separator />

      <CardContent className="pt-4 space-y-4">
        {/* Why This Dentist - AI Reasoning */}
        <div className="bg-primary/5 rounded-lg p-4 border border-primary/10">
          <div className="flex items-start gap-2">
            <Info className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm mb-2 text-primary">Why This Dentist?</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {match_reasoning}
              </p>
            </div>
          </div>
        </div>

        {/* Match Highlights */}
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-muted-foreground">Key Highlights:</h4>
          <div className="grid grid-cols-1 gap-2">
            {match_highlights.map((highlight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>{highlight}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Dentist Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {/* Location */}
          {dentist_info.clinic_address && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{dentist_info.clinic_address}</span>
            </div>
          )}

          {/* Languages */}
          {dentist_info.languages && dentist_info.languages.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <Languages className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">{dentist_info.languages.join(', ')}</span>
            </div>
          )}

          {/* Next Available */}
          {dentist_info.next_available_slot && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-green-500" />
              <span className="font-medium text-green-600 dark:text-green-400">
                Available {dentist_info.next_available_slot}
              </span>
            </div>
          )}
        </div>

        {/* Bio - Expandable */}
        {dentist_info.bio && (
          <div className="pt-2">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              {isExpanded ? 'Hide' : 'Read more about'} Dr. {dentist_info.last_name}
              <ChevronRight className={cn("h-4 w-4 transition-transform", isExpanded && "rotate-90")} />
            </button>
            {isExpanded && (
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                {dentist_info.bio}
              </p>
            )}
          </div>
        )}

        {/* All Specializations */}
        {dentist_info.specializations && dentist_info.specializations.length > 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {dentist_info.specializations.map((spec, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {spec.specialization_type.replace(/_/g, ' ')}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>

      <Separator />

      <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
        {/* Book Appointment Button */}
        <Button
          size="lg"
          className="flex-1 font-semibold"
          onClick={() => onBookAppointment(dentist_info.id)}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Book with Dr. {dentist_info.last_name}
        </Button>

        {/* See Alternatives Button */}
        {showAlternativesButton && onSeeAlternatives && (
          <Button
            size="lg"
            variant="outline"
            className="flex-1 sm:flex-none"
            onClick={onSeeAlternatives}
          >
            See Other Dentists
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};

/**
 * Alternative Dentists List Widget
 * Shows other matched dentists in a compact list format
 */
interface AlternativeDentistsWidgetProps {
  alternatives: DentistMatchResult[];
  onSelectDentist: (dentistId: string) => void;
}

export const AlternativeDentistsWidget = ({
  alternatives,
  onSelectDentist
}: AlternativeDentistsWidgetProps) => {
  return (
    <Card className="max-w-2xl mx-auto my-4">
      <CardHeader>
        <CardTitle className="text-lg">Other Great Options</CardTitle>
        <CardDescription>
          These dentists also match your needs well
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {alternatives.map((match, index) => {
          const { dentist_info, overall_match_score, match_highlights } = match;
          const initials = `${dentist_info.first_name.charAt(0)}${dentist_info.last_name.charAt(0)}`;

          return (
            <div
              key={dentist_info.id}
              className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer"
              onClick={() => onSelectDentist(dentist_info.id)}
            >
              {/* Avatar */}
              <Avatar className="h-12 w-12 border-2 border-background">
                {dentist_info.avatar_url ? (
                  <AvatarImage src={dentist_info.avatar_url} alt={`Dr. ${dentist_info.last_name}`} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-sm truncate">
                    Dr. {dentist_info.first_name} {dentist_info.last_name}
                  </h4>
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(overall_match_score)}% match
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-1">
                  {match_highlights[0]}
                </p>
              </div>

              {/* Action */}
              <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default DentistRecommendationWidget;
