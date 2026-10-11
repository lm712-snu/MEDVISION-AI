'use client';

import { AlertTriangle, AlertOctagon, Brain } from 'lucide-react';

interface EscalationBannerProps { isUrgent: boolean; isOOD: boolean; reason: string | null; }

export function EscalationBanner({ isUrgent, isOOD, reason }: EscalationBannerProps) {
  if (!isUrgent && !isOOD) return null;
  return (
    <div className="space-y-2">
      {isOOD && (
        <div className="rounded-xl border border-violet-300 bg-violet-50 p-3.5 flex items-start gap-3">
          <Brain className="h-4 w-4 text-violet-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-violet-800">Out-of-distribution input</h4>
            <p className="text-xs text-violet-700/80 mt-0.5">These images may not be standard MRI scans. Manual radiologist review required.</p>
          </div>
        </div>
      )}
      {isUrgent && (
        <div className="rounded-xl border border-red-300 bg-red-50 p-3.5 flex items-start gap-3">
          <AlertOctagon className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-red-800">Flagged for immediate review</h4>
            <p className="text-xs text-red-700/80 mt-0.5">This case requires urgent clinician review.{reason && <span className="block mt-0.5 font-medium">{reason}</span>}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function LowConfidenceBanner({ confidence }: { confidence: number }) {
  if (confidence >= 0.4) return null;
  return (
    <div className="rounded-xl border border-amber-300 bg-amber-50 p-3.5 flex items-start gap-3">
      <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
      <div>
        <h4 className="text-sm font-semibold text-amber-800">Low confidence ({(confidence * 100).toFixed(0)}%)</h4>
        <p className="text-xs text-amber-700/80 mt-0.5">All findings should be verified by a radiologist.</p>
      </div>
    </div>
  );
}
