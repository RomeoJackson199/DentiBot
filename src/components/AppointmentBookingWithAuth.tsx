import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { AuthForm } from "./AuthForm";
import { AppointmentBooking } from "./AppointmentBooking";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, ArrowLeft, Clock, User as UserIcon, CheckCircle } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface AppointmentBookingWithAuthProps {
  user: User | null;
  selectedDentist?: any;
  prefilledReason?: string;
  onComplete: (appointmentData?: any) => void;
  onCancel: () => void;
}

export const AppointmentBookingWithAuth = ({ 
  user, 
  selectedDentist, 
  prefilledReason, 
  onComplete, 
  onCancel 
}: AppointmentBookingWithAuthProps) => {
  const [showAuthStep, setShowAuthStep] = useState(false);
  const [selectedBookingData, setSelectedBookingData] = useState<any>(null);

  // If user is already authenticated, show booking directly
  if (user) {
    return (
      <AppointmentBooking
        user={user}
        selectedDentist={selectedDentist}
        prefilledReason={prefilledReason}
        onComplete={onComplete}
        onCancel={onCancel}
      />
    );
  }

  const handleProceedToBooking = (bookingData: any) => {
    setSelectedBookingData(bookingData);
    setShowAuthStep(true);
  };

  if (showAuthStep) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="flex items-center justify-between">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAuthStep(false)}
                  className="p-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="flex items-center text-lg font-bold text-gray-800">
                  <CalendarDays className="h-5 w-5 mr-2 text-blue-600" />
                  Sign in to book
                </CardTitle>
                <div></div>
              </div>
              <p className="text-gray-600 text-sm mt-2">
                Please sign in or create an account to confirm your appointment
              </p>
            </CardHeader>
            <CardContent className="p-6">
              <AuthForm />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return <AppointmentSelection onProceed={handleProceedToBooking} onCancel={onCancel} />;
};

// Component for selecting appointment details without authentication
const AppointmentSelection = ({ 
  onProceed, 
  onCancel 
}: { 
  onProceed: (data: unknown) => void; 
  onCancel: () => void; 
}) => {
  const { language, t } = useLanguage();
  const [selectedReason, setSelectedReason] = useState("");
  const [selectedDuration, setSelectedDuration] = useState("");

  const consultationReasons = {
    en: [
      "General consultation",
      "Routine checkup",
      "Dental pain",
      "Emergency",
      "Cleaning",
      "Other"
    ],
    fr: [
      "Consultation générale",
      "Contrôle de routine",
      "Douleur dentaire",
      "Urgence",
      "Nettoyage",
      "Autre"
    ],
    nl: [
      "Algemene consultatie",
      "Routine controle",
      "Tandpijn",
      "Spoed",
      "Reiniging",
      "Anders"
    ]
  };

  const durations = {
    en: ["30 minutes", "45 minutes", "60 minutes", "90 minutes"],
    fr: ["30 minutes", "45 minutes", "60 minutes", "90 minutes"],
    nl: ["30 minuten", "45 minuten", "60 minuten", "90 minuten"]
  };

  const reasons = consultationReasons[language as keyof typeof consultationReasons] || consultationReasons.en;
  const durationOptions = durations[language as keyof typeof durations] || durations.en;

  const handleContinue = () => {
    onProceed({
      reason: selectedReason,
      duration: selectedDuration,
      language: language
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <CardTitle className="flex items-center justify-center text-2xl font-bold text-gray-800">
              <CalendarDays className="h-6 w-6 mr-3 text-blue-600" />
              {language === 'fr' ? 'Réserver un Rendez-vous' : 
               language === 'nl' ? 'Afspraak Maken' : 
               'Book Appointment'}
            </CardTitle>
            <p className="text-gray-600 mt-2">
              {language === 'fr' ? 'Sélectionnez vos préférences de rendez-vous' : 
               language === 'nl' ? 'Selecteer uw afspraakvoorkeuren' : 
               'Select your appointment preferences'}
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6 p-6 md:p-8">
            {/* Consultation Reason */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700 flex items-center">
                <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                {language === 'fr' ? 'Motif de consultation' : 
                 language === 'nl' ? 'Reden voor consultatie' : 
                 'Consultation Reason'}
              </Label>
              <Select value={selectedReason} onValueChange={setSelectedReason}>
                <SelectTrigger className="h-12 border-2 border-blue-200 bg-blue-50 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder={
                    language === 'fr' ? 'Sélectionnez le motif' : 
                    language === 'nl' ? 'Selecteer de reden' : 
                    'Select reason'
                  } />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg">
                  {reasons.map((reason) => (
                    <SelectItem key={reason} value={reason} className="cursor-pointer hover:bg-blue-50">
                      {reason}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-base font-semibold text-gray-700 flex items-center">
                <Clock className="h-4 w-4 mr-2 text-blue-600" />
                {language === 'fr' ? 'Durée estimée' : 
                 language === 'nl' ? 'Geschatte duur' : 
                 'Estimated Duration'}
              </Label>
              <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-blue-300 transition-colors">
                  <SelectValue placeholder={
                    language === 'fr' ? 'Sélectionnez la durée' : 
                    language === 'nl' ? 'Selecteer de duur' : 
                    'Select duration'
                  } />
                </SelectTrigger>
                <SelectContent className="bg-white border-2 shadow-lg">
                  {durationOptions.map((duration) => (
                    <SelectItem key={duration} value={duration} className="cursor-pointer hover:bg-blue-50">
                      {duration}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Information Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center mb-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                  <h4 className="font-semibold text-blue-800">
                    {language === 'fr' ? 'Disponibilité en temps réel' : 
                     language === 'nl' ? 'Real-time beschikbaarheid' : 
                     'Real-time Availability'}
                  </h4>
                </div>
                <p className="text-sm text-blue-700">
                  {language === 'fr' ? 'Voir les créneaux disponibles instantanément' : 
                   language === 'nl' ? 'Zie direct beschikbare tijdsloten' : 
                   'See available slots instantly'}
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center mb-2">
                  <Clock className="h-5 w-5 text-green-600 mr-2" />
                  <h4 className="font-semibold text-green-800">
                    {language === 'fr' ? 'Support 24h/24' : 
                     language === 'nl' ? '24/7 Ondersteuning' : 
                     '24/7 Support'}
                  </h4>
                </div>
                <p className="text-sm text-green-700">
                  {language === 'fr' ? 'Réservation disponible à tout moment' : 
                   language === 'nl' ? 'Boeking altijd beschikbaar' : 
                   'Booking available anytime'}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                onClick={handleContinue}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors shadow-lg" 
                disabled={!selectedReason || !selectedDuration}
              >
                {language === 'fr' ? 'Continuer vers la Connexion' : 
                 language === 'nl' ? 'Doorgaan naar Inloggen' : 
                 'Continue to Sign In'}
              </Button>
              <Button 
                variant="outline" 
                onClick={onCancel}
                className="h-12 border-2 border-gray-300 hover:bg-gray-50 font-semibold transition-colors"
              >
                {language === 'fr' ? 'Annuler' : 
                 language === 'nl' ? 'Annuleren' : 
                 'Cancel'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};