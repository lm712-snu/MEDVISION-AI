'use client';

import { 
  Brain, MapPin, AlertTriangle, AlertOctagon, CheckCircle2, 
  Activity, ChevronDown, ChevronUp 
} from 'lucide-react';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import type { Finding } from '@/store/medical-store';

interface FindingsViewerProps {
  findings: Finding[];
  overallConfidence: number;
  regionsOfInterest: string[];
}

function getSeverityConfig(severity?: string) {
  switch (severity) {
    case 'normal':
      return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-800' };
    case 'notable':
      return { icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200', badge: 'bg-blue-100 text-blue-800' };
    case 'concerning':
      return { icon: AlertTriangle, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-800' };
    case 'urgent':
      return { icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-800' };
    default:
      return { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-50 border-gray-200', badge: 'bg-gray-100 text-gray-800' };
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-emerald-500';
  if (confidence >= 0.6) return 'bg-blue-500';
  if (confidence >= 0.4) return 'bg-orange-500';
  return 'bg-red-500';
}

export function FindingsViewer({ findings, overallConfidence, regionsOfInterest }: FindingsViewerProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {/* Overall confidence */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4" />
              Overall Analysis Confidence
            </span>
            <span className={`text-lg font-bold ${overallConfidence >= 0.6 ? 'text-emerald-600' : overallConfidence >= 0.4 ? 'text-orange-600' : 'text-red-600'}`}>
              {(overallConfidence * 100).toFixed(0)}%
            </span>
          </div>
          <Progress value={overallConfidence * 100} className="h-2" />
          <p className="text-xs text-muted-foreground mt-1.5">
            {overallConfidence >= 0.7
              ? 'High confidence in analysis results. Clinician review still required.'
              : overallConfidence >= 0.4
              ? 'Moderate confidence. Some findings may require additional review.'
              : 'Low confidence. All findings should be verified by a radiologist.'}
          </p>
        </CardContent>
      </Card>

      {/* Regions of interest */}
      {regionsOfInterest.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Regions of Interest
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex flex-wrap gap-2">
              {regionsOfInterest.map((region, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {region}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Individual findings */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Activity className="h-4 w-4" />
          Individual Findings
          <span className="text-xs font-normal text-muted-foreground">({findings.length})</span>
        </h3>

        {findings.map((finding, index) => {
          const config = getSeverityConfig(finding.severity);
          const Icon = config.icon;
          const isExpanded = expanded === index;

          return (
            <Card key={index} className={`border ${config.bg} overflow-hidden`}>
              <button
                className="w-full text-left p-4 flex items-start gap-3"
                onClick={() => setExpanded(isExpanded ? null : index)}
              >
                <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] ${config.badge}`}>
                      {finding.severity?.toUpperCase() || 'NOTABLE'}
                    </Badge>
                    {finding.region && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {finding.region}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{finding.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">Confidence:</span>
                    <div className="flex-1 max-w-32">
                      <div className="h-1.5 bg-white/60 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${getConfidenceColor(finding.confidence)}`}
                          style={{ width: `${finding.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-medium">{(finding.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pl-12">
                  <p className="text-sm">{finding.description}</p>
                  {finding.region && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <strong>Anatomical Region:</strong> {finding.region}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    <strong>AI Confidence:</strong> {(finding.confidence * 100).toFixed(1)}% — This is a model confidence estimate, not a clinical certainty measure.
                  </p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
