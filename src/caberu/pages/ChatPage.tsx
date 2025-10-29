import type { FC } from 'react';
import { MainNav } from '../components/MainNav';
import { SiteFooter } from '../components/SiteFooter';
import { ChatPanel } from '../components/ChatPanel';
import { useAuth } from '../context/AuthContext';

export const ChatPage: FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50">
      <MainNav />
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-12">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-wide text-teal-600">AI concierge</p>
          <h1 className="text-3xl font-semibold text-slate-900">Caberu chat</h1>
          <p className="text-sm text-slate-500">Automated support for {user?.role === 'professional' ? 'your clients' : 'your appointments'}.</p>
        </div>
        <ChatPanel professionalId={user?.businessId ?? undefined} />
      </main>
      <SiteFooter />
    </div>
  );
};
