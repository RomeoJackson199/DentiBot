import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { testBookingFlow, verifyDatabaseConnection, checkUserProfile } from "@/lib/testBookingFlow";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";

export const BookingFlowTest = () => {
  const [testResults, setTestResults] = useState<{
    database: any;
    userProfile: any;
    bookingFlow: any;
  }>({
    database: null,
    userProfile: null,
    bookingFlow: null
  });
  const [isLoading, setIsLoading] = useState(false);

  const runTests = async () => {
    setIsLoading(true);
    
    // Test database connection
    const dbResult = await verifyDatabaseConnection();
    
    // Test user profile (Romeo@caberu.be)
    const profileResult = await checkUserProfile('romeo@caberu.be');
    
    // Test booking flow
    const bookingResult = await testBookingFlow();
    
    setTestResults({
      database: dbResult,
      userProfile: profileResult,
      bookingFlow: bookingResult
    });
    
    setIsLoading(false);
  };

  const getStatusIcon = (success: boolean) => {
    if (success) {
      return <CheckCircle className="h-5 w-5 text-green-600" />;
    }
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  const getStatusBadge = (success: boolean) => {
    return (
      <Badge className={success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
        {success ? 'PASS' : 'FAIL'}
      </Badge>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            Booking Flow Test Suite
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            This test suite verifies that the booking flow works correctly with the database.
          </p>
          
          <Button 
            onClick={runTests} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Running Tests...
              </>
            ) : (
              'Run Booking Flow Tests'
            )}
          </Button>
        </CardContent>
      </Card>

      {testResults.database && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Database Connection Test</span>
              {getStatusBadge(testResults.database.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              {getStatusIcon(testResults.database.success)}
              <div className="flex-1">
                <p className="font-medium">{testResults.database.message}</p>
                {testResults.database.error && (
                  <p className="text-sm text-red-600 mt-1">{testResults.database.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.userProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>User Profile Test (Romeo@caberu.be)</span>
              {getStatusBadge(testResults.userProfile.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              {getStatusIcon(testResults.userProfile.success)}
              <div className="flex-1">
                <p className="font-medium">{testResults.userProfile.message}</p>
                {testResults.userProfile.error && (
                  <p className="text-sm text-red-600 mt-1">{testResults.userProfile.error}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.bookingFlow && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Booking Flow Integration Test</span>
              {getStatusBadge(testResults.bookingFlow.success)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-3">
              {getStatusIcon(testResults.bookingFlow.success)}
              <div className="flex-1">
                <p className="font-medium">{testResults.bookingFlow.message}</p>
                {testResults.bookingFlow.error && (
                  <p className="text-sm text-red-600 mt-1">{testResults.bookingFlow.error}</p>
                )}
                {testResults.bookingFlow.appointmentId && (
                  <p className="text-sm text-green-600 mt-1">
                    Test appointment ID: {testResults.bookingFlow.appointmentId}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {testResults.database && testResults.userProfile && testResults.bookingFlow && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800">
              <CheckCircle className="h-5 w-5" />
              Test Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="font-medium text-green-800">
                All tests completed! The booking flow should work correctly.
              </p>
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Database connection: {testResults.database.success ? '✅' : '❌'}</li>
                <li>• User profile setup: {testResults.userProfile.success ? '✅' : '❌'}</li>
                <li>• Booking integration: {testResults.bookingFlow.success ? '✅' : '❌'}</li>
              </ul>
              {testResults.database.success && testResults.userProfile.success && testResults.bookingFlow.success && (
                <p className="text-sm text-green-600 mt-3">
                  🎉 Ready to test the complete booking flow from triage to confirmation!
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};