import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SecurityTesting } from "@/components/SecurityTesting";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Database,
  Users,
  Settings,
  Activity,
  Clock,
  TrendingUp,
  AlertCircle
} from "lucide-react";

interface SecurityMetrics {
  totalUsers: number;
  activeSessions: number;
  failedLoginAttempts: number;
  securityEvents: number;
  auditLogs: number;
  encryptedRecords: number;
}

export const SecurityDashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalUsers: 0,
    activeSessions: 0,
    failedLoginAttempts: 0,
    securityEvents: 0,
    auditLogs: 0,
    encryptedRecords: 0
  });
  const [recentSecurityEvents, setRecentSecurityEvents] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    checkUserPermissions();
    loadSecurityMetrics();
  }, []);

  const checkUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Access Denied",
          description: "You must be logged in to access the security dashboard",
          variant: "destructive",
        });
        return;
      }

      // Check if user is admin
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (profile?.role !== 'admin') {
        toast({
          title: "Access Denied",
          description: "Only administrators can access the security dashboard",
          variant: "destructive",
        });
        return;
      }

      setUser(user);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to check user permissions",
        variant: "destructive",
      });
    }
  };

  const loadSecurityMetrics = async () => {
    try {
      setIsLoading(true);

      // Get total users
      const { count: totalUsers } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // Get active sessions
      const { count: activeSessions } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Get failed login attempts (security events)
      const { count: failedLoginAttempts } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true })
        .eq('event_type', 'failed_login');

      // Get total security events
      const { count: securityEvents } = await supabase
        .from('security_events')
        .select('*', { count: 'exact', head: true });

      // Get audit logs count
      const { count: auditLogs } = await supabase
        .from('audit_logs')
        .select('*', { count: 'exact', head: true });

      // Get encrypted records count
      const { count: encryptedRecords } = await supabase
        .from('encryption_metadata')
        .select('*', { count: 'exact', head: true });

      setMetrics({
        totalUsers: totalUsers || 0,
        activeSessions: activeSessions || 0,
        failedLoginAttempts: failedLoginAttempts || 0,
        securityEvents: securityEvents || 0,
        auditLogs: auditLogs || 0,
        encryptedRecords: encryptedRecords || 0
      });

      // Load recent security events
      const { data: events } = await supabase
        .from('security_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      setRecentSecurityEvents(events || []);

    } catch (error) {
      console.error('Failed to load security metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load security metrics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getEventTypeIcon = (eventType: string) => {
    switch (eventType) {
      case 'failed_login':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'suspicious_activity':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'data_breach_attempt':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'unauthorized_access':
        return <Eye className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading Security Dashboard...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">
              You must be logged in as an administrator to access the security dashboard.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Security Dashboard
          </h1>
          <p className="text-muted-foreground">
            Monitor and manage security for the Denti Smart Scheduler platform
          </p>
        </div>
        <Button onClick={loadSecurityMetrics} variant="outline">
          <Activity className="h-4 w-4 mr-2" />
          Refresh Metrics
        </Button>
      </div>

      {/* Security Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Registered users in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.activeSessions}</div>
            <p className="text-xs text-muted-foreground">
              Currently active user sessions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Login Attempts</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.failedLoginAttempts}</div>
            <p className="text-xs text-muted-foreground">
              Failed authentication attempts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.securityEvents}</div>
            <p className="text-xs text-muted-foreground">
              Total security events logged
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Audit Logs</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.auditLogs}</div>
            <p className="text-xs text-muted-foreground">
              Total audit log entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Encrypted Records</CardTitle>
            <Lock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.encryptedRecords}</div>
            <p className="text-xs text-muted-foreground">
              Sensitive data fields encrypted
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Security Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Security Events
          </CardTitle>
          <CardDescription>
            Latest security events and incidents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentSecurityEvents.length > 0 ? (
            <div className="space-y-4">
              {recentSecurityEvents.map((event) => (
                <div key={event.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getEventTypeIcon(event.event_type)}
                    <div>
                      <p className="font-medium">{event.event_type.replace('_', ' ')}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(event.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={getSeverityColor(event.severity)}>
                      {event.severity}
                    </Badge>
                    {event.resolved ? (
                      <Badge variant="default">Resolved</Badge>
                    ) : (
                      <Badge variant="secondary">Open</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No recent security events</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Testing Component */}
      <SecurityTesting />
    </div>
  );
};