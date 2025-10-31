/**
 * Skip to Content Link
 * Provides keyboard navigation accessibility
 * Meets WCAG 2.1 Level A requirement
 */

import React from "react";

export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
      tabIndex={0}
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen Reader Only Text
 * Visible only to screen readers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

/**
 * Visually Hidden but Accessible
 * For providing additional context to screen readers
 */
export function VisuallyHidden({ children, as: Component = 'span' }: { children: React.ReactNode; as?: React.ElementType }) {
  return (
    <Component className="absolute w-px h-px p-0 -m-px overflow-hidden whitespace-nowrap border-0">
      {children}
    </Component>
  );
}

/**
 * Accessible Icon Button
 * Ensures icons have proper labels
 */
interface AccessibleIconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  showLabel?: boolean;
}

export function AccessibleIconButton({
  icon,
  label,
  showLabel = false,
  className = "",
  ...props
}: AccessibleIconButtonProps) {
  return (
    <button
      aria-label={label}
      className={`inline-flex items-center justify-center gap-2 ${className}`}
      {...props}
    >
      {icon}
      {showLabel ? (
        <span>{label}</span>
      ) : (
        <ScreenReaderOnly>{label}</ScreenReaderOnly>
      )}
    </button>
  );
}

/**
 * Live Region for Announcements
 * Announces dynamic content changes to screen readers
 */
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: 'additions' | 'removals' | 'text' | 'all';
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
  relevant = 'additions text'
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      aria-relevant={relevant}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Focus Trap for Modals and Dialogs
 * Keeps keyboard focus within a container
 */
export function useFocusTrap(ref: React.RefObject<HTMLElement>, isActive: boolean = true) {
  React.useEffect(() => {
    if (!isActive || !ref.current) return;

    const element = ref.current;
    const focusableElements = element.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    // Focus first element when trap activates
    firstElement?.focus();

    element.addEventListener('keydown', handleTabKey);
    return () => element.removeEventListener('keydown', handleTabKey);
  }, [ref, isActive]);
}

/**
 * Announce to Screen Readers
 * Programmatically announce messages
 */
export function useAnnouncer() {
  const [announcement, setAnnouncement] = React.useState('');
  const [key, setKey] = React.useState(0);

  const announce = React.useCallback((message: string, politeness: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(message);
    setKey(prev => prev + 1); // Force re-render to trigger announcement
  }, []);

  const AnnouncementComponent = React.useMemo(() => (
    <LiveRegion key={key} politeness="polite">
      {announcement}
    </LiveRegion>
  ), [announcement, key]);

  return { announce, AnnouncementComponent };
}

/**
 * Keyboard Navigation Hook
 * Handles arrow key navigation in lists
 */
export function useKeyboardNavigation(itemCount: number) {
  const [focusedIndex, setFocusedIndex] = React.useState(0);

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % itemCount);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + itemCount) % itemCount);
        break;
      case 'Home':
        e.preventDefault();
        setFocusedIndex(0);
        break;
      case 'End':
        e.preventDefault();
        setFocusedIndex(itemCount - 1);
        break;
    }
  }, [itemCount]);

  return { focusedIndex, setFocusedIndex, handleKeyDown };
}

/**
 * Accessible Loading Indicator
 */
interface LoadingIndicatorProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AccessibleLoadingIndicator({ message = "Loading", size = 'md' }: LoadingIndicatorProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div role="status" aria-live="polite" aria-busy="true" className="flex flex-col items-center justify-center gap-2">
      <div className={`animate-spin rounded-full border-b-2 border-primary ${sizeClasses[size]}`} />
      <ScreenReaderOnly>{message}</ScreenReaderOnly>
      {message && <span className="text-sm text-muted-foreground">{message}</span>}
    </div>
  );
}

/**
 * Form Field Error Announcement
 * Ensures errors are announced to screen readers
 */
interface FieldErrorProps {
  error?: string;
  id: string;
}

export function FieldError({ error, id }: FieldErrorProps) {
  if (!error) return null;

  return (
    <p
      id={id}
      role="alert"
      aria-live="assertive"
      className="text-sm text-destructive mt-1"
    >
      {error}
    </p>
  );
}

/**
 * Accessible Form Field Wrapper
 */
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  helpText?: string;
  children: React.ReactElement;
  id: string;
}

export function AccessibleFormField({
  label,
  error,
  required,
  helpText,
  children,
  id
}: FormFieldProps) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
        {required && <span aria-label="required" className="text-destructive ml-1">*</span>}
      </label>

      {helpText && (
        <p id={helpId} className="text-xs text-muted-foreground">
          {helpText}
        </p>
      )}

      {React.cloneElement(children, {
        id,
        'aria-invalid': !!error,
        'aria-describedby': `${error ? errorId : ''} ${helpText ? helpId : ''}`.trim() || undefined,
        'aria-required': required,
      })}

      <FieldError error={error} id={errorId} />
    </div>
  );
}
