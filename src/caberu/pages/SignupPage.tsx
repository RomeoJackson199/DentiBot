import type { FC, FormEvent } from 'react';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { MainNav } from '../components/MainNav';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';

export const SignupPage: FC = () => {
  const { register } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [role, setRole] = useState<'client' | 'professional'>((params.get('role') as 'client' | 'professional') ?? 'professional');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    businessName: '',
    category: 'general services',
  });

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
        role,
        businessName: role === 'professional' ? form.businessName : undefined,
        category: role === 'professional' ? form.category : undefined,
      });
      toast({ title: 'Account created', description: 'Welcome to Caberu!' });
      navigate(role === 'professional' ? '/dashboard/pro' : '/dashboard/client');
    } catch (error: any) {
      toast({ title: 'Unable to create account', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNav />
      <main className="mx-auto flex w-full max-w-6xl flex-col items-center px-4 py-16">
        <div className="w-full max-w-3xl rounded-3xl border bg-white p-10 shadow-xl">
          <h1 className="text-3xl font-semibold text-slate-900">Create your Caberu workspace</h1>
          <p className="mt-2 text-sm text-slate-500">Set up AI-powered automation for your services.</p>
          <form onSubmit={onSubmit} className="mt-6 space-y-6">
            <div className="space-y-3">
              <Label>Who are you signing up as?</Label>
              <RadioGroup value={role} onValueChange={(value) => setRole(value as 'client' | 'professional')} className="grid gap-4 sm:grid-cols-2">
                <label className={`cursor-pointer rounded-2xl border p-4 ${role === 'professional' ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="professional" id="role-professional" />
                    <div>
                      <p className="font-medium text-slate-800">Professional</p>
                      <p className="text-xs text-slate-500">Manage services, payments, analytics, and messaging.</p>
                    </div>
                  </div>
                </label>
                <label className={`cursor-pointer rounded-2xl border p-4 ${role === 'client' ? 'border-teal-400 bg-teal-50' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-center gap-3">
                    <RadioGroupItem value="client" id="role-client" />
                    <div>
                      <p className="font-medium text-slate-800">Client</p>
                      <p className="text-xs text-slate-500">Book appointments, pay online, chat with Caberu AI.</p>
                    </div>
                  </div>
                </label>
              </RadioGroup>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                required
              />
            </div>

            {role === 'professional' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business name</Label>
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={(event) => setForm((prev) => ({ ...prev, businessName: event.target.value }))}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Industry focus</Label>
                  <Input
                    id="category"
                    value={form.category}
                    onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                    placeholder="e.g. dentistry, fitness, beauty"
                    required
                  />
                </div>
              </div>
            )}

            <Button type="submit" className="w-full bg-teal-500 hover:bg-teal-600" disabled={loading}>
              {loading ? 'Creating workspace…' : 'Create account'}
            </Button>
          </form>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};
