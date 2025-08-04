import { Button } from "@/components/ui/button";
import { Stethoscope, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { LogoutButton } from "../LogoutButton";

export const SimpleHeader = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 flex">
          <Link to="/" className="mr-6 flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary/80 rounded-lg flex items-center justify-center">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="hidden font-bold sm:inline-block text-lg">
              🦷 DentalCare
            </span>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <nav className="flex items-center space-x-3">
            <LogoutButton />
            <Link to="/auth">
              <Button 
                variant="ghost" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign In
              </Button>
            </Link>
            <Link to="/auth">
              <Button 
                variant="default" 
                size="sm" 
                className="flex items-center gap-2"
              >
                <UserPlus className="h-4 w-4" />
                Get Started
              </Button>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
};