import { createContext, useContext, ReactNode, useEffect } from 'react';
import { useClinicContext } from '@/hooks/useClinicContext';
import { ModernLoadingSpinner } from '@/components/enhanced/ModernLoadingSpinner';

interface ClinicContextType {
  clinicId?: string;
  dentistId?: string;
  name?: string;
  businessSlug?: string;
  primaryColor?: string;
  secondaryColor?: string;
}

const ClinicContext = createContext<ClinicContextType>({});

export const useClinic = () => useContext(ClinicContext);

interface ClinicContextProviderProps {
  children: ReactNode;
}

export const ClinicContextProvider = ({ children }: ClinicContextProviderProps) => {
  const { clinicInfo, loading, error } = useClinicContext();

  // Apply clinic branding via CSS variables
  useEffect(() => {
    if (clinicInfo) {
      document.documentElement.style.setProperty('--clinic-primary', clinicInfo.primaryColor);
      document.documentElement.style.setProperty('--clinic-secondary', clinicInfo.secondaryColor);
    }
    
    return () => {
      document.documentElement.style.removeProperty('--clinic-primary');
      document.documentElement.style.removeProperty('--clinic-secondary');
    };
  }, [clinicInfo]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <ModernLoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive mb-2">Clinic Not Found</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  const contextValue: ClinicContextType = clinicInfo ? {
    clinicId: clinicInfo.clinicId,
    dentistId: clinicInfo.dentistId,
    name: clinicInfo.name,
    businessSlug: clinicInfo.businessSlug,
    primaryColor: clinicInfo.primaryColor,
    secondaryColor: clinicInfo.secondaryColor,
  } : {};

  return (
    <ClinicContext.Provider value={contextValue}>
      {children}
    </ClinicContext.Provider>
  );
};