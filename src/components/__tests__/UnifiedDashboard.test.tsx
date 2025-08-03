import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnifiedDashboard } from '../UnifiedDashboard';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-user',
              role: 'patient',
              email: 'test@example.com'
            }, 
            error: null 
          }))
        }))
      }))
    }))
  }
}));

const mockToast = {
  toast: jest.fn()
};

(useToast as jest.Mock).mockReturnValue(mockToast);

describe('UnifiedDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dashboard with user role detection', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows patient dashboard for patient users', async () => {
    const { supabase } = require('@/integrations/supabase/client');
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-user',
              role: 'patient',
              email: 'patient@example.com'
            }, 
            error: null 
          }))
        }))
      }))
    });

    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/patient dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows dentist dashboard for dentist users', async () => {
    const { supabase } = require('@/integrations/supabase/client');
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: { 
              id: 'test-user',
              role: 'dentist',
              email: 'dentist@example.com'
            }, 
            error: null 
          }))
        }))
      }))
    });

    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/dentist dashboard/i)).toBeInTheDocument();
    });
  });

  it('shows loading state while fetching user role', () => {
    render(<UnifiedDashboard />);
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('handles error when fetching user role', async () => {
    const { supabase } = require('@/integrations/supabase/client');
    supabase.from.mockReturnValue({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ 
            data: null, 
            error: { message: 'Failed to fetch user' } 
          }))
        }))
      }))
    });

    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('shows navigation menu for authenticated users', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  it('displays user profile information', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/test@example.com/i)).toBeInTheDocument();
    });
  });

  it('shows quick action buttons', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/book appointment/i)).toBeInTheDocument();
      expect(screen.getByText(/view appointments/i)).toBeInTheDocument();
    });
  });

  it('handles navigation between dashboard sections', async () => {
    const user = userEvent.setup();
    render(<UnifiedDashboard />);
    
    await waitFor(async () => {
      const appointmentsTab = screen.getByText(/appointments/i);
      await user.click(appointmentsTab);
      
      expect(screen.getByText(/appointment list/i)).toBeInTheDocument();
    });
  });

  it('shows recent appointments section', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/recent appointments/i)).toBeInTheDocument();
    });
  });

  it('shows upcoming appointments section', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/upcoming appointments/i)).toBeInTheDocument();
    });
  });

  it('displays appointment statistics', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/total appointments/i)).toBeInTheDocument();
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText(/pending/i)).toBeInTheDocument();
    });
  });

  it('shows emergency booking option', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      expect(screen.getByText(/emergency booking/i)).toBeInTheDocument();
    });
  });

  it('handles logout functionality', async () => {
    const user = userEvent.setup();
    render(<UnifiedDashboard />);
    
    await waitFor(async () => {
      const logoutButton = screen.getByText(/logout/i);
      await user.click(logoutButton);
      
      // Should redirect to login or show logout confirmation
      expect(mockToast.toast).toHaveBeenCalled();
    });
  });

  it('shows settings menu', async () => {
    const user = userEvent.setup();
    render(<UnifiedDashboard />);
    
    await waitFor(async () => {
      const settingsButton = screen.getByText(/settings/i);
      await user.click(settingsButton);
      
      expect(screen.getByText(/language/i)).toBeInTheDocument();
      expect(screen.getByText(/notifications/i)).toBeInTheDocument();
    });
  });

  it('displays responsive design elements', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      // Check for mobile-friendly elements
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  it('shows accessibility features', async () => {
    render(<UnifiedDashboard />);
    
    await waitFor(() => {
      // Check for ARIA labels and roles
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByRole('banner')).toBeInTheDocument();
    });
  });

  it('handles theme switching', async () => {
    const user = userEvent.setup();
    render(<UnifiedDashboard />);
    
    await waitFor(async () => {
      const themeToggle = screen.getByLabelText(/toggle theme/i);
      await user.click(themeToggle);
      
      // Should switch between light and dark themes
      expect(document.documentElement).toHaveClass('dark');
    });
  });

  it('shows language selection options', async () => {
    const user = userEvent.setup();
    render(<UnifiedDashboard />);
    
    await waitFor(async () => {
      const languageButton = screen.getByText(/language/i);
      await user.click(languageButton);
      
      expect(screen.getByText(/english/i)).toBeInTheDocument();
      expect(screen.getByText(/español/i)).toBeInTheDocument();
      expect(screen.getByText(/français/i)).toBeInTheDocument();
      expect(screen.getByText(/deutsch/i)).toBeInTheDocument();
    });
  });

  it('handles notification preferences', async () => {
    const user = userEvent.setup();
    render(<UnifiedDashboard />);
    
    await waitFor(async () => {
      const notificationsButton = screen.getByText(/notifications/i);
      await user.click(notificationsButton);
      
      expect(screen.getByText(/email notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/sms notifications/i)).toBeInTheDocument();
      expect(screen.getByText(/push notifications/i)).toBeInTheDocument();
    });
  });
});