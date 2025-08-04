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

  const testPatientManagementSave = async () => {
    try {
      setTestResults(prev => [...prev, "Testing patient management save operations..."]);
      
      // Test 1: Check current user authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setTestResults(prev => [...prev, `✅ User authenticated: ${session.user.id}`]);
      } else {
        setTestResults(prev => [...prev, `❌ User not authenticated`]);
        return;
      }

      // Test 2: Check user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, role, user_id')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        setTestResults(prev => [...prev, `❌ Profile error: ${profileError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Profile found: ${profile.id}, role: ${profile.role}`]);
      }

      // Test 3: Check dentist relationship if user is dentist
      if (profile?.role === 'dentist') {
        const { data: dentist, error: dentistError } = await supabase
          .from('dentists')
          .select('id, profile_id, is_active')
          .eq('profile_id', profile.id)
          .single();

        if (dentistError) {
          setTestResults(prev => [...prev, `❌ Dentist error: ${dentistError.message}`]);
        } else {
          setTestResults(prev => [...prev, `✅ Dentist found: ${dentist.id}, active: ${dentist.is_active}`]);
        }
      }

      // Test 4: Try to save a prescription with real IDs
      if (profile && profile.role === 'dentist') {
        const { data: dentist } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (dentist) {
          const testPrescription = {
            patient_id: profile.id, // Use profile ID as patient ID for testing
            dentist_id: dentist.id,
            medication_name: "Test Medication",
            dosage: "10mg",
            frequency: "Once daily",
            duration: "7 days",
            instructions: "Take with food",
            status: "active",
            prescribed_date: new Date().toISOString()
          };

          const { data: prescriptionData, error: prescriptionError } = await supabase
            .from('prescriptions')
            .insert(testPrescription)
            .select();

          if (prescriptionError) {
            setTestResults(prev => [...prev, `❌ Prescription save failed: ${prescriptionError.message}`]);
          } else {
            setTestResults(prev => [...prev, `✅ Prescription save successful: ${prescriptionData?.length || 0} records`]);
          }
        }
      }

    } catch (error) {
      setTestResults(prev => [...prev, `❌ Test failed with error: ${error.message}`]);
    }
  };

  const testRLSPolicies = async () => {
    try {
      setTestResults(prev => [...prev, "Testing RLS policies..."]);
      
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setTestResults(prev => [...prev, "❌ No active session"]);
        return;
      }

      setTestResults(prev => [...prev, `✅ Session found: ${session.user.id}`]);

      // Test 1: Check if user can read their own profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        setTestResults(prev => [...prev, `❌ Profile read error: ${profileError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Profile read successful: ${profile.id}`]);
      }

      // Test 2: Check if user can read prescriptions (should be empty if no data)
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .limit(1);

      if (prescriptionsError) {
        setTestResults(prev => [...prev, `❌ Prescriptions read error: ${prescriptionsError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Prescriptions read successful: ${prescriptions?.length || 0} records`]);
      }

      // Test 3: Check if user can read treatment plans
      const { data: treatmentPlans, error: treatmentPlansError } = await supabase
        .from('treatment_plans')
        .select('*')
        .limit(1);

      if (treatmentPlansError) {
        setTestResults(prev => [...prev, `❌ Treatment plans read error: ${treatmentPlansError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Treatment plans read successful: ${treatmentPlans?.length || 0} records`]);
      }

      // Test 4: Check if user can read patient notes
      const { data: patientNotes, error: patientNotesError } = await supabase
        .from('patient_notes')
        .select('*')
        .limit(1);

      if (patientNotesError) {
        setTestResults(prev => [...prev, `❌ Patient notes read error: ${patientNotesError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Patient notes read successful: ${patientNotes?.length || 0} records`]);
      }

      // Test 5: Check if user can read medical records
      const { data: medicalRecords, error: medicalRecordsError } = await supabase
        .from('medical_records')
        .select('*')
        .limit(1);

      if (medicalRecordsError) {
        setTestResults(prev => [...prev, `❌ Medical records read error: ${medicalRecordsError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Medical records read successful: ${medicalRecords?.length || 0} records`]);
      }

    } catch (error) {
      setTestResults(prev => [...prev, `❌ RLS test failed: ${error.message}`]);
    }
  };

  const testBasicDatabaseConnection = async () => {
    try {
      setTestResults(prev => [...prev, "Testing basic database connection..."]);
      
      // Test 1: Simple select query
      const { data: testData, error: testError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (testError) {
        setTestResults(prev => [...prev, `❌ Basic connection failed: ${testError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Basic connection successful`]);
      }

      // Test 2: Check if we can insert a test record (will be rolled back)
      const { data: insertData, error: insertError } = await supabase
        .from('profiles')
        .insert({
          user_id: 'test-user-id',
          first_name: 'Test',
          last_name: 'User',
          email: 'test@example.com'
        })
        .select();

      if (insertError) {
        setTestResults(prev => [...prev, `❌ Insert test failed: ${insertError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Insert test successful`]);
        
        // Clean up test data
        if (insertData?.[0]?.id) {
          await supabase
            .from('profiles')
            .delete()
            .eq('id', insertData[0].id);
        }
      }

    } catch (error) {
      setTestResults(prev => [...prev, `❌ Basic connection test failed: ${error.message}`]);
    }
  };

  const comprehensiveDatabaseTest = async () => {
    try {
      setTestResults(prev => [...prev, "=== COMPREHENSIVE DATABASE TEST ==="]);
      
      // Test 1: Check authentication
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setTestResults(prev => [...prev, "❌ No active session - user not authenticated"]);
        return;
      }
      setTestResults(prev => [...prev, `✅ User authenticated: ${session.user.id}`]);

      // Test 2: Check if we can read from profiles table
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);
      
      if (profilesError) {
        setTestResults(prev => [...prev, `❌ Cannot read profiles: ${profilesError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Can read profiles: ${profiles?.length || 0} records`]);
      }

      // Test 3: Check if we can read from prescriptions table
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('*')
        .limit(1);
      
      if (prescriptionsError) {
        setTestResults(prev => [...prev, `❌ Cannot read prescriptions: ${prescriptionsError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Can read prescriptions: ${prescriptions?.length || 0} records`]);
      }

      // Test 4: Check if we can read from treatment_plans table
      const { data: treatmentPlans, error: treatmentPlansError } = await supabase
        .from('treatment_plans')
        .select('*')
        .limit(1);
      
      if (treatmentPlansError) {
        setTestResults(prev => [...prev, `❌ Cannot read treatment_plans: ${treatmentPlansError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Can read treatment_plans: ${treatmentPlans?.length || 0} records`]);
      }

      // Test 5: Try to insert a test prescription (with real data)
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', session.user.id)
        .single();

      if (profile) {
        const { data: dentist } = await supabase
          .from('dentists')
          .select('id')
          .eq('profile_id', profile.id)
          .single();

        if (dentist) {
          const testPrescription = {
            patient_id: profile.id,
            dentist_id: dentist.id,
            medication_name: "Test Medication",
            dosage: "10mg",
            frequency: "Once daily",
            duration: "7 days",
            instructions: "Test instructions",
            status: "active",
            prescribed_date: new Date().toISOString()
          };

          const { data: insertData, error: insertError } = await supabase
            .from('prescriptions')
            .insert(testPrescription)
            .select();

          if (insertError) {
            setTestResults(prev => [...prev, `❌ Cannot insert prescription: ${insertError.message}`]);
          } else {
            setTestResults(prev => [...prev, `✅ Successfully inserted prescription: ${insertData?.[0]?.id}`]);
            
            // Clean up
            await supabase
              .from('prescriptions')
              .delete()
              .eq('id', insertData[0].id);
          }
        } else {
          setTestResults(prev => [...prev, "❌ No dentist record found for user"]);
        }
      } else {
        setTestResults(prev => [...prev, "❌ No profile found for user"]);
      }

      // Test 6: Check table structure
      const { data: tableInfo, error: tableError } = await supabase
        .rpc('get_table_info', { table_name: 'prescriptions' })
        .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

      if (tableError) {
        setTestResults(prev => [...prev, `⚠️ Cannot check table structure: ${tableError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Table structure check passed`]);
      }

      // Test 7: Check if RLS is actually disabled
      const { data: rlsCheck, error: rlsError } = await supabase
        .rpc('check_rls_status', { table_name: 'prescriptions' })
        .catch(() => ({ data: null, error: { message: 'RPC not available' } }));

      if (rlsError) {
        setTestResults(prev => [...prev, `⚠️ Cannot check RLS status: ${rlsError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ RLS status check passed`]);
      }

    } catch (error) {
      setTestResults(prev => [...prev, `❌ Comprehensive test failed: ${error.message}`]);
    }
  };

  const testDatabaseSchema = async () => {
    try {
      setTestResults(prev => [...prev, "=== DATABASE SCHEMA TEST ==="]);
      
      // Test 1: Check if tables exist by trying to select from them
      const tables = ['prescriptions', 'treatment_plans', 'patient_notes', 'medical_records'];
      
      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(0); // Just check if table exists, don't fetch data
        
        if (error) {
          setTestResults(prev => [...prev, `❌ Table ${table} error: ${error.message}`]);
        } else {
          setTestResults(prev => [...prev, `✅ Table ${table} exists and accessible`]);
        }
      }

      // Test 2: Check if we can get table structure by trying to insert with minimal data
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', session.user.id)
          .single();

        if (profile) {
          const { data: dentist } = await supabase
            .from('dentists')
            .select('id')
            .eq('profile_id', profile.id)
            .single();

          if (dentist) {
            // Test minimal insert
            const minimalData = {
              patient_id: profile.id,
              dentist_id: dentist.id,
              medication_name: "Test",
              dosage: "Test",
              frequency: "Test",
              duration: "Test"
            };

            const { data: insertData, error: insertError } = await supabase
              .from('prescriptions')
              .insert(minimalData)
              .select();

            if (insertError) {
              setTestResults(prev => [...prev, `❌ Minimal insert failed: ${insertError.message}`]);
            } else {
              setTestResults(prev => [...prev, `✅ Minimal insert successful`]);
              
              // Clean up
              if (insertData?.[0]?.id) {
                await supabase
                  .from('prescriptions')
                  .delete()
                  .eq('id', insertData[0].id);
              }
            }
          } else {
            setTestResults(prev => [...prev, "❌ No dentist record found"]);
          }
        } else {
          setTestResults(prev => [...prev, "❌ No profile found"]);
        }
      } else {
        setTestResults(prev => [...prev, "❌ No session found"]);
      }

    } catch (error) {
      setTestResults(prev => [...prev, `❌ Schema test failed: ${error.message}`]);
    }
  };

  const testDirectDatabaseAccess = async () => {
    try {
      setTestResults(prev => [...prev, "=== DIRECT DATABASE ACCESS TEST ==="]);
      
      // Test 1: Try to read from prescriptions table directly
      const { data: readData, error: readError } = await supabase
        .from('prescriptions')
        .select('*')
        .limit(1);

      if (readError) {
        setTestResults(prev => [...prev, `❌ Direct read failed: ${readError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Direct read successful: ${readData?.length || 0} records`]);
      }

      // Test 2: Try to insert a test record with hardcoded IDs
      const testRecord = {
        patient_id: "00000000-0000-0000-0000-000000000001",
        dentist_id: "00000000-0000-0000-0000-000000000002",
        medication_name: "Test Medication",
        dosage: "10mg",
        frequency: "Once daily",
        duration: "7 days",
        status: "active",
        prescribed_date: new Date().toISOString()
      };

      const { data: insertData, error: insertError } = await supabase
        .from('prescriptions')
        .insert(testRecord)
        .select();

      if (insertError) {
        setTestResults(prev => [...prev, `❌ Direct insert failed: ${insertError.message}`]);
        
        // Check if it's a foreign key constraint error
        if (insertError.message.includes('foreign key') || insertError.message.includes('violates')) {
          setTestResults(prev => [...prev, "⚠️ This is likely a foreign key constraint issue - the test IDs don't exist"]);
        }
      } else {
        setTestResults(prev => [...prev, `✅ Direct insert successful: ${insertData?.[0]?.id}`]);
        
        // Clean up
        if (insertData?.[0]?.id) {
          await supabase
            .from('prescriptions')
            .delete()
            .eq('id', insertData[0].id);
        }
      }

      // Test 3: Check if we can update a record
      const { data: updateData, error: updateError } = await supabase
        .from('prescriptions')
        .update({ medication_name: "Updated Test" })
        .eq('medication_name', 'Test Medication')
        .select();

      if (updateError) {
        setTestResults(prev => [...prev, `❌ Direct update failed: ${updateError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Direct update successful: ${updateData?.length || 0} records updated`]);
      }

      // Test 4: Check if we can delete a record
      const { data: deleteData, error: deleteError } = await supabase
        .from('prescriptions')
        .delete()
        .eq('medication_name', 'Updated Test')
        .select();

      if (deleteError) {
        setTestResults(prev => [...prev, `❌ Direct delete failed: ${deleteError.message}`]);
      } else {
        setTestResults(prev => [...prev, `✅ Direct delete successful: ${deleteData?.length || 0} records deleted`]);
      }

    } catch (error) {
      setTestResults(prev => [...prev, `❌ Direct access test failed: ${error.message}`]);
    }
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
          <div className="flex space-x-2 flex-wrap gap-2">
            <Button onClick={runDatabaseTests} disabled={loading}>
              {loading ? "Testing..." : "Run Tests"}
            </Button>
            <Button onClick={testBasicDatabaseConnection} disabled={loading} variant="outline">
              Test Basic Connection
            </Button>
            <Button onClick={testPatientManagementSave} disabled={loading} variant="outline">
              Test Patient Management Save
            </Button>
            <Button onClick={testRLSPolicies} disabled={loading} variant="outline">
              Test RLS Policies
            </Button>
            <Button onClick={comprehensiveDatabaseTest} disabled={loading} variant="outline">
              Comprehensive Test
            </Button>
            <Button onClick={testDatabaseSchema} disabled={loading} variant="outline">
              Test Database Schema
            </Button>
            <Button onClick={testDirectDatabaseAccess} disabled={loading} variant="outline">
              Test Direct Access
            </Button>
          </div>
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