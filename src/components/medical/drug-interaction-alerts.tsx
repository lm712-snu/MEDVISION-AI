'use client';

import { Pill, AlertTriangle, XCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import type { DrugInteraction } from '@/store/medical-store';

interface DrugInteractionAlertsProps {
  interactions: DrugInteraction[];
  prescriptionReview: string;
}

function getInteractionIcon(severity: string) {
  switch (severity) { case 'contraindicated': return XCircle; case 'severe': return AlertTriangle; case 'moderate': return AlertCircle; default: return Info; }
}
function getInteractionStyle(severity: string) {
  switch (severity) { case 'contraindicated': return 'border-red-300 bg-red-50'; case 'severe': return 'border-red-200 bg-red-50/50'; case 'moderate': return 'border-amber-200 bg-amber-50/50'; default: return 'border-border bg-muted/30'; }
}
function getSeverityColor(severity: string) {
  switch (severity) { case 'contraindicated': return 'bg-red-100 text-red-700'; case 'severe': return 'bg-red-50 text-red-600'; case 'moderate': return 'bg-amber-50 text-amber-600'; default: return 'bg-muted text-muted-foreground'; }
}

export function DrugInteractionAlerts({ interactions, prescriptionReview }: DrugInteractionAlertsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  if (interactions.length === 0 && !prescriptionReview) return null;

  return (
    <div className="space-y-3">
      {interactions.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 warm-card-hover">
          <div className="flex items-center gap-2 mb-3">
            <Pill className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-medium">Drug interactions</h3>
            <Badge variant="destructive" className="text-[10px] ml-1">{interactions.length}</Badge>
          </div>
          <div className="space-y-2">
            {interactions.map((interaction, index) => {
              const Icon = getInteractionIcon(interaction.severity);
              const isExpanded = expandedIdx === index;
              return (
                <div key={index} className={`rounded-lg border p-3 ${getInteractionStyle(interaction.severity)}`}>
                  <button className="w-full text-left flex items-start gap-2" onClick={() => setExpandedIdx(isExpanded ? null : index)}>
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0 text-foreground/60" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${getSeverityColor(interaction.severity)}`}>{interaction.severity.toUpperCase()}</Badge>
                        <span className="text-sm font-medium">{interaction.drug1} + {interaction.drug2}</span>
                        <span className="text-xs ml-auto text-muted-foreground">{isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{interaction.description}</p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 ml-6 text-xs space-y-1 text-muted-foreground">
                      {interaction.mechanism && <p><strong>Mechanism:</strong> {interaction.mechanism}</p>}
                      {interaction.recommendation && <p><strong>Note:</strong> {interaction.recommendation}</p>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {prescriptionReview && (
        <div className="rounded-xl border border-border bg-card p-4 warm-card-hover">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2">
            <Pill className="h-4 w-4 text-primary" /> Prescription context
          </h3>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">{prescriptionReview}</p>
        </div>
      )}
    </div>
  );
}
