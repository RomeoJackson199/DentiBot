import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import PatientAppShell, { PatientSection } from "@/components/patient/PatientAppShell";
import BookAppointment from "@/pages/BookAppointment";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";

export default function BookAppointmentShell() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/login", { replace: true });
        return;
      }
      setUserId(user.id);
      setLoading(false);
    };
    init();
  }, [navigate]);

  const handleChangeSection = (section: PatientSection) => {
    switch (section) {
      case 'home':
        navigate('/dashboard'); // patient home inside dashboard shell
        break;
      case 'appointments':
        navigate('/care/appointments');
        break;
      case 'payments':
        navigate('/billing');
        break;
      case 'messages':
        navigate('/messages');
        break;
      case 'assistant':
        navigate('/book-appointment'); // already here; keep route stable
        break;
      default:
        break;
    }
  };

  if (loading || !userId) {
    return <ModernLoadingSpinner variant="overlay" message="Loading..." />;
  }

  return (
    <PatientAppShell
      activeSection={'assistant'}
      onChangeSection={handleChangeSection}
      userId={userId}
      hasAIChat={false}
      onBookAppointment={() => {/* no-op, already on booking */}}
    >
      <div className="p-4">
        <BookAppointment />
      </div>
    </PatientAppShell>
  );
}
