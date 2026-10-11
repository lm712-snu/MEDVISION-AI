import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';
import path from 'path';
import { checkInteractions, type Medication, type DrugInteraction } from './drug-interactions';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

export interface Finding {
  description: string;
  confidence: number; // 0-1
  region?: string;
  severity?: 'normal' | 'notable' | 'concerning' | 'urgent';
}

export interface AnalysisOutput {
  findings: Finding[];
  overallConfidence: number;
  regionsOfInterest: string[];
  rawAnalysis: string;
  prescriptionReview: string;
  drugInteractions: DrugInteraction[];
  escalationReason: string | null;
  isUrgent: boolean;
  isOOD: boolean; // out-of-distribution
}

// Step 1: Analyze MRI images using VLM
async function analyzeImages(imagePaths: string[]): Promise<{
  findings: Finding[];
  overallConfidence: number;
  regionsOfInterest: string[];
  rawAnalysis: string;
  isOOD: boolean;
}> {
  const zai = await ZAI.create();

  const imageContents = imagePaths.map((filePath) => {
    const fullPath = path.join(UPLOAD_DIR, filePath);
    const imageBuffer = fs.readFileSync(fullPath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(filePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' : 'image/jpeg';
    return {
      type: 'image_url' as const,
      image_url: { url: `data:${mimeType};base64,${base64Image}` },
    };
  });

  const systemPrompt = `You are a research-stage medical imaging AI assistant analyzing MRI scans. This is NOT a clinical diagnostic system.

CRITICAL RULES:
- You MUST include the disclaimer: "This analysis is from a research prototype and is NOT a medical diagnosis."
- Report confidence as a number between 0.0 and 1.0 for each finding
- If the image does not appear to be a medical MRI scan, or if you cannot confidently analyze it, set is_out_of_distribution to true
- Flag anything that looks potentially urgent (large masses, acute hemorrhage, severe edema) as severity "urgent"
- Be specific about anatomical regions
- Never state a definitive diagnosis; use language like "consistent with", "suggestive of", "may indicate"

Respond ONLY in valid JSON with this exact structure:
{
  "findings": [
    {
      "description": "Detailed description of the finding",
      "confidence": 0.85,
      "region": "Anatomical region (e.g., left frontal lobe, T2 vertebral body)",
      "severity": "normal|notable|concerning|urgent"
    }
  ],
  "overall_confidence": 0.78,
  "regions_of_interest": ["region1", "region2"],
  "is_out_of_distribution": false,
  "disclaimer": "This analysis is from a research prototype and is NOT a medical diagnosis."
}`;

  const userMessage = `Analyze these ${imagePaths.length} MRI scan image(s). Provide a detailed analysis with confidence scores for each finding. If the images are not recognizable as MRI scans, flag as out-of-distribution.`;

  const response = await zai.chat.completions.createVision({
    messages: [
      { role: 'assistant', content: systemPrompt },
      {
        role: 'user',
        content: [
          { type: 'text', text: userMessage },
          ...imageContents,
        ],
      },
    ],
    thinking: { type: 'disabled' },
  });

  const rawText = response.choices[0]?.message?.content || '';

  try {
    // Try to parse JSON from the response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        findings: (parsed.findings || []).map((f: any) => ({
          description: f.description || 'No description provided',
          confidence: typeof f.confidence === 'number' ? f.confidence : 0.5,
          region: f.region,
          severity: f.severity || 'notable',
        })),
        overallConfidence: typeof parsed.overall_confidence === 'number' ? parsed.overall_confidence : 0.5,
        regionsOfInterest: parsed.regions_of_interest || [],
        rawAnalysis: rawText,
        isOOD: parsed.is_out_of_distribution || false,
      };
    }
  } catch (e) {
    console.error('Failed to parse VLM analysis JSON:', e);
  }

  // Fallback if JSON parsing fails
  return {
    findings: [{
      description: rawText || 'Analysis completed but structured findings could not be extracted.',
      confidence: 0.3,
      severity: 'notable',
    }],
    overallConfidence: 0.3,
    regionsOfInterest: [],
    rawAnalysis: rawText,
    isOOD: false,
  };
}

// Step 2: Review prescriptions in context of imaging findings
async function reviewPrescriptions(
  medications: Medication[],
  findings: Finding[]
): Promise<{ review: string; interactions: DrugInteraction[]; escalationReason: string | null; isUrgent: boolean }> {
  const zai = await ZAI.create();

  const interactions = checkInteractions(medications);

  const medList = medications
    .map((m) => `${m.name}${m.dosage ? ` (${m.dosage})` : ''}${m.frequency ? ` - ${m.frequency}` : ''}`)
    .join('\n');

  const findingsSummary = findings
    .map((f) => `[${(f.confidence * 100).toFixed(0)}% confidence, ${f.severity}] ${f.description}${f.region ? ` (Region: ${f.region})` : ''}`)
    .join('\n');

  const systemPrompt = `You are a clinical pharmacy AI assistant in a research-stage medical imaging analysis system. This is NOT clinical decision support software.

Your task: Review the patient's current medications in light of MRI imaging findings and flag any relevant considerations.

CRITICAL RULES:
- Never recommend starting, stopping, or changing medications
- Never provide a diagnosis
- Flag medications that may be relevant to imaging findings (e.g., contrast agent considerations, medications affecting findings)
- Note any contraindications with imaging procedures
- Use cautious, non-prescriptive language
- Always include a disclaimer

Respond in JSON:
{
  "prescription_review": "Detailed review of medications in context of imaging findings",
  "relevant_considerations": ["consideration 1", "consideration 2"],
  "escalation_needed": false,
  "escalation_reason": null,
  "disclaimer": "This review is from a research prototype. Not clinical advice."
}`;

  const userMessage = `Patient's current medications:\n${medList || 'No medications listed'}\n\nImaging findings summary:\n${findingsSummary || 'No findings reported'}\n\nDrug interactions detected: ${interactions.length > 0 ? interactions.map((i) => `${i.drug1} + ${i.drug2} (${i.severity}): ${i.description}`).join('; ') : 'No known interactions detected in local reference database.'}\n\nPlease provide a comprehensive prescription review considering these imaging findings.`;

  const response = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
    thinking: { type: 'disabled' },
  });

  const rawText = response.choices[0]?.message?.content || '';
  let review = rawText;
  let escalationReason: string | null = null;
  let isUrgent = false;

  try {
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      review = parsed.prescription_review || rawText;
      escalationReason = parsed.escalation_reason || null;
      isUrgent = parsed.escalation_needed || false;
    }
  } catch (e) {
    console.error('Failed to parse prescription review JSON:', e);
  }

  // Check for urgent interactions
  const hasSevereInteraction = interactions.some(
    (i) => i.severity === 'severe' || i.severity === 'contraindicated'
  );
  if (hasSevereInteraction && !isUrgent) {
    isUrgent = true;
    escalationReason = escalationReason || 'Severe drug interaction(s) detected requiring clinical review.';
  }

  return { review, interactions, escalationReason, isUrgent };
}

// Step 3: Generate dual reports
export async function generateReports(
  findings: Finding[],
  prescriptionReview: string,
  drugInteractions: DrugInteraction[],
  medications: Medication[],
  bodyRegion?: string,
  scanType?: string
): Promise<{ clinicianReport: string; patientSummary: string }> {
  const zai = await ZAI.create();

  const findingsDetail = findings
    .map(
      (f) =>
        `- **[${f.severity?.toUpperCase()}]** [Confidence: ${(f.confidence * 100).toFixed(0)}%] ${f.description}${f.region ? ` — Region: ${f.region}` : ''}`
    )
    .join('\n');

  const interactionDetail =
    drugInteractions.length > 0
      ? drugInteractions
          .map(
            (i) =>
              `- **[${i.severity.toUpperCase()}]** ${i.drug1} + ${i.drug2}: ${i.description}\n  Mechanism: ${i.mechanism || 'N/A'}\n  Recommendation: ${i.recommendation || 'Clinical review recommended'}
`
          )
          .join('\n')
      : 'No drug interactions detected in local reference database.';

  const medList = medications.map((m) => `${m.name}${m.dosage ? ` ${m.dosage}` : ''}`).join(', ');

  // Generate clinician report
  const clinicianPrompt = `Generate a structured CLINICIAN-FACING radiology/imaging consultation report. This is a research prototype, NOT a certified medical device.

## Input Data
Scan Type: ${scanType || 'MRI'}
Body Region: ${bodyRegion || 'Not specified'}
Current Medications: ${medList || 'None listed'}

## Imaging Findings
${findingsDetail}

## Drug Interactions
${interactionDetail}

## Prescription Context Review
${prescriptionReview}

## Report Requirements
Generate a structured clinician report in Markdown with these sections:
1. **Header** - Case type, scan region, date
2. **Technique** - Brief note this was AI-assisted analysis
3. **Findings** - Each finding with confidence level and anatomical region
4. **Regions of Interest** - List specific regions requiring attention
5. **Prescription Considerations** - Relevant medication interactions or considerations
6. **Differential Considerations** - Possible explanations (non-diagnostic)
7. **Confidence Assessment** - Overall confidence and per-finding confidence
8. **Recommendations** - What a radiologist should focus on during manual review
9. **AI Disclaimer** - Clear statement this is research-stage, requires clinician verification

IMPORTANT: Use language like "AI analysis suggests", "The model identified", "Requires radiologist confirmation". Never present AI findings as definitive diagnoses.`;

  const clinicianResponse = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: 'You are a medical report generation AI for a research prototype. Generate structured, professional clinical reports. Always include appropriate disclaimers.' },
      { role: 'user', content: clinicianPrompt },
    ],
    thinking: { type: 'disabled' },
  });

  const clinicianReport = clinicianResponse.choices[0]?.message?.content || 'Report generation failed.';

  // Generate patient summary
  const patientPrompt = `Generate a PLAIN-LANGUAGE PATIENT-FACING summary based on these imaging analysis results. This is a research prototype.

## Input Data
Scan Type: ${scanType || 'MRI'}
Body Region: ${bodyRegion || 'Not specified'}

## Imaging Findings (technical)
${findingsDetail}

## Prescription Notes
${drugInteractions.length > 0 ? 'Some medication interactions were noted - these will be reviewed by your care team.' : 'No medication interactions were detected.'}

## Patient Summary Requirements
Write in simple, empathetic, non-technical language:
1. **What was analyzed** - Explain what the scan looked at in plain terms
2. **What the AI noticed** - Translate findings into everyday language. DO NOT diagnose.
3. **What this means** - Explain that findings need doctor review, not conclusions
4. **About your medications** - Note any interaction flags without alarming
5. **Important reminders** - What to discuss with their doctor, when to seek care
6. **Disclaimer** - PROMINENT: This is NOT a diagnosis. It's a summary of AI-assisted analysis for discussion with your healthcare provider.

CRITICAL: Never say "you have" any condition. Never recommend treatment. Never replace clinical judgment.
Use phrases like: "The analysis highlighted areas your doctor may want to review", "This is something to discuss with your care team".
Be warm and reassuring while being honest about uncertainty.`;

  const patientResponse = await zai.chat.completions.create({
    messages: [
      { role: 'assistant', content: 'You are a patient communication AI for a medical research prototype. Explain imaging findings in warm, clear, non-technical language. Always prioritize patient understanding and never provide diagnoses.' },
      { role: 'user', content: patientPrompt },
    ],
    thinking: { type: 'disabled' },
  });

  const patientSummary = patientResponse.choices[0]?.message?.content || 'Patient summary generation failed.';

  return { clinicianReport, patientSummary };
}

// Main orchestration pipeline
export async function runAnalysisPipeline(params: {
  caseId: string;
  imagePaths: string[];
  medications: Medication[];
  bodyRegion?: string;
  scanType?: string;
}): Promise<AnalysisOutput> {
  const { imagePaths, medications, bodyRegion, scanType } = params;

  if (imagePaths.length === 0) {
    throw new Error('At least one image is required for analysis.');
  }

  // Step 1: VLM Analysis of images
  const imageAnalysis = await analyzeImages(imagePaths);

  // Step 2: Prescription review and drug interaction check
  const prescriptionResult = await reviewPrescriptions(medications, imageAnalysis.findings);

  // Determine escalation
  const hasUrgentFinding = imageAnalysis.findings.some((f) => f.severity === 'urgent');
  const lowConfidence = imageAnalysis.overallConfidence < 0.4;
  const isUrgent = hasUrgentFinding || prescriptionResult.isUrgent;
  const isOOD = imageAnalysis.isOOD;

  let escalationReason: string | null = prescriptionResult.escalationReason;
  const escalationReasons: string[] = [];
  if (isOOD) escalationReasons.push('Input may be out-of-distribution (not recognizable as MRI or unusual presentation).');
  if (hasUrgentFinding) escalationReasons.push('One or more urgent findings detected requiring immediate radiologist review.');
  if (lowConfidence) escalationReasons.push('Overall analysis confidence is below threshold — human review recommended.');
  if (prescriptionResult.escalationReason) escalationReasons.push(prescriptionResult.escalationReason);
  if (escalationReasons.length > 0) {
    escalationReason = escalationReasons.join(' ');
  }

  return {
    findings: imageAnalysis.findings,
    overallConfidence: imageAnalysis.overallConfidence,
    regionsOfInterest: imageAnalysis.regionsOfInterest,
    rawAnalysis: imageAnalysis.rawAnalysis,
    prescriptionReview: prescriptionResult.review,
    drugInteractions: prescriptionResult.interactions,
    escalationReason,
    isUrgent,
    isOOD,
  };
}
