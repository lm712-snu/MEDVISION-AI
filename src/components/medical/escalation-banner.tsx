'use client';

import { AlertTriangle, AlertOctagon, Brain } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
        <Alert className="border-violet-400 bg-violet-50 text-violet-900 animate-pulse">
          <Brain className="h-4 w-4" />
          <AlertTitle className="font-semibold">Out-of-Distribution Input Detected</AlertTitle>
          <AlertDescription className="text-sm">
            The uploaded images may not be recognizable as standard MRI scans, or may represent an
            unusual presentation not well-covered by this model&apos;s training data. Manual radiologist
            review is required.
          </AlertDescription>
        </Alert>
      )}
      {isUrgent && (
        <Alert className="border-red-500 bg-red-50 text-red-900">
          <AlertOctagon className="h-4 w-4" />
          <AlertTitle className="font-semibold">Urgent — Flagged for Immediate Review</AlertTitle>
          <AlertDescription className="text-sm">
            This case has been automatically escalated for urgent clinician review.
            {reason && (
              <span className="block mt-1 font-medium">Reason: {reason}</span>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

export function LowConfidenceBanner({ confidence }: { confidence: number }) {
  if (confidence >= 0.4) return null;
  return (
    <Alert className="border-orange-400 bg-orange-50 text-orange-900">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle className="font-semibold">Low Analysis Confidence ({(confidence * 100).toFixed(0)}%)</AlertTitle>
      <AlertDescription className="text-sm">
        The overall confidence of this analysis is below the 40% threshold. This case has been flagged
        for mandatory human review. Do not act on these findings without clinician verification.
      </AlertDescription>
    </Alert>
  );
}
