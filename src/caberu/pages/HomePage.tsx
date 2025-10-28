import type { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { MainNav } from '../components/MainNav';
import { SiteFooter } from '../components/SiteFooter';

const features = [
  {
    title: 'AI assistant',
    description: 'Automate replies, FAQs, and rescheduling with a GPT-4 powered concierge tailored to your brand tone.',
  },
  {
    title: 'Smart scheduling',
    description: 'Let clients self-book with availability rules, buffers, and AI slot suggestions across time zones.',
  },
  {
    title: 'Stripe payments',
    description: 'Collect one-time payments or subscriptions, sync invoices, and trigger automated reminders.',
  },
  {
    title: 'Actionable insights',
    description: 'Track retention, revenue trends, and utilisation to grow every service line you offer.',
  },
];

const industries = ['Dental practices', 'Beauty studios', 'Fitness & gyms', 'Mental health', 'Wellness coaching', 'Consulting'];

export const HomePage: FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 font-[\'Inter\',sans-serif] text-slate-800">
      <MainNav />
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-16">
        <section className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6">
            <span className="inline-flex rounded-full bg-teal-100 px-3 py-1 text-sm font-medium text-teal-700">AI-powered automation</span>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
              Run your business on autopilot — with AI.
            </h1>
            <p className="text-lg text-slate-600">
              Caberu unifies scheduling, payments, analytics, and messaging so you can focus on delivering exceptional care.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button size="lg" className="bg-teal-500 text-base font-semibold text-white hover:bg-teal-600" onClick={() => navigate('/signup?role=professional')}>
                Start as professional
              </Button>
              <Button size="lg" variant="outline" className="border-teal-400 text-base font-semibold text-teal-600" onClick={() => navigate('/signup?role=client')}>
                Book as client
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="border border-transparent bg-white/70 text-base font-semibold text-teal-600 shadow-sm hover:bg-white hover:text-teal-700"
                asChild
              >
                <a href="https://dentibot.lovable.app/create-business" target="_blank" rel="noreferrer">
                  Create your own business
                </a>
              </Button>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
              <span className="font-medium text-slate-700">Trusted across industries:</span>
              {industries.map((industry) => (
                <span key={industry} className="rounded-full bg-white/60 px-3 py-1 shadow-sm">
                  {industry}
                </span>
              ))}
            </div>
          </div>
          <Card className="border-none bg-gradient-to-br from-teal-100 via-sky-100 to-white shadow-xl">
            <CardContent className="space-y-4 p-8">
              <h2 className="text-2xl font-semibold text-slate-800">Everything in one workspace</h2>
              <p className="text-sm text-slate-600">
                Caberu streamlines appointments, chat automation, and revenue for independent professionals.
              </p>
              <div className="space-y-3 rounded-2xl bg-white/80 p-4 shadow-inner">
                <p className="text-sm font-medium text-slate-500">Next 24 hours</p>
                <div className="space-y-2">
                  <div className="rounded-xl border border-teal-100 bg-teal-50 p-3 text-sm text-slate-700">
                    08:30 · Invisalign consult · Stripe paid
                  </div>
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 text-sm text-slate-700">
                    12:00 · Strength training session · Reminder sent
                  </div>
                  <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 text-sm text-slate-700">
                    18:00 · Mindfulness coaching · Awaiting payment
                  </div>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Automation</p>
                  <p className="text-lg font-semibold text-teal-600">24/7 concierge</p>
                  <p className="text-sm text-slate-500">Respond instantly to booking requests with AI.</p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Insights</p>
                  <p className="text-lg font-semibold text-sky-600">+32% retention</p>
                  <p className="text-sm text-slate-500">Customers stay longer when nurtured with Caberu.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="mt-24 space-y-10" id="features">
          <div className="space-y-3 text-center">
            <span className="text-sm font-semibold uppercase tracking-wide text-teal-600">Capabilities</span>
            <h2 className="text-3xl font-bold text-slate-900">Everything clients expect — fully automated</h2>
            <p className="mx-auto max-w-2xl text-base text-slate-600">
              Modular building blocks that work for dentists, stylists, trainers, therapists, and consultants alike.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            {features.map((feature) => (
              <Card key={feature.title} className="border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="space-y-2 p-6">
                  <h3 className="text-xl font-semibold text-slate-800">{feature.title}</h3>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-24 grid gap-12 lg:grid-cols-[1.2fr,0.8fr]" id="industries">
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900">Built for every professional service</h2>
            <p className="text-base text-slate-600">
              Personalise your services, message templates, and payment flows. Caberu adapts to your business, not the other way around.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {industries.map((industry) => (
                <div key={industry} className="rounded-xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-semibold text-slate-700">{industry}</p>
                  <p className="text-xs text-slate-500">Automated scheduling, branded receipts, and smart reminders.</p>
                </div>
              ))}
            </div>
          </div>
          <Card className="border-none bg-gradient-to-br from-sky-100 via-white to-teal-100 shadow-lg">
            <CardContent className="space-y-4 p-8">
              <h3 className="text-2xl font-semibold text-slate-800">Testimonials</h3>
              <p className="text-sm text-slate-600">“Caberu replaced three tools and reduced no-shows by 45%.”</p>
              <p className="text-sm font-medium text-slate-700">— Laura, dental studio owner</p>
              <p className="text-sm text-slate-600">“The AI concierge replies to leads before I even look at my phone.”</p>
              <p className="text-sm font-medium text-slate-700">— Malik, personal trainer</p>
            </CardContent>
          </Card>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
};
