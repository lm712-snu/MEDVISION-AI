import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { signed } = body;

    const report = await db.report.findUnique({ where: { caseId: id } });
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    const updated = await db.report.update({
      where: { id: report.id },
      data: { clinicianSigned: signed !== false },
    });

    return NextResponse.json({ report: updated });
  } catch (error) {
    console.error('Error signing report:', error);
    return NextResponse.json({ error: 'Failed to update report' }, { status: 500 });
  }
}
