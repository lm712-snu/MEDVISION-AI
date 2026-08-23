'use client';

import ReactMarkdown from 'react-markdown';
import { FileText, User, ShieldCheck, CheckCircle2, Stethoscope, Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ReportViewerProps {
  clinicianReport: string;
  patientSummary: string;
  isSigned: boolean;
  caseId: string;
  onSignToggle: () => void;
}

export function ReportViewer({ clinicianReport, patientSummary, isSigned, caseId, onSignToggle }: ReportViewerProps) {
  return (
    <div className="glass-card rounded-2xl overflow-hidden">
      <Tabs defaultValue="clinician" className="w-full">
        <div className="flex items-center justify-between border-b border-border/50 px-5 pt-4 pb-0">
          <TabsList className="bg-transparent h-auto p-0 gap-0 border-b-0">
            <TabsTrigger
              value="clinician"
              className="relative px-0 pb-3 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Stethoscope className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Clinician Report</span>
                {isSigned ? (
                  <Badge className="text-[10px] bg-emerald-500/15 text-emerald-400 border-emerald-500/25 ml-1.5">
                    <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
                    Signed
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400 ml-1.5">
                    Needs Review
                  </Badge>
                )}
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="patient"
              className="relative px-0 pb-3 ml-6 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-primary transition-colors"
            >
              <div className="flex items-center gap-2">
                <Heart className="h-3.5 w-3.5" />
                <span className="text-sm font-medium">Patient Summary</span>
              </div>
            </TabsTrigger>
          </TabsList>

          <Button
            variant={isSigned ? 'ghost' : 'default'}
            size="sm"
            onClick={onSignToggle}
            className={`mr-5 mb-3 ${isSigned ? 'text-muted-foreground hover:text-foreground' : 'bg-gradient-to-r from-[oklch(0.72_0.15_170)] to-[oklch(0.65_0.18_140)] text-white border-0 hover:opacity-90'}`}
          >
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
            {isSigned ? 'Unsign' : 'Sign Off'}
          </Button>
        </div>

        <TabsContent value="clinician" className="mt-0">
          <div className="p-5 prose prose-sm max-w-none">
            <ReactMarkdown>{clinicianReport}</ReactMarkdown>
          </div>
        </TabsContent>

        <TabsContent value="patient" className="mt-0">
          <div className="p-5 prose prose-sm max-w-none">
            <ReactMarkdown>{patientSummary}</ReactMarkdown>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
