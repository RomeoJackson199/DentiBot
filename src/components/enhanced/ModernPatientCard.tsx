import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAccessibleButtonProps } from "@/lib/accessibility";
import { 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Activity,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  date_of_birth?: string;
  address?: string;
  last_appointment?: string;
  total_appointments: number;
  upcoming_appointments: number;
}

interface ModernPatientCardProps {
  patient: Patient;
  onSelect?: (patient: Patient) => void;
  onViewDetails?: (patient: Patient) => void;
  variant?: "compact" | "detailed";
}

export function ModernPatientCard({ 
  patient, 
  onSelect, 
  onViewDetails, 
  variant = "detailed" 
}: ModernPatientCardProps) {
  const getInitials = () => {
    return `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
  };

  const getPatientStatusBadge = () => {
    if (patient.upcoming_appointments > 0) {
      return { text: "Active", variant: "default" as const, color: "text-green-600" };
    }
    if (patient.total_appointments > 0) {
      return { text: "Returning", variant: "secondary" as const, color: "text-blue-600" };
    }
    return { text: "New", variant: "outline" as const, color: "text-orange-600" };
  };

  const status = getPatientStatusBadge();

  if (variant === "compact") {
    return (
      <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer border-l-4 border-l-dental-primary/20 hover:border-l-dental-primary/60"
        onClick={() => onSelect?.(patient)}
        role="button"
        tabIndex={0}
        aria-label={`Select patient ${patient.first_name} ${patient.last_name}`}
      >
        <CardContent className="p-4" onClick={() => onSelect?.(patient)}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.first_name}${patient.last_name}`} />
                <AvatarFallback className="bg-gradient-primary text-white">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-dental-foreground group-hover:text-dental-primary transition-colors">
                  {patient.first_name} {patient.last_name}
                </p>
                <p className="text-sm text-dental-muted-foreground">{patient.email}</p>
              </div>
            </div>
            <Badge variant={status.variant} className={status.color}>
              {status.text}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group hover:shadow-elegant transition-all duration-300 border-l-4 border-l-dental-primary/20 hover:border-l-dental-primary overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16 ring-2 ring-dental-primary/10 group-hover:ring-dental-primary/30 transition-all">
              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.first_name}${patient.last_name}`} />
              <AvatarFallback className="bg-gradient-primary text-white text-lg font-semibold">
                {getInitials()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-dental-foreground group-hover:text-dental-primary transition-colors">
                {patient.first_name} {patient.last_name}
              </h3>
              <div className="flex items-center space-x-4 text-sm text-dental-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Mail className="h-4 w-4" />
                  <span>{patient.email}</span>
                </div>
                {patient.phone && (
                  <div className="flex items-center space-x-1">
                    <Phone className="h-4 w-4" />
                    <span>{patient.phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          <Badge variant={status.variant} className={`${status.color} shadow-soft`}>
            {status.text}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 rounded-lg bg-dental-primary/5 border border-dental-primary/10">
            <div className="flex items-center justify-center mb-1">
              <Activity className="h-4 w-4 text-dental-primary" />
            </div>
            <p className="text-2xl font-bold text-dental-primary">{patient.total_appointments}</p>
            <p className="text-xs text-dental-muted-foreground">Total Visits</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-dental-accent/5 border border-dental-accent/10">
            <div className="flex items-center justify-center mb-1">
              <Calendar className="h-4 w-4 text-dental-accent" />
            </div>
            <p className="text-2xl font-bold text-dental-accent">{patient.upcoming_appointments}</p>
            <p className="text-xs text-dental-muted-foreground">Upcoming</p>
          </div>
          
          <div className="text-center p-3 rounded-lg bg-dental-secondary/5 border border-dental-secondary/10">
            <div className="flex items-center justify-center mb-1">
              <Clock className="h-4 w-4 text-dental-secondary" />
            </div>
            <p className="text-sm font-semibold text-dental-secondary">
              {patient.last_appointment ? 'Recent' : 'Never'}
            </p>
            <p className="text-xs text-dental-muted-foreground">Last Visit</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2">
          {patient.date_of_birth && (
            <div className="flex items-center space-x-2 text-sm text-dental-muted-foreground">
              <User className="h-4 w-4" />
              <span>Born: {new Date(patient.date_of_birth).toLocaleDateString()}</span>
            </div>
          )}
          
          {patient.address && (
            <div className="flex items-center space-x-2 text-sm text-dental-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span className="truncate">{patient.address}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2 border-t border-dental-primary/10">
          {onSelect && (
            <Button 
              onClick={() => onSelect(patient)}
              variant="gradient"
              size="sm"
              className="flex-1"
            >
              <Calendar className="h-4 w-4 mr-2" />
              Select Patient
            </Button>
          )}
          
          {onViewDetails && (
            <Button 
              onClick={() => onViewDetails(patient)}
              variant="outline"
              size="sm"
              className="flex-1"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              View Details
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}