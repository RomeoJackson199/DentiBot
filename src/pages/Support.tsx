import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import {
  MessageCircle,
  Phone,
  Mail,
  HelpCircle,
  FileText,
  Video,
  BookOpen,
  Search,
  Send
} from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const Support = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const faqData: FAQItem[] = [
    {
      question: "How do I book an appointment?",
      answer: "You can book an appointment through our online booking system. Simply select your preferred date and time, provide your details, and confirm your booking. You'll receive a confirmation email with all the details.",
      category: "Booking"
    },
    {
      question: "What should I do in case of a dental emergency?",
      answer: "For dental emergencies, use our emergency triage system to assess your situation. If it's urgent, you'll be connected with an emergency dentist immediately. For severe pain or trauma, call emergency services.",
      category: "Emergency"
    },
    {
      question: "How do I update my profile information?",
      answer: "You can update your profile information by going to your dashboard and clicking on the 'Settings' tab. There you can modify your personal details, contact information, and medical history.",
      category: "Account"
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, debit cards, and bank transfers. Payment is processed securely through our payment partners. You can also set up payment plans for larger treatments.",
      category: "Payment"
    },
    {
      question: "How do I cancel or reschedule an appointment?",
      answer: "You can cancel or reschedule your appointment through your dashboard. Go to 'My Appointments' and click on the appointment you want to modify. Please provide at least 24 hours notice for cancellations.",
      category: "Booking"
    },
    {
      question: "Is my medical information secure?",
      answer: "Yes, all your medical information is encrypted and stored securely in compliance with healthcare data protection regulations. We use industry-standard security measures to protect your privacy.",
      category: "Privacy"
    }
  ];

  const filteredFAQ = faqData.filter(item =>
    item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle contact form submission
    // Reset form
    setContactForm({
      name: "",
      email: "",
      subject: "",
      message: ""
    });
  };

  const supportChannels = [
    {
      title: "Live Chat",
      description: "Get instant help from our support team",
      icon: MessageCircle,
      action: "Start Chat",
      color: "bg-blue-500"
    },
    {
      title: "Phone Support",
      description: "Call us during business hours",
      icon: Phone,
      action: "Call Now",
      color: "bg-green-500"
    },
    {
      title: "Email Support",
      description: "Send us a detailed message",
      icon: Mail,
      action: "Send Email",
      color: "bg-purple-500"
    },
    {
      title: "Help Center",
      description: "Browse our comprehensive guides",
      icon: HelpCircle,
      action: "Browse Guides",
      color: "bg-orange-500"
    }
  ];

  const resources = [
    {
      title: "User Manual",
      description: "Complete guide to using our platform",
      icon: BookOpen,
      type: "PDF"
    },
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides",
      icon: Video,
      type: "Video"
    },
    {
      title: "API Documentation",
      description: "Technical documentation for developers",
      icon: FileText,
      type: "Technical"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header user={null} minimal={false} />

      <div className="p-6 max-w-7xl mx-auto pt-24">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Support Center</h1>
          <p className="text-muted-foreground">
            Get help with your healthcare practice management
          </p>
        </div>

      {/* Support Channels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {supportChannels.map((channel, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 rounded-lg ${channel.color} text-white`}>
                  <channel.icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{channel.title}</h3>
                  <p className="text-sm text-muted-foreground">{channel.description}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                {channel.action}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* FAQ Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search FAQ..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              {filteredFAQ.map((item, index) => (
                <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{item.category}</Badge>
                      <span>{item.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <p className="text-muted-foreground">{item.answer}</p>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        {/* Contact Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5" />
              Contact Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({...contactForm, name: e.target.value})}
                    placeholder="Your name"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input
                    type="email"
                    value={contactForm.email}
                    onChange={(e) => setContactForm({...contactForm, email: e.target.value})}
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input
                  value={contactForm.subject}
                  onChange={(e) => setContactForm({...contactForm, subject: e.target.value})}
                  placeholder="Brief description of your issue"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea
                  value={contactForm.message}
                  onChange={(e) => setContactForm({...contactForm, message: e.target.value})}
                  placeholder="Please describe your issue in detail..."
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Resources */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Helpful Resources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {resources.map((resource, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <resource.icon className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{resource.title}</h3>
                  <p className="text-sm text-muted-foreground mb-2">{resource.description}</p>
                  <Badge variant="outline">{resource.type}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>

      <Footer />
    </div>
  );
};

export default Support;
