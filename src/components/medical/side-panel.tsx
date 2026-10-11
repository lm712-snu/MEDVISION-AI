'use client';

import { useRef } from 'react';
import {
  FolderOpen, ScanLine, Pill, MessageSquare, ShieldCheck,
  FileImage, PlayCircle, Loader2, ChevronDown, ChevronUp,
  Activity, Brain, AlertTriangle, FileText, ImagePlus,
  XCircle, AlertCircle, Info,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useMedicalStore, type MedicalCase, type AnalysisData } from '@/store/medical-store';
import { PrescriptionInput } from '@/components/medical/prescription-input';
import { DrugInteractionAlerts } from '@/components/medical/drug-interaction-alerts';
import { ReportViewer } from '@/components/medical/report-viewer';
import { toast } from 'sonner';
import { useState } from 'react';

interface SidePanelProps {
  onRunAnalysis: () => void;
  onRefreshCase: () => void;
}

export function SidePanel({ onRunAnalysis, onRefreshCase }: SidePanelProps) {
  const {
    sidePanelView,
    currentCase,
    isAnalyzing,
    analysisData,
    reports,
    reportSigned,
  } = useMedicalStore();

  return (
    <div className="h-full flex flex-col bg-white border-l border-border/50">
      <ScrollArea className="flex-1">
        <div className="p-5">
          <AnimatePresence mode="wait">
            {sidePanelView === 'workspace' && (
              <motion.div
                key="workspace"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <WorkspaceView />
              </motion.div>
            )}
            {sidePanelView === 'case_overview' && currentCase && (
              <motion.div
                key="case_overview"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <CaseOverviewView
                  case_={currentCase}
                  isAnalyzing={isAnalyzing}
                  onRunAnalysis={onRunAnalysis}
                  onRefreshCase={onRefreshCase}
                />
              </motion.div>
            )}
            {sidePanelView === 'findings' && currentCase && (
              <motion.div
                key="findings"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <FindingsView
                  case_={currentCase}
                  analysisData={analysisData}
                  reports={reports}
                  reportSigned={reportSigned}
                />
              </motion.div>
            )}
            {sidePanelView === 'medications' && currentCase && (
              <motion.div
                key="medications"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
              >
                <MedicationsView case_={currentCase} onRefreshCase={onRefreshCase} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ScrollArea>
    </div>
  );
}

/* ─── Workspace View ─── */
function WorkspaceView() {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FolderOpen className="h-5 w-5 text-primary" />
          Your workspace
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Start a new review or continue from a recent case.
        </p>
      </div>

      <Card className="p-4 border-border/50">
        <h3 className="text-sm font-medium text-foreground mb-3">Supported workflows</h3>
        <div className="space-y-2.5">
          {[
            { icon: ScanLine, label: 'Scan review', desc: 'Upload and analyze medical images' },
            { icon: Pill, label: 'Medication review', desc: 'Check interactions and contraindications' },
            { icon: MessageSquare, label: 'Clinical discussion', desc: 'Ask questions about a case' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-primary/8 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <span className="text-sm text-foreground">{item.label}</span>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 px-3 py-2.5 rounded-lg">
        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0" />
        <span>No real patient data. Clinical decision support only.</span>
      </div>
    </div>
  );
}

/* ─── Case Overview View ─── */
function CaseOverviewView({
  case_,
  isAnalyzing,
  onRunAnalysis,
  onRefreshCase,
}: {
  case_: MedicalCase;
  isAnalyzing: boolean;
  onRunAnalysis: () => void;
  onRefreshCase: () => void;
}) {
  const [notesOpen, setNotesOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addImagesToCase, setCurrentCase } = useMedicalStore();

  const hasImages = case_.images && case_.images.length > 0;
  const canAnalyze = hasImages && case_.status !== 'analyzing' && case_.status !== 'completed';

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive' }> = {
    draft: { label: 'Draft', variant: 'outline' },
    analyzing: { label: 'Analyzing', variant: 'secondary' },
    completed: { label: 'Completed', variant: 'default' },
    escalated: { label: 'Escalated', variant: 'destructive' },
  };
  const status = statusConfig[case_.status] || statusConfig.draft;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const imageData: { fileName: string; mimeType: string; fileSize: number; dataUrl: string }[] = [];

    for (const file of files) {
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      imageData.push({
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        dataUrl,
      });
    }

    addImagesToCase(case_.id, imageData);
    onRefreshCase();
    toast.success(`${files.length} image(s) uploaded.`);
    e.target.value = '';
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" />
          Case overview
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {case_.scanType} — {case_.bodyRegion || 'No region specified'}
        </p>
      </div>

      <Card className="p-4 border-border/50 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Patient ID</span>
          <Badge variant="outline" className="text-xs font-mono">
            {case_.patientId || 'N/A'}
          </Badge>
        </div>
        {case_.patientName && (
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Patient name</span>
            <span className="text-sm text-foreground">{case_.patientName}</span>
          </div>
        )}
        <Separator className="bg-border/40" />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Status</span>
          <Badge variant={status.variant} className="text-xs">
            {case_.status === 'analyzing' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
            {status.label}
          </Badge>
        </div>
      </Card>

      {/* Uploaded images */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5">
            <FileImage className="h-4 w-4 text-primary/70" />
            Uploaded scans
            {hasImages && (
              <span className="text-xs text-muted-foreground">({case_.images.length})</span>
            )}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="h-7 text-xs text-primary hover:text-primary/80"
          >
            <ImagePlus className="h-3.5 w-3.5 mr-1" />
            Add
          </Button>
        </div>

        {hasImages ? (
          <div className="grid grid-cols-3 gap-2">
            {case_.images.map((img) => (
              <div
                key={img.id}
                className="aspect-square rounded-lg border border-border/50 bg-muted/30 flex items-center justify-center overflow-hidden"
              >
                {img.dataUrl ? (
                  <img src={img.dataUrl} alt={img.fileName} className="w-full h-full object-cover" />
                ) : (
                  <FileImage className="h-5 w-5 text-muted-foreground/40" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-border/60 bg-muted/20 p-6 text-center">
            <FileImage className="h-6 w-6 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">No scans uploaded yet</p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      {/* Medications */}
      {case_.prescriptions && case_.prescriptions.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
            <Pill className="h-4 w-4 text-primary/70" />
            Medications
            <span className="text-xs text-muted-foreground">({case_.prescriptions.length})</span>
          </h3>
          <div className="space-y-1.5">
            {case_.prescriptions.map((rx) => (
              <div key={rx.id} className="text-xs text-foreground bg-muted/30 px-2.5 py-1.5 rounded-md flex items-center justify-between">
                <span className="font-medium">{rx.medicationName}</span>
                {rx.dosage && <span className="text-muted-foreground">{rx.dosage}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clinical notes */}
      <Collapsible open={notesOpen} onOpenChange={setNotesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-sm text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="h-4 w-4" />
              Clinical notes
            </span>
            {notesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="mt-2 rounded-lg border border-border/50 bg-muted/20 p-3 text-sm text-foreground/80">
            {case_.notes || 'No clinical notes added.'}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Run analysis button */}
      {canAnalyze && (
        <Button
          onClick={onRunAnalysis}
          disabled={isAnalyzing}
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 h-10"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <PlayCircle className="h-4 w-4 mr-2" />
              Run Analysis
            </>
          )}
        </Button>
      )}

      {case_.status === 'completed' && (
        <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 px-3 py-2.5 rounded-lg">
          <Activity className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Analysis complete. View findings in the chat.</span>
        </div>
      )}
    </div>
  );
}

/* ─── Findings View ─── */
function FindingsView({
  case_,
  analysisData,
  reports,
  reportSigned,
}: {
  case_: MedicalCase;
  analysisData: AnalysisData | null;
  reports: { clinicianReport: string; patientSummary: string } | null;
  reportSigned: boolean;
}) {
  const [reportOpen, setReportOpen] = useState(false);
  const { signReport } = useMedicalStore();

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Analysis findings
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          {case_.scanType} of {case_.bodyRegion || 'unspecified region'}
        </p>
      </div>

      {analysisData ? (
        <>
          {/* Overall confidence */}
          <Card className="p-4 border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall confidence</span>
              <span className="text-lg font-bold text-primary tabular-nums">
                {(analysisData.overallConfidence * 100).toFixed(0)}%
              </span>
            </div>
            <Progress
              value={analysisData.overallConfidence * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground mt-2">
              {analysisData.overallConfidence >= 0.7
                ? 'High confidence. Clinician review still required.'
                : analysisData.overallConfidence >= 0.4
                ? 'Moderate confidence. Some findings may need additional review.'
                : 'Low confidence. All findings should be verified.'}
            </p>
          </Card>

          {/* Findings list */}
          <div>
            <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
              <Activity className="h-4 w-4 text-primary/70" />
              Findings
              <span className="text-xs text-muted-foreground">({analysisData.findings.length})</span>
            </h3>
            <div className="space-y-2">
              {analysisData.findings.map((finding, i) => (
                <FindingCard key={i} finding={finding} />
              ))}
            </div>
          </div>

          {/* Drug interactions */}
          {analysisData.drugInteractions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Drug interactions
                <span className="text-xs text-muted-foreground">({analysisData.drugInteractions.length})</span>
              </h3>
              <DrugInteractionAlerts
                interactions={analysisData.drugInteractions}
                prescriptionReview={analysisData.prescriptionReview}
              />
            </div>
          )}

          {/* View full report */}
          {reports && (
            <Button
              onClick={() => setReportOpen(true)}
              variant="outline"
              className="w-full border-primary/30 text-primary hover:bg-primary/5"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Full Report
            </Button>
          )}

          <Dialog open={reportOpen} onOpenChange={setReportOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Clinical Report</DialogTitle>
              </DialogHeader>
              {reports && (
                <ReportViewer
                  clinicianReport={reports.clinicianReport}
                  patientSummary={reports.patientSummary}
                  isSigned={reportSigned}
                  caseId={case_.id}
                  onSignToggle={() => {
                    signReport(case_.id);
                    toast.success(reportSigned ? 'Report unsigned.' : 'Report signed.');
                  }}
                />
              )}
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div className="text-center py-10">
          <Brain className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
          <p className="text-sm text-muted-foreground">No analysis data available yet.</p>
        </div>
      )}
    </div>
  );
}

/* ─── Single Finding Card ─── */
function FindingCard({ finding }: { finding: { description: string; confidence: number; region?: string; severity?: string } }) {
  const severityMap: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
    normal: { icon: Activity, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200' },
    notable: { icon: Info, color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-200' },
    concerning: { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
    urgent: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50 border-red-200' },
  };
  const config = severityMap[finding.severity || 'notable'] || severityMap.notable;
  const Icon = config.icon;

  return (
    <div className={`rounded-lg border p-3 ${config.bg}`}>
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${config.color}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            {finding.severity && (
              <Badge variant="outline" className={`text-[10px] ${config.color} border-current/20`}>
                {finding.severity}
              </Badge>
            )}
            {finding.region && (
              <span className="text-xs text-muted-foreground">{finding.region}</span>
            )}
          </div>
          <p className="text-sm text-foreground mt-1">{finding.description}</p>
          <div className="flex items-center gap-2 mt-1.5">
            <div className="flex-1 max-w-24">
              <Progress value={finding.confidence * 100} className="h-1" />
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {(finding.confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Medications View ─── */
function MedicationsView({
  case_,
  onRefreshCase,
}: {
  case_: MedicalCase;
  onRefreshCase: () => void;
}) {
  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Pill className="h-5 w-5 text-primary" />
          Medications
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Review and manage prescriptions for this case.
        </p>
      </div>

      <PrescriptionInput
        caseId={case_.id}
        existingPrescriptions={case_.prescriptions || []}
        onComplete={onRefreshCase}
      />
    </div>
  );
}
