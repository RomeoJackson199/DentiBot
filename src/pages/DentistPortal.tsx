import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { lazy, Suspense, useEffect, useState } from "react";
import { ModernLoadingSpinner } from "@/components/enhanced/ModernLoadingSpinner";
import { 
  Calendar, 
  DollarSign, 
  UserCog, 
  Settings
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const DentistAdminUsers = lazy(() => import("@/pages/DentistAdminUsers"));
const DentistAdminBranding = lazy(() => import("@/pages/DentistAdminBranding"));
const DentistAdminSecurity = lazy(() => import("@/pages/DentistAdminSecurity"));

export function DentistPortal() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isProvider, isAdmin, loading: roleLoading } = useUserRole();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Determine active tab from URL
  const getActiveTab = () => {
    const path = location.pathname;
    if (path.startsWith('/dentist/clinical')) return 'clinical';
    if (path.startsWith('/dentist/business')) return 'business';
    if (path.startsWith('/dentist/ops')) return 'ops';
    if (path.startsWith('/dentist/admin')) return 'admin';
    return 'clinical';
  };

  useEffect(() => {
    const checkAccess = async () => {
      if (roleLoading) return;

      if (!isProvider && !isAdmin) {
        navigate('/', { replace: true });
        return;
      }

      // Get user's business
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/', { replace: true });
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!profile) {
        navigate('/', { replace: true });
        return;
      }

      // Check if user owns any business
      const { data: businesses } = await supabase
        .from('businesses' as any)
        .select('id')
        .eq('owner_profile_id', profile.id);

      if (!businesses || businesses.length === 0) {
        navigate('/start', { replace: true });
        return;
      }

      setBusinessId(businesses[0].id);
      setLoading(false);
    };

    checkAccess();
  }, [isProvider, isAdmin, roleLoading, navigate]);

  const handleTabChange = (value: string) => {
    switch (value) {
      case 'clinical':
        navigate('/dentist/clinical/dashboard');
        break;
      case 'business':
        navigate('/dentist/business/payments');
        break;
      case 'ops':
        navigate('/dentist/ops/inventory');
        break;
      case 'admin':
        navigate('/dentist/admin/branding');
        break;
    }
  };

  if (roleLoading || loading) {
    return <ModernLoadingSpinner variant="overlay" message="Loading Dashboard..." />;
  }

  if (!businessId) {
    return <Navigate to="/start" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4">
      <div className="mb-6">
        <Tabs value={getActiveTab()} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="clinical" className="gap-2">
              <Calendar className="h-4 w-4" />
              Clinical
            </TabsTrigger>
            <TabsTrigger value="business" className="gap-2">
              <DollarSign className="h-4 w-4" />
              Business
            </TabsTrigger>
            <TabsTrigger value="ops" className="gap-2">
              <Settings className="h-4 w-4" />
              Operations
            </TabsTrigger>
            <TabsTrigger value="admin" className="gap-2">
              <UserCog className="h-4 w-4" />
              Admin
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <Suspense fallback={<ModernLoadingSpinner message="Loading..." />}>
        <Routes>
          {/* Clinical Routes */}
          <Route path="clinical/dashboard" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Clinical Dashboard</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />
          <Route path="clinical/patients" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Patient Management</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />
          <Route path="clinical/appointments" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Appointments</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />
          <Route path="clinical/schedule" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Schedule Settings</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />

          {/* Business Routes */}
          <Route path="business/payments" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Payment Requests</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />
          <Route path="business/analytics" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Analytics</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />

          {/* Operations Routes */}
          <Route path="ops/inventory" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Inventory Management</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />
          <Route path="ops/imports" element={
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold mb-4">Data Imports</h2>
              <p className="text-muted-foreground">This section needs to be rebuilt for the new multi-business platform.</p>
            </div>
          } />

          {/* Admin Routes */}
          <Route path="admin/users" element={<DentistAdminUsers />} />
          <Route path="admin/branding" element={<DentistAdminBranding />} />
          <Route path="admin/security" element={<DentistAdminSecurity />} />

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/dentist/admin/branding" replace />} />
        </Routes>
      </Suspense>
      </div>
    </div>
  );
}

export default DentistPortal;
