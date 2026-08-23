import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prescriptions = await db.prescription.findMany({
      where: { caseId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json({ prescriptions });
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    return NextResponse.json({ error: 'Failed to fetch prescriptions' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { medications, source } = body;

    if (!medications || !Array.isArray(medications) || medications.length === 0) {
      return NextResponse.json({ error: 'No medications provided' }, { status: 400 });
    }

    const created = await db.prescription.createMany({
      data: medications.map((med: { name: string; dosage?: string; frequency?: string; notes?: string }) => ({
        caseId: id,
        medicationName: med.name,
        dosage: med.dosage || null,
        frequency: med.frequency || null,
        notes: med.notes || null,
        source: source || 'manual',
      })),
    });

    const allPrescriptions = await db.prescription.findMany({
      where: { caseId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ prescriptions: allPrescriptions, created: created.count }, { status: 201 });
  } catch (error) {
    console.error('Error adding prescriptions:', error);
    return NextResponse.json({ error: 'Failed to add prescriptions' }, { status: 500 });
  }
}
