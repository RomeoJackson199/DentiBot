import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Calendar, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  user: User | null;
  minimal?: boolean;
}

export const Header = ({ user, minimal = false }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    { name: "About", href: "/about" },
    { name: "Support", href: "/support" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <a href="/" className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Caberu</span>
          </a>

          {/* Desktop Navigation */}
          {!minimal && (
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
                >
                  {item.name}
                </a>
              ))}
            </nav>
          )}

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            {!user && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => (window.location.href = "/login")}
                  className="hidden sm:inline-flex"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => (window.location.href = "/signup")}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Get Started
                </Button>
              </>
            )}

            {user && (
              <Button
                size="sm"
                onClick={() => (window.location.href = "/dashboard")}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Dashboard
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            {!minimal && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && !minimal && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="space-y-3">
              {navigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="block text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </a>
              ))}
              {!user && (
                <div className="pt-3 border-t border-gray-200">
                  <a
                    href="/login"
                    className="block text-gray-600 hover:text-gray-900 transition-colors font-medium py-2"
                  >
                    Sign In
                  </a>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
