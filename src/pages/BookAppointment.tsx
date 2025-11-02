import { useEffect } from "react";

export default function BookAppointment() {
  // Open booking in new tab and redirect back
  useEffect(() => {
    window.open('https://caberu.be/book-appointment', '_blank');
    window.history.back(); // Go back to previous page
  }, []);

  return null;
}
