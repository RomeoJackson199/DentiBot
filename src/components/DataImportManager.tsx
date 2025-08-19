import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Users, Calendar, DollarSign, CheckCircle, AlertCircle, Clock, Download } from 'lucide-react';
import { supabase, getFunctionUrl } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ImportJob {
  id: string;
  filename: string;
  total_rows: number;
  processed_rows: number;
  successful_rows: number;
  failed_rows: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  import_type: 'appointments' | 'patients' | 'treatments' | 'financial';
  created_at: string;
  completed_at?: string;
}

const importTypes = [
  {
    id: 'appointments',
    label: 'Appointments',
    icon: Calendar,
    description: 'Import appointment schedules with patient information',
    sampleHeaders: ['Patient Name', 'Patient Email', 'Date', 'Time', 'Reason', 'Status']
  },
  {
    id: 'patients',
    label: 'Patients',
    icon: Users,
    description: 'Import patient demographics and contact information',
    sampleHeaders: ['First Name', 'Last Name', 'Email', 'Phone', 'Date of Birth']
  },
  {
    id: 'treatments',
    label: 'Treatments',
    icon: FileText,
    description: 'Import treatment plans and procedures',
    sampleHeaders: ['Patient Name', 'Treatment', 'Date', 'Cost', 'Status']
  },
  {
    id: 'financial',
    label: 'Financial',
    icon: DollarSign,
    description: 'Import payment history and financial records',
    sampleHeaders: ['Patient Name', 'Amount', 'Date', 'Type', 'Status']
  }
];

export default function DataImportManager() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [autoDetecting, setAutoDetecting] = useState(false);
  const [detectedType, setDetectedType] = useState<string>('');
  const [detectedFields, setDetectedFields] = useState<Record<string, string>>({});
  const [previewData, setPreviewData] = useState<any[]>([]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch import jobs
  const { data: importJobs = [], isLoading } = useQuery({
    queryKey: ['import-jobs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('import_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      return data as ImportJob[];
    },
    refetchInterval: 2000 // Refresh every 2 seconds to show progress
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      analyzeFile(selectedFile);
    }
  };

  const analyzeFile = async (file: File) => {
    setAutoDetecting(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const sampleRows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      const analysis = await smartFieldMapping(headers, sampleRows);
      setDetectedType(analysis.dataType);
      setDetectedFields(analysis.fieldMapping);
      setPreviewData(sampleRows.slice(0, 3));
      
      toast({
        title: "Smart Analysis Complete",
        description: `Detected: ${analysis.dataType} data with ${headers.length} fields`,
      });
    } catch (error) {
      console.error('File analysis failed:', error);
      toast({
        title: "Analysis failed",
        description: "Using manual mode instead",
        variant: "destructive"
      });
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleSmartImport = async () => {
    if (!file) {
      toast({
        title: "No file selected",
        description: "Please select a file to import",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const formData = new FormData();
      formData.append('file', file);
      formData.append('detectedType', detectedType);
      formData.append('fieldMapping', JSON.stringify(detectedFields));

      const response = await fetch(
        `${getFunctionUrl('smart-import')}?action=auto-import&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      toast({
        title: "Smart Import Complete!",
        description: `Successfully imported ${result.imported} records. All data is now available.`,
      });

      setFile(null);
      setDetectedType('');
      setDetectedFields({});
      setPreviewData([]);
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });

    } catch (error: any) {
      toast({
        title: "Import failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const smartFieldMapping = async (headers: string[], sampleData: any[]) => {
    // Advanced field mapping logic
    const fieldPatterns = {
      patient: {
        name: /^(patient|name|full_?name|client)$/i,
        first_name: /^(first|fname|given|patient_first)$/i,
        last_name: /^(last|lname|surname|family|patient_last)$/i,
        email: /^(email|mail|e_?mail|patient_email)$/i,
        phone: /^(phone|tel|telephone|mobile|cell|patient_phone)$/i,
        dob: /^(dob|birth|birthday|date_?of_?birth|born)$/i,
        address: /^(address|addr|street|location)$/i,
        insurance: /^(insurance|insurer|coverage|policy)$/i
      },
      appointment: {
        date: /^(date|appt_?date|appointment_?date|scheduled|when)$/i,
        time: /^(time|appt_?time|appointment_?time|hour|slot)$/i,
        reason: /^(reason|service|procedure|treatment|type|description)$/i,
        status: /^(status|state|condition)$/i,
        dentist: /^(dentist|doctor|dr|provider|practitioner)$/i,
        notes: /^(notes|comments|remarks|memo)$/i
      },
      treatment: {
        procedure: /^(procedure|treatment|service|code|dental_code)$/i,
        cost: /^(cost|price|fee|amount|charge)$/i,
        date: /^(date|treatment_date|service_date|performed)$/i,
        tooth: /^(tooth|teeth|tooth_number|dental_chart)$/i
      }
    };

    // Detect data type based on headers
    let scores = {
      patients: 0,
      appointments: 0,
      treatments: 0
    };

    for (const header of headers) {
      for (const [pattern, regex] of Object.entries(fieldPatterns.patient)) {
        if (regex.test(header)) scores.patients += 2;
      }
      for (const [pattern, regex] of Object.entries(fieldPatterns.appointment)) {
        if (regex.test(header)) scores.appointments += 2;
      }
      for (const [pattern, regex] of Object.entries(fieldPatterns.treatment)) {
        if (regex.test(header)) scores.treatments += 2;
      }
    }

    // Analyze data content for additional clues
    for (const row of sampleData) {
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string') {
          if (/^\d{4}-\d{2}-\d{2}/.test(value) || /^\d{2}\/\d{2}\/\d{4}/.test(value)) {
            scores.appointments += 1; // Date format suggests appointments
          }
          if (/@/.test(value)) {
            scores.patients += 1; // Email suggests patient data
          }
          if (/\$\d+/.test(value) || /^\d+\.\d{2}$/.test(value)) {
            scores.treatments += 1; // Price format suggests treatments
          }
        }
      }
    }

    const dataType = Object.entries(scores).reduce((a, b) => scores[a[0]] > scores[b[0]] ? a : b)[0];

    // Smart field mapping
    const fieldMapping: Record<string, string> = {};
    const relevantPatterns = fieldPatterns[dataType as keyof typeof fieldPatterns];

    for (const header of headers) {
      let bestMatch = header;
      let bestScore = 0;

      for (const [standardField, pattern] of Object.entries(relevantPatterns)) {
        if (pattern.test(header)) {
          const score = header.toLowerCase() === standardField ? 10 : 5;
          if (score > bestScore) {
            bestMatch = standardField;
            bestScore = score;
          }
        }
      }

      fieldMapping[header] = bestMatch;
    }

    return { dataType, fieldMapping };
  };

  const downloadSampleFile = (type: string) => {
    const headers = importTypes.find(t => t.id === type)?.sampleHeaders || [];
    const sampleData = getSampleData(type);
    
    const csvContent = [
      headers.join(','),
      ...sampleData.map(row => headers.map(h => row[h] || '').join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sample-${type}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getSampleData = (type: string) => {
    switch (type) {
      case 'appointments':
        return [
          {
            'Patient Name': 'John Smith',
            'Patient Email': 'john.smith@email.com',
            'Date': '2024-01-15',
            'Time': '09:00',
            'Reason': 'Routine Cleaning',
            'Status': 'confirmed'
          },
          {
            'Patient Name': 'Sarah Johnson',
            'Patient Email': 'sarah.j@email.com',
            'Date': '2024-01-15',
            'Time': '10:30',
            'Reason': 'Root Canal',
            'Status': 'pending'
          }
        ];
      case 'patients':
        return [
          {
            'First Name': 'Michael',
            'Last Name': 'Brown',
            'Email': 'michael.brown@email.com',
            'Phone': '+1-555-0123',
            'Date of Birth': '1985-06-15'
          },
          {
            'First Name': 'Emma',
            'Last Name': 'Wilson',
            'Email': 'emma.wilson@email.com',
            'Phone': '+1-555-0456',
            'Date of Birth': '1992-03-22'
          }
        ];
      default:
        return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-destructive" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-warning animate-pulse" />;
      default:
        return <Clock className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-success/10 text-success border-success/20';
      case 'failed':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'processing':
        return 'bg-warning/10 text-warning border-warning/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-foreground">Data Import</h2>
        <Badge variant="outline" className="text-muted-foreground">
          Professional Import System
        </Badge>
      </div>

      {/* Smart Import Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Smart Data Import
            <Badge variant="secondary" className="ml-2">AI-Powered</Badge>
          </CardTitle>
          <p className="text-muted-foreground">
            Upload any dental practice file - our AI will automatically detect data types and import everything correctly
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <div className="space-y-2">
              <p className="text-lg font-medium">
                {file ? file.name : 'Drop any dental practice file here'}
              </p>
              <p className="text-sm text-muted-foreground">
                CSV, Excel, or any format - we'll figure it out automatically
              </p>
            </div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="smart-upload"
            />
            <Button
              variant="outline"
              onClick={() => document.getElementById('smart-upload')?.click()}
              className="mt-4"
              disabled={autoDetecting}
            >
              {autoDetecting ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                'Choose File'
              )}
            </Button>
          </div>

          {/* Analysis Results */}
          {detectedType && (
            <Card className="bg-success/5 border-success/20">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="font-medium">Smart Analysis Complete</span>
                </div>
                <div className="space-y-2">
                  <p><span className="font-medium">Detected:</span> {detectedType.charAt(0).toUpperCase() + detectedType.slice(1)} data</p>
                  <p><span className="font-medium">Fields found:</span> {Object.keys(detectedFields).length}</p>
                  
                  {previewData.length > 0 && (
                    <div className="mt-4">
                      <p className="font-medium mb-2">Preview (first 3 rows):</p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border rounded">
                          <thead className="bg-muted/50">
                            <tr>
                              {Object.keys(previewData[0]).map(header => (
                                <th key={header} className="px-2 py-1 text-left border-r">
                                  {header}
                                  <div className="text-xs text-muted-foreground">
                                    → {detectedFields[header] || header}
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((row, idx) => (
                              <tr key={idx} className="border-t">
                                {Object.values(row).map((value: any, i) => (
                                  <td key={i} className="px-2 py-1 border-r">{value}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          <Button
            onClick={handleSmartImport}
            disabled={!file || !detectedType || uploading}
            className="w-full"
            size="lg"
          >
            {uploading ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Import All Data Automatically
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Import History */}
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded" />
              ))}
            </div>
          ) : importJobs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No import jobs yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {importJobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(job.status)}
                      <span className="font-medium">{job.filename}</span>
                      <Badge className={getStatusColor(job.status)}>
                        {job.status}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {new Date(job.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  {job.status === 'processing' && (
                    <div className="mb-2">
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{job.processed_rows} / {job.total_rows}</span>
                      </div>
                      <Progress 
                        value={(job.processed_rows / job.total_rows) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total:</span>
                      <span className="ml-1 font-medium">{job.total_rows}</span>
                    </div>
                    <div>
                      <span className="text-success">Success:</span>
                      <span className="ml-1 font-medium">{job.successful_rows}</span>
                    </div>
                    <div>
                      <span className="text-destructive">Failed:</span>
                      <span className="ml-1 font-medium">{job.failed_rows}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}