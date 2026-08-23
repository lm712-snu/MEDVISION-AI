'use client';

import { 
  Brain, MapPin, AlertTriangle, AlertOctagon, CheckCircle2, 
  Activity, ChevronDown, ChevronUp, Target
} from 'lucide-react';
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
    case 'normal':
      return { icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/8 border-emerald-500/20', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', glow: 'shadow-emerald-500/5' };
    case 'notable':
      return { icon: Activity, color: 'text-cyan-400', bg: 'bg-cyan-500/8 border-cyan-500/20', badge: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20', glow: '' };
    case 'concerning':
      return { icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/8 border-amber-500/20', badge: 'bg-amber-500/15 text-amber-400 border-amber-500/20', glow: 'shadow-amber-500/5' };
    case 'urgent':
      return { icon: AlertOctagon, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/25', badge: 'bg-red-500/15 text-red-400 border-red-500/25', glow: 'shadow-red-500/10' };
    default:
      return { icon: Activity, color: 'text-muted-foreground', bg: 'bg-muted/30 border-border/50', badge: 'bg-muted/50 text-muted-foreground border-border/50', glow: '' };
  }
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-emerald-500';
  if (confidence >= 0.6) return 'bg-cyan-500';
  if (confidence >= 0.4) return 'bg-amber-500';
  return 'bg-red-500';
}

export function FindingsViewer({ findings, overallConfidence, regionsOfInterest }: FindingsViewerProps) {
  const [expanded, setExpanded] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {/* Overall confidence meter */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary/15 flex items-center justify-center">
              <Brain className="h-3.5 w-3.5 text-primary" />
            </div>
            Overall Confidence
          </span>
          <span className={`text-2xl font-bold tabular-nums ${
            overallConfidence >= 0.6 ? 'text-emerald-400' : overallConfidence >= 0.4 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {(overallConfidence * 100).toFixed(0)}%
          </span>
        </div>
        <div className="h-2 rounded-full bg-muted/50 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${getConfidenceColor(overallConfidence)}`}
            style={{ width: `${overallConfidence * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {overallConfidence >= 0.7
            ? 'High confidence in analysis results. Clinician review still required.'
            : overallConfidence >= 0.4
            ? 'Moderate confidence. Some findings may require additional review.'
            : 'Low confidence. All findings should be verified by a radiologist.'}
        </p>
      </div>

      {/* Regions of interest */}
      {regionsOfInterest.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-semibold flex items-center gap-2 mb-3">
            <div className="h-7 w-7 rounded-lg bg-rose-500/15 flex items-center justify-center">
              <Target className="h-3.5 w-3.5 text-rose-400" />
            </div>
            Regions of Interest
          </h3>
          <div className="flex flex-wrap gap-2">
            {regionsOfInterest.map((region, i) => (
              <Badge key={i} variant="outline" className="text-xs border-primary/20 text-primary/80 bg-primary/5">
                <MapPin className="h-3 w-3 mr-1" />
                {region}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Individual findings */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-amber-500/15 flex items-center justify-center">
            <Activity className="h-3.5 w-3.5 text-amber-400" />
          </div>
          Findings
          <span className="text-xs font-normal text-muted-foreground bg-muted/30 px-2 py-0.5 rounded-full">{findings.length}</span>
        </h3>

        {findings.map((finding, index) => {
          const config = getSeverityConfig(finding.severity);
          const Icon = config.icon;
          const isExpanded = expanded === index;

          return (
            <div
              key={index}
              className={`rounded-xl border ${config.bg} overflow-hidden transition-all duration-300 hover:${config.glow} hover:shadow-lg`}
            >
              <button
                className="w-full text-left p-4 flex items-start gap-3"
                onClick={() => setExpanded(isExpanded ? null : index)}
              >
                <div className={`h-8 w-8 rounded-lg bg-background/30 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                  <Icon className={`h-4 w-4 ${config.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={`text-[10px] font-semibold ${config.badge} border`}>
                      {finding.severity?.toUpperCase() || 'NOTABLE'}
                    </Badge>
                    {finding.region && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" />
                        {finding.region}
                      </span>
                    )}
                  </div>
                  <p className="text-sm mt-1.5 line-clamp-2 text-foreground/90">{finding.description}</p>
                  <div className="flex items-center gap-2.5 mt-2.5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Confidence</span>
                    <div className="flex-1 max-w-36">
                      <div className="h-1.5 bg-background/30 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${getConfidenceColor(finding.confidence)}`}
                          style={{ width: `${finding.confidence * 100}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground/70">{(finding.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0 text-muted-foreground/50 mt-1">
                  {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </Button>
              </button>
              {isExpanded && (
                <div className="px-4 pb-4 pl-14 space-y-2">
                  <p className="text-sm text-foreground/85 leading-relaxed">{finding.description}</p>
                  {finding.region && (
                    <p className="text-xs text-muted-foreground">
                      <span className="font-medium text-foreground/60">Region:</span> {finding.region}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground/60">AI Confidence:</span> {(finding.confidence * 100).toFixed(1)}% — Model confidence estimate, not clinical certainty.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
