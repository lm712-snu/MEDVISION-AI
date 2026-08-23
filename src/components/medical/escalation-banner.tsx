'use client';

import { AlertTriangle, AlertOctagon, Brain } from 'lucide-react';

interface EscalationBannerProps {
  isUrgent: boolean;
  isOOD: boolean;
  reason: string | null;
}

export function EscalationBanner({ isUrgent, isOOD, reason }: EscalationBannerProps) {
  if (!isUrgent && !isOOD) return null;

  return (
    <div className="space-y-3">
      {isOOD && (
        <div className="rounded-xl border border-violet-500/30 bg-violet-500/8 p-4 pulse-glow">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-violet-500/20 flex items-center justify-center flex-shrink-0">
              <Brain className="h-4 w-4 text-violet-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-violet-300">Out-of-Distribution Input</h4>
              <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                The uploaded images may not be recognizable as standard MRI scans, or represent an
                unusual presentation. Manual radiologist review is required.
              </p>
            </div>
          </div>
        </div>
      )}
      {isUrgent && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-4">
          <div className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertOctagon className="h-4 w-4 text-red-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-red-400">Flagged for Immediate Review</h4>
              <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                This case has been escalated for urgent clinician review.
                {reason && <span className="block mt-1 font-medium text-red-400/80">{reason}</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function LowConfidenceBanner({ confidence }: { confidence: number }) {
  if (confidence >= 0.4) return null;
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-4">
      <div className="flex items-start gap-3">
        <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-amber-400">
            Low Confidence ({(confidence * 100).toFixed(0)}%)
          </h4>
          <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
            Analysis confidence is below threshold. All findings should be verified by a radiologist.
          </p>
        </div>
      </div>
    </div>
  );
}
