import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ClipboardList,
  Pill,
  Calendar,
  FileText,
  Download,
  Search,
  AlertTriangle,
  Clock,
  ArrowRight,
  Eye,
  Share2,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  User as UserIcon,
  ChevronRight,
  FileDown,
  Stethoscope,
  Activity,
  FileImage
} from "lucide-react";

export type CareItemType = 'plan' | 'prescription' | 'visit' | 'record';

export interface CareItem {
  id: string;
  type: CareItemType;
  title: string;
  subtitle?: string;
  date?: string;
  status?: string;
  data?: any;
  dentist?: string;
}

export interface CareTabProps {
  plans: CareItem[];
  prescriptions: CareItem[];
  visits: CareItem[];
  records: CareItem[];
  user: User;
  patientId?: string | null;
  onReschedule?: (appointmentId?: string) => void;
}

// Updated grouped sections as per requirements
type SectionType = 'plans' | 'medications' | 'visits' | 'documents';

const SECTIONS: Array<{ id: SectionType; label: string; icon: React.ElementType; color: string }> = [
  { id: 'plans', label: 'Treatment Plans', icon: ClipboardList, color: 'text-orange-600 bg-orange-100' },
  { id: 'medications', label: 'Medications', icon: Pill, color: 'text-purple-600 bg-purple-100' },
  { id: 'visits', label: 'Visits', icon: Calendar, color: 'text-blue-600 bg-blue-100' },
  { id: 'documents', label: 'Documents', icon: FileText, color: 'text-green-600 bg-green-100' }
];

