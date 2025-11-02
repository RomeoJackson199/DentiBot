import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppointmentBooking } from "@/components/AppointmentBooking";
import { User } from "@supabase/supabase-js";

export default function BookAppointment() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };
    getUser();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>Please log in to book an appointment.</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full p-4 md:p-6">
      <AppointmentBooking 
        user={user} 
        onCancel={() => navigate(-1)} 
        onComplete={() => navigate('/dashboard')} 
      />
    </div>
  );
}
