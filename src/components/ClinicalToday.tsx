// @ts-nocheck
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, User as UserIcon, CheckCircle, TrendingUp, AlertCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { NextAppointmentWidget } from "@/components/NextAppointmentWidget";
import { ServicesQuickLink } from "@/components/dashboard/ServicesQuickLink";

interface ClinicalTodayProps {
	user: User;
	dentistId: string;
	onOpenPatientsTab?: () => void;
	onOpenAppointmentsTab?: () => void;
}

interface TodayAppointment {
	id: string;
	appointment_date: string;
	patient_name: string | null;
	reason: string | null;
	status: string;
	urgency: string | null;
	profiles: {
		first_name: string;
		last_name: string;
	} | null;
}

export function ClinicalToday({ user, dentistId, onOpenPatientsTab, onOpenAppointmentsTab }: ClinicalTodayProps) {
	const today = new Date();
	const [stats, setStats] = useState({
		todayCount: 0,
		urgentCount: 0,
		weekCompleted: 0,
		totalPatients: 0
	});
	const [todayAppointments, setTodayAppointments] = useState<TodayAppointment[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
				const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
				
				console.log('🔍 Fetching dashboard data for dentistId:', dentistId);
				console.log('📅 Date range:', {
					start: startOfDay.toISOString(),
					end: endOfDay.toISOString()
				});
				
				// Today's appointments with details
				const { data: todayAppts, error: todayError } = await supabase
					.from('appointments')
					.select(`
						id,
						appointment_date,
						patient_name,
						reason,
						status,
						urgency,
						profiles!appointments_patient_id_fkey (
							first_name,
							last_name
						)
					`)
					.eq('dentist_id', dentistId)
					.gte('appointment_date', startOfDay.toISOString())
					.lt('appointment_date', endOfDay.toISOString())
					.neq('status', 'cancelled')
					.order('appointment_date', { ascending: true });
				
				if (todayError) {
					console.error('❌ Error fetching today appointments:', { code: todayError.code, message: todayError.message, details: (todayError as any)?.details });
				} else {
					console.log('✅ Today appointments found:', todayAppts?.length || 0, todayAppts);
				}

				// Count urgent cases
				const urgentCount = todayAppts?.filter(a => a.urgency === 'high').length || 0;

				// This week's completed
				const startOfWeek = new Date(today);
				startOfWeek.setDate(today.getDate() - today.getDay());
				
				const { data: weekCompleted } = await supabase
					.from('appointments')
					.select('id')
					.eq('dentist_id', dentistId)
					.gte('appointment_date', startOfWeek.toISOString())
					.eq('status', 'completed');

				// Total unique patients
				const { data: patients } = await supabase
					.from('appointments')
					.select('patient_id')
					.eq('dentist_id', dentistId);
				
				const uniquePatients = new Set(patients?.map(p => p.patient_id) || []);

				setStats({
					todayCount: todayAppts?.length || 0,
					urgentCount,
					weekCompleted: weekCompleted?.length || 0,
					totalPatients: uniquePatients.size
				});
				setTodayAppointments(todayAppts || []);
			} catch (error) {
				console.error('Error fetching dashboard data:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [dentistId]);

	const getPatientName = (appointment: TodayAppointment) => {
		if (appointment.profiles) {
			return `${appointment.profiles.first_name} ${appointment.profiles.last_name}`;
		}
		return appointment.patient_name || 'Unknown Patient';
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'completed': return 'bg-success/10 text-success border-success/20';
			case 'confirmed': return 'bg-primary/10 text-primary border-primary/20';
			case 'pending': return 'bg-warning/10 text-warning border-warning/20';
			default: return 'bg-muted text-muted-foreground border-border';
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64">
				<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
			</div>
		);
	}

	return (
		<div className="space-y-6 p-6">
			{/* Welcome Header */}
			<div className="space-y-1">
				<h1 className="text-3xl font-bold tracking-tight">
					Good {today.getHours() < 12 ? 'morning' : today.getHours() < 18 ? 'afternoon' : 'evening'}
				</h1>
				<p className="text-muted-foreground">
					{format(today, 'EEEE, MMMM d, yyyy')}
				</p>
			</div>

			{/* Quick Stats */}
			<div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="border-none shadow-sm">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">Today</p>
								<p className="text-2xl font-bold">{stats.todayCount}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
								<Calendar className="h-6 w-6 text-primary" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">Urgent</p>
								<p className="text-2xl font-bold">{stats.urgentCount}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
								<AlertCircle className="h-6 w-6 text-destructive" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">Completed</p>
								<p className="text-2xl font-bold">{stats.weekCompleted}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
								<CheckCircle className="h-6 w-6 text-success" />
							</div>
						</div>
					</CardContent>
				</Card>

				<Card className="border-none shadow-sm">
					<CardContent className="pt-6">
						<div className="flex items-center justify-between">
							<div className="space-y-1">
								<p className="text-sm font-medium text-muted-foreground">Patients</p>
								<p className="text-2xl font-bold">{stats.totalPatients}</p>
							</div>
							<div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
								<UserIcon className="h-6 w-6 text-accent-foreground" />
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Services Quick Link */}
			<ServicesQuickLink />

			{/* Next Appointment Widget */}
			<NextAppointmentWidget dentistId={dentistId} />

			{/* Today's Schedule */}
			<Card className="border-none shadow-sm">
				<CardContent className="pt-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold">Today's Schedule</h2>
						<Button onClick={() => onOpenAppointmentsTab?.()} variant="ghost" size="sm">
							<Plus className="h-4 w-4 mr-2" />
							New Appointment
						</Button>
					</div>

					{todayAppointments.length === 0 ? (
						<div className="text-center py-12">
							<Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
							<p className="text-muted-foreground">No appointments scheduled for today</p>
							<Button onClick={() => onOpenAppointmentsTab?.()} variant="outline" size="sm" className="mt-4">
								View All Appointments
							</Button>
						</div>
					) : (
						<div className="space-y-3">
							{todayAppointments.map((appointment) => (
								<div
									key={appointment.id}
									className="flex items-center justify-between p-4 rounded-lg border bg-card hover:shadow-md transition-all cursor-pointer"
									onClick={() => onOpenAppointmentsTab?.()}
								>
									<div className="flex items-center gap-4 flex-1">
										<div className="flex flex-col items-center justify-center min-w-[60px]">
											<Clock className="h-4 w-4 text-muted-foreground mb-1" />
											<span className="text-sm font-medium">
												{format(new Date(appointment.appointment_date), 'HH:mm')}
											</span>
										</div>
										
										<div className="flex-1 min-w-0">
											<div className="flex items-center gap-2 mb-1">
												<p className="font-medium truncate">{getPatientName(appointment)}</p>
												{appointment.urgency === 'high' && (
													<Badge variant="destructive" className="text-xs">Urgent</Badge>
												)}
											</div>
											<p className="text-sm text-muted-foreground truncate">
												{appointment.reason || 'No reason specified'}
											</p>
										</div>
									</div>

									<Badge variant="outline" className={getStatusColor(appointment.status)}>
										{appointment.status}
									</Badge>
								</div>
							))}
							
							<Button 
								onClick={() => onOpenAppointmentsTab?.()} 
								variant="outline" 
								className="w-full mt-4"
							>
								View All Appointments
							</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}