import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, User as UserIcon, CheckCircle, ArrowLeft, ArrowRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface AppointmentBookingWithAuthProps {
  user: User;
  selectedDentist?: any;
  prefilledReason?: string;
  onComplete: (appointmentData: any) => void;
  onCancel: () => void;
}

export const AppointmentBookingWithAuth = ({ 
  user, 
  selectedDentist, 
  prefilledReason, 
  onComplete, 
  onCancel 
}: AppointmentBookingWithAuthProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    reason: prefilledReason || "",
    urgency: "routine",
    symptoms: "",
    previousVisit: "no",
    insurance: "no"
  });
  const { toast } = useToast();

  const steps = [
    { id: 1, title: "Reason for Visit", icon: "🦷" },
    { id: 2, title: "Symptoms", icon: "📋" },
    { id: 3, title: "Review & Confirm", icon: "✅" }
  ];

  const urgencyOptions = [
    { value: "routine", label: "Routine Checkup", description: "Regular cleaning or checkup" },
    { value: "mild", label: "Mild Discomfort", description: "Slight pain or sensitivity" },
    { value: "moderate", label: "Moderate Pain", description: "Noticeable pain or issue" },
    { value: "severe", label: "Severe Pain", description: "Significant pain or emergency" }
  ];

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Simulate appointment creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const appointmentData = {
        id: crypto.randomUUID(),
        dentist: selectedDentist,
        reason: formData.reason,
        urgency: formData.urgency,
        symptoms: formData.symptoms,
        status: "confirmed",
        message: "Your appointment has been confirmed! We'll send you a reminder before your scheduled time."
      };
      
      onComplete(appointmentData);
      
      toast({
        title: "Success!",
        description: "Appointment request submitted successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error creating appointment:", error);
      toast({
        title: "Error",
        description: "Failed to create appointment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.reason.trim().length > 0;
      case 2:
        return formData.symptoms.trim().length > 0;
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-6">
        {steps.map((stepItem, index) => (
          <div key={stepItem.id} className="flex items-center">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
              step >= stepItem.id 
                ? 'bg-blue-500 border-blue-500 text-white' 
                : 'bg-gray-100 border-gray-300 text-gray-500'
            }`}>
              <span className="text-sm">{stepItem.icon}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`w-16 h-0.5 mx-2 ${
                step > stepItem.id ? 'bg-blue-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <Card className="shadow-lg border-0">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-xl font-semibold text-gray-900">
            {steps[step - 1].title}
          </CardTitle>
          <p className="text-gray-600">
            {step === 1 && "Tell us why you're visiting today"}
            {step === 2 && "Describe your symptoms or concerns"}
            {step === 3 && "Review your appointment details"}
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Step 1: Reason for Visit */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What brings you in today?
                </label>
                <Textarea
                  value={formData.reason}
                  onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                  placeholder="e.g., Tooth pain, cleaning, checkup, braces consultation..."
                  className="min-h-[100px] resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How urgent is this?
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {urgencyOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                        formData.urgency === option.value
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setFormData({ ...formData, urgency: option.value })}
                    >
                      <div className="font-medium text-sm">{option.label}</div>
                      <div className="text-xs text-gray-600 mt-1">{option.description}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Symptoms */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Describe your symptoms
                </label>
                <Textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="e.g., Sharp pain when eating, sensitivity to cold, bleeding gums..."
                  className="min-h-[120px] resize-none"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Have you visited us before?
                  </label>
                  <Select value={formData.previousVisit} onValueChange={(value) => setFormData({ ...formData, previousVisit: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, I'm a returning patient</SelectItem>
                      <SelectItem value="no">No, this is my first visit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Do you have dental insurance?
                  </label>
                  <Select value={formData.insurance} onValueChange={(value) => setFormData({ ...formData, insurance: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yes">Yes, I have insurance</SelectItem>
                      <SelectItem value="no">No, I don't have insurance</SelectItem>
                      <SelectItem value="unsure">I'm not sure</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {step === 3 && (
            <div className="space-y-6">
              {/* Dentist Info */}
              {selectedDentist && (
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">
                        Dr. {selectedDentist.profiles.first_name} {selectedDentist.profiles.last_name}
                      </h4>
                      <p className="text-sm text-gray-600">{selectedDentist.specialty}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Appointment Details</h4>
                
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Reason for Visit</span>
                    <span className="text-sm font-medium">{formData.reason}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Urgency Level</span>
                    <Badge variant="secondary">
                      {urgencyOptions.find(opt => opt.value === formData.urgency)?.label}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Previous Visit</span>
                    <span className="text-sm font-medium capitalize">{formData.previousVisit}</span>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <span className="text-sm text-gray-600">Insurance</span>
                    <span className="text-sm font-medium capitalize">{formData.insurance}</span>
                  </div>
                </div>
              </div>

              {/* Symptoms Summary */}
              {formData.symptoms && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Symptoms</h4>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">{formData.symptoms}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={step === 1 ? onCancel : handleBack}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              onClick={step === 3 ? handleSubmit : handleNext}
              disabled={!canProceed() || isLoading}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting...
                </>
              ) : step === 3 ? (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Submit Request
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};