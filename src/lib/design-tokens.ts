// Design tokens for consistent UI across Patient Portal

// Status color mappings
export const statusColors = {
  // Active/Confirmed states - Green
  active: 'bg-green-100 text-green-800',
  confirmed: 'bg-green-100 text-green-800',
  
  // Completed states - Blue  
  completed: 'bg-blue-100 text-blue-800',
  
  // Pending/Scheduled states - Yellow/Amber
  pending: 'bg-yellow-100 text-yellow-800',
  scheduled: 'bg-amber-100 text-amber-800',
  
  // Cancelled/Due states - Red
  cancelled: 'bg-red-100 text-red-800',
  due: 'bg-red-100 text-red-800',
  
  // Draft states - Gray
  draft: 'bg-gray-100 text-gray-800',
  
  // Default
  default: 'bg-gray-100 text-gray-800'
} as const;

// Section/Tab color themes
export const sectionColors = {
  home: {
    icon: 'text-blue-600',
    bg: 'bg-blue-100',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-50:bg-blue-900/20'
  },
  assistant: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-100',
    border: 'border-emerald-200',
    hover: 'hover:bg-emerald-50:bg-emerald-900/20'
  },
  care: {
    icon: 'text-purple-600',
    bg: 'bg-purple-100',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-50:bg-purple-900/20'
  },
  appointments: {
    icon: 'text-orange-600',
    bg: 'bg-orange-100',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-50:bg-orange-900/20'
  },
  payments: {
    icon: 'text-green-600',
    bg: 'bg-green-100',
    border: 'border-green-200',
    hover: 'hover:bg-green-50:bg-green-900/20'
  },
  settings: {
    icon: 'text-gray-600',
    bg: 'bg-gray-100',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-50:bg-gray-900/20'
  }
} as const;

// Appointment card colors based on status
export const appointmentCardColors = {
  upcoming: 'border-green-200 bg-green-50/50',
  cancelled: 'border-red-200 bg-red-50/50',
  completed: 'border-blue-200 bg-blue-50/50',
  default: 'border-gray-200'
} as const;

// Helper function to get status color
export function getStatusColor(status?: string): string {
  if (!status) return statusColors.default;
  const key = status.toLowerCase() as keyof typeof statusColors;
  return statusColors[key] || statusColors.default;
}

// Helper function to get section color
export function getSectionColor(section: string) {
  const key = section as keyof typeof sectionColors;
  return sectionColors[key] || sectionColors.home;
}