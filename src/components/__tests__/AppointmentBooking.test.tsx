import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppointmentBooking } from '../AppointmentBooking';
import { useToast } from '@/hooks/use-toast';

// Mock dependencies
jest.mock('@/hooks/use-toast');
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(() => Promise.resolve({ data: null, error: null }))
        }))
      })),
      insert: jest.fn(() => Promise.resolve({ data: null, error: null }))
    }))
  }
}));

const mockToast = {
  toast: jest.fn()
};

(useToast as jest.Mock).mockReturnValue(mockToast);

describe('AppointmentBooking', () => {
  const defaultProps = {
    patientId: 'test-patient-id',
    onBookingComplete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders appointment booking form', () => {
    render(<AppointmentBooking {...defaultProps} />);
    
    expect(screen.getByText(/book appointment/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/appointment date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/appointment time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/reason/i)).toBeInTheDocument();
  });

  it('allows user to select appointment date', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    const dateInput = screen.getByLabelText(/appointment date/i);
    await user.type(dateInput, '2024-01-15');
    
    expect(dateInput).toHaveValue('2024-01-15');
  });

  it('allows user to select appointment time', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    const timeInput = screen.getByLabelText(/appointment time/i);
    await user.type(timeInput, '14:30');
    
    expect(timeInput).toHaveValue('14:30');
  });

  it('allows user to enter appointment reason', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    const reasonInput = screen.getByLabelText(/reason/i);
    await user.type(reasonInput, 'Regular checkup');
    
    expect(reasonInput).toHaveValue('Regular checkup');
  });

  it('shows urgency level options', () => {
    render(<AppointmentBooking {...defaultProps} />);
    
    expect(screen.getByText(/urgency level/i)).toBeInTheDocument();
    expect(screen.getByText(/low/i)).toBeInTheDocument();
    expect(screen.getByText(/normal/i)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
    expect(screen.getByText(/urgent/i)).toBeInTheDocument();
  });

  it('allows user to select urgency level', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    const urgencySelect = screen.getByLabelText(/urgency level/i);
    await user.selectOptions(urgencySelect, 'high');
    
    expect(urgencySelect).toHaveValue('high');
  });

  it('shows validation error for required fields', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/appointment date is required/i)).toBeInTheDocument();
      expect(screen.getByText(/appointment time is required/i)).toBeInTheDocument();
      expect(screen.getByText(/reason is required/i)).toBeInTheDocument();
    });
  });

  it('submits appointment booking successfully', async () => {
    const user = userEvent.setup();
    const onBookingComplete = jest.fn();
    render(<AppointmentBooking {...defaultProps} onBookingComplete={onBookingComplete} />);
    
    // Fill in required fields
    const dateInput = screen.getByLabelText(/appointment date/i);
    const timeInput = screen.getByLabelText(/appointment time/i);
    const reasonInput = screen.getByLabelText(/reason/i);
    const urgencySelect = screen.getByLabelText(/urgency level/i);
    
    await user.type(dateInput, '2024-01-15');
    await user.type(timeInput, '14:30');
    await user.type(reasonInput, 'Regular checkup');
    await user.selectOptions(urgencySelect, 'normal');
    
    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Success',
        description: 'Appointment booked successfully',
        variant: 'default'
      });
      expect(onBookingComplete).toHaveBeenCalled();
    });
  });

  it('shows loading state during submission', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    // Fill in required fields
    const dateInput = screen.getByLabelText(/appointment date/i);
    const timeInput = screen.getByLabelText(/appointment time/i);
    const reasonInput = screen.getByLabelText(/reason/i);
    
    await user.type(dateInput, '2024-01-15');
    await user.type(timeInput, '14:30');
    await user.type(reasonInput, 'Regular checkup');
    
    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);
    
    expect(screen.getByText(/booking appointment/i)).toBeInTheDocument();
  });

  it('handles booking error gracefully', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock supabase to return error
    const { supabase } = await import('@/integrations/supabase/client');
    supabase.from.mockReturnValue({
      insert: jest.fn(() => Promise.resolve({ 
        data: null, 
        error: { message: 'Database error' } 
      }))
    });
    
    render(<AppointmentBooking {...defaultProps} />);
    
    // Fill in required fields
    const dateInput = screen.getByLabelText(/appointment date/i);
    const timeInput = screen.getByLabelText(/appointment time/i);
    const reasonInput = screen.getByLabelText(/reason/i);
    
    await user.type(dateInput, '2024-01-15');
    await user.type(timeInput, '14:30');
    await user.type(reasonInput, 'Regular checkup');
    
    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: 'Error',
        description: 'Failed to book appointment',
        variant: 'destructive'
      });
    });
    
    consoleSpy.mockRestore();
  });

  it('validates future date selection', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    const dateInput = screen.getByLabelText(/appointment date/i);
    const timeInput = screen.getByLabelText(/appointment time/i);
    const reasonInput = screen.getByLabelText(/reason/i);
    
    // Try to select past date
    await user.type(dateInput, '2020-01-15');
    await user.type(timeInput, '14:30');
    await user.type(reasonInput, 'Regular checkup');
    
    const submitButton = screen.getByRole('button', { name: /book appointment/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(screen.getByText(/appointment date must be in the future/i)).toBeInTheDocument();
    });
  });

  it('allows user to cancel booking', async () => {
    const user = userEvent.setup();
    render(<AppointmentBooking {...defaultProps} />);
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);
    
    // Should reset form or close modal
    expect(screen.getByLabelText(/appointment date/i)).toHaveValue('');
  });
});