import { useNavigate, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { UserCog, User, Stethoscope } from "lucide-react";

export function RoleSwitcher() {
  const { isDentist, isPatient, loading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading || (!isDentist || !isPatient)) {
    return null;
  }

  const isOnDentistRoute = location.pathname.startsWith('/dentist');
  const currentRole = isOnDentistRoute ? 'dentist' : 'patient';

  const switchToPatient = () => {
    navigate('/patient');
  };

  const switchToDentist = () => {
    navigate('/dentist');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserCog className="h-4 w-4" />
          {currentRole === 'dentist' ? 'Dentist View' : 'Patient View'}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Switch View</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem 
          onClick={switchToPatient}
          disabled={currentRole === 'patient'}
          className="gap-2"
        >
          <User className="h-4 w-4" />
          Patient View
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={switchToDentist}
          disabled={currentRole === 'dentist'}
          className="gap-2"
        >
          <Stethoscope className="h-4 w-4" />
          Dentist View
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
