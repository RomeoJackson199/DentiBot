import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { saveProfileData, loadProfileData, testDatabaseConnection } from "@/lib/profileUtils";

interface TestMedicalRecordsProps {
  user: User;
}

export const TestMedicalRecords = ({ user }: TestMedicalRecordsProps) => {
  const { toast } = useToast();
  const [testData, setTestData] = useState({
    address: '123 Test Street, Brussels, Belgium',
    emergency_contact: 'John Doe - +32 123 456 789',
    date_of_birth: '1990-01-01',
    medical_history: 'No known allergies. Previous dental work in 2020.'
  });
  const [currentProfile, setCurrentProfile] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [testResults, setTestResults] = useState<string[]>([]);

  useEffect(() => {
    loadCurrentProfile();
  }, [user]);

  const loadCurrentProfile = async () => {
    try {
      const profile = await loadProfileData(user);
      setCurrentProfile(profile);
      addTestResult('✅ Profile loaded successfully');
    } catch (error) {
      addTestResult('❌ Failed to load profile: ' + error);
    }
  };

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const runComprehensiveTest = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addTestResult('🚀 Starting comprehensive medical records persistence test...');
      
      // Test 1: Database connection
      addTestResult('Testing database connection...');
      const connectionTest = await testDatabaseConnection();
      if (connectionTest.success) {
        addTestResult('✅ Database connection successful');
      } else {
        addTestResult('❌ Database connection failed');
        return;
      }
      
      // Test 2: Save test data
      addTestResult('Saving test medical data...');
      const profileToSave = {
        ...currentProfile,
        ...testData
      };
      
      await saveProfileData(user, profileToSave);
      addTestResult('✅ Test data saved successfully');
      
      // Test 3: Load and verify data
      addTestResult('Loading and verifying saved data...');
      const loadedProfile = await loadProfileData(user);
      
      const verificationResults = [
        { field: 'address', expected: testData.address, actual: loadedProfile.address },
        { field: 'emergency_contact', expected: testData.emergency_contact, actual: loadedProfile.emergency_contact },
        { field: 'date_of_birth', expected: testData.date_of_birth, actual: loadedProfile.date_of_birth },
        { field: 'medical_history', expected: testData.medical_history, actual: loadedProfile.medical_history }
      ];
      
      let allPassed = true;
      verificationResults.forEach(result => {
        if (result.expected === result.actual) {
          addTestResult(`✅ ${result.field}: Data persisted correctly`);
        } else {
          addTestResult(`❌ ${result.field}: Expected "${result.expected}", got "${result.actual}"`);
          allPassed = false;
        }
      });
      
      if (allPassed) {
        addTestResult('🎉 ALL TESTS PASSED: Medical records persistence is working correctly!');
        toast({
          title: "Test Passed",
          description: "Medical records persistence is working correctly",
        });
      } else {
        addTestResult('💥 SOME TESTS FAILED: Medical records persistence has issues');
        toast({
          title: "Test Failed",
          description: "Medical records persistence has issues",
          variant: "destructive",
        });
      }
      
      // Refresh current profile
      await loadCurrentProfile();
      
    } catch (error) {
      addTestResult('❌ Test failed with error: ' + error);
      toast({
        title: "Test Error",
        description: "Test failed with error: " + error,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetTestData = async () => {
    setLoading(true);
    try {
      const resetProfile = {
        ...currentProfile,
        address: '',
        emergency_contact: '',
        date_of_birth: '',
        medical_history: ''
      };
      
      await saveProfileData(user, resetProfile);
      addTestResult('✅ Test data reset successfully');
      await loadCurrentProfile();
      
      toast({
        title: "Reset Complete",
        description: "Test data has been reset",
      });
    } catch (error) {
      addTestResult('❌ Failed to reset test data: ' + error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Medical Records Persistence Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="address">Test Address</Label>
              <Input
                id="address"
                value={testData.address}
                onChange={(e) => setTestData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Enter test address"
              />
            </div>
            <div>
              <Label htmlFor="emergency_contact">Test Emergency Contact</Label>
              <Input
                id="emergency_contact"
                value={testData.emergency_contact}
                onChange={(e) => setTestData(prev => ({ ...prev, emergency_contact: e.target.value }))}
                placeholder="Enter test emergency contact"
              />
            </div>
            <div>
              <Label htmlFor="date_of_birth">Test Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={testData.date_of_birth}
                onChange={(e) => setTestData(prev => ({ ...prev, date_of_birth: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="medical_history">Test Medical History</Label>
              <Textarea
                id="medical_history"
                value={testData.medical_history}
                onChange={(e) => setTestData(prev => ({ ...prev, medical_history: e.target.value }))}
                placeholder="Enter test medical history"
              />
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button
              onClick={runComprehensiveTest}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Running Test...' : 'Run Comprehensive Test'}
            </Button>
            <Button
              onClick={resetTestData}
              disabled={loading}
              variant="outline"
            >
              Reset Test Data
            </Button>
          </div>
          
          {currentProfile && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Current Profile Data:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Address:</strong> {currentProfile.address || 'Not set'}
                </div>
                <div>
                  <strong>Emergency Contact:</strong> {currentProfile.emergency_contact || 'Not set'}
                </div>
                <div>
                  <strong>Date of Birth:</strong> {currentProfile.date_of_birth || 'Not set'}
                </div>
                <div>
                  <strong>Medical History:</strong> {currentProfile.medical_history || 'Not set'}
                </div>
              </div>
            </div>
          )}
          
          {testResults.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Test Results:</h3>
              <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg max-h-64 overflow-y-auto">
                {testResults.map((result, index) => (
                  <div key={index} className="text-sm font-mono">
                    {result}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};