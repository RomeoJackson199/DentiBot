import { describe, it, expect } from 'vitest';
import {
  submitReview,
  filterDentists,
  addFamilyMember,
  bookAppointment,
  toggleFavorite,
  addWaitlistEntry,
  getDentistWaitlist,
  getAverageRating,
  convertWaitlistToAppointment,
  getFavoritesForPatient,
  getFamilyMembers,
  isEmpty,
  shouldShowAiPrompt,
  handleAiPromptResponse,
  updateDentistProfile,
  type Review,
  type Dentist,
  type FamilyMember,
  type Appointment,
  type Favorite,
  type WaitlistEntry,
  type PatientProfile,
  type DentistProfile,
} from './dentibot';

describe('review system', () => {
  it('allows only one review per appointment', () => {
    const reviews: Review[] = [];
    const review: Review = {
      reviewId: '1',
      patientId: 'p1',
      dentistId: 'd1',
      appointmentId: 'a1',
      rating: 5,
      createdAt: new Date(),
    };
    const afterFirst = submitReview(reviews, review);
    expect(afterFirst).toHaveLength(1);
    expect(() => submitReview(afterFirst, review)).toThrow();
  });

  it('calculates average rating for a dentist', () => {
    const reviews: Review[] = [
      { reviewId: '1', patientId: 'p1', dentistId: 'd1', appointmentId: 'a1', rating: 4, createdAt: new Date() },
      { reviewId: '2', patientId: 'p2', dentistId: 'd1', appointmentId: 'a2', rating: 5, createdAt: new Date() },
    ];
    expect(getAverageRating(reviews, 'd1')).toBe(4.5);
    expect(getAverageRating(reviews, 'd2')).toBe(0);
  });
});

describe('dentist filtering', () => {
  const dentists: Dentist[] = [
    { id: 'd1', city: 'Brussels', postalCode: '1000', languages: ['EN', 'FR'], specialty: 'general' },
    { id: 'd2', city: 'Ghent', postalCode: '9000', languages: ['NL'], specialty: 'pediatric' },
  ];
  it('filters by city and language and specialty', () => {
    const result = filterDentists(dentists, { cityOrPostal: 'Brussels', languages: ['FR'], specialty: 'general' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('d1');
  });
});

describe('family member booking', () => {
  it('allows adding family members and booking for them', () => {
    let members: FamilyMember[] = [];
    const member: FamilyMember = { id: 'f1', patientId: 'p1', name: 'Kid', dob: '2015-01-01' };
    members = addFamilyMember(members, member);
    expect(members).toContainEqual(member);
    const appointments: Appointment[] = [];
    const appointment: Appointment = { id: 'a1', patientId: 'p1', dentistId: 'd1', familyMemberId: 'f1', status: 'upcoming' };
    const booked = bookAppointment(appointments, appointment);
    expect(booked[0].familyMemberId).toBe('f1');
  });

  it('lists family members for a patient and handles empty state', () => {
    const members: FamilyMember[] = [
      { id: 'f1', patientId: 'p1', name: 'Kid', dob: '2015-01-01' },
      { id: 'f2', patientId: 'p2', name: 'Parent', dob: '1980-05-05' },
    ];
    expect(getFamilyMembers(members, 'p1')).toHaveLength(1);
    expect(isEmpty(getFamilyMembers(members, 'p3'))).toBe(true);
  });
});

describe('favorites', () => {
  it('persists favorite dentists', () => {
    let favorites: Favorite[] = [];
    favorites = toggleFavorite(favorites, 'p1', 'd1');
    expect(favorites).toContainEqual({ patientId: 'p1', dentistId: 'd1' });
    favorites = toggleFavorite(favorites, 'p1', 'd1');
    expect(favorites).toHaveLength(0);
  });

  it('retrieves favorites for a patient and supports empty state', () => {
    const favorites: Favorite[] = [
      { patientId: 'p1', dentistId: 'd1' },
      { patientId: 'p2', dentistId: 'd2' },
    ];
    expect(getFavoritesForPatient(favorites, 'p1')).toHaveLength(1);
    expect(isEmpty(getFavoritesForPatient(favorites, 'p3'))).toBe(true);
  });
});

describe('waitlist', () => {
  it('creates entries and allows dentist to view them', () => {
    const entries: WaitlistEntry[] = [];
    const entry: WaitlistEntry = { waitlistId: 'w1', patientId: 'p1', dentistId: 'd1', preferredTime: 'AM', createdAt: new Date() };
    const updated = addWaitlistEntry(entries, entry);
    const dentistEntries = getDentistWaitlist(updated, 'd1');
    expect(dentistEntries).toHaveLength(1);
    expect(dentistEntries[0].waitlistId).toBe('w1');
  });

  it('converts waitlist entry into appointment', () => {
    const waitlist: WaitlistEntry[] = [
      { waitlistId: 'w1', patientId: 'p1', dentistId: 'd1', preferredTime: 'AM', createdAt: new Date() },
    ];
    const appointments: Appointment[] = [];
    const appointment: Appointment = {
      id: 'a1',
      patientId: 'p1',
      dentistId: 'd1',
      status: 'upcoming',
    };
    const { updatedWaitlist, updatedAppointments } = convertWaitlistToAppointment(waitlist, appointments, 'w1', appointment);
    expect(updatedWaitlist).toHaveLength(0);
    expect(updatedAppointments).toHaveLength(1);
    expect(updatedAppointments[0].id).toBe('a1');
  });
});

describe('AI opt-in prompt', () => {
  it('shows prompt for opted-out users and respects never ask again', () => {
    let profile: PatientProfile = { id: 'p1', aiOptOut: true };
    expect(shouldShowAiPrompt(profile)).toBe(true);
    profile = handleAiPromptResponse(profile, 'never');
    expect(shouldShowAiPrompt(profile)).toBe(false);
  });

  it('disables opt-out when enabling', () => {
    let profile: PatientProfile = { id: 'p2', aiOptOut: true };
    profile = handleAiPromptResponse(profile, 'enable');
    expect(profile.aiOptOut).toBe(false);
    expect(shouldShowAiPrompt(profile)).toBe(false);
  });
});

describe('dentist profile editing', () => {
  it('updates profile fields', () => {
    const profile: DentistProfile = {
      id: 'd1',
      name: 'Dr. A',
      clinicAddress: 'Street 1',
      phoneNumber: '123',
      email: 'a@example.com',
      servicesOffered: ['cleaning'],
      languages: ['EN'],
      specialty: 'general',
    };
    const updated = updateDentistProfile(profile, { phoneNumber: '456', servicesOffered: ['cleaning', 'whitening'] });
    expect(updated.phoneNumber).toBe('456');
    expect(updated.servicesOffered).toContain('whitening');
  });
});

