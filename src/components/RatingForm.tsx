import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguageDetection } from "@/hooks/useLanguageDetection";
import { Star, Send, MessageCircle, Award, Clock, Heart } from "lucide-react";
import { logger } from '@/lib/logger';

interface RatingFormProps {
  appointmentId: string;
  dentistId: string;
  patientId: string;
  dentistName: string;
  onComplete: () => void;
  onCancel: () => void;
}

export const RatingForm = ({
  appointmentId,
  dentistId,
  patientId,
  dentistName,
  onComplete,
  onCancel
}: RatingFormProps) => {
  const { t } = useLanguageDetection();
  const { toast } = useToast();
  const [ratings, setRatings] = useState({
    overall: 0,
    expertise: 0,
    communication: 0,
    waitTime: 0
  });
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(false);

  const StarSelector = ({ 
    value, 
    onChange, 
    label,
    icon: Icon,
    color = "text-yellow-400"
  }: { 
    value: number; 
    onChange: (rating: number) => void; 
    label: string;
    icon: any;
    color?: string;
  }) => (
    <div className="space-y-2">
      <Label className="flex items-center text-sm font-medium">
        <Icon className={`h-4 w-4 mr-2 ${color}`} />
        {label}
      </Label>
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className="p-1 rounded hover:bg-gray-100 transition-colors"
          >
            <Star
              className={`h-6 w-6 transition-colors ${
                star <= value
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-300"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {value > 0 ? `${value}/5` : "Non évalué"}
        </span>
      </div>
    </div>
  );

  const handleSubmit = async () => {
    if (ratings.overall === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez donner une évaluation générale",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('dentist_ratings')
        .upsert({
          dentist_id: dentistId,
          patient_id: patientId,
          appointment_id: appointmentId,
          rating: ratings.overall,
          expertise_rating: ratings.expertise || null,
          communication_rating: ratings.communication || null,
          wait_time_rating: ratings.waitTime || null,
          review: review.trim() || null
        });

      if (error) throw error;

      toast({
        title: "Merci !",
        description: "Votre évaluation a été enregistrée avec succès.",
      });

      onComplete();
    } catch (error) {
      console.error('Error saving rating:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer votre évaluation. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getRatingText = (rating: number) => {
    if (rating === 0) return "";
    const texts = ["Très mauvais", "Mauvais", "Correct", "Bon", "Excellent"];
    return texts[rating - 1];
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Star className="h-5 w-5 mr-2 text-yellow-400" />
          Évaluer Dr. {dentistName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Votre avis nous aide à améliorer la qualité des soins et aide d'autres patients.
        </p>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Rating */}
        <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
          <StarSelector
            value={ratings.overall}
            onChange={(rating) => setRatings(prev => ({ ...prev, overall: rating }))}
            label="Évaluation générale *"
            icon={Star}
            color="text-primary"
          />
          {ratings.overall > 0 && (
            <p className="text-sm text-primary font-medium mt-2">
              {getRatingText(ratings.overall)}
            </p>
          )}
        </div>

        {/* Detailed Ratings */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StarSelector
            value={ratings.expertise}
            onChange={(rating) => setRatings(prev => ({ ...prev, expertise: rating }))}
            label="Expertise technique"
            icon={Award}
            color="text-blue-500"
          />
          
          <StarSelector
            value={ratings.communication}
            onChange={(rating) => setRatings(prev => ({ ...prev, communication: rating }))}
            label="Communication"
            icon={MessageCircle}
            color="text-green-500"
          />
          
          <StarSelector
            value={ratings.waitTime}
            onChange={(rating) => setRatings(prev => ({ ...prev, waitTime: rating }))}
            label="Temps d'attente"
            icon={Clock}
            color="text-orange-500"
          />
        </div>

        {/* Written Review */}
        <div className="space-y-2">
          <Label htmlFor="review">
            Commentaire (optionnel)
          </Label>
          <Textarea
            id="review"
            placeholder="Partagez votre expérience pour aider d'autres patients..."
            value={review}
            onChange={(e) => setReview(e.target.value)}
            rows={4}
            maxLength={500}
          />
          <p className="text-xs text-muted-foreground text-right">
            {review.length}/500 caractères
          </p>
        </div>

        {/* Summary */}
        {ratings.overall > 0 && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center">
              <Heart className="h-4 w-4 mr-2 text-red-500" />
              Résumé de votre évaluation
            </h4>
            <div className="text-sm space-y-1">
              <p><strong>Évaluation générale:</strong> {ratings.overall}/5 - {getRatingText(ratings.overall)}</p>
              {ratings.expertise > 0 && (
                <p><strong>Expertise:</strong> {ratings.expertise}/5</p>
              )}
              {ratings.communication > 0 && (
                <p><strong>Communication:</strong> {ratings.communication}/5</p>
              )}
              {ratings.waitTime > 0 && (
                <p><strong>Temps d'attente:</strong> {ratings.waitTime}/5</p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button
            onClick={handleSubmit}
            disabled={ratings.overall === 0 || loading}
            className="flex-1"
          >
            {loading ? (
              "Enregistrement..."
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Envoyer l'évaluation
              </>
            )}
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};