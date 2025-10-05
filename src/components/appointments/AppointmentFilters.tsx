import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";

interface AppointmentFiltersProps {
  filters: {
    patient: string;
    status: string;
    type: string;
    dateRange: string;
  };
  setFilters: (filters: any) => void;
}

export function AppointmentFilters({ filters, setFilters }: AppointmentFiltersProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Input
        placeholder="Search patient..."
        value={filters.patient}
        onChange={(e) => setFilters({ ...filters, patient: e.target.value })}
      />
      
      <Select
        value={filters.status}
        onValueChange={(value) => setFilters({ ...filters, status: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="scheduled">{t.scheduled}</SelectItem>
          <SelectItem value="confirmed">{t.confirmed}</SelectItem>
          <SelectItem value="completed">{t.completed}</SelectItem>
          <SelectItem value="cancelled">{t.cancelled}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.type}
        onValueChange={(value) => setFilters({ ...filters, type: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="General Consultation">{t.generalConsultation}</SelectItem>
          <SelectItem value="Cleaning">{t.cleaning}</SelectItem>
          <SelectItem value="Checkup">Checkup</SelectItem>
          <SelectItem value="Emergency">{t.emergency}</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={filters.dateRange}
        onValueChange={(value) => setFilters({ ...filters, dateRange: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Date Range" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Time</SelectItem>
          <SelectItem value="today">{t.today}</SelectItem>
          <SelectItem value="week">This Week</SelectItem>
          <SelectItem value="month">This Month</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
