import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface MissingField {
  key: string;
  question: string;
  type: "text" | "date" | "languages";
  table: "profiles" | "dentists";
}

const availableLanguages = ["English", "French", "Dutch"];

const ProfileCompletionDialog = () => {
  const [open, setOpen] = useState(false);
  const [profileId, setProfileId] = useState<string>("");
  const [missingFields, setMissingFields] = useState<MissingField[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [value, setValue] = useState("");
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const checkProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `id, role, first_name, last_name, phone, date_of_birth, address, emergency_contact,
         dentists!dentists_profile_id_fkey(specialization)`
      )
      .eq("user_id", userId)
      .single();

    if (error || !data) return;

    setProfileId(data.id);

    const fields: MissingField[] = [];
    const base: MissingField[] = [
      { key: "first_name", question: "What's your first name?", type: "text", table: "profiles" },
      { key: "last_name", question: "And your last name?", type: "text", table: "profiles" },
      { key: "phone", question: "What's your phone number?", type: "text", table: "profiles" },
      { key: "date_of_birth", question: "What is your date of birth?", type: "date", table: "profiles" },
      { key: "address", question: "Your address?", type: "text", table: "profiles" },
    ];

    base.forEach((f) => {
      if (!data[f.key as keyof typeof data]) fields.push(f);
    });

    if (data.role === "patient") {
      if (!data.emergency_contact) {
        fields.push({
          key: "emergency_contact",
          question: "Emergency contact?",
          type: "text",
          table: "profiles",
        });
      }
    } else if (data.role === "dentist") {
      const dentist = (data as any).dentists?.[0];
      if (!dentist?.clinic_address) {
        fields.push({
          key: "clinic_address",
          question: "Clinic address?",
          type: "text",
          table: "dentists",
        });
      }
      if (!dentist?.languages || dentist.languages.length === 0) {
        fields.push({
          key: "languages",
          question: "Languages spoken?",
          type: "languages",
          table: "dentists",
        });
      }
      if (!dentist?.specialty) {
        fields.push({
          key: "specialty",
          question: "What is your specialty?",
          type: "text",
          table: "dentists",
        });
      }
    }

    if (fields.length > 0) {
      setMissingFields(fields);
      setOpen(true);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        checkProfile(session.user.id);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        checkProfile(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleNext = async () => {
    const field = missingFields[currentIndex];
    if (!field) return;

    let update;
    if (field.type === "languages") {
      update = supabase
        .from("dentists")
        .update({ specialization: selectedLanguages.join(', ') })
        .eq("profile_id", profileId);
    } else if (field.table === "profiles") {
      update = supabase
        .from("profiles")
        .update({ [field.key]: value })
        .eq("id", profileId);
    } else {
      update = supabase
        .from("dentists")
        .update({ [field.key]: value })
        .eq("profile_id", profileId);
    }

    const { error } = await update;
    if (error) return;

    setValue("");
    setSelectedLanguages([]);
    const next = currentIndex + 1;
    if (next < missingFields.length) {
      setCurrentIndex(next);
    } else {
      setCompleted(true);
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    }
  };

  const field = missingFields[currentIndex];

  return (
    <Dialog open={open}>
      <DialogContent>
        {!completed && field && (
          <>
            <DialogHeader>
              <DialogTitle>{field.question}</DialogTitle>
            </DialogHeader>
            {field.type === "text" && (
              <Input value={value} onChange={(e) => setValue(e.target.value)} />
            )}
            {field.type === "date" && (
              <Input type="date" value={value} onChange={(e) => setValue(e.target.value)} />
            )}
            {field.type === "languages" && (
              <div className="space-y-2">
                {availableLanguages.map((lang) => (
                  <div key={lang} className="flex items-center space-x-2">
                    <Checkbox
                      id={lang}
                      checked={selectedLanguages.includes(lang)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLanguages([...selectedLanguages, lang]);
                        } else {
                          setSelectedLanguages(selectedLanguages.filter((l) => l !== lang));
                        }
                      }}
                    />
                    <label htmlFor={lang}>{lang}</label>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 flex justify-end">
              <Button
                onClick={handleNext}
                disabled={
                  field.type === "languages"
                    ? selectedLanguages.length === 0
                    : value === ""
                }
              >
                Next
              </Button>
            </div>
          </>
        )}
        {completed && (
          <div className="py-8 text-center">
            <DialogHeader>
              <DialogTitle>Profile complete! Thank you.</DialogTitle>
            </DialogHeader>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCompletionDialog;
