import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useNavigate, Link } from "react-router-dom";
import { Menu, X, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";

interface HeaderProps {
  user: User | null;
  minimal?: boolean;
}

export const Header = ({ user, minimal = false }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigation = [
    { name: "Features", href: "/#features" }, // Changed to anchor for homepage features
    { name: "Pricing", href: "/pricing" },
    { name: "About", href: "/about" },
    { name: "Support", href: "/support" },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 w-full z-50 transition-all duration-300 border-b",
        scrolled
          ? "bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-gray-200 dark:border-gray-800 py-2 shadow-sm"
          : "bg-transparent border-transparent py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center group">
            <Logo
              variant="full"
              size="sm"
              className="h-8 group-hover:scale-105 transition-transform duration-300"
            />
          </Link>

          {/* Desktop Navigation */}
          {!minimal && (
            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="text-sm font-medium text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 transition-colors relative group"
                >
                  {item.name}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full"></span>
                </Link>
              ))}
            </nav>
          )}

          {/* Auth Buttons & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="hidden sm:inline-flex rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>

            {!user ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() => navigate("/login")}
                  className="hidden sm:inline-flex text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => navigate("/signup")}
                  className="bg-gray-900 hover:bg-gray-800 text-white rounded-full px-6 shadow-lg hover:shadow-xl transition-all hover:-translate-y-0.5"
                >
                  Get Started
                </Button>
              </>
            ) : (
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-6 shadow-lg"
              >
                Dashboard
              </Button>
            )}

            {/* Mobile Menu Toggle */}
            {!minimal && (
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden p-2 text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && !minimal && (
          <div className="md:hidden py-4 mt-2 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 absolute left-0 right-0 px-4 shadow-xl animate-in slide-in-from-top-5">
            <nav className="space-y-3">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className="block text-gray-600 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 font-medium py-2 px-3 rounded-lg hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!user && (
                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 mt-3">
                  <Link
                    to="/login"
                    className="block text-center text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium py-3"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Button
                    className="w-full rounded-full mt-2"
                    onClick={() => {
                      navigate("/signup");
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    Get Started
                  </Button>
                </div>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
