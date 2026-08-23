'use client';

import { Pill, AlertTriangle, XCircle, AlertCircle, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
    case 'contraindicated': return 'border-red-500 bg-red-50 text-red-900';
    case 'severe': return 'border-red-300 bg-red-50/80 text-red-900';
    case 'moderate': return 'border-orange-300 bg-orange-50/80 text-orange-900';
    default: return 'border-yellow-300 bg-yellow-50/80 text-yellow-900';
  }
}

function getSeverityColor(severity: string) {
  switch (severity) {
    case 'contraindicated': return 'bg-red-200 text-red-900';
    case 'severe': return 'bg-red-100 text-red-800';
    case 'moderate': return 'bg-orange-100 text-orange-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

export function DrugInteractionAlerts({ interactions, prescriptionReview }: DrugInteractionAlertsProps) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  if (interactions.length === 0 && !prescriptionReview) return null;

  return (
    <div className="space-y-4">
      {/* Interaction alerts */}
      {interactions.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Pill className="h-4 w-4 text-destructive" />
              Drug Interaction Alerts
              <Badge variant="destructive" className="text-[10px]">
                {interactions.length} found
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {interactions.map((interaction, index) => {
              const Icon = getInteractionIcon(interaction.severity);
              const isExpanded = expandedIdx === index;
              return (
                <div
                  key={index}
                  className={`rounded-lg border p-3 ${getInteractionStyle(interaction.severity)}`}
                >
                  <button
                    className="w-full text-left flex items-start gap-2"
                    onClick={() => setExpandedIdx(isExpanded ? null : index)}
                  >
                    <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-[10px] ${getSeverityColor(interaction.severity)}`}>
                          {interaction.severity.toUpperCase()}
                        </Badge>
                        <span className="text-sm font-medium">
                          {interaction.drug1} + {interaction.drug2}
                        </span>
                        <span className="text-xs ml-auto">
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </span>
                      </div>
                      <p className="text-xs mt-1">{interaction.description}</p>
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="mt-2 ml-6 text-xs space-y-1">
                      {interaction.mechanism && (
                        <p><strong>Mechanism:</strong> {interaction.mechanism}</p>
                      )}
                      {interaction.recommendation && (
                        <p><strong>Clinical Note:</strong> {interaction.recommendation}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Prescription review summary */}
      {prescriptionReview && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <Pill className="h-4 w-4" />
              Prescription Context Review
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{prescriptionReview}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
