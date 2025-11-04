import React from "react";
import { Calendar, Users, Shield, Sparkles, Target, Heart } from "lucide-react";
import { Card } from "@/components/ui/card";

const About = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-20 px-4">
        <div className="container mx-auto max-w-5xl text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm font-medium mb-6">
            <Sparkles className="h-4 w-4" />
            <span>About Us</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Simplifying Practice Management with AI
          </h1>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Caberu is an AI-powered practice management platform designed to help dental practices and hair salons
            reduce administrative work, increase revenue, and deliver exceptional customer experiences.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16 max-w-5xl">

        {/* What We Do */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">What We Do</h2>
          <p className="text-lg text-gray-600 leading-relaxed mb-8 text-center max-w-3xl mx-auto">
            From appointment scheduling to customer records, payments to inventory management—Caberu streamlines every aspect
            of running a dental practice or hair salon. Our AI-powered platform reduces administrative work by up to 60%,
            giving you more time to focus on what matters most: your customers.
          </p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6 border-2 border-blue-100 hover:border-blue-300 transition-all">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4">
                <Calendar className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Dental Practices</h3>
              <p className="text-gray-600 leading-relaxed">
                Complete practice management including patient intake, appointment scheduling, treatment plans,
                prescriptions, billing, and HIPAA-compliant record keeping.
              </p>
            </Card>

            <Card className="p-6 border-2 border-purple-100 hover:border-purple-300 transition-all">
              <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4">
                <Users className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">For Hair Salons</h3>
              <p className="text-gray-600 leading-relaxed">
                Smart booking system, stylist management, earnings tracking, inventory control, and client relationship
                management—from solo stylists to multi-location salons.
              </p>
            </Card>
          </div>
        </section>

        {/* Our Mission */}
        <section className="mb-16 bg-white rounded-2xl p-8 md:p-12 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex p-3 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500">
              <Target className="h-6 w-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">Our Mission</h2>
          </div>
          <p className="text-lg text-gray-600 leading-relaxed mb-6">
            Our mission is to empower service businesses with intelligent automation that enhances both business efficiency
            and customer satisfaction. We believe technology should simplify your work, not complicate it.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                <h3 className="font-semibold text-gray-900">AI-Powered Automation</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Smart scheduling, predictive insights, and automated communications that save hours every day.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Heart className="h-5 w-5 text-pink-600" />
                <h3 className="font-semibold text-gray-900">Customer Experience</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Easy online booking, automated reminders, and seamless communication that keep customers coming back.
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-blue-600" />
                <h3 className="font-semibold text-gray-900">Security First</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Enterprise-grade security with full GDPR compliance and HIPAA compliance for healthcare providers.
              </p>
            </div>
          </div>
        </section>

        {/* Our Story */}
        <section className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 text-center">Our Story</h2>
          <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-8 md:p-12">
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              Caberu was founded by <span className="font-semibold">Romeo Jackson</span> and <span className="font-semibold">Thomas Iordache</span>,
              two entrepreneurs who experienced firsthand the frustration of managing appointments, customer data, and billing
              across multiple disconnected systems.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed mb-6">
              After witnessing dental practices and salons struggle with outdated software, missed appointments costing thousands
              in lost revenue, and hours wasted on administrative tasks, we knew there had to be a better way.
            </p>
            <p className="text-lg text-gray-700 leading-relaxed">
              Today, Caberu is a comprehensive practice management platform that combines the power of AI with beautiful,
              intuitive design. We're proud to help businesses save time, increase revenue, and deliver exceptional
              experiences to their customers.
            </p>
          </div>
        </section>

        {/* Why Choose Us */}
        <section>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 text-center">Why Choose Caberu?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { number: "60%", label: "Less Admin Time", color: "from-blue-500 to-cyan-500" },
              { number: "40%", label: "Fewer No-Shows", color: "from-purple-500 to-pink-500" },
              { number: "5 min", label: "Setup Time", color: "from-green-500 to-emerald-500" },
              { number: "24/7", label: "Support Available", color: "from-orange-500 to-red-500" }
            ].map((stat, idx) => (
              <Card key={idx} className="p-6 text-center border-2 hover:shadow-xl transition-all">
                <div className={`text-4xl font-bold bg-gradient-to-r ${stat.color} bg-clip-text text-transparent mb-2`}>
                  {stat.number}
                </div>
                <p className="text-gray-600 font-medium">{stat.label}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Practice?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join modern businesses using Caberu to save time, reduce no-shows, and provide better customer experiences.
            </p>
            <a
              href="/signup"
              className="inline-flex items-center gap-2 bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-lg"
            >
              Start Your Free Trial
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;

