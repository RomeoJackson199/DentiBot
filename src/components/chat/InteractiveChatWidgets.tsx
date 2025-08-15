import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage, changeLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  User as UserIcon, 
  MapPin, 
  Phone, 
  CheckCircle, 
  Star,
  Camera,
  Upload,
  Edit,
  Heart,
  Shield,
  Moon,
  Sun,
  Globe,
  Bell,
  HelpCircle,
  X,
  Camera as CameraIcon,
  FileImage,
  AlertTriangle,
  Info
} from "lucide-react";
import { format, startOfDay } from "date-fns";

type Dentist = any;
type Appointment = any;

interface InteractiveChatWidgetsProps {
  user: User | null;
  onWidgetAction: (action: string, data?: any) => void;
  onClose?: () => void;
}

// Privacy Consent Widget
const PrivacyConsentWidget = ({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) => {
  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Shield className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Welcome to First Smile AI</CardTitle>
        <p className="text-sm text-muted-foreground">Your digital dental assistant</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-muted/30 rounded-lg">
          <p className="text-sm leading-relaxed">
            <strong>Privacy & Data Policy:</strong> We collect your name, contact details, and appointment information to manage your bookings and assist your dentist. You can withdraw consent at any time.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDecline} className="flex-1">
            I Do Not Accept
          </Button>
          <Button onClick={onAccept} className="flex-1">
            I Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Inline Calendar Widget
const InlineCalendarWidget = ({ 
  selectedDate, 
  onDateSelect, 
  dentistName 
}: { 
  selectedDate?: Date; 
  onDateSelect: (date: Date) => void;
  dentistName?: string;
}) => {
  const isDateDisabled = (date: Date) => {
    const today = startOfDay(new Date());
    return date < today || date.getDay() === 0 || date.getDay() === 6;
  };

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <CalendarIcon className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Select Date</CardTitle>
        {dentistName && (
          <p className="text-sm text-muted-foreground">{dentistName}</p>
        )}
      </CardHeader>
      <CardContent>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && onDateSelect(date)}
          disabled={isDateDisabled}
          className="rounded-lg border mx-auto"
        />
      </CardContent>
    </Card>
  );
};

