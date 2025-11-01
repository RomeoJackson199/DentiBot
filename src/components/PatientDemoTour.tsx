import { useState, useEffect, useCallback } from "react";
import Joyride, { CallBackProps, STATUS, Step, ACTIONS, EVENTS } from "react-joyride";

interface PatientDemoTourProps {
  run: boolean;
  onClose: () => void;
}

export function PatientDemoTour({ run, onClose }: PatientDemoTourProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    setRunTour(run);
  }, [run]);

  const steps: Step[] = [
    {
      target: "body",
      content: (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-3">Welcome to Your Patient Portal! 🦷</h2>
          <p className="text-muted-foreground">
            Let's explore the key features that help you manage your dental health and appointments.
          </p>
        </div>
      ),
      placement: "center",
      disableBeacon: true,
    },
    {
      target: '[data-tour="stats-cards"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Your Health Overview</h3>
          <p className="text-sm text-muted-foreground">
            See your upcoming appointments, total visits, and active prescriptions at a glance.
            These cards give you a quick snapshot of your dental health status.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: '[data-tour="quick-actions"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Quick Actions</h3>
          <p className="text-sm text-muted-foreground">
            Access the most common features with one click: Book appointments, view medical records,
            chat with our AI assistant, or get emergency care information.
          </p>
        </div>
      ),
      placement: "top",
    },
    {
      target: '[data-tour="book-appointment-btn"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Book Appointments</h3>
          <p className="text-sm text-muted-foreground">
            Click here anytime to schedule a new appointment with your dentist.
            You can select your preferred date, time, and type of service.
          </p>
        </div>
      ),
      placement: "bottom",
    },
    {
      target: '[data-tour="upcoming-appointments"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Your Appointments</h3>
          <p className="text-sm text-muted-foreground">
            View your upcoming appointments here. You can see the date, time, dentist,
            and appointment details. Click on any appointment to view more information or make changes.
          </p>
        </div>
      ),
      placement: "top",
    },
    {
      target: '[data-tour="nav-care"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Care Section</h3>
          <p className="text-sm text-muted-foreground">
            Navigate to your care dashboard, appointments, prescriptions, and treatment history.
            This is your central hub for all health-related information.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-tour="nav-billing"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Billing & Payments</h3>
          <p className="text-sm text-muted-foreground">
            View your invoices, payment history, and outstanding balances.
            You can make secure online payments directly through the portal.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-tour="nav-documents"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Documents</h3>
          <p className="text-sm text-muted-foreground">
            Access your dental records, x-rays, insurance documents, and other important files.
            You can upload new documents or download existing ones.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: '[data-tour="nav-account"]',
      content: (
        <div>
          <h3 className="font-semibold mb-2">Account Settings</h3>
          <p className="text-sm text-muted-foreground">
            Manage your profile, insurance information, privacy settings, and get help.
            Keep your personal information up to date here.
          </p>
        </div>
      ),
      placement: "right",
    },
    {
      target: "body",
      content: (
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-3">You're Ready to Go! 🎉</h2>
          <p className="text-muted-foreground mb-3">
            You now know how to navigate your patient portal and access all the key features.
            You can restart this tour anytime from the help menu.
          </p>
          <p className="text-sm text-muted-foreground">
            Take control of your dental health today!
          </p>
        </div>
      ),
      placement: "center",
    },
  ];

  const handleJoyrideCallback = useCallback((data: CallBackProps) => {
    const { status, type, index, action } = data;

    if (([STATUS.FINISHED, STATUS.SKIPPED] as string[]).includes(status)) {
      setRunTour(false);
      setStepIndex(0);
      onClose();
    } else if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      const nextStepIndex = index + (action === ACTIONS.PREV ? -1 : 1);
      setStepIndex(nextStepIndex);
    }
  }, [onClose]);

  return (
    <Joyride
      steps={steps}
      run={runTour}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      scrollToFirstStep
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: "hsl(var(--primary))",
          textColor: "hsl(var(--foreground))",
          backgroundColor: "hsl(var(--background))",
          arrowColor: "hsl(var(--background))",
          overlayColor: "rgba(0, 0, 0, 0.5)",
          zIndex: 10000,
        },
        tooltip: {
          borderRadius: "0.5rem",
          padding: "1rem",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        buttonNext: {
          backgroundColor: "hsl(var(--primary))",
          color: "hsl(var(--primary-foreground))",
          borderRadius: "0.375rem",
          padding: "0.5rem 1rem",
          fontSize: "0.875rem",
          fontWeight: 500,
        },
        buttonBack: {
          color: "hsl(var(--muted-foreground))",
          marginRight: "0.5rem",
        },
        buttonSkip: {
          color: "hsl(var(--muted-foreground))",
        },
      }}
      locale={{
        back: "Back",
        close: "Close",
        last: "Finish",
        next: "Next",
        skip: "Skip Tour",
      }}
    />
  );
}
