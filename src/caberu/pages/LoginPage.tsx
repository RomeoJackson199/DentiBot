import type { FC, FormEvent } from 'react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { MainNav } from '../components/MainNav';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../context/AuthContext';
import { businessApi } from '../api';
import type { Business } from '../types';

export const LoginPage: FC = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [form, setForm] = useState({ email: '', password: '' });
  const [authLoading, setAuthLoading] = useState(false);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);

  const businessIdParam = params.get('businessId');

  const fetchBusinesses = useCallback(async () => {
    setCatalogLoading(true);
    setCatalogError(null);
    try {
      const data = await businessApi.list();
      setBusinesses(data);
      setSelectedBusiness((current) => {
        if (businessIdParam) {
          const match = data.find((business) => business.id === businessIdParam);
          if (match) {
            return match;
          }
        }

        if (current) {
          const stillExists = data.find((business) => business.id === current.id);
          if (stillExists) {
            return stillExists;
          }
        }

        return data[0] ?? null;
      });
    } catch (error: any) {
      setCatalogError(error?.message ?? 'Unable to load businesses');
    } finally {
      setCatalogLoading(false);
    }
  }, [businessIdParam]);

  useEffect(() => {
    void fetchBusinesses();
  }, [fetchBusinesses]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedBusiness) {
      toast({ title: 'Select a business', description: 'Choose a Caberu workspace to log in to before continuing.' });
      return;
    }
    setAuthLoading(true);
    try {
      const profile = await login(form.email, form.password);
      toast({ title: 'Welcome back to Caberu!' });
      const redirect = params.get('redirect') ?? (profile.role === 'professional' ? '/dashboard/pro' : '/dashboard/client');
      navigate(redirect);
    } catch (error: any) {
      toast({ title: 'Login failed', description: error.message, variant: 'destructive' });
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[1.4fr,1fr]">
          <Card className="border border-slate-200 bg-white/90 shadow-xl">
            <CardHeader>
              <CardTitle size="lg" className="text-slate-900">
                Choose your Caberu workspace
              </CardTitle>
              <CardDescription className="text-slate-500">
                Browse all available businesses and pick the one you want to access.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {catalogLoading && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-32 rounded-2xl border border-slate-200 bg-slate-100/60 animate-pulse"
                    />
                  ))}
                </div>
              )}

              {!catalogLoading && catalogError && (
                <div className="space-y-4 rounded-2xl border border-amber-300 bg-amber-50 p-6 text-sm text-amber-800">
                  <p>{catalogError}</p>
                  <Button variant="outline" className="border-teal-400 text-teal-600" onClick={() => void fetchBusinesses()}>
                    Try again
                  </Button>
                </div>
              )}

              {!catalogLoading && !catalogError && businesses.length === 0 && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-sm text-slate-600">
                  No businesses are available yet. Create one from the homepage to get started.
                </div>
              )}

              {!catalogLoading && !catalogError && businesses.length > 0 && (
                <div className="grid gap-4 sm:grid-cols-2">
                  {businesses.map((business) => (
                    <button
                      key={business.id}
                      type="button"
                      className={cn(
                        'group rounded-3xl border-2 p-5 text-left transition focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2',
                        selectedBusiness?.id === business.id
                          ? 'border-teal-500 bg-teal-50 shadow-lg'
                          : 'border-slate-200 bg-white hover:border-teal-300 hover:shadow-md'
                      )}
                      onClick={() => setSelectedBusiness(business)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-lg font-semibold text-slate-900">{business.name}</p>
                          <p className="text-sm text-slate-500">{business.category}</p>
                        </div>
                        {selectedBusiness?.id === business.id && (
                          <span className="rounded-full bg-teal-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white">
                            Selected
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-600">
                        {business.ownerName && (
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                            Owner: {business.ownerName}
                          </span>
                        )}
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {business.servicesCount ?? 0} services
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {business.professionalsCount ?? 0} team
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                          {business.appointmentsCount ?? 0} bookings
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <div className="self-start">
            <div className="rounded-3xl border border-slate-200 bg-white/90 p-8 shadow-xl">
              <h1 className="text-3xl font-semibold text-slate-900">Log in to Caberu</h1>
              <p className="mt-2 text-sm text-slate-500">
                {selectedBusiness
                  ? `You're signing in to ${selectedBusiness.name}.`
                  : 'Select a business on the left to enable sign-in.'}
              </p>
              <form onSubmit={onSubmit} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                    required
                    disabled={!selectedBusiness}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
                    required
                    disabled={!selectedBusiness}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-teal-500 hover:bg-teal-600"
                  disabled={!selectedBusiness || authLoading}
                >
                  {authLoading ? 'Signing in…' : 'Sign in'}
                </Button>
              </form>
              <p className="mt-4 text-sm text-slate-500">
                New to Caberu?{' '}
                <button className="font-medium text-teal-600 underline" onClick={() => navigate('/signup')}>
                  Create an account
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
};