// Time Slots Widget
const TimeSlotsWidget = ({ 
  slots, 
  selectedTime, 
  onTimeSelect, 
  loading = false 
}: { 
  slots: Array<{ time: string; available: boolean }>; 
  selectedTime?: string;
  onTimeSelect: (time: string) => void;
  loading?: boolean;
}) => {
  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Clock className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Available Times</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Loading times...</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {slots.filter(slot => slot.available).map((slot) => (
              <Button
                key={slot.time}
                variant={selectedTime === slot.time ? "default" : "outline"}
                size="sm"
                onClick={() => onTimeSelect(slot.time)}
                className="text-sm"
              >
                {slot.time}
              </Button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Dentist Selection Widget
const DentistSelectionWidget = ({
  dentists,
  onSelect,
  recommendedDentists
}: {
  dentists: Dentist[];
  onSelect: (dentist: Dentist) => void;
  recommendedDentists?: string[];
}) => {
  const isRecommended = (dentist: Dentist) => {
    if (!recommendedDentists) return false;
    const fullName = `${dentist.profiles?.first_name} ${dentist.profiles?.last_name}`;
    return recommendedDentists.includes(fullName);
  };
  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <UserIcon className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Choose Your Dentist</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {dentists.map((dentist) => (
          <Card key={dentist.id} className={`cursor-pointer hover:border-primary/50 transition-colors ${isRecommended(dentist) ? 'ring-2 ring-green-500' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="relative w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <UserIcon className="h-6 w-6 text-primary" />
                  {isRecommended(dentist) && (
                    <CheckCircle className="absolute -top-1 -right-1 h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">
                    Dr. {dentist.profiles?.first_name} {dentist.profiles?.last_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{dentist.specialization}</p>
                  <Badge variant="secondary" className="text-xs mt-1">Available</Badge>
                </div>
                <Button size="sm" onClick={() => onSelect(dentist)}>
                  Select
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </CardContent>
    </Card>
  );
};

// Appointment Confirmation Widget
const AppointmentConfirmationWidget = ({
  appointment,
  onConfirm,
  onCancel,
  loading = false,
  summary
}: {
  appointment: Appointment;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  summary?: string;
}) => {
  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <CheckCircle className="h-8 w-8 mx-auto text-green-500 mb-2" />
        <CardTitle className="text-lg">Confirm Appointment</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2">
            <UserIcon className="h-4 w-4 text-muted-foreground" />
            <span>Dr. {appointment.dentist?.profiles?.first_name} {appointment.dentist?.profiles?.last_name}</span>
          </div>
          <div className="flex items-center gap-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{format(appointment.date, "EEEE, MMMM d, yyyy")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.time}</span>
          </div>
          <div className="flex items-center gap-2">
            <Heart className="h-4 w-4 text-muted-foreground" />
            <span>{appointment.reason || "General consultation"}</span>
          </div>
        </div>
        {summary && (
          <p className="text-sm whitespace-pre-wrap border-t pt-2">{summary}</p>
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading} className="flex-1">
            {loading ? "Booking..." : "Confirm"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Personal Info Form Widget
const PersonalInfoFormWidget = ({ 
  user, 
  onSave, 
  onCancel 
}: { 
  user: User; 
  onSave: (data: unknown) => void;
  onCancel: () => void;
}) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    emergency_contact: '',
    medical_history: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          last_name: data.last_name || '',
          phone: data.phone || '',
          address: data.address || '',
          emergency_contact: data.emergency_contact || '',
          medical_history: data.medical_history || ''
        });
      }
    };
    loadProfile();
  }, [user.id]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update(formData)
        .eq('user_id', user.id);

      if (error) throw error;
      onSave(formData);
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Edit className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Update Personal Information</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label htmlFor="firstName" className="text-sm">First Name</Label>
            <Input
              id="firstName"
              value={formData.first_name}
              onChange={(e) => setFormData(prev => ({ ...prev, first_name: e.target.value }))}
              className="text-sm"
            />
          </div>
          <div>
            <Label htmlFor="lastName" className="text-sm">Last Name</Label>
            <Input
              id="lastName"
              value={formData.last_name}
              onChange={(e) => setFormData(prev => ({ ...prev, last_name: e.target.value }))}
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="phone" className="text-sm">Phone Number</Label>
          <Input
            id="phone"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className="text-sm"
          />
        </div>

        <div>
          <Label htmlFor="address" className="text-sm">Address</Label>
          <Input
            id="address"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="text-sm"
          />
        </div>

        <div>
          <Label htmlFor="emergency" className="text-sm">Emergency Contact</Label>
          <Input
            id="emergency"
            value={formData.emergency_contact}
            onChange={(e) => setFormData(prev => ({ ...prev, emergency_contact: e.target.value }))}
            placeholder="Name and phone number"
            className="text-sm"
          />
        </div>

        <div>
          <Label htmlFor="medical" className="text-sm">Medical History</Label>
          <Textarea
            id="medical"
            value={formData.medical_history}
            onChange={(e) => setFormData(prev => ({ ...prev, medical_history: e.target.value }))}
            placeholder="Allergies, medications, conditions..."
            className="text-sm min-h-[80px]"
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading} className="flex-1">
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Settings Widget
const QuickSettingsWidget = ({ 
  onLanguageChange, 
  onThemeChange 
}: { 
  onLanguageChange: (lang: string) => void;
  onThemeChange: (theme: string) => void;
}) => {
  const { currentLanguage } = useLanguage();
  const { theme } = useTheme();

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'nl', name: 'Nederlands', flag: '🇳🇱' }
  ];

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Globe className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Quick Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Language</Label>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {languages.map((lang) => (
              <Button
                key={lang.code}
                variant={currentLanguage === lang.code ? "default" : "outline"}
                size="sm"
                onClick={() => onLanguageChange(lang.code)}
                className="flex items-center gap-1"
              >
                <span>{lang.flag}</span>
                <span className="text-xs">{lang.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator />

        <div>
          <Label className="text-sm font-medium">Theme</Label>
          <div className="flex gap-2 mt-2">
            <Button
              variant={theme === 'light' ? "default" : "outline"}
              size="sm"
              onClick={() => onThemeChange('light')}
              className="flex-1 flex items-center gap-2"
            >
              <Sun className="h-4 w-4" />
              Light
            </Button>
            <Button
              variant={theme === 'dark' ? "default" : "outline"}
              size="sm"
              onClick={() => onThemeChange('dark')}
              className="flex-1 flex items-center gap-2"
            >
              <Moon className="h-4 w-4" />
              Dark
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Image Upload Widget
const ImageUploadWidget = ({ 
  onUpload, 
  onCancel 
}: { 
  onUpload: (file: File) => void;
  onCancel: () => void;
}) => {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Camera className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Upload Image</CardTitle>
        <p className="text-sm text-muted-foreground">Share a photo or X-ray</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <FileImage className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Drag and drop an image here, or click to select
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <Label htmlFor="file-upload" className="cursor-pointer">
            <Button variant="outline" className="mt-2" asChild>
              <span>Select File</span>
            </Button>
          </Label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button variant="outline" className="flex-1">
            <CameraIcon className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Quick Actions Widget
const QuickActionsWidget = ({ 
  onAction 
}: { 
  onAction: (action: string) => void;
}) => {
  const actions = [
    { id: 'appointments', label: 'Show my appointments', icon: CalendarIcon },
    { id: 'earliest', label: 'Find earliest slot', icon: Clock },
    { id: 'emergency', label: 'Emergency booking', icon: AlertTriangle },
    { id: 'symptoms', label: 'Check my symptoms', icon: Info },
    { id: 'help', label: 'Help & FAQ', icon: HelpCircle }
  ];

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Info className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {actions.map((action) => (
          <Button
            key={action.id}
            variant="outline"
            onClick={() => onAction(action.id)}
            className="w-full justify-start"
          >
            <action.icon className="h-4 w-4 mr-2" />
            {action.label}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

// Urgency Slider Widget
const UrgencySliderWidget = ({
  value, 
  onChange 
}: { 
  value: number;
  onChange: (value: number) => void;
}) => {
  const urgencyLabels = ['Low', 'Medium', 'High', 'Emergency'];
  
  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <AlertTriangle className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">How urgent is this?</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="px-4">
          <Slider
            value={[value]}
            onValueChange={(values) => onChange(values[0])}
            max={3}
            min={0}
            step={1}
            className="w-full"
          />
        </div>
        <div className="flex justify-between text-sm text-muted-foreground px-2">
          {urgencyLabels.map((label, index) => (
            <span key={index} className={value === index ? 'text-primary font-medium' : ''}>
              {label}
            </span>
          ))}
        </div>
        <p className="text-center text-sm">
          Current: <span className="font-medium text-primary">{urgencyLabels[value]}</span>
        </p>
      </CardContent>
    </Card>
  );
};

// Symptom Intake Widget
const SymptomIntakeWidget = ({
  onComplete,
  onCancel
}: {
  onComplete: (data: {
    primarySymptoms: string[];
    severity: number;
    duration: string;
    notes?: string;
    hasFever?: boolean;
    hasSwelling?: boolean;
    hasBleeding?: boolean;
  }) => void;
  onCancel: () => void;
}) => {
  const [primarySymptoms, setPrimarySymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(2);
  const [duration, setDuration] = useState("");
  const [notes, setNotes] = useState("");
  const [hasFever, setHasFever] = useState(false);
  const [hasSwelling, setHasSwelling] = useState(false);
  const [hasBleeding, setHasBleeding] = useState(false);

  const toggleSymptom = (symptom: string) => {
    setPrimarySymptoms(prev => prev.includes(symptom) ? prev.filter(s => s !== symptom) : [...prev, symptom]);
  };

  const canContinue = primarySymptoms.length > 0 && duration !== "";

  const symptomOptions = [
    'Toothache',
    'Sensitivity to cold',
    'Sensitivity to heat',
    'Swollen gums',
    'Bleeding gums',
    'Bad breath',
    'Jaw pain',
    'Broken tooth',
    'Lost filling',
    'Other'
  ];

  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Heart className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Tell us about your symptoms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label className="text-sm font-medium">Primary symptoms</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {symptomOptions.map((symptom) => (
              <Button
                key={symptom}
                variant={primarySymptoms.includes(symptom) ? 'default' : 'outline'}
                size="sm"
                onClick={() => toggleSymptom(symptom)}
                className="justify-start"
              >
                {symptom}
              </Button>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Severity</Label>
          <div className="px-2 mt-2">
            <Slider value={[severity]} max={10} min={0} step={1} onValueChange={(v) => setSeverity(v[0])} />
          </div>
          <div className="flex justify-between text-xs text-muted-foreground px-1">
            <span>Mild</span>
            <span>Severe</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div>
            <Label className="text-sm font-medium">Duration</Label>
            <Select value={duration} onValueChange={setDuration}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="<1 day">Less than 1 day</SelectItem>
                <SelectItem value="1-3 days">1-3 days</SelectItem>
                <SelectItem value="4-7 days">4-7 days</SelectItem>
                <SelectItem value="1-2 weeks">1-2 weeks</SelectItem>
                <SelectItem value=">2 weeks">More than 2 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="fever" checked={hasFever} onCheckedChange={(v) => setHasFever(Boolean(v))} />
              <Label htmlFor="fever" className="text-sm">Fever</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="swelling" checked={hasSwelling} onCheckedChange={(v) => setHasSwelling(Boolean(v))} />
              <Label htmlFor="swelling" className="text-sm">Swelling</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="bleeding" checked={hasBleeding} onCheckedChange={(v) => setHasBleeding(Boolean(v))} />
              <Label htmlFor="bleeding" className="text-sm">Bleeding</Label>
            </div>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Notes (optional)</Label>
          <Textarea
            placeholder="Describe your pain, triggers, or anything else..."
            className="min-h-[80px]"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={() => onComplete({ primarySymptoms, severity, duration, notes, hasFever, hasSwelling, hasBleeding })}
            disabled={!canContinue}
            className="flex-1"
          >
            Continue
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Symptom Summary Widget
const SymptomSummaryWidget = ({
  summary,
  onBook,
  onEdit
}: {
  summary: {
    primarySymptoms: string[];
    severity: number;
    duration: string;
    notes?: string;
    urgent: boolean;
    recommendation: string;
  };
  onBook: () => void;
  onEdit: () => void;
}) => {
  return (
    <Card className="max-w-md mx-auto my-4 border-primary/20 shadow-lg">
      <CardHeader className="text-center">
        <Info className="h-8 w-8 mx-auto text-primary mb-2" />
        <CardTitle className="text-lg">Symptom Summary</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-sm">
          <p><strong>Symptoms:</strong> {summary.primarySymptoms.join(", ")}</p>
          <p><strong>Severity:</strong> {summary.severity}/10</p>
          <p><strong>Duration:</strong> {summary.duration}</p>
          {summary.notes && <p><strong>Notes:</strong> {summary.notes}</p>}
        </div>
        <div className={`text-sm p-3 rounded-md ${summary.urgent ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {summary.recommendation}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onEdit} className="flex-1">
            Edit
          </Button>
          <Button onClick={onBook} className="flex-1">
            Book now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};


export {
  PrivacyConsentWidget,
  InlineCalendarWidget,
  TimeSlotsWidget,
  DentistSelectionWidget,
  AppointmentConfirmationWidget,
  PersonalInfoFormWidget,
  QuickSettingsWidget,
  ImageUploadWidget,
  QuickActionsWidget,
  UrgencySliderWidget,
  SymptomIntakeWidget,
  SymptomSummaryWidget
};