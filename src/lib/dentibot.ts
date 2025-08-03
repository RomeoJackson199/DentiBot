export interface Review {
  reviewId: string;
  patientId: string;
  dentistId: string;
  appointmentId: string;
  rating: number;
  comment?: string;
  createdAt: Date;
}

export function submitReview(existing: Review[], review: Review): Review[] {
  const alreadyReviewed = existing.some(
    r => r.patientId === review.patientId && r.appointmentId === review.appointmentId,
  );
  if (alreadyReviewed) {
    throw new Error("Review already submitted for this appointment");
  }
  return [...existing, review];
}

export interface Dentist {
  id: string;
  city: string;
  postalCode: string;
  languages: string[];
  specialty: string;
}

export interface DentistFilters {
  cityOrPostal?: string;
  languages?: string[];
  specialty?: string;
}

export function filterDentists(dentists: Dentist[], filters: DentistFilters): Dentist[] {
  return dentists.filter(dentist => {
    if (filters.cityOrPostal) {
      const target = filters.cityOrPostal.toLowerCase();
      const cityMatch = dentist.city.toLowerCase() === target;
      const postalMatch = dentist.postalCode.toLowerCase() === target;
      if (!cityMatch && !postalMatch) return false;
    }
    if (filters.languages && filters.languages.length > 0) {
      const hasLanguages = filters.languages.every(lang => dentist.languages.includes(lang));
      if (!hasLanguages) return false;
    }
    if (filters.specialty && dentist.specialty !== filters.specialty) {
      return false;
    }
    return true;
  });
}

export interface FamilyMember {
  id: string;
  patientId: string;
  name: string;
  dob: string;
  allergies?: string;
}

export function addFamilyMember(members: FamilyMember[], member: FamilyMember): FamilyMember[] {
  return [...members, member];
}

export interface Appointment {
  id: string;
  patientId: string;
  dentistId: string;
  familyMemberId?: string;
  status: "upcoming" | "completed" | "cancelled";
}

export function bookAppointment(appointments: Appointment[], appointment: Appointment): Appointment[] {
  return [...appointments, appointment];
}

export interface Favorite {
  patientId: string;
  dentistId: string;
}

export function toggleFavorite(favorites: Favorite[], patientId: string, dentistId: string): Favorite[] {
  const index = favorites.findIndex(f => f.patientId === patientId && f.dentistId === dentistId);
  if (index >= 0) {
    return favorites.filter((_, i) => i !== index);
  }
  return [...favorites, { patientId, dentistId }];
}

export interface WaitlistEntry {
  waitlistId: string;
  patientId: string;
  dentistId: string;
  preferredTime: string;
  createdAt: Date;
}

export function addWaitlistEntry(entries: WaitlistEntry[], entry: WaitlistEntry): WaitlistEntry[] {
  return [...entries, entry];
}

export function getDentistWaitlist(entries: WaitlistEntry[], dentistId: string): WaitlistEntry[] {
  return entries.filter(e => e.dentistId === dentistId);
}

export interface PatientProfile {
  id: string;
  aiOptOut: boolean;
  aiNeverPrompt?: boolean;
}

export function shouldShowAiPrompt(profile: PatientProfile): boolean {
  return profile.aiOptOut && !profile.aiNeverPrompt;
}

export function handleAiPromptResponse(
  profile: PatientProfile,
  action: "enable" | "keep" | "never",
): PatientProfile {
  if (action === "enable") {
    return { ...profile, aiOptOut: false };
  }
  if (action === "never") {
    return { ...profile, aiNeverPrompt: true };
  }
  return profile;
}

export interface DentistProfile {
  id: string;
  name: string;
  clinicAddress: string;
  phoneNumber: string;
  email: string;
  servicesOffered: string[];
  languages: string[];
  specialty: string;
  photoUrl?: string;
}

export function updateDentistProfile(
  profile: DentistProfile,
  updates: Partial<Omit<DentistProfile, "id">>,
): DentistProfile {
  return { ...profile, ...updates };
}

