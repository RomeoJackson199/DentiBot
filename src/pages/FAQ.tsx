import { Header } from "@/components/homepage/Header";
import { Footer } from "@/components/homepage/Footer";
import { FAQSection } from "@/components/homepage/FAQSection";
import { Button } from "@/components/ui/button";
import { ArrowRight, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { ContactForm } from "@/components/homepage/ContactForm";

const FAQ = () => {
  const [showContactForm, setShowContactForm] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      <Header user={null} minimal={false} />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
          <div className="max-w-4xl mx-auto text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl font-bold text-gray-900 mb-6"
            >
              Frequently Asked Questions
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-gray-600 mb-8"
            >
              Everything you need to know about Caberu's AI-powered healthcare practice management platform
            </motion.p>
          </div>
        </section>

        {/* FAQ Section */}
        <FAQSection />

        {/* Additional Resources */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gray-50">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white rounded-2xl p-8 shadow-lg"
              >
                <MessageCircle className="h-12 w-12 text-blue-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Still Have Questions?</h3>
                <p className="text-gray-600 mb-6">
                  Our team is here to help. Schedule a personalized demo and get all your questions answered.
                </p>
                <Button
                  onClick={() => setShowContactForm(true)}
                  className="bg-gray-900 hover:bg-gray-800"
                >
                  Schedule a Demo
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-8 shadow-lg text-white"
              >
                <div className="h-12 w-12 bg-white/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4">Documentation</h3>
                <p className="mb-6 opacity-90">
                  Explore our comprehensive guides, tutorials, and API documentation.
                </p>
                <Button
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 border-white/20 text-white"
                  onClick={() => window.open('/support', '_blank')}
                >
                  View Documentation
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Quick Contact */}
        <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Need Immediate Assistance?</h2>
            <p className="text-gray-600 mb-8">
              Contact our support team directly
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:Romeo@caberu.be"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-full text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Email: Romeo@caberu.be
              </a>
              <a
                href="/support"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-colors"
              >
                Visit Support Center
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      {/* Contact Form Dialog */}
      <ContactForm
        open={showContactForm}
        onOpenChange={setShowContactForm}
      />
    </div>
  );
};

export default FAQ;
