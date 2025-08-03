import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, XCircle, Database } from "lucide-react";

export function DebugDatabaseConnection() {
  const [testResults, setTestResults] = useState<any>({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
  };

  const runDatabaseTests = async () => {
    setLoading(true);
    const results: any = {};

    try {
      // Test prescriptions table
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('count', { count: 'exact', head: true });
      
      results.prescriptions = {
        exists: !prescriptionsError,
        error: prescriptionsError?.message,
        count: prescriptions?.length || 0
      };

      // Test treatment_plans table
      const { data: treatmentPlans, error: treatmentPlansError } = await supabase
        .from('treatment_plans')
        .select('count', { count: 'exact', head: true });
      
      results.treatmentPlans = {
        exists: !treatmentPlansError,
        error: treatmentPlansError?.message,
        count: treatmentPlans?.length || 0
      };

      // Test profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact', head: true });
      
      results.profiles = {
        exists: !profilesError,
        error: profilesError?.message,
        count: profiles?.length || 0
      };

      // Test dentists table
      const { data: dentists, error: dentistsError } = await supabase
        .from('dentists')
        .select('count', { count: 'exact', head: true });
      
      results.dentists = {
        exists: !dentistsError,
        error: dentistsError?.message,
        count: dentists?.length || 0
      };

      // Test if user is authenticated as dentist
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (!profileError && profile) {
          const { data: dentist, error: dentistError } = await supabase
            .from('dentists')
            .select('*')
            .eq('profile_id', profile.id)
            .single();

          results.dentistAuth = {
            isDentist: !dentistError,
            error: dentistError?.message,
            profile: profile,
            dentist: dentist
          };
        } else {
          results.dentistAuth = {
            isDentist: false,
            error: profileError?.message
          };
        }
      } else {
        results.dentistAuth = {
          isDentist: false,
          error: "User not authenticated"
        };
      }

    } catch (error: any) {
      results.generalError = error.message;
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Database className="h-5 w-5" />
          <span>Database Connection Debug</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              Test database connection and table access
            </p>
            {user && (
              <p className="text-xs text-muted-foreground mt-1">
                Logged in as: {user.email}
              </p>
            )}
          </div>
          <Button onClick={runDatabaseTests} disabled={loading}>
            {loading ? "Testing..." : "Run Tests"}
          </Button>
        </div>

        {Object.keys(testResults).length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold">Test Results:</h4>
            
            {testResults.generalError && (
              <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <span className="text-red-800">General Error: {testResults.generalError}</span>
              </div>
            )}

            {testResults.prescriptions && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {testResults.prescriptions.exists ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Prescriptions Table</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={testResults.prescriptions.exists ? "default" : "destructive"}>
                    {testResults.prescriptions.exists ? "Exists" : "Missing"}
                  </Badge>
                  {testResults.prescriptions.error && (
                    <span className="text-xs text-red-600">{testResults.prescriptions.error}</span>
                  )}
                </div>
              </div>
            )}

            {testResults.treatmentPlans && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {testResults.treatmentPlans.exists ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Treatment Plans Table</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={testResults.treatmentPlans.exists ? "default" : "destructive"}>
                    {testResults.treatmentPlans.exists ? "Exists" : "Missing"}
                  </Badge>
                  {testResults.treatmentPlans.error && (
                    <span className="text-xs text-red-600">{testResults.treatmentPlans.error}</span>
                  )}
                </div>
              </div>
            )}

            {testResults.dentistAuth && (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-2">
                  {testResults.dentistAuth.isDentist ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  <span className="font-medium">Dentist Authentication</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant={testResults.dentistAuth.isDentist ? "default" : "destructive"}>
                    {testResults.dentistAuth.isDentist ? "Authenticated" : "Not Authenticated"}
                  </Badge>
                  {testResults.dentistAuth.error && (
                    <span className="text-xs text-red-600">{testResults.dentistAuth.error}</span>
                  )}
                </div>
              </div>
            )}

            {testResults.dentistAuth?.isDentist && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-800">Ready to Use</span>
                </div>
                <p className="text-sm text-green-700">
                  Database connection is working and you are authenticated as a dentist. 
                  You should be able to access the prescription and treatment plan functionality 
                  in the Patients tab of the dentist dashboard.
                </p>
              </div>
            )}

            {!testResults.dentistAuth?.isDentist && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600" />
                  <span className="font-medium text-yellow-800">Authentication Issue</span>
                </div>
                <p className="text-sm text-yellow-700">
                  You are not authenticated as a dentist. Please make sure you are logged in 
                  with a dentist account to access the prescription and treatment plan functionality.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}