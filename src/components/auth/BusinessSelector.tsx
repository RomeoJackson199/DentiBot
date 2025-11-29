import { useState, useMemo } from "react";
import { Building2, Check, ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Business = {
  id: string;
  name: string;
  tagline: string | null;
  logo_url: string | null;
  template_type?: string | null;
};

interface BusinessSelectorProps {
  businesses: Business[];
  selectedBusinessId: string | null;
  isLoading: boolean;
  onSelectBusiness: (businessId: string) => void;
  variant?: "compact" | "dialog";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export const BusinessSelector = ({
  businesses,
  selectedBusinessId,
  isLoading,
  onSelectBusiness,
  variant = "compact",
  open = false,
  onOpenChange,
}: BusinessSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBusinesses = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    if (!term) {
      return businesses;
    }

    return businesses.filter((business) => {
      const nameMatches = business.name.toLowerCase().includes(term);
      const taglineMatches = business.tagline?.toLowerCase().includes(term) ?? false;

      return nameMatches || taglineMatches;
    });
  }, [businesses, searchTerm]);

  const selectedBusiness = useMemo(
    () => (selectedBusinessId ? businesses.find((business) => business.id === selectedBusinessId) : undefined),
    [businesses, selectedBusinessId]
  );

  const renderBusinessList = () => {
    if (isLoading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton
              key={`skeleton-${index}`}
              className="h-20 w-full rounded-lg"
            />
          ))}
          <p className="text-xs text-center text-muted-foreground mt-4">
            Loading workspaces...
          </p>
        </div>
      );
    }

    if (filteredBusinesses.length === 0) {
      return (
        <p className="text-sm text-muted-foreground text-center py-8">
          No businesses found.
        </p>
      );
    }

    return (
      <div className="space-y-2">
        {filteredBusinesses.map((business) => {
          const isSelected = selectedBusinessId === business.id;

          return (
            <button
              key={business.id}
              type="button"
              onClick={() => {
                onSelectBusiness(business.id);
                if (onOpenChange) onOpenChange(false);
              }}
              className={cn(
                "w-full rounded-lg border p-4 text-left transition-all duration-200 group hover:shadow-md",
                "border-slate-200 bg-white hover:border-slate-300",
                isSelected && "border-primary bg-primary/5 shadow-md"
              )}
            >
              <div className="flex items-center gap-3">
                {business.logo_url ? (
                  <img
                    src={business.logo_url}
                    alt={`${business.name} logo`}
                    className="h-12 w-12 rounded-lg object-cover bg-slate-100"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <Building2 className="h-5 w-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold text-slate-900">
                    {business.name}
                  </p>
                  {business.tagline && (
                    <p className="mt-0.5 truncate text-sm text-slate-500">
                      {business.tagline}
                    </p>
                  )}
                </div>
                {isSelected ? (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                ) : (
                  <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600 flex-shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  };

  if (variant === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Choose your workspace</DialogTitle>
            <DialogDescription>
              Select the business you want to access
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search businesses"
                className="pl-10"
              />
            </div>
            <div className="overflow-y-auto flex-1 pr-2">
              {renderBusinessList()}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Compact variant - shows selected business with click to change
  return (
    <div className="w-full">
      {selectedBusiness ? (
        <div className="mb-6">
          <label className="text-xs font-medium text-muted-foreground mb-2 block">
            Workspace
          </label>
          <button
            type="button"
            onClick={() => onOpenChange?.(true)}
            className="w-full p-4 border-2 border-primary bg-primary/5 rounded-lg hover:bg-primary/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {selectedBusiness.logo_url ? (
                <img
                  src={selectedBusiness.logo_url}
                  alt={`${selectedBusiness.name} logo`}
                  className="h-10 w-10 rounded-lg object-cover"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm">{selectedBusiness.name}</p>
                <p className="text-xs text-muted-foreground">Click to change workspace</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => onOpenChange?.(true)}
          className="w-full mb-6 p-4 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary hover:bg-accent transition-colors"
        >
          <div className="flex items-center justify-center gap-2 text-muted-foreground">
            <Building2 className="h-5 w-5" />
            <span className="font-medium">Select your workspace</span>
          </div>
        </button>
      )}
    </div>
  );
};
