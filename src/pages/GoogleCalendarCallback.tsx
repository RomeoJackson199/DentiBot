import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GoogleCalendarCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      
      if (code && window.opener) {
        // Send the code back to the parent window
        window.opener.postMessage(
          { type: 'google-calendar-auth', code },
          window.location.origin
        );
        window.close();
      } else {
        // If no code or no opener, redirect to dentist portal
        navigate('/dentist-portal');
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-muted-foreground">Connecting your Google Calendar...</p>
      </div>
    </div>
  );
}
