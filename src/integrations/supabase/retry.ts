import { logger } from '@/lib/logger';

export async function withSchemaReloadRetry<T>(op: () => Promise<T>, sb: any): Promise<T> {
	try {
		return await op();
	} catch (e: any) {
		const message = (e?.message || '').toString().toLowerCase();
		const looksLikeSchemaCache = message.includes('schema cache') || message.includes('cached schema');
		if (!looksLikeSchemaCache) throw e;
		try {
			await sb.rpc('reload_postgrest_schema');
		} catch (reloadError) {
			// Schema reload RPC is optional - log but continue with retry
			logger.debug('Schema reload RPC failed (non-critical):', reloadError);
		}
		await new Promise(r => setTimeout(r, 600));
		return await op();
	}
}