import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Command, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShortcutItem {
  id: string;
  label: string;
  path: string;
  category: string;
  keywords: string[];
  shortcut?: string;
}

const shortcuts: ShortcutItem[] = [
  // Clinical
  { id: 'dashboard', label: 'Clinical Dashboard', path: '/dentist/clinical/dashboard', category: 'Clinical', keywords: ['clinical', 'dashboard', 'today'], shortcut: '⌘+1' },
  { id: 'patients', label: 'Patient Management', path: '/dentist/clinical/patients', category: 'Clinical', keywords: ['patients', 'list'], shortcut: '⌘+2' },
  { id: 'appointments', label: 'Appointments', path: '/dentist/clinical/appointments', category: 'Clinical', keywords: ['appointments', 'calendar'], shortcut: '⌘+3' },
  { id: 'schedule', label: 'Schedule Settings', path: '/dentist/clinical/schedule', category: 'Clinical', keywords: ['schedule', 'availability'], shortcut: '⌘+4' },
  
  // Business
  { id: 'payments', label: 'Payment Requests', path: '/dentist/business/payments', category: 'Business', keywords: ['payments', 'billing', 'invoices'], shortcut: '⌘+5' },
  { id: 'analytics', label: 'Analytics', path: '/dentist/business/analytics', category: 'Business', keywords: ['analytics', 'reports', 'statistics'], shortcut: '⌘+6' },
  
  // Operations
  { id: 'inventory', label: 'Inventory', path: '/dentist/ops/inventory', category: 'Operations', keywords: ['inventory', 'stock', 'supplies'], shortcut: '⌘+7' },
  { id: 'imports', label: 'Data Imports', path: '/dentist/ops/imports', category: 'Operations', keywords: ['import', 'csv', 'data'], shortcut: '⌘+8' },
  
  // Admin
  { id: 'users', label: 'User Management', path: '/dentist/admin/users', category: 'Admin', keywords: ['users', 'team', 'staff', 'admin'], shortcut: '⌘+9' },
  { id: 'branding', label: 'Branding', path: '/dentist/admin/branding', category: 'Admin', keywords: ['branding', 'logo', 'colors'] },
  { id: 'security', label: 'Security', path: '/dentist/admin/security', category: 'Admin', keywords: ['security', 'password', 'auth'] },
  
  // Patient Portal
  { id: 'care-home', label: 'Care Home', path: '/care', category: 'Patient', keywords: ['care', 'home', 'patient'] },
  { id: 'care-appointments', label: 'My Appointments', path: '/care/appointments', category: 'Patient', keywords: ['appointments', 'bookings'] },
  { id: 'prescriptions', label: 'Prescriptions', path: '/care/prescriptions', category: 'Patient', keywords: ['prescriptions', 'medications'] },
];

export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Command/Ctrl + K to open command palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }

      // Number shortcuts (Cmd/Ctrl + 1-9)
      if ((e.metaKey || e.ctrlKey) && e.key >= '1' && e.key <= '9') {
        const shortcut = shortcuts.find(s => s.shortcut === `⌘+${e.key}`);
        if (shortcut) {
          e.preventDefault();
          navigate(shortcut.path);
        }
      }

      // ESC to close
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [navigate]);

  const filteredShortcuts = shortcuts.filter((shortcut) => {
    const query = search.toLowerCase();
    return (
      shortcut.label.toLowerCase().includes(query) ||
      shortcut.category.toLowerCase().includes(query) ||
      shortcut.keywords.some(k => k.includes(query))
    );
  });

  const groupedShortcuts = filteredShortcuts.reduce((acc, shortcut) => {
    if (!acc[shortcut.category]) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {} as Record<string, ShortcutItem[]>);

  const handleSelect = (path: string) => {
    navigate(path);
    setOpen(false);
    setSearch("");
  };

  return (
    <>
      {/* Trigger Button */}
      <Button
        variant="outline"
        className="hidden sm:flex items-center gap-2 text-muted-foreground hover:text-foreground"
        onClick={() => setOpen(true)}
      >
        <Command className="h-4 w-4" />
        <span className="text-sm">Quick Navigation</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      {/* Command Palette Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0">
          <DialogHeader className="px-4 pt-4 pb-0">
            <DialogTitle className="text-lg">Quick Navigation</DialogTitle>
            <DialogDescription>
              Search or use keyboard shortcuts to navigate
            </DialogDescription>
          </DialogHeader>

          <div className="px-4 py-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2">
            {Object.keys(groupedShortcuts).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No results found
              </div>
            ) : (
              Object.entries(groupedShortcuts).map(([category, items]) => (
                <div key={category} className="mb-4">
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {category}
                  </div>
                  <div className="space-y-1">
                    {items.map((item) => {
                      const isActive = location.pathname === item.path;
                      return (
                        <button
                          key={item.id}
                          onClick={() => handleSelect(item.path)}
                          className={cn(
                            "w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors",
                            "hover:bg-accent focus:bg-accent focus:outline-none",
                            isActive && "bg-primary/10 text-primary"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <ArrowRight className="h-4 w-4" />
                            <span>{item.label}</span>
                            {isActive && (
                              <Badge variant="secondary" className="text-xs">Current</Badge>
                            )}
                          </div>
                          {item.shortcut && (
                            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                              {item.shortcut}
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t px-4 py-3 text-xs text-muted-foreground flex items-center justify-between">
            <span>Use ↑↓ to navigate, Enter to select, Esc to close</span>
            <span>⌘K to open</span>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
