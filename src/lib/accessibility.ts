import { KeyboardEvent } from 'react';

/**
 * Handles keyboard events for interactive elements to ensure accessibility
 * @param callback Function to execute on Enter or Space key press
 * @returns Keyboard event handler
 */
export const handleKeyDown = (callback: () => void) => {
  return (event: KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      callback();
    }
  };
};

/**
 * Props for making a div element accessible as a button
 */
export interface AccessibleButtonProps {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
  'aria-label'?: string;
  disabled?: boolean;
}

/**
 * Returns props needed to make a div element accessible as a button
 */
export const getAccessibleButtonProps = (
  onClick: () => void, 
  ariaLabel?: string,
  disabled = false
) => ({
  role: 'button' as const,
  tabIndex: disabled ? -1 : 0,
  'aria-label': ariaLabel,
  'aria-disabled': disabled,
  onKeyDown: disabled ? undefined : handleKeyDown(onClick),
  onClick: disabled ? undefined : onClick,
});