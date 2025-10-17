import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Building2, Sparkles } from 'lucide-react';

export const MainLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen mesh-bg">
      {/* Hero Section */}
      <div className="container max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold gradient-text mb-6">
            DentiBot
          </h1>
          <p className="text-2xl text-muted-foreground mb-8">
            The All-in-One Platform for Service Businesses
          </p>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Manage appointments, clients, and grow your business with ease. 
            Perfect for healthcare, fitness, beauty, consulting, and more.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/signup')}>
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate('/login')}>
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-16">
          <div className="bg-card border rounded-lg p-6 text-center">
            <Calendar className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Smart Scheduling</h3>
            <p className="text-sm text-muted-foreground">
              Automated booking and calendar management
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Client Management</h3>
            <p className="text-sm text-muted-foreground">
              Keep track of all your clients in one place
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6 text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">Your Own Site</h3>
            <p className="text-sm text-muted-foreground">
              Get a professional booking site instantly
            </p>
          </div>
          <div className="bg-card border rounded-lg p-6 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-primary" />
            <h3 className="font-semibold mb-2">AI Assistant</h3>
            <p className="text-sm text-muted-foreground">
              Smart chatbot to help your clients 24/7
            </p>
          </div>
        </div>

        {/* Industries Section */}
        <div className="bg-card border rounded-lg p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8">
            Built for Every Service Industry
          </h2>
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div>
              <h4 className="font-semibold mb-2">Healthcare</h4>
              <p className="text-sm text-muted-foreground">
                Dentists, Doctors, Therapists
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Fitness & Beauty</h4>
              <p className="text-sm text-muted-foreground">
                Gyms, Salons, Spas, Trainers
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Professional Services</h4>
              <p className="text-sm text-muted-foreground">
                Consultants, Lawyers, Tutors
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button size="lg" onClick={() => navigate('/signup')}>
            Create Your Business Site
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MainLanding;