import React from 'react';
import { useIndustryTerminology } from '@/hooks/useIndustryTerminology';

interface TerminologyTextProps {
  term: 'provider' | 'providers' | 'client' | 'clients' | 'appointment' | 'appointments' | 'service' | 'services' | 'payment' | 'payments';
  className?: string;
  capitalize?: boolean;
}

/**
 * Component that displays industry-specific terminology
 * Usage: <TerminologyText term="client" /> will show "Patient" for healthcare, "Member" for fitness, etc.
 */
export const TerminologyText: React.FC<TerminologyTextProps> = ({ 
  term, 
  className,
  capitalize = false 
}) => {
  const { terminology } = useIndustryTerminology();
  
  let text = terminology[term];
  
  if (capitalize && text) {
    text = text.charAt(0).toUpperCase() + text.slice(1);
  }
  
  return <span className={className}>{text}</span>;
};
