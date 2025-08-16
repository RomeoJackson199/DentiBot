// Design tokens for consistent UI across Patient Portal

// Status color mappings
export const statusColors = {
  // Active/Confirmed states - Green
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  
  // Completed states - Blue  
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  
  // Pending/Scheduled states - Yellow/Amber
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  scheduled: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  
  // Cancelled/Due states - Red
  cancelled: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  due: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  
  // Draft states - Gray
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
  
  // Default
  default: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
} as const;

// Section/Tab color themes
export const sectionColors = {
  home: {
    icon: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    border: 'border-blue-200',
    hover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20'
  },
  assistant: {
    icon: 'text-emerald-600',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    border: 'border-emerald-200',
    hover: 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20'
  },
  care: {
    icon: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    border: 'border-purple-200',
    hover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
  },
  appointments: {
    icon: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    border: 'border-orange-200',
    hover: 'hover:bg-orange-50 dark:hover:bg-orange-900/20'
  },
  payments: {
    icon: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    border: 'border-green-200',
    hover: 'hover:bg-green-50 dark:hover:bg-green-900/20'
  },
  settings: {
    icon: 'text-gray-600',
    bg: 'bg-gray-100 dark:bg-gray-900/30',
    border: 'border-gray-200',
    hover: 'hover:bg-gray-50 dark:hover:bg-gray-900/20'
  }
} as const;

// Appointment card colors based on status
export const appointmentCardColors = {
  upcoming: 'border-green-200 bg-green-50/50 dark:bg-green-900/10',
  cancelled: 'border-red-200 bg-red-50/50 dark:bg-red-900/10',
  completed: 'border-blue-200 bg-blue-50/50 dark:bg-blue-900/10',
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