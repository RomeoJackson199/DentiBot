import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const LanguageTest = () => {
  const { t, language, setLanguage } = useLanguage();

  const testSections = [
    {
      title: "Dashboard & Navigation",
      items: [
        { key: "dashboard", value: t.dashboard },
        { key: "welcomeBack", value: t.welcomeBack },
        { key: "welcomeToDashboard", value: t.welcomeToDashboard },
        { key: "notifications", value: t.notifications },
        { key: "bookAppointment", value: t.bookAppointment },
        { key: "upcoming", value: t.upcoming },
        { key: "completed", value: t.completed },
        { key: "activeRx", value: t.activeRx },
        { key: "treatmentPlans", value: t.treatmentPlans },
      ]
    },
    {
      title: "Homepage",
      items: [
        { key: "poweredByAdvancedAI", value: t.poweredByAdvancedAI },
        { key: "available24_7", value: t.available24_7 },
        { key: "yourIntelligent", value: t.yourIntelligent },
        { key: "dentalAssistant", value: t.dentalAssistant },
        { key: "experienceFuture", value: t.experienceFuture },
        { key: "aiChatAssistant", value: t.aiChatAssistant },
        { key: "getInstantAnswers", value: t.getInstantAnswers },
        { key: "smartBooking", value: t.smartBooking },
        { key: "bookIntelligently", value: t.bookIntelligently },
        { key: "emergencyTriage", value: t.emergencyTriage },
        { key: "quickAssessment", value: t.quickAssessment },
        { key: "getStartedFree", value: t.getStartedFree },
        { key: "emergencyAssessment", value: t.emergencyAssessment },
      ]
    },
    {
      title: "Feature Cards",
      items: [
        { key: "advancedFeatures", value: t.advancedFeatures },
        { key: "everythingYouNeed", value: t.everythingYouNeed },
        { key: "futureOfDentalCare", value: t.futureOfDentalCare },
        { key: "mostPopular", value: t.mostPopular },
        { key: "timeSaver", value: t.timeSaver },
        { key: "healthFocused", value: t.healthFocused },
        { key: "familyFriendly", value: t.familyFriendly },
        { key: "mobileReady", value: t.mobileReady },
        { key: "secure", value: t.secure },
        { key: "available24_7Feature", value: t.available24_7Feature },
        { key: "instantResponses", value: t.instantResponses },
        { key: "secureAndPrivateFeature", value: t.secureAndPrivateFeature },
        { key: "learnMore", value: t.learnMore },
        { key: "joinThousands", value: t.joinThousands },
        { key: "startYourJourney", value: t.startYourJourney },
        { key: "fromReviews", value: t.fromReviews },
      ]
    },
    {
      title: "Settings & Actions",
      items: [
        { key: "generalSettings", value: t.generalSettings },
        { key: "themeSettings", value: t.themeSettings },
        { key: "personalSettings", value: t.personalSettings },
        { key: "signOut", value: t.signOut },
        { key: "signOutSuccess", value: t.signOutSuccess },
        { key: "aiFeaturesDisabled", value: t.aiFeaturesDisabled },
        { key: "aiFeaturesEnabled", value: t.aiFeaturesEnabled },
        { key: "aiFeaturesDisabledDesc", value: t.aiFeaturesDisabledDesc },
        { key: "aiFeaturesEnabledDesc", value: t.aiFeaturesEnabledDesc },
        { key: "failedToUpdateAiSettings", value: t.failedToUpdateAiSettings },
        { key: "failedToSavePersonalInfo", value: t.failedToSavePersonalInfo },
        { key: "authenticationError", value: t.authenticationError },
        { key: "networkError", value: t.networkError },
        { key: "unknownError", value: t.unknownError },
      ]
    },
    {
      title: "Status Messages",
      items: [
        { key: "success", value: t.success },
        { key: "error", value: t.error },
        { key: "warning", value: t.warning },
        { key: "info", value: t.info },
        { key: "loading", value: t.loading },
        { key: "saved", value: t.saved },
        { key: "updated", value: t.updated },
        { key: "deleted", value: t.deleted },
        { key: "created", value: t.created },
        { key: "failed", value: t.failed },
        { key: "cancelled", value: t.cancelled },
        { key: "confirmed", value: t.confirmed },
        { key: "pending", value: t.pending },
        { key: "completed", value: t.completed },
        { key: "active", value: t.active },
        { key: "inactive", value: t.inactive },
      ]
    },
    {
      title: "Common Actions",
      items: [
        { key: "save", value: t.save },
        { key: "cancel", value: t.cancel },
        { key: "confirm", value: t.confirm },
        { key: "delete", value: t.delete },
        { key: "edit", value: t.edit },
        { key: "view", value: t.view },
        { key: "add", value: t.add },
        { key: "remove", value: t.remove },
        { key: "update", value: t.update },
        { key: "refresh", value: t.refresh },
        { key: "retry", value: t.retry },
        { key: "close", value: t.close },
        { key: "back", value: t.back },
        { key: "next", value: t.next },
        { key: "previous", value: t.previous },
        { key: "submit", value: t.submit },
        { key: "reset", value: t.reset },
        { key: "search", value: t.search },
        { key: "filter", value: t.filter },
        { key: "sort", value: t.sort },
      ]
    }
  ];

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Language Translation Test</h1>
        <div className="flex gap-2">
          <Button 
            variant={language === 'en' ? 'default' : 'outline'} 
            onClick={() => setLanguage('en')}
          >
            English
          </Button>
          <Button 
            variant={language === 'fr' ? 'default' : 'outline'} 
            onClick={() => setLanguage('fr')}
          >
            Français
          </Button>
          <Button 
            variant={language === 'nl' ? 'default' : 'outline'} 
            onClick={() => setLanguage('nl')}
          >
            Nederlands
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <Badge variant="outline" className="text-lg">
          Current Language: {language.toUpperCase()}
        </Badge>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          {testSections.map((section, index) => (
            <TabsTrigger key={index} value={section.title.toLowerCase().replace(/\s+/g, '-')}>
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {testSections.map((section, sectionIndex) => (
          <TabsContent key={sectionIndex} value={section.title.toLowerCase().replace(/\s+/g, '-')}>
            <Card>
              <CardHeader>
                <CardTitle>{section.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4">
                  {section.items.map((item, itemIndex) => (
                    <div key={itemIndex} className="flex items-start space-x-4 p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="font-mono text-sm text-gray-500 mb-1">
                          {item.key}
                        </div>
                        <div className="text-base">
                          {item.value}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};