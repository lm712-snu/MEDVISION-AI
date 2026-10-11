'use client';

import { Brain, MapPin, AlertTriangle, AlertOctagon, CheckCircle2, Activity, ChevronDown, ChevronUp, Target } from 'lucide-react';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { Finding } from '@/store/medical-store';

interface FindingsViewerProps {
  findings: Finding[];
  overallConfidence: number;
  regionsOfInterest: string[];
}

function getSeverityConfig(severity?: string) {
  switch (severity) {
    case 'normal': return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200', badge: 'bg-emerald-100 text-emerald-700' };
    case 'notable': return { icon: Activity, color: 'text-primary', bg: 'bg-primary/5 border-primary/20', badge: 'bg-primary/10 text-primary' };
    case 'concerning': return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700' };
    case 'urgent': return { icon: AlertOctagon, color: 'text-red-600', bg: 'bg-red-50 border-red-200', badge: 'bg-red-100 text-red-700' };
    default: return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border', badge: 'bg-muted text-muted-foreground' };
  }
}

function getConfidenceColor(c: number): string {
  if (c >= 0.8) return 'bg-emerald-500';
  if (c >= 0.6) return 'bg-primary';
  if (c >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

export function FindingsViewer({ findings, overallConfidence, regionsOfInterest }: FindingsViewerProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-4 warm-card-hover">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-sm font-medium flex items-center gap-2">
            <Brain className="h-4 w-4 text-primary" /> Overall confidence
          </span>
          <span className={`text-lg font-bold ${overallConfidence >= 0.6 ? 'text-emerald-600' : overallConfidence >= 0.4 ? 'text-amber-600' : 'text-red-600'}`}>
            {(overallConfidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 ${getConfidenceColor(overallConfidence)}`} style={{ width: `${overallConfidence * 100}%` }} />
        </div>
      </div>

      {regionsOfInterest.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-4 warm-card-hover">
          <h3 className="text-sm font-medium flex items-center gap-2 mb-2.5">
            <Target className="h-4 w-4 text-primary" /> Regions of interest
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {regionsOfInterest.map((r, i) => (
              <Badge key={i} variant="secondary" className="text-xs">{r}</Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h3 className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" /> Findings
          <span className="text-xs font-normal text-muted-foreground">({findings.length})</span>
        </h3>
        {findings.map((finding, index) => {
          const config = getSeverityConfig(finding.severity);
          const Icon = config.icon;
          const isExpanded = expanded === index;
          return (
            <div key={index} className={`rounded-xl border ${config.bg} overflow-hidden warm-card-hover`}>
              <button className="w-full text-left p-3.5 flex items-start gap-3" onClick={() => setExpanded(isExpanded ? null : index)}>
                <Icon className={`h-4.5 w-4.5 mt-0.5 flex-shrink-0 ${config.color}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] ${config.badge}`}>{finding.severity?.toUpperCase() || 'NOTABLE'}</Badge>
                    {finding.region && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{finding.region}</span>}
                  </div>
                  <p className="text-sm mt-1 line-clamp-2">{finding.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="flex-1 max-w-28 h-1.5 bg-white/60 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${getConfidenceColor(finding.confidence)}`} style={{ width: `${finding.confidence * 100}%` }} />
                    </div>
                    <span className="text-xs font-medium">{(finding.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 flex-shrink-0">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </button>
              {isExpanded && (
                <div className="px-3.5 pb-3.5 pl-12 text-sm text-muted-foreground space-y-1">
                  <p>{finding.description}</p>
                  {finding.region && <p><strong className="text-foreground/70">Region:</strong> {finding.region}</p>}
                  <p><strong className="text-foreground/70">Confidence:</strong> {(finding.confidence * 100).toFixed(1)}% — model estimate, not clinical certainty.</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
