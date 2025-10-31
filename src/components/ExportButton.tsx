import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ExportButtonProps {
  data: any[];
  onExport: (format: 'csv' | 'excel') => void;
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
  showLabel?: boolean;
}

export function ExportButton({
  data,
  onExport,
  disabled = false,
  variant = "outline",
  size = "default",
  label = "Export",
  showLabel = true,
}: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'excel') => {
    if (!data || data.length === 0) {
      toast.error("No data to export");
      return;
    }

    setIsExporting(true);

    try {
      await onExport(format);
      toast.success(`Exported ${data.length} records to ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  const isEmpty = !data || data.length === 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={disabled || isEmpty || isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {showLabel && <span>{isExporting ? "Exporting..." : label}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleExport('csv')}
          disabled={isExporting}
          className="cursor-pointer"
        >
          <FileSpreadsheet className="h-4 w-4 mr-2" />
          Export as CSV
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled className="text-xs text-gray-500">
          Excel format coming soon
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Specific export buttons for common use cases
interface DataExportButtonProps {
  data: any[];
  type: 'patients' | 'appointments' | 'prescriptions' | 'payments' | 'inventory';
  disabled?: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg";
}

export function DataExportButton({
  data,
  type,
  disabled,
  variant,
  size,
}: DataExportButtonProps) {
  const exportFunctions: Record<string, (data: any[]) => void> = {
    patients: async (data) => {
      const { exportPatientsToCSV } = await import('@/lib/exportUtils');
      exportPatientsToCSV(data);
    },
    appointments: async (data) => {
      const { exportAppointmentsToCSV } = await import('@/lib/exportUtils');
      exportAppointmentsToCSV(data);
    },
    prescriptions: async (data) => {
      const { exportPrescriptionsToCSV } = await import('@/lib/exportUtils');
      exportPrescriptionsToCSV(data);
    },
    payments: async (data) => {
      const { exportPaymentRequestsToCSV } = await import('@/lib/exportUtils');
      exportPaymentRequestsToCSV(data);
    },
    inventory: async (data) => {
      const { exportInventoryToCSV } = await import('@/lib/exportUtils');
      exportInventoryToCSV(data);
    },
  };

  const handleExport = async (format: 'csv' | 'excel') => {
    if (format === 'csv' && exportFunctions[type]) {
      await exportFunctions[type](data);
    }
  };

  return (
    <ExportButton
      data={data}
      onExport={handleExport}
      disabled={disabled}
      variant={variant}
      size={size}
      label={`Export ${type.charAt(0).toUpperCase() + type.slice(1)}`}
    />
  );
}
