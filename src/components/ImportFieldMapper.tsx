import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, X } from 'lucide-react';

interface ImportFieldMapperProps {
  csvHeaders: string[];
  fieldMapping: Record<string, string>;
  onChange: (mapping: Record<string, string>) => void;
  importType: 'patients' | 'appointments' | 'inventory';
}

const PATIENT_FIELDS = [
  { value: 'first_name', label: 'First Name', required: true },
  { value: 'last_name', label: 'Last Name', required: true },
  { value: 'email', label: 'Email', required: true },
  { value: 'phone', label: 'Phone', required: false },
  { value: 'date_of_birth', label: 'Date of Birth', required: false },
  { value: 'address', label: 'Address', required: false },
  { value: 'medical_history', label: 'Medical History', required: false },
  { value: 'emergency_contact', label: 'Emergency Contact', required: false },
];

const APPOINTMENT_FIELDS = [
  { value: 'patient_email', label: 'Patient Email', required: true },
  { value: 'appointment_date', label: 'Appointment Date', required: true },
  { value: 'reason', label: 'Reason', required: false },
  { value: 'urgency', label: 'Urgency Level', required: false },
  { value: 'duration_minutes', label: 'Duration (minutes)', required: false },
  { value: 'notes', label: 'Notes', required: false },
];

export function ImportFieldMapper({ csvHeaders, fieldMapping, onChange, importType }: ImportFieldMapperProps) {
  const targetFields = importType === 'patients' ? PATIENT_FIELDS : APPOINTMENT_FIELDS;
  
  const handleFieldMapping = (csvField: string, targetField: string) => {
    const newMapping = { ...fieldMapping };
    
    // Remove any existing mapping for this target field
    Object.keys(newMapping).forEach(key => {
      if (newMapping[key] === targetField) {
        delete newMapping[key];
      }
    });
    
    // Add new mapping
    if (targetField && targetField !== 'none') {
      newMapping[csvField] = targetField;
    } else {
      delete newMapping[csvField];
    }
    
    onChange(newMapping);
  };

  const clearMapping = (csvField: string) => {
    const newMapping = { ...fieldMapping };
    delete newMapping[csvField];
    onChange(newMapping);
  };

  const requiredFieldsMapped = targetFields
    .filter(field => field.required)
    .every(field => Object.values(fieldMapping).includes(field.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Field Mapping
          {!requiredFieldsMapped && (
            <Badge variant="destructive">Required fields missing</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CSV Fields */}
          <div>
            <h3 className="font-medium mb-4">CSV Fields</h3>
            <div className="space-y-3">
              {csvHeaders.map((header, index) => {
                const mappedTo = fieldMapping[header];
                const mappedField = targetFields.find(f => f.value === mappedTo);
                
                return (
                  <div key={index} className="flex items-center gap-3">
                    <div className="flex-1 p-3 bg-muted/50 rounded-lg">
                      <div className="font-medium">{header}</div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                       <Select 
                         value={mappedTo || 'none'} 
                         onValueChange={(value) => handleFieldMapping(header, value)}
                       >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Map to field..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No mapping</SelectItem>
                          {targetFields.map(field => (
                            <SelectItem 
                              key={field.value} 
                              value={field.value}
                              disabled={Object.values(fieldMapping).includes(field.value) && fieldMapping[header] !== field.value}
                            >
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      
                      {mappedTo && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => clearMapping(header)}
                          className="p-1 h-8 w-8"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Target Fields Status */}
          <div>
            <h3 className="font-medium mb-4">Target Fields</h3>
            <div className="space-y-2">
              {targetFields.map(field => {
                const isMapped = Object.values(fieldMapping).includes(field.value);
                
                return (
                  <div 
                    key={field.value}
                    className={`p-3 rounded-lg border ${
                      isMapped 
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                        : field.required 
                        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                        : 'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{field.label}</span>
                      <div className="flex items-center gap-2">
                        {field.required && (
                          <Badge variant={isMapped ? 'default' : 'destructive'} className="text-xs">
                            Required
                          </Badge>
                        )}
                        {isMapped && (
                          <Badge variant="secondary" className="text-xs">
                            Mapped
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mapping Summary */}
        <div className="border-t pt-4">
          <h4 className="font-medium mb-2">Mapping Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total Fields:</span>
              <span className="ml-2 font-medium">{csvHeaders.length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Mapped:</span>
              <span className="ml-2 font-medium">{Object.keys(fieldMapping).length}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Required Missing:</span>
              <span className={`ml-2 font-medium ${!requiredFieldsMapped ? 'text-red-500' : 'text-green-500'}`}>
                {requiredFieldsMapped ? '0' : targetFields.filter(f => f.required && !Object.values(fieldMapping).includes(f.value)).length}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}