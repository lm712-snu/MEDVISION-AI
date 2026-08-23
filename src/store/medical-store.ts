import { create } from 'zustand';

export type CaseStatus = 'draft' | 'analyzing' | 'completed' | 'escalated';

export interface CaseImage {
  id: string;
  caseId: string;
  fileName: string;
  fileKey: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
}

export interface Prescription {
  id: string;
  caseId: string;
  medicationName: string;
  dosage: string | null;
  frequency: string | null;
  notes: string | null;
  source: string;
  createdAt: string;
}

export interface Finding {
  description: string;
  confidence: number;
  region?: string;
  severity?: 'normal' | 'notable' | 'concerning' | 'urgent';
}

export interface DrugInteraction {
  drug1: string;
  drug2: string;
  severity: 'mild' | 'moderate' | 'severe' | 'contraindicated';
  description: string;
  mechanism?: string;
  recommendation?: string;
}

export interface AnalysisData {
  findings: Finding[];
  overallConfidence: number;
  regionsOfInterest: string[];
  prescriptionReview: string;
  drugInteractions: DrugInteraction[];
  escalationReason: string | null;
  isUrgent: boolean;
  isOOD: boolean;
}

export interface Reports {
  clinicianReport: string;
  patientSummary: string;
}

export interface MedicalCase {
  id: string;
  patientName: string | null;
  patientId: string | null;
  scanType: string;
  bodyRegion: string | null;
  notes: string | null;
  status: CaseStatus;
  urgencyFlag: boolean;
  oodFlag: boolean;
  createdAt: string;
  updatedAt: string;
  images: CaseImage[];
  prescriptions: Prescription[];
  analysis: {
    id: string;
    findings: string;
    regionsOfInterest: string | null;
    overallConfidence: number | null;
    rawAnalysis: string | null;
    prescriptionReview: string | null;
    drugInteractions: string | null;
    escalationReason: string | null;
    createdAt: string;
    updatedAt: string;
  } | null;
  report: {
    id: string;
    clinicianReport: string;
    patientSummary: string;
    clinicianSigned: boolean;
    createdAt: string;
    updatedAt: string;
  } | null;
}

export type WorkflowStep = 'setup' | 'upload' | 'prescriptions' | 'analyze' | 'results';

interface MedicalStore {
  // Case management
  cases: MedicalCase[];
  currentCase: MedicalCase | null;
  workflowStep: WorkflowStep;

  // Analysis state
  isAnalyzing: boolean;
  analysisData: AnalysisData | null;
  reports: Reports | null;
  error: string | null;

  // Draft form data
  draftCase: {
    patientName: string;
    patientId: string;
    scanType: string;
    bodyRegion: string;
    notes: string;
  };
  draftMedications: { name: string; dosage: string; frequency: string }[];

  // Actions
  setWorkflowStep: (step: WorkflowStep) => void;
  setDraftCase: (data: Partial<MedicalStore['draftCase']>) => void;
  addMedication: () => void;
  updateMedication: (index: number, data: Partial<{ name: string; dosage: string; frequency: string }>) => void;
  removeMedication: (index: number) => void;
  resetDraft: () => void;
  setError: (error: string | null) => void;
  setCurrentCase: (c: MedicalCase | null) => void;
  setAnalysisData: (data: AnalysisData | null) => void;
  setReports: (data: Reports | null) => void;
  setIsAnalyzing: (v: boolean) => void;
}

const initialDraft = {
  patientName: '',
  patientId: '',
  scanType: 'MRI',
  bodyRegion: '',
  notes: '',
};

export const useMedicalStore = create<MedicalStore>((set) => ({
  cases: [],
  currentCase: null,
  workflowStep: 'setup',
  isAnalyzing: false,
  analysisData: null,
  reports: null,
  error: null,
  draftCase: { ...initialDraft },
  draftMedications: [{ name: '', dosage: '', frequency: '' }],

  setWorkflowStep: (step) => set({ workflowStep: step }),

  setDraftCase: (data) =>
    set((state) => ({
      draftCase: { ...state.draftCase, ...data },
    })),

  addMedication: () =>
    set((state) => ({
      draftMedications: [...state.draftMedications, { name: '', dosage: '', frequency: '' }],
    })),

  updateMedication: (index, data) =>
    set((state) => ({
      draftMedications: state.draftMedications.map((m, i) =>
        i === index ? { ...m, ...data } : m
      ),
    })),

  removeMedication: (index) =>
    set((state) => ({
      draftMedications: state.draftMedications.filter((_, i) => i !== index),
    })),

  resetDraft: () =>
    set({
      draftCase: { ...initialDraft },
      draftMedications: [{ name: '', dosage: '', frequency: '' }],
      currentCase: null,
      analysisData: null,
      reports: null,
      error: null,
      workflowStep: 'setup',
    }),

  setError: (error) => set({ error }),
  setCurrentCase: (c) => set({ currentCase: c }),
  setAnalysisData: (data) => set({ analysisData: data }),
  setReports: (data) => set({ reports: data }),
  setIsAnalyzing: (v) => set({ isAnalyzing: v }),
}));
