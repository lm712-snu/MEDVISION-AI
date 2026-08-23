import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const cases = await db.case.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        images: { select: { id: true, fileName: true, mimeType: true, createdAt: true } },
        prescriptions: { select: { id: true, medicationName: true, dosage: true, frequency: true } },
        analysis: true,
        report: { select: { id: true, clinicianSigned: true, createdAt: true } },
      },
    });
    return NextResponse.json({ cases });
  } catch (error) {
    console.error('Error listing cases:', error);
    return NextResponse.json({ error: 'Failed to list cases' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { patientName, patientId, scanType, bodyRegion, notes } = body;

    const newCase = await db.case.create({
      data: {
        patientName: patientName || null,
        patientId: patientId || null,
        scanType: scanType || 'MRI',
        bodyRegion: bodyRegion || null,
        notes: notes || null,
        status: 'draft',
      },
    });

    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}
