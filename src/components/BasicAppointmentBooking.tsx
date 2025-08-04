import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const BasicAppointmentBooking = () => {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    preferredDate: '',
    preferredTime: '',
    reason: '',
    urgency: 'medium',
    notes: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple form validation
    if (!formData.preferredDate || !formData.reason) {
      toast({
        title: "Missing Information",
        description: "Please fill in the preferred date and reason for your visit.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Booking Request Submitted",
      description: "Your appointment request has been submitted. We'll contact you soon to confirm.",
    });

    // Reset form
    setFormData({
      preferredDate: '',
      preferredTime: '',
      reason: '',
      urgency: 'medium',
      notes: ''
    });
  };

  const urgencyOptions = [
    { value: 'low', label: 'Routine / Non-urgent', color: 'text-green-600' },
    { value: 'medium', label: 'Moderate', color: 'text-yellow-600' },
    { value: 'high', label: 'Urgent', color: 'text-orange-600' },
    { value: 'emergency', label: 'Emergency', color: 'text-red-600' }
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-blue-600" />
          Book an Appointment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="preferredDate">Preferred Date *</Label>
              <Input
                id="preferredDate"
                type="date"
                value={formData.preferredDate}
                onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="preferredTime">Preferred Time</Label>
              <Input
                id="preferredTime"
                type="time"
                value={formData.preferredTime}
                onChange={(e) => handleInputChange('preferredTime', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reason">Reason for Visit *</Label>
            <Input
              id="reason"
              value={formData.reason}
              onChange={(e) => handleInputChange('reason', e.target.value)}
              placeholder="e.g., Regular checkup, tooth pain, cleaning..."
              required
            />
          </div>

          <div>
            <Label htmlFor="urgency">Urgency Level</Label>
            <Select value={formData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select urgency level" />
              </SelectTrigger>
              <SelectContent>
                {urgencyOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center">
                      {option.value === 'emergency' && <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />}
                      <span className={option.color}>{option.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Any additional information about your visit..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              <Calendar className="h-4 w-4 mr-2" />
              Submit Request
            </Button>
          </div>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <Clock className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">What happens next?</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>We'll review your request within 2 business hours</li>
                  <li>Our team will contact you to confirm the appointment</li>
                  <li>You'll receive a confirmation via email/SMS</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};