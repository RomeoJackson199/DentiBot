import { supabase } from "@/integrations/supabase/client";
import { Buffer } from 'buffer';

// Security configuration
const ENCRYPTION_KEY = process.env.VITE_ENCRYPTION_KEY || 'default-key-change-in-production';
const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

// Sensitive data fields that require encryption
export const SENSITIVE_FIELDS = {
  profiles: ['phone', 'medical_history', 'date_of_birth'],
  medical_records: ['description', 'title'],
  patient_notes: ['content', 'title'],
  prescriptions: ['medication_name', 'dosage', 'frequency', 'duration', 'instructions'],
  treatment_plans: ['description', 'diagnosis', 'treatment_goals', 'procedures', 'notes'],
  appointments: ['reason', 'notes']
};

// Audit log types
export enum AuditLogType {
  DATA_ACCESS = 'data_access',
  DATA_MODIFICATION = 'data_modification',
  AUTHENTICATION = 'authentication',
  SECURITY_EVENT = 'security_event',
  ENCRYPTION = 'encryption',
  DECRYPTION = 'decryption'
}

// Security utilities
export class SecurityManager {
  private static instance: SecurityManager;
  private encryptionKey: CryptoKey | null = null;

  private constructor() {}

  static getInstance(): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager();
    }
    return SecurityManager.instance;
  }

  // Initialize encryption key
  async initializeEncryption(): Promise<void> {
    try {
      const keyData = new TextEncoder().encode(ENCRYPTION_KEY);
      this.encryptionKey = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: ALGORITHM },
        false,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Failed to initialize encryption:', error);
      throw new Error('Encryption initialization failed');
    }
  }

  // Encrypt sensitive data
  async encryptData(data: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    try {
      const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
      const encodedData = new TextEncoder().encode(data);
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: ALGORITHM, iv },
        this.encryptionKey!,
        encodedData
      );

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength);
      combined.set(iv);
      combined.set(new Uint8Array(encryptedData), iv.length);

      return Buffer.from(combined).toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Data encryption failed');
    }
  }

  // Decrypt sensitive data
  async decryptData(encryptedData: string): Promise<string> {
    if (!this.encryptionKey) {
      await this.initializeEncryption();
    }

    try {
      const combined = Buffer.from(encryptedData, 'base64');
      const iv = combined.slice(0, IV_LENGTH);
      const data = combined.slice(IV_LENGTH);

      const decryptedData = await crypto.subtle.decrypt(
        { name: ALGORITHM, iv },
        this.encryptionKey!,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Data decryption failed');
    }
  }

  // Check if field should be encrypted
  isSensitiveField(tableName: string, fieldName: string): boolean {
    return SENSITIVE_FIELDS[tableName as keyof typeof SENSITIVE_FIELDS]?.includes(fieldName) || false;
  }

  // Encrypt object fields
  async encryptObject<T extends Record<string, any>>(tableName: string, data: T): Promise<T> {
    const encryptedData = { ...data };
    
    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(tableName, key) && typeof value === 'string' && value.trim()) {
        try {
          encryptedData[key] = await this.encryptData(value);
        } catch (error) {
          console.error(`Failed to encrypt field ${key}:`, error);
          // Don't encrypt if it fails, but log the error
        }
      }
    }
    
    return encryptedData;
  }

  // Decrypt object fields
  async decryptObject<T extends Record<string, any>>(tableName: string, data: T): Promise<T> {
    const decryptedData = { ...data };
    
    for (const [key, value] of Object.entries(data)) {
      if (this.isSensitiveField(tableName, key) && typeof value === 'string' && value.trim()) {
        try {
          decryptedData[key] = await this.decryptData(value);
        } catch (error) {
          console.error(`Failed to decrypt field ${key}:`, error);
          // Keep original value if decryption fails
        }
      }
    }
    
    return decryptedData;
  }
}

// Audit logging
export class AuditLogger {
  static async logEvent(
    eventType: AuditLogType,
    userId: string,
    tableName: string,
    recordId: string,
    action: string,
    details?: Record<string, any>
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('audit_logs')
        .insert({
          event_type: eventType,
          user_id: userId,
          table_name: tableName,
          record_id: recordId,
          action,
          details: details || {},
          ip_address: await this.getClientIP(),
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        });

      if (error) {
        console.error('Audit logging failed:', error);
      }
    } catch (error) {
      console.error('Audit logging error:', error);
    }
  }

  private static async getClientIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch {
      return 'unknown';
    }
  }
}

// Role-based access control
export class RBAC {
  static async checkPermission(
    userId: string,
    resource: string,
    action: 'read' | 'write' | 'delete'
  ): Promise<boolean> {
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return false;

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (!profile) return false;

      // Admin has full access
      if (profile.role === 'admin') return true;

      // Dentist permissions
      if (profile.role === 'dentist') {
        const dentistPermissions = {
          'appointments': ['read', 'write'],
          'medical_records': ['read', 'write'],
          'prescriptions': ['read', 'write'],
          'treatment_plans': ['read', 'write'],
          'patient_notes': ['read', 'write']
        };

        return dentistPermissions[resource as keyof typeof dentistPermissions]?.includes(action) || false;
      }

      // Patient permissions
      if (profile.role === 'patient') {
        const patientPermissions = {
          'appointments': ['read'],
          'medical_records': ['read'],
          'prescriptions': ['read'],
          'treatment_plans': ['read']
        };

        return patientPermissions[resource as keyof typeof patientPermissions]?.includes(action) || false;
      }

      return false;
    } catch (error) {
      console.error('Permission check failed:', error);
      return false;
    }
  }
}

// Security testing utilities
export class SecurityTester {
  static async testPasswordStrength(password: string): Promise<{
    score: number;
    feedback: string[];
    isStrong: boolean;
  }> {
    const feedback: string[] = [];
    let score = 0;

    // Length check
    if (password.length >= 8) score += 1;
    else feedback.push('Password should be at least 8 characters long');

    // Complexity checks
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Include lowercase letters');

    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Include uppercase letters');

    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Include numbers');

    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Include special characters');

    // Common password check
    const commonPasswords = ['password', '123456', 'qwerty', 'admin'];
    if (commonPasswords.includes(password.toLowerCase())) {
      score = 0;
      feedback.push('Avoid common passwords');
    }

    return {
      score,
      feedback,
      isStrong: score >= 4
    };
  }

  static async testEncryptionVulnerabilities(): Promise<{
    hasPlainTextData: boolean;
    unencryptedFields: string[];
    recommendations: string[];
  }> {
    const results = {
      hasPlainTextData: false,
      unencryptedFields: [] as string[],
      recommendations: [] as string[]
    };

    try {
      // Test profiles table
      const { data: profiles } = await supabase
        .from('profiles')
        .select('phone, medical_history')
        .limit(10);

      if (profiles) {
        for (const profile of profiles) {
          if (profile.phone && !profile.phone.startsWith('encrypted:')) {
            results.hasPlainTextData = true;
            results.unencryptedFields.push(`profiles.phone (ID: ${profile.id})`);
          }
          if (profile.medical_history && !profile.medical_history.startsWith('encrypted:')) {
            results.hasPlainTextData = true;
            results.unencryptedFields.push(`profiles.medical_history (ID: ${profile.id})`);
          }
        }
      }

      // Test medical records
      const { data: medicalRecords } = await supabase
        .from('medical_records')
        .select('description, title')
        .limit(10);

      if (medicalRecords) {
        for (const record of medicalRecords) {
          if (record.description && !record.description.startsWith('encrypted:')) {
            results.hasPlainTextData = true;
            results.unencryptedFields.push(`medical_records.description (ID: ${record.id})`);
          }
        }
      }

      if (results.hasPlainTextData) {
        results.recommendations.push('Migrate existing plain text data to encrypted format');
        results.recommendations.push('Implement data encryption for all sensitive fields');
        results.recommendations.push('Add encryption validation to data insertion');
      }

      return results;
    } catch (error) {
      console.error('Security testing failed:', error);
      return results;
    }
  }

  static async simulateUnauthorizedAccess(): Promise<{
    vulnerabilities: string[];
    recommendations: string[];
  }> {
    const results = {
      vulnerabilities: [] as string[],
      recommendations: [] as string[]
    };

    try {
      // Test direct database access (should be blocked by RLS)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1);

      if (data && data.length > 0) {
        results.vulnerabilities.push('Direct database access not properly restricted');
      }

      // Test cross-user data access
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        const { data: otherUserData } = await supabase
          .from('profiles')
          .select('*')
          .neq('user_id', user.user.id)
          .limit(1);

        if (otherUserData && otherUserData.length > 0) {
          results.vulnerabilities.push('Cross-user data access not properly restricted');
        }
      }

      if (results.vulnerabilities.length > 0) {
        results.recommendations.push('Strengthen Row Level Security policies');
        results.recommendations.push('Implement proper access controls');
        results.recommendations.push('Add comprehensive security testing');
      }

      return results;
    } catch (error) {
      console.error('Unauthorized access simulation failed:', error);
      return results;
    }
  }
}

// HIPAA/GDPR compliance checker
export class ComplianceChecker {
  static async checkHIPAACompliance(): Promise<{
    compliant: boolean;
    issues: string[];
    recommendations: string[];
  }> {
    const results = {
      compliant: true,
      issues: [] as string[],
      recommendations: [] as string[]
    };

    try {
      // Check for audit logging
      const { data: auditLogs } = await supabase
        .from('audit_logs')
        .select('count')
        .limit(1);

      if (!auditLogs) {
        results.compliant = false;
        results.issues.push('Audit logging not implemented');
        results.recommendations.push('Implement comprehensive audit logging');
      }

      // Check for encryption
      const securityTest = await SecurityTester.testEncryptionVulnerabilities();
      if (securityTest.hasPlainTextData) {
        results.compliant = false;
        results.issues.push('Sensitive data not encrypted');
        results.recommendations.push('Encrypt all PHI data');
      }

      // Check for access controls
      const accessTest = await SecurityTester.simulateUnauthorizedAccess();
      if (accessTest.vulnerabilities.length > 0) {
        results.compliant = false;
        results.issues.push('Insufficient access controls');
        results.recommendations.push('Implement proper access controls');
      }

      return results;
    } catch (error) {
      console.error('Compliance check failed:', error);
      results.compliant = false;
      results.issues.push('Compliance check failed');
      return results;
    }
  }
}

// Export security manager instance
export const securityManager = SecurityManager.getInstance();