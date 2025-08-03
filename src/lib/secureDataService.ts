import { supabase } from "@/integrations/supabase/client";
import { 
  securityManager, 
  AuditLogger, 
  AuditLogType, 
  RBAC,
  SENSITIVE_FIELDS 
} from "./security";

// Secure data service for handling all database operations with encryption and audit logging
export class SecureDataService {
  private static instance: SecureDataService;

  private constructor() {}

  static getInstance(): SecureDataService {
    if (!SecureDataService.instance) {
      SecureDataService.instance = new SecureDataService();
    }
    return SecureDataService.instance;
  }

  // Generic secure insert method
  async secureInsert<T extends Record<string, any>>(
    tableName: string,
    data: T,
    userId: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      // Check permissions
      const hasPermission = await RBAC.checkPermission(userId, tableName, 'write');
      if (!hasPermission) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          'N/A',
          'UNAUTHORIZED_INSERT_ATTEMPT',
          { attempted_data: data }
        );
        return { data: null, error: new Error('Insufficient permissions') };
      }

      // Encrypt sensitive fields
      const encryptedData = await securityManager.encryptObject(tableName, data);

      // Insert data
      const { data: result, error } = await supabase
        .from(tableName)
        .insert(encryptedData)
        .select()
        .single();

      if (error) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          'N/A',
          'INSERT_FAILED',
          { error: error.message, attempted_data: data }
        );
        return { data: null, error };
      }

      // Log successful insert
      await AuditLogger.logEvent(
        AuditLogType.DATA_MODIFICATION,
        userId,
        tableName,
        result.id,
        'INSERT',
        { encrypted_fields: Object.keys(SENSITIVE_FIELDS[tableName as keyof typeof SENSITIVE_FIELDS] || []) }
      );

      // Decrypt sensitive fields for response
      const decryptedResult = await securityManager.decryptObject(tableName, result);

      return { data: decryptedResult, error: null };
    } catch (error) {
      console.error('Secure insert failed:', error);
      return { data: null, error };
    }
  }

  // Generic secure update method
  async secureUpdate<T extends Record<string, any>>(
    tableName: string,
    recordId: string,
    data: Partial<T>,
    userId: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      // Check permissions
      const hasPermission = await RBAC.checkPermission(userId, tableName, 'write');
      if (!hasPermission) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          recordId,
          'UNAUTHORIZED_UPDATE_ATTEMPT',
          { attempted_data: data }
        );
        return { data: null, error: new Error('Insufficient permissions') };
      }

      // Encrypt sensitive fields
      const encryptedData = await securityManager.encryptObject(tableName, data);

      // Update data
      const { data: result, error } = await supabase
        .from(tableName)
        .update(encryptedData)
        .eq('id', recordId)
        .select()
        .single();

      if (error) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          recordId,
          'UPDATE_FAILED',
          { error: error.message, attempted_data: data }
        );
        return { data: null, error };
      }

      // Log successful update
      await AuditLogger.logEvent(
        AuditLogType.DATA_MODIFICATION,
        userId,
        tableName,
        recordId,
        'UPDATE',
        { encrypted_fields: Object.keys(SENSITIVE_FIELDS[tableName as keyof typeof SENSITIVE_FIELDS] || []) }
      );

      // Decrypt sensitive fields for response
      const decryptedResult = await securityManager.decryptObject(tableName, result);

      return { data: decryptedResult, error: null };
    } catch (error) {
      console.error('Secure update failed:', error);
      return { data: null, error };
    }
  }

  // Generic secure select method
  async secureSelect<T extends Record<string, any>>(
    tableName: string,
    userId: string,
    filters?: Record<string, any>,
    select?: string
  ): Promise<{ data: T[] | null; error: any }> {
    try {
      // Check permissions
      const hasPermission = await RBAC.checkPermission(userId, tableName, 'read');
      if (!hasPermission) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          'N/A',
          'UNAUTHORIZED_READ_ATTEMPT',
          { filters, select }
        );
        return { data: null, error: new Error('Insufficient permissions') };
      }

      // Build query
      let query = supabase.from(tableName).select(select || '*');
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          query = query.eq(key, value);
        });
      }

      const { data: results, error } = await query;

      if (error) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          'N/A',
          'READ_FAILED',
          { error: error.message, filters, select }
        );
        return { data: null, error };
      }

      // Log successful read
      await AuditLogger.logEvent(
        AuditLogType.DATA_ACCESS,
        userId,
        tableName,
        'MULTIPLE',
        'READ',
        { record_count: results?.length || 0, filters, select }
      );

      // Decrypt sensitive fields
      if (results) {
        const decryptedResults = await Promise.all(
          results.map(result => securityManager.decryptObject(tableName, result))
        );
        return { data: decryptedResults, error: null };
      }

      return { data: [], error: null };
    } catch (error) {
      console.error('Secure select failed:', error);
      return { data: null, error };
    }
  }

  // Secure select single record
  async secureSelectSingle<T extends Record<string, any>>(
    tableName: string,
    recordId: string,
    userId: string,
    select?: string
  ): Promise<{ data: T | null; error: any }> {
    try {
      // Check permissions
      const hasPermission = await RBAC.checkPermission(userId, tableName, 'read');
      if (!hasPermission) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          recordId,
          'UNAUTHORIZED_READ_ATTEMPT',
          { select }
        );
        return { data: null, error: new Error('Insufficient permissions') };
      }

      const { data: result, error } = await supabase
        .from(tableName)
        .select(select || '*')
        .eq('id', recordId)
        .single();

      if (error) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          recordId,
          'READ_FAILED',
          { error: error.message, select }
        );
        return { data: null, error };
      }

      // Log successful read
      await AuditLogger.logEvent(
        AuditLogType.DATA_ACCESS,
        userId,
        tableName,
        recordId,
        'READ',
        { select }
      );

      // Decrypt sensitive fields
      const decryptedResult = await securityManager.decryptObject(tableName, result);

      return { data: decryptedResult, error: null };
    } catch (error) {
      console.error('Secure select single failed:', error);
      return { data: null, error };
    }
  }

  // Secure delete method
  async secureDelete(
    tableName: string,
    recordId: string,
    userId: string
  ): Promise<{ error: any }> {
    try {
      // Check permissions
      const hasPermission = await RBAC.checkPermission(userId, tableName, 'delete');
      if (!hasPermission) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          recordId,
          'UNAUTHORIZED_DELETE_ATTEMPT'
        );
        return { error: new Error('Insufficient permissions') };
      }

      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', recordId);

      if (error) {
        await AuditLogger.logEvent(
          AuditLogType.SECURITY_EVENT,
          userId,
          tableName,
          recordId,
          'DELETE_FAILED',
          { error: error.message }
        );
        return { error };
      }

      // Log successful delete
      await AuditLogger.logEvent(
        AuditLogType.DATA_MODIFICATION,
        userId,
        tableName,
        recordId,
        'DELETE'
      );

      return { error: null };
    } catch (error) {
      console.error('Secure delete failed:', error);
      return { error };
    }
  }

  // Profile-specific methods
  async createProfile(profileData: any, userId: string) {
    return this.secureInsert('profiles', profileData, userId);
  }

  async updateProfile(profileId: string, profileData: any, userId: string) {
    return this.secureUpdate('profiles', profileId, profileData, userId);
  }

  async getProfile(userId: string) {
    return this.secureSelectSingle('profiles', userId, userId);
  }

  // Medical records methods
  async createMedicalRecord(recordData: any, userId: string) {
    return this.secureInsert('medical_records', recordData, userId);
  }

  async getMedicalRecords(patientId: string, userId: string) {
    return this.secureSelect('medical_records', userId, { patient_id: patientId });
  }

  async updateMedicalRecord(recordId: string, recordData: any, userId: string) {
    return this.secureUpdate('medical_records', recordId, recordData, userId);
  }

  // Prescriptions methods
  async createPrescription(prescriptionData: any, userId: string) {
    return this.secureInsert('prescriptions', prescriptionData, userId);
  }

  async getPrescriptions(patientId: string, userId: string) {
    return this.secureSelect('prescriptions', userId, { patient_id: patientId });
  }

  async updatePrescription(prescriptionId: string, prescriptionData: any, userId: string) {
    return this.secureUpdate('prescriptions', prescriptionId, prescriptionData, userId);
  }

  // Treatment plans methods
  async createTreatmentPlan(planData: any, userId: string) {
    return this.secureInsert('treatment_plans', planData, userId);
  }

  async getTreatmentPlans(patientId: string, userId: string) {
    return this.secureSelect('treatment_plans', userId, { patient_id: patientId });
  }

  async updateTreatmentPlan(planId: string, planData: any, userId: string) {
    return this.secureUpdate('treatment_plans', planId, planData, userId);
  }

  // Patient notes methods
  async createPatientNote(noteData: any, userId: string) {
    return this.secureInsert('patient_notes', noteData, userId);
  }

  async getPatientNotes(patientId: string, userId: string) {
    return this.secureSelect('patient_notes', userId, { patient_id: patientId });
  }

  async updatePatientNote(noteId: string, noteData: any, userId: string) {
    return this.secureUpdate('patient_notes', noteId, noteData, userId);
  }

  // Appointments methods
  async createAppointment(appointmentData: any, userId: string) {
    return this.secureInsert('appointments', appointmentData, userId);
  }

  async getAppointments(userId: string, filters?: Record<string, any>) {
    return this.secureSelect('appointments', userId, filters);
  }

  async updateAppointment(appointmentId: string, appointmentData: any, userId: string) {
    return this.secureUpdate('appointments', appointmentId, appointmentData, userId);
  }

  // Data migration for existing unencrypted data
  async migrateExistingData(userId: string): Promise<{ success: boolean; migrated: number; errors: string[] }> {
    const results = {
      success: true,
      migrated: 0,
      errors: [] as string[]
    };

    try {
      // Migrate profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, phone, medical_history')
        .or('phone.is.not.null,medical_history.is.not.null');

      if (profiles) {
        for (const profile of profiles) {
          try {
            const updateData: any = {};
            
            if (profile.phone && !profile.phone.startsWith('encrypted:')) {
              updateData.phone = await securityManager.encryptData(profile.phone);
            }
            
            if (profile.medical_history && !profile.medical_history.startsWith('encrypted:')) {
              updateData.medical_history = await securityManager.encryptData(profile.medical_history);
            }

            if (Object.keys(updateData).length > 0) {
              await this.secureUpdate('profiles', profile.id, updateData, userId);
              results.migrated++;
            }
          } catch (error) {
            results.errors.push(`Failed to migrate profile ${profile.id}: ${error}`);
          }
        }
      }

      // Migrate medical records
      const { data: medicalRecords } = await supabase
        .from('medical_records')
        .select('id, description, title')
        .or('description.is.not.null,title.is.not.null');

      if (medicalRecords) {
        for (const record of medicalRecords) {
          try {
            const updateData: any = {};
            
            if (record.description && !record.description.startsWith('encrypted:')) {
              updateData.description = await securityManager.encryptData(record.description);
            }
            
            if (record.title && !record.title.startsWith('encrypted:')) {
              updateData.title = await securityManager.encryptData(record.title);
            }

            if (Object.keys(updateData).length > 0) {
              await this.secureUpdate('medical_records', record.id, updateData, userId);
              results.migrated++;
            }
          } catch (error) {
            results.errors.push(`Failed to migrate medical record ${record.id}: ${error}`);
          }
        }
      }

      if (results.errors.length > 0) {
        results.success = false;
      }

      return results;
    } catch (error) {
      results.success = false;
      results.errors.push(`Migration failed: ${error}`);
      return results;
    }
  }
}

// Export singleton instance
export const secureDataService = SecureDataService.getInstance();