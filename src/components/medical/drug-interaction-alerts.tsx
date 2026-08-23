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
  switch (severity) {
    case 'contraindicated': return XCircle;
    case 'severe': return AlertTriangle;
    case 'moderate': return AlertCircle;
    default: return Info;
  }
}

function getInteractionStyle(severity: string) {
  switch (severity) {
    case 'contraindicated': return 'border-red-500/40 bg-red-500/8';
    case 'severe': return 'border-red-500/25 bg-red-500/5';
    case 'moderate': return 'border-amber-500/25 bg-amber-500/5';
    default: return 'border-yellow-500/20 bg-yellow-500/5';
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'contraindicated': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'severe': return 'bg-red-500/15 text-red-400 border-red-500/25';
    case 'moderate': return 'bg-amber-500/15 text-amber-400 border-amber-500/25';
    default: return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25';
  }
}

function getSeverityIconColor(severity: string) {
  switch (severity) {
    case 'contraindicated': return 'text-red-400';
    case 'severe': return 'text-red-400';
    case 'moderate': return 'text-amber-400';
    default: return 'text-yellow-400';
  }
}

export function DrugInteractionAlerts({ interactions, prescriptionReview }: DrugInteractionAlertsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (interactions.length === 0 && !prescriptionReview) return null;

  return (
    <div className="space-y-4">
      {interactions.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-4">
            <div className="h-8 w-8 rounded-lg bg-destructive/15 flex items-center justify-center">
              <Pill className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <h3 className="text-sm font-semibold">Drug Interaction Alerts</h3>
              <p className="text-xs text-muted-foreground">{interactions.length} interaction(s) detected</p>
            </div>
          </div>

          <div className="space-y-2.5">
            {interactions.map((interaction, index) => {
              const Icon = getInteractionIcon(interaction.severity);
              const isExpanded = expandedIdx === index;
              return (
                <div
                  key={index}
                  className={`rounded-xl border p-4 transition-all duration-200 hover:border-opacity-60 ${getInteractionStyle(interaction.severity)}`}
                >
                  <button
                    className="w-full text-left flex items-start gap-2.5"
                    onClick={() => setExpandedIdx(isExpanded ? null : index)}
                  >
                    <Icon className={`h-4.5 w-4.5 mt-0.5 flex-shrink-0 ${getSeverityIconColor(interaction.severity)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] font-semibold ${getSeverityColor(interaction.severity)} border`}>
                          {interaction.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">
                          {interaction.drug1} + {interaction.drug2}
                        </span>
                        <span className="text-xs ml-auto text-muted-foreground/50">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 mt-1.5 leading-relaxed">{interaction.description}</p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-3 ml-7 text-xs space-y-1.5 text-muted-foreground">
                      {interaction.mechanism && (
                        <p><span className="font-medium text-foreground/60">Mechanism:</span> {interaction.mechanism}</p>
                      )}
                      {interaction.recommendation && (
                        <p><span className="font-medium text-foreground/60">Clinical Note:</span> {interaction.recommendation}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {prescriptionReview && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="h-8 w-8 rounded-lg bg-violet-500/15 flex items-center justify-center">
              <Pill className="h-4 w-4 text-violet-400" />
            </div>
            <h3 className="text-sm font-semibold">Prescription Context Review</h3>
          </div>
          <p className="text-sm text-foreground/75 whitespace-pre-wrap leading-relaxed">{prescriptionReview}</p>
        </div>
      )}
    </div>
  );
}
