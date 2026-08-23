'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Upload, Pill, PlayCircle, FileText, ArrowRight, ArrowLeft,
  Loader2, PlusCircle, RotateCcw, CheckCircle2, AlertTriangle,
  Sparkles, Activity, Layers, ScanSearch, Zap, Eye, FileBarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useMedicalStore, type WorkflowStep } from '@/store/medical-store';
import { ImageUploader } from '@/components/medical/image-uploader';
import { PrescriptionInput } from '@/components/medical/prescription-input';
import { FindingsViewer } from '@/components/medical/findings-viewer';
import { DrugInteractionAlerts } from '@/components/medical/drug-interaction-alerts';
import { ReportViewer } from '@/components/medical/report-viewer';
import { EscalationBanner, LowConfidenceBanner } from '@/components/medical/escalation-banner';

const STEPS: { key: WorkflowStep; label: string; shortLabel: string; icon: typeof Brain }[] = [
  { key: 'setup', label: 'Case Setup', shortLabel: 'Setup', icon: Layers },
  { key: 'upload', label: 'Upload Scans', shortLabel: 'Scans', icon: Upload },
  { key: 'prescriptions', label: 'Medications', shortLabel: 'Meds', icon: Pill },
  { key: 'analyze', label: 'Analyze', shortLabel: 'Analyze', icon: PlayCircle },
  { key: 'results', label: 'Results', shortLabel: 'Results', icon: FileText },
];

const BODY_REGIONS = [
  'Brain / Head',
  'Spine (Cervical)',
  'Spine (Thoracic)',
  'Spine (Lumbar)',
  'Knee',
  'Shoulder',
  'Hip',
  'Abdomen / Pelvis',
  'Chest / Thorax',
  'Other',
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    filter: 'blur(4px)',
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    filter: 'blur(4px)',
  }),
};

export default function HomePage() {
  const store = useMedicalStore();
  const [isCreating, setIsCreating] = useState(false);
  const [signed, setSigned] = useState(false);
  const [direction, setDirection] = useState(1);

  const stepIndex = STEPS.findIndex((s) => s.key === store.workflowStep);

  const navigateTo = (step: WorkflowStep, dir: number) => {
    setDirection(dir);
    store.setWorkflowStep(step);
  };

  const canGoNext = useCallback(() => {
    switch (store.workflowStep) {
      case 'setup': return store.currentCase !== null;
      case 'upload': return store.currentCase && (store.currentCase as any).images?.length > 0;
      case 'prescriptions': return true;
      case 'analyze': return false;
      case 'results': return false;
      default: return false;
    }
  }, [store.workflowStep, store.currentCase]);

  const createCase = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: store.draftCase.patientName || undefined,
          patientId: store.draftCase.patientId || undefined,
          scanType: store.draftCase.scanType,
          bodyRegion: store.draftCase.bodyRegion || undefined,
          notes: store.draftCase.notes || undefined,
        }),
      });
      if (!res.ok) throw new Error('Failed to create case');
      const data = await res.json();
      store.setCurrentCase(data.case as any);
      navigateTo('upload', 1);
      toast.success('Case created successfully.');
    } catch {
      toast.error('Failed to create case.');
    } finally {
      setIsCreating(false);
    }
  };

  const refreshCase = useCallback(async () => {
    if (!store.currentCase) return;
    try {
      const res = await fetch(`/api/cases/${store.currentCase.id}`);
      if (!res.ok) return;
      const data = await res.json();
      store.setCurrentCase(data.case as any);
    } catch { /* */ }
  }, [store.currentCase]);

  const runAnalysis = async () => {
    if (!store.currentCase) return;
    store.setIsAnalyzing(true);
    store.setError(null);
    try {
      const res = await fetch(`/api/cases/${store.currentCase.id}/analyze`, {
        method: 'POST',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Analysis failed');
      }
      const data = await res.json();
      store.setAnalysisData(data.analysis);
      store.setReports(data.reports);
      navigateTo('results', 1);
      toast.success('Analysis complete.');
    } catch (err: any) {
      store.setError(err.message);
      toast.error(`Analysis failed: ${err.message}`);
    } finally {
      store.setIsAnalyzing(false);
    }
  };

  const toggleSign = async () => {
    if (!store.currentCase) return;
    try {
      const res = await fetch(`/api/cases/${store.currentCase.id}/sign-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signed: !signed }),
      });
      if (!res.ok) throw new Error('Failed to update');
      setSigned(!signed);
      toast.success(!signed ? 'Report signed off.' : 'Report signature removed.');
    } catch {
      toast.error('Failed to update report status.');
    }
  };

  const handleNewCase = () => {
    store.resetDraft();
    setSigned(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Header */}
      <header className="relative overflow-hidden border-b border-border/50">
        <div className="absolute inset-0 z-0">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30"
            style={{ backgroundImage: 'url(/hero-bg.png)' }}
          />
          <div className="hero-overlay absolute inset-0" />
        </div>
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[oklch(0.72_0.15_170)] to-[oklch(0.65_0.18_140)] flex items-center justify-center glow-subtle animate-float">
              <Brain className="h-5.5 w-5.5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight leading-none gradient-text">
                MedVision AI
              </h1>
              <p className="text-[11px] text-muted-foreground/80 leading-none mt-1 font-medium">
                Multimodal Medical Analysis
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary/80 bg-primary/5 font-medium">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered
            </Badge>
          </div>
        </div>
      </header>

      {/* Step Indicator */}
      <div className="border-b border-border/50 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5">
          <div className="flex items-center gap-0">
            {STEPS.map((step, idx) => {
              const isActive = store.workflowStep === step.key;
              const isCompleted = idx < stepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-center flex-1 last:flex-none">
                  <button
                    onClick={() => {
                      if (isCompleted || isActive) navigateTo(step.key, idx < stepIndex ? -1 : 1);
                    }}
                    disabled={!isCompleted && !isActive}
                    className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-300 whitespace-nowrap ${
                      isActive
                        ? 'bg-primary/15 text-primary glow-subtle'
                        : isCompleted
                        ? 'text-primary/70 hover:bg-primary/5 cursor-pointer'
                        : 'text-muted-foreground/40 cursor-not-allowed'
                    }`}
                  >
                    <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : isCompleted
                        ? 'bg-primary/20 text-primary'
                        : 'bg-muted/50 text-muted-foreground/40'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle2 className="h-3.5 w-3.5" />
                      ) : (
                        <Icon className="h-3.5 w-3.5" />
                      )}
                    </div>
                    <span className="hidden sm:inline">{step.label}</span>
                    <span className="sm:hidden">{step.shortLabel}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`step-connector mx-1 rounded-full ${
                      idx < stepIndex ? 'completed' : isActive ? 'active' : ''
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-6">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={store.workflowStep}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* SETUP STEP */}
            {store.workflowStep === 'setup' && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">New Analysis Case</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Set up a new case for multimodal medical image analysis.
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-6 space-y-5 gradient-border">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient Identifier</Label>
                      <Input
                        placeholder="e.g., MRN-001234"
                        value={store.draftCase.patientId}
                        onChange={(e) => store.setDraftCase({ patientId: e.target.value })}
                        className="mt-1.5 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Patient Name</Label>
                      <Input
                        placeholder="e.g., John D."
                        value={store.draftCase.patientName}
                        onChange={(e) => store.setDraftCase({ patientName: e.target.value })}
                        className="mt-1.5 bg-background/50 border-border/50 focus:border-primary/50"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Scan Type</Label>
                      <Select
                        value={store.draftCase.scanType}
                        onValueChange={(v) => store.setDraftCase({ scanType: v })}
                      >
                        <SelectTrigger className="mt-1.5 bg-background/50 border-border/50">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MRI">MRI</SelectItem>
                          <SelectItem value="CT">CT</SelectItem>
                          <SelectItem value="X-Ray">X-Ray</SelectItem>
                          <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Body Region</Label>
                      <Select
                        value={store.draftCase.bodyRegion}
                        onValueChange={(v) => store.setDraftCase({ bodyRegion: v })}
                      >
                        <SelectTrigger className="mt-1.5 bg-background/50 border-border/50">
                          <SelectValue placeholder="Select region..." />
                        </SelectTrigger>
                        <SelectContent>
                          {BODY_REGIONS.map((r) => (
                            <SelectItem key={r} value={r}>{r}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Clinical Notes</Label>
                    <Textarea
                      placeholder="Any relevant clinical context for the analysis..."
                      value={store.draftCase.notes}
                      onChange={(e) => store.setDraftCase({ notes: e.target.value })}
                      className="mt-1.5 bg-background/50 border-border/50 focus:border-primary/50"
                      rows={3}
                    />
                  </div>
                  <div className="flex justify-end pt-1">
                    <Button
                      onClick={createCase}
                      disabled={isCreating}
                      className="bg-gradient-to-r from-[oklch(0.72_0.15_170)] to-[oklch(0.65_0.18_140)] text-white border-0 hover:opacity-90 shadow-lg shadow-primary/20"
                    >
                      {isCreating ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <PlusCircle className="h-4 w-4 mr-2" />
                      )}
                      Create Case
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* UPLOAD STEP */}
            {store.workflowStep === 'upload' && store.currentCase && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Upload MRI Scans</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload the patient&apos;s MRI scan images. Multiple slices or views supported.
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-6 gradient-border">
                  <ImageUploader
                    caseId={store.currentCase.id}
                    images={(store.currentCase as any).images || []}
                    onUploadComplete={refreshCase}
                  />
                </div>
              </div>
            )}

            {/* PRESCRIPTIONS STEP */}
            {store.workflowStep === 'prescriptions' && store.currentCase && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Patient Medications</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add current prescriptions for drug interaction checking. This step is optional.
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-6 gradient-border">
                  <PrescriptionInput
                    caseId={store.currentCase.id}
                    existingPrescriptions={(store.currentCase as any).prescriptions || []}
                    onComplete={refreshCase}
                  />
                </div>
              </div>
            )}

            {/* ANALYZE STEP */}
            {store.workflowStep === 'analyze' && store.currentCase && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Run Analysis Pipeline</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    The AI pipeline will analyze your scans, check drug interactions, and generate dual reports.
                  </p>
                </div>
                <div className="glass-card rounded-2xl p-6 space-y-6 gradient-border">
                  {/* Pipeline steps */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {[
                      { icon: Eye, label: 'Vision Analysis', desc: 'VLM-powered MRI scan analysis with confidence scoring', color: 'from-teal-500/20 to-emerald-500/20', iconColor: 'text-teal-400' },
                      { icon: Pill, label: 'Prescription Review', desc: 'Cross-reference medications with imaging findings', color: 'from-violet-500/20 to-purple-500/20', iconColor: 'text-violet-400' },
                      { icon: AlertTriangle, label: 'Drug Interactions', desc: 'Flag known interactions from clinical database', color: 'from-amber-500/20 to-orange-500/20', iconColor: 'text-amber-400' },
                      { icon: FileBarChart, label: 'Dual Reports', desc: 'Clinician report + patient-friendly summary', color: 'from-rose-500/20 to-pink-500/20', iconColor: 'text-rose-400' },
                    ].map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className={`flex items-start gap-3 p-4 rounded-xl bg-gradient-to-br ${item.color} border border-border/50`}
                      >
                        <div className="h-9 w-9 rounded-lg bg-background/40 flex items-center justify-center flex-shrink-0">
                          <item.icon className={`h-4.5 w-4.5 ${item.iconColor}`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{item.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Case summary */}
                  <div className="rounded-xl border border-border/50 bg-background/30 p-4 space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Case Summary</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {[
                        { label: 'Patient ID', value: store.currentCase.patientId || '—' },
                        { label: 'Scan Type', value: store.currentCase.scanType },
                        { label: 'Body Region', value: store.currentCase.bodyRegion || '—' },
                        { label: 'Images', value: `${(store.currentCase as any).images?.length || 0} file(s)` },
                      ].map((item, i) => (
                        <div key={i}>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.label}</span>
                          <p className="text-sm font-medium mt-0.5">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {store.error && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
                      <p className="text-sm text-destructive font-medium">Analysis Error</p>
                      <p className="text-sm text-muted-foreground mt-1">{store.error}</p>
                    </div>
                  )}

                  <div className="flex justify-center pt-2">
                    <motion.div
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Button
                        size="lg"
                        onClick={runAnalysis}
                        disabled={store.isAnalyzing}
                        className="px-10 py-6 text-base bg-gradient-to-r from-[oklch(0.72_0.15_170)] via-[oklch(0.65_0.18_140)] to-[oklch(0.72_0.15_170)] bg-[length:200%_100%] text-white border-0 shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-shadow animate-[gradient-shift_3s_ease_infinite]
                          disabled:opacity-60"
                      >
                        {store.isAnalyzing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2.5 animate-spin" />
                            Analyzing Scans...
                          </>
                        ) : (
                          <>
                            <Zap className="h-5 w-5 mr-2.5" />
                            Start Analysis
                          </>
                        )}
                      </Button>
                    </motion.div>
                  </div>

                  {store.isAnalyzing && (
                    <div className="space-y-3 pt-2">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full rounded-full shimmer w-full" style={{ backgroundSize: '200% 100%' }} />
                        </div>
                        <span className="text-xs text-primary font-medium">Processing</span>
                      </div>
                      <p className="text-xs text-muted-foreground text-center">
                        Running vision analysis, drug interaction checks, and generating reports...
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* RESULTS STEP */}
            {store.workflowStep === 'results' && store.analysisData && store.reports && (
              <div className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Analysis Results</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {(store.currentCase?.patientId || 'Case')} — {store.currentCase?.scanType} {store.currentCase?.bodyRegion ? `· ${store.currentCase.bodyRegion}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {store.currentCase?.status === 'escalated' ? (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="h-3 w-3 mr-1" /> Escalated
                      </Badge>
                    ) : (
                      <Badge className="text-xs bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                        <CheckCircle2 className="h-3 w-3 mr-1" /> Completed
                      </Badge>
                    )}
                    <Badge variant="outline" className="text-xs border-primary/30 text-primary/80">
                      <Activity className="h-3 w-3 mr-1" />
                      {(store.analysisData.overallConfidence * 100).toFixed(0)}% confidence
                    </Badge>
                    {store.analysisData.findings.length > 0 && (
                      <Badge variant="outline" className="text-xs border-border/50">
                        <ScanSearch className="h-3 w-3 mr-1" />
                        {store.analysisData.findings.length} finding(s)
                      </Badge>
                    )}
                  </div>
                </div>

                <EscalationBanner
                  isUrgent={store.analysisData.isUrgent}
                  isOOD={store.analysisData.isOOD}
                  reason={store.analysisData.escalationReason}
                />
                <LowConfidenceBanner confidence={store.analysisData.overallConfidence} />

                <FindingsViewer
                  findings={store.analysisData.findings}
                  overallConfidence={store.analysisData.overallConfidence}
                  regionsOfInterest={store.analysisData.regionsOfInterest}
                />

                <DrugInteractionAlerts
                  interactions={store.analysisData.drugInteractions}
                  prescriptionReview={store.analysisData.prescriptionReview}
                />

                <ReportViewer
                  clinicianReport={store.reports.clinicianReport}
                  patientSummary={store.reports.patientSummary}
                  isSigned={signed}
                  caseId={store.currentCase?.id || ''}
                  onSignToggle={toggleSign}
                />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {store.workflowStep !== 'results' && store.workflowStep !== 'setup' && store.workflowStep !== 'analyze' && (
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => navigateTo(STEPS[stepIndex - 1].key, -1)}
              disabled={stepIndex <= 0}
              className="text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <Button
              onClick={() => navigateTo(STEPS[stepIndex + 1].key, 1)}
              disabled={!canGoNext()}
              className="bg-gradient-to-r from-[oklch(0.72_0.15_170)] to-[oklch(0.65_0.18_140)] text-white border-0 hover:opacity-90"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        )}

        {store.workflowStep === 'results' && (
          <div className="flex justify-center pt-4">
            <Button variant="ghost" onClick={handleNewCase} className="text-muted-foreground hover:text-foreground">
              <RotateCcw className="h-4 w-4 mr-2" />
              Start New Case
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border/50 bg-secondary/20 mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground/60">
            <p className="flex items-center gap-1.5">
              <Brain className="h-3 w-3" />
              <span>MedVision AI</span>
              <span className="text-muted-foreground/30">·</span>
              <span>Research Prototype</span>
            </p>
            <p>All outputs require clinician verification.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
