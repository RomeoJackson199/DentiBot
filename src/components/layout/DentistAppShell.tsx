import React from "react";
import { User } from "@supabase/supabase-js";
import { DentistLayout } from "./DentistLayout";

interface DentistAppShellProps {
  user: User;
  children: React.ReactNode;
}

export function DentistAppShell({ user, children }: DentistAppShellProps) {
  return (
    <DentistLayout user={user}>
      {children}
    </DentistLayout>
  );
}