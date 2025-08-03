import { useState } from "react";
import { StreamlinedTriage } from "@/components/StreamlinedTriage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Clock,
  Phone,
  ArrowRight,
  Stethoscope
} from "lucide-react";

interface TriageData {
  painLevel: number;
  [key: string]: unknown;
}

interface EmergencyTriageFormProps {
  onComplete: (urgency: 'low' | 'medium' | 'high' | 'emergency') => void;
  onCancel: () => void;
}

export const EmergencyTriageForm = ({ onComplete, onCancel }: EmergencyTriageFormProps) => {
  const [showResults, setShowResults] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
  const [triageData, setTriageData] = useState<TriageData | null>(null);

  const handleTriageComplete = (urgency: 'low' | 'medium' | 'high' | 'emergency', data: TriageData) => {
    setUrgencyLevel(urgency);
    setTriageData(data);
    setShowResults(true);
  };

  const handleBookAppointment = () => {
    setShowBooking(true);
  };

  const handleConfirmBooking = () => {
    // simply trigger completion; no backend call
    onComplete(urgencyLevel);
    setShowBooking(false);
  };

  const getUrgencyInfo = () => {
    switch(urgencyLevel) {
      case 'emergency': 
        return {
          title: 'EMERGENCY - Immediate Care Required',
          color: 'bg-red-100 text-red-800 border-red-300',
          description: 'You need immediate dental attention. Please call our emergency line or visit the nearest dental emergency clinic.',
          action: 'Call Emergency Line: (555) 123-HELP',
          timeframe: 'NOW',
          priority: 1
        };
      case 'high': 
        return {
          title: 'HIGH PRIORITY - Same Day Appointment',
          color: 'bg-orange-100 text-orange-800 border-orange-300',
          description: 'Your symptoms indicate you need to be seen today. We\'ll prioritize your appointment.',
          action: 'Book Same-Day Appointment',
          timeframe: 'Today',
          priority: 2
        };
      case 'medium': 
        return {
          title: 'MEDIUM PRIORITY - 24-48 Hours',
          color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
          description: 'You should be seen within the next day or two. We have priority slots available.',
          action: 'Book Priority Appointment',
          timeframe: '1-2 Days',
          priority: 3
        };
      case 'low': 
        return {
          title: 'STANDARD APPOINTMENT',
          color: 'bg-green-100 text-green-800 border-green-300',
          description: 'You can schedule a regular appointment at your convenience.',
          action: 'Book Standard Appointment',
          timeframe: 'This Week',
          priority: 4
        };
    }
  };

  if (showBooking) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Choose Appointment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <input
            type="date"
            className="border rounded p-2 w-full"
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
          />
          <input
            type="time"
            className="border rounded p-2 w-full"
            value={bookingTime}
            onChange={(e) => setBookingTime(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setShowBooking(false)}>
              Back
            </Button>
            <Button onClick={handleConfirmBooking} disabled={!bookingDate || !bookingTime}>
              Confirm
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (showResults) {
    const urgencyInfo = getUrgencyInfo();
    
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Results Header */}
        <Card className="glass-card border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl gradient-text">Assessment Complete</CardTitle>
            <p className="text-dental-muted-foreground">
              Based on your symptoms, here's your recommended care level
            </p>
          </CardHeader>
        </Card>

        {/* Urgency Level Display */}
        <Card className="glass-card border-0">
          <CardContent className="p-8 text-center">
            <Badge className={`text-xl py-3 px-6 border-2 ${urgencyInfo.color} font-bold`}>
              {urgencyInfo.title}
            </Badge>
            <p className="text-lg text-dental-muted-foreground mt-4 mb-6">
              {urgencyInfo.description}
            </p>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-dental-primary">Priority {urgencyInfo.priority}</div>
                <div className="text-sm text-dental-muted-foreground">Urgency Level</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-dental-secondary">{urgencyInfo.timeframe}</div>
                <div className="text-sm text-dental-muted-foreground">Recommended Window</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-dental-accent">{triageData?.painLevel}/10</div>
                <div className="text-sm text-dental-muted-foreground">Pain Level</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {urgencyLevel === 'emergency' ? (
            <>
              <Card className="glass-card border-red-200 hover:shadow-elegant transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Phone className="h-8 w-8 text-red-600 mx-auto mb-3" />
                  <h3 className="font-bold text-red-800 mb-2">Call Emergency Line</h3>
                  <p className="text-sm text-dental-muted-foreground mb-4">
                    Immediate assistance available 24/7
                  </p>
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white">
                    <Phone className="h-4 w-4 mr-2" />
                    Call (555) 123-HELP
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card border-orange-200 hover:shadow-elegant transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <MapPin className="h-8 w-8 text-orange-600 mx-auto mb-3" />
                  <h3 className="font-bold text-orange-800 mb-2">Find Emergency Clinic</h3>
                  <p className="text-sm text-dental-muted-foreground mb-4">
                    Locate nearest emergency dental facility
                  </p>
                  <Button variant="outline" className="w-full border-orange-300 text-orange-700">
                    <MapPin className="h-4 w-4 mr-2" />
                    Find Clinic
                  </Button>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card className="glass-card hover:shadow-elegant transition-all cursor-pointer" onClick={handleBookAppointment}>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-8 w-8 text-dental-primary mx-auto mb-3" />
                  <h3 className="font-bold text-dental-primary mb-2">{urgencyInfo.action}</h3>
                  <p className="text-sm text-dental-muted-foreground mb-4">
                    Smart scheduling based on your urgency level
                  </p>
                  <Button className="w-full bg-gradient-primary text-white shadow-elegant">
                    <Calendar className="h-4 w-4 mr-2" />
                    Book Now
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>

              <Card className="glass-card hover:shadow-elegant transition-all cursor-pointer">
                <CardContent className="p-6 text-center">
                  <Stethoscope className="h-8 w-8 text-dental-secondary mx-auto mb-3" />
                  <h3 className="font-bold text-dental-secondary mb-2">AI Consultation</h3>
                  <p className="text-sm text-dental-muted-foreground mb-4">
                    Get immediate guidance and care tips
                  </p>
                  <Button variant="outline" className="w-full border-dental-secondary text-dental-secondary">
                    <Stethoscope className="h-4 w-4 mr-2" />
                    Start Chat
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Additional Info */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Clock className="h-5 w-5 text-dental-muted-foreground" />
              <h3 className="font-semibold">What to expect next:</h3>
            </div>
            <ul className="space-y-2 text-sm text-dental-muted-foreground">
              {urgencyLevel === 'emergency' ? (
                <>
                  <li>• Call our emergency line immediately</li>
                  <li>• Have your insurance information ready</li>
                  <li>• If severe swelling affects breathing, call 911</li>
                </>
              ) : (
                <>
                  <li>• You'll receive appointment confirmation within minutes</li>
                  <li>• SMS reminders will be sent before your visit</li>
                  <li>• Bring your insurance card and ID</li>
                  <li>• Arrive 15 minutes early for check-in</li>
                </>
              )}
            </ul>
          </CardContent>
        </Card>

        {/* Navigation */}
        <Card className="glass-card">
          <CardContent className="p-6">
            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setShowResults(false)}>
                Retake Assessment
              </Button>
              <Button variant="outline" onClick={onCancel}>
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <StreamlinedTriage onComplete={handleTriageComplete} onCancel={onCancel} />;
};