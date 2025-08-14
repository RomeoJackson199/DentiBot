import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Database, Cloud, Cpu, Shield, RefreshCw, Clipboard } from "lucide-react";

export function DebugDatabaseConnection() {
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dentistId, setDentistId] = useState<string | null>(null);
  const [results, setResults] = useState<{
    summary?: { passed: number; total: number };
    auth?: { success: boolean; details: string };
    identity?: { profile: boolean; dentist: boolean; details: string };
    schema?: Array<{ name: string; exists: boolean; count?: number | null; error?: string | null }>;
    rls?: Array<{ name: string; success: boolean; details: string }>; 
    crud?: Array<{ name: string; success: boolean; details: string }>; 
    storage?: { success: boolean; details: string };
    rpc?: Array<{ name: string; success: boolean; details: string }>; 
    functions?: Array<{ name: string; success: boolean; details: string }>; 
    generalError?: string;
  }>({});

  useEffect(() => {
    // Fetch current user and identity context as soon as component mounts
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, role, user_id, first_name, last_name')
          .eq('user_id', user.id)
          .maybeSingle();
        setProfile(profile);
        if (profile) {
          const { data: dentist } = await supabase
            .from('dentists')
            .select('id, is_active')
            .eq('profile_id', profile.id)
            .maybeSingle();
          setDentistId(dentist?.id || null);
        }
      }
    };
    init();
  }, []);

  const runAllDiagnostics = async () => {
    setLoading(true);
    const next: typeof results = {};

    try {
      // 1) Auth
      const { data: { user } } = await supabase.auth.getUser();
      next.auth = {
        success: !!user,
        details: user ? `Authenticated as ${user.email || user.id}` : 'No authenticated user'
      };

      // 2) Identity
      let currentProfile: any = profile;
      if (user && !currentProfile) {
        const { data } = await supabase
          .from('profiles')
          .select('id, role, email, user_id')
          .eq('user_id', user.id)
          .maybeSingle();
        currentProfile = data || null;
      }

      let currentDentistId: string | null = dentistId;
      if (currentProfile && !currentDentistId) {
        const { data: dentist } = await supabase
          .from('dentists')
          .select('id, is_active')
          .eq('profile_id', currentProfile.id)
          .maybeSingle();
        currentDentistId = dentist?.id || null;
      }

      next.identity = {
        profile: !!currentProfile,
        dentist: !!currentDentistId,
        details: currentProfile
          ? currentDentistId
            ? 'Profile and dentist identity resolved'
            : 'Profile found; not a dentist or inactive'
          : 'Profile not found'
      };

      // 3) Schema checks (read access / existence)
      const tablesToCheck = [
        'profiles',
        'dentists',
        'appointments',
        'treatment_plans',
        'prescriptions',
        'patient_notes',
        'medical_records',
        'notifications',
        'payment_requests',
        'chat_messages',
        'appointment_slots',
        'dentist_availability',
        'calendar_events',
        // Optional tables referenced in code (may or may not exist)
        'dentist_vacation_days',
        'invoices',
        'invoice_items',
        'tariffs',
        'patient_insurance_profiles',
        'appointment_outcomes',
        'appointment_treatments',
        'dentist_ratings',
        'notes',
      ];

      const schemaResults = await Promise.all(
        tablesToCheck.map(async (name) => {
          try {
            const { error, count } = await supabase
              .from(name as any)
              .select('*', { count: 'exact', head: true });
            return { name, exists: !error, count: typeof count === 'number' ? count : null, error: error?.message || null };
          } catch (e: any) {
            return { name, exists: false, count: null, error: e?.message || 'Unknown error' };
          }
        })
      );
      next.schema = schemaResults;

      // 4) RLS behavior tests (non-destructive)
      const rlsResults: Array<{ name: string; success: boolean; details: string }> = [];
      if (user) {
        // Profiles: ensure we cannot read other users' profiles
        try {
          const { data: others, error } = await supabase
            .from('profiles')
            .select('id, user_id')
            .neq('user_id', user.id)
            .limit(1);
          rlsResults.push({
            name: 'Profiles visibility (self-only)',
            success: !error && (others?.length || 0) === 0,
            details: !error && (others?.length || 0) === 0
              ? 'RLS OK: other profiles are not visible'
              : error?.message || 'Unexpected visibility of other profiles'
          });
        } catch (e: any) {
          rlsResults.push({ name: 'Profiles visibility (self-only)', success: false, details: e?.message || 'Unknown error' });
        }

        // Appointments: dentist should only read their appointments
        if (currentDentistId) {
          try {
            const { error } = await supabase
              .from('appointments')
              .select('id', { count: 'exact', head: true })
              .eq('dentist_id', currentDentistId);
            rlsResults.push({
              name: 'Appointments access (dentist-owned)',
              success: !error,
              details: !error ? 'RLS OK for dentist appointments' : error.message
            });
          } catch (e: any) {
            rlsResults.push({ name: 'Appointments access (dentist-owned)', success: false, details: e?.message || 'Unknown error' });
          }
        }
      }
      next.rls = rlsResults;

      // 5) CRUD tests (safe, with cleanup)
      const crudOutcomes: Array<{ name: string; success: boolean; details: string }> = [];
      if (currentProfile && currentDentistId) {
        // Patient note lifecycle
        try {
          // Create
          const { data: created, error: insertErr } = await supabase
            .from('patient_notes')
            .insert({
              patient_id: currentProfile.id,
              dentist_id: currentDentistId,
              note_type: 'general',
              title: 'Admin Diagnostics Test Note',
              content: 'Temporary note created by diagnostics',
              is_private: false
            })
            .select()
            .maybeSingle();
          if (insertErr || !created?.id) throw insertErr || new Error('Insert failed');
          const testId = created.id;

          // Read
          const { data: readBack, error: readErr } = await supabase
            .from('patient_notes')
            .select('*')
            .eq('id', testId)
            .maybeSingle();
          if (readErr || !readBack) throw readErr || new Error('Read failed');

          // Update
          const { error: updateErr } = await supabase
            .from('patient_notes')
            .update({ content: 'Updated by diagnostics' })
            .eq('id', testId);
          if (updateErr) throw updateErr;

          // Delete
          const { error: deleteErr } = await supabase
            .from('patient_notes')
            .delete()
            .eq('id', testId);
          if (deleteErr) throw deleteErr;

          crudOutcomes.push({ name: 'Patient note CRUD', success: true, details: 'Create, read, update, delete succeeded' });
        } catch (e: any) {
          crudOutcomes.push({ name: 'Patient note CRUD', success: false, details: e?.message || 'Unknown error' });
        }
      } else {
        crudOutcomes.push({ name: 'Patient note CRUD', success: false, details: 'Requires logged-in dentist and profile' });
      }
      next.crud = crudOutcomes;

      // 6) Storage test (upload + signed URL + cleanup)
      try {
        if (!user) throw new Error('Not authenticated');
        const key = `${user.id}/admin-diagnostics-${Date.now()}.txt`;
        const blob = new Blob([`diagnostics ${new Date().toISOString()}`], { type: 'text/plain' });

        const { error: upErr } = await supabase.storage.from('dental-photos').upload(key, blob);
        if (upErr) throw upErr;

        const { error: urlErr } = await supabase.storage.from('dental-photos').createSignedUrl(key, 60);
        if (urlErr) throw urlErr;

        // Cleanup (best-effort)
        await supabase.storage.from('dental-photos').remove([key]);

        next.storage = { success: true, details: 'Upload, signed URL, and cleanup succeeded' };
      } catch (e: any) {
        next.storage = { success: false, details: e?.message || 'Storage test failed' };
      }

      // 7) RPC tests (safe)
      const rpcResults: Array<{ name: string; success: boolean; details: string }> = [];
      if (currentDentistId) {
        try {
          const today = new Date().toISOString().slice(0, 10);
          const { error: rpcErr } = await supabase.rpc('generate_daily_slots', {
            p_dentist_id: currentDentistId,
            p_date: today
          });
          rpcResults.push({ name: 'RPC generate_daily_slots', success: !rpcErr, details: !rpcErr ? 'RPC executed' : rpcErr.message });
        } catch (e: any) {
          rpcResults.push({ name: 'RPC generate_daily_slots', success: false, details: e?.message || 'Unknown error' });
        }
      } else {
        rpcResults.push({ name: 'RPC generate_daily_slots', success: false, details: 'Requires dentist context' });
      }
      next.rpc = rpcResults;

      // 8) Edge function tests (safe)
      const funcResults: Array<{ name: string; success: boolean; details: string }> = [];
      try {
        const { error: aiErr } = await supabase.functions.invoke('dental-ai-chat', {
          body: {
            message: 'Hello from admin diagnostics',
            conversation_history: [],
            user_profile: { first_name: 'Admin', last_name: 'Diagnostics' }
          }
        });
        funcResults.push({ name: 'Function dental-ai-chat', success: !aiErr, details: !aiErr ? 'Invoked successfully' : aiErr.message });
      } catch (e: any) {
        funcResults.push({ name: 'Function dental-ai-chat', success: false, details: e?.message || 'Unknown error' });
      }
      next.functions = funcResults;

      // Summary
      const passCount = (
        (next.auth?.success ? 1 : 0) +
        (next.identity?.profile ? 1 : 0) +
        (next.schema?.filter(s => s.exists).length || 0) +
        (next.rls?.filter(r => r.success).length || 0) +
        (next.crud?.filter(c => c.success).length || 0) +
        (next.storage?.success ? 1 : 0) +
        (next.rpc?.filter(r => r.success).length || 0) +
        (next.functions?.filter(f => f.success).length || 0)
      );
      const totalCount = (
        1 + // auth
        1 + // identity (profile presence)
        (next.schema?.length || 0) +
        (next.rls?.length || 0) +
        (next.crud?.length || 0) +
        1 + // storage
        (next.rpc?.length || 0) +
        (next.functions?.length || 0)
      );
      next.summary = { passed: passCount, total: totalCount };

      setResults(next);
    } catch (error: any) {
      setResults({ generalError: error?.message || 'Diagnostics failed unexpectedly' });
    } finally {
      setLoading(false);
    }
  };

  const copyResults = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(results, null, 2));
    } catch (e) {
      // no-op
    }
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Admin Diagnostics</span>
          </span>
          <div className="flex items-center gap-2">
            <Button onClick={runAllDiagnostics} disabled={loading}>
              {loading ? (
                <span className="flex items-center"><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Running...</span>
              ) : (
                <span className="flex items-center">Run All Tests</span>
              )}
            </Button>
            <Button variant="outline" onClick={copyResults} disabled={!results || loading}>
              <Clipboard className="h-4 w-4 mr-2" /> Copy JSON
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {results.summary && (
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="font-medium">Summary</span>
            </div>
            <Badge variant={results.summary.passed === results.summary.total ? 'default' : 'destructive'}>
              {results.summary.passed}/{results.summary.total} passed
            </Badge>
          </div>
        )}

        {results.auth && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {results.auth.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span className="font-medium">Authentication</span>
              </div>
              <Badge variant={results.auth.success ? 'default' : 'destructive'}>
                {results.auth.success ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{results.auth.details}</p>
          </div>
        )}

        {results.identity && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Identity</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Profile</span>
                <Badge variant={results.identity.profile ? 'default' : 'destructive'}>
                  {results.identity.profile ? 'Found' : 'Missing'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-2 bg-muted rounded">
                <span>Dentist</span>
                <Badge variant={results.identity.dentist ? 'default' : 'secondary'}>
                  {results.identity.dentist ? 'Found' : 'Not a dentist'}
                </Badge>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{results.identity.details}</p>
          </div>
        )}

        {results.schema && results.schema.length > 0 && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Schema Access</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {results.schema.map((t) => (
                <div key={t.name} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="truncate mr-2">{t.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.exists ? 'default' : 'destructive'}>
                      {t.exists ? 'OK' : 'Error'}
                    </Badge>
                    {!t.exists && t.error && (
                      <span className="text-xs text-red-600 truncate max-w-[200px]">{t.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.rls && results.rls.length > 0 && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-5 w-5 text-teal-600" />
              <span className="font-medium">RLS Checks</span>
            </div>
            <div className="space-y-2">
              {results.rls.map((r) => (
                <div key={r.name} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="mr-2">{r.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={r.success ? 'default' : 'destructive'}>
                      {r.success ? 'OK' : 'Issue'}
                    </Badge>
                    {!r.success && (
                      <span className="text-xs text-red-600 truncate max-w-[220px]">{r.details}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.crud && results.crud.length > 0 && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Database className="h-5 w-5 text-green-700" />
              <span className="font-medium">CRUD</span>
            </div>
            <div className="space-y-2">
              {results.crud.map((c) => (
                <div key={c.name} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="mr-2">{c.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={c.success ? 'default' : 'destructive'}>
                      {c.success ? 'OK' : 'Failed'}
                    </Badge>
                    {!c.success && (
                      <span className="text-xs text-red-600 truncate max-w-[220px]">{c.details}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.storage && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Cloud className="h-5 w-5 text-blue-700" />
                <span className="font-medium">Storage</span>
              </div>
              <Badge variant={results.storage.success ? 'default' : 'destructive'}>
                {results.storage.success ? 'OK' : 'Failed'}
              </Badge>
            </div>
            {!results.storage.success && (
              <p className="text-sm text-red-600 mt-2">{results.storage.details}</p>
            )}
          </div>
        )}

        {results.rpc && results.rpc.length > 0 && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Cpu className="h-5 w-5 text-indigo-700" />
              <span className="font-medium">RPC</span>
            </div>
            <div className="space-y-2">
              {results.rpc.map((r) => (
                <div key={r.name} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="mr-2">{r.name}</span>
                  <Badge variant={r.success ? 'default' : 'destructive'}>
                    {r.success ? 'OK' : 'Failed'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.functions && results.functions.length > 0 && (
          <div className="p-3 border rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <Cpu className="h-5 w-5 text-orange-600" />
              <span className="font-medium">Edge Functions</span>
            </div>
            <div className="space-y-2">
              {results.functions.map((f) => (
                <div key={f.name} className="flex items-center justify-between p-2 bg-muted rounded">
                  <span className="mr-2">{f.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={f.success ? 'default' : 'destructive'}>
                      {f.success ? 'OK' : 'Failed'}
                    </Badge>
                    {!f.success && (
                      <span className="text-xs text-red-600 truncate max-w-[220px]">{f.details}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {results.generalError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-1">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-800">Diagnostics Error</span>
            </div>
            <p className="text-sm text-red-700">{results.generalError}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}