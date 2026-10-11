import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CaseStatus = 'draft' | 'analyzing' | 'completed' | 'escalated';

export interface CaseImage {
  id: string; caseId: string; fileName: string; fileKey: string; mimeType: string; fileSize: number; createdAt: string;
  dataUrl?: string; // base64 for client-side storage
}

export interface Prescription {
  id: string; caseId: string; medicationName: string; dosage: string | null; frequency: string | null; notes: string | null; source: string; createdAt: string;
}

export interface Finding {
  description: string; confidence: number; region?: string; severity?: 'normal' | 'notable' | 'concerning' | 'urgent';
}

export interface DrugInteraction {
  drug1: string; drug2: string; severity: 'mild' | 'moderate' | 'severe' | 'contraindicated'; description: string; mechanism?: string; recommendation?: string;
}

export interface AnalysisData {
  findings: Finding[]; overallConfidence: number; regionsOfInterest: string[];
  prescriptionReview: string; drugInteractions: DrugInteraction[];
  escalationReason: string | null; isUrgent: boolean; isOOD: boolean;
}

export interface Reports {
  clinicianReport: string; patientSummary: string;
}

export interface MedicalCase {
  id: string; patientName: string | null; patientId: string | null; scanType: string;
  bodyRegion: string | null; notes: string | null; status: CaseStatus;
  urgencyFlag: boolean; oodFlag: boolean; createdAt: string; updatedAt: string;
  images: CaseImage[]; prescriptions: Prescription[];
  analysis: AnalysisData | null;
  report: Reports | null;
  clinicianSigned: boolean;
}

// Chat messages
export interface ChatMessage {
  id: string;
  role: 'assistant' | 'user' | 'system';
  content: string;
  timestamp: number;
  actions?: ChatAction[];
  attachments?: { type: 'image' | 'file'; name: string; url?: string }[];
}

export interface ChatAction {
  label: string;
  icon?: string;
  action: string;
}

type SidePanelView = 'workspace' | 'case_overview' | 'findings' | 'medications';

interface MedicalStore {
  cases: MedicalCase[];
  currentCase: MedicalCase | null;

  // Chat
  messages: ChatMessage[];
  isTyping: boolean;

  // Analysis state
  isAnalyzing: boolean;
  analysisData: AnalysisData | null;
  reports: Reports | null;
  error: string | null;

  // Side panel
  sidePanelView: SidePanelView;
  reportSigned: boolean;

  // Draft form data
  draftCase: {
    patientName: string; patientId: string; scanType: string; bodyRegion: string; notes: string;
  };
  draftMedications: { name: string; dosage: string; frequency: string }[];

  // Actions
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  setTyping: (v: boolean) => void;
  setSidePanelView: (v: SidePanelView) => void;
  setError: (error: string | null) => void;
  setCurrentCase: (c: MedicalCase | null) => void;
  setAnalysisData: (data: AnalysisData | null) => void;
  setReports: (data: Reports | null) => void;
  setIsAnalyzing: (v: boolean) => void;
  setDraftCase: (data: Partial<MedicalStore['draftCase']>) => void;
  addMedication: () => void;
  updateMedication: (index: number, data: Partial<{ name: string; dosage: string; frequency: string }>) => void;
  removeMedication: (index: number) => void;
  resetAll: () => void;

  // Client-side CRUD (replaces API calls)
  createCase: (data: { patientName: string | null; patientId: string; scanType: string; bodyRegion: string; notes: string | null }) => MedicalCase;
  addImagesToCase: (caseId: string, images: { fileName: string; mimeType: string; fileSize: number; dataUrl: string }[]) => void;
  addPrescriptionsToCase: (caseId: string, meds: { medicationName: string; dosage: string | null; frequency: string | null; notes?: string | null }[]) => void;
  runAnalysis: (caseId: string) => { analysis: AnalysisData; reports: Reports };
  signReport: (caseId: string) => void;
  refreshCase: (caseId: string) => MedicalCase | null;
}

const initialDraft = { patientName: '', patientId: '', scanType: 'MRI', bodyRegion: '', notes: '' };

let msgCounter = 0;
function nextMsgId() { return `msg-${++msgCounter}-${Date.now()}`; }
function nextId() { return `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

// ─── Mock Analysis Generator ───
function generateMockAnalysis(caseData: MedicalCase): { analysis: AnalysisData; reports: Reports } {
  const scanType = caseData.scanType;
  const bodyRegion = caseData.bodyRegion || 'unspecified region';

  const findings: Finding[] = [
    {
      description: `No acute ${scanType}-identifiable pathology in the ${bodyRegion} region. Parenchymal signal appears within normal limits.`,
      confidence: 0.82,
      region: bodyRegion,
      severity: 'normal',
    },
    {
      description: `Mild age-related degenerative changes noted in the ${bodyRegion}. No significant stenosis or compression fracture identified.`,
      confidence: 0.71,
      region: bodyRegion,
      severity: 'notable',
    },
    {
      description: `Small area of subtle signal abnormality in the right ${bodyRegion} parietal region — clinical correlation recommended to exclude early ischemic change.`,
      confidence: 0.48,
      region: `${bodyRegion} — right parietal`,
      severity: 'concerning',
    },
  ];

  const interactions: DrugInteraction[] = [];
  const medNames = caseData.prescriptions.map(p => p.medicationName.toLowerCase());

  if (medNames.some(m => m.includes('warfarin')) && medNames.some(m => m.includes('aspirin'))) {
    interactions.push({
      drug1: 'Warfarin', drug2: 'Aspirin',
      severity: 'severe',
      description: 'Concurrent use significantly increases bleeding risk.',
      mechanism: 'Pharmacodynamic synergy — both impair hemostasis via different pathways.',
      recommendation: 'Avoid combination unless specifically indicated; if used, monitor INR closely.',
    });
  }

  if (medNames.some(m => m.includes('metformin')) && medNames.some(m => m.includes('contrast') || m.includes('iodinated'))) {
    interactions.push({
      drug1: 'Metformin', drug2: 'Iodinated Contrast',
      severity: 'severe',
      description: 'Risk of lactic acidosis with iodinated contrast administration.',
      mechanism: 'Contrast-induced nephropathy reduces metformin clearance.',
      recommendation: 'Discontinue metformin 48h before and after contrast; check renal function before restarting.',
    });
  }

  const overallConfidence = findings.reduce((sum, f) => sum + f.confidence, 0) / findings.length;
  const hasUrgent = findings.some(f => f.severity === 'urgent');
  const hasConcerning = findings.some(f => f.severity === 'concerning');

  const analysis: AnalysisData = {
    findings,
    overallConfidence,
    regionsOfInterest: [bodyRegion, `${bodyRegion} — right parietal`],
    prescriptionReview: caseData.prescriptions.length > 0
      ? `Reviewed ${caseData.prescriptions.length} medication(s). ${interactions.length > 0 ? `${interactions.length} interaction(s) identified — see alerts below.` : 'No clinically significant interactions identified.'}`
      : 'No medications on file for this case.',
    drugInteractions: interactions,
    escalationReason: hasUrgent ? 'Urgent finding detected — requires immediate clinician review.' : hasConcerning ? 'Low-confidence concerning finding — recommend additional imaging or clinical correlation.' : null,
    isUrgent: hasUrgent,
    isOOD: false,
  };

  const reports: Reports = {
    clinicianReport: `## ${scanType} Analysis — ${bodyRegion}\n\n**Patient:** ${caseData.patientId || 'Unknown'}  \n**Date:** ${new Date().toLocaleDateString()}\n\n### Summary\n${analysis.findings.map((f, i) => `${i + 1}. **[${f.severity?.toUpperCase() || 'NOTABLE'}]** ${f.description} *(confidence: ${(f.confidence * 100).toFixed(0)}%)*`).join('\n')}\n\n### Regions of Interest\n${analysis.regionsOfInterest.map(r => `- ${r}`).join('\n')}\n\n### Prescription Review\n${analysis.prescriptionReview}\n\n${interactions.length > 0 ? `### Drug Interactions\n${interactions.map(i => `- **${i.drug1} + ${i.drug2}** (${i.severity}): ${i.description}`).join('\n')}` : ''}\n\n---\n*This report was generated by MedVision AI — a clinical decision support tool. All findings require clinician verification.*`,
    patientSummary: `### Your ${scanType} Scan Results\n\nWe reviewed your ${scanType} scan of the ${bodyRegion}.\n\n**Key takeaways:**\n${analysis.findings.filter(f => f.severity !== 'normal').map(f => `- ${f.description}`).join('\n') || '- No significant findings that require immediate attention.'}\n\n**Next steps:** Your doctor will review these results with you and may recommend follow-up if needed.\n\n*These results were generated by AI and must be confirmed by your doctor.*`,
  };

  return { analysis, reports };
}

export const useMedicalStore = create<MedicalStore>()(
  persist(
    (set, get) => ({
      cases: [],
      currentCase: null,
      messages: [],
      isTyping: false,
      isAnalyzing: false,
      analysisData: null,
      reports: null,
      error: null,
      sidePanelView: 'workspace',
      reportSigned: false,
      draftCase: { ...initialDraft },
      draftMedications: [{ name: '', dosage: '', frequency: '' }],

      addMessage: (msg) => set((s) => ({
        messages: [...s.messages, { ...msg, id: nextMsgId(), timestamp: Date.now() }],
      })),

      setTyping: (v) => set({ isTyping: v }),
      setSidePanelView: (v) => set({ sidePanelView: v }),
      setError: (error) => set({ error }),
      setCurrentCase: (c) => set({ currentCase: c }),
      setAnalysisData: (data) => set({ analysisData: data }),
      setReports: (data) => set({ reports: data }),
      setIsAnalyzing: (v) => set({ isAnalyzing: v }),

      setDraftCase: (data) => set((s) => ({ draftCase: { ...s.draftCase, ...data } })),
      addMedication: () => set((s) => ({ draftMedications: [...s.draftMedications, { name: '', dosage: '', frequency: '' }] })),
      updateMedication: (index, data) => set((s) => ({
        draftMedications: s.draftMedications.map((m, i) => i === index ? { ...m, ...data } : m),
      })),
      removeMedication: (index) => set((s) => ({
        draftMedications: s.draftMedications.filter((_, i) => i !== index),
      })),

      resetAll: () => set({
        currentCase: null, messages: [], isTyping: false, analysisData: null,
        reports: null, error: null, sidePanelView: 'workspace', reportSigned: false,
        draftCase: { ...initialDraft }, draftMedications: [{ name: '', dosage: '', frequency: '' }],
      }),

      // ─── Client-side CRUD ───

      createCase: (data) => {
        const newCase: MedicalCase = {
          id: nextId(),
          patientName: data.patientName,
          patientId: data.patientId,
          scanType: data.scanType,
          bodyRegion: data.bodyRegion,
          notes: data.notes,
          status: 'draft',
          urgencyFlag: false,
          oodFlag: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          images: [],
          prescriptions: [],
          analysis: null,
          report: null,
          clinicianSigned: false,
        };
        set((s) => ({ cases: [newCase, ...s.cases] }));
        return newCase;
      },

      addImagesToCase: (caseId, imageData) => {
        const newImages: CaseImage[] = imageData.map((img) => ({
          id: nextId(),
          caseId,
          fileName: img.fileName,
          fileKey: img.fileName,
          mimeType: img.mimeType,
          fileSize: img.fileSize,
          dataUrl: img.dataUrl,
          createdAt: new Date().toISOString(),
        }));

        set((s) => {
          const updatedCases = s.cases.map((c) =>
            c.id === caseId ? { ...c, images: [...c.images, ...newImages], updatedAt: new Date().toISOString() } : c
          );
          const updatedCurrentCase = s.currentCase?.id === caseId
            ? { ...s.currentCase, images: [...s.currentCase.images, ...newImages], updatedAt: new Date().toISOString() }
            : s.currentCase;
          return { cases: updatedCases, currentCase: updatedCurrentCase };
        });
      },

      addPrescriptionsToCase: (caseId, meds) => {
        const newPrescriptions: Prescription[] = meds.map((med) => ({
          id: nextId(),
          caseId,
          medicationName: med.medicationName,
          dosage: med.dosage,
          frequency: med.frequency,
          notes: med.notes || null,
          source: 'manual',
          createdAt: new Date().toISOString(),
        }));

        set((s) => {
          const updatedCases = s.cases.map((c) =>
            c.id === caseId ? { ...c, prescriptions: [...c.prescriptions, ...newPrescriptions], updatedAt: new Date().toISOString() } : c
          );
          const updatedCurrentCase = s.currentCase?.id === caseId
            ? { ...s.currentCase, prescriptions: [...s.currentCase.prescriptions, ...newPrescriptions], updatedAt: new Date().toISOString() }
            : s.currentCase;
          return { cases: updatedCases, currentCase: updatedCurrentCase };
        });
      },

      runAnalysis: (caseId) => {
        const caseData = get().cases.find(c => c.id === caseId) || get().currentCase;
        if (!caseData) {
          // Return a fallback
          const fallbackAnalysis: AnalysisData = {
            findings: [], overallConfidence: 0, regionsOfInterest: [],
            prescriptionReview: '', drugInteractions: [],
            escalationReason: null, isUrgent: false, isOOD: false,
          };
          const fallbackReports: Reports = { clinicianReport: '', patientSummary: '' };
          return { analysis: fallbackAnalysis, reports: fallbackReports };
        }

        const { analysis, reports } = generateMockAnalysis(caseData);

        set((s) => {
          const updatedCases = s.cases.map((c) =>
            c.id === caseId
              ? { ...c, status: 'completed' as CaseStatus, analysis, report: reports, updatedAt: new Date().toISOString() }
              : c
          );
          const updatedCurrentCase = s.currentCase?.id === caseId
            ? { ...s.currentCase, status: 'completed' as CaseStatus, analysis, report: reports, updatedAt: new Date().toISOString() }
            : s.currentCase;
          return {
            cases: updatedCases,
            currentCase: updatedCurrentCase,
            analysisData: analysis,
            reports: reports,
          };
        });

        return { analysis, reports };
      },

      signReport: (caseId) => {
        set((s) => {
          const currentSigned = s.currentCase?.id === caseId ? s.currentCase.clinicianSigned : false;
          const newSigned = !currentSigned;
          const updatedCases = s.cases.map((c) =>
            c.id === caseId ? { ...c, clinicianSigned: newSigned } : c
          );
          const updatedCurrentCase = s.currentCase?.id === caseId
            ? { ...s.currentCase, clinicianSigned: newSigned }
            : s.currentCase;
          return { cases: updatedCases, currentCase: updatedCurrentCase, reportSigned: newSigned };
        });
      },

      refreshCase: (caseId) => {
        const caseData = get().cases.find(c => c.id === caseId) || null;
        if (caseData) {
          set({ currentCase: caseData });
        }
        return caseData;
      },
    }),
    {
      name: 'medvision-ai-storage',
      partialize: (state) => ({
        cases: state.cases,
        currentCase: state.currentCase,
        messages: state.messages,
        analysisData: state.analysisData,
        reports: state.reports,
        reportSigned: state.reportSigned,
      }),
    }
  )
);
