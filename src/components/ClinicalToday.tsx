import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { UnifiedAppointments } from "@/components/UnifiedAppointments";
import { EnhancedClinicalAppointments } from "@/components/EnhancedClinicalAppointments";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Activity, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ClinicalTodayProps {
	user: User;
	dentistId: string;
	onOpenPatientsTab?: () => void;
}

export function ClinicalToday({ user, dentistId, onOpenPatientsTab }: ClinicalTodayProps) {
	const today = new Date();
	const todayStr = today.toLocaleDateString(undefined, { 
		weekday: 'long', 
		month: 'long', 
		day: 'numeric', 
		year: 'numeric' 
	});

	const [stats, setStats] = useState({
		todayCount: 0,
		weekCompleted: 0,
		monthRevenue: 0,
		totalPatients: 0
	});

	useEffect(() => {
		const fetchStats = async () => {
			try {
				// Today's appointments
				const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
				const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
				
				const { data: todayAppts } = await supabase
					.from('appointments')
					.select('id')
					.eq('dentist_id', dentistId)
					.gte('appointment_date', startOfDay.toISOString())
					.lt('appointment_date', endOfDay.toISOString())
					.neq('status', 'cancelled');

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
					weekCompleted: weekCompleted?.length || 0,
					monthRevenue: 0, // Would need payment data
					totalPatients: uniquePatients.size
				});
			} catch (error) {
				console.error('Error fetching stats:', error);
			}
		};

		fetchStats();
	}, [dentistId]);

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="px-4 pt-4">
				<h1 className="text-2xl font-bold">Clinical Dashboard</h1>
				<p className="text-sm text-muted-foreground mt-1">{todayStr}</p>
			</div>

			{/* Quick Stats */}
			<div className="px-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
				<Card className="glass-card">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center justify-between">
							<span>Today's Appointments</span>
							<Calendar className="h-4 w-4 text-dental-primary" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.todayCount}</div>
						<p className="text-xs text-muted-foreground">Scheduled today</p>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center justify-between">
							<span>Completed</span>
							<Activity className="h-4 w-4 text-green-600" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.weekCompleted}</div>
						<p className="text-xs text-muted-foreground">This week</p>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center justify-between">
							<span>Revenue</span>
							<TrendingUp className="h-4 w-4 text-blue-600" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">${stats.monthRevenue}</div>
						<p className="text-xs text-muted-foreground">This month</p>
					</CardContent>
				</Card>

				<Card className="glass-card">
					<CardHeader className="pb-2">
						<CardTitle className="text-sm font-medium flex items-center justify-between">
							<span>Active Patients</span>
							<Users className="h-4 w-4 text-purple-600" />
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{stats.totalPatients}</div>
						<p className="text-xs text-muted-foreground">Total patients</p>
					</CardContent>
				</Card>
			</div>

			{/* Enhanced Appointments Component with Complete Button */}
			<div className="px-4">
				<EnhancedClinicalAppointments 
					dentistId={dentistId}
					onOpenPatientProfile={(patientId) => {
						sessionStorage.setItem('requestedPatientId', patientId);
						onOpenPatientsTab?.();
					}}
				/>
			</div>
		</div>
	);
}