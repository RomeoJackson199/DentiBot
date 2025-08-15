import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import {
  ClipboardList,
  Pill,
  Calendar,
  FileText,
  Download,
  Search
} from "lucide-react";

export type CareItemType = 'plan' | 'prescription' | 'visit' | 'record';

export interface CareItem {
  id: string;
  type: CareItemType;
  title: string;
  subtitle?: string;
  date?: string;
  status?: string;
}

export interface CareTabProps {
  plans: CareItem[];
  prescriptions: CareItem[];
  visits: CareItem[];
  records: CareItem[];
}

const FILTERS = ['All', 'Plans', 'Prescriptions', 'Visits', 'Records', 'Past'] as const;

type FilterType = typeof FILTERS[number];

export const CareTab: React.FC<CareTabProps> = ({ plans, prescriptions, visits, records }) => {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>('All');
  const [viewerItem, setViewerItem] = useState<CareItem | null>(null);

  const allItems = useMemo(() => {
    return [...plans, ...prescriptions, ...visits, ...records];
  }, [plans, prescriptions, visits, records]);

  const filtered = useMemo(() => {
    let items = allItems;
    if (filter !== 'All') {
      const map: Record<FilterType, CareItemType[] | 'past'> = {
        All: ['plan', 'prescription', 'visit', 'record'],
        Plans: ['plan'],
        Prescriptions: ['prescription'],
        Visits: ['visit'],
        Records: ['record'],
        Past: 'past'
      } as const;
      const target = map[filter];
      if (target === 'past') {
        const now = new Date();
        items = items.filter(i => (i.date ? new Date(i.date) < now : false));
      } else {
        items = items.filter(i => (target as CareItemType[]).includes(i.type));
      }
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(q) || (i.subtitle || '').toLowerCase().includes(q));
    }
    return items;
  }, [allItems, filter, query]);

  const iconFor = (type: CareItemType) => {
    switch (type) {
      case 'plan': return ClipboardList;
      case 'prescription': return Pill;
      case 'visit': return Calendar;
      case 'record': return FileText;
      default: return FileText;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header area */}
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
          <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
            {FILTERS.map(f => (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? 'secondary' : 'ghost'}
                onClick={() => setFilter(f)}
                className="rounded-full"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content layout */}
      <div className="px-4 md:px-6 py-4 grid grid-cols-1 lg:grid-cols-2 gap-3">
        {filtered.map(item => {
          const Icon = iconFor(item.type);
          return (
            <Card key={item.id} className="hover:shadow-sm transition">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{item.title}</p>
                    {item.subtitle && <p className="text-xs text-muted-foreground">{item.subtitle}</p>}
                    {item.date && <p className="text-xs text-muted-foreground">{new Date(item.date).toLocaleDateString()}</p>}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {item.status && (
                    <Badge variant="outline" className="capitalize">{item.status}</Badge>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setViewerItem(item)}>View</Button>
                  <Button size="sm">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Viewer modal */}
      <Dialog open={!!viewerItem} onOpenChange={() => setViewerItem(null)}>
        <DialogContent className="p-0 max-w-3xl w-full">
          <div className="md:flex md:h-[70vh]">
            {/* List left (desktop) */}
            <div className="hidden md:block md:w-1/3 border-r border-border overflow-auto p-3">
              {filtered.map(i => (
                <Button key={i.id} variant={viewerItem?.id === i.id ? 'secondary' : 'ghost'} className="w-full justify-start mb-1" onClick={() => setViewerItem(i)}>
                  {i.title}
                </Button>
              ))}
            </div>
            {/* Viewer right */}
            <div className="flex-1 overflow-auto p-4">
              <h3 className="text-lg font-semibold mb-2">{viewerItem?.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{viewerItem?.subtitle}</p>
              <div className="text-sm">Detailed viewer content would appear here.</div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};