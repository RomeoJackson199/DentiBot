import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="mb-4 text-muted-foreground hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
        </div>

        <Card className="shadow-xl border-0">
          <CardHeader>
            <CardTitle className="text-3xl text-center text-primary">
              Terms of Service
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-3">1. Introduction</h3>
              <p className="text-muted-foreground">
                Welcome to DentalCare. These Terms of Service govern your use of our dental care platform. 
                By accessing or using our service, you agree to be bound by these terms.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">2. Use of Service</h3>
              <p className="text-muted-foreground">
                Our platform provides dental consultation, appointment booking, and health record management services. 
                You must be at least 18 years old to use our service independently, or have parental consent if under 18.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">3. Privacy & Data Protection</h3>
              <p className="text-muted-foreground">
                We are committed to protecting your privacy and personal health information. All data is processed 
                in accordance with GDPR and HIPAA regulations. Your medical information is encrypted and securely stored.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">4. Medical Disclaimer</h3>
              <p className="text-muted-foreground">
                This platform provides general dental information and consultation services. It is not a substitute 
                for professional medical advice, diagnosis, or treatment. Always seek the advice of qualified 
                healthcare providers for any medical concerns.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">5. User Responsibilities</h3>
              <p className="text-muted-foreground">
                You are responsible for providing accurate information, maintaining the confidentiality of your 
                account, and using the service in accordance with applicable laws and regulations.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">6. Emergency Situations</h3>
              <p className="text-muted-foreground">
                This service is not intended for emergency situations. In case of a dental emergency, 
                please contact emergency services or visit the nearest emergency room immediately.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">7. Limitation of Liability</h3>
              <p className="text-muted-foreground">
                We provide this service "as is" and disclaim all warranties. We shall not be liable for any 
                indirect, incidental, or consequential damages arising from your use of the service.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">8. Changes to Terms</h3>
              <p className="text-muted-foreground">
                We reserve the right to modify these terms at any time. Changes will be effective when posted 
                on this page. Your continued use of the service constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">9. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us through our support page.
              </p>
            </section>

            <div className="text-center pt-6 border-t">
              <p className="text-sm text-muted-foreground">
                Last updated: January 2024
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;