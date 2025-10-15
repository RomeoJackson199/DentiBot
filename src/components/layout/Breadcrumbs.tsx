import { ChevronRight, Home } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const pathToLabel: Record<string, string> = {
  'dentist': 'Dentist Portal',
  'clinical': 'Clinical',
  'dashboard': 'Dashboard',
  'patients': 'Patients',
  'appointments': 'Appointments',
  'schedule': 'Schedule',
  'business': 'Business',
  'payments': 'Payments',
  'analytics': 'Analytics',
  'reports': 'Reports',
  'ops': 'Operations',
  'inventory': 'Inventory',
  'imports': 'Data Imports',
  'admin': 'Admin',
  'branding': 'Branding',
  'security': 'Security',
  'users': 'User Management',
  'care': 'Care',
  'prescriptions': 'Prescriptions',
  'history': 'History',
  'billing': 'Billing',
  'docs': 'Documents',
  'account': 'Account',
  'profile': 'Profile',
  'insurance': 'Insurance',
  'privacy': 'Privacy',
  'help': 'Help',
};

export function Breadcrumbs({ items, className }: BreadcrumbsProps) {
  const location = useLocation();
  
  // Generate breadcrumbs from current path if not provided
  const breadcrumbItems = items || generateBreadcrumbsFromPath(location.pathname);

  if (breadcrumbItems.length === 0) return null;

  return (
    <nav className={cn("flex items-center space-x-1 text-sm text-muted-foreground mb-4", className)}>
      <Link
        to="/"
        className="flex items-center hover:text-foreground transition-colors"
        aria-label="Home"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbItems.map((item, index) => {
        const isLast = index === breadcrumbItems.length - 1;
        
        return (
          <div key={index} className="flex items-center space-x-1">
            <ChevronRight className="h-4 w-4" />
            {item.href && !isLast ? (
              <Link
                to={item.href}
                className="hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            ) : (
              <span className={cn(isLast && "text-foreground font-medium")}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}

function generateBreadcrumbsFromPath(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean);
  
  if (segments.length === 0) return [];

  const items: BreadcrumbItem[] = [];
  let currentPath = '';

  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const label = pathToLabel[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
    
    // Only add href for non-last items
    items.push({
      label,
      href: index < segments.length - 1 ? currentPath : undefined,
    });
  });

  return items;
}
