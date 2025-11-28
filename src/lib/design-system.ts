/**
 * DentiBot Design System
 * 
 * A comprehensive, semantic design system for consistent UI/UX across the application.
 * All colors are in HSL format and properly themed for both light and dark modes.
 */

// ============================================================================
// TYPOGRAPHY
// ============================================================================

export const typography = {
  fonts: {
    heading: '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
    body: '"Inter", system-ui, -apple-system, sans-serif',
    mono: '"SF Mono", "Roboto Mono", Consolas, monospace',
  },
  
  sizes: {
    // Display sizes (hero sections)
    display: { size: '3rem', lineHeight: '3.5rem', weight: '800' }, // 48px
    
    // Heading hierarchy
    h1: { size: '2.25rem', lineHeight: '2.75rem', weight: '700' }, // 36px
    h2: { size: '1.875rem', lineHeight: '2.25rem', weight: '700' }, // 30px
    h3: { size: '1.5rem', lineHeight: '2rem', weight: '600' }, // 24px
    h4: { size: '1.25rem', lineHeight: '1.75rem', weight: '600' }, // 20px
    h5: { size: '1.125rem', lineHeight: '1.5rem', weight: '600' }, // 18px
    h6: { size: '1rem', lineHeight: '1.5rem', weight: '600' }, // 16px
    
    // Body text
    large: { size: '1.125rem', lineHeight: '1.75rem', weight: '400' }, // 18px
    base: { size: '1rem', lineHeight: '1.5rem', weight: '400' }, // 16px
    small: { size: '0.875rem', lineHeight: '1.25rem', weight: '400' }, // 14px
    xs: { size: '0.75rem', lineHeight: '1rem', weight: '400' }, // 12px
    
    // Special
    caption: { size: '0.75rem', lineHeight: '1rem', weight: '500' }, // 12px
    overline: { size: '0.625rem', lineHeight: '0.875rem', weight: '600', letterSpacing: '0.05em' }, // 10px
  },
  
  weights: {
    light: 300,
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
} as const;

// ============================================================================
// COLORS (HSL VALUES ONLY - USE WITH hsl() FUNCTION)
// ============================================================================

export const colors = {
  // Primary Brand Colors
  primary: {
    DEFAULT: '199 89% 48%',      // Dental Blue - main brand color
    light: '199 89% 60%',
 '199 89% 38%',
    foreground: '0 0% 100%',     // White text on primary
  },
  
  // Secondary Colors
  secondary: {
    DEFAULT: '142 71% 45%',      // Dental Green - success, growth
    light: '142 71% 55%',
 '142 71% 35%',
    foreground: '0 0% 100%',
  },
  
  // Accent Color
  accent: {
    DEFAULT: '279 70% 52%',      // Purple - highlights, special actions
    light: '279 70% 62%',
 '279 70% 42%',
    foreground: '0 0% 100%',
  },
  
  // Neutral Colors (Backgrounds, Text)
  neutral: {
    50: '240 5% 96%',
    100: '240 5% 92%',
    200: '240 5% 84%',
    300: '240 5% 71%',
    400: '240 5% 58%',
    500: '240 5% 45%',
    600: '240 5% 35%',
    700: '240 5% 26%',
    800: '240 5% 18%',
    900: '240 5% 10%',
    950: '240 10% 4%',
  },
  
  // Semantic Status Colors
  status: {
    success: {
      light: '142 76% 70%',
      DEFAULT: '142 71% 45%',
 '142 72% 29%',
      bg: '140 84% 92%',        // Light background
      foreground: '0 0% 100%',
    },
    warning: {
      light: '45 96% 56%',
      DEFAULT: '38 92% 50%',
 '32 75% 40%',
      bg: '48 96% 89%',
      foreground: '0 0% 100%',
    },
    error: {
      light: '0 94% 82%',
      DEFAULT: '0 72% 51%',
 '0 74% 31%',
      bg: '0 93% 94%',
      foreground: '0 0% 100%',
    },
    info: {
      light: '214 95% 77%',
      DEFAULT: '217 91% 60%',
 '226 57% 28%',
      bg: '214 95% 93%',
      foreground: '0 0% 100%',
    },
  },
  
  // Appointment Status Colors
  appointment: {
    scheduled: '217 91% 60%',     // Blue
    confirmed: '142 71% 45%',     // Green
    completed: '240 5% 45%',      // Gray
    cancelled: '0 72% 51%',       // Red
    noShow: '38 92% 50%',         // Orange
    emergency: '0 84% 60%',       // Bright Red
  },
  
  // Payment Status Colors
  payment: {
    paid: '142 71% 45%',          // Green
    pending: '38 92% 50%',        // Orange
    overdue: '0 72% 51%',         // Red
    partial: '217 91% 60%',       // Blue
  },
} as const;

// ============================================================================
// SPACING
// ============================================================================

export const spacing = {
  0: '0px',
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const radius = {
  none: '0',
  sm: '0.25rem',    // 4px
  DEFAULT: '0.5rem', // 8px
  md: '0.75rem',    // 12px
  lg: '1rem',       // 16px
  xl: '1.5rem',     // 24px
  '2xl': '2rem',    // 32px
  full: '9999px',
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const shadows = {
  sm: '0 1px 2px 0 hsl(240 10% 4% / 0.05)',
  DEFAULT: '0 1px 3px 0 hsl(240 10% 4% / 0.1), 0 1px 2px -1px hsl(240 10% 4% / 0.1)',
  md: '0 4px 6px -1px hsl(240 10% 4% / 0.1), 0 2px 4px -2px hsl(240 10% 4% / 0.1)',
  lg: '0 10px 15px -3px hsl(240 10% 4% / 0.1), 0 4px 6px -4px hsl(240 10% 4% / 0.1)',
  xl: '0 20px 25px -5px hsl(240 10% 4% / 0.1), 0 8px 10px -6px hsl(240 10% 4% / 0.1)',
  '2xl': '0 25px 50px -12px hsl(240 10% 4% / 0.25)',
  
  // Special shadows
  glow: '0 0 20px hsl(199 89% 48% / 0.3)',
  float: '0 8px 25px -8px hsl(240 10% 4% / 0.1), 0 20px 40px -12px hsl(240 10% 4% / 0.15)',
} as const;

// ============================================================================
// COMPONENT PRESETS
// ============================================================================

export const components = {
  button: {
    primary: {
      bg: 'hsl(var(--primary))',
      color: 'hsl(var(--primary-foreground))',
      hover: 'hsl(199 89% 40%)',
      active: 'hsl(199 89% 35%)',
    },
    secondary: {
      bg: 'hsl(var(--secondary))',
      color: 'hsl(var(--secondary-foreground))',
      hover: 'hsl(240 5% 92%)',
      active: 'hsl(240 5% 88%)',
    },
    destructive: {
      bg: 'hsl(0 72% 51%)',
      color: 'hsl(0 0% 100%)',
      hover: 'hsl(0 72% 45%)',
      active: 'hsl(0 72% 40%)',
    },
    ghost: {
      bg: 'transparent',
      color: 'hsl(var(--foreground))',
      hover: 'hsl(240 5% 96%)',
      active: 'hsl(240 5% 92%)',
    },
  },
  
  card: {
    bg: 'hsl(var(--card))',
    border: 'hsl(var(--border))',
    shadow: shadows.md,
    radius: radius.lg,
  },
  
  input: {
    bg: 'hsl(var(--background))',
    border: 'hsl(var(--input))',
    focus: 'hsl(var(--ring))',
    placeholder: 'hsl(var(--muted-foreground))',
  },
} as const;

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const breakpoints = {
  mobile: '320px',
  mobileMd: '375px',
  mobileLg: '414px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1280px',
  wide: '1536px',
} as const;

// ============================================================================
// Z-INDEX LAYERS
// ============================================================================

export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  fixed: 300,
  modalBackdrop: 400,
  modal: 500,
  popover: 600,
  tooltip: 700,
  notification: 800,
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get HSL color string for use in CSS
 * @example getColor('primary') // 'hsl(199 89% 48%)'
 */
export function getColor(color: string, opacity?: number): string {
  const colorPath = color.split('.');
  let value: any = colors;
  
  for (const key of colorPath) {
    value = value[key];
    if (!value) return color;
  }
  
  if (typeof value !== 'string') {
    value = value.DEFAULT || Object.values(value)[0];
  }
  
  return opacity !== undefined ? `hsl(${value} / ${opacity})` : `hsl(${value})`;
}

/**
 * Get status color based on status type
 */
export function getStatusColor(status: string): string {
  const statusLower = status.toLowerCase();
  
  // Appointment statuses
  if (statusLower.includes('schedule')) return getColor('appointment.scheduled');
  if (statusLower.includes('confirm')) return getColor('appointment.confirmed');
  if (statusLower.includes('complete')) return getColor('appointment.completed');
  if (statusLower.includes('cancel')) return getColor('appointment.cancelled');
  if (statusLower.includes('emergency')) return getColor('appointment.emergency');
  
  // Payment statuses
  if (statusLower.includes('paid')) return getColor('payment.paid');
  if (statusLower.includes('pending')) return getColor('payment.pending');
  if (statusLower.includes('overdue')) return getColor('payment.overdue');
  
  // Generic statuses
  if (statusLower.includes('success') || statusLower.includes('active')) {
    return getColor('status.success');
  }
  if (statusLower.includes('warning') || statusLower.includes('pending')) {
    return getColor('status.warning');
  }
  if (statusLower.includes('error') || statusLower.includes('failed')) {
    return getColor('status.error');
  }
  
  return getColor('neutral.500');
}

export default {
  typography,
  colors,
  spacing,
  radius,
  shadows,
  components,
  breakpoints,
  zIndex,
  getColor,
  getStatusColor,
};
