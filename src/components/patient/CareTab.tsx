import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";
import {
  ClipboardList,
  Pill,
  Calendar,
  FileText,
  Download,
  Search,
  AlertTriangle,
  Clock,
  ArrowRight
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

type CategoryType = 'ongoing' | 'visits' | 'prescriptions' | 'history' | 'documents';
const CATEGORIES: Array<{ id: CategoryType; label: string }> = [
  { id: 'ongoing', label: 'Ongoing Care' },
  { id: 'visits', label: 'Appointments & Visits' },
  { id: 'prescriptions', label: 'Prescriptions & Medications' },
  { id: 'history', label: 'Treatment History' },
  { id: 'documents', label: 'Documents & Records' }
];

const QUICK_FILTERS = ['Needs Action', 'Unpaid', 'Urgent', 'New'] as const;

type QuickFilter = typeof QUICK_FILTERS[number];

export const CareTab: React.FC<CareTabProps> = ({ plans, prescriptions, visits, records, user, patientId, onReschedule }) => {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<CategoryType>('ongoing');
  const [viewerItem, setViewerItem] = useState<CareItem | null>(null);
  const [selectedChips, setSelectedChips] = useState<Set<QuickFilter>>(new Set());
  const [docSort, setDocSort] = useState<'date_desc' | 'date_asc' | 'name_asc' | 'type_asc'>('date_desc');
  const { toast } = useToast();

  useEffect(() => {
    // Mark item as opened removes NEW badge
    if (viewerItem) {
      try { localStorage.setItem(`care_opened_${viewerItem.id}`, '1'); } catch {}
    }
  }, [viewerItem]);

  const allItems = useMemo(() => {
    return [...plans, ...prescriptions, ...visits, ...records];
  }, [plans, prescriptions, visits, records]);

  const isOpened = (item: CareItem) => {
    try { return !!localStorage.getItem(`care_opened_${item.id}`); } catch { return false; }
  };

  const isUrgent = (item: CareItem) => {
    const d = item.data || {};
    if (item.type === 'plan') return (d.priority?.toLowerCase?.() === 'urgent') || !!d.is_urgent;
    if (item.type === 'prescription') return !!d.is_urgent;
    if (item.type === 'visit') return (d.urgency?.toLowerCase?.() === 'emergency') || (d.urgency?.toLowerCase?.() === 'high');
    return false;
  };

  const needsAction = (item: CareItem) => {
    const status = (item.status || '').toLowerCase();
    if (item.type === 'plan') return status === 'draft' || status === 'active';
    if (item.type === 'prescription') return status === 'active';
    if (item.type === 'visit') return status === 'pending' || status === 'scheduled' || status === 'confirmed';
    return false;
  };

  const isUnpaid = (item: CareItem) => {
    // Best-effort: mark records that look like invoices or unpaid
    const text = `${item.title} ${item.subtitle || ''}`.toLowerCase();
    if (text.includes('invoice') || text.includes('payment') || (item.status || '').toLowerCase() === 'unpaid') return true;
    return false;
  };

  const matchesQuickFilters = (item: CareItem) => {
    if (selectedChips.size === 0) return true;
    const checks: Record<QuickFilter, boolean> = {
      'Needs Action': needsAction(item),
      'Unpaid': isUnpaid(item),
      'Urgent': isUrgent(item),
      'New': !isOpened(item)
    };
    for (const chip of selectedChips) {
      if (!checks[chip]) return false;
    }
    return true;
  };

  const iconFor = (type: CareItemType) => {
    switch (type) {
      case 'plan': return ClipboardList;
      case 'prescription': return Pill;
      case 'visit': return Calendar;
      case 'record': return FileText;
      default: return FileText;
    }
  };

  const formatDate = (d?: string) => {
    if (!d) return '';
    try { return new Date(d).toLocaleDateString(); } catch { return d; }
  };

  const getStatusClasses = (status?: string, urgent?: boolean) => {
    if (urgent) return 'bg-red-100 text-red-800';
    switch ((status || '').toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-gray-200 text-gray-700';
      case 'confirmed':
      case 'scheduled': return 'bg-amber-100 text-amber-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const toggleChip = (chip: QuickFilter) => {
    setSelectedChips(prev => {
      const next = new Set(prev);
      if (next.has(chip)) next.delete(chip); else next.add(chip);
      return next;
    });
  };

  const getProgressForItem = (item: CareItem): { label: string; percent: number } | null => {
    const d = item.data || {};
    if (item.type === 'plan') {
      const start = d.start_date ? new Date(d.start_date) : null;
      let totalDays = 0;
      if (typeof d.estimated_duration_weeks === 'number') totalDays = d.estimated_duration_weeks * 7;
      else if (typeof d.estimated_duration === 'string') {
        const m = d.estimated_duration.match(/(\d+)\s*week/i);
        if (m) totalDays = parseInt(m[1]) * 7;
      }
      if (start && totalDays > 0) {
        const elapsed = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
        const percent = Math.max(0, Math.min(100, Math.round((elapsed / totalDays) * 100)));
        return { label: `${Math.min(elapsed, totalDays)} of ${totalDays} days`, percent };
      }
      // Fallback: use procedures count if available
      if (Array.isArray(d.procedures)) {
        const total = d.procedures.length;
        const completed = (d.procedures_completed || 0) as number;
        if (total > 0) return { label: `${completed} of ${total} sessions completed`, percent: Math.round((completed / total) * 100) };
      }
      return null;
    }
    if (item.type === 'prescription') {
      const start = d.prescribed_date ? new Date(d.prescribed_date) : null;
      const durationDays = typeof d.duration_days === 'number' ? d.duration_days : undefined;
      if (start && durationDays) {
        const elapsed = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
        const percent = Math.max(0, Math.min(100, Math.round((elapsed / durationDays) * 100)));
        return { label: `${Math.min(elapsed, durationDays)} of ${durationDays} days`, percent };
      }
      return null;
    }
    return null;
  };

  const categoryItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filterByQuery = (items: CareItem[]) => q ? items.filter(i => i.title.toLowerCase().includes(q) || (i.subtitle || '').toLowerCase().includes(q)) : items;

    const now = new Date();
    const isUpcoming = (d?: string) => d ? new Date(d) >= now : false;

    if (activeCategory === 'ongoing') {
      const planItems = plans.filter(p => (p.status || '').toLowerCase() === 'active' || (p.status || '').toLowerCase() === 'draft');
      const rxItems = prescriptions.filter(p => (p.status || '').toLowerCase() === 'active');
      const visitItems = visits.filter(v => ['pending', 'scheduled', 'confirmed'].includes((v.status || '').toLowerCase()) && isUpcoming(v.date));
      return filterByQuery([...planItems, ...rxItems, ...visitItems]).filter(matchesQuickFilters);
    }
    if (activeCategory === 'visits') {
      const items = [...visits].sort((a, b) => new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime());
      return filterByQuery(items).filter(matchesQuickFilters);
    }
    if (activeCategory === 'prescriptions') {
      const items = [...prescriptions];
      return filterByQuery(items).filter(matchesQuickFilters);
    }
    if (activeCategory === 'history') {
      const completedPlans = plans.filter(p => (p.status || '').toLowerCase() === 'completed');
      const surgeryRecords = records.filter(r => (r.data?.record_type || '').toLowerCase() === 'surgery' || (r.data?.record_type || '').toLowerCase() === 'consultation');
      return filterByQuery([...completedPlans, ...surgeryRecords]).filter(matchesQuickFilters);
    }
    // documents
    const docs = [...records];
    docs.sort((a, b) => {
      if (docSort === 'date_desc') return new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
      if (docSort === 'date_asc') return new Date(a.date || 0).getTime() - new Date(b.date || 0).getTime();
      if (docSort === 'name_asc') return a.title.localeCompare(b.title);
      if (docSort === 'type_asc') return (a.data?.record_type || '').localeCompare(b.data?.record_type || '');
      return 0;
    });
    return filterByQuery(docs).filter(matchesQuickFilters);
  }, [activeCategory, plans, prescriptions, visits, records, query, selectedChips, docSort]);

  const handleOpen = (item: CareItem) => {
    setViewerItem(item);
  };

  const handleCancelAppointment = async (item: CareItem) => {
    if (item.type !== 'visit') return;
    try {
      const { error } = await supabase.from('appointments').update({ status: 'cancelled' }).eq('id', item.id);
      if (error) throw error;
      toast({ title: 'Appointment cancelled', description: 'Your appointment has been cancelled.' });
    } catch (e: any) {
      toast({ title: 'Failed to cancel', description: e?.message || 'Please try again later', variant: 'destructive' });
    }
  };

  const handleRequestRefill = async (item: CareItem) => {
    if (item.type !== 'prescription') return;
    const d = item.data || {};
    const refillsAllowed = typeof d.refills_allowed === 'number' ? d.refills_allowed : 0;
    if (refillsAllowed <= 0) {
      toast({ title: 'Refill not available', description: 'This prescription cannot be refilled.' });
      return;
    }
    try {
      const pid = patientId;
      if (!pid) throw new Error('Missing patient ID');
      const { error } = await supabase.from('patient_notes').insert({
        patient_id: pid,
        dentist_id: d.dentist_id,
        note_type: 'follow_up',
        title: `Refill request: ${d.medication_name || item.title}`,
        content: `Patient requested a refill for prescription ${item.id}`,
        is_private: false
      });
      if (error) throw error;
      toast({ title: 'Refill requested', description: 'Your dentist will review your request.' });
    } catch (e: any) {
      toast({ title: 'Failed to request refill', description: e?.message || 'Please try again later', variant: 'destructive' });
    }
  };

  const renderCardActions = (item: CareItem) => {
    if (item.type === 'visit') {
      return (
        <div className="flex items-center space-x-2">
          {item.status && (
            <Badge variant="outline" className={`capitalize ${getStatusClasses(item.status, isUrgent(item))}`}>{item.status}</Badge>
          )}
          <Button size="sm" variant="outline" onClick={() => onReschedule ? onReschedule(item.id) : setViewerItem(item)}>Reschedule</Button>
          <Button size="sm" variant="outline" onClick={() => handleCancelAppointment(item)}>Cancel</Button>
          <Button size="sm" onClick={() => handleOpen(item)}>Open Record</Button>
        </div>
      );
    }
    if (item.type === 'prescription') {
      const d = item.data || {};
      const canRefill = typeof d.refills_allowed === 'number' && d.refills_allowed > 0;
      return (
        <div className="flex items-center space-x-2">
          {isUrgent(item) && <Badge className="bg-red-100 text-red-800">Urgent</Badge>}
          {item.status && (
            <Badge variant="outline" className={`capitalize ${getStatusClasses(item.status, isUrgent(item))}`}>{item.status}</Badge>
          )}
          {canRefill && (
            <Button size="sm" variant="outline" onClick={() => handleRequestRefill(item)}>Request Refill</Button>
          )}
          <Button size="sm" onClick={() => handleOpen(item)}>Open Record</Button>
        </div>
      );
    }
    return (
      <div className="flex items-center space-x-2">
        {isUrgent(item) && <Badge className="bg-red-100 text-red-800">Urgent</Badge>}
        {item.status && (
          <Badge variant="outline" className={`capitalize ${getStatusClasses(item.status, isUrgent(item))}`}>{item.status}</Badge>
        )}
        <Button size="sm" onClick={() => handleOpen(item)}>Open Record</Button>
      </div>
    );
  };

  const renderCardSubtitle = (item: CareItem) => {
    const d = item.data || {};
    if (item.type === 'prescription') {
      const dosage = d.dosage || '';
      const frequency = d.frequency || '';
      const duration = d.duration_days ? `${d.duration_days} days` : d.duration || '';
      const start = d.prescribed_date ? formatDate(d.prescribed_date) : undefined;
      const end = d.expiry_date ? formatDate(d.expiry_date) : undefined;
      return (
        <div className="text-xs text-muted-foreground">
          <div>{[dosage, frequency].filter(Boolean).join(' • ')}</div>
          <div>{[start && `Start ${start}`, end && `End ${end}`].filter(Boolean).join(' • ')}</div>
        </div>
      );
    }
    if (item.type === 'visit') {
      const when = item.date ? new Date(item.date) : null;
      const whenStr = when ? `${when.toLocaleDateString()} • ${when.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : undefined;
      const dentist = d?.dentists?.profile ? `Dr. ${d.dentists.profile.first_name} ${d.dentists.profile.last_name}` : undefined;
      return (
        <div className="text-xs text-muted-foreground">
          <div>{[item.subtitle, whenStr].filter(Boolean).join(' • ')}</div>
          {dentist && <div>{dentist}</div>}
        </div>
      );
    }
    if (item.type === 'plan') {
      return (
        <div className="text-xs text-muted-foreground">
          <div>{item.subtitle}</div>
          {item.date && <div>Started {formatDate(item.date)}</div>}
        </div>
      );
    }
    if (item.type === 'record') {
      const type = d.record_type ? String(d.record_type).replace(/_/g, ' ') : undefined;
      return (
        <div className="text-xs text-muted-foreground">
          <div>{[type, item.subtitle].filter(Boolean).join(' • ')}</div>
          {item.date && <div>{formatDate(item.date)}</div>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen">
      {/* Header and mobile category bar */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border">
        <div className="px-4 md:px-6 py-3">
          <h2 className="text-xl font-semibold">Care</h2>
          <div className="mt-3 relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
          {/* Quick filters */}
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {QUICK_FILTERS.map(f => {
              const active = selectedChips.has(f);
              return (
                <Button
                  key={f}
                  size="sm"
                  variant={active ? 'secondary' : 'ghost'}
                  onClick={() => toggleChip(f)}
                  className="rounded-full"
                >
                  {f}
                </Button>
              );
            })}
          </div>
          {/* Mobile categories */}
          <div className="mt-3 flex md:hidden items-center gap-2 overflow-x-auto pb-1">
            {CATEGORIES.map(cat => (
              <Button
                key={cat.id}
                size="sm"
                variant={activeCategory === cat.id ? 'secondary' : 'ghost'}
                onClick={() => setActiveCategory(cat.id)}
                className="rounded-full"
              >
                {cat.label}
              </Button>
            ))}
          </div>
          {/* Documents sorting */}
          {activeCategory === 'documents' && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>Sort by:</span>
              <Button size="sm" variant={docSort === 'date_desc' ? 'secondary' : 'ghost'} onClick={() => setDocSort('date_desc')}>Newest</Button>
              <Button size="sm" variant={docSort === 'date_asc' ? 'secondary' : 'ghost'} onClick={() => setDocSort('date_asc')}>Oldest</Button>
              <Button size="sm" variant={docSort === 'name_asc' ? 'secondary' : 'ghost'} onClick={() => setDocSort('name_asc')}>Name</Button>
              <Button size="sm" variant={docSort === 'type_asc' ? 'secondary' : 'ghost'} onClick={() => setDocSort('type_asc')}>Type</Button>
            </div>
          )}
        </div>
      </div>

      {/* Desktop layout with sidebar */}
      <div className="hidden md:grid md:grid-cols-12 gap-4 px-4 md:px-6 py-4">
        <div className="md:col-span-3 lg:col-span-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Categories</CardTitle>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {CATEGORIES.map(cat => (
                <Button
                  key={cat.id}
                  variant={activeCategory === cat.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveCategory(cat.id)}
                >
                  {cat.label}
                </Button>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="md:col-span-9 lg:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {categoryItems.map(item => {
              const Icon = iconFor(item.type);
              const progress = activeCategory === 'ongoing' ? getProgressForItem(item) : null;
              const showNew = !isOpened(item);
              return (
                <Card key={item.id} className="hover:shadow-sm transition">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-2">
                            <span>{item.title}</span>
                            {showNew && <Badge className="bg-blue-600 text-white">NEW</Badge>}
                          </p>
                          {renderCardSubtitle(item)}
                        </div>
                      </div>
                      {renderCardActions(item)}
                    </div>
                    {progress && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>Progress</span>
                          <span>{progress.label}</span>
                        </div>
                        <Progress value={progress.percent} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Prescriptions: Past section */}
          {activeCategory === 'prescriptions' && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold mb-2">Past</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {prescriptions.filter(p => ['completed', 'discontinued', 'expired'].includes((p.status || '').toLowerCase())).map(item => {
                  const Icon = iconFor(item.type);
                  return (
                    <Card key={`past-${item.id}`} className="hover:shadow-sm transition">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                            {item.date && <p className="text-xs text-muted-foreground">{formatDate(item.date)}</p>}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {item.status && (
                            <Badge variant="outline" className={`capitalize ${getStatusClasses(item.status)}`}>{item.status}</Badge>
                          )}
                          <Button size="sm" onClick={() => handleOpen(item)}>Open Record</Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile content (no sidebar) */}
      <div className="md:hidden px-4 md:px-6 py-4 grid grid-cols-1 gap-3">
        {categoryItems.map(item => {
          const Icon = iconFor(item.type);
          const progress = activeCategory === 'ongoing' ? getProgressForItem(item) : null;
          const showNew = !isOpened(item);
          return (
            <Card key={`m-${item.id}`} className="hover:shadow-sm transition">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-2">
                        <span>{item.title}</span>
                        {showNew && <Badge className="bg-blue-600 text-white">NEW</Badge>}
                      </p>
                      {renderCardSubtitle(item)}
                    </div>
                  </div>
                  {renderCardActions(item)}
                </div>
                {progress && (
                  <div className="mt-3">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress</span>
                      <span>{progress.label}</span>
                    </div>
                    <Progress value={progress.percent} />
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Viewer modal */}
      <Dialog open={!!viewerItem} onOpenChange={() => setViewerItem(null)}>
        <DialogContent className="p-0 max-w-3xl w-full">
          <div className="md:flex md:h-[70vh]">
            <div className="hidden md:block md:w-1/3 border-r border-border overflow-auto p-3">
              {categoryItems.map(i => (
                <Button key={i.id} variant={viewerItem?.id === i.id ? 'secondary' : 'ghost'} className="w-full justify-start mb-1" onClick={() => setViewerItem(i)}>
                  {i.title}
                </Button>
              ))}
            </div>
            <div className="flex-1 overflow-auto p-4">
              <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                <span>{viewerItem?.title}</span>
                {!isOpened(viewerItem as CareItem) && <Badge className="bg-blue-600 text-white">NEW</Badge>}
              </h3>
              <p className="text-sm text-muted-foreground mb-3">{viewerItem?.subtitle}</p>
              {viewerItem?.date && (
                <div className="text-xs text-muted-foreground mb-4 flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(viewerItem.date)}</span>
                </div>
              )}

              {/* Special actions inside viewer */}
              {viewerItem?.type === 'visit' && (
                <div className="flex items-center gap-2 mb-3">
                  <Button size="sm" variant="outline" onClick={() => onReschedule ? onReschedule(viewerItem.id) : null}>Reschedule</Button>
                  <Button size="sm" variant="outline" onClick={() => handleCancelAppointment(viewerItem)}>Cancel</Button>
                </div>
              )}
              {viewerItem?.type === 'prescription' && (
                <div className="flex items-center gap-2 mb-3">
                  <Button size="sm" variant="outline" onClick={() => handleRequestRefill(viewerItem)}>Request Refill</Button>
                </div>
              )}

              {/* Download if file available */}
              {viewerItem?.type === 'record' && viewerItem?.data?.file_url && (
                <div className="mb-3">
                  <a href={viewerItem.data.file_url} target="_blank" rel="noreferrer">
                    <Button size="sm">
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </a>
                </div>
              )}

              <div className="text-sm space-y-2">
                {/* Placeholder for detailed content */}
                <div className="rounded-md bg-muted p-3">
                  Detailed information will appear here, including notes, attachments, and clinician feedback as available.
                </div>
                {viewerItem && isUrgent(viewerItem) && (
                  <div className="flex items-center gap-2 text-red-700 text-sm">
                    <AlertTriangle className="h-4 w-4" />
                    This item is marked as urgent.
                  </div>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};