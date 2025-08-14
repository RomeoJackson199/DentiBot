import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Calendar } from "lucide-react";
import { QuickPhotoUpload } from "@/components/QuickPhotoUpload";
import { emitAnalyticsEvent } from "@/lib/analyticsEvents";

interface AppointmentCompletionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appointment: {
		id: string;
		patient_id: string;
		dentist_id: string;
		appointment_date: string;
		status: string;
	};
	dentistId: string;
	onCompleted: () => void;
}

interface TreatmentItemForm {
	code: string;
	description: string;
	quantity: number;
	tooth_ref?: string;
	tariff: number;
	mutuality_share: number;
	patient_share: number;
	vat_amount: number;
}

export function AppointmentCompletionModal({ open, onOpenChange, appointment, dentistId, onCompleted }: AppointmentCompletionModalProps) {
	const { toast } = useToast();
	const [loading, setLoading] = useState(false);
	const [locking, setLocking] = useState(false);
	const sb: any = supabase;

	// A. Performed Treatments
	const [treatmentQuery, setTreatmentQuery] = useState("");
	const [availableTariffs, setAvailableTariffs] = useState<Array<{ code: string; description: string; base_tariff: number; vat_rate: number; mutuality_share_pct: number; patient_share_pct: number }>>([]);
	const [treatments, setTreatments] = useState<TreatmentItemForm[]>([]);

	// B. Outcome & Notes
	const [outcome, setOutcome] = useState<'successful' | 'partial' | 'cancelled' | 'complication'>('successful');
	const [notes, setNotes] = useState("");
	const [painScore, setPainScore] = useState<number | undefined>(undefined);
	const [anesthesiaUsed, setAnesthesiaUsed] = useState(false);
	const [anesthesiaDose, setAnesthesiaDose] = useState("");

	// C. Add to Treatment Plan
	const [createPlan, setCreatePlan] = useState(false);
	const [planTitle, setPlanTitle] = useState("");
	const [planStage, setPlanStage] = useState("");
	const [planEstimatedCost, setPlanEstimatedCost] = useState<number | undefined>(undefined);
	const [planEstimatedDuration, setPlanEstimatedDuration] = useState("");
	const [planDiscussed, setPlanDiscussed] = useState(false);

	// D. Prescriptions
	const [rxMedName, setRxMedName] = useState("");
	const [rxDosage, setRxDosage] = useState("");
	const [rxFrequency, setRxFrequency] = useState("");
	const [rxDuration, setRxDuration] = useState("");
	const [rxSubstitution, setRxSubstitution] = useState(false);
	const [rxRepeats, setRxRepeats] = useState(0);
	const [rxRoute, setRxRoute] = useState("");

	// E. Payment & Invoice
	const totals = useMemo(() => {
		const tariff = treatments.reduce((sum, t) => sum + t.tariff * t.quantity, 0);
		const mutuality = treatments.reduce((sum, t) => sum + t.mutuality_share * t.quantity, 0);
		const patient = treatments.reduce((sum, t) => sum + t.patient_share * t.quantity, 0);
		const vat = treatments.reduce((sum, t) => sum + t.vat_amount * t.quantity, 0);
		return { tariff, mutuality, patient, vat };
	}, [treatments]);

	const [startPayment, setStartPayment] = useState(false);

	const sendPaymentLink = async () => {
		try {
			const { data: appt } = await sb.from('appointments').select('patient_id, dentist_id').eq('id', appointment.id).single();
			const patientCents = Math.round((totals.patient + totals.vat) * 100);
			const { data: pr, error } = await supabase.functions.invoke('create-payment-request', {
				body: {
					patient_id: appt.patient_id,
					dentist_id: appt.dentist_id,
					amount: patientCents,
					description: `Appointment ${appointment.id} patient share`,
					patient_email: (await sb.from('profiles').select('email').eq('id', appt.patient_id).single()).data?.email
				}
			});
			if (error) throw error;
			// Create notification to patient if possible
			const { data: profile } = await sb.from('profiles').select('user_id, first_name, last_name').eq('id', appt.patient_id).single();
			if (profile?.user_id && pr?.payment_url) {
				await sb.from('notifications').insert({
					user_id: profile.user_id,
					patient_id: appt.patient_id,
					dentist_id: appt.dentist_id,
					type: 'payment',
					title: 'Payment Request',
					message: `Payment request for €${(patientCents/100).toFixed(2)} - Appointment ${new Date(appointment.appointment_date).toLocaleDateString()}`,
					priority: 'high',
					action_url: pr.payment_url,
					action_label: 'Pay Now',
					metadata: { payment_url: pr.payment_url, amount: patientCents }
				});
			}
			await emitAnalyticsEvent('INVOICE_CREATED', dentistId, { appointmentId: appointment.id, amount_cents: patientCents, status: 'unpaid' });
			toast({ title: 'Payment link sent', description: 'The patient was notified.' });
		} catch (e: any) {
			toast({ title: 'Error', description: e.message || 'Failed to send link', variant: 'destructive' });
		}
	};

	const markAsPaid = async () => {
		try {
			const { data: appt } = await sb.from('appointments').select('patient_id, dentist_id').eq('id', appointment.id).single();
			const totalCents = Math.round((totals.tariff + totals.vat) * 100);
			const patientCents = Math.round((totals.patient + totals.vat) * 100);
			const mutualityCents = Math.round(totals.mutuality * 100);
			const vatCents = Math.round(totals.vat * 100);
			// Upsert-like: try get existing invoice
			const { data: existing } = await sb.from('invoices').select('id').eq('appointment_id', appointment.id).order('created_at', { ascending: false }).limit(1).maybeSingle();
			let invoiceId = existing?.id;
			if (!invoiceId) {
				const { data: invoice, error: invErr } = await sb.from('invoices').insert({
					appointment_id: appointment.id,
					patient_id: appt.patient_id,
					dentist_id: appt.dentist_id,
					total_amount_cents: totalCents,
					patient_amount_cents: patientCents,
					mutuality_amount_cents: mutualityCents,
					vat_amount_cents: vatCents,
					status: 'issued',
					claim_status: 'to_be_submitted'
				}).select('*').single();
				if (invErr) throw invErr;
				invoiceId = invoice.id;
				await sb.from('invoice_items').insert(
					treatments.map(t => ({
						invoice_id: invoice.id,
						code: t.code,
						description: t.description,
						quantity: t.quantity,
						tariff_cents: Math.round(t.tariff * 100),
						mutuality_cents: Math.round(t.mutuality_share * 100),
						patient_cents: Math.round(t.patient_share * 100),
						vat_cents: Math.round(t.vat_amount * 100)
					}))
				);
			}
			await sb.from('invoices').update({ status: 'paid' }).eq('id', invoiceId as string);
			await sb.from('appointments').update({ status: 'completed', treatment_completed_at: new Date().toISOString() }).eq('id', appointment.id);
			await emitAnalyticsEvent('INVOICE_CREATED', dentistId, { appointmentId: appointment.id, amount_cents: patientCents, status: 'paid' });
			await emitAnalyticsEvent('APPOINTMENT_COMPLETED', dentistId, { appointmentId: appointment.id, totals: { ...totals, total_due_cents: Math.round((totals.patient + totals.vat) * 100) }, outcome });
			toast({ title: 'Marked as paid' });
			onCompleted();
			onOpenChange(false);
		} catch (e: any) {
			toast({ title: 'Error', description: e.message || 'Failed to mark as paid', variant: 'destructive' });
		}
	};

	// F. Follow-Up
	const [followUpNeeded, setFollowUpNeeded] = useState(false);
	const [followUpDate, setFollowUpDate] = useState<string | undefined>(undefined);
	const [followUpReason, setFollowUpReason] = useState("");

	// G. Files (we will store references in medical_records with appointment_id)
	const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);

	useEffect(() => {
		if (!open) return;
		// Load tariffs subset for quick search
		(async () => {
			const { data, error } = await sb
				.from('tariffs')
				.select('code, description, base_tariff, vat_rate, mutuality_share_pct, patient_share_pct')
				.eq('is_active', true)
				.limit(200);
			if (!error && data) setAvailableTariffs(data as any);
		})();
	}, [open]);

	// Insurance profile
	const [insuranceProfile, setInsuranceProfile] = useState<any | null>(null);
	const [insuranceWarning, setInsuranceWarning] = useState<string | null>(null);
	useEffect(() => {
		if (!open) return;
		(async () => {
			const dateIso = appointment.appointment_date;
			// active at service date: valid_from <= date AND (valid_to IS NULL OR valid_to >= date) AND is_active = true
			const { data, error } = await sb
				.from('patient_insurance_profiles')
				.select('*')
				.eq('patient_id', appointment.patient_id)
				.eq('is_active', true);
			if (!error && data) {
				const active = (data as any[]).find(p => new Date(p.valid_from) <= new Date(dateIso) && (!p.valid_to || new Date(p.valid_to) >= new Date(dateIso))) || null;
				setInsuranceProfile(active || null);
				setInsuranceWarning(active ? null : 'No active mutuality profile for service date');
			}
		})();
	}, [open, appointment.patient_id, appointment.appointment_date]);

	const applyInsuranceAdjustments = (base: number, tariff: any) => {
		let mutualityPct = Number(tariff.mutuality_share_pct || 0);
		let patientPct = Number(tariff.patient_share_pct || 100 - mutualityPct);
		if (insuranceProfile?.is_omnio || insuranceProfile?.is_vip) {
			mutualityPct = 100;
			patientPct = 0;
		}
		const mutualityShare = +(base * (mutualityPct / 100)).toFixed(2);
		const patientShare = +(base * (patientPct / 100)).toFixed(2);
		return { mutualityShare, patientShare };
	};

	const addTreatmentFromCode = (code: string) => {
		const tariff = availableTariffs.find(t => t.code === code);
		if (!tariff) return;
		const base = Number(tariff.base_tariff || 0);
		const vatAmount = +(base * (Number(tariff.vat_rate || 0) / 100)).toFixed(2);
		const shares = applyInsuranceAdjustments(base, tariff);
		setTreatments(prev => ([...prev, {
			code: tariff.code,
			description: tariff.description,
			quantity: 1,
			tooth_ref: '',
			tariff: base,
			mutuality_share: shares.mutualityShare,
			patient_share: shares.patientShare,
			vat_amount: vatAmount
		}]));
		// Emit treatment-performed analytics when adding a line
		emitAnalyticsEvent('TREATMENTS_PERFORMED', dentistId, { appointmentId: appointment.id, code: tariff.code, description: tariff.description, quantity: 1 });
	};

	const removeTreatment = (index: number) => {
		setTreatments(prev => prev.filter((_, i) => i !== index));
	};

	const saveAll = async (startStripe: boolean) => {
		if (locking) return;
		setLoading(true);
		try {
			// Prevent double-completion
			setLocking(true);
			const { data: current, error: fetchErr } = await sb.from('appointments').select('status, patient_id, dentist_id').eq('id', appointment.id).single();
			if (fetchErr) throw fetchErr;
			if (current?.status === 'completed') {
				toast({ title: 'Already completed', description: 'This appointment is already marked as completed.', variant: 'destructive' });
				onOpenChange(false);
				setLocking(false);
				return;
			}

			// Outcome
			if (outcome) {
				await sb.from('appointment_outcomes').insert({
					appointment_id: appointment.id,
					outcome,
					notes,
					pain_score: typeof painScore === 'number' ? painScore : null,
					anesthesia_used: anesthesiaUsed,
					anesthesia_dose: anesthesiaUsed ? anesthesiaDose : null,
					created_by: dentistId
				});
			}

			// Treatments
			if (treatments.length > 0) {
				await sb.from('appointment_treatments').insert(
					treatments.map(t => ({
						appointment_id: appointment.id,
						code: t.code,
						description: t.description,
						quantity: t.quantity,
						tooth_ref: t.tooth_ref || null,
						tariff: t.tariff,
						mutuality_share: t.mutuality_share,
						patient_share: t.patient_share,
						vat_amount: t.vat_amount
					}))
				);
				// Emit per code
				for (const t of treatments) {
					await emitAnalyticsEvent('TREATMENTS_PERFORMED', dentistId, { appointmentId: appointment.id, code: t.code, quantity: t.quantity });
				}
			}

			// Treatment plan (optional)
			if (createPlan && planTitle.trim()) {
				await sb.from('treatment_plans').insert({
					patient_id: current.patient_id,
					dentist_id: current.dentist_id,
					title: planTitle,
					description: planStage,
					estimated_cost: planEstimatedCost || null,
					estimated_duration: planEstimatedDuration || null,
					status: 'draft',
					notes: planDiscussed ? 'Discussed with patient' : null,
					start_date: new Date().toISOString()
				});
			}

			// Prescription (optional quick add)
			let createdRx = false;
			if (rxMedName.trim()) {
				await sb.from('prescriptions').insert({
					patient_id: current.patient_id,
					dentist_id: current.dentist_id,
					medication_name: rxMedName,
					dosage: rxDosage || '',
					frequency: rxFrequency || '',
					duration_days: rxDuration ? parseInt(rxDuration) : null,
					instructions: `${rxRoute}${rxRoute && ' '}${rxSubstitution ? '(no substitution)' : ''}`.trim(),
					status: 'active',
					appointment_id: appointment.id,
					prescribed_date: new Date().toISOString()
				});
				createdRx = true;
			}

			// Files -> create medical_records entries linked to appointment
			for (const url of uploadedFiles) {
				await sb.from('medical_records').insert({
					patient_id: current.patient_id,
					dentist_id: current.dentist_id,
					record_type: 'xray',
					title: 'Uploaded file',
					description: 'Appointment file',
					file_url: url,
					record_date: new Date().toISOString(),
					appointment_id: appointment.id
				});
			}

			// Create invoice draft and items from performed treatments
			if (treatments.length > 0) {
				const totalCents = Math.round((totals.tariff + totals.vat) * 100);
				const patientCents = Math.round((totals.patient + totals.vat) * 100);
				const mutualityCents = Math.round(totals.mutuality * 100);
				const vatCents = Math.round(totals.vat * 100);
				const { data: invoice, error: invErr } = await sb.from('invoices').insert({
					appointment_id: appointment.id,
					patient_id: current.patient_id,
					dentist_id: current.dentist_id,
					total_amount_cents: totalCents,
					patient_amount_cents: patientCents,
					mutuality_amount_cents: mutualityCents,
					vat_amount_cents: vatCents,
					status: 'draft',
					claim_status: 'to_be_submitted'
				}).select('*').single();
				if (invErr) throw invErr;
				await sb.from('invoice_items').insert(
					treatments.map(t => ({
						invoice_id: invoice.id,
						code: t.code,
						description: t.description,
						quantity: t.quantity,
						tariff_cents: Math.round(t.tariff * 100),
						mutuality_cents: Math.round(t.mutuality_share * 100),
						patient_cents: Math.round(t.patient_share * 100),
						vat_cents: Math.round(t.vat_amount * 100)
					}))
				);
				await emitAnalyticsEvent('INVOICE_CREATED', dentistId, { appointmentId: appointment.id, amount_cents: patientCents, status: 'unpaid' });
				// Optional: create payment request if starting payment
				if (startStripe || startPayment) {
					const { data: payment, error: payErr } = await supabase.functions.invoke('create-payment-request', {
						body: {
							patient_id: current.patient_id,
							dentist_id: current.dentist_id,
							amount: patientCents,
							description: `Appointment ${appointment.id} patient share`,
							patient_email: (await supabase.from('profiles').select('email').eq('id', current.patient_id).single()).data?.email
						}
					});
					if (!payErr && payment?.payment_url) {
						window.open(payment.payment_url, '_blank');
					}
				}
			}

			// Mark appointment as completed
			await sb.from('appointments').update({ status: 'completed', treatment_completed_at: new Date().toISOString() }).eq('id', appointment.id);
			await emitAnalyticsEvent('APPOINTMENT_COMPLETED', dentistId, { appointmentId: appointment.id, totals: { ...totals, total_due_cents: Math.round((totals.patient + totals.vat) * 100) }, outcome });
			if (rxMedName.trim()) {
				await emitAnalyticsEvent('PRESCRIPTION_CREATED', dentistId, { appointmentId: appointment.id, medication_name: rxMedName });
			}

			toast({ title: 'Saved', description: 'Appointment completion saved.' });
			onCompleted();
			onOpenChange(false);
		} catch (e: any) {
			toast({ title: 'Error', description: e.message || 'Failed to complete appointment', variant: 'destructive' });
		} finally {
			setLoading(false);
			setLocking(false);
		}
	};

	return (
		<Drawer open={open} onOpenChange={onOpenChange}>
			<DrawerContent className="max-h-[90vh] overflow-y-auto p-3">
				<div className="space-y-4">
					{/* A. Performed Treatments */}
					<Card>
						<CardContent className="space-y-3 p-4">
							<div className="flex items-center justify-between">
								<h3 className="font-semibold">A. Performed Treatments</h3>
								<Badge variant="secondary">Search NIHDI</Badge>
							</div>
							{insuranceWarning && (
								<div className="text-xs text-amber-600 bg-amber-50 border border-amber-200 p-2 rounded">
									{insuranceWarning}
									<Button variant="link" className="px-1" onClick={async () => {
										try {
											await sb.from('patient_insurance_profiles').insert({
												patient_id: appointment.patient_id,
												valid_from: new Date().toISOString().slice(0,10),
												is_active: true
											});
											setInsuranceWarning(null);
											toast({ title: 'Mutuality added', description: 'A basic mutuality profile was created. Please update details later.' });
										} catch {}
									}}>Add Mutuality</Button>
								</div>
							)}
							<Input placeholder="Search by name or NIHDI code" value={treatmentQuery} onChange={(e) => setTreatmentQuery(e.target.value)} />
							<div className="space-y-2">
								{availableTariffs.filter(t => t.code.toLowerCase().includes(treatmentQuery.toLowerCase()) || t.description.toLowerCase().includes(treatmentQuery.toLowerCase())).slice(0, 5).map(t => (
									<div key={t.code} className="flex items-center justify-between text-sm">
										<div>
											<div className="font-medium">{t.code} - {t.description}</div>
											<div className="text-muted-foreground">€{t.base_tariff.toFixed(2)}</div>
										</div>
										<Button size="sm" onClick={() => addTreatmentFromCode(t.code)}>Add</Button>
									</div>
								))}
							</div>
							<div className="space-y-2">
								{treatments.map((t, idx) => (
									<div key={`${t.code}-${idx}`} className="border rounded p-2">
										<div className="flex items-center justify-between">
											<div className="font-medium">{t.code} - {t.description}</div>
											<Button variant="ghost" size="sm" onClick={() => removeTreatment(idx)}>Remove</Button>
										</div>
										<div className="grid grid-cols-4 gap-2 mt-2">
											<Input type="number" value={t.quantity} onChange={e => setTreatments(prev => prev.map((x,i) => i===idx ? {...x, quantity: Math.max(1, parseInt(e.target.value || '1'))} : x))} />
											<Input placeholder="Tooth/quadrant" value={t.tooth_ref || ''} onChange={e => setTreatments(prev => prev.map((x,i) => i===idx ? {...x, tooth_ref: e.target.value} : x))} />
											<Input disabled value={`€${t.tariff.toFixed(2)}`} />
											<Input disabled value={`Patient €${t.patient_share.toFixed(2)}`} />
										</div>
									</div>
								))}
							</div>
							<div className="flex justify-between items-center text-sm">
								<div className="flex gap-4">
									<div>Tariff: €{totals.tariff.toFixed(2)}</div>
									<div>Mutuality: €{totals.mutuality.toFixed(2)}</div>
									<div>Patient: €{totals.patient.toFixed(2)}</div>
								</div>
								<div className="text-xs text-muted-foreground">Service date: {new Date(appointment.appointment_date).toLocaleDateString()}</div>
							</div>
						</CardContent>
					</Card>

					{/* B. Outcome & Notes */}
					<Card>
						<CardContent className="space-y-3 p-4">
							<h3 className="font-semibold">B. Outcome & Notes</h3>
							<Select value={outcome} onValueChange={(v: any) => setOutcome(v)}>
								<SelectTrigger className="w-full"><SelectValue placeholder="Outcome" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="successful">Successful</SelectItem>
									<SelectItem value="partial">Partial</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
									<SelectItem value="complication">Complication</SelectItem>
								</SelectContent>
							</Select>
							<Textarea placeholder="Clinical notes" value={notes} onChange={e => setNotes(e.target.value)} />
							<div className="grid grid-cols-3 gap-2">
								<Input type="number" min={0} max={10} placeholder="Pain 0-10" value={painScore ?? ''} onChange={e => setPainScore(e.target.value ? parseInt(e.target.value) : undefined)} />
								<Select value={anesthesiaUsed ? 'yes' : 'no'} onValueChange={v => setAnesthesiaUsed(v === 'yes')}>
									<SelectTrigger><SelectValue placeholder="Anesthesia" /></SelectTrigger>
									<SelectContent>
										<SelectItem value="no">No anesthesia</SelectItem>
										<SelectItem value="yes">Anesthesia used</SelectItem>
									</SelectContent>
								</Select>
								<Input placeholder="Dose" disabled={!anesthesiaUsed} value={anesthesiaDose} onChange={e => setAnesthesiaDose(e.target.value)} />
							</div>
						</CardContent>
					</Card>

					{/* C. Add to Treatment Plan */}
					<Card>
						<CardContent className="space-y-3 p-4">
							<h3 className="font-semibold">C. Add to Treatment Plan</h3>
							<Select value={createPlan ? 'new' : 'none'} onValueChange={v => setCreatePlan(v === 'new')}>
								<SelectTrigger><SelectValue placeholder="Plan action" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="none">No new plan items</SelectItem>
									<SelectItem value="new">Create new plan item</SelectItem>
								</SelectContent>
							</Select>
							{createPlan && (
								<div className="grid grid-cols-2 gap-2">
									<Input placeholder="Title" value={planTitle} onChange={e => setPlanTitle(e.target.value)} />
									<Input placeholder="Stage" value={planStage} onChange={e => setPlanStage(e.target.value)} />
									<Input type="number" placeholder="Est. cost" value={planEstimatedCost ?? ''} onChange={e => setPlanEstimatedCost(e.target.value ? parseFloat(e.target.value) : undefined)} />
									<Input placeholder="Est. duration" value={planEstimatedDuration} onChange={e => setPlanEstimatedDuration(e.target.value)} />
									<Select value={planDiscussed ? 'yes' : 'no'} onValueChange={v => setPlanDiscussed(v === 'yes')}>
										<SelectTrigger><SelectValue placeholder="Discussed" /></SelectTrigger>
										<SelectContent>
											<SelectItem value="no">Not discussed</SelectItem>
											<SelectItem value="yes">Discussed with patient</SelectItem>
										</SelectContent>
									</Select>
								</div>
							)}
						</CardContent>
					</Card>

					{/* D. Prescriptions */}
					<Card>
						<CardContent className="space-y-3 p-4">
							<h3 className="font-semibold">D. Prescriptions</h3>
							<Input placeholder="Medicine" value={rxMedName} onChange={e => setRxMedName(e.target.value)} />
							<div className="grid grid-cols-2 gap-2">
								<Input placeholder="Dose" value={rxDosage} onChange={e => setRxDosage(e.target.value)} />
								<Input placeholder="Route" value={rxRoute} onChange={e => setRxRoute(e.target.value)} />
								<Input placeholder="Frequency" value={rxFrequency} onChange={e => setRxFrequency(e.target.value)} />
								<Input placeholder="Duration (days)" type="number" value={rxDuration} onChange={e => setRxDuration(e.target.value)} />
							</div>
						</CardContent>
					</Card>

					{/* E. Payment & Invoice */}
					<Card>
						<CardContent className="space-y-3 p-4">
							<h3 className="font-semibold">E. Payment & Invoice</h3>
							<div className="text-sm space-y-1">
								<div>Total due now (patient): €{totals.patient.toFixed(2)}</div>
								<div>Mutuality share: €{totals.mutuality.toFixed(2)}</div>
								<div>VAT: €{totals.vat.toFixed(2)}</div>
							</div>
							<div className="text-xs border rounded p-2">
								<div className="font-medium mb-1">Invoice preview</div>
								{treatments.length === 0 ? (
									<div className="text-muted-foreground">No line items</div>
								) : (
									<div className="space-y-1">
										{treatments.map((t, i) => (
											<div key={i} className="flex justify-between text-xs">
												<span>{t.code} x{t.quantity}</span>
												<span>Tariff €{(t.tariff * t.quantity).toFixed(2)} | Mutuality €{(t.mutuality_share * t.quantity).toFixed(2)} | Patient €{(t.patient_share * t.quantity).toFixed(2)}</span>
											</div>
										))}
									</div>
								)}
							</div>
							<div className="flex gap-2">
								<Button variant="outline" onClick={() => saveAll(false)} disabled={loading}>Save & Close</Button>
								<Button onClick={() => { setStartPayment(true); saveAll(true); }} disabled={loading}>Charge via Stripe</Button>
								<Button variant="secondary" onClick={sendPaymentLink} disabled={loading}>Send payment link</Button>
								<Button variant="ghost" onClick={markAsPaid} disabled={loading}>Mark as paid</Button>
							</div>
						</CardContent>
					</Card>

					{/* F. Follow-Up */}
					<Card>
						<CardContent className="space-y-3 p-4">
							<h3 className="font-semibold">F. Follow-Up</h3>
							<Select value={followUpNeeded ? 'yes' : 'no'} onValueChange={v => setFollowUpNeeded(v === 'yes')}>
								<SelectTrigger><SelectValue placeholder="Follow-up needed" /></SelectTrigger>
								<SelectContent>
									<SelectItem value="no">No</SelectItem>
									<SelectItem value="yes">Yes</SelectItem>
								</SelectContent>
							</Select>
							{followUpNeeded && (
								<div className="grid grid-cols-3 gap-2 items-end">
									<Input type="date" value={followUpDate || ''} onChange={e => setFollowUpDate(e.target.value)} />
									<Button variant="outline" onClick={() => setFollowUpDate(new Date(Date.now() + 7*24*60*60*1000).toISOString().slice(0,10))}>1w</Button>
									<Button variant="outline" onClick={() => setFollowUpDate(new Date(Date.now() + 14*24*60*60*1000).toISOString().slice(0,10))}>2w</Button>
									<Button variant="outline" onClick={() => setFollowUpDate(new Date(Date.now() + 42*24*60*60*1000).toISOString().slice(0,10))}>6w</Button>
									<Input placeholder="Reason" value={followUpReason} onChange={e => setFollowUpReason(e.target.value)} />
								</div>
							)}
							{followUpNeeded && followUpDate && (
								<Button onClick={async () => {
									await sb.from('appointment_follow_ups').insert({ appointment_id: appointment.id, follow_up_type: 'in_person', status: 'pending', scheduled_date: new Date(followUpDate).toISOString(), notes: followUpReason });
									toast({ title: 'Follow-up created' });
								}}>Create Follow-Up</Button>
							)}
						</CardContent>
					</Card>

					{/* G. Files / X-rays */}
					<Card>
						<CardContent className="space-y-3 p-4">
							<h3 className="font-semibold">G. Files / X-rays</h3>
							<QuickPhotoUpload onPhotoUploaded={(url) => setUploadedFiles(prev => [...prev, url])} onCancel={() => {}} />
							<Input placeholder="Paste secure file URL" onKeyDown={e => {
								if (e.key === 'Enter') {
									const target = e.target as HTMLInputElement;
									if (target.value) {
										setUploadedFiles(prev => [...prev, target.value]);
										target.value = '';
									}
								}
							}} />
							<div className="grid grid-cols-3 gap-2">
								{uploadedFiles.map((u, i) => (
									<a key={i} href={u} target="_blank" rel="noreferrer" className="text-xs underline break-all">{u}</a>
								))}
							</div>
						</CardContent>
					</Card>

					<Separator />
					<div className="sticky bottom-0 bg-background p-3 flex gap-2">
						<Button className="flex-1" onClick={() => saveAll(false)} disabled={loading}>Save & Close</Button>
						<Button className="flex-1" variant="secondary" onClick={() => { setStartPayment(true); saveAll(true); }} disabled={loading}>Save & Start Payment</Button>
						<Button className="flex-1" variant="ghost" onClick={() => onOpenChange(false)} disabled={loading}>Discard Changes</Button>
					</div>
				</div>
			</DrawerContent>
		</Drawer>
	);
}