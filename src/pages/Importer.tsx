import { useEffect, useMemo, useRef, useState } from 'react';
import { supabase, getFunctionUrl } from '@/integrations/supabase/client';

interface PreviewRow {
	row: number;
	patient: { name?: string; dob?: string; email?: string; phone?: string; match?: string };
	dentist: { name?: string; email?: string; match?: string };
	start?: string;
	end?: string;
	status?: string;
	messages?: string[];
}

export default function Importer() {
	const [step, setStep] = useState<1|2|3>(1);
	const [file, setFile] = useState<File | null>(null);
	const [filename, setFilename] = useState<string>('');
	const [tz, setTz] = useState<string>(Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
	const [mapping, setMapping] = useState<Record<string,string>>({});
	const [dryRun, setDryRun] = useState<{ counts: any; preview: PreviewRow[]; report_csv_b64?: string } | null>(null);
	const [loading, setLoading] = useState<boolean>(false);
	const [error, setError] = useState<string>('');
	const inputRef = useRef<HTMLInputElement>(null);

	const human = (iso?: string) => {
		if (!iso) return '';
		try {
			const d = new Date(iso);
			return d.toLocaleString(undefined, { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
		} catch { return iso || ''; }
	};

	async function runDryRun() {
		if (!file) return;
		setLoading(true); setError('');
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) throw new Error('Not authenticated');
			const res = await fetch(`${getFunctionUrl('import-appointments')}?action=dry-run&filename=${encodeURIComponent(file.name)}&tz=${encodeURIComponent(tz)}`, {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': file.type || 'application/octet-stream' },
				body: await file.arrayBuffer()
			});
			if (!res.ok) throw new Error((await res.json()).error || 'Dry run failed');
			const json = await res.json();
			setDryRun(json);
			setStep(3);
		} catch (e: any) {
			setError(e.message || 'Dry run failed');
		} finally { setLoading(false); }
	}

	async function commitImport() {
		if (!file) return;
		setLoading(true); setError('');
		try {
			const { data: { session } } = await supabase.auth.getSession();
			if (!session) throw new Error('Not authenticated');
			const res = await fetch(`${getFunctionUrl('import-appointments')}?action=commit&filename=${encodeURIComponent(file.name)}&tz=${encodeURIComponent(tz)}`, {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${session.access_token}`, 'Content-Type': file.type || 'application/octet-stream' },
				body: await file.arrayBuffer()
			});
			const json = await res.json();
			if (!res.ok) throw new Error(json.error || 'Import failed');
			alert(`Imported ${json.imported} rows. Job: ${json.job_id}`);
		} catch (e: any) {
			setError(e.message || 'Import failed');
		} finally { setLoading(false); }
	}

	return (
		<div className="max-w-5xl mx-auto p-6 space-y-6">
			<div className="flex items-center gap-3 text-sm">
				<div className={`px-2 py-1 rounded ${step>=1?'bg-blue-600 text-white':'bg-gray-200'}`}>1. Upload</div>
				<div className={`px-2 py-1 rounded ${step>=2?'bg-blue-600 text-white':'bg-gray-200'}`}>2. Map</div>
				<div className={`px-2 py-1 rounded ${step>=3?'bg-blue-600 text-white':'bg-gray-200'}`}>3. Review & Import</div>
			</div>

			{step === 1 && (
				<div className="space-y-4 border rounded p-4">
					<p className="text-sm text-gray-600">Accepts .csv, .xlsx (first sheet), .ics. Max 10MB. No export? Download our template: <a href="/sample-import.csv" className="underline text-blue-600">Sample CSV</a></p>
					<input ref={inputRef} type="file" accept=".csv,.xlsx,.ics" onChange={(e) => {
						const f = e.target.files?.[0] || null;
						setFile(f);
						setFilename(f?.name || '');
					}} />
					<div className="flex gap-3 items-center">
						<label className="text-sm">Clinic timezone</label>
						<input className="border rounded px-2 py-1" value={tz} onChange={(e)=>setTz(e.target.value)} />
					</div>
					<div className="flex gap-3">
						<button disabled={!file||loading} className="px-3 py-2 bg-blue-600 text-white rounded" onClick={()=>setStep(2)}>Next: Map</button>
					</div>
				</div>
			)}

			{step === 2 && (
				<div className="space-y-4 border rounded p-4">
					<p className="text-sm text-gray-600">Map your columns to target fields. We pre-detect by name. You can skip; defaults will be applied.</p>
					<div className="flex gap-3">
						<button className="px-3 py-2 bg-gray-100 rounded" onClick={()=>setStep(1)}>Back</button>
						<button disabled={!file||loading} className="px-3 py-2 bg-blue-600 text-white rounded" onClick={runDryRun}>Run Dry-run</button>
					</div>
					{error && <div className="text-red-600 text-sm">{error}</div>}
				</div>
			)}

			{step === 3 && (
				<div className="space-y-4 border rounded p-4">
					<div className="flex flex-wrap gap-4 text-sm">
						<div className="px-2 py-1 bg-green-100 rounded">To create: {dryRun?.counts?.to_create ?? 0}</div>
						<div className="px-2 py-1 bg-blue-100 rounded">To match: {dryRun?.counts?.to_match ?? 0}</div>
						<div className="px-2 py-1 bg-yellow-100 rounded">Warnings: {dryRun?.counts?.warnings ?? 0}</div>
						<div className="px-2 py-1 bg-red-100 rounded">Errors: {dryRun?.counts?.errors ?? 0}</div>
					</div>
					<div className="overflow-auto border rounded">
						<table className="min-w-full text-sm">
							<thead>
								<tr className="bg-gray-50">
									<th className="px-2 py-1 text-left">Patient</th>
									<th className="px-2 py-1 text-left">Dentist</th>
									<th className="px-2 py-1 text-left">Start</th>
									<th className="px-2 py-1 text-left">End</th>
									<th className="px-2 py-1 text-left">Status</th>
									<th className="px-2 py-1 text-left">Messages</th>
								</tr>
							</thead>
							<tbody>
								{(dryRun?.preview||[]).map((r,idx)=> (
									<tr key={idx} className="border-t">
										<td className="px-2 py-1">{r.patient?.name} {r.patient?.dob?`(${r.patient.dob})`:''}</td>
										<td className="px-2 py-1">{r.dentist?.name||r.dentist?.email}</td>
										<td className="px-2 py-1">{human(r.start)}</td>
										<td className="px-2 py-1">{human(r.end)}</td>
										<td className="px-2 py-1">{r.status}</td>
										<td className="px-2 py-1">{(r.messages||[]).join('; ')}</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
					<div className="flex gap-3 items-center">
						<button className="px-3 py-2 bg-gray-100 rounded" onClick={()=>setStep(2)}>Back</button>
						{dryRun?.report_csv_b64 && (
							<button className="px-3 py-2 bg-gray-100 rounded" onClick={() => {
								const a = document.createElement('a');
								a.href = `data:text/csv;base64,${dryRun.report_csv_b64}`;
								a.download = 'dry-run-report.csv';
								a.click();
							}}>Download dry-run report</button>
						)}
						<label className="text-sm flex items-center gap-2">
							<input type="checkbox" id="authz" /> I confirm I am authorized to import this patient data.
						</label>
						<button disabled={!file||loading||!(document.getElementById('authz') as HTMLInputElement)?.checked} className="px-3 py-2 bg-blue-600 text-white rounded" onClick={commitImport}>Import {dryRun?.counts?.total ?? ''} rows</button>
					</div>
					{error && <div className="text-red-600 text-sm">{error}</div>}
				</div>
			)}
		</div>
	);
}