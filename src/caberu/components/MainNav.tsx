import type { FC, MouseEvent } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm font-medium transition-colors hover:text-teal-600 ${isActive ? 'text-teal-600' : 'text-slate-600'}`;

export const MainNav: FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleAnchorClick = (event: MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    event.preventDefault();
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      navigate(`/#${sectionId}`);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
        <Link to="/" className="font-semibold text-lg lowercase text-slate-900">
          <span className="text-teal-600">caberu</span>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          <NavLink to="/" className={navLinkClass} end>
            Home
          </NavLink>
          <Link to="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600" onClick={(event) => handleAnchorClick(event, 'features')}>
            Features
          </Link>
          <Link to="/" className="text-sm font-medium text-slate-600 transition-colors hover:text-teal-600" onClick={(event) => handleAnchorClick(event, 'industries')}>
            Industries
          </Link>
          {user?.role === 'professional' && (
            <NavLink to="/dashboard/pro" className={navLinkClass}>
              Professional
            </NavLink>
          )}
          {user?.role === 'client' && (
            <NavLink to="/dashboard/client" className={navLinkClass}>
              Client
            </NavLink>
          )}
          {user && (
            <NavLink to="/chat" className={navLinkClass}>
              Chat
            </NavLink>
          )}
        </nav>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <span className="hidden text-sm text-slate-500 md:inline-flex">
                {user.name} · {user.role}
              </span>
              <Button variant="outline" className="border-teal-500 text-teal-600" onClick={() => navigate('/dashboard/' + (user.role === 'professional' ? 'pro' : 'client'))}>
                Dashboard
              </Button>
              <Button className="bg-teal-500 hover:bg-teal-600" onClick={handleLogout}>
                Log out
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={() => navigate('/login')}>
                Log in
              </Button>
              <Button className="bg-teal-500 hover:bg-teal-600" onClick={() => navigate('/signup')}>
                Get started
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
