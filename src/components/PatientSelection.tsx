import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Search, User } from "lucide-react";

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface PatientSelectionProps {
  onSelect: (patient: Patient) => void;
  selectedPatient?: Patient | null;
}

export function PatientSelection({ onSelect, selectedPatient }: PatientSelectionProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [patients, setPatients] = useState<Patient[]>([]);

  const mockPatients: Patient[] = [
    { id: "1", first_name: "John", last_name: "Doe", email: "john@example.com" },
    { id: "2", first_name: "Jane", last_name: "Smith", email: "jane@example.com" }
  ];

  useEffect(() => {
    setPatients(mockPatients);
  }, []);

  const filteredPatients = patients.filter(p => 
    `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search patients..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>
      
      <div className="max-h-60 overflow-y-auto space-y-2">
        {filteredPatients.map((patient) => (
          <Card 
            key={patient.id}
            className={`cursor-pointer hover:bg-gray-50 ${
              selectedPatient?.id === patient.id ? 'ring-2 ring-blue-500' : ''
            }`}
            onClick={() => onSelect(patient)}
          >
            <CardContent className="p-3">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">{patient.first_name} {patient.last_name}</p>
                  <p className="text-sm text-gray-500">{patient.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}