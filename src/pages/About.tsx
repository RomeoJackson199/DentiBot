import React from "react";

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight mb-6">About Dentinot</h1>
        <p className="text-muted-foreground leading-relaxed mb-6">
          Dentinot is an AI-powered assistant created to streamline dental clinic workflows. From patient intake and appointment scheduling to billing, treatment history, and reminders, Dentinot helps reduce administrative work by up to 30%, giving dentists more time to focus on patient care.
        </p>

        <h2 className="text-2xl font-semibold tracking-tight mb-4">Our Mission</h2>
        <p className="text-muted-foreground leading-relaxed mb-4">
          Our mission is to make dentistry more efficient and patient-friendly through:
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-8">
          <li>
            <span className="font-medium">Automation</span>: Smart scheduling, billing, and patient communication.
          </li>
          <li>
            <span className="font-medium">Patient Experience</span>: Easy booking, treatment history access, and timely reminders.
          </li>
          <li>
            <span className="font-medium">Security First</span>: End-to-end encryption with full GDPR/FDPR compliance.
          </li>
        </ul>

        <p className="text-muted-foreground leading-relaxed">
          Dentinot is developed by Caberu SRL, founded by Romeo Jackson and Thomas Iordache, with a vision to modernize dental care through secure, intelligent automation.
        </p>
      </div>
    </div>
  );
};

export default About;

