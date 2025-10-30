import type { FC } from 'react';

export const SiteFooter: FC = () => {
  return (
    <footer className="border-t bg-slate-50">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-lg font-semibold text-slate-700">caberu</p>
          <p className="text-sm text-slate-500">Caberu Consulting SRL · Empowering independent professionals with AI.</p>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500">
          <a href="/gdpr" className="hover:text-teal-600">GDPR</a>
          <a href="/privacy" className="hover:text-teal-600">Privacy Policy</a>
          <a href="/terms" className="hover:text-teal-600">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
};
