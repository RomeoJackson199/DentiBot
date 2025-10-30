import React, { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Filter, Loader2, Calendar, User, Activity } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";
import { format } from "date-fns";

interface TreatmentRecordsTableProps {
  patientId: string;
}

export function TreatmentRecordsTable({ patientId }: TreatmentRecordsTableProps) {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const { data: records, isLoading, error: queryError } = useQuery({
    queryKey: ["treatment-records", patientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("record_date", { ascending: false });

      if (error) {
        console.error('❌ [TreatmentRecords] Query error:', error);
        throw error;
      }

      return data;
    }
  });

  if (queryError) {
    console.error('❌ [TreatmentRecords] React Query error:', queryError);
  }

  const filteredRecords = useMemo(() => {
    if (!records) return [];
    
    let filtered = records;

    // Apply type filter
    if (filterType !== "all") {
      filtered = filtered.filter(record => record.record_type === filterType);
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(record =>
        record.title?.toLowerCase().includes(query) ||
        record.description?.toLowerCase().includes(query) ||
        record.findings?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [records, searchQuery, filterType]);

  const getRecordTypeBadge = (type: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline", className: string }> = {
      consultation: { variant: "default", className: "bg-blue-100 text-blue-800 border-blue-200" },
      treatment: { variant: "secondary", className: "bg-green-100 text-green-800 border-green-200" },
      "x-ray": { variant: "outline", className: "bg-purple-100 text-purple-800 border-purple-200" },
      lab_result: { variant: "outline", className: "bg-orange-100 text-orange-800 border-orange-200" }
    };

    const config = variants[type] || variants.consultation;
    
    return (
      <Badge variant={config.variant} className={`${config.className} font-medium`}>
        {type === "consultation" && t.consultation}
        {type === "treatment" && t.treatment}
        {type === "x-ray" && t.xray}
        {type === "lab_result" && t.labResult}
      </Badge>
    );
  };

  const getDentistName = (record: any) => {
    // Since we removed dentist embed, we just show a placeholder
    return "Your Dentist";
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">{t.loading}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          {t.pnav.care.history}
        </CardTitle>
        
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3 mt-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t.searchTreatments}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex items-center gap-2 sm:w-48">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder={t.filterByType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t.allTypes}</SelectItem>
                <SelectItem value="consultation">{t.consultation}</SelectItem>
                <SelectItem value="treatment">{t.treatment}</SelectItem>
                <SelectItem value="x-ray">{t.xray}</SelectItem>
                <SelectItem value="lab_result">{t.labResult}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground font-medium">{t.noRecordsFound}</p>
            {searchQuery || filterType !== "all" ? (
              <p className="text-sm text-muted-foreground mt-2">
                Try adjusting your search or filter
              </p>
            ) : null}
          </div>
        ) : (
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      {t.treatmentType}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      {t.dentist}
                    </div>
                  </TableHead>
                  <TableHead className="font-semibold">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {t.date}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record) => (
                  <TableRow key={record.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{record.title}</div>
                        {getRecordTypeBadge(record.record_type)}
                        {record.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                            {record.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {getDentistName(record)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(record.record_date), "MMM dd, yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
