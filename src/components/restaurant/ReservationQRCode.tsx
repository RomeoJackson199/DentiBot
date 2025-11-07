import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Mail, MessageSquare } from 'lucide-react';
import { format } from 'date-fns';

interface ReservationQRCodeProps {
  reservation: any;
  appointmentDate: Date;
  partySize: number;
  customerName: string;
  businessName: string;
}

export function ReservationQRCode({
  reservation,
  appointmentDate,
  partySize,
  customerName,
  businessName
}: ReservationQRCodeProps) {
  // QR code contains reservation ID for waiter to scan
  const reservationData = JSON.stringify({
    reservationId: reservation.id,
    appointmentId: reservation.appointment_id,
    type: 'restaurant_reservation',
    timestamp: Date.now()
  });

  const downloadQR = () => {
    const svg = document.getElementById(`reservation-qr-${reservation.id}`);
    if (!svg) return;

    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');

      const downloadLink = document.createElement('a');
      downloadLink.download = `reservation-${customerName.replace(/\s+/g, '-')}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const shareViaSMS = () => {
    const message = `Your reservation at ${businessName} on ${format(appointmentDate, 'PPp')} for ${partySize} guests. Show this QR code when you arrive.`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.location.href = smsUrl;
  };

  const shareViaEmail = () => {
    const subject = `Reservation Confirmation - ${businessName}`;
    const body = `Your reservation details:\n\nRestaurant: ${businessName}\nDate: ${format(appointmentDate, 'PPp')}\nParty Size: ${partySize} guests\n\nPlease show the attached QR code when you arrive.\n\nSee you soon!`;
    const mailUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailUrl;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Reservation QR Code</CardTitle>
        <CardDescription>
          Show this code to the staff when you arrive
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Reservation Details */}
        <div className="p-4 bg-muted rounded-lg space-y-2">
          <div className="flex justify-between">
            <span className="font-medium">Restaurant:</span>
            <span>{businessName}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Date & Time:</span>
            <span>{format(appointmentDate, 'PPp')}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Party Size:</span>
            <span>{partySize} {partySize === 1 ? 'guest' : 'guests'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-medium">Name:</span>
            <span>{customerName}</span>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex justify-center p-6 bg-white rounded-lg border-2 border-primary/20">
          <QRCodeSVG
            id={`reservation-qr-${reservation.id}`}
            value={reservationData}
            size={220}
            level="H"
            includeMargin
          />
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2 text-center">
          <p className="font-medium text-foreground">How to use:</p>
          <p>1. Save this QR code to your phone</p>
          <p>2. Show it to the staff when you arrive</p>
          <p>3. They'll scan it to seat you and activate your ordering</p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <Button variant="outline" onClick={downloadQR} className="w-full">
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button variant="outline" onClick={shareViaSMS} className="w-full">
            <MessageSquare className="h-4 w-4 mr-2" />
            Send SMS
          </Button>
          <Button variant="outline" onClick={shareViaEmail} className="w-full">
            <Mail className="h-4 w-4 mr-2" />
            Email
          </Button>
        </div>

        {/* Tips */}
        <div className="p-3 bg-primary/5 rounded-lg text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">💡 Pro Tips:</p>
          <ul className="space-y-1 ml-4 list-disc">
            <li>Take a screenshot as backup</li>
            <li>Arrive 5-10 minutes before your reservation</li>
            <li>You can order from your phone once seated</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
