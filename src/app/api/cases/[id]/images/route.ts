import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads');

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    // Verify case exists
    const medicalCase = await db.case.findUnique({ where: { id } });
    if (!medicalCase) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    const uploadedImages = [];

    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      // Generate unique filename
      const ext = path.extname(file.name) || '.jpg';
      const uniqueName = `${id}_${uuidv4()}${ext}`;
      const filePath = path.join(UPLOAD_DIR, uniqueName);

      fs.writeFileSync(filePath, buffer);

      const image = await db.imageUpload.create({
        data: {
          caseId: id,
          fileName: file.name,
          fileKey: uniqueName,
          mimeType: file.type || 'image/jpeg',
          fileSize: buffer.length,
        },
      });

      uploadedImages.push(image);
    }

    return NextResponse.json({ images: uploadedImages }, { status: 201 });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json({ error: 'Failed to upload images' }, { status: 500 });
  }
}
