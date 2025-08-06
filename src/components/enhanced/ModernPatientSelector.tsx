import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, User, CheckCircle, X, UserPlus } from "lucide-react";
import { ModernLoadingSpinner } from "./ModernLoadingSpinner";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  total_appointments?: number;
  upcoming_appointments?: number;
}

interface ModernPatientSelectorProps {
  onSelect: (patient: Patient) => void;
  onCancel: () => void;
  selectedPatient?: Patient | null;
  title?: string;
  description?: string;
  allowNewPatient?: boolean;
  onCreateNewPatient?: () => void;
}

export function ModernPatientSelector({
  onSelect,
  onCancel,
  selectedPatient,
  title = "Select Patient",
  description = "Choose a patient to continue",
  allowNewPatient = false,
  onCreateNewPatient
}: ModernPatientSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock patients for demo
  const mockPatients: Patient[] = [
    { 
      id: "1", 
      first_name: "John", 
      last_name: "Doe", 
      email: "john@example.com",
      phone: "+1234567890",
      total_appointments: 5,
      upcoming_appointments: 1
    },
    { 
      id: "2", 
      first_name: "Jane", 
      last_name: "Smith", 
      email: "jane@example.com",
      phone: "+1987654321",
      total_appointments: 12,
      upcoming_appointments: 0
    },
    { 
      id: "3", 
      first_name: "Michael", 
      last_name: "Johnson", 
      email: "michael@example.com",
      total_appointments: 3,
      upcoming_appointments: 2
    }
  ];

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setPatients(mockPatients);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const filteredPatients = patients.filter(patient => 
    `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phone?.includes(searchTerm)
  );

  const getPatientStatus = (patient: Patient) => {
    if (patient.upcoming_appointments && patient.upcoming_appointments > 0) {
      return { text: "Active", variant: "default" as const, color: "text-dental-success" };
    }
    if (patient.total_appointments && patient.total_appointments > 0) {
      return { text: "Returning", variant: "secondary" as const, color: "text-dental-info" };
    }
    return { text: "New", variant: "outline" as const, color: "text-dental-warning" };
  };

  const getInitials = (patient: Patient) => {
    return `${patient.first_name?.[0] || ''}${patient.last_name?.[0] || ''}`.toUpperCase();
  };

  if (loading) {
    return (
      <Card className="w-full max-w-2xl mx-auto glass-card">
        <CardContent className="p-8">
          <ModernLoadingSpinner 
            size="lg" 
            message="Loading patients..." 
            description="Please wait while we fetch the patient list"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto glass-card">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="gradient-text text-2xl">{title}</CardTitle>
            <p className="text-dental-muted-foreground mt-1">{description}</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onCancel}
            className="hover:bg-dental-error/10 hover:text-dental-error"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-dental-muted-foreground" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-xl border-dental-primary/20 focus:border-dental-primary bg-white/50 backdrop-blur-sm"
          />
        </div>

        {/* New Patient Option */}
        {allowNewPatient && onCreateNewPatient && (
          <Card 
            className="cursor-pointer hover:shadow-soft transition-all duration-200 border-dashed border-2 border-dental-primary/30 hover:border-dental-primary/60"
            onClick={onCreateNewPatient}
          >
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-dental-primary/10 flex items-center justify-center">
                  <UserPlus className="h-6 w-6 text-dental-primary" />
                </div>
                <div>
                  <p className="font-semibold text-dental-primary">Add New Patient</p>
                  <p className="text-sm text-dental-muted-foreground">Register a new patient in the system</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Patient List */}
        <div className="max-h-96 overflow-y-auto space-y-3 scroll-smooth">
          {filteredPatients.length === 0 ? (
            <Card variant="glass" className="p-8 text-center">
              <div className="flex flex-col items-center space-y-3">
                <User className="h-12 w-12 text-dental-muted-foreground opacity-50" />
                <p className="text-dental-muted-foreground">No patients found</p>
                <p className="text-sm text-dental-muted-foreground">
                  {searchTerm ? "Try adjusting your search terms" : "No patients registered yet"}
                </p>
              </div>
            </Card>
          ) : (
            filteredPatients.map((patient) => {
              const status = getPatientStatus(patient);
              const isSelected = selectedPatient?.id === patient.id;
              
              return (
                <Card 
                  key={patient.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-soft border-l-4 ${
                    isSelected 
                      ? 'border-l-dental-primary bg-dental-primary/5 ring-2 ring-dental-primary/20' 
                      : 'border-l-transparent hover:border-l-dental-primary/50'
                  }`}
                  onClick={() => onSelect(patient)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="relative">
                          <Avatar className="h-12 w-12 ring-2 ring-dental-primary/10">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${patient.first_name}${patient.last_name}`} />
                            <AvatarFallback className="bg-gradient-primary text-white">
                              {getInitials(patient)}
                            </AvatarFallback>
                          </Avatar>
                          {isSelected && (
                            <CheckCircle className="absolute -top-1 -right-1 h-5 w-5 text-dental-success bg-white rounded-full" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-semibold text-dental-foreground truncate">
                              {patient.first_name} {patient.last_name}
                            </p>
                            <Badge variant={status.variant} className={status.color}>
                              {status.text}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-dental-muted-foreground truncate">
                            {patient.email}
                          </p>
                          
                          {patient.phone && (
                            <p className="text-xs text-dental-muted-foreground">
                              {patient.phone}
                            </p>
                          )}
                          
                          {(patient.total_appointments || patient.upcoming_appointments) && (
                            <div className="flex items-center space-x-4 mt-1">
                              {patient.total_appointments && (
                                <span className="text-xs text-dental-muted-foreground">
                                  {patient.total_appointments} visits
                                </span>
                              )}
                              {patient.upcoming_appointments && patient.upcoming_appointments > 0 && (
                                <span className="text-xs text-dental-primary font-medium">
                                  {patient.upcoming_appointments} upcoming
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <Button 
                          variant={isSelected ? "default" : "outline"}
                          size="sm"
                          className={`transition-all ${
                            isSelected ? 'bg-dental-primary text-white' : 'hover:bg-dental-primary/5'
                          }`}
                        >
                          {isSelected ? 'Selected' : 'Select'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-2 pt-4 border-t border-dental-primary/10">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          {selectedPatient && (
            <Button 
              variant="gradient" 
              onClick={() => onSelect(selectedPatient)}
            >
              Continue with {selectedPatient.first_name}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}