import { supabase } from "@/integrations/supabase/client";
import { ChatMessage } from "@/types/chat";

export interface CreateMedicalRecordData {
  patientId: string;
  dentistId?: string;
  title: string;
  description?: string;
  findings?: string;
  recommendations?: string;
  recordType?: string;
  visitDate?: string;
}

export const createMedicalRecord = async (data: CreateMedicalRecordData) => {
  try {
    const { data: record, error } = await supabase
      .from('medical_records')
      .insert({
        patient_id: data.patientId,
        dentist_id: data.dentistId || null,
        title: data.title,
        description: data.description,
        findings: data.findings,
        recommendations: data.recommendations,
        record_type: data.recordType || 'consultation',
        visit_date: data.visitDate || new Date().toISOString().split('T')[0]
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating medical record:', error);
      throw error;
    }

    return record;
  } catch (error) {
    console.error('Error in createMedicalRecord:', error);
    throw error;
  }
};

export const generateMedicalRecordFromChat = async (
  messages: ChatMessage[],
  patientProfile: any,
  appointmentData?: any
): Promise<CreateMedicalRecordData> => {
  // Extract symptoms and relevant information from chat
  const chatContent = messages
    .filter(msg => !msg.is_bot && msg.message_type === 'text')
    .map(msg => msg.message)
    .join(' ');

  // Extract bot responses that might contain recommendations
  const botResponses = messages
    .filter(msg => msg.is_bot && msg.message_type === 'text')
    .map(msg => msg.message)
    .join(' ');

  // Generate title based on symptoms
  let title = "Consultation dentaire";
  if (chatContent.toLowerCase().includes('douleur')) {
    title = "Consultation pour douleur dentaire";
  } else if (chatContent.toLowerCase().includes('saignement')) {
    title = "Consultation pour saignement";
  } else if (chatContent.toLowerCase().includes('urgence')) {
    title = "Consultation d'urgence";
  }

  // Extract findings from symptoms
  const symptoms = extractSymptoms(chatContent);
  const findings = symptoms.length > 0 
    ? `Symptômes rapportés: ${symptoms.join(', ')}`
    : "Consultation générale";

  // Extract recommendations from bot responses
  const recommendations = extractRecommendations(botResponses);

  return {
    patientId: patientProfile.id,
    dentistId: appointmentData?.dentistId, // Will be null initially, updated when dentist is assigned
    title,
    description: `Consultation via chat bot. ${chatContent.substring(0, 500)}...`,
    findings,
    recommendations,
    recordType: appointmentData?.urgency === 'high' ? 'urgence' : 'consultation',
    visitDate: appointmentData?.appointmentDate 
      ? new Date(appointmentData.appointmentDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0]
  };
};

const extractSymptoms = (chatContent: string): string[] => {
  const symptoms: string[] = [];
  const symptomsKeywords = [
    'douleur', 'mal', 'saignement', 'gonflement', 'sensibilité',
    'infection', 'abcès', 'carie', 'gingivite', 'tartre',
    'mauvaise haleine', 'dent cassée', 'couronne'
  ];

  symptomsKeywords.forEach(keyword => {
    if (chatContent.toLowerCase().includes(keyword)) {
      symptoms.push(keyword);
    }
  });

  return symptoms;
};

const extractRecommendations = (botResponses: string): string => {
  // Simple extraction of recommendations from bot responses
  const recommendations: string[] = [];
  
  if (botResponses.toLowerCase().includes('urgence')) {
    recommendations.push('Consultation d\'urgence recommandée');
  }
  if (botResponses.toLowerCase().includes('brossage')) {
    recommendations.push('Améliorer l\'hygiène dentaire');
  }
  if (botResponses.toLowerCase().includes('rendez-vous')) {
    recommendations.push('Prise de rendez-vous conseillée');
  }

  return recommendations.length > 0 
    ? recommendations.join('. ') + '.'
    : 'Consultation de suivi recommandée.';
};

export const createDossierAfterSignup = async (userId: string) => {
  try {
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      console.error('Error getting profile for new user:', profileError);
      return;
    }

    // Create initial welcome record
    const initialRecord: CreateMedicalRecordData = {
      patientId: profile.id,
      dentistId: undefined, // Will be assigned later
      title: 'Dossier patient créé',
      description: `Nouveau patient inscrit le ${new Date().toLocaleDateString('fr-FR')}`,
      findings: 'Nouveau patient - historique médical à compléter',
      recommendations: 'Planifier une consultation initiale pour évaluation complète',
      recordType: 'administratif'
    };

    await createMedicalRecord(initialRecord);
    console.log('Initial dossier created for new patient:', profile.id);
  } catch (error) {
    console.error('Error creating initial dossier:', error);
  }
};