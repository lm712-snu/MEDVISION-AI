'client';

import ReactMarkdown from 'react-markdown';
import { FileText, User, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface ReportViewerProps {
  clinicianReport: string;
  patientSummary: string;
  isSigned: boolean;
  caseId: string;
  onSignToggle: () => void;
}

export function ReportViewer({ clinicianReport, patientSummary, isSigned, caseId, onSignToggle }: ReportViewerProps) {
  return (
    <Tabs defaultValue="clinician" className="w-full">
      <TabsList className="w-full grid grid-cols-2">
        <TabsTrigger value="clinician" className="flex items-center gap-2">
          <FileText className="h-3.5 w-3.5" />
          Clinician Report
          {!isSigned && (
            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-300 ml-1">
              Needs Sign-off
            </Badge>
          )}
          {isSigned && (
            <Badge className="text-[10px] bg-emerald-100 text-emerald-800 ml-1">
              <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />
              Signed
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="patient" className="flex items-center gap-2">
          <User className="h-3.5 w-3.5" />
          Patient Summary
        </TabsTrigger>
      </TabsList>

      <TabsContent value="clinician" className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Clinician-Facing Report
              </CardTitle>
              <Button
                variant={isSigned ? 'outline' : 'default'}
                size="sm"
                onClick={onSignToggle}
              >
                <ShieldCheck className="h-3.5 w-3.5 mr-1.5" />
                {isSigned ? 'Unsign Report' : 'Sign Off Report'}
              </Button>
            </div>
            <Separator className="mt-2" />
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ReactMarkdown>{clinicianReport}</ReactMarkdown>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="patient" className="mt-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Patient-Facing Summary
            </CardTitle>
            <Separator className="mt-2" />
          </CardHeader>
          <CardContent className="prose prose-sm max-w-none">
            <ReactMarkdown>{patientSummary}</ReactMarkdown>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
