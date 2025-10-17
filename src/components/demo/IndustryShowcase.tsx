import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useIndustryTerminology } from '@/hooks/useIndustryTerminology';
import { Badge } from '@/components/ui/badge';
import { 
  Stethoscope, 
  Dumbbell, 
  Scissors, 
  Briefcase, 
  Scale, 
  GraduationCap 
} from 'lucide-react';

export const IndustryShowcase: React.FC = () => {
  const { terminology } = useIndustryTerminology();

  const examples = [
    {
      icon: Stethoscope,
      title: 'Healthcare',
      description: 'Medical practices and clinics',
      color: 'text-blue-600',
    },
    {
      icon: Dumbbell,
      title: 'Fitness',
      description: 'Gyms and personal training',
      color: 'text-orange-600',
    },
    {
      icon: Scissors,
      title: 'Beauty',
      description: 'Salons and spas',
      color: 'text-pink-600',
    },
    {
      icon: Briefcase,
      title: 'Consulting',
      description: 'Professional services',
      color: 'text-purple-600',
    },
    {
      icon: Scale,
      title: 'Legal',
      description: 'Law firms and attorneys',
      color: 'text-amber-600',
    },
    {
      icon: GraduationCap,
      title: 'Education',
      description: 'Tutoring and coaching',
      color: 'text-green-600',
    },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Industry Terms</CardTitle>
          <CardDescription>
            Customized terminology for your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Service Provider</p>
              <p className="font-semibold">{terminology.provider}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Customer/Client</p>
              <p className="font-semibold">{terminology.client}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Booking</p>
              <p className="font-semibold">{terminology.appointment}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Service Type</p>
              <p className="font-semibold">{terminology.service}</p>
            </div>
            <div className="p-3 border rounded-lg">
              <p className="text-sm text-muted-foreground">Billing</p>
              <p className="font-semibold">{terminology.payment}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <h3 className="text-lg font-semibold mb-4">Supported Industries</h3>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {examples.map((example) => {
            const Icon = example.icon;
            return (
              <Card key={example.title}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${example.color}`} />
                    <CardTitle className="text-base">{example.title}</CardTitle>
                  </div>
                  <CardDescription className="text-sm">
                    {example.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};