export const CareTab: React.FC<CareTabProps> = ({ 
  plans, 
  prescriptions, 
  visits, 
  records, 
  user, 
  patientId, 
  onReschedule 
}) => {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<SectionType>('plans');
  const [viewerItem, setViewerItem] = useState<CareItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { toast } = useToast();

  const formatDate = (d?: string) => {
    if (!d) return 'N/A';
    try { 
      return new Date(d).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }); 
    } catch { 
      return d; 
    }
  };

  const getStatusColor = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900/30';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30';
      case 'pending':
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'active':
      case 'confirmed':
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'pending':
      case 'scheduled': return Clock;
      default: return AlertCircle;
    }
  };

  // Filter items based on search query and status
  const filterItems = (items: CareItem[]) => {
    return items.filter(item => {
      const matchesQuery = !query || 
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.subtitle?.toLowerCase().includes(query.toLowerCase());
      
      const matchesStatus = filterStatus === 'all' || 
        item.status?.toLowerCase() === filterStatus.toLowerCase();
      
      return matchesQuery && matchesStatus;
    });
  };

  // Group and filter items by section
  const sectionItems = useMemo(() => {
    switch (activeSection) {
      case 'plans':
        return filterItems(plans);
      case 'medications':
        return filterItems(prescriptions);
      case 'visits':
        return filterItems(visits);
      case 'documents':
        return filterItems(records);
      default:
        return [];
    }
  }, [activeSection, plans, prescriptions, visits, records, query, filterStatus]);

  const handleDownload = async (item: CareItem) => {
    toast({
      title: "Downloading...",
      description: `Preparing ${item.title} for download`,
    });
    // Implement actual download logic here
  };

  const handleShare = async (item: CareItem) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.title,
          text: `${item.title} - ${item.subtitle || ''}`,
        });
      } catch (error) {
        console.log('Share failed:', error);
      }
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(`${item.title} - ${item.subtitle || ''}`);
      toast({
        title: "Copied to clipboard",
        description: "Information copied successfully",
      });
    }
  };

  const handleMarkTaken = async (prescriptionId: string) => {
    toast({
      title: "Marked as taken",
      description: "Medication reminder updated",
    });
    // Implement actual marking logic here
  };

  return (
    <div className="px-4 md:px-6 py-4 space-y-6 max-w-7xl mx-auto">
      {/* Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Care Management</h1>
          <p className="text-muted-foreground">Manage your treatment plans, medications, and medical records</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search care items..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <Tabs value={activeSection} onValueChange={(v) => setActiveSection(v as SectionType)}>
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          {SECTIONS.map((section) => {
            const Icon = section.icon;
            return (
              <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{section.label}</span>
                <span className="sm:hidden">{section.label.split(' ')[0]}</span>
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* Status Filter Pills */}
        <div className="flex items-center gap-2 mt-4 flex-wrap">
          <span className="text-sm text-muted-foreground">Filter:</span>
          {['all', 'active', 'completed', 'draft', 'cancelled'].map((status) => (
            <Button
              key={status}
              variant={filterStatus === status ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterStatus(status)}
              className="capitalize"
            >
              {status}
            </Button>
          ))}
        </div>

        {/* Content for each section */}
        <TabsContent value={activeSection} className="mt-6 space-y-4">
          {sectionItems.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center">
                  {(() => {
                    const section = SECTIONS.find(s => s.id === activeSection);
                    const Icon = section?.icon || FileText;
                    return <Icon className="h-12 w-12 text-muted-foreground/50 mb-4" />;
                  })()}
                  <h3 className="text-lg font-medium mb-2">No items found</h3>
                  <p className="text-muted-foreground">
                    {query ? 'Try adjusting your search or filters' : 'No items in this category yet'}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {/* Treatment Plans Section */}
              {activeSection === 'plans' && sectionItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn("p-2 rounded-lg", "bg-orange-100")}>
                            <ClipboardList className="h-5 w-5 text-orange-600" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.title}</h3>
                              <Badge className={cn(getStatusColor(item.status), "text-xs")}>
                                {item.status || 'Active'}
                              </Badge>
                            </div>
                            {item.subtitle && (
                              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.date)}
                              </span>
                              {item.dentist && (
                                <span className="flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  Dr. {item.dentist}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewerItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(item)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Medications Section */}
              {activeSection === 'medications' && sectionItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn("p-2 rounded-lg", "bg-purple-100")}>
                            <Pill className="h-5 w-5 text-purple-600" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.title}</h3>
                              <Badge className={cn(getStatusColor(item.status), "text-xs")}>
                                {item.status || 'Active'}
                              </Badge>
                              {item.status === 'active' && (
                                <Badge className="bg-amber-100 text-amber-800 text-xs">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Reminder On
                                </Badge>
                              )}
                            </div>
                            {item.subtitle && (
                              <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Prescribed: {formatDate(item.date)}
                              </span>
                              {item.dentist && (
                                <span className="flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  Dr. {item.dentist}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.status === 'active' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMarkTaken(item.id)}
                              className="text-xs"
                            >
                              Mark Taken
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewerItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(item)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}

              {/* Visits Section */}
              {activeSection === 'visits' && sectionItems.map((item, index) => {
                const isUpcoming = item.status === 'confirmed' || item.status === 'scheduled';
                const isCancelled = item.status === 'cancelled';
                const isCompleted = item.status === 'completed';
                
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className={cn(
                      "hover:shadow-lg transition-all",
                      isUpcoming && "border-green-200",
                      isCancelled && "border-red-200",
                      isCompleted && "border-blue-200"
                    )}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={cn(
                              "p-2 rounded-lg",
                              isUpcoming && "bg-green-100",
                              isCancelled && "bg-red-100",
                              isCompleted && "bg-blue-100",
                              !isUpcoming && !isCancelled && !isCompleted && "bg-gray-100"
                            )}>
                              <Calendar className={cn(
                                "h-5 w-5",
                                isUpcoming && "text-green-600",
                                isCancelled && "text-red-600",
                                isCompleted && "text-blue-600",
                                !isUpcoming && !isCancelled && !isCompleted && "text-gray-600"
                              )} />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="font-semibold">{item.title}</h3>
                                <Badge className={cn(getStatusColor(item.status), "text-xs")}>
                                  {item.status || 'Scheduled'}
                                </Badge>
                              </div>
                              {item.subtitle && (
                                <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                              )}
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {formatDate(item.date)}
                                </span>
                                {item.dentist && (
                                  <span className="flex items-center gap-1">
                                    <UserIcon className="h-3 w-3" />
                                    Dr. {item.dentist}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {isUpcoming && onReschedule && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onReschedule(item.id)}
                                className="text-xs"
                              >
                                Reschedule
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setViewerItem(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShare(item)}
                            >
                              <Share2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}

              {/* Documents Section */}
              {activeSection === 'documents' && sectionItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={cn("p-2 rounded-lg", "bg-green-100")}>
                            {item.subtitle?.includes('invoice') ? (
                              <FileText className="h-5 w-5 text-green-600" />
                            ) : item.subtitle?.includes('image') || item.subtitle?.includes('xray') ? (
                              <FileImage className="h-5 w-5 text-green-600" />
                            ) : (
                              <FileText className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{item.title}</h3>
                              {item.subtitle && (
                                <Badge variant="outline" className="text-xs">
                                  {item.subtitle}
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {formatDate(item.date)}
                              </span>
                              {item.dentist && (
                                <span className="flex items-center gap-1">
                                  <UserIcon className="h-3 w-3" />
                                  Dr. {item.dentist}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewerItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownload(item)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleShare(item)}
                          >
                            <Share2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Item Viewer Dialog */}
      <Dialog open={!!viewerItem} onOpenChange={() => setViewerItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {viewerItem && (() => {
                const Icon = viewerItem.type === 'plan' ? ClipboardList :
                            viewerItem.type === 'prescription' ? Pill :
                            viewerItem.type === 'visit' ? Calendar : FileText;
                return <Icon className="h-5 w-5" />;
              })()}
              {viewerItem?.title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {viewerItem && (
              <>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(viewerItem.status)}>
                    {viewerItem.status || 'Active'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(viewerItem.date)}
                  </span>
                </div>
                {viewerItem.subtitle && (
                  <p className="text-muted-foreground">{viewerItem.subtitle}</p>
                )}
                {viewerItem.data?.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{viewerItem.data.description}</p>
                  </div>
                )}
                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleDownload(viewerItem)}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                  <Button variant="outline" onClick={() => handleShare(viewerItem)}>
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};