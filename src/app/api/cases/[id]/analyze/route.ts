import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { runAnalysisPipeline, generateReports } from '@/lib/analysis-pipeline';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Fetch case with all related data
    const medicalCase = await db.case.findUnique({
      where: { id },
      include: { images: true, prescriptions: true, analysis: true, report: true },
    });

    if (!medicalCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    if (medicalCase.images.length === 0) {
      return NextResponse.json({ error: 'At least one MRI image is required for analysis' }, { status: 400 });
    }

    // Update status to analyzing
    await db.case.update({
      where: { id },
      data: { status: 'analyzing' },
    });

    // Prepare data for pipeline
    const imagePaths = medicalCase.images.map((img) => img.fileKey);
    const medications = medicalCase.prescriptions.map((p) => ({
      name: p.medicationName,
      dosage: p.dosage || undefined,
      frequency: p.frequency || undefined,
    }));

    // Run the analysis pipeline
    const analysisResult = await runAnalysisPipeline({
      caseId: id,
      imagePaths,
      medications,
      bodyRegion: medicalCase.bodyRegion || undefined,
      scanType: medicalCase.scanType || undefined,
    });

    // Save or update analysis result
    const existingAnalysis = medicalCase.analysis;
    if (existingAnalysis) {
      await db.analysisResult.update({
        where: { id: existingAnalysis.id },
        data: {
          findings: JSON.stringify(analysisResult.findings),
          regionsOfInterest: JSON.stringify(analysisResult.regionsOfInterest),
          overallConfidence: analysisResult.overallConfidence,
          rawAnalysis: analysisResult.rawAnalysis,
          prescriptionReview: analysisResult.prescriptionReview,
          drugInteractions: JSON.stringify(analysisResult.drugInteractions),
          escalationReason: analysisResult.escalationReason,
        },
      });
    } else {
      await db.analysisResult.create({
        data: {
          caseId: id,
          findings: JSON.stringify(analysisResult.findings),
          regionsOfInterest: JSON.stringify(analysisResult.regionsOfInterest),
          overallConfidence: analysisResult.overallConfidence,
          rawAnalysis: analysisResult.rawAnalysis,
          prescriptionReview: analysisResult.prescriptionReview,
          drugInteractions: JSON.stringify(analysisResult.drugInteractions),
          escalationReason: analysisResult.escalationReason,
        },
      });
    }

    // Generate reports
    const reports = await generateReports(
      analysisResult.findings,
      analysisResult.prescriptionReview,
      analysisResult.drugInteractions,
      medications,
      medicalCase.bodyRegion || undefined,
      medicalCase.scanType || undefined
    );

    // Save or update report
    const existingReport = medicalCase.report;
    if (existingReport) {
      await db.report.update({
        where: { id: existingReport.id },
        data: {
          clinicianReport: reports.clinicianReport,
          patientSummary: reports.patientSummary,
          clinicianSigned: false,
        },
      });
    } else {
      await db.report.create({
        data: {
          caseId: id,
          clinicianReport: reports.clinicianReport,
          patientSummary: reports.patientSummary,
        },
      });
    }

    // Update case status
    const finalStatus = analysisResult.isUrgent || analysisResult.isOOD ? 'escalated' : 'completed';
    await db.case.update({
      where: { id },
      data: {
        status: finalStatus,
        urgencyFlag: analysisResult.isUrgent,
        oodFlag: analysisResult.isOOD,
      },
    });

    return NextResponse.json({
      success: true,
      status: finalStatus,
      analysis: {
        findings: analysisResult.findings,
        overallConfidence: analysisResult.overallConfidence,
        regionsOfInterest: analysisResult.regionsOfInterest,
        prescriptionReview: analysisResult.prescriptionReview,
        drugInteractions: analysisResult.drugInteractions,
        escalationReason: analysisResult.escalationReason,
        isUrgent: analysisResult.isUrgent,
        isOOD: analysisResult.isOOD,
      },
      reports,
    });
  } catch (error: any) {
    console.error('Error running analysis:', error);

    // Reset case status on error
    try {
      await db.case.update({
        where: { id: (await params).id },
        data: { status: 'draft' },
      });
    } catch {}

    return NextResponse.json(
      { error: 'Analysis failed', details: error.message },
      { status: 500 }
    );
  }
}
