import { useEffect } from "react";

export default function BookAppointment() {
  // Redirect to external booking page
  useEffect(() => {
    window.location.href = 'https://caberu.be/book-appointment';
  }, []);

  return null;
}
