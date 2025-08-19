import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Papa from "https://esm.sh/papaparse@5.4.1";
import * as XLSX from "https://esm.sh/xlsx@0.18.5";
import ICAL from "https://esm.sh/ical.js@1.5.0";

const corsHeaders = {
	"Access-Control-Allow-Origin": "*",
	"Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utilities
async function sha256(input: string): Promise<string> {
	const data = new TextEncoder().encode(input);
	const digest = await crypto.subtle.digest('SHA-256', data);
	const bytes = Array.from(new Uint8Array(digest));
	return bytes.map(b => b.toString(16).padStart(2, '0')).join('');
}

function normalizeStatus(raw?: string): 'pending' | 'confirmed' | 'completed' | 'cancelled' {
	if (!raw) return 'pending';
	const v = raw.toLowerCase();
	if (v.includes('confirm') || v.includes('book')) return 'confirmed';
	if (v.includes('done') || v.includes('complete')) return 'completed';
	if (v.includes('cancel')) return 'cancelled';
	return 'pending';
}

function toIsoUtc(dateLike: string | Date): string | null {
	try {
		const d = typeof dateLike === 'string' ? new Date(dateLike) : dateLike;
		if (isNaN(d.getTime())) return null;
		return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString();
	} catch {
		return null;
	}
}

function parseCsv(content: string): { rows: any[]; delimiter: string } {
	const papaAny: any = (Papa as any);
	const papa = papaAny?.parse ? papaAny : papaAny?.default ?? papaAny;
	const parsed = papa.parse(content, { header: true, skipEmptyLines: true, dynamicTyping: false });
	return { rows: parsed.data as any[], delimiter: (parsed as any).meta?.delimiter || ',' };
}

function parseXlsx(bytes: Uint8Array): any[] {
	const workbook = XLSX.read(bytes, { type: 'array' });
	const sheetName = workbook.SheetNames[0];
	const sheet = workbook.Sheets[sheetName];
	return XLSX.utils.sheet_to_json(sheet, { raw: false });
}

function expandIcs(icsText: string): any[] {
	const jcal = ICAL.parse(icsText);
	const comp = new ICAL.Component(jcal);
	const vevents = comp.getAllSubcomponents('vevent');
	const results: any[] = [];
	for (const vevent of vevents) {
		const event = new ICAL.Event(vevent);
		if (event.isRecurring()) {
			const iter = event.iterator();
			let next;
			let count = 0;
			while ((next = iter.next())) {
				// Cap expansion to 2 years to avoid runaway
				if (++count > 2000) break;
				const start = next.toJSDate();
				const end = event.endDate.toJSDate();
				const durationMs = event.endDate.toUnixTime() - event.startDate.toUnixTime();
				const endJs = new Date(start.getTime() + durationMs * 1000);
				results.push({
					start: toIsoUtc(start)!,
					end: toIsoUtc(endJs)!,
					summary: event.summary,
					description: event.description,
					attendees: (vevent.getAllProperties('attendee') || []).map((a: any) => String(a.getFirstValue?.() ?? a.getValues?.() ?? '')),
					organizer: String(vevent.getFirstPropertyValue('organizer') ?? ''),
				});
			}
		} else {
			results.push({
				start: toIsoUtc(event.startDate.toJSDate())!,
				end: toIsoUtc(event.endDate.toJSDate())!,
				summary: event.summary,
				description: event.description,
				attendees: (vevent.getAllProperties('attendee') || []).map((a: any) => String(a.getFirstValue?.() ?? a.getValues?.() ?? '')),
				organizer: String(vevent.getFirstPropertyValue('organizer') ?? ''),
			});
		}
	}
	return results;
}

function guessNameParts(full: string | undefined): { first?: string; last?: string } {
	if (!full) return {};
	const parts = full.trim().split(/\s+/);
	if (parts.length === 1) return { first: parts[0] };
	return { first: parts.slice(0, -1).join(' '), last: parts[parts.length - 1] };
}

serve(async (req) => {
	if (req.method === "OPTIONS") {
		return new Response(null, { headers: corsHeaders });
	}

	try {
		const authHeader = req.headers.get("authorization");
		if (!authHeader) throw new Error("Authorization header required");

		const supabase = createClient(
			Deno.env.get("SUPABASE_URL") ?? "",
			Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
			{ global: { headers: { Authorization: authHeader } } }
		);

		const { data: { user } } = await supabase.auth.getUser();
		if (!user) throw new Error("Invalid or expired token");

		// Helper to ensure a profile (and dentist row if role=dentist) exists
		async function ensureProfile(params: { email?: string; first?: string; last?: string; role: 'patient'|'dentist'; phone?: string; dobIso?: string }) {
			const email = params.email || `${params.role}+${Date.now()}@example.com`;
			// Try find by email
			const existing = await supabase.from('profiles').select('id').eq('email', email).limit(1).maybeSingle();
			if (existing.data) {
				if (params.role === 'dentist') {
					const dent = await supabase.from('dentists').select('id').eq('profile_id', existing.data.id as string).limit(1).maybeSingle();
					return { profileId: existing.data.id as string, dentistId: dent.data?.id as (string|undefined) };
				}
				return { profileId: existing.data.id as string };
			}
			// Create auth user via admin
			const admin = supabase.auth.admin;
			const created = await admin.createUser({ email, email_confirm: true });
			if (created.error) throw created.error;
			const userId = created.data.user?.id;
			if (!userId) throw new Error('Failed to create user');
			// Create profile row
			const { data: prof } = await supabase.from('profiles').insert({
				user_id: userId,
				email: email,
				first_name: params.first || 'Unknown',
				last_name: params.last || (params.role === 'dentist' ? 'Dentist' : 'Patient'),
				role: params.role,
				phone: params.phone || null,
				date_of_birth: params.dobIso || null
			}).select('id').single();
			let dentistId: string | undefined = undefined;
			if (params.role === 'dentist' && prof) {
				const { data: dent } = await supabase.from('dentists').insert({ profile_id: prof.id, specialization: 'General' }).select('id').single();
				dentistId = dent?.id;
			}
			return { profileId: prof?.id as string, dentistId };
		}

		const url = new URL(req.url);
		const action = url.searchParams.get('action') || 'dry-run';

		if (req.method !== 'POST') {
			return new Response(JSON.stringify({ error: 'POST required' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 405 });
		}

		const contentType = req.headers.get('content-type') || '';
		let rows: any[] = [];
		let sourceType: 'csv'|'xlsx'|'ics' = 'csv';
		let sourceHash = '';
		let filename = url.searchParams.get('filename') || `import-${Date.now()}`;
		let clinicTz = url.searchParams.get('tz') || undefined;
		const defaultDurations: Record<string, number> = {
			Cleaning: 45,
			Consult: 30,
			Consultation: 30,
		};

		const body = new Uint8Array(await req.arrayBuffer());
		if (contentType.includes('text/csv') || filename.endsWith('.csv')) {
			sourceType = 'csv';
			const text = new TextDecoder('utf-8').decode(body);
			rows = parseCsv(text).rows;
			sourceHash = await sha256(text);
		} else if (contentType.includes('spreadsheet') || filename.endsWith('.xlsx')) {
			sourceType = 'xlsx';
			rows = parseXlsx(body);
			sourceHash = await sha256(String(body.length));
		} else if (contentType.includes('text/calendar') || filename.endsWith('.ics')) {
			sourceType = 'ics';
			const text = new TextDecoder('utf-8').decode(body);
			rows = expandIcs(text);
			sourceHash = await sha256(text);
		} else {
			return new Response(JSON.stringify({ error: 'Unsupported file type' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 });
		}

		// Fetch current profile to use as owner/created_by
		const { data: profile } = await supabase
			.from('profiles')
			.select('id')
			.eq('user_id', user.id)
			.single();

		if (!profile) throw new Error('Profile not found');

		// Field mapping - allow client to pass a mapping json; else try heuristics
		const mapping = (await req.json().catch(() => ({}))).mapping || {};

		// Pre-map by fuzzy names
		function get(row: any, ...keys: string[]): string | undefined {
			for (const k of keys) {
				const found = Object.keys(row).find(h => h.toLowerCase().replace(/\s|_/g, '') === k.toLowerCase().replace(/\s|_/g, ''));
				if (found) return String(row[found] ?? '');
			}
			return undefined;
		}

		// Transform into normalized candidate records
		type Candidate = {
			patient_name?: string;
			patient_first_name?: string;
			patient_last_name?: string;
			patient_email?: string;
			patient_phone?: string;
			patient_dob?: string;
			dentist_name?: string;
			dentist_email?: string;
			start?: string;
			end?: string;
			description?: string;
			summary?: string;
			status?: string;
			type?: string;
		};

		const candidates: Candidate[] = rows.map((row: any) => {
			if (sourceType === 'ics') {
				return {
					patient_name: undefined,
					dentist_name: get(row, 'organizer') || get(row, 'attendees'),
					start: row.start,
					end: row.end,
					summary: row.summary,
					description: row.description,
					status: 'pending',
				};
			}
			return {
				patient_name: get(row, 'patient', 'patientname', 'name', 'patient_name'),
				patient_first_name: get(row, 'first_name', 'firstname', 'givenname'),
				patient_last_name: get(row, 'last_name', 'lastname', 'surname', 'familyname'),
				patient_email: get(row, 'email', 'patient_email'),
				patient_phone: get(row, 'phone', 'mobile', 'telephone'),
				patient_dob: get(row, 'dob', 'dateofbirth', 'birthdate', 'birthday'),
				dentist_name: get(row, 'dentist', 'provider', 'doctor'),
				dentist_email: get(row, 'dentist_email', 'provider_email', 'doctor_email'),
				start: get(row, 'start', 'start_time', 'start_at', 'appointment_date'),
				end: get(row, 'end', 'end_time', 'end_at'),
				summary: get(row, 'summary', 'title', 'reason', 'type'),
				description: get(row, 'description', 'notes'),
				status: get(row, 'status'),
				type: get(row, 'type', 'appointment_type', 'reason'),
			};
		});

		// Matching rules & preview
		const preview: any[] = [];
		let toCreate = 0, toMatch = 0, warn = 0, err = 0;

		for (let i = 0; i < candidates.length; i++) {
			const c = candidates[i];
			const messages: string[] = [];

			const fullName = c.patient_name || [c.patient_first_name, c.patient_last_name].filter(Boolean).join(' ');
			const { first: pf, last: pl } = guessNameParts(fullName);
			const dob = c.patient_dob ? new Date(c.patient_dob) : undefined;
			const dobIso = dob && !isNaN(dob.getTime()) ? dob.toISOString().slice(0, 10) : undefined;

			// Patient match: (first+last+dob) OR (email OR phone)
			let matchedPatientId: string | null = null;
			if (pf && pl && dobIso) {
				const { data: pat } = await supabase.from('profiles').select('id').eq('first_name', pf).eq('last_name', pl).eq('date_of_birth', dobIso).limit(1).maybeSingle();
				if (pat) { matchedPatientId = pat.id; toMatch++; }
			}
			if (!matchedPatientId && (c.patient_email || c.patient_phone)) {
				let q = supabase.from('profiles').select('id');
				if (c.patient_email) q = q.eq('email', c.patient_email);
				if (c.patient_phone) q = q.eq('phone', c.patient_phone);
				const { data: patByContact } = await q.limit(2);
				if (patByContact && patByContact.length === 1) { matchedPatientId = patByContact[0].id; toMatch++; }
				else if (patByContact && patByContact.length > 1) { messages.push('Needs review: multiple patient matches'); warn++; }
			}
			if (!matchedPatientId && !(pf || c.patient_email || c.patient_phone || dobIso)) {
				messages.push('Missing patient identity (name/email/phone/dob)');
				err++;
			}

			// Dentist match: email > exact name; else best-effort fuzzy by last name
			let matchedDentistId: string | null = null;
			if (c.dentist_email) {
				const { data: dentistByEmail } = await supabase
					.from('profiles')
					.select('id')
					.eq('email', c.dentist_email)
					.limit(1)
					.maybeSingle();
				if (dentistByEmail) {
					const { data: dentistRow } = await supabase.from('dentists').select('id').eq('profile_id', dentistByEmail.id).maybeSingle();
					matchedDentistId = dentistRow?.id ?? null;
				}
			} else if (c.dentist_name) {
				const { first: df, last: dl } = guessNameParts(c.dentist_name);
				if (df && dl) {
					const { data: dentist } = await supabase
						.from('profiles')
						.select('id')
						.ilike('first_name', df)
						.ilike('last_name', dl)
						.limit(1)
						.maybeSingle();
					if (dentist) {
						const { data: dRow } = await supabase.from('dentists').select('id').eq('profile_id', dentist.id).maybeSingle();
						matchedDentistId = dRow?.id ?? null;
					}
				}
				// fallback: try last name only if still not matched
				if (!matchedDentistId && dl) {
					const { data: dentists } = await supabase
						.from('profiles')
						.select('id')
						.ilike('last_name', dl)
						.limit(2);
					if ((dentists || []).length === 1) {
						const { data: dRow } = await supabase.from('dentists').select('id').eq('profile_id', dentists![0].id).maybeSingle();
						matchedDentistId = dRow?.id ?? null;
					} else if ((dentists || []).length > 1) {
						messages.push('Needs review: multiple dentist matches'); warn++;
					}
				}
			}

			// Time normalization
			const startIso = toIsoUtc(c.start || '');
			let endIso = toIsoUtc(c.end || '');
			if (!startIso) {
				messages.push(`Can't parse date '${c.start ?? ''}' – fix format to YYYY-MM-DD or ISO`);
				err++;
			}
			if (!endIso && startIso) {
				const typeKey = (c.type || c.summary || '').trim();
				const mins = defaultDurations[typeKey] || 30;
				endIso = new Date(new Date(startIso).getTime() + mins * 60000).toISOString();
			}

			const status = normalizeStatus(c.status);
			preview.push({
				row: i + 1,
				patient: { name: fullName, dob: dobIso, email: c.patient_email, phone: c.patient_phone, match: matchedPatientId || undefined },
				dentist: { name: c.dentist_name, email: c.dentist_email, match: matchedDentistId || undefined },
				start: startIso,
				end: endIso,
				status,
				messages,
			});
		}

		if (action === 'dry-run') {
			// Build CSV report for full preview
			const header = 'row,patient_name,patient_email,dentist_name,dentist_email,start,end,status,messages\n';
			const lines = preview.map((r) => {
				const fields = [
					String(r.row),
					JSON.stringify(r.patient?.name || ''),
					JSON.stringify(r.patient?.email || ''),
					JSON.stringify(r.dentist?.name || ''),
					JSON.stringify(r.dentist?.email || ''),
					JSON.stringify(r.start || ''),
					JSON.stringify(r.end || ''),
					JSON.stringify(r.status || ''),
					JSON.stringify((r.messages || []).join('; '))
				];
				return fields.join(',');
			}).join('\n');
			const reportCsv = header + lines;
			const b64 = btoa(unescape(encodeURIComponent(reportCsv)));
			return new Response(JSON.stringify({
				counts: { total: candidates.length, to_create: toCreate, to_match: toMatch, warnings: warn, errors: err },
				preview: preview.slice(0, 10),
				report_csv_b64: b64
			}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
		}

		// Commit flow
		const { data: job } = await supabase.from('import_jobs').insert({
			created_by: profile.id,
			source_type: sourceType,
			source_file_hash: sourceHash,
			status: 'importing',
			clinic_timezone: clinicTz,
			total_rows: candidates.length
		}).select('*').single();

		if (!job) throw new Error('Failed to create import job');

		const chunkSize = 200;
		for (let i = 0; i < candidates.length; i += chunkSize) {
			const chunk = candidates.slice(i, i + chunkSize);
			for (let j = 0; j < chunk.length; j++) {
				const idx = i + j;
				const c = candidates[idx];
				const messages: string[] = [];

				const fullName = c.patient_name || [c.patient_first_name, c.patient_last_name].filter(Boolean).join(' ');
				const { first: pf, last: pl } = guessNameParts(fullName);
				const dobIso = c.patient_dob ? new Date(c.patient_dob).toISOString().slice(0, 10) : undefined;

				let patientId: string | null = null;
				// Try strong match first
				if (pf && pl && dobIso) {
					const { data: found } = await supabase.from('profiles').select('id').eq('first_name', pf).eq('last_name', pl).eq('date_of_birth', dobIso as any).limit(1).maybeSingle();
					if (found) patientId = found.id;
				}
				if (!patientId && (c.patient_email || c.patient_phone)) {
					let q = supabase.from('profiles').select('id');
					if (c.patient_email) q = q.eq('email', c.patient_email);
					if (c.patient_phone) q = q.eq('phone', c.patient_phone);
					const { data: foundByContact } = await q.limit(1).maybeSingle();
					if (foundByContact) patientId = foundByContact.id;
				}
				if (!patientId && (pf || c.patient_email || c.patient_phone || dobIso)) {
					const ensured = await ensureProfile({ email: c.patient_email, first: pf, last: pl, role: 'patient', phone: c.patient_phone, dobIso });
					patientId = ensured.profileId;
				}

				let dentistId: string | null = null;
				if (c.dentist_email) {
					const { data: dentistProfile } = await supabase.from('profiles').select('id').eq('email', c.dentist_email).maybeSingle();
					if (dentistProfile) {
						const { data: d } = await supabase.from('dentists').select('id').eq('profile_id', dentistProfile.id).maybeSingle();
						dentistId = d?.id ?? null;
					}
				}
				if (!dentistId && (c.dentist_name || c.dentist_email)) {
					const { first: df, last: dl } = guessNameParts(c.dentist_name || 'Dentist');
					const ensured = await ensureProfile({ email: c.dentist_email, first: df, last: dl, role: 'dentist' });
					dentistId = ensured.dentistId || null;
				}

				const startIso = toIsoUtc(c.start || '');
				let endIso = toIsoUtc(c.end || '');
				if (!endIso && startIso) {
					const typeKey = (c.type || c.summary || '').trim();
					const mins = defaultDurations[typeKey] || 30;
					endIso = new Date(new Date(startIso).getTime() + mins * 60000).toISOString();
				}

				// Safety: reminders per past/future
				const nowIso = new Date().toISOString();
				const remindersEnabled = startIso && startIso > nowIso;

				let appointmentId: string | null = null;
				if (patientId && dentistId && startIso) {
					// De-dupe: same dentist + patient + start time
					const { data: existing } = await supabase
						.from('appointments')
						.select('id')
						.eq('patient_id', patientId)
						.eq('dentist_id', dentistId)
						.eq('appointment_date', startIso)
						.limit(1)
						.maybeSingle();
					if (existing) {
						appointmentId = existing.id;
					} else {
						const { data: inserted } = await supabase.from('appointments').insert({
							patient_id: patientId,
							dentist_id: dentistId,
							appointment_date: startIso,
							duration_minutes: Math.max(15, Math.round(((new Date(endIso ?? startIso).getTime() - new Date(startIso).getTime()) / 60000) || 30)),
							status: normalizeStatus(c.status),
							reason: c.summary || c.type || 'Consultation',
							notes: c.description || null,
							reminders_enabled: remindersEnabled,
							clinic_timezone: clinicTz || null,
							import_batch_id: job.id
						}).select('id').single();
						appointmentId = inserted?.id ?? null;
					}
				}

				await supabase.from('import_job_items').insert({
					job_id: job.id,
					row_number: idx + 1,
					status: 'ok',
					message: messages.join('; '),
					patient_id: patientId,
					dentist_id: dentistId,
					appointment_id: appointmentId,
					raw: c as any,
					normalized: { start: startIso, end: endIso, status: normalizeStatus(c.status) } as any
				});
			}
		}

		await supabase.from('import_jobs').update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', job.id);

		return new Response(JSON.stringify({ job_id: job.id, imported: candidates.length }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
	} catch (e) {
		console.error('Importer error', e);
		return new Response(JSON.stringify({ error: (e as Error).message }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 });
	}
});