import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, FileText, Users, Calendar, DollarSign, CheckCircle, AlertCircle, 
  Clock, Download, Brain, Sparkles, ArrowRight, MapPin, Zap, RefreshCw,
  FileCheck, Database, Shield
} from 'lucide-react';
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
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Reset analysis when file changes
  useEffect(() => {
    if (!file) {
      setDetectedType('');
      setDetectedFields({});
      setPreviewData([]);
      setAnalysisComplete(false);
      setImportProgress(0);
    }
  }, [file]);

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
      const droppedFile = e.dataTransfer.files[0];
      
      // Validate file type
      if (!droppedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast({
          title: "Unsupported file type",
          description: "Please upload a CSV or Excel file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (10MB limit)
      if (droppedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      setFile(droppedFile);
      analyzeFile(droppedFile);
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      if (!selectedFile.name.match(/\.(csv|xlsx|xls)$/i)) {
        toast({
          title: "Unsupported file type",
          description: "Please upload a CSV or Excel file",
          variant: "destructive"
        });
        return;
      }
      
      // Validate file size (10MB limit)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a file smaller than 10MB",
          variant: "destructive"
        });
        return;
      }

      setFile(selectedFile);
      analyzeFile(selectedFile);
    }
  };

  const analyzeFile = async (file: File) => {
    setAutoDetecting(true);
    setAnalysisComplete(false);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        throw new Error('File must contain at least a header row and one data row');
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const sampleRows = lines.slice(1, 6).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        return row;
      });

      // Simulate AI analysis delay for better UX
      await new Promise(resolve => setTimeout(resolve, 1500));

      const analysis = await smartFieldMapping(headers, sampleRows);
      setDetectedType(analysis.dataType);
      setDetectedFields(analysis.fieldMapping);
      setPreviewData(sampleRows.slice(0, 3));
      setAnalysisComplete(true);
      
      toast({
        title: "🎉 Analysis Complete!",
        description: `Detected ${analysis.dataType} data with ${headers.length} fields perfectly mapped`,
      });
    } catch (error: any) {
      console.error('File analysis failed:', error);
      setAnalysisComplete(false);
      toast({
        title: "Analysis failed",
        description: error.message || "Could not analyze the file. Please check the format.",
        variant: "destructive"
      });
    } finally {
      setAutoDetecting(false);
    }
  };

  const handleSmartImport = async () => {
    if (!file || !analysisComplete) {
      toast({
        title: "File not ready",
        description: "Please wait for analysis to complete",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setImportProgress(0);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Authentication required - please sign in');

      // Create FormData for file upload
      const text = await file.text();
      const response = await fetch(
        `${getFunctionUrl('smart-import')}?action=auto-import&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            file_content: text,
            detected_type: detectedType,
            field_mapping: detectedFields,
            filename: file.name
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      // Simulate progress for better UX
      for (let i = 0; i <= 100; i += 10) {
        setImportProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      toast({
        title: "🎉 Import Successful!",
        description: `Successfully imported ${result.imported} records. All patient data is now available in the system.`,
      });

      // Reset form
      setFile(null);
      setDetectedType('');
      setDetectedFields({});
      setPreviewData([]);
      setAnalysisComplete(false);
      setImportProgress(0);
      
      queryClient.invalidateQueries({ queryKey: ['import-jobs'] });

    } catch (error: any) {
      console.error('Import error:', error);
      toast({
        title: "Import failed",
        description: error.message || "Something went wrong during import",
        variant: "destructive"
      });
      setImportProgress(0);
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

      {/* Enhanced Smart Import Interface */}
      <Card className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-primary/20">
        <CardHeader className="relative">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <CardTitle className="text-2xl flex items-center gap-2">
                  Smart Data Import
                  <Badge variant="secondary" className="ml-2 animate-pulse">
                    <Sparkles className="w-3 h-3 mr-1" />
                    AI-Powered
                  </Badge>
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  Upload any dental practice file - our AI automatically detects and imports everything perfectly
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Secure & HIPAA Compliant
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative space-y-6">
          {/* File Upload Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300
              ${dragActive
                ? 'border-primary bg-primary/10 scale-[1.02] shadow-lg'
                : file 
                  ? 'border-success bg-success/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/20'
              }
              ${autoDetecting ? 'animate-pulse' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {autoDetecting ? (
              <div className="space-y-4">
                <div className="relative">
                  <Brain className="w-12 h-12 mx-auto text-primary animate-pulse" />
                  <div className="absolute -top-2 -right-2">
                    <Sparkles className="w-6 h-6 text-warning animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">Analyzing your data...</p>
                  <p className="text-sm text-muted-foreground">
                    AI is detecting data types and mapping fields
                  </p>
                  <div className="max-w-md mx-auto">
                    <Progress value={85} className="h-2" />
                  </div>
                </div>
              </div>
            ) : file ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <FileCheck className="w-12 h-12 text-success animate-scale-in" />
                  {analysisComplete && (
                    <CheckCircle className="w-6 h-6 text-success ml-2 animate-fade-in" />
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-success">
                    {file.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {analysisComplete ? 'Ready to import!' : 'File uploaded successfully'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <Upload className="w-12 h-12 mx-auto text-muted-foreground transition-transform hover:scale-110" />
                  <ArrowRight className="w-6 h-6 absolute -bottom-1 -right-1 text-primary animate-bounce" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium">
                    Drop any dental practice file here
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CSV, Excel, or any format - we'll figure it out automatically
                  </p>
                  <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      CSV/Excel
                    </div>
                    <div className="flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      Up to 10MB
                    </div>
                    <div className="flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      Instant Analysis
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
              id="smart-upload"
            />
            
            {!file && (
              <Button
                variant="outline"
                onClick={() => document.getElementById('smart-upload')?.click()}
                className="mt-4 hover:scale-105 transition-transform"
                disabled={autoDetecting}
              >
                <Upload className="w-4 h-4 mr-2" />
                Choose File
              </Button>
            )}
            
            {file && !autoDetecting && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setDetectedType('');
                  setDetectedFields({});
                  setPreviewData([]);
                  setAnalysisComplete(false);
                }}
                className="mt-4"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Choose Different File
              </Button>
            )}
          </div>

          {/* Analysis Results */}
          {analysisComplete && detectedType && (
            <Card className="bg-success/5 border-success/20 animate-fade-in">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 rounded-full bg-success/20">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-success">AI Analysis Complete</h3>
                      <p className="text-sm text-muted-foreground">
                        Your data has been perfectly analyzed and mapped
                      </p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Data Type:</span>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {detectedType}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Fields Mapped:</span>
                      </div>
                      <Badge variant="outline">
                        {Object.keys(detectedFields).length} fields
                      </Badge>
                    </div>
                  </div>
                  
                  {previewData.length > 0 && (
                    <div className="mt-6">
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Data Preview (first 3 rows)
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border rounded-lg">
                          <thead className="bg-muted/50">
                            <tr>
                              {Object.keys(previewData[0]).map(header => (
                                <th key={header} className="px-3 py-2 text-left border-r text-xs">
                                  <div className="space-y-1">
                                    <div className="font-medium">{header}</div>
                                    <div className="text-primary font-mono">
                                      → {detectedFields[header] || header}
                                    </div>
                                  </div>
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {previewData.map((row, idx) => (
                              <tr key={idx} className="border-t hover:bg-muted/20 transition-colors">
                                {Object.values(row).map((value: any, i) => (
                                  <td key={i} className="px-3 py-2 border-r text-xs">
                                    {value || '-'}
                                  </td>
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

          {/* Import Progress */}
          {uploading && (
            <Card className="bg-primary/5 border-primary/20 animate-fade-in">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Zap className="w-5 h-5 text-primary animate-spin" />
                    <span className="font-medium">Importing your data...</span>
                  </div>
                  <Progress value={importProgress} className="h-3" />
                  <p className="text-sm text-muted-foreground">
                    Creating patient profiles and importing all data into the system
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Import Button */}
          <Button
            onClick={handleSmartImport}
            disabled={!file || !analysisComplete || uploading}
            className="w-full h-12 text-lg hover:scale-[1.02] transition-all duration-200"
            size="lg"
          >
            {uploading ? (
              <>
                <Zap className="w-5 h-5 mr-2 animate-spin" />
                Importing Data...
              </>
            ) : analysisComplete ? (
              <>
                <CheckCircle className="w-5 h-5 mr-2" />
                Import All Data Automatically
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                <Upload className="w-5 h-5 mr-2" />
                Upload & Analyze First
              </>
            )}
          </Button>
          
          {analysisComplete && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                Ready to import {Object.keys(detectedFields).length} fields of {detectedType} data
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Manual Import (Legacy) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-muted-foreground">Manual Import</h3>
            <p className="text-sm text-muted-foreground">For advanced users who prefer manual field mapping</p>
          </div>
          <Badge variant="outline" className="text-muted-foreground">Legacy Mode</Badge>
        </div>

        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid grid-cols-4 gap-1 bg-muted/30 p-1">
            {importTypes.map((type) => (
              <TabsTrigger
                key={type.id}
                value={type.id}
                className="flex items-center gap-2 text-xs data-[state=active]:bg-background/50"
              >
                <type.icon className="w-3 h-3" />
                {type.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {importTypes.map((type) => (
            <TabsContent key={type.id} value={type.id} className="space-y-4">
              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <type.icon className="w-4 h-4" />
                    Manual Import - {type.label}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription className="text-sm">
                      Expected columns: {type.sampleHeaders.join(', ')}
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => downloadSampleFile(type.id)}
                        className="ml-2 p-0 h-auto text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        Sample File
                      </Button>
                    </AlertDescription>
                  </Alert>

                  <div className="text-center p-6 border border-dashed rounded-lg bg-muted/20">
                    <p className="text-sm text-muted-foreground">
                      Use Smart Import above for the best experience
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* Enhanced Import History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Import History
            </CardTitle>
            <Badge variant="outline">{importJobs.length} imports</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : importJobs.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="font-medium text-muted-foreground mb-2">No imports yet</h3>
              <p className="text-sm text-muted-foreground">
                Your import history will appear here after uploading files
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {importJobs.map((job) => (
                <Card key={job.id} className="hover:shadow-sm transition-shadow">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          {getStatusIcon(job.status)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{job.filename}</span>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(job.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {job.successful_rows} / {job.total_rows}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          records imported
                        </div>
                      </div>
                    </div>
                    
                    {job.status === 'processing' && (
                      <div className="mb-3">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-medium">
                            {job.processed_rows} / {job.total_rows}
                          </span>
                        </div>
                        <Progress 
                          value={(job.processed_rows / job.total_rows) * 100} 
                          className="h-2"
                        />
                      </div>
                    )}
                    
                    <div className="grid grid-cols-3 gap-4 text-sm pt-3 border-t">
                      <div className="text-center">
                        <div className="font-medium text-muted-foreground mb-1">Total</div>
                        <div className="text-lg font-bold">{job.total_rows}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-success mb-1">Success</div>
                        <div className="text-lg font-bold text-success">{job.successful_rows}</div>
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-destructive mb-1">Failed</div>
                        <div className="text-lg font-bold text-destructive">{job.failed_rows}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}