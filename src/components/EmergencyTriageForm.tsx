// @ts-nocheck
import { useState } from "react";
import { StreamlinedTriage } from "@/components/StreamlinedTriage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bookAppointment } from "@/lib/mockApi";
import { supabase } from "@/integrations/supabase/client";
import { logger } from '@/lib/logger';
import { 
  CheckCircle, 
  Calendar, 
  MapPin, 
  Clock,
  Phone,
  ArrowRight,
  Stethoscope,
  User,
  CalendarDays,
  Clock4,
  FileText,
  CheckSquare
} from "lucide-react";

interface TriageAnswers {
  painLevel: number;
  symptoms: string[];
  urgency: string[];
}

interface EmergencyTriageFormProps {
  onComplete: (urgency: 'low' | 'medium' | 'high' | 'emergency') => void;
  onCancel: () => void;
}

interface BookingData {
  date: string;
  time: string;
  reason: string;
  notes?: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
}

interface ConfirmationData {
  confirmationId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  urgency: 'low' | 'medium' | 'high' | 'emergency';
  patientName?: string;
  dentistName?: string;
  timestamp: string;
}

export const EmergencyTriageForm = ({ onComplete, onCancel }: EmergencyTriageFormProps) => {
  const [showResults, setShowResults] = useState(false);
  const [showBooking, setShowBooking] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingData, setBookingData] = useState<BookingData>({
    date: "",
    time: "",
    reason: "",
    notes: "",
    urgency: 'medium'
  });
  const [urgencyLevel, setUrgencyLevel] = useState<'low' | 'medium' | 'high' | 'emergency'>('medium');
const [triageData, setTriageData] = useState<TriageAnswers | null>(null);
  const [confirmationData, setConfirmationData] = useState<ConfirmationData | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

const handleTriageComplete = (urgency: 'low' | 'medium' | 'high' | 'emergency', data: TriageAnswers) => {
  setUrgencyLevel(urgency);
  setTriageData(data);
  setBookingData(prev => ({ ...prev, urgency }));
  setShowResults(true);
};

  const handleBookAppointment = () => {
    setShowBooking(true);
  };

  const handleBookingInputChange = (field: keyof BookingData, value: string) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleConfirmBooking = async () => {
    setIsLoading(true);
    setBookingError(null);

    try {
      // Get current user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      // Get patient profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Patient profile not found');
      }

      // Get available dentist (for demo, we'll use the first available)
      const { data: dentists, error: dentistError } = await supabase
        .from('dentists')
        .select(`
          id,
          profiles!inner(first_name, last_name)
        `)
        .limit(1);

      if (dentistError || !dentists || dentists.length === 0) {
        throw new Error('No dentists available');
      }

      const dentist = dentists[0];
      const appointmentDateTime = new Date(`${bookingData.date}T${bookingData.time}`);

      // Create appointment in database
      const { data: appointment, error: appointmentError } = await supabase
        .from('appointments')
        .insert({
          patient_id: profile.id,
          dentist_id: dentist.id,
          appointment_date: appointmentDateTime.toISOString(),
          reason: bookingData.reason,
          notes: bookingData.notes,
          urgency: bookingData.urgency,
          status: 'confirmed'
        })
        .select()
        .single();

      if (appointmentError) {
        throw new Error('Failed to create appointment');
      }

      // Generate confirmation data
      const confirmationData: ConfirmationData = {
        confirmationId: appointment.id,
        appointmentDate: bookingData.date,
        appointmentTime: bookingData.time,
        reason: bookingData.reason,
        urgency: bookingData.urgency,
        patientName: `${profile.first_name} ${profile.last_name}`,
        dentistName: `${dentist.profiles.first_name} ${dentist.profiles.last_name}`,
        timestamp: new Date().toISOString()
      };

      setConfirmationData(confirmationData);
      setShowConfirmation(true);
      setShowBooking(false);

    } catch (error: any) {
      console.error('Booking error:', error);
      setBookingError(error.message || 'Failed to book appointment');
    } finally {
      setIsLoading(false);
    }
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

  if (showConfirmation && confirmationData) {
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };

    const formatTime = (timeStr: string) => {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    };

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Success Header */}
        <Card className="glass-card border-green-200">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-green-100">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-green-800">Appointment Confirmed!</CardTitle>
            <p className="text-dental-muted-foreground">
              Your appointment has been successfully scheduled
            </p>
          </CardHeader>
        </Card>

        {/* Confirmation Details */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-dental-muted-foreground">Confirmation ID</Label>
                <div className="p-3 bg-gray-50 rounded-md font-mono text-sm">
                  {confirmationData.confirmationId}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium text-dental-muted-foreground">Date & Time</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <div className="font-medium">{formatDate(confirmationData.appointmentDate)}</div>
                  <div className="text-sm text-dental-muted-foreground">
                    {formatTime(confirmationData.appointmentTime)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-dental-muted-foreground">Patient</Label>
                <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                  <User className="h-4 w-4 text-dental-muted-foreground" />
                  {confirmationData.patientName || 'Patient'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-dental-muted-foreground">Dentist</Label>
                <div className="p-3 bg-gray-50 rounded-md flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-dental-muted-foreground" />
                  {confirmationData.dentistName || 'Dr. Smith'}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-dental-muted-foreground">Reason</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  {confirmationData.reason}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-dental-muted-foreground">Urgency Level</Label>
                <div className="p-3 bg-gray-50 rounded-md">
                  <Badge className={`capitalize ${urgencyLevel === 'emergency' ? 'bg-red-100 text-red-800' : 
                    urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                    urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'}`}>
                    {confirmationData.urgency}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Timestamp */}
            <div className="pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-dental-muted-foreground">
                <Clock4 className="h-4 w-4" />
                Booked on {new Date(confirmationData.timestamp).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              What to Expect Next
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>You'll receive an SMS confirmation within 5 minutes</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Reminder notifications 24 hours and 2 hours before your appointment</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Please arrive 15 minutes early for check-in</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Bring your ID and insurance card</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4">
          <Button 
            onClick={() => onComplete(urgencyLevel)}
            className="bg-gradient-primary text-white shadow-elegant"
          >
            Return to Dashboard
          </Button>
          <Button 
            variant="outline"
            onClick={() => {
              setShowConfirmation(false);
              setConfirmationData(null);
              setShowResults(false);
            }}
          >
            Book Another Appointment
          </Button>
        </div>
      </div>
    );
  }

  if (showBooking) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Booking Header */}
        <Card className="glass-card border-0">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-dental-primary/10">
                <Calendar className="h-8 w-8 text-dental-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl gradient-text">Schedule Your Appointment</CardTitle>
            <p className="text-dental-muted-foreground">
              Choose your preferred date and time for your dental appointment
            </p>
          </CardHeader>
        </Card>

        {/* Booking Form */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="appointment-date">Preferred Date</Label>
                <Input
                  id="appointment-date"
                  type="date"
                  value={bookingData.date}
                  onChange={(e) => handleBookingInputChange('date', e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="appointment-time">Preferred Time</Label>
                <Select value={bookingData.time} onValueChange={(value) => handleBookingInputChange('time', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="09:00">9:00 AM</SelectItem>
                    <SelectItem value="10:00">10:00 AM</SelectItem>
                    <SelectItem value="11:00">11:00 AM</SelectItem>
                    <SelectItem value="13:00">1:00 PM</SelectItem>
                    <SelectItem value="14:00">2:00 PM</SelectItem>
                    <SelectItem value="15:00">3:00 PM</SelectItem>
                    <SelectItem value="16:00">4:00 PM</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-reason">Reason for Visit</Label>
              <Select value={bookingData.reason} onValueChange={(value) => handleBookingInputChange('reason', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Routine Check-up">Routine Check-up</SelectItem>
                  <SelectItem value="Dental Cleaning">Dental Cleaning</SelectItem>
                  <SelectItem value="Tooth Pain">Tooth Pain</SelectItem>
                  <SelectItem value="Cavity Treatment">Cavity Treatment</SelectItem>
                  <SelectItem value="Root Canal">Root Canal</SelectItem>
                  <SelectItem value="Emergency">Emergency</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="appointment-notes">Additional Notes (Optional)</Label>
              <Textarea
                id="appointment-notes"
                placeholder="Any specific concerns or special requirements..."
                value={bookingData.notes}
                onChange={(e) => handleBookingInputChange('notes', e.target.value)}
                rows={3}
              />
            </div>

            {/* Urgency Level Display */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="h-4 w-4 text-dental-muted-foreground" />
                <span className="text-sm font-medium">Urgency Level</span>
              </div>
              <Badge className={`capitalize ${urgencyLevel === 'emergency' ? 'bg-red-100 text-red-800' : 
                urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                urgencyLevel === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                'bg-green-100 text-green-800'}`}>
                {urgencyLevel} priority
              </Badge>
            </div>

            {bookingError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{bookingError}</p>
              </div>
            )}

            <div className="flex justify-end gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowBooking(false)}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={handleConfirmBooking}
                disabled={!bookingData.date || !bookingData.time || !bookingData.reason || isLoading}
                className="bg-gradient-primary text-white shadow-elegant"
              >
                {isLoading ? 'Confirming...' : 'Confirm Appointment'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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