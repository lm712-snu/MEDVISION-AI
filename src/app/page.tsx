'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  Brain, Plus, ShieldCheck, PanelRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { toast } from 'sonner';
import {
  useMedicalStore,
  type MedicalCase,
  type AnalysisData,
} from '@/store/medical-store';
import { ChatMessageBubble, TypingIndicator } from '@/components/medical/chat-message';
import { ChatInput } from '@/components/medical/chat-input';
import { WelcomeState } from '@/components/medical/welcome-state';
import { InlineCaseForm } from '@/components/medical/inline-case-form';
import { SidePanel } from '@/components/medical/side-panel';

export default function MedicalCopilotPage() {
  const store = useMedicalStore();
  const {
    messages,
    isTyping,
    currentCase,
    isAnalyzing,
    addMessage,
    setTyping,
    setCurrentCase,
    setSidePanelView,
    setAnalysisData,
    setReports,
    setIsAnalyzing,
    setError,
    resetAll,
    createCase,
    addImagesToCase,
    runAnalysis,
    signReport,
  } = store;

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [caseFormVisible, setCaseFormVisible] = useState(false);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // ─── Action handlers ───

  const handleWelcomeAction = useCallback(
    (action: 'upload_scan' | 'discuss_case' | 'review_meds') => {
      if (action === 'upload_scan') {
        addMessage({
          role: 'user',
          content: 'I\'d like to review a medical scan.',
        });
        addMessage({
          role: 'assistant',
          content: 'I\'d be happy to help review that scan. Let me set up a case first — could you share the patient\'s identifier and the scan region?',
        });
        setCaseFormVisible(true);
      } else if (action === 'discuss_case') {
        addMessage({
          role: 'user',
          content: 'I want to discuss a clinical case.',
        });
        addMessage({
          role: 'assistant',
          content: 'Of course. Tell me about the case — the patient\'s presentation, any relevant history, or a specific clinical question you\'d like to explore.',
        });
      } else if (action === 'review_meds') {
        addMessage({
          role: 'user',
          content: 'I\'d like to review medications.',
        });
        addMessage({
          role: 'assistant',
          content: 'I can help check for drug interactions and contraindications. Let me set up a case first so we can add the medication list.',
        });
        setCaseFormVisible(true);
      }
    },
    [addMessage]
  );

  const handleCaseCreated = useCallback(
    (data: { id: string; patientId: string; scanType: string; bodyRegion: string }) => {
      const newCase: MedicalCase = {
        id: data.id,
        patientName: store.draftCase.patientName || null,
        patientId: data.patientId,
        scanType: data.scanType,
        bodyRegion: data.bodyRegion,
        notes: store.draftCase.notes || null,
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

      setCurrentCase(newCase);
      setSidePanelView('case_overview');
      setCaseFormVisible(false);

      addMessage({
        role: 'assistant',
        content: `Case created for patient ${data.patientId} (${data.scanType} — ${data.bodyRegion}). You can now upload the scan images using the attach button, or add them in the side panel.`,
      });
    },
    [store.draftCase, setCurrentCase, setSidePanelView, addMessage]
  );

  const handleSendMessage = useCallback(
    (content: string) => {
      addMessage({ role: 'user', content });

      setTyping(true);
      setTimeout(() => {
        setTyping(false);

        if (!currentCase) {
          const scanKeywords = /scan|mri|ct|x-ray|xray|image|upload|radiol/i;
          if (scanKeywords.test(content)) {
            addMessage({
              role: 'assistant',
              content: 'I\'d be happy to help review that scan. Let me set up a case first — could you share the patient\'s identifier and the scan region?',
            });
            setCaseFormVisible(true);
          } else {
            addMessage({
              role: 'assistant',
              content: 'I understand. To give you the best support, let me set up a case first. Could you share the patient\'s identifier and the relevant scan region?',
            });
            setCaseFormVisible(true);
          }
        } else {
          const analysisKeywords = /analy|result|finding|report/i;
          const uploadKeywords = /upload|attach|scan|image/i;
          const medKeywords = /med|drug|prescription|interact|dosage/i;

          if (analysisKeywords.test(content) && currentCase.status === 'completed') {
            addMessage({
              role: 'assistant',
              content: 'The analysis is complete. You can view the detailed findings in the side panel. Would you like me to walk you through any specific finding?',
            });
          } else if (uploadKeywords.test(content)) {
            addMessage({
              role: 'assistant',
              content: 'You can attach scan images using the paperclip button in the input bar, or drag and drop files in the side panel\'s upload area.',
            });
          } else if (medKeywords.test(content)) {
            addMessage({
              role: 'assistant',
              content: 'I can help with medication review. You can add prescriptions in the side panel, and I\'ll check for interactions and contraindications once the list is saved.',
            });
            setSidePanelView('medications');
          } else {
            addMessage({
              role: 'assistant',
              content: 'Got it. I\'m here to help — feel free to ask follow-up questions, upload additional scans, or request an analysis when you\'re ready.',
            });
          }
        }
      }, 800 + Math.random() * 1200);
    },
    [addMessage, setTyping, currentCase, setSidePanelView]
  );

  const handleAttach = useCallback(() => {
    if (!currentCase) {
      toast.info('Create a case first to upload images.');
      return;
    }
    fileInputRef.current?.click();
  }, [currentCase]);

  const handleRefreshCase = useCallback(async () => {
    if (!currentCase) return;
    // Refresh from store (client-side)
    const refreshed = store.refreshCase(currentCase.id);
    if (refreshed) {
      setCurrentCase(refreshed);
    }
  }, [currentCase, store, setCurrentCase]);

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!currentCase || !e.target.files || e.target.files.length === 0) return;

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

      addImagesToCase(currentCase.id, imageData);

      // Refresh current case reference
      const refreshed = useMedicalStore.getState().cases.find(c => c.id === currentCase.id);
      if (refreshed) setCurrentCase(refreshed);

      addMessage({
        role: 'assistant',
        content: `Received ${files.length} scan image(s). They're now attached to the case. You can review them in the side panel, or go ahead and run the analysis when ready.`,
      });

      e.target.value = '';
    },
    [currentCase, addImagesToCase, addMessage, setCurrentCase]
  );

  const handleRunAnalysis = useCallback(async () => {
    if (!currentCase) return;

    setIsAnalyzing(true);
    addMessage({
      role: 'system',
      content: 'Analysis started...',
    });

    try {
      // Simulate analysis delay
      await new Promise((resolve) => setTimeout(resolve, 2000 + Math.random() * 1500));

      const { analysis, reports: analysisReports } = runAnalysis(currentCase.id);

      const updatedCase = useMedicalStore.getState().cases.find(c => c.id === currentCase.id);
      if (updatedCase) setCurrentCase(updatedCase);

      setAnalysisData(analysis);
      setReports(analysisReports);
      setSidePanelView('findings');

      addMessage({
        role: 'assistant',
        content: 'Analysis complete. I\'ve reviewed the scans and identified the key findings. You can see the full breakdown in the side panel — including confidence levels, regions of interest, and any drug interaction alerts. Would you like me to walk you through any specific finding?',
      });

      toast.success('Analysis completed successfully.');
    } catch {
      setError('Analysis failed. Please try again.');
      addMessage({
        role: 'assistant',
        content: 'I ran into an issue running the analysis. This could be due to the image format or a temporary service issue. Could you try again?',
      });
      toast.error('Analysis failed.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [currentCase, addMessage, setCurrentCase, setAnalysisData, setReports, setSidePanelView, setIsAnalyzing, setError, runAnalysis]);

  const handleNewCase = useCallback(() => {
    resetAll();
    setCaseFormVisible(false);
    toast.info('Starting a new case.');
  }, [resetAll]);

  const hasMessages = messages.length > 0;

  // Show inline case form when flag is set and no current case
  const shouldShowCaseForm = caseFormVisible && !currentCase;

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* ─── Top Nav Bar ─── */}
      <header className="flex-shrink-0 h-14 bg-white border-b border-border/50 flex items-center justify-between px-4 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-foreground leading-tight">MedVision AI</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Clinical intelligence, alongside you</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {currentCase && (
            <Badge variant="secondary" className="text-xs gap-1 hidden sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-primary inline-block" />
              {currentCase.patientId || 'Case'} · {currentCase.scanType}
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleNewCase}
            className="h-8 text-xs gap-1.5 border-border/60 hover:border-primary/30"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New Case</span>
          </Button>

          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/40 gap-1 hidden md:inline-flex">
            <ShieldCheck className="h-3 w-3" />
            Clinical decision support only
          </Badge>
        </div>
      </header>

      {/* ─── Main Content ─── */}
      <div className="flex-1 flex min-h-0">
        {/* ─── Left: Chat Column ─── */}
        <div className="flex-1 min-w-0 flex flex-col lg:max-w-[65%]">
          {!hasMessages ? (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <WelcomeState onAction={handleWelcomeAction} />
            </div>
          ) : (
            <ScrollArea className="flex-1">
              <div className="p-5 max-w-3xl mx-auto">
                {messages.map((msg) => (
                  <ChatMessageBubble key={msg.id} message={msg} />
                ))}

                {shouldShowCaseForm && (
                  <InlineCaseForm onSubmit={handleCaseCreated} />
                )}

                {isTyping && <TypingIndicator />}

                <div ref={chatEndRef} />
              </div>
            </ScrollArea>
          )}

          {/* Chat input bar */}
          <ChatInput
            onSend={handleSendMessage}
            onAttach={handleAttach}
            disabled={isAnalyzing}
          />

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileUpload}
          />
        </div>

        {/* ─── Right: Side Panel (desktop) ─── */}
        <div className="hidden lg:block w-[35%] min-w-[320px] max-w-[440px]">
          <SidePanel
            onRunAnalysis={handleRunAnalysis}
            onRefreshCase={handleRefreshCase}
          />
        </div>
      </div>

      {/* ─── Mobile: Side Panel as floating sheet ─── */}
      <div className="lg:hidden fixed bottom-20 right-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full shadow-md bg-white border-border/60"
            >
              <PanelRight className="h-4 w-4 text-primary" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[85vw] max-w-[400px] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Case panel</SheetTitle>
            </SheetHeader>
            <SidePanel
              onRunAnalysis={handleRunAnalysis}
              onRefreshCase={handleRefreshCase}
            />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
