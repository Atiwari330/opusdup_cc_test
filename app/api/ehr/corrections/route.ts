// API endpoint for creating analysis corrections and invalidating cache
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createAnalysisCorrection } from '@/lib/ehr/db-queries';
import { ehrCache } from '@/lib/ehr/cache';

const CorrectionSchema = z.object({
  clinicalNoteId: z.string().uuid().optional(),
  analysisResultId: z.string().uuid().optional(),
  transcriptId: z.string().uuid(), // For cache invalidation
  correctionType: z.enum(['section_edit', 'confidence_adjustment', 'code_change', 'risk_level_change', 'full_rewrite']),
  fieldName: z.string().optional(),
  originalValue: z.string(),
  correctedValue: z.string(),
  correctionNotes: z.string().optional(),
}).refine(
  (data) => data.clinicalNoteId || data.analysisResultId,
  {
    message: "Either clinicalNoteId or analysisResultId must be provided",
    path: ["clinicalNoteId", "analysisResultId"],
  }
);

export async function POST(request: Request) {
  try {
    // For testing, bypass authentication and get first user
    const { getFirstUser } = await import('@/lib/ehr/db-queries');
    const firstUser = await getFirstUser();
    
    if (!firstUser) {
      return NextResponse.json({ error: 'No users found' }, { status: 500 });
    }
    
    const userId = firstUser.id;

    // Parse request body
    const body = await request.json();
    const validatedData = CorrectionSchema.parse(body);

    // Create the correction record
    const correction = await createAnalysisCorrection({
      ...validatedData,
      correctedByProviderId: userId,
    });

    // Invalidate cache for this transcript since corrections were made
    await ehrCache.invalidateTranscriptCache(validatedData.transcriptId);

    return NextResponse.json({
      success: true,
      correction: {
        id: correction.id,
        correctionType: correction.correctionType,
        fieldName: correction.fieldName,
        createdAt: correction.createdAt,
      },
      message: 'Correction recorded and cache invalidated',
    });
  } catch (error) {
    console.error('Correction error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to record correction' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve corrections for a specific analysis
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const clinicalNoteId = searchParams.get('clinicalNoteId');
    const analysisResultId = searchParams.get('analysisResultId');

    if (!clinicalNoteId && !analysisResultId) {
      return NextResponse.json(
        { error: 'Either clinicalNoteId or analysisResultId query parameter is required' },
        { status: 400 }
      );
    }

    const { getCorrectionsByClinicalNoteId, getCorrectionsByAnalysisResultId } = await import('@/lib/ehr/db-queries');
    
    let corrections;
    if (clinicalNoteId) {
      corrections = await getCorrectionsByClinicalNoteId(clinicalNoteId);
    } else {
      corrections = await getCorrectionsByAnalysisResultId(analysisResultId!);
    }

    return NextResponse.json({
      corrections,
      count: corrections.length,
    });
  } catch (error) {
    console.error('Get corrections error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve corrections' },
      { status: 500 }
    );
  }
}