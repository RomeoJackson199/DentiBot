import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookAppointment() {
  return (
    <div className="h-full w-full p-4 md:p-6">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">Book Appointment</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <iframe
            src="https://caberu.be/book-appointment"
            className="w-full h-[calc(100vh-12rem)] border-0 rounded-b-lg"
            title="Book Appointment"
          />
        </CardContent>
      </Card>
    </div>
  );
}
