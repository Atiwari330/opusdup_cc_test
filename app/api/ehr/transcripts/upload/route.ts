// API endpoint for uploading PDF transcripts
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { auth } from '@/app/(auth)/auth';
import { PDFProcessor } from '@/lib/ehr/pdf-processor';
import { createSessionTranscript, getPatientById } from '@/lib/ehr/db-queries';
import { z } from 'zod';

const UploadSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  sessionDate: z.string().datetime('Invalid session date'),
});

export async function POST(request: Request) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const sessionDate = formData.get('sessionDate') as string;

    // Validate input
    if (!file || file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Please provide a valid PDF file' },
        { status: 400 }
      );
    }

    const validationResult = UploadSchema.safeParse({ patientId, sessionDate });
    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    // Verify patient exists and belongs to this provider
    const patient = await getPatientById(patientId);
    if (!patient || patient.userId !== session.user.id) {
      return NextResponse.json(
        { error: 'Patient not found or access denied' },
        { status: 404 }
      );
    }

    // Process PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdfResult = await PDFProcessor.extractText(buffer);
    
    // Validate transcript content
    const validation = PDFProcessor.validateTranscript(pdfResult.text);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }

    // Upload to blob storage (optional - can skip for POC)
    let blobUrl: string | undefined;
    try {
      const timestamp = Date.now();
      const filename = `transcripts/${session.user.id}/${patientId}/${timestamp}.pdf`;
      const blob = await put(filename, buffer, {
        access: 'private',
        addRandomSuffix: false,
      });
      blobUrl = blob.url;
    } catch (error) {
      console.warn('Blob storage upload failed, continuing without storage URL:', error);
    }

    // Create session transcript record
    const transcript = await createSessionTranscript({
      patientId,
      providerId: session.user.id,
      sessionDate: new Date(sessionDate),
      originalPdfUrl: blobUrl,
      rawTranscriptText: pdfResult.text,
    });

    return NextResponse.json({
      success: true,
      transcript: {
        id: transcript.id,
        patientId: transcript.patientId,
        sessionDate: transcript.sessionDate,
        processingStatus: transcript.processingStatus,
        pageCount: pdfResult.pageCount,
        textLength: pdfResult.text.length,
      },
    });
  } catch (error) {
    console.error('PDF upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}