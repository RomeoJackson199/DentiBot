import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Building2, ArrowRight, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DemoTourFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DemoTourFlow({ isOpen, onClose }: DemoTourFlowProps) {
  const [businessName, setBusinessName] = useState("");
  const [template, setTemplate] = useState("healthcare");
  const navigate = useNavigate();

  const handleStartDemo = () => {
    if (!businessName.trim()) return;

    // Store demo data
    sessionStorage.setItem('demo_business_name', businessName);
    sessionStorage.setItem('demo_template', template);

    // Navigate to demo dashboard
    onClose();
    navigate(`/demo/${template}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <DialogTitle className="text-2xl">Try Interactive Demo</DialogTitle>
          </div>
          <DialogDescription className="text-base">
            Experience Caberu with a guided tour through the actual dashboard. See how everything works in real-time!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business Name</Label>
            <Input
              id="business-name"
              placeholder="e.g., Smile Dental Clinic"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="text-base"
            />
            <p className="text-xs text-muted-foreground">
              This is just for the demo - you can change it later
            </p>
          </div>

          <div className="space-y-2">
            <Label>Business Type</Label>
            <RadioGroup value={template} onValueChange={setTemplate}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="healthcare" id="healthcare" />
                <Label htmlFor="healthcare" className="flex items-center gap-2 cursor-pointer">
                  <Building2 className="w-4 h-4" />
                  Healthcare Practice
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="medical" id="medical" />
                <Label htmlFor="medical" className="cursor-pointer">Medical Clinic</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="salon" id="salon" />
                <Label htmlFor="salon" className="cursor-pointer">Salon & Spa</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fitness" id="fitness" />
                <Label htmlFor="fitness" className="cursor-pointer">Fitness Center</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="generic" id="generic" />
                <Label htmlFor="generic" className="cursor-pointer">General Business</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-2">
            <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
              🎯 Interactive Tour Features:
            </p>
            <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Walk through the actual dashboard interface</li>
              <li>• See tooltips highlighting key features</li>
              <li>• Navigate between different sections</li>
              <li>• Takes about 2-3 minutes</li>
            </ul>
          </div>

          <Button
            onClick={handleStartDemo}
            disabled={!businessName.trim()}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            size="lg"
          >
            Start Interactive Tour
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            No credit card required • Try before you buy
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
