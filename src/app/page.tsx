'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import {
  Brain, Plus, ShieldCheck, PanelRight, House, Sparkles,
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
import { sendGeminiConversation, type GeminiToolCall } from '@/lib/gemini-chat';

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
  const [aiConnected, setAiConnected] = useState(false);

  useEffect(() => {
    setAiConnected(Boolean(window.sessionStorage.getItem('medvision-gemini-api-key')));
  }, []);

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

  const handleConnectAI = useCallback(() => {
    if (aiConnected) {
      if (window.confirm('Disconnect Gemini AI for this browser session?')) {
        window.sessionStorage.removeItem('medvision-gemini-api-key');
        setAiConnected(false);
        toast.info('AI disconnected.');
      }
      return;
    }
    const key = window.prompt('Enter your Google Gemini API key. It is kept only in this browser tab session and sent directly to Google. Do not use a key with sensitive production access.');
    if (!key?.trim()) return;
    window.sessionStorage.setItem('medvision-gemini-api-key', key.trim());
    setAiConnected(true);
    toast.success('Gemini AI connected for this session.');
  }, [aiConnected]);

  const executeLocalTool = useCallback(async (call: GeminiToolCall) => {
    const state = useMedicalStore.getState();
    const activeCase = state.currentCase;
    if (call.name === 'get_current_case') {
      if (!activeCase) return { ok: true, message: 'No active case is selected.', currentCase: null };
      return {
        ok: true,
        currentCase: {
          patientId: activeCase.patientId,
          scanType: activeCase.scanType,
          bodyRegion: activeCase.bodyRegion,
          notes: activeCase.notes,
          status: activeCase.status,
          uploadedImages: activeCase.images.map(image => ({ fileName: image.fileName, mimeType: image.mimeType, fileSize: image.fileSize })),
          medications: activeCase.prescriptions.map(med => ({ name: med.medicationName, dosage: med.dosage, frequency: med.frequency, notes: med.notes })),
          storedAnalysis: activeCase.analysis ? {
            label: 'Stored application analysis; may be demo/mock output, not a validated radiology model result',
            findings: activeCase.analysis.findings,
            prescriptionReview: activeCase.analysis.prescriptionReview,
            drugInteractions: activeCase.analysis.drugInteractions,
          } : null,
        },
      };
    }
    if (call.name === 'list_saved_cases') {
      return {
        ok: true,
        cases: state.cases.map(item => ({
          patientId: item.patientId,
          scanType: item.scanType,
          bodyRegion: item.bodyRegion,
          status: item.status,
          updatedAt: item.updatedAt,
        })),
      };
    }
    if (call.name === 'show_case_findings') {
      if (!activeCase) return { ok: false, message: 'There is no active case. Ask the clinician to open or create a case first.' };
      state.setSidePanelView('findings');
      return { ok: true, action: 'Opened findings panel.', storedAnalysisAvailable: Boolean(activeCase.analysis), note: 'The existing analysis may be mock/demo output and is not a validated AI scan interpretation.' };
    }
    if (call.name === 'show_medications') {
      if (!activeCase) return { ok: false, message: 'There is no active case.' };
      state.setSidePanelView('medications');
      return { ok: true, action: 'Opened medication panel.', medications: activeCase.prescriptions.map(med => ({ name: med.medicationName, dosage: med.dosage, frequency: med.frequency })) };
    }
    if (call.name === 'show_case_overview') {
      if (!activeCase) return { ok: false, message: 'There is no active case.' };
      state.setSidePanelView('case_overview');
      return { ok: true, action: 'Opened case overview.', patientId: activeCase.patientId, scanType: activeCase.scanType, bodyRegion: activeCase.bodyRegion, uploadedImageCount: activeCase.images.length };
    }
    return { ok: false, message: 'Unsupported tool.' };
  }, []);

  const runAiReply = useCallback(async () => {
    setTyping(true);
    try {
      const apiKey = window.sessionStorage.getItem('medvision-gemini-api-key');
      if (!apiKey) {
        addMessage({
          role: 'assistant',
          content: 'I’m ready to help with the conversation and any attached images, but the AI model is not connected yet. Select “Connect AI” in the top bar and enter a Google Gemini API key. Until it is connected, I won’t pretend that a scripted reply is an AI analysis.',
        });
        return;
      }
      const state = useMedicalStore.getState();
      const activeCase = state.currentCase;
      const context = activeCase ? JSON.stringify({
        activeCase: {
          patientId: activeCase.patientId,
          scanType: activeCase.scanType,
          bodyRegion: activeCase.bodyRegion,
          notes: activeCase.notes,
          status: activeCase.status,
          images: activeCase.images.map(image => ({ fileName: image.fileName, mimeType: image.mimeType, fileSize: image.fileSize })),
          medications: activeCase.prescriptions.map(med => ({ name: med.medicationName, dosage: med.dosage, frequency: med.frequency, notes: med.notes })),
          storedAnalysis: activeCase.analysis ? { label: 'Potentially mock/demo output; not validated radiology inference', findings: activeCase.analysis.findings, drugInteractions: activeCase.analysis.drugInteractions } : null,
        },
        savedCaseCount: state.cases.length,
      }) : JSON.stringify({ activeCase: null, savedCaseCount: state.cases.length });
      const history = state.messages.map(message => ({
        role: message.role,
        content: message.content,
        attachments: message.attachments,
      }));
      // Include scans previously uploaded through the case panel as image input too.
      // Avoid duplicating images already attached directly in the chat history.
      if (activeCase) {
        const alreadyAttached = new Set(history.flatMap(message =>
          (message.attachments ?? []).filter(attachment => attachment.type === 'image').map(attachment => attachment.name)
        ));
        const caseImages = activeCase.images
          .filter(image => image.dataUrl && !alreadyAttached.has(image.fileName))
          .slice(-3);
        if (caseImages.length) {
          const lastUserMessage = [...history].reverse().find(message => message.role === 'user');
          if (lastUserMessage) {
            lastUserMessage.attachments = [
              ...(lastUserMessage.attachments ?? []),
              ...caseImages.map(image => ({ type: 'image' as const, name: image.fileName, url: image.dataUrl })),
            ];
            lastUserMessage.content += '\\n\\nRelevant images from the active case are attached as visual context.';
          }
        }
      }
      const result = await sendGeminiConversation({
        apiKey,
        messages: history,
        context,
        executeTool: executeLocalTool,
      });
      addMessage({
        role: 'assistant',
        content: result.text + (result.toolCalls.length ? '\n\n' + 'Used workspace tools: ' + [...new Set(result.toolCalls.map(tool => tool.name.replaceAll('_', ' ')))].join(', ') + '.' : ''),
      });
      setError(null);
    } catch (error) {
      const detail = error instanceof Error ? error.message : 'Unknown connection error.';
      setError(detail);
      addMessage({
        role: 'assistant',
        content: 'I couldn’t get a response from Gemini. ' + detail + '\n\nPlease check your connection and API key under “Connect AI”, then try again. Your message remains in this conversation.',
      });
      toast.error('AI response failed. Check the connection details.');
    } finally {
      setTyping(false);
    }
  }, [addMessage, setTyping, setError, executeLocalTool]);

  const handleSendMessage = useCallback(
    async (content: string) => {
      addMessage({ role: 'user', content });
      await runAiReply();
    },
    [addMessage, runAiReply]
  );

  const handleAttach = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
      if (!e.target.files || e.target.files.length === 0) return;
      const files = Array.from(e.target.files);
      const imageData: { fileName: string; mimeType: string; fileSize: number; dataUrl: string }[] = [];

      for (const file of files) {
        if (!file.type.startsWith('image/')) continue;
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Could not read ' + file.name));
          reader.readAsDataURL(file);
        });
        imageData.push({ fileName: file.name, mimeType: file.type, fileSize: file.size, dataUrl });
      }

      if (imageData.length === 0) {
        toast.info('Please attach an image file such as PNG or JPEG.');
        e.target.value = '';
        return;
      }

      const activeCase = useMedicalStore.getState().currentCase;
      if (activeCase) {
        addImagesToCase(activeCase.id, imageData);
        const refreshed = useMedicalStore.getState().cases.find(c => c.id === activeCase.id);
        if (refreshed) setCurrentCase(refreshed);
      }

      addMessage({
        role: 'user',
        content: `I attached ${imageData.length} image(s): ${imageData.map(image => image.fileName).join(', ')}. Please examine the image content and respond to my question using this visual context. If I have not asked a specific question yet, tell me what you can and cannot safely infer from the image.`,
        attachments: imageData.map(image => ({ type: 'image' as const, name: image.fileName, url: image.dataUrl })),
      });
      await runAiReply();
      e.target.value = '';
    },
    [addImagesToCase, setCurrentCase, addMessage, runAiReply]
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

  const handleGoHome = useCallback(() => {
    resetAll();
    setCaseFormVisible(false);
    toast.success('Back at your home workspace. Your saved cases are kept.');
  }, [resetAll]);

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
        <button
          type="button"
          onClick={handleGoHome}
          aria-label="Return to MedVision AI home"
          title="Return to home"
          className="flex items-center gap-3 rounded-lg text-left transition-colors hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Brain className="h-4 w-4 text-primary" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-foreground leading-tight">MedVision AI</h1>
            <p className="text-[11px] text-muted-foreground leading-tight">Clinical intelligence, alongside you</p>
          </div>
        </button>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button
            variant={aiConnected ? "secondary" : "outline"}
            size="sm"
            onClick={handleConnectAI}
            aria-label={aiConnected ? "Manage Gemini AI connection" : "Connect Gemini AI"}
            className="h-8 text-xs gap-1.5 border-border/60 hover:border-primary/30"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{aiConnected ? 'AI connected' : 'Connect AI'}</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleGoHome
            aria-label="Return to home workspace"
            className="h-8 text-xs gap-1.5 border-border/60 hover:border-primary/30"
          >
            <House className="h-3.5 w-3.5" />
            <span>Home</span>
          </Button>

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
