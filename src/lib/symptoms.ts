// Dental symptoms and related utilities
export interface Symptom {
  id: string;
  name: string;
  description: string;
  severity: 'mild' | 'moderate' | 'severe';
  category: 'pain' | 'sensitivity' | 'aesthetic' | 'functional' | 'emergency';
}

export interface SymptomAssessment {
  symptoms: string[];
  severity: number;
  duration: string;
  triggers: string[];
  relievers: string[];
}

// Common dental symptoms
export const dentalSymptoms: Symptom[] = [
  {
    id: 'tooth-pain',
    name: 'Tooth Pain',
    description: 'Sharp or throbbing pain in tooth',
    severity: 'moderate',
    category: 'pain',
  },
  {
    id: 'sensitivity',
    name: 'Tooth Sensitivity',
    description: 'Pain when eating hot or cold foods',
    severity: 'mild',
    category: 'sensitivity',
  },
  {
    id: 'bleeding-gums',
    name: 'Bleeding Gums',
    description: 'Gums bleed during brushing or flossing',
    severity: 'moderate',
    category: 'emergency',
  },
  {
    id: 'swelling',
    name: 'Facial Swelling',
    description: 'Swelling around face, jaw, or neck',
    severity: 'severe',
    category: 'emergency',
  },
];

export const getSymptomsByCategory = (category: string): Symptom[] => {
  return dentalSymptoms.filter(symptom => symptom.category === category);
};

export const assessUrgency = (symptoms: string[]): 'low' | 'medium' | 'high' | 'emergency' => {
  const emergencySymptoms = ['swelling', 'severe-pain', 'infection'];
  const hasEmergency = symptoms.some(s => emergencySymptoms.includes(s));
  
  if (hasEmergency) return 'emergency';
  if (symptoms.length > 3) return 'high';
  if (symptoms.length > 1) return 'medium';
  return 'low';
};

export const generateSymptomSummary = (symptoms: string[] | any[], userProfile?: any): string => {
  // Handle different input types
  if (Array.isArray(symptoms) && symptoms.length > 0 && typeof symptoms[0] === 'string') {
    // Array of symptom strings
    if (symptoms.length === 0) return 'No symptoms reported';
    if (symptoms.length === 1) return `Reported symptom: ${symptoms[0]}`;
    if (symptoms.length === 2) return `Reported symptoms: ${symptoms.join(' and ')}`;
    return `Reported ${symptoms.length} symptoms including: ${symptoms.slice(0, 2).join(', ')} and others`;
  } else if (Array.isArray(symptoms)) {
    // Array of messages - extract symptoms from chat
    const symptomKeywords = ['pain', 'hurt', 'ache', 'sensitive', 'bleeding', 'swollen', 'infection'];
    const extractedSymptoms = symptoms
      .filter((msg: any) => msg && msg.message && typeof msg.message === 'string')
      .map((msg: any) => msg.message.toLowerCase())
      .filter((text: string) => symptomKeywords.some(keyword => text.includes(keyword)))
      .slice(0, 3); // Limit to first 3 relevant messages
    
    if (extractedSymptoms.length === 0) return 'Patient consultation - no specific symptoms mentioned';
    return `Patient reported: ${extractedSymptoms.join(', ')}`;
  }
  
  return 'No symptoms reported';
};