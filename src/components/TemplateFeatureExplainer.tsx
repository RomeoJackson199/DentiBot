import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  FileText, 
  Pill, 
  Calendar, 
  CreditCard, 
  Camera, 
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react';

interface FeatureExplanation {
  id: string;
  name: string;
  description: string;
  icon: any;
  enabled: boolean;
}

interface TemplateFeatureExplainerProps {
  features: {
    prescriptions: boolean;
    treatmentPlans: boolean;
    medicalRecords: boolean;
    photoUpload: boolean;
    urgencyLevels: boolean;
    paymentRequests: boolean;
    aiChat: boolean;
    appointments: boolean;
    services: boolean;
  };
}

export function TemplateFeatureExplainer({ features }: TemplateFeatureExplainerProps) {
  const featureExplanations: FeatureExplanation[] = [
    {
      id: 'aiChat',
      name: 'AI Chat Assistant',
      description: 'Get instant AI-powered insights for appointments, helping customers book faster with intelligent conversation.',
      icon: MessageSquare,
      enabled: features.aiChat,
    },
    {
      id: 'prescriptions',
      name: 'Prescriptions',
      description: 'Manage and issue digital prescriptions directly from the platform.',
      icon: Pill,
      enabled: features.prescriptions,
    },
    {
      id: 'treatmentPlans',
      name: 'Treatment Plans',
      description: 'Create and track comprehensive treatment or service plans for your customers.',
      icon: FileText,
      enabled: features.treatmentPlans,
    },
    {
      id: 'medicalRecords',
      name: 'Medical Records',
      description: 'Store and access complete medical history and health data securely.',
      icon: FileText,
      enabled: features.medicalRecords,
    },
    {
      id: 'photoUpload',
      name: 'Photo Upload',
      description: 'Upload and manage photos for before/after comparisons and documentation.',
      icon: Camera,
      enabled: features.photoUpload,
    },
    {
      id: 'urgencyLevels',
      name: 'Urgency Levels',
      description: 'Priority-based scheduling for emergency and urgent appointments.',
      icon: AlertTriangle,
      enabled: features.urgencyLevels,
    },
    {
      id: 'paymentRequests',
      name: 'Payment Requests',
      description: 'Send and track payment requests for services rendered.',
      icon: CreditCard,
      enabled: features.paymentRequests,
    },
    {
      id: 'appointments',
      name: 'Appointments',
      description: 'Full-featured appointment booking and management system.',
      icon: Calendar,
      enabled: features.appointments,
    },
  ];

  const enabledFeatures = featureExplanations.filter(f => f.enabled);
  const disabledFeatures = featureExplanations.filter(f => !f.enabled);

  return (
    <div className="space-y-6">
      {enabledFeatures.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            Enabled Features
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {enabledFeatures.map((feature) => (
              <Card key={feature.id} className="border-green-200 bg-green-50/50">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <feature.icon className="h-4 w-4 text-green-600" />
                    {feature.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <CardDescription className="text-xs">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {disabledFeatures.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-muted-foreground" />
            Not Included
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {disabledFeatures.map((feature) => (
              <Card key={feature.id} className="opacity-60">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <feature.icon className="h-4 w-4 text-muted-foreground" />
                    {feature.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <CardDescription className="text-xs">{feature.description}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
