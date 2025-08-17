import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "@/lib/notificationService";
import { emitAnalyticsEvent } from "@/lib/analyticsEvents";

export type RecallStatus = 'suggested' | 'snoozed' | 'declined' | 'booked' | 'expired';

export interface RecallSlot {
	date: string; // YYYY-MM-DD
	time: string; // HH:MM:SS
}

export interface RecallRecord {
	id: string;
	appointment_id?: string | null;
	patient_id: string;
	dentist_id: string;
	treatment_key: string;
	treatment_label: string;
	due_date: string; // YYYY-MM-DD
	suggested_slots: RecallSlot[];
	booked_appointment_id?: string | null;
	status: RecallStatus;
	snooze_until?: string | null;
	created_at: string;
	updated_at: string;
}

// v1 simple rules
const DEFAULT_INTERVALS_DAYS: Record<string, number> = {
	cleaning_6m: 182, // 6 months
	filling_follow_up_2w: 14,
	root_canal_check_3w: 21, // midpoint 2–4 weeks
	implant_review_2w: 14,
	implant_review_3m: 90,
	ortho_adjust_5w: 35, // midpoint 3–6 weeks
	extraction_follow_up_9d: 9, // midpoint 7–10 days
	general_exam_12m: 365
};

export type TreatmentChoiceKey = keyof typeof DEFAULT_INTERVALS_DAYS;

export interface PatientModifiers {
	is_smoker?: boolean;
	perio_risk?: 'low' | 'medium' | 'high';
	is_pediatric?: boolean;
	preferred_days?: number[]; // 0-6 (Sun-Sat)
	preferred_times?: Array<'morning' | 'afternoon' | 'evening'>;
}

export function computeDueDate(baseDateISO: string, treatmentKey: TreatmentChoiceKey, mods?: PatientModifiers): string {
	const baseDays = DEFAULT_INTERVALS_DAYS[treatmentKey];
	let days = baseDays;
	if (mods?.is_smoker || mods?.perio_risk === 'high') days = Math.max(7, Math.round(baseDays * 0.8));
	if (mods?.perio_risk === 'medium') days = Math.round(baseDays * 0.9);
	const baseDate = new Date(baseDateISO);
	const due = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000);
	// If weekend/clinic closed handled later via slots; keep date as-is
	return due.toISOString().slice(0, 10);
}

function toTimeBand(timeHHMM: string): 'morning' | 'afternoon' | 'evening' {
	const [h] = timeHHMM.split(':').map(Number);
	if (h < 12) return 'morning';
	if (h < 17) return 'afternoon';
	return 'evening';
}

export async function generateSuggestedSlotsAroundDate(
	dentistId: string,
	dueDate: string,
	mods?: PatientModifiers
): Promise<RecallSlot[]> {
	// Ensure slots exist +/- 7 days on preferred days
	const datesToCheck: string[] = [];
	for (let delta = -3; delta <= 7; delta++) {
		const d = new Date(dueDate);
		d.setDate(d.getDate() + delta);
		datesToCheck.push(d.toISOString().slice(0, 10));
	}
	// Generate slots for each day (idempotent)
	for (const date of datesToCheck) {
		await supabase.rpc('generate_daily_slots', { p_dentist_id: dentistId, p_date: date });
	}
	// Pull available slots for window
	const { data, error } = await supabase
		.from('appointment_slots')
		.select('slot_date:slot_date, slot_time:slot_time, is_available, emergency_only')
		.eq('dentist_id', dentistId)
		.in('slot_date', datesToCheck)
		.order('slot_date', { ascending: true })
		.order('slot_time', { ascending: true });
	if (error) throw error;
	const all = (data || []) as Array<{ slot_date: string; slot_time: string; is_available: boolean; emergency_only: boolean | null }>;
	let avail = all.filter(s => s.is_available && !s.emergency_only);
	// Apply preferences
	if (mods?.preferred_days && mods.preferred_days.length > 0) {
		avail = avail.filter(s => mods.preferred_days!.includes(new Date(s.slot_date).getDay()));
	}
	if (mods?.preferred_times && mods.preferred_times.length > 0) {
		avail = avail.filter(s => mods.preferred_times!.includes(toTimeBand(s.slot_time)));
	}
	// Pediatric preference: afternoon/evening
	if (mods?.is_pediatric) {
		avail = avail.filter(s => ['afternoon', 'evening'].includes(toTimeBand(s.slot_time)));
	}
	// Choose 3 around due date
	avail.sort((a, b) => Math.abs(new Date(`${a.slot_date}T${a.slot_time}`).getTime() - new Date(`${dueDate}T12:00:00`).getTime()) -
		Math.abs(new Date(`${b.slot_date}T${b.slot_time}`).getTime() - new Date(`${dueDate}T12:00:00`).getTime()));
	const selected = avail.slice(0, 3).map(s => ({ date: s.slot_date, time: s.slot_time }));
	return selected;
}

export async function createRecall(
	params: {
		appointmentId?: string;
		patientId: string;
		dentistId: string;
		treatmentKey: TreatmentChoiceKey;
		treatmentLabel: string;
		baseDateISO: string;
		mods?: PatientModifiers;
	}
): Promise<RecallRecord> {
	const dueDate = computeDueDate(params.baseDateISO, params.treatmentKey, params.mods);
	const slots = await generateSuggestedSlotsAroundDate(params.dentistId, dueDate, params.mods);
	const { data, error } = await supabase
		.from('recalls')
		.insert({
			appointment_id: params.appointmentId || null,
			patient_id: params.patientId,
			dentist_id: params.dentistId,
			treatment_key: params.treatmentKey,
			treatment_label: params.treatmentLabel,
			due_date: dueDate,
			suggested_slots: slots,
			status: 'suggested'
		})
		.select('*')
		.single();
	if (error) throw error;
	// Send notification with 1-tap deep-link
	const { data: profile } = await supabase.from('profiles').select('user_id, first_name').eq('id', params.patientId).single();
	if (profile?.user_id) {
		const firstSlot = slots[0];
		const niceDate = new Date(dueDate).toLocaleDateString();
		await NotificationService.createNotification(
			profile.user_id,
			'Next visit suggested',
			`Your next ${params.treatmentLabel} is due on ${niceDate}. Tap to book a suggested slot.`,
			'appointment',
			'info' as any,
			`/recalls/${data.id}`,
			{ recall_id: data.id, due_date: dueDate, suggested_slot: firstSlot }
		);
	}
	await emitAnalyticsEvent('RECALL_CREATED', params.dentistId, { recallId: data.id, treatmentKey: params.treatmentKey, dueDate });
	return data as unknown as RecallRecord;
}

export async function bookSuggestedSlot(recallId: string, slot: RecallSlot): Promise<string> {
	// Reserve slot, then create appointment, then mark recall booked
	// 1) Fetch recall
	const { data: recall } = await supabase.from('recalls').select('*').eq('id', recallId).single();
	if (!recall) throw new Error('Recall not found');
	// Temporarily reserve slot
	const { error: holdErr } = await supabase.rpc('book_appointment_slot', {
		p_dentist_id: recall.dentist_id,
		p_slot_date: slot.date,
		p_slot_time: slot.time,
		p_appointment_id: 'temp-id'
	});
	if (holdErr) throw new Error('Slot no longer available');
	// Create appointment
	const apptDate = new Date(`${slot.date}T${slot.time}`);
	const { data: appt, error: apptErr } = await supabase.from('appointments').insert({
		patient_id: recall.patient_id,
		dentist_id: recall.dentist_id,
		appointment_date: apptDate.toISOString(),
		reason: recall.treatment_label,
		status: 'confirmed',
		urgency: 'low'
	}).select('*').single();
	if (apptErr) {
		await supabase.rpc('release_appointment_slot', { p_appointment_id: 'temp-id' });
		throw apptErr;
	}
	await supabase.rpc('book_appointment_slot', { p_dentist_id: recall.dentist_id, p_slot_date: slot.date, p_slot_time: slot.time, p_appointment_id: appt.id });
	// Update recall
	await supabase.from('recalls').update({ status: 'booked', booked_appointment_id: appt.id }).eq('id', recallId);
	// Notify
	const { data: patientProfile } = await supabase.from('profiles').select('user_id').eq('id', recall.patient_id).single();
	if (patientProfile?.user_id) {
		await NotificationService.createNotification(
			patientProfile.user_id,
			'Appointment Confirmed',
			`Your ${recall.treatment_label} has been booked for ${slot.date} at ${slot.time.slice(0,5)}.`,
			'appointment',
			'success' as any,
			`/appointments/${appt.id}`,
			{ appointment_id: appt.id }
		);
	}
	await emitAnalyticsEvent('RECALL_BOOKED', recall.dentist_id, { recallId, appointmentId: appt.id });
	return appt.id as string;
}

export async function snoozeRecall(recallId: string, days = 7): Promise<void> {
	const snoozeUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
	await supabase.from('recalls').update({ status: 'snoozed', snooze_until: snoozeUntil }).eq('id', recallId);
}

export async function declineRecall(recallId: string): Promise<void> {
	await supabase.from('recalls').update({ status: 'declined' }).eq('id', recallId);
}

export async function regenerateSlots(recallId: string, mods?: PatientModifiers): Promise<RecallSlot[]> {
	const { data: recall } = await supabase.from('recalls').select('*').eq('id', recallId).single();
	if (!recall) throw new Error('Recall not found');
	const slots = await generateSuggestedSlotsAroundDate(recall.dentist_id, recall.due_date, mods);
	await supabase.from('recalls').update({ suggested_slots: slots }).eq('id', recallId);
	return slots;
}

export async function getPatientActiveRecall(patientId: string): Promise<RecallRecord | null> {
	const { data } = await supabase
		.from('recalls')
		.select('*')
		.eq('patient_id', patientId)
		.in('status', ['suggested', 'snoozed'])
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle();
	return (data as any) || null;
}

export function mapDentistPortalSelectionToKey(choice: string): { key: TreatmentChoiceKey; label: string } | null {
	switch (choice) {
		case 'Cleaning (6 months)': return { key: 'cleaning_6m', label: 'cleaning' };
		case 'Filling follow-up (2 weeks)': return { key: 'filling_follow_up_2w', label: 'filling follow-up' };
		case 'Root canal check (2–4 weeks)': return { key: 'root_canal_check_3w', label: 'root canal check' };
		case 'Implant review (2 weeks, then 3 months)': return { key: 'implant_review_2w', label: 'implant review' };
		case 'Ortho adjustment (3–6 weeks)': return { key: 'ortho_adjust_5w', label: 'ortho adjustment' };
		case 'Extraction follow-up (7–10 days)': return { key: 'extraction_follow_up_9d', label: 'extraction follow-up' };
		case 'General exam (12 months)': return { key: 'general_exam_12m', label: 'general exam' };
		default: return null;
	}
}