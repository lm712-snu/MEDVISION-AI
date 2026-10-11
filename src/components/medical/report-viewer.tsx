'use client';

import ReactMarkdown from 'react-markdown';
import { ShieldCheck, CheckCircle2, Stethoscope, Heart } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ReportViewerProps {
  clinicianReport: string; patientSummary: string; isSigned: boolean; caseId: string; onSignToggle: () => void;
}

export function ReportViewer({ clinicianReport, patientSummary, isSigned, onSignToggle }: ReportViewerProps) {
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden warm-card-hover">
      <Tabs defaultValue="clinician" className="w-full">
        <div className="flex items-center justify-between border-b border-border px-4 pt-3 pb-0">
          <TabsList className="bg-transparent h-auto p-0 border-b-0">
            <TabsTrigger value="clinician" className="relative px-0 pb-2.5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-primary">
              <Stethoscope className="h5 w-3.5 mr-1.5" />
              <span className="text-sm font-medium">Clinician report</span>
              {isSigned ? <Badge className="text-[10px] bg-emerald-50 text-emerald-600 ml-1.5"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Signed</Badge> : <Badge variant="outline" className="text-[10px] border-amber-300 text-amber-600 ml-1.5">Needs review</Badge>}
            </TabsTrigger>
            <TabsTrigger value="patient" className="relative px-0 pb-2.5 ml-5 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none text-muted-foreground data-[state=active]:text-primary">
              <Heart className="h-3.5 w-3.5 mr-1.5" />
              <span className="text-sm font-medium">Patient summary</span>
            </TabsTrigger>
          </TabsList>
          <Button variant={isSigned ? 'ghost' : 'default'} size="sm" onClick={onSignToggle} className="mr-3 mb-2.5">
            <ShieldCheck className="h-3.5 w-3.5 mr-1" />{isSigned ? 'Unsign' : 'Sign off'}
          </Button>
        </div>
        <TabsContent value="clinician" className="mt-0"><div className="p-4 prose prose-sm max-w-none"><ReactMarkdown>{clinicianReport}</ReactMarkdown></div></TabsContent>
        <TabsContent value="patient" className="mt-0"><div className="p-4 prose prose-sm max-w-none"><ReactMarkdown>{patientSummary}</ReactMarkdown></div></TabsContent>
      </Tabs>
    </div>
  );
}
