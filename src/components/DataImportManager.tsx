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
  const [selectedType, setSelectedType] = useState<string>('appointments');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
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
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
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

      const response = await fetch(
        `${getFunctionUrl('import-appointments')}?action=commit&type=${selectedType}&filename=${encodeURIComponent(file.name)}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': file.type || 'application/octet-stream'
          },
          body: await file.arrayBuffer()
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Import failed');
      }

      toast({
        title: "Import started",
        description: `Processing ${result.total_rows} rows. Job ID: ${result.job_id}`,
      });

      setFile(null);
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

      <Tabs value={selectedType} onValueChange={setSelectedType} className="space-y-6">
        <TabsList className="grid grid-cols-4 gap-1 bg-muted/50 p-1">
          {importTypes.map((type) => (
            <TabsTrigger
              key={type.id}
              value={type.id}
              className="flex items-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {importTypes.map((type) => (
          <TabsContent key={type.id} value={type.id} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <type.icon className="w-5 h-5" />
                  Import {type.label}
                </CardTitle>
                <p className="text-muted-foreground">{type.description}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Expected columns: {type.sampleHeaders.join(', ')}
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => downloadSampleFile(type.id)}
                      className="ml-2 p-0 h-auto"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download Sample
                    </Button>
                  </AlertDescription>
                </Alert>

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
                      {file ? file.name : 'Drop your file here or click to browse'}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Supports CSV files up to 10MB
                    </p>
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('file-upload')?.click()}
                    className="mt-4"
                  >
                    Choose File
                  </Button>
                </div>

                <Button
                  onClick={handleImport}
                  disabled={!file || uploading}
                  className="w-full"
                  size="lg"
                >
                  {uploading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import {type.label}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

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