import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

interface TestResult {
  test: string;
  success: boolean;
  message: string;
}

export function DatabaseTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const runTests = async () => {
    setLoading(true);
    setResults([]);
    const newResults: TestResult[] = [];

    try {
      // Test 1: Check if user is authenticated
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        newResults.push({
          test: "User Authentication",
          success: true,
          message: `User ${user.email} is authenticated`
        });
      } else {
        newResults.push({
          test: "User Authentication",
          success: false,
          message: "No user is authenticated"
        });
      }

      // Test 2: Check if user has a profile
      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profile && !profileError) {
          newResults.push({
            test: "User Profile",
            success: true,
            message: `Profile found for ${profile.first_name} ${profile.last_name}`
          });

          // Test 3: Try to insert a test note
          const { data: noteData, error: noteError } = await supabase
            .from('patient_notes')
            .insert({
              patient_id: profile.id,
              dentist_id: profile.id, // Using same ID for test
              title: 'Test Note',
              content: 'This is a test note to verify database policies',
              note_type: 'clinical'
            })
            .select()
            .single();

          if (noteData && !noteError) {
            newResults.push({
              test: "Insert Patient Note",
              success: true,
              message: "Successfully inserted test note"
            });

            // Test 4: Try to read the note back
            const { data: readNote, error: readError } = await supabase
              .from('patient_notes')
              .select('*')
              .eq('id', noteData.id)
              .single();

            if (readNote && !readError) {
              newResults.push({
                test: "Read Patient Note",
                success: true,
                message: "Successfully read test note"
              });
            } else {
              newResults.push({
                test: "Read Patient Note",
                success: false,
                message: readError?.message || "Failed to read test note"
              });
            }

            // Test 5: Try to update the note
            const { error: updateError } = await supabase
              .from('patient_notes')
              .update({ content: 'Updated test note' })
              .eq('id', noteData.id);

            if (!updateError) {
              newResults.push({
                test: "Update Patient Note",
                success: true,
                message: "Successfully updated test note"
              });
            } else {
              newResults.push({
                test: "Update Patient Note",
                success: false,
                message: updateError.message
              });
            }

            // Test 6: Try to delete the note
            const { error: deleteError } = await supabase
              .from('patient_notes')
              .delete()
              .eq('id', noteData.id);

            if (!deleteError) {
              newResults.push({
                test: "Delete Patient Note",
                success: true,
                message: "Successfully deleted test note"
              });
            } else {
              newResults.push({
                test: "Delete Patient Note",
                success: false,
                message: deleteError.message
              });
            }

          } else {
            newResults.push({
              test: "Insert Patient Note",
              success: false,
              message: noteError?.message || "Failed to insert test note"
            });
          }

        } else {
          newResults.push({
            test: "User Profile",
            success: false,
            message: profileError?.message || "No profile found"
          });
        }
      }

      // Test 7: Check if treatment plans table is accessible
      const { data: treatmentPlans, error: treatmentPlansError } = await supabase
        .from('treatment_plans')
        .select('count')
        .limit(1);

      if (!treatmentPlansError) {
        newResults.push({
          test: "Treatment Plans Table",
          success: true,
          message: "Treatment plans table is accessible"
        });
      } else {
        newResults.push({
          test: "Treatment Plans Table",
          success: false,
          message: treatmentPlansError.message
        });
      }

      // Test 8: Check if prescriptions table is accessible
      const { data: prescriptions, error: prescriptionsError } = await supabase
        .from('prescriptions')
        .select('count')
        .limit(1);

      if (!prescriptionsError) {
        newResults.push({
          test: "Prescriptions Table",
          success: true,
          message: "Prescriptions table is accessible"
        });
      } else {
        newResults.push({
          test: "Prescriptions Table",
          success: false,
          message: prescriptionsError.message
        });
      }

    } catch (error: unknown) {
      newResults.push({
        test: "General Test",
        success: false,
        message: error instanceof Error ? error.message : "Unknown error"
      });
    }

    setResults(newResults);
    setLoading(false);

    const successCount = newResults.filter(r => r.success).length;
    const totalCount = newResults.length;

    toast({
      title: "Database Test Complete",
      description: `${successCount}/${totalCount} tests passed`,
      variant: successCount === totalCount ? "default" : "destructive",
    });
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Database Connection Test</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={runTests} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              "Run Database Tests"
            )}
          </Button>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 bg-muted rounded-lg">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <div className="flex-1">
                    <p className="font-medium">{result.test}</p>
                    <p className="text-sm text-muted-foreground">{result.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}