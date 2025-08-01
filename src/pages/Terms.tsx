import { TermsDialog } from "@/components/TermsDialog";
import { useState } from "react";

const Terms = () => {
  const [open, setOpen] = useState(true);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <TermsDialog open={open} onOpenChange={setOpen} />
    </div>
  );
};

export default Terms;
