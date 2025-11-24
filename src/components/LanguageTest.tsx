import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const LanguageTest = () => {
  const { language, setLanguage, t } = useLanguage();

  const testFeatures = [
    'scheduling',
    'analytics', 
    'ai_chat',
    'security'
  ];

  return (
    <div className="p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Language System Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Language Display */}
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">Current Language: {language}</h3>
            <p>Translation test: {t.welcome}</p>
          </div>

          {/* Language Switcher */}
          <div className="flex gap-2">
            <Button 
              onClick={() => setLanguage('en')}
              variant={language === 'en' ? 'default' : 'outline'}
            >
              English
            </Button>
            <Button 
              onClick={() => setLanguage('fr')}
              variant={language === 'fr' ? 'default' : 'outline'}
            >
              Français
            </Button>
            <Button 
              onClick={() => setLanguage('nl')}
              variant={language === 'nl' ? 'default' : 'outline'}
            >
              Nederlands
            </Button>
          </div>

          {/* Feature Detail Links */}
          <div className="space-y-2">
            <h3 className="font-semibold">Test Feature Detail Pages:</h3>
            <div className="flex flex-wrap gap-2">
              {testFeatures.map(feature => (
                <Button key={feature} variant="outline" size="sm" asChild>
                  <a href={`/features/${feature}`}>
                    {feature}
                  </a>
                </Button>
              ))}
            </div>
          </div>

          {/* Translation Examples */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Common Translations:</h4>
              <ul className="space-y-1 text-sm">
                <li>Welcome: {t.welcome}</li>
                <li>Settings: {t.settings}</li>
                <li>Language: {t.language}</li>
                <li>Save: {t.save}</li>
                <li>Cancel: {t.cancel}</li>
              </ul>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <h4 className="font-semibold mb-2">Booking Translations:</h4>
              <ul className="space-y-1 text-sm">
                <li>Book Appointment: {t.bookAppointment}</li>
                <li>Choose Dentist: {t.chooseDentist}</li>
                <li>Select Date: {t.selectDate}</li>
                <li>Select Time: {t.selectTime}</li>
                <li>Book Now: {t.bookNow}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};