import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { QuickPhotoUpload } from "@/components/QuickPhotoUpload";
import { Calendar, CheckCircle, CreditCard, FileImage, Pill, Plus, Save, Stethoscope, Upload, X } from "lucide-react";
import { NotificationTriggers } from "@/lib/notificationTriggers";

interface AppointmentCompletionModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	appointmentId: string;
	patientId: string;
	dentistId: string;
	serviceDateISO: string; // appointment_date
	onCompleted: () => void;
}

interface PerformedTreatmentItem {
	nihdi_code: string;
	description: string;
	quantity: number;
	tooth_ref?: string;
	tariff: number;
	mutuality_share: number;
	patient_share: number;
}

interface MutualityProfile {
	id: string;
	mutuality_code: string;
	mutuality_name: string | null;
	coverage_percentage: number;
	tier_payant: boolean | null;
	omnio_vip_status: 'none' | 'omnio' | 'vip';
	valid_from: string;
	valid_to: string | null;
}

interface NihdiTreatmentRef {
	code: string;
	description: string;
	base_tariff: number;
	vat_rate: number;
	valid_from: string;
	valid_to: string | null;
}

export function AppointmentCompletionModal({ open, onOpenChange, appointmentId, patientId, dentistId, serviceDateISO, onCompleted }: AppointmentCompletionModalProps) {
	// A. Performed Treatments
	const [treatmentSearch, setTreatmentSearch] = useState("");
	const [nihdiOptions, setNihdiOptions] = useState<NihdiTreatmentRef[]>([]);
	const [performedTreatments, setPerformedTreatments] = useState<PerformedTreatmentItem[]>([]);
	const [mutualityProfile, setMutualityProfile] = useState<MutualityProfile | null>(null);

	// B. Outcome & Notes
	const [outcome, setOutcome] = useState<'successful'|'partial'|'cancelled'|'complication'>('successful');
	const [notes, setNotes] = useState("");
	const [painScore, setPainScore] = useState<number | undefined>(undefined);
	const [anesthesiaUsed, setAnesthesiaUsed] = useState(false);
	const [anesthesiaDose, setAnesthesiaDose] = useState("");

	// C. Add to Treatment Plan
	const [newPlanTitle, setNewPlanTitle] = useState("");
	const [newPlanStage, setNewPlanStage] = useState("");
	const [newPlanEstCost, setNewPlanEstCost] = useState<string>("");
	const [newPlanEstDuration, setNewPlanEstDuration] = useState<string>("");
	const [newPlanDiscussed, setNewPlanDiscussed] = useState(false);

	// D. Prescriptions
	const [rxMed, setRxMed] = useState("");
	const [rxDose, setRxDose] = useState("");
	const [rxRoute, setRxRoute] = useState("");
	const [rxFreq, setRxFreq] = useState("");
	const [rxDuration, setRxDuration] = useState("");
	const [rxRepeats, setRxRepeats] = useState<string>("0");
	const [rxSubstitution, setRxSubstitution] = useState(false);

	// E. Payment & Invoice
	const totalPatientDue = useMemo(() => performedTreatments.reduce((sum, t) => sum + (t.patient_share || 0), 0), [performedTreatments]);
	const [startingPayment, setStartingPayment] = useState(false);

	// F. Follow-Up
	const [followUpNeeded, setFollowUpNeeded] = useState(false);
	const [followUpDate, setFollowUpDate] = useState<string>("");
	const [followUpReason, setFollowUpReason] = useState("");

	// G. Files / X-rays
	const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
	const [showQuickUpload, setShowQuickUpload] = useState(false);

	// Load mutuality profile and NIHDI options
	useEffect(() => {
		if (!open) return;
		(async () => {
			// Load valid mutuality profile at service date
			const { data: profiles } = await supabase
				.from('patient_mutuality_profiles')
				.select('*')
				.eq('patient_id', patientId);
			const serviceDate = new Date(serviceDateISO);
			const active = (profiles || []).find(p => {
				const from = new Date(p.valid_from);
				const to = p.valid_to ? new Date(p.valid_to) : null;
				return serviceDate >= from && (!to || serviceDate <= to);
			});
			setMutualityProfile(active || null);

			// Prefetch NIHDI treatments
			const { data: nihdi } = await supabase
				.from('nihdi_treatments')
				.select('*')
				.order('code', { ascending: true })
				.limit(500);
			setNihdiOptions(nihdi || []);
		})();
	}, [open, patientId, serviceDateISO]);

	const calculateShares = (baseTariff: number) => {
		const coverage = mutualityProfile?.coverage_percentage ?? 0;
		const mutuality = +(baseTariff * (coverage / 100)).toFixed(2);
		const patient = +(baseTariff - mutuality).toFixed(2);
		return { mutuality, patient };
	};

	const addTreatmentByCode = (code: string) => {
		const ref = nihdiOptions.find(r => r.code === code);
		if (!ref) return;
		const { mutuality, patient } = calculateShares(ref.base_tariff);
		setPerformedTreatments(prev => [
			...prev,
			{
				nihdi_code: ref.code,
				description: ref.description,
				quantity: 1,
				tariff: ref.base_tariff,
				mutuality_share: mutuality,
				patient_share: patient,
			}
		]);
	};

	const updateTreatment = (index: number, updates: Partial<PerformedTreatmentItem>) => {
		setPerformedTreatments(prev => prev.map((t, i) => i === index ? { ...t, ...updates } : t));
	};

	const removeTreatment = (index: number) => {
		setPerformedTreatments(prev => prev.filter((_, i) => i !== index));
	};

	const saveAll = async (startPaymentAfterSave: boolean) => {
		// Prevent double-completion
		const { data: appt } = await supabase
			.from('appointments')
			.select('status')
			.eq('id', appointmentId)
			.single();
		if (appt?.status === 'completed') {
			onOpenChange(false);
			return;
		}

		// Get dentist profile id for created_by
		const { data: dentistRow } = await supabase
			.from('dentists')
			.select('profile_id')
			.eq('id', dentistId)
			.single();
		const createdBy = dentistRow?.profile_id;

		// Upsert outcome
		await supabase.from('appointment_outcomes').insert({
			appointment_id: appointmentId,
			outcome,
			notes,
			pain_score: typeof painScore === 'number' ? painScore : null,
			anesthesia_used: anesthesiaUsed,
			anesthesia_dose: anesthesiaUsed ? anesthesiaDose : null,
			created_by: createdBy,
		});

		// Insert performed treatments
		if (performedTreatments.length > 0) {
			const rows = performedTreatments.map(t => ({
				appointment_id: appointmentId,
				nihdi_code: t.nihdi_code,
				description: t.description,
				quantity: t.quantity,
				tariff: t.tariff,
				mutuality_share: t.mutuality_share,
				patient_share: t.patient_share,
				tooth_ref: t.tooth_ref || null,
			}));
			await supabase.from('appointment_treatments').insert(rows);
		}

		// Create new treatment plan item if provided
		if (newPlanTitle.trim()) {
			await supabase.from('treatment_plans').insert({
				patient_id: patientId,
				dentist_id: dentistId,
				title: newPlanTitle.trim(),
				description: newPlanStage ? `Stage: ${newPlanStage}` : null,
				estimated_cost: newPlanEstCost ? Number(newPlanEstCost) : null,
				estimated_duration: newPlanEstDuration || null,
				status: 'draft',
				appointment_id: appointmentId,
				notes: newPlanDiscussed ? 'Discussed with patient' : null,
			});
		}

		// Create prescription if provided
		if (rxMed.trim()) {
			const { data: insertedRx, error: rxErr } = await supabase.from('prescriptions').insert({
				patient_id: patientId,
				dentist_id: dentistId,
				medication_name: rxMed.trim(),
				dosage: rxDose || '',
				frequency: rxFreq || '',
				duration_days: rxDuration ? Number(rxDuration) : null,
				instructions: rxRoute ? `Route: ${rxRoute}${rxSubstitution ? ' | substitution allowed' : ''}` : (rxSubstitution ? 'substitution allowed' : null),
				status: 'active',
				appointment_id: appointmentId,
			}).select('id').single();
			if (!rxErr && insertedRx?.id) {
				await NotificationTriggers.onPrescriptionCreated(insertedRx.id);
			}
		}

		// Create follow-up task/appointment
		if (followUpNeeded && followUpDate) {
			await supabase.from('appointment_follow_ups').insert({
				appointment_id: appointmentId,
				follow_up_type: 'in_person',
				status: 'pending',
				scheduled_date: new Date(followUpDate).toISOString(),
				notes: followUpReason || null,
			});
		}

		// Save uploaded files as medical_records with appointment tag
		for (const url of uploadedFiles) {
			await supabase.from('medical_records').insert({
				patient_id: patientId,
				dentist_id: dentistId,
				record_type: 'xray',
				title: 'Appointment file',
				description: 'Uploaded during appointment completion',
				file_url: url,
				record_date: new Date(serviceDateISO).toISOString(),
				appointment_id: appointmentId,
			});
		}

		// Mark appointment as completed
		await supabase.from('appointments').update({ status: 'completed', completed_at: new Date().toISOString(), completed_by: createdBy }).eq('id', appointmentId);

		// Post-save tasks: unpaid reminder if due > 0
		if (totalPatientDue > 0) {
			await supabase.from('dentist_tasks').insert({
				dentist_id: dentistId,
				title: 'Payment reminder',
				description: `Follow-up on unpaid patient share for appointment ${appointmentId}`,
				status: 'open',
				priority: 'medium',
				due_date: new Date(Date.now() + 24*60*60*1000).toISOString(),
				patient_id: patientId,
				appointment_id: appointmentId,
			});
		}

		if (startPaymentAfterSave && totalPatientDue > 0) {
			setStartingPayment(true);
			const { data: patientProfile } = await supabase
				.from('profiles')
				.select('email, first_name, last_name, user_id')
				.eq('id', patientId)
				.single();
			const { data, error } = await supabase.functions.invoke('create-payment-request', {
				body: {
					patient_id: patientId,
					dentist_id: dentistId,
					amount: Math.round(totalPatientDue * 100),
					description: `Patient share for appointment ${appointmentId}`,
					patient_email: patientProfile?.email,
					patient_name: `${patientProfile?.first_name || ''} ${patientProfile?.last_name || ''}`,
				}
			});
			// Notify patient with payment link if available
			if (data?.payment_url && patientProfile?.user_id) {
				await supabase.from('notifications').insert({
					user_id: patientProfile.user_id,
					patient_id: patientId,
					dentist_id: dentistId,
					type: 'payment',
					title: 'Payment Request',
					message: `You have a payment request of €${totalPatientDue.toFixed(2)}`,
					priority: 'high',
					action_url: data.payment_url,
					action_label: 'Pay Now',
					metadata: { appointment_id: appointmentId, amount: totalPatientDue }
				});
			}
			setStartingPayment(false);
		} else if (!startPaymentAfterSave && totalPatientDue > 0) {
			// If marked as paid manually, create a paid payment_request record
			const { data: patientProfile } = await supabase
				.from('profiles')
				.select('email')
				.eq('id', patientId)
				.single();
			await supabase.from('payment_requests').insert({
				patient_id: patientId,
				dentist_id: dentistId,
				amount: Math.round(totalPatientDue * 100),
				description: `Manual payment for appointment ${appointmentId}`,
				patient_email: patientProfile?.email || '',
				status: 'paid',
				paid_at: new Date().toISOString(),
				appointment_id: appointmentId,
			});
		}

		onCompleted();
		onOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-0 sm:max-w-lg w-full h-[95vh] sm:h-auto sm:rounded-xl overflow-hidden">
				<div className="flex flex-col h-full">
					{/* Header */}
					<div className="p-4 border-b sticky top-0 bg-background z-10">
						<div className="flex items-center justify-between">
							<h3 className="font-semibold text-lg">Complete Appointment</h3>
							<Badge variant="outline">{new Date(serviceDateISO).toLocaleDateString()}</Badge>
						</div>
					</div>

					<div className="flex-1 overflow-y-auto p-4 space-y-4">
						{/* A. Performed Treatments */}
						<section className="space-y-2">
							<h4 className="font-medium flex items-center gap-2"><Stethoscope className="h-4 w-4"/>Performed Treatments</h4>
							<div className="flex gap-2">
								<Input placeholder="Search by name or NIHDI code" value={treatmentSearch} onChange={(e) => setTreatmentSearch(e.target.value)} />
								<Select onValueChange={addTreatmentByCode}>
									<SelectTrigger className="w-32"><SelectValue placeholder="Add" /></SelectTrigger>
									<SelectContent>
										{nihdiOptions.filter(o => o.code.includes(treatmentSearch) || o.description.toLowerCase().includes(treatmentSearch.toLowerCase())).slice(0,50).map(o => (
											<SelectItem key={o.code} value={o.code}>{o.code} – {o.description}</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className="space-y-2">
								{performedTreatments.map((t, i) => (
									<div key={i} className="p-2 border rounded-md flex items-center gap-2">
										<Badge variant="outline" className="shrink-0">{t.nihdi_code}</Badge>
										<div className="flex-1">
											<div className="text-sm font-medium line-clamp-1">{t.description}</div>
											<div className="flex gap-2 mt-1">
												<Input type="number" value={t.quantity} min={1} onChange={(e) => updateTreatment(i, { quantity: Number(e.target.value) })} className="w-20" />
												<Input placeholder="Tooth/quadrant" value={t.tooth_ref || ''} onChange={(e) => updateTreatment(i, { tooth_ref: e.target.value })} className="w-36" />
											</div>
										</div>
										<div className="text-right text-sm">
											<div>Tariff €{t.tariff.toFixed(2)}</div>
											<div>Mutuality €{t.mutuality_share.toFixed(2)}</div>
											<div className="font-semibold">Patient €{(t.patient_share * t.quantity).toFixed(2)}</div>
										</div>
										<Button variant="ghost" size="sm" className="text-red-600" onClick={() => removeTreatment(i)}><X className="h-4 w-4"/></Button>
									</div>
								))}
							</div>
							<div className="flex justify-end gap-6 pt-1 text-sm">
								<div>Total tariff: €{performedTreatments.reduce((s,t)=>s+t.tariff*t.quantity,0).toFixed(2)}</div>
								<div>Mutuality: €{performedTreatments.reduce((s,t)=>s+t.mutuality_share*t.quantity,0).toFixed(2)}</div>
								<div className="font-semibold">Patient: €{performedTreatments.reduce((s,t)=>s+t.patient_share*t.quantity,0).toFixed(2)}</div>
							</div>
							{!mutualityProfile && (
								<div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 p-2 rounded">No active mutuality profile on service date. Add one in patient profile.</div>
							)}
						</section>

						{/* B. Outcome & Notes */}
						<section className="space-y-2">
							<h4 className="font-medium">Outcome & Notes</h4>
							<Select value={outcome} onValueChange={(v: any) => setOutcome(v)}>
								<SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
								<SelectContent>
									<SelectItem value="successful">Successful</SelectItem>
									<SelectItem value="partial">Partial</SelectItem>
									<SelectItem value="cancelled">Cancelled</SelectItem>
									<SelectItem value="complication">Complication</SelectItem>
								</SelectContent>
							</Select>
							<Textarea placeholder="Clinical notes" value={notes} onChange={(e)=>setNotes(e.target.value)} />
							<div className="flex gap-2 items-center">
								<Input type="number" min={0} max={10} placeholder="Pain 0–10" value={typeof painScore==='number'?painScore:''} onChange={(e)=>setPainScore(e.target.value === '' ? undefined : Number(e.target.value))} className="w-28" />
								<label className="flex items-center gap-2 text-sm">
									<input type="checkbox" checked={anesthesiaUsed} onChange={(e)=>setAnesthesiaUsed(e.target.checked)} />
									<span>Anesthesia used</span>
								</label>
								{anesthesiaUsed && (
									<Input placeholder="Dose" value={anesthesiaDose} onChange={(e)=>setAnesthesiaDose(e.target.value)} className="w-40" />
								)}
							</div>
						</section>

						{/* C. Add to Treatment Plan */}
						<section className="space-y-2">
							<h4 className="font-medium">Add to Treatment Plan</h4>
							<div className="grid grid-cols-2 gap-2">
								<Input placeholder="Title" value={newPlanTitle} onChange={(e)=>setNewPlanTitle(e.target.value)} />
								<Input placeholder="Stage" value={newPlanStage} onChange={(e)=>setNewPlanStage(e.target.value)} />
								<Input placeholder="Estimated cost" type="number" value={newPlanEstCost} onChange={(e)=>setNewPlanEstCost(e.target.value)} />
								<Input placeholder="Estimated duration" value={newPlanEstDuration} onChange={(e)=>setNewPlanEstDuration(e.target.value)} />
							</div>
							<label className="flex items-center gap-2 text-sm">
								<input type="checkbox" checked={newPlanDiscussed} onChange={(e)=>setNewPlanDiscussed(e.target.checked)} />
								<span>Discussed with patient</span>
							</label>
						</section>

						{/* D. Prescriptions */}
						<section className="space-y-2">
							<h4 className="font-medium flex items-center gap-2"><Pill className="h-4 w-4"/>Prescriptions</h4>
							<div className="grid grid-cols-2 gap-2">
								<Input placeholder="Medicine" value={rxMed} onChange={(e)=>setRxMed(e.target.value)} />
								<Input placeholder="Dose" value={rxDose} onChange={(e)=>setRxDose(e.target.value)} />
								<Input placeholder="Route" value={rxRoute} onChange={(e)=>setRxRoute(e.target.value)} />
								<Input placeholder="Frequency" value={rxFreq} onChange={(e)=>setRxFreq(e.target.value)} />
								<Input placeholder="Duration (days)" type="number" value={rxDuration} onChange={(e)=>setRxDuration(e.target.value)} />
								<label className="flex items-center gap-2 text-sm">
									<input type="checkbox" checked={rxSubstitution} onChange={(e)=>setRxSubstitution(e.target.checked)} />
									<span>Allow substitution</span>
								</label>
							</div>
						</section>

						{/* E. Payment & Invoice */}
						<section className="space-y-2">
							<h4 className="font-medium">Payment & Invoice</h4>
							<div className="text-sm">Total due now: <span className="font-semibold">€{totalPatientDue.toFixed(2)}</span></div>
							<div className="flex gap-2">
								<Button variant="outline" onClick={() => saveAll(true)} disabled={startingPayment || totalPatientDue <= 0}>
									<CreditCard className="h-4 w-4 mr-1"/> Save & Start Payment
								</Button>
								<Button variant="outline" onClick={() => saveAll(false)}>
									<CheckCircle className="h-4 w-4 mr-1"/> Mark as paid (manual)
								</Button>
							</div>
							<div className="text-xs text-muted-foreground">Invoice preview will show line items with mutuality vs patient split.</div>
						</section>

						{/* F. Follow-Up */}
						<section className="space-y-2">
							<h4 className="font-medium">Follow-Up</h4>
							<label className="flex items-center gap-2 text-sm">
								<input type="checkbox" checked={followUpNeeded} onChange={(e)=>setFollowUpNeeded(e.target.checked)} />
								<span>Follow-up needed</span>
							</label>
							{followUpNeeded && (
								<div className="flex gap-2 items-center">
									<Input type="date" value={followUpDate} onChange={(e)=>setFollowUpDate(e.target.value)} />
									<Button size="sm" variant="outline" onClick={()=>setFollowUpDate(new Date(Date.now()+7*86400000).toISOString().slice(0,10))}>1w</Button>
									<Button size="sm" variant="outline" onClick={()=>setFollowUpDate(new Date(Date.now()+14*86400000).toISOString().slice(0,10))}>2w</Button>
									<Button size="sm" variant="outline" onClick={()=>setFollowUpDate(new Date(Date.now()+42*86400000).toISOString().slice(0,10))}>6w</Button>
									<Input placeholder="Reason" value={followUpReason} onChange={(e)=>setFollowUpReason(e.target.value)} />
								</div>
							)}
						</section>

						{/* G. Files / X-rays */}
						<section className="space-y-2">
							<h4 className="font-medium flex items-center gap-2"><FileImage className="h-4 w-4"/>Files / X-rays</h4>
							<div className="flex gap-2">
								<Button variant="outline" onClick={()=>setShowQuickUpload(true)}><Upload className="h-4 w-4 mr-1"/>Add file</Button>
							</div>
							<div className="grid grid-cols-3 gap-2">
								{uploadedFiles.map((url, idx) => (
									<div key={idx} className="relative">
										<img src={url} className="w-full h-20 object-cover rounded border" />
									</div>
								))}
							</div>
							{showQuickUpload && (
								<div className="border rounded p-2">
									<QuickPhotoUpload onPhotoUploaded={(url)=>{ setUploadedFiles(prev=>[...prev, url]); setShowQuickUpload(false); }} onCancel={()=>setShowQuickUpload(false)} />
								</div>
							)}
						</section>
					</div>

					{/* Footer */}
					<div className="p-4 border-t sticky bottom-0 bg-background z-10 flex gap-2">
						<Button className="flex-1" onClick={() => saveAll(false)}>
							<Save className="h-4 w-4 mr-1"/> Save & Close
						</Button>
						<Button variant="outline" className="flex-1" onClick={() => saveAll(true)} disabled={startingPayment || totalPatientDue <= 0}>
							<CreditCard className="h-4 w-4 mr-1"/> Save & Start Payment
						</Button>
						<Button variant="ghost" className="flex-1" onClick={() => onOpenChange(false)}>
							<X className="h-4 w-4 mr-1"/> Discard Changes
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}