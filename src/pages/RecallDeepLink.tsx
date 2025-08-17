import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { bookSuggestedSlot, regenerateSlots, RecallRecord, RecallSlot } from "@/lib/recalls";

export default function RecallDeepLink() {
	const { id } = useParams();
	const navigate = useNavigate();
	const [recall, setRecall] = useState<RecallRecord | null>(null);
	const [loading, setLoading] = useState(true);
	const [booking, setBooking] = useState(false);

	useEffect(() => {
		(async () => {
			if (!id) return;
			const { data, error } = await supabase.from('recalls').select('*').eq('id', id).single();
			if (!error && data) setRecall(data as any);
			setLoading(false);
		})();
	}, [id]);

	const handleBook = async (slot?: RecallSlot) => {
		if (!recall) return;
		setBooking(true);
		try {
			const chosen = slot || (recall.suggested_slots?.[0] as RecallSlot);
			const apptId = await bookSuggestedSlot(recall.id, chosen);
			navigate(`/appointments/${apptId}`);
		} catch (e) {
			// Try regenerating slots if booking failed
			try {
				const newSlots = await regenerateSlots(recall.id);
				setRecall({ ...(recall as any), suggested_slots: newSlots } as any);
			} catch {}
		} finally {
			setBooking(false);
		}
	};

	if (loading) return <div className="p-6">Loading...</div>;
	if (!recall) return <div className="p-6">Recall not found</div>;

	const first = recall.suggested_slots?.[0];
	const niceDue = new Date(recall.due_date).toLocaleDateString();
	const niceTime = first ? first.time.slice(0,5) : '';

	return (
		<div className="p-6 max-w-xl mx-auto">
			<Card>
				<CardHeader>
					<CardTitle>Your next {recall.treatment_label} is due on {niceDue}</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					{first ? (
						<div>
							<p className="mb-3">Book this suggested slot: {first.date} at {niceTime}?</p>
							<div className="flex gap-2">
								<Button disabled={booking} onClick={() => handleBook(first)}>Book suggested slot</Button>
								<Button variant="outline" onClick={() => navigate('/dashboard#appointments')}>See other times</Button>
								<Button variant="ghost" onClick={async () => { await supabase.from('recalls').update({ status: 'snoozed', snooze_until: new Date(Date.now()+7*864e5).toISOString().slice(0,10) }).eq('id', recall.id); navigate('/dashboard'); }}>Remind me later</Button>
							</div>
						</div>
					) : (
						<div>
							<p>No suggested slots available. You can see other times.</p>
							<Button onClick={() => navigate('/dashboard#appointments')}>See other times</Button>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}