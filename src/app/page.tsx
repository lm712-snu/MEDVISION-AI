'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Brain, Upload, Pill, PlayCircle, FileText, ArrowRight, ArrowLeft,
  Loader2, PlusCircle, RotateCcw, CheckCircle2, Clock, AlertTriangle,
  ShieldCheck, ChevronRight, Activity, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useMedicalStore, type WorkflowStep, type MedicalCase, type AnalysisData, type Reports } from '@/store/medical-store';
import { ImageUploader } from '@/components/medical/image-uploader';
import { PrescriptionInput } from '@/components/medical/prescription-input';
import { FindingsViewer } from '@/components/medical/findings-viewer';
import { DrugInteractionAlerts } from '@/components/medical/drug-interaction-alerts';
import { ReportViewer } from '@/components/medical/report-viewer';
import { ResearchDisclaimer, NotADiagnosisDisclaimer, PatientExpectationsDisclaimer } from '@/components/medical/disclaimer-banner';
import { EscalationBanner, LowConfidenceBanner } from '@/components/medical/escalation-banner';

const STEPS: { key: WorkflowStep; label: string; icon: typeof Brain }[] = [
  { key: 'setup', label: 'Case Setup', icon: Layers },
  { key: 'upload', label: 'Upload Scans', icon: Upload },
  { key: 'prescriptions', label: 'Medications', icon: Pill },
  { key: 'analyze', label: 'Run Analysis', icon: PlayCircle },
  { key: 'results', label: 'Results', icon: FileText },
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

export default function HomePage() {
  const store = useMedicalStore();
  const [isCreating, setIsCreating] = useState(false);
  const [signed, setSigned] = useState(false);

  const stepIndex = STEPS.findIndex((s) => s.key === store.workflowStep);

  const canGoNext = useCallback(() => {
    switch (store.workflowStep) {
      case 'setup':
        return store.currentCase !== null;
      case 'upload':
        return store.currentCase && (store.currentCase as any).images?.length > 0;
      case 'prescriptions':
        return true; // medications are optional
      case 'analyze':
        return false; // no next from analyze
      case 'results':
        return false; // final step
      default:
        return false;
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
      store.setWorkflowStep('upload');
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
    } catch {
      // silently fail
    }
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
      store.setWorkflowStep('results');
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
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight leading-none">MedVision AI</h1>
              <p className="text-[11px] text-muted-foreground leading-none mt-0.5">
                Medical Multimodal Analysis Prototype
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700 bg-amber-50">
            <ShieldCheck className="h-3 w-3 mr-1" />
            Research Use Only
          </Badge>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6 space-y-6">
        {/* Top Disclaimer */}
        <ResearchDisclaimer />

        {/* Step Indicator */}
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-2">
          {STEPS.map((step, idx) => {
            const isActive = store.workflowStep === step.key;
            const isCompleted = idx < stepIndex;
            const Icon = step.icon;
            return (
              <div key={step.key} className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
                {idx > 0 && (
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                )}
                <button
                  onClick={() => {
                    if (isCompleted || isActive) {
                      store.setWorkflowStep(step.key);
                    }
                  }}
                  disabled={!isCompleted && !isActive}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 cursor-pointer'
                      : 'bg-muted text-muted-foreground cursor-not-allowed'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{step.label}</span>
                  {isCompleted && <CheckCircle2 className="h-3 w-3" />}
                </button>
              </div>
            );
          })}
        </div>

        {/* Step Content */}
        {store.workflowStep === 'setup' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Analysis Case</CardTitle>
              <CardDescription>
                Set up a new case for multimodal medical image analysis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Patient Identifier</Label>
                  <Input
                    placeholder="e.g., MRN-001234"
                    value={store.draftCase.patientId}
                    onChange={(e) => store.setDraftCase({ patientId: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label>Patient Name (Optional)</Label>
                  <Input
                    placeholder="e.g., John D."
                    value={store.draftCase.patientName}
                    onChange={(e) => store.setDraftCase({ patientName: e.target.value })}
                    className="mt-1.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Scan Type</Label>
                  <Select
                    value={store.draftCase.scanType}
                    onValueChange={(v) => store.setDraftCase({ scanType: v })}
                  >
                    <SelectTrigger className="mt-1.5">
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
                  <Label>Body Region</Label>
                  <Select
                    value={store.draftCase.bodyRegion}
                    onValueChange={(v) => store.setDraftCase({ bodyRegion: v })}
                  >
                    <SelectTrigger className="mt-1.5">
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
                <Label>Clinical Notes (Optional)</Label>
                <Textarea
                  placeholder="Any relevant clinical context for the analysis..."
                  value={store.draftCase.notes}
                  onChange={(e) => store.setDraftCase({ notes: e.target.value })}
                  className="mt-1.5"
                  rows={3}
                />
              </div>
              <div className="flex justify-end">
                <Button onClick={createCase} disabled={isCreating}>
                  {isCreating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <PlusCircle className="h-4 w-4 mr-2" />
                  )}
                  Create Case
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {store.workflowStep === 'upload' && store.currentCase && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload MRI Scans</CardTitle>
              <CardDescription>
                Upload the patient&apos;s MRI scan images. You can upload multiple slices or views at once.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUploader
                caseId={store.currentCase.id}
                images={(store.currentCase as any).images || []}
                onUploadComplete={refreshCase}
              />
            </CardContent>
          </Card>
        )}

        {store.workflowStep === 'prescriptions' && store.currentCase && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Patient Medications</CardTitle>
              <CardDescription>
                Enter the patient&apos;s current prescription medications. This enables drug interaction checking
                and contextual review against imaging findings. This step is optional.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PrescriptionInput
                caseId={store.currentCase.id}
                existingPrescriptions={(store.currentCase as any).prescriptions || []}
                onComplete={refreshCase}
              />
            </CardContent>
          </Card>
        )}

        {store.workflowStep === 'analyze' && store.currentCase && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Run Analysis Pipeline</CardTitle>
              <CardDescription>
                The multimodal analysis pipeline will:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pipeline steps preview */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { icon: Brain, label: 'Vision Analysis (VLM)', desc: 'AI-powered MRI scan analysis with confidence scoring' },
                  { icon: Pill, label: 'Prescription Review', desc: 'Cross-reference medications with imaging findings' },
                  { icon: AlertTriangle, label: 'Drug Interaction Check', desc: 'Flag known interactions from reference database' },
                  { icon: FileText, label: 'Dual Report Generation', desc: 'Clinician report + patient-friendly summary' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Case summary before analysis */}
              <div className="rounded-lg border p-4 bg-muted/30 space-y-2">
                <h4 className="text-sm font-semibold">Case Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">Patient ID</span>
                    <p className="font-medium">{store.currentCase.patientId || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Scan Type</span>
                    <p className="font-medium">{store.currentCase.scanType}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Body Region</span>
                    <p className="font-medium">{store.currentCase.bodyRegion || '—'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">Images</span>
                    <p className="font-medium">{(store.currentCase as any).images?.length || 0} file(s)</p>
                  </div>
                </div>
              </div>

              {store.error && (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive font-medium">Analysis Error</p>
                  <p className="text-sm text-muted-foreground mt-1">{store.error}</p>
                </div>
              )}

              <div className="flex justify-center">
                <Button
                  size="lg"
                  onClick={runAnalysis}
                  disabled={store.isAnalyzing}
                  className="px-8"
                >
                  {store.isAnalyzing ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Analyzing... (this may take a minute)
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-5 w-5 mr-2" />
                      Start Analysis
                    </>
                  )}
                </Button>
              </div>

              {store.isAnalyzing && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Running vision analysis, drug interaction checks, and generating reports...
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {store.workflowStep === 'results' && store.analysisData && store.reports && (
          <div className="space-y-6">
            {/* Escalation banners */}
            <EscalationBanner
              isUrgent={store.analysisData.isUrgent}
              isOOD={store.analysisData.isOOD}
              reason={store.analysisData.escalationReason}
            />
            <LowConfidenceBanner confidence={store.analysisData.overallConfidence} />

            {/* Status bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant={store.currentCase?.status === 'escalated' ? 'destructive' : 'secondary'}
                className="text-xs"
              >
                {store.currentCase?.status === 'escalated' ? (
                  <><AlertTriangle className="h-3 w-3 mr-1" /> Escalated</>
                ) : (
                  <><CheckCircle2 className="h-3 w-3 mr-1" /> Completed</>
                )}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Confidence: {(store.analysisData.overallConfidence * 100).toFixed(0)}%
              </Badge>
              {store.analysisData.findings.length > 0 && (
                <Badge variant="outline" className="text-xs">
                  {store.analysisData.findings.filter((f) => f.severity === 'urgent').length > 0 && (
                    <span className="text-red-600 mr-1">
                      {store.analysisData.findings.filter((f) => f.severity === 'urgent').length} urgent
                    </span>
                  )}
                  {store.analysisData.findings.length} finding(s)
                </Badge>
              )}
            </div>

            {/* Findings */}
            <FindingsViewer
              findings={store.analysisData.findings}
              overallConfidence={store.analysisData.overallConfidence}
              regionsOfInterest={store.analysisData.regionsOfInterest}
            />

            {/* Drug Interactions */}
            <DrugInteractionAlerts
              interactions={store.analysisData.drugInteractions}
              prescriptionReview={store.analysisData.prescriptionReview}
            />

            {/* Reports */}
            <ReportViewer
              clinicianReport={store.reports.clinicianReport}
              patientSummary={store.reports.patientSummary}
              isSigned={signed}
              caseId={store.currentCase?.id || ''}
              onSignToggle={toggleSign}
            />

            {/* Patient Expectations Disclaimer */}
            <PatientExpectationsDisclaimer />
            <NotADiagnosisDisclaimer />
          </div>
        )}

        {/* Navigation buttons */}
        {store.workflowStep !== 'results' && store.workflowStep !== 'setup' && (
          <div className="flex items-center justify-between pt-2">
            <Button
              variant="outline"
              onClick={() => {
                const prevIdx = stepIndex - 1;
                if (prevIdx >= 0) store.setWorkflowStep(STEPS[prevIdx].key);
              }}
              disabled={stepIndex <= 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {store.workflowStep !== 'analyze' && (
              <Button
                onClick={() => {
                  const nextIdx = stepIndex + 1;
                  if (nextIdx < STEPS.length) store.setWorkflowStep(STEPS[nextIdx].key);
                }}
                disabled={!canGoNext()}
              >
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        )}

        {store.workflowStep === 'results' && (
          <div className="flex justify-center pt-2">
            <Button variant="outline" onClick={handleNewCase}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Start New Case
            </Button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
            <p>
              MedVision AI — Research-stage prototype.{' '}
              <span className="font-medium">NOT a certified medical device or diagnostic tool.</span>
            </p>
            <p>
              All outputs require clinician verification. No real patient data should be used.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
