// Test API endpoint for uploading PDF transcripts (no auth for testing)
import { NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { PDFProcessor } from '@/lib/ehr/pdf-processor';
import { createSessionTranscript, getPatientById } from '@/lib/ehr/db-queries';
import { z } from 'zod';

const UploadSchema = z.object({
  patientId: z.string().uuid('Invalid patient ID'),
  sessionDate: z.string().datetime('Invalid session date'),
});

export async function POST(request: Request) {
  try {
    console.log('EHR Upload endpoint called');

    // For testing, we'll use a hardcoded user ID (you can get this from your database)
    const TEST_USER_ID = '99f7c236-be47-437e-87e9-b3d2ff574c34'; // Replace with actual user ID
    
    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const patientId = formData.get('patientId') as string;
    const sessionDate = formData.get('sessionDate') as string;

    console.log('Received data:', { 
      fileSize: file?.size, 
      fileName: file?.name, 
      patientId, 
      sessionDate 
    });

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

    // Verify patient exists
    const patient = await getPatientById(patientId);
    if (!patient) {
      return NextResponse.json(
        { error: 'Patient not found' },
        { status: 404 }
      );
    }

    console.log('Patient found:', patient.firstName, patient.lastName);

    // Process PDF
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const pdfResult = await PDFProcessor.extractText(buffer);
    console.log('PDF processed:', pdfResult.pageCount, 'pages,', pdfResult.text.length, 'characters');
    
    // Validate transcript content
    const validation = PDFProcessor.validateTranscript(pdfResult.text);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.reason },
        { status: 400 }
      );
    }

    // Upload to blob storage (optional - can skip for testing)
    let blobUrl: string | undefined;
    try {
      const timestamp = Date.now();
      const filename = `transcripts/${TEST_USER_ID}/${patientId}/${timestamp}.pdf`;
      const blob = await put(filename, buffer, {
        access: 'private',
        addRandomSuffix: false,
      });
      blobUrl = blob.url;
      console.log('Blob uploaded:', blobUrl);
    } catch (error) {
      console.warn('Blob storage upload failed, continuing without storage URL:', error);
    }

    // Create session transcript record
    const transcript = await createSessionTranscript({
      patientId,
      providerId: TEST_USER_ID,
      sessionDate: new Date(sessionDate),
      originalPdfUrl: blobUrl,
      rawTranscriptText: pdfResult.text,
    });

    console.log('Transcript created:', transcript.id);

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