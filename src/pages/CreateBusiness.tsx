import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { BusinessCreationAuth } from '@/components/business-creation/BusinessCreationAuth';
import { BusinessTemplateStep } from '@/components/business-creation/BusinessTemplateStep';
import { BusinessDetailsStep } from '@/components/business-creation/BusinessDetailsStep';
import { BusinessServicesStep } from '@/components/business-creation/BusinessServicesStep';
import { BusinessPaymentStep } from '@/components/business-creation/BusinessPaymentStep';
import { BusinessCreationTour } from '@/components/business-creation/BusinessCreationTour';
import { TemplateType } from '@/lib/businessTemplates';

interface BusinessData {
  template?: TemplateType;
  customFeatures?: any;
  customTerminology?: any;
  name?: string;
  tagline?: string;
  bio?: string;
  services?: Array<{ name: string; price: number; duration?: number }>;
}

const STEPS = [
  { id: 1, name: 'Sign Up', description: 'Create your account' },
  { id: 2, name: 'Template', description: 'Choose your business type' },
  { id: 3, name: 'Details', description: 'Enter business information' },
  { id: 4, name: 'Services', description: 'Add your services' },
  { id: 5, name: 'Payment', description: 'Complete setup ($0.50)' },
];

export default function CreateBusiness() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [businessData, setBusinessData] = useState<BusinessData>({});
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showTour, setShowTour] = useState(true);

  const progress = (currentStep / STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateBusinessData = (data: Partial<BusinessData>) => {
    setBusinessData({ ...businessData, ...data });
  };

  const handleAuthComplete = () => {
    setIsAuthenticated(true);
    handleNext();
  };

  const handlePaymentComplete = (businessId: string) => {
    navigate(`/dentist-portal`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-background dark:via-background dark:to-primary/5">
      <BusinessCreationTour
        currentStep={currentStep}
        isOpen={showTour}
        onClose={() => setShowTour(false)}
      />

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white mb-4 shadow-lg">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-3">
            Create Your Business
          </h1>
          <p className="text-muted-foreground text-lg">Set up your business in just 5 simple steps</p>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="max-w-5xl mx-auto mb-10">
          <div className="flex items-center justify-between mb-6">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: currentStep === step.id ? 1.1 : 1 }}
                    transition={{ duration: 0.3 }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all shadow-lg ${
                      currentStep > step.id
                        ? 'bg-gradient-to-br from-green-500 to-emerald-600 text-white'
                        : currentStep === step.id
                        ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white ring-4 ring-blue-200 dark:ring-blue-900'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? <CheckCircle2 className="w-6 h-6" /> : step.id}
                  </motion.div>
                  <div className="mt-3 text-center hidden md:block">
                    <p className={`text-sm font-semibold ${currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
                {index < STEPS.length - 1 && (
                  <div className="flex-1 h-1.5 mx-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: currentStep > step.id ? '100%' : '0%' }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-600"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
          <Progress value={progress} className="h-3 shadow-inner" />
          <p className="text-center text-sm text-muted-foreground mt-3">
            Step {currentStep} of {STEPS.length} - {Math.round(progress)}% Complete
          </p>
        </div>

        {/* Step Content */}
        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="p-8">
                {currentStep === 1 && (
                  <BusinessCreationAuth onComplete={handleAuthComplete} />
                )}

                {currentStep === 2 && (
                  <BusinessTemplateStep
                    selectedTemplate={businessData.template}
                    onSelect={(template, customFeatures, customTerminology) => {
                      updateBusinessData({ template, customFeatures, customTerminology });
                    }}
                  />
                )}

                {currentStep === 3 && (
                  <BusinessDetailsStep
                    businessData={businessData}
                    onUpdate={updateBusinessData}
                  />
                )}

                {currentStep === 4 && (
                  <BusinessServicesStep
                    services={businessData.services || []}
                    template={businessData.template}
                    onUpdate={(services) => updateBusinessData({ services })}
                  />
                )}

                {currentStep === 5 && (
                  <BusinessPaymentStep
                    businessData={businessData}
                    onComplete={handlePaymentComplete}
                  />
                )}

                {/* Navigation Buttons */}
                {currentStep > 1 && (
                  <div className="flex items-center justify-between mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handleBack}
                      disabled={currentStep === 1}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back
                    </Button>

                    {currentStep < STEPS.length && (
                      <Button onClick={handleNext}>
                        Next
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </div>
                )}
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
