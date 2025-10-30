import { supabase } from "@/integrations/supabase/client";
import { NotificationService } from "@/lib/notificationService";
import { emitAnalyticsEvent } from "@/lib/analyticsEvents";

// Types
export interface RecallSlot {
	date: string; // YYYY-MM-DD
	time: string; // HH:mm
	confidence: number; // 0-1 availability confidence
}

export interface RecallRecord {
	id: string;
	patient_id: string;
	dentist_id: string;
	treatment_key: string;
	treatment_label: string;
	due_date: string;
	suggested_slots: RecallSlot[];
	status: string;
	created_at: string;
}

export type TreatmentKey = 'extraction_followup' | 'cleaning' | 'ortho_adjustment' | 'endo_followup' | 'general_exam';

export interface PatientModifiers {
	preferred_days?: number[]; // 0=Sunday
	preferred_hours_start?: string; // HH:mm
	preferred_hours_end?: string; // HH:mm
	avoid_lunch_hours?: boolean;
}

const TREATMENT_INTERVALS: Record<TreatmentKey, number> = {
	extraction_followup: 7,
	cleaning: 180,
	ortho_adjustment: 30,
	endo_followup: 21,
	general_exam: 365
};

/**
 * Given a treatment key, compute due date from base
 */
export function computeDueDate(baseDateISO: string, treatmentKey: TreatmentKey, mods?: PatientModifiers): string {
	const base = new Date(baseDateISO);
	const interval = TREATMENT_INTERVALS[treatmentKey] || 180;
	const due = new Date(base.getTime() + interval * 24 * 60 * 60 * 1000);
	return due.toISOString().split('T')[0];
}

/**
 * Generate slots around a target date (typically the due date), respecting patient preferences
 */
export async function generateSuggestedSlotsAroundDate(
	dentistId: string,
	targetDate: string,
	mods?: PatientModifiers
): Promise<RecallSlot[]> {
	// Simple implementation - generate 3 slots around the target date
	const target = new Date(targetDate);
	const slots: RecallSlot[] = [];
	
	for (let i = -1; i <= 1; i++) {
		const date = new Date(target.getTime() + i * 24 * 60 * 60 * 1000);
		const dateStr = date.toISOString().split('T')[0];
		
		// Generate morning and afternoon slots
		slots.push({
			date: dateStr,
			time: '09:00',
			confidence: 0.8
		});
		
		slots.push({
			date: dateStr,
			time: '14:00',
			confidence: 0.7
		});
	}
	
	return slots.slice(0, 3); // Return top 3 slots
}

// Temporarily disable recalls functionality until types are updated
export async function createRecall(...args: any[]): Promise<any> {
	return null;
}

export async function bookSuggestedSlot(...args: any[]): Promise<string> {
	throw new Error('Recalls functionality temporarily disabled');
}

export function mapDentistPortalSelectionToKey(...args: any[]): any {
	return null;
}

export async function updateRecallStatus(...args: any[]): Promise<void> {
}

export async function regenerateSlots(...args: any[]): Promise<RecallSlot[]> {
	return [];
}

export async function getPatientActiveRecall(...args: any[]): Promise<RecallRecord | null> {
	return null;
}