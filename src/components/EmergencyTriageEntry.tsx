import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";
import { EmergencyTriageForm } from "./EmergencyTriageForm";
import { LanguageSelector } from "./LanguageSelector";
import { 
  Zap, 
  Clock, 
  Shield, 
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Phone
} from "lucide-react";

interface EmergencyTriageEntryProps {
  onComplete: (appointmentData?: unknown) => void;
  onCancel: () => void;
}

export const EmergencyTriageEntry = ({ onComplete, onCancel }: EmergencyTriageEntryProps) => {
  const { t } = useLanguage();
  const [showTriage, setShowTriage] = useState(false);

  if (showTriage) {
    return (
      <EmergencyTriageForm
        onComplete={onComplete}
        onCancel={() => setShowTriage(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-primary">SmartTriage</h1>
            <p className="text-muted-foreground">Emergency Dental Care Assessment</p>
          </div>
          <LanguageSelector />
        </div>

        {/* Hero Section */}
        <Card className="relative overflow-hidden border-none shadow-lg bg-gradient-to-r from-primary to-primary/80 text-white">
          <CardHeader className="pb-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white/20 rounded-full">
                <Zap className="h-8 w-8" />
              </div>
              <div>
                <CardTitle className="text-2xl md:text-3xl font-bold">
                  {typeof t === 'function' ? t('triage.title') : 'Emergency Triage'}
                </CardTitle>
                <p className="text-white/90 mt-2">
                  Fast, secure, and accurate dental emergency assessment
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <Clock className="h-6 w-6 text-white" />
                <div>
                  <p className="font-semibold">2-3 Minutes</p>
                  <p className="text-sm text-white/80">Quick Assessment</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <Shield className="h-6 w-6 text-white" />
                <div>
                  <p className="font-semibold">GDPR Compliant</p>
                  <p className="text-sm text-white/80">Secure & Private</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <CheckCircle2 className="h-6 w-6 text-white" />
                <div>
                  <p className="font-semibold">Direct Booking</p>
                  <p className="text-sm text-white/80">No Chat Required</p>
                </div>
              </div>
            </div>

            <Button
              onClick={() => setShowTriage(true)}
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold text-lg py-6"
            >
              Start Emergency Assessment
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </CardContent>
        </Card>

        {/* How It Works */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              step: "1",
              icon: AlertTriangle,
              title: "Assess Symptoms",
              description: "Answer questions about your pain and symptoms"
            },
            {
              step: "2",
              icon: Zap,
              title: "Get Urgency Level",
              description: "Receive your urgency rating (1-5 scale)"
            },
            {
              step: "3",
              icon: Clock,
              title: "View Available Slots",
              description: "See prioritized appointment times"
            },
            {
              step: "4",
              icon: CheckCircle2,
              title: "Book Instantly",
              description: "Confirm your appointment immediately"
            }
          ].map(({ step, icon: Icon, title, description }) => (
            <Card key={step} className="text-center p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <Badge variant="secondary" className="w-6 h-6 rounded-full p-0 flex items-center justify-center text-xs">
                    {step}
                  </Badge>
                </div>
                <Icon className="h-8 w-8 text-primary" />
                <div>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Emergency Notice */}
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Phone className="h-6 w-6 text-red-600 mt-1" />
              <div>
                <h3 className="font-semibold text-red-800">Life-Threatening Emergency?</h3>
                <p className="text-red-700 text-sm mt-1">
                  If you're experiencing severe breathing difficulties, uncontrolled bleeding, 
                  or signs of serious infection, call emergency services (112) immediately.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* GDPR Notice */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800">Privacy & Security</h3>
                <p className="text-blue-700 text-sm mt-1">
                  Your health information is protected under GDPR. Data is encrypted and only 
                  shared with your selected dentist for appointment purposes.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center py-6">
          <Button variant="outline" onClick={onCancel}>
            Return to Main App
          </Button>
        </div>
      </div>
    </div>
  );
};