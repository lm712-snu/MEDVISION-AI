'use client';

import { AlertTriangle, ShieldCheck, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ResearchDisclaimer() {
  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-900">
      <ShieldCheck className="h-4 w-4 text-amber-600" />
      <AlertTitle className="font-semibold">Research Prototype — Not a Medical Device</AlertTitle>
      <AlertDescription className="text-sm">
        This is a <strong>research-stage prototype</strong> for multimodal medical AI analysis. It is{' '}
        <strong>not</strong> a certified medical device, diagnostic tool, or clinical decision support system.
        No output from this system should be used for clinical decision-making without verification by a
        qualified healthcare professional.
      </AlertDescription>
    </Alert>
  );
}

export function NotADiagnosisDisclaimer() {
  return (
    <Alert className="border-red-300 bg-red-50 text-red-900">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertTitle className="font-semibold">Not a Diagnosis — Not Medical Advice</AlertTitle>
      <AlertDescription className="text-sm">
        The analysis and summaries produced by this system are <strong>not diagnoses</strong> and do not
        constitute medical advice. All findings require review and sign-off by a licensed clinician before
        being shared with patients. Patients should always consult their doctor or radiologist for
        interpretation of imaging studies.
      </AlertDescription>
    </Alert>
  );
}

export function PatientExpectationsDisclaimer() {
  return (
    <Alert className="border-emerald-300 bg-emerald-50 text-emerald-900">
      <Info className="h-4 w-4 text-emerald-600" />
      <AlertTitle className="font-semibold">What You Can Expect</AlertTitle>
      <AlertDescription className="text-sm">
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>A plain-language walkthrough of a clinician-reviewed report</li>
          <li>Help understanding medical terminology</li>
          <li>Medication interaction flags for discussion with your care team</li>
          <li>Guidance on when to seek care</li>
        </ul>
        <div className="mt-2 font-medium">What You Should NOT Expect:</div>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>A definitive diagnosis</li>
          <li>Treatment decisions or recommendations</li>
          <li>Emergency care — if you have a medical emergency, call 911</li>
          <li>A substitute for your doctor or radiologist</li>
        </ul>
      </AlertDescription>
    </Alert>
  );
}
