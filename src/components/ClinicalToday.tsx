import { useCallback, useEffect, useMemo, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { AppointmentCompletionModal } from "@/components/mobile/AppointmentCompletionModal";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Calendar, CheckCircle2, Clock, Filter, ListChecks, Plus, RefreshCw, RotateCcw, User as UserIcon, XCircle, ChevronLeft } from "lucide-react";

interface ClinicalTodayProps {
	user: User;
	dentistId: string;
	onOpenPatientsTab?: () => void;
}

interface AppointmentItem {
	id: string;
	patient_id: string;
	dentist_id: string;
	appointment_date: string;
	duration_minutes: number | null;
	status: 'confirmed' | 'pending' | 'cancelled' | 'completed' | string;
	reason?: string | null;
	patient?: { id: string; first_name: string; last_name: string; date_of_birth?: string | null; allergies?: string | null } | null;
}

export function ClinicalToday({ user, dentistId, onOpenPatientsTab }: ClinicalTodayProps) {
	const [appointments, setAppointments] = useState<AppointmentItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [selectedStatus, setSelectedStatus] = useState<string>(() => localStorage.getItem('clinicalStatusFilter') || 'all');
	const [selectedAppointment, setSelectedAppointment] = useState<AppointmentItem | null>(null);
	const [showCompletion, setShowCompletion] = useState(false);
	const [showBooking, setShowBooking] = useState(false);
	const [showFollowUps, setShowFollowUps] = useState(false);
	const [followUps, setFollowUps] = useState<any[]>([]);
	const [rescheduleTarget, setRescheduleTarget] = useState<AppointmentItem | null>(null);
	const [rescheduleDate, setRescheduleDate] = useState<string>("");
	const [dentistName, setDentistName] = useState<string>("Dentist");

	// Date selector (default today)
	const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().slice(0,10));
	const selectedDateObj = useMemo(() => {
		try {
			const [y, m, d] = selectedDate.split('-').map(Number);
			return new Date(y, (m || 1) - 1, d || 1);
		} catch { return new Date(); }
	}, [selectedDate]);
	const startOfDay = useMemo(() => new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate()), [selectedDateObj]);
	const endOfDay = useMemo(() => new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth(), selectedDateObj.getDate() + 1), [selectedDateObj]);

	// Quick booking state (for dentists)
	const [quickPatients, setQuickPatients] = useState<Array<{ id: string; first_name: string; last_name: string; email?: string }>>([]);
	const [quickPatientId, setQuickPatientId] = useState<string>("");
	const [quickDate, setQuickDate] = useState<string>(() => new Date().toISOString().slice(0,10));
	const [quickTime, setQuickTime] = useState<string>(() => new Date().toTimeString().slice(0,5));
	const [quickReason, setQuickReason] = useState<string>("");
	const [quickUrgency, setQuickUrgency] = useState<'low' | 'medium' | 'high'>('medium');

	const openQuickBooking = (prefill?: { reason?: string; setNow?: boolean }) => {
		setQuickReason(prefill?.reason || "");
		setQuickDate(selectedDate);
		if (prefill?.setNow) {
			const now = new Date();
			const hh = String(now.getHours()).padStart(2, '0');
			const mm = String(now.getMinutes()).padStart(2, '0');
			setQuickTime(`${hh}:${mm}`);
		}
		setShowBooking(true);
	};

	const loadQuickPatients = useCallback(async () => {
		try {
			const { data, error } = await supabase
				.from('appointments')
				.select(`patient_id, profiles:patient_id ( id, first_name, last_name, email )`)
				.eq('dentist_id', dentistId);
			if (error) throw error;
			const unique: Record<string, any> = {};
			(data || []).forEach((row: any) => {
				const p = row.profiles;
				if (p && !unique[p.id]) unique[p.id] = p;
			});
			setQuickPatients(Object.values(unique));
		} catch (e) {
			console.error('Failed to load patients for booking', e);
		}
	}, [dentistId]);

	useEffect(() => {
		if (showBooking) {
			loadQuickPatients();
		}
	}, [showBooking, loadQuickPatients]);

	const today = useMemo(() => new Date(), []);

	const loadDentistName = useCallback(async () => {
		try {
			const { data } = await supabase
				.from('dentists')
				.select('profiles(first_name, last_name)')
				.eq('id', dentistId)
				.single();
			const first = (data as any)?.profiles?.first_name || 'Dr.';
			const last = (data as any)?.profiles?.last_name || 'Dentist';
			setDentistName(`Dr. ${first} ${last}`);
		} catch {}
	}, [dentistId]);

	const fetchAppointments = useCallback(async () => {
		try {
			setLoading(true);
			const { data, error } = await supabase
				.from('appointments')
				.select(`
					id, 
					patient_id, 
					dentist_id, 
					appointment_date, 
					duration_minutes, 
					status, 
					reason,
					profiles!appointments_patient_id_fkey (
						id,
						first_name,
						last_name,
						date_of_birth
					)
				`)
				.eq('dentist_id', dentistId)
				.gte('appointment_date', startOfDay.toISOString())
				.lt('appointment_date', endOfDay.toISOString())
				.order('appointment_date', { ascending: true });
			
			if (error) {
				console.error('Error fetching appointments:', error);
				throw error;
			}
			
			const mapped = (data || []).map((row: any) => ({
				id: row.id,
				patient_id: row.patient_id,
				dentist_id: row.dentist_id,
				appointment_date: row.appointment_date,
				duration_minutes: row.duration_minutes ?? null,
				status: row.status,
				reason: row.reason,
				patient: row.profiles ? { 
					id: row.profiles.id, 
					first_name: row.profiles.first_name, 
					last_name: row.profiles.last_name, 
					date_of_birth: row.profiles.date_of_birth,
					allergies: null // Set to null since it's not in the profiles table
				} : null
			})) as AppointmentItem[];
			setAppointments(mapped);
		} catch (e) {
			console.error('Failed to fetch appointments', e);
		} finally {
			setLoading(false);
		}
	}, [dentistId, startOfDay, endOfDay]);

	useEffect(() => {
		loadDentistName();
		fetchAppointments();
		const channel = supabase.channel(`appointments-dentist-${dentistId}`)
			.on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `dentist_id=eq.${dentistId}` }, () => {
				fetchAppointments();
			})
			.subscribe();
		return () => {
			supabase.removeChannel(channel);
		};
	}, [dentistId, fetchAppointments, loadDentistName]);

	useEffect(() => {
		localStorage.setItem('clinicalStatusFilter', selectedStatus);
	}, [selectedStatus]);

	const counters = useMemo(() => {
		const all = appointments.length;
		const confirmed = appointments.filter(a => a.status === 'confirmed').length;
		const pending = appointments.filter(a => a.status === 'pending' || a.status === 'scheduled').length;
		const cancelled = appointments.filter(a => a.status === 'cancelled').length;
		const completed = appointments.filter(a => a.status === 'completed').length;
		return { all, confirmed, pending, cancelled, completed };
	}, [appointments]);

	const filteredAppointments = useMemo(() => {
		if (selectedStatus === 'all') return appointments;
		return appointments.filter(a => a.status === selectedStatus);
	}, [appointments, selectedStatus]);

	const lastEndedAppointment = useMemo(() => {
		const now = new Date();
		const threshold = new Date(now.getTime() - 24*60*60*1000);
		const candidates = appointments
			.map(a => ({ a, end: new Date(new Date(a.appointment_date).getTime() + ((a.duration_minutes || 30) * 60 * 1000)) }))
			.filter(({ a, end }) => end < now && end > threshold && a.status !== 'completed')
			.sort((x, y) => y.end.getTime() - x.end.getTime());
		return candidates[0]?.a || null;
	}, [appointments]);

	const openPatientProfile = (patientId: string) => {
		sessionStorage.setItem('requestedPatientId', patientId);
		onOpenPatientsTab?.();
	};

	const openCompletion = (apt: AppointmentItem) => {
		setSelectedAppointment(apt);
		setShowCompletion(true);
	};

	const handleCancel = async (apt: AppointmentItem) => {
		try {
			await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', apt.id);
			fetchAppointments();
		} catch (e) { console.error(e); }
	};

	const openReschedule = (apt: AppointmentItem) => {
		setRescheduleTarget(apt);
		setRescheduleDate(new Date(apt.appointment_date).toISOString().slice(0,16));
	};

	const applyReschedule = async () => {
		if (!rescheduleTarget || !rescheduleDate) return;
		try {
			await supabase.from('appointments').update({ appointment_date: new Date(rescheduleDate).toISOString() }).eq('id', rescheduleTarget.id);
			setRescheduleTarget(null);
			setRescheduleDate("");
			fetchAppointments();
		} catch (e) { console.error(e); }
	};

	const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
	const formatDateLong = (d: Date) => d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

	const handleQuickBook = async () => {
		try {
			if (!quickPatientId || !quickDate || !quickTime) return;
			const whenIso = new Date(`${quickDate}T${quickTime}`).toISOString();
			await supabase.rpc('create_simple_appointment', {
				p_patient_id: quickPatientId,
				p_dentist_id: dentistId,
				p_appointment_date: whenIso,
				p_reason: quickReason || 'Consultation',
				p_urgency: quickUrgency
			});
			setShowBooking(false);
			setQuickPatientId("");
			fetchAppointments();
		} catch (e) {
			console.error('Failed to book appointment', e);
		}
	};

	return (
		<div className="relative">
			{/* Sticky Header */}
			<div className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
				<div className="px-4 pt-4 pb-3">
					<h1 className="text-2xl font-bold">Clinical</h1>
					<p className="text-sm text-muted-foreground mt-1">{formatDateLong(selectedDateObj)}</p>
					<div className="mt-3">
						<Input 
							type="date" 
							value={selectedDate} 
							onChange={e => setSelectedDate(e.target.value)} 
							className="w-full sm:w-auto h-12 text-base px-4"
						/>
					</div>
					
					{/* Status Filter Buttons - Improved grid layout */}
					<div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
						<Button 
							variant={selectedStatus === 'confirmed' ? 'default' : 'outline'} 
							size="lg" 
							onClick={() => setSelectedStatus('confirmed')} 
							className="flex flex-col h-16 p-3 rounded-xl touch-target"
						>
							<span className="text-xs font-medium">Confirmed</span>
							<Badge variant="secondary" className="mt-1">{counters.confirmed}</Badge>
						</Button>
						<Button 
							variant={selectedStatus === 'pending' ? 'default' : 'outline'} 
							size="lg" 
							onClick={() => setSelectedStatus('pending')} 
							className="flex flex-col h-16 p-3 rounded-xl touch-target"
						>
							<span className="text-xs font-medium">Pending</span>
							<Badge variant="secondary" className="mt-1">{counters.pending}</Badge>
						</Button>
						<Button 
							variant={selectedStatus === 'cancelled' ? 'default' : 'outline'} 
							size="lg" 
							onClick={() => setSelectedStatus('cancelled')} 
							className="flex flex-col h-16 p-3 rounded-xl touch-target"
						>
							<span className="text-xs font-medium">Cancelled</span>
							<Badge variant="secondary" className="mt-1">{counters.cancelled}</Badge>
						</Button>
						<Button 
							variant={selectedStatus === 'completed' ? 'default' : 'outline'} 
							size="lg" 
							onClick={() => setSelectedStatus('completed')} 
							className="flex flex-col h-16 p-3 rounded-xl touch-target"
						>
							<span className="text-xs font-medium">Completed</span>
							<Badge variant="secondary" className="mt-1">{counters.completed}</Badge>
						</Button>
					</div>
					
					{/* Action Buttons - Improved responsive layout */}
					<div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
						{lastEndedAppointment && (
							<Button 
								size="lg" 
								variant="secondary" 
								onClick={() => openCompletion(lastEndedAppointment)} 
								className="h-12 px-4 rounded-xl justify-start touch-target"
							>
								<RotateCcw className="h-5 w-5 mr-2" /> 
								<span className="text-sm">Complete Last</span>
							</Button>
						)}
						<Button 
							size="lg" 
							onClick={() => openQuickBooking()} 
							className="h-12 px-4 rounded-xl justify-start touch-target bg-primary hover:bg-primary/90"
						>
							<Plus className="h-5 w-5 mr-2" /> 
							<span className="text-sm">Book Appointment</span>
						</Button>
						<Button 
							size="lg" 
							variant="outline" 
							onClick={async () => { 
								setShowFollowUps(true); 
								try {
									const { data } = await supabase.from('appointment_follow_ups').select('*, appointments(*)')
										.gte('scheduled_date', startOfDay.toISOString())
										.lt('scheduled_date', endOfDay.toISOString())
										.eq('status', 'pending');
									setFollowUps(data || []);
								} catch {} 
							}} 
							className="h-12 px-4 rounded-xl justify-start touch-target"
						>
							<ListChecks className="h-5 w-5 mr-2" /> 
							<span className="text-sm">Follow-Ups</span>
						</Button>
						<Button 
							size="lg" 
							variant={selectedStatus === 'pending' ? 'secondary' : 'outline'} 
							onClick={() => setSelectedStatus('pending')} 
							className="h-12 px-4 rounded-xl justify-start touch-target"
						>
							<Clock className="h-5 w-5 mr-2" /> 
							<span className="text-sm">Pending</span>
						</Button>
					</div>
				</div>
			</div>

			{/* Main List */}
			<div className="px-4 py-4 space-y-4">
				{loading ? (
					<Card className="p-8">
						<CardContent className="text-center text-muted-foreground">
							<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
							Loading today's appointments...
						</CardContent>
					</Card>
				) : filteredAppointments.length === 0 ? (
					<Card className="p-8">
						<CardContent className="text-center">
							<Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
							<p className="font-medium text-lg mb-4">No appointments this day</p>
							<Button 
								onClick={() => openQuickBooking()} 
								variant="outline" 
								size="lg"
								className="h-12 px-6 rounded-xl"
							>
								Book Appointment
							</Button>
						</CardContent>
					</Card>
				) : (
					filteredAppointments.map(a => (
						<AppointmentCard
							key={a.id}
							appointment={a}
							onOpenDetails={() => setSelectedAppointment(a)}
							onComplete={() => openCompletion(a)}
							onReschedule={() => openReschedule(a)}
							onCancel={() => handleCancel(a)}
							dentistName={dentistName}
						/>
					))
				)}
			</div>

			{/* Detail Sheet */}
			<Sheet open={!!selectedAppointment} onOpenChange={(o) => { if (!o) setSelectedAppointment(null); }}>
				<SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-3xl">
					<SheetHeader className="pb-4">
						<SheetTitle className="text-xl">Appointment Details</SheetTitle>
					</SheetHeader>
					{selectedAppointment && (
						<div className="mt-4 space-y-4">
							<div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
								<div className="text-sm">
									<div className="font-semibold text-base">{selectedAppointment.patient ? `${selectedAppointment.patient.first_name} ${selectedAppointment.patient.last_name}` : 'Patient'}</div>
									<div className="text-muted-foreground mt-1">{formatTime(selectedAppointment.appointment_date)} • {selectedAppointment.reason || 'Visit'}</div>
								</div>
								<Badge variant="outline" className="capitalize px-3 py-1">{selectedAppointment.status}</Badge>
							</div>
							<Card>
								<CardContent className="p-5 text-sm space-y-2">
									<p className="flex justify-between">
										<span className="text-muted-foreground">Dentist:</span> 
										<span className="font-medium">{dentistName}</span>
									</p>
									<p className="flex justify-between">
										<span className="text-muted-foreground">Allergies:</span> 
										<span className="font-medium">None on file</span>
									</p>
								</CardContent>
							</Card>
							<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
								<Button 
									size="lg"
									variant="outline" 
									onClick={() => selectedAppointment?.patient && openPatientProfile(selectedAppointment.patient.id)}
									className="h-12 rounded-xl"
								>
									Open Patient Profile
								</Button>
								<Button 
									size="lg"
									onClick={() => openCompletion(selectedAppointment)}
									className="h-12 rounded-xl"
								>
									Complete Appointment
								</Button>
							</div>
						</div>
					)}
				</SheetContent>
			</Sheet>

			{/* Reschedule Dialog */}
			<Dialog open={!!rescheduleTarget} onOpenChange={(o) => { if (!o) setRescheduleTarget(null); }}>
				<DialogContent className="max-w-md">
					<DialogHeader>
						<DialogTitle>Reschedule Appointment</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<Input type="datetime-local" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} />
						<div className="flex gap-2">
							<Button className="flex-1" onClick={applyReschedule}>Save</Button>
							<Button className="flex-1" variant="outline" onClick={() => setRescheduleTarget(null)}>Cancel</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Follow-ups Dialog */}
			<Dialog open={showFollowUps} onOpenChange={setShowFollowUps}>
				<DialogContent className="max-w-lg">
					<DialogHeader>
						<DialogTitle>Follow-Ups Due Today</DialogTitle>
					</DialogHeader>
					<div className="space-y-2 max-h-[60vh] overflow-y-auto">
						{followUps.length === 0 ? (
							<p className="text-sm text-muted-foreground">No follow-ups due today.</p>
						) : followUps.map((fu, idx) => (
							<Card key={idx}><CardContent className="p-3 text-sm">Appointment #{fu.appointment_id} — {new Date(fu.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {fu.follow_up_type}</CardContent></Card>
						))}
					</div>
				</DialogContent>
			</Dialog>

			{/* Booking - Quick form for dentists */}
			<Dialog open={showBooking} onOpenChange={(o) => setShowBooking(o)}>
				<DialogContent className="max-w-md w-full">
					<DialogHeader>
						<DialogTitle>Book Appointment</DialogTitle>
					</DialogHeader>
					<div className="space-y-3">
						<div>
							<label className="text-sm text-muted-foreground">Patient *</label>
							<select className="w-full border rounded p-2 mt-1" value={quickPatientId} onChange={e => setQuickPatientId(e.target.value)}>
								<option value="">Select patient...</option>
								{quickPatients.map(p => (
									<option key={p.id} value={p.id}>{p.first_name} {p.last_name}{p.email ? ` (${p.email})` : ''}</option>
								))}
							</select>
						</div>
						<div className="grid grid-cols-2 gap-2">
							<div>
								<label className="text-sm text-muted-foreground">Date *</label>
								<Input type="date" value={quickDate} onChange={e => setQuickDate(e.target.value)} />
							</div>
							<div>
								<label className="text-sm text-muted-foreground">Time *</label>
								<Input type="time" value={quickTime} onChange={e => setQuickTime(e.target.value)} />
							</div>
						</div>
						<div>
							<label className="text-sm text-muted-foreground">Reason</label>
							<Input placeholder="e.g., Follow-up visit" value={quickReason} onChange={e => setQuickReason(e.target.value)} />
						</div>
						<div>
							<label className="text-sm text-muted-foreground">Urgency</label>
							<select className="w-full border rounded p-2" value={quickUrgency} onChange={e => setQuickUrgency(e.target.value as any)}>
								<option value="low">Low</option>
								<option value="medium">Medium</option>
								<option value="high">High</option>
							</select>
						</div>
						<div className="flex gap-2 pt-2">
							<Button className="flex-1" onClick={handleQuickBook} disabled={!quickPatientId || !quickDate || !quickTime}>Save</Button>
							<Button className="flex-1" variant="outline" onClick={() => setShowBooking(false)}>Cancel</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>

			{/* Completion Modal - keep mounted to preserve partial progress */}
			{selectedAppointment && (
				<AppointmentCompletionModal
					open={showCompletion}
					onOpenChange={(o) => setShowCompletion(o)}
					appointment={{
						id: selectedAppointment.id,
						patient_id: selectedAppointment.patient_id,
						dentist_id: selectedAppointment.dentist_id,
						appointment_date: selectedAppointment.appointment_date,
						status: selectedAppointment.status
					}}
					dentistId={dentistId}
					onCompleted={() => {
						fetchAppointments();
						setShowCompletion(false);
					}}
				/>
			)}

			{/* Floating FAB on mobile with quick actions */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<Button className="fixed bottom-24 right-4 rounded-full h-12 w-12 p-0 shadow-lg">
						<Plus className="h-5 w-5" />
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end">
					<DropdownMenuItem onClick={() => openQuickBooking()}>Book new appointment</DropdownMenuItem>
					<DropdownMenuItem onClick={() => openQuickBooking({ reason: 'Follow-up visit' })}>Add follow-up</DropdownMenuItem>
					<DropdownMenuItem onClick={() => openQuickBooking({ setNow: true, reason: 'Walk-in' })}>Add walk-in appointment</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	);
}

