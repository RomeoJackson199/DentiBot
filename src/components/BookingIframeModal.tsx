import { Dialog, DialogContent } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BookingIframeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  emergency?: boolean;
}

export function BookingIframeModal({
  open,
  onOpenChange,
  url = "https://caberu.be/book-appointment",
  emergency = false
}: BookingIframeModalProps) {
  const iframeUrl = emergency ? `${url}?emergency=true` : url;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 gap-0">
        <div className="flex items-center justify-between p-4 border-b bg-background">
          <h2 className="text-lg font-semibold">Book Appointment</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onOpenChange(false)}
            className="h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 w-full h-full">
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title="Book Appointment"
            allow="payment; geolocation"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
