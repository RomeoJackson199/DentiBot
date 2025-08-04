import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PrivacyPolicy = () => {
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
              Privacy Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-slate max-w-none space-y-6">
            <section>
              <h3 className="text-xl font-semibold mb-3">Legal Basis</h3>
              <p className="text-muted-foreground">
                Explicit consent (checked during registration). If you are entering data for a patient under 16, 
                you confirm you are their parent or legal guardian and consent to processing their data.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">What Data We Collect</h3>
              <p className="text-muted-foreground">
                Name, contact info, health history, appointment info, and any information you voluntarily provide 
                during consultations and appointments.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Why We Collect It</h3>
              <p className="text-muted-foreground">
                Scheduling, reminders, and enabling dentists to treat patients effectively. We also use this 
                information to improve our services and ensure proper medical care.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Who Can Access It</h3>
              <p className="text-muted-foreground">
                The dentist you booked with and their authorized staff. We do not share your information 
                with unauthorized third parties.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">How We Store It</h3>
              <p className="text-muted-foreground">
                Secure EU-based servers, encrypted, with strict access controls. All data is protected 
                according to GDPR and HIPAA standards.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Your Rights</h3>
              <p className="text-muted-foreground">
                You can request a copy of your data, correct it, or have it deleted anytime. 
                Contact us to exercise these rights.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Data Retention</h3>
              <p className="text-muted-foreground">
                We delete inactive patient data after 24 months unless the dentist retains it longer 
                under medical obligations.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">AI Disclaimer</h3>
              <p className="text-muted-foreground">
                Our platform uses AI to assist with consultations and recommendations. This AI is a tool 
                to support healthcare professionals and is not a replacement for professional medical advice.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold mb-3">Contact</h3>
              <p className="text-muted-foreground">
                For privacy requests, email privacy@dentibot.be or contact us through our support page.
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

export default PrivacyPolicy;
