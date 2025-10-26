import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  FileText, 
  Pill, 
  Calendar, 
  CreditCard, 
  Camera, 
  AlertTriangle,
  Save
} from 'lucide-react';
import { TemplateFeatures, TemplateTerminology } from '@/lib/businessTemplates';

interface CustomTemplateConfiguratorProps {
  initialFeatures?: TemplateFeatures;
  initialTerminology?: TemplateTerminology;
  onSave: (features: TemplateFeatures, terminology: TemplateTerminology) => void;
}

const featureDefinitions = [
  {
    key: 'aiChat' as keyof TemplateFeatures,
    name: 'AI Chat Assistant',
    description: 'Enable AI-powered chat for appointment booking and customer support',
    icon: MessageSquare,
  },
  {
    key: 'prescriptions' as keyof TemplateFeatures,
    name: 'Prescriptions',
    description: 'Manage and issue digital prescriptions',
    icon: Pill,
  },
  {
    key: 'treatmentPlans' as keyof TemplateFeatures,
    name: 'Treatment Plans',
    description: 'Create and track comprehensive treatment or service plans',
    icon: FileText,
  },
  {
    key: 'medicalRecords' as keyof TemplateFeatures,
    name: 'Medical Records',
    description: 'Store and access complete medical history',
    icon: FileText,
  },
  {
    key: 'photoUpload' as keyof TemplateFeatures,
    name: 'Photo Upload',
    description: 'Upload and manage photos for documentation',
    icon: Camera,
  },
  {
    key: 'urgencyLevels' as keyof TemplateFeatures,
    name: 'Urgency Levels',
    description: 'Priority-based scheduling for urgent appointments',
    icon: AlertTriangle,
  },
  {
    key: 'paymentRequests' as keyof TemplateFeatures,
    name: 'Payment Requests',
    description: 'Send and track payment requests',
    icon: CreditCard,
  },
];

export function CustomTemplateConfigurator({ 
  initialFeatures, 
  initialTerminology,
  onSave 
}: CustomTemplateConfiguratorProps) {
  const [features, setFeatures] = useState<TemplateFeatures>(
    initialFeatures || {
      prescriptions: false,
      treatmentPlans: false,
      medicalRecords: false,
      photoUpload: true,
      urgencyLevels: false,
      paymentRequests: true,
      aiChat: true,
      appointments: true,
      services: true,
    }
  );

  const [terminology, setTerminology] = useState<TemplateTerminology>(
    initialTerminology || {
      customer: 'Customer',
      customerPlural: 'Customers',
      provider: 'Provider',
      providerPlural: 'Providers',
      appointment: 'Appointment',
      appointmentPlural: 'Appointments',
      service: 'Service',
      servicePlural: 'Services',
      business: 'Business',
    }
  );

  const handleFeatureToggle = (key: keyof TemplateFeatures) => {
    setFeatures(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleTerminologyChange = (key: keyof TemplateTerminology, value: string) => {
    setTerminology(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    onSave(features, terminology);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Features</CardTitle>
          <CardDescription>
            Select which features you want to include in your custom template
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {featureDefinitions.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.key} className="flex items-start justify-between gap-4 p-3 rounded-lg border">
                <div className="flex items-start gap-3 flex-1">
                  <Icon className="h-5 w-5 text-primary mt-0.5" />
                  <div className="flex-1">
                    <Label className="text-base font-medium">{feature.name}</Label>
                    <p className="text-sm text-muted-foreground mt-1">
                      {feature.description}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={features[feature.key]}
                  onCheckedChange={() => handleFeatureToggle(feature.key)}
                />
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Terminology</CardTitle>
          <CardDescription>
            Customize the terminology used throughout your platform
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer">Customer (singular)</Label>
              <Input
                id="customer"
                value={terminology.customer}
                onChange={(e) => handleTerminologyChange('customer', e.target.value)}
                placeholder="e.g., Patient, Client, Member"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPlural">Customer (plural)</Label>
              <Input
                id="customerPlural"
                value={terminology.customerPlural}
                onChange={(e) => handleTerminologyChange('customerPlural', e.target.value)}
                placeholder="e.g., Patients, Clients, Members"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider">Provider (singular)</Label>
              <Input
                id="provider"
                value={terminology.provider}
                onChange={(e) => handleTerminologyChange('provider', e.target.value)}
                placeholder="e.g., Doctor, Stylist, Trainer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="providerPlural">Provider (plural)</Label>
              <Input
                id="providerPlural"
                value={terminology.providerPlural}
                onChange={(e) => handleTerminologyChange('providerPlural', e.target.value)}
                placeholder="e.g., Doctors, Stylists, Trainers"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment">Appointment (singular)</Label>
              <Input
                id="appointment"
                value={terminology.appointment}
                onChange={(e) => handleTerminologyChange('appointment', e.target.value)}
                placeholder="e.g., Appointment, Session, Booking"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointmentPlural">Appointment (plural)</Label>
              <Input
                id="appointmentPlural"
                value={terminology.appointmentPlural}
                onChange={(e) => handleTerminologyChange('appointmentPlural', e.target.value)}
                placeholder="e.g., Appointments, Sessions, Bookings"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service">Service (singular)</Label>
              <Input
                id="service"
                value={terminology.service}
                onChange={(e) => handleTerminologyChange('service', e.target.value)}
                placeholder="e.g., Treatment, Service, Package"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="servicePlural">Service (plural)</Label>
              <Input
                id="servicePlural"
                value={terminology.servicePlural}
                onChange={(e) => handleTerminologyChange('servicePlural', e.target.value)}
                placeholder="e.g., Treatments, Services, Packages"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business">Business</Label>
              <Input
                id="business"
                value={terminology.business}
                onChange={(e) => handleTerminologyChange('business', e.target.value)}
                placeholder="e.g., Clinic, Salon, Studio"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} size="lg">
          <Save className="h-4 w-4 mr-2" />
          Save Custom Configuration
        </Button>
      </div>
    </div>
  );
}