function AppointmentCard({ appointment, onOpenDetails, onComplete, onReschedule, onCancel, dentistName }: {
	appointment: AppointmentItem;
	onOpenDetails: () => void;
	onComplete: () => void;
	onReschedule: () => void;
	onCancel: () => void;
	dentistName: string;
}) {
	// Local time formatter to avoid undefined reference
	const formatTime = (iso: string) => new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

	const statusPill = () => {
		switch (appointment.status) {
			case 'confirmed': return <Badge className="capitalize bg-blue-100 text-blue-800 border-0 px-3 py-1">confirmed</Badge>;
			case 'pending':
			case 'scheduled': return <Badge className="capitalize bg-yellow-100 text-yellow-800 border-0 px-3 py-1">pending</Badge>;
			case 'cancelled': return <Badge className="capitalize bg-red-100 text-red-800 border-0 px-3 py-1">cancelled</Badge>;
			case 'completed': return <Badge className="capitalize bg-green-100 text-green-800 border-0 px-3 py-1">completed</Badge>;
			default: return <Badge variant="outline" className="capitalize px-3 py-1">{appointment.status}</Badge>;
		}
	};

	return (
		<Card className="cursor-pointer hover:shadow-lg transition-shadow">
			<CardContent className="p-5" onClick={onOpenDetails}>
				<div className="flex items-start justify-between gap-3">
					<div className="flex-1 space-y-1">
						<div className="font-semibold text-base">
							{formatTime(appointment.appointment_date)} — {appointment.patient ? `${appointment.patient.first_name} ${appointment.patient.last_name}` : 'Patient'}
						</div>
						<div className="text-sm text-muted-foreground">
							{appointment.reason || 'Visit'} • {dentistName}
						</div>
					</div>
					<div className="flex-shrink-0">
						{statusPill()}
					</div>
				</div>
				{/* Action buttons always visible */}
				<div className="flex gap-2 mt-4">
					<Button 
						size="sm" 
						variant="outline"
						onClick={(e) => {
							e.stopPropagation();
							onComplete();
						}}
						className="flex-1"
					>
						Complete
					</Button>
					<Button 
						size="sm" 
						variant="outline"
						onClick={(e) => {
							e.stopPropagation();
							onReschedule();
						}}
						className="flex-1"
					>
						Reschedule
					</Button>
					<Button 
						size="sm" 
						variant="outline"
						onClick={(e) => {
							e.stopPropagation();
							onCancel();
						}}
						className="flex-1 text-destructive hover:bg-destructive/10"
					>
						Cancel
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}