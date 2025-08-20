export async function withSchemaReloadRetry<T>(op: () => Promise<T>, sb: any): Promise<T> {
	try {
		return await op();
	} catch (e: any) {
		const message = (e?.message || '').toString().toLowerCase();
		const looksLikeSchemaCache = message.includes('schema cache') || message.includes('cached schema');
		if (!looksLikeSchemaCache) throw e;
		try {
			await sb.rpc('reload_postgrest_schema');
		} catch {
			// ignore schema reload rpc failure
		}
		await new Promise(r => setTimeout(r, 600));
		return await op();
	}
}