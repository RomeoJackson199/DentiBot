import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { 
  SecurityTester, 
  ComplianceChecker, 
  AuditLogger, 
  AuditLogType,
  securityManager 
} from "@/lib/security";
import { secureDataService } from "@/lib/secureDataService";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  Shield, 
  Lock, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Loader2,
  TestTube,
  Database,
  Key,
  FileText,
  Users,
  Settings
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

export const SecurityTesting = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<any>(null);
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [complianceResults, setComplianceResults] = useState<any>(null);
  const { toast } = useToast();

  const runPasswordStrengthTest = async () => {
    if (!password) {
      toast({
        title: "Error",
        description: "Please enter a password to test",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await SecurityTester.testPasswordStrength(password);
      setPasswordStrength(result);
      
      await AuditLogger.logEvent(
        AuditLogType.SECURITY_EVENT,
        (await supabase.auth.getUser()).data.user?.id || 'unknown',
        'security_testing',
        'password_strength',
        'PASSWORD_STRENGTH_TEST',
        { score: result.score, is_strong: result.isStrong }
      );

      toast({
        title: "Password Strength Test Complete",
        description: result.isStrong ? "Password is strong!" : "Password needs improvement",
        variant: result.isStrong ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Password strength test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runEncryptionVulnerabilityTest = async () => {
    setIsLoading(true);
    try {
      const result = await SecurityTester.testEncryptionVulnerabilities();
      
      setTestResults(prev => ({
        ...prev,
        encryption: {
          success: !result.hasPlainTextData,
          message: result.hasPlainTextData 
            ? "Vulnerabilities found" 
            : "No encryption vulnerabilities detected",
          details: result
        }
      }));

      await AuditLogger.logEvent(
        AuditLogType.SECURITY_EVENT,
        (await supabase.auth.getUser()).data.user?.id || 'unknown',
        'security_testing',
        'encryption_vulnerabilities',
        'ENCRYPTION_VULNERABILITY_TEST',
        result
      );

      toast({
        title: "Encryption Test Complete",
        description: result.hasPlainTextData 
          ? `${result.unencryptedFields.length} unencrypted fields found`
          : "All sensitive data is properly encrypted",
        variant: result.hasPlainTextData ? "destructive" : "default",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Encryption vulnerability test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runUnauthorizedAccessTest = async () => {
    setIsLoading(true);
    try {
      const result = await SecurityTester.simulateUnauthorizedAccess();
      
      setTestResults(prev => ({
        ...prev,
        unauthorized: {
          success: result.vulnerabilities.length === 0,
          message: result.vulnerabilities.length === 0 
            ? "No unauthorized access vulnerabilities detected"
            : `${result.vulnerabilities.length} vulnerabilities found`,
          details: result
        }
      }));

      await AuditLogger.logEvent(
        AuditLogType.SECURITY_EVENT,
        (await supabase.auth.getUser()).data.user?.id || 'unknown',
        'security_testing',
        'unauthorized_access',
        'UNAUTHORIZED_ACCESS_TEST',
        result
      );

      toast({
        title: "Access Control Test Complete",
        description: result.vulnerabilities.length === 0 
          ? "Access controls are working properly"
          : `${result.vulnerabilities.length} access control issues found`,
        variant: result.vulnerabilities.length === 0 ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Test Failed",
        description: "Unauthorized access test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runComplianceCheck = async () => {
    setIsLoading(true);
    try {
      const result = await ComplianceChecker.checkHIPAACompliance();
      setComplianceResults(result);

      await AuditLogger.logEvent(
        AuditLogType.SECURITY_EVENT,
        (await supabase.auth.getUser()).data.user?.id || 'unknown',
        'security_testing',
        'compliance_check',
        'COMPLIANCE_CHECK',
        result
      );

      toast({
        title: "Compliance Check Complete",
        description: result.compliant 
          ? "System is HIPAA/GDPR compliant"
          : `${result.issues.length} compliance issues found`,
        variant: result.compliant ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Check Failed",
        description: "Compliance check failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runDataMigrationTest = async () => {
    setIsLoading(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error("User not authenticated");

      const result = await secureDataService.migrateExistingData(user.id);
      
      setTestResults(prev => ({
        ...prev,
        migration: {
          success: result.success,
          message: result.success 
            ? `Successfully migrated ${result.migrated} records`
            : `Migration failed: ${result.errors.length} errors`,
          details: result
        }
      }));

      await AuditLogger.logEvent(
        AuditLogType.SECURITY_EVENT,
        user.id,
        'security_testing',
        'data_migration',
        'DATA_MIGRATION_TEST',
        result
      );

      toast({
        title: "Data Migration Complete",
        description: result.success 
          ? `Migrated ${result.migrated} records successfully`
          : `Migration failed with ${result.errors.length} errors`,
        variant: result.success ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Migration Failed",
        description: "Data migration test failed",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const runAllTests = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        runEncryptionVulnerabilityTest(),
        runUnauthorizedAccessTest(),
        runComplianceCheck(),
        runDataMigrationTest()
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Testing Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive security testing for the Denti Smart Scheduler platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Button
              onClick={runAllTests}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Run All Tests
            </Button>
            
            <Button
              onClick={runEncryptionVulnerabilityTest}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Lock className="h-4 w-4 mr-2" />
              Test Encryption
            </Button>
            
            <Button
              onClick={runUnauthorizedAccessTest}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <Eye className="h-4 w-4 mr-2" />
              Test Access Controls
            </Button>
            
            <Button
              onClick={runComplianceCheck}
              disabled={isLoading}
              className="w-full"
              variant="outline"
            >
              <FileText className="h-4 w-4 mr-2" />
              Check Compliance
            </Button>
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="password-strength">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Password Strength Testing
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      type="password"
                      placeholder="Enter password to test"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <Button
                      onClick={runPasswordStrengthTest}
                      disabled={isLoading || !password}
                    >
                      Test
                    </Button>
                  </div>
                  
                  {passwordStrength && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Strength Score:</span>
                        <Badge variant={passwordStrength.isStrong ? "default" : "destructive"}>
                          {passwordStrength.score}/5
                        </Badge>
                      </div>
                      <Progress value={(passwordStrength.score / 5) * 100} />
                      <div className="space-y-1">
                        {passwordStrength.feedback.map((feedback: string, index: number) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            {passwordStrength.score >= index + 1 ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500" />
                            )}
                            {feedback}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="test-results">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Test Results
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {Object.entries(testResults).map(([testName, result]) => (
                    <Card key={testName}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          {result.success ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          {testName.charAt(0).toUpperCase() + testName.slice(1)} Test
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm mb-2">{result.message}</p>
                        {result.details && (
                          <div className="text-xs space-y-1">
                            {result.details.unencryptedFields && (
                              <div>
                                <strong>Unencrypted Fields:</strong>
                                <ul className="list-disc list-inside ml-2">
                                  {result.details.unencryptedFields.map((field: string, index: number) => (
                                    <li key={index}>{field}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {result.details.vulnerabilities && (
                              <div>
                                <strong>Vulnerabilities:</strong>
                                <ul className="list-disc list-inside ml-2">
                                  {result.details.vulnerabilities.map((vuln: string, index: number) => (
                                    <li key={index}>{vuln}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {result.details.recommendations && (
                              <div>
                                <strong>Recommendations:</strong>
                                <ul className="list-disc list-inside ml-2">
                                  {result.details.recommendations.map((rec: string, index: number) => (
                                    <li key={index}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="compliance">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  HIPAA/GDPR Compliance
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {complianceResults && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant={complianceResults.compliant ? "default" : "destructive"}>
                        {complianceResults.compliant ? "Compliant" : "Non-Compliant"}
                      </Badge>
                      <span className="text-sm">
                        {complianceResults.compliant 
                          ? "System meets HIPAA/GDPR requirements"
                          : `${complianceResults.issues.length} compliance issues found`
                        }
                      </span>
                    </div>
                    
                    {complianceResults.issues.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Issues:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {complianceResults.issues.map((issue: string, index: number) => (
                            <li key={index} className="text-red-600">{issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {complianceResults.recommendations.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="font-semibold text-sm">Recommendations:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {complianceResults.recommendations.map((rec: string, index: number) => (
                            <li key={index} className="text-blue-600">{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security-settings">
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Security Settings
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Encryption Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>AES-256 Encryption:</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Audit Logging:</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Role-Based Access:</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Security Features</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span>Multi-Factor Auth:</span>
                            <Badge variant="secondary">Available</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Session Management:</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                          <div className="flex justify-between">
                            <span>Data Migration:</span>
                            <Badge variant="default">Active</Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
};