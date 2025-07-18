// API endpoint for analyzing transcripts
import { NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { getAnalyzer } from '@/lib/ehr/analyzers';
import {
  getSessionTranscriptById,
  updateSessionTranscriptStatus,
  createClinicalNote,
  createAnalysisResult,
} from '@/lib/ehr/db-queries';
import { z } from 'zod';
import { ehrCache } from '@/lib/ehr/cache';

const AnalyzeSchema = z.object({
  analysisTypes: z.array(z.enum(['soap_note', 'cpt_codes', 'icd_codes', 'risk_assessment']))
    .default(['soap_note']),
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    // For testing, bypass authentication and get first user
    const { getFirstUser } = await import('@/lib/ehr/db-queries');
    const firstUser = await getFirstUser();
    
    if (!firstUser) {
      return NextResponse.json({ error: 'No users found' }, { status: 500 });
    }
    
    const userId = firstUser.id;

    const { id: transcriptId } = await params;
    
    // Get transcript
    const transcript = await getSessionTranscriptById(transcriptId);
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }

    // For testing, skip access verification
    // if (transcript.providerId !== userId) {
    //   return NextResponse.json(
    //     { error: 'Access denied' },
    //     { status: 403 }
    //   );
    // }

    // Check if already processing or completed
    if (transcript.processingStatus === 'processing') {
      return NextResponse.json(
        { error: 'Transcript is already being processed' },
        { status: 409 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { analysisTypes } = AnalyzeSchema.parse(body);

    // Update status to processing
    await updateSessionTranscriptStatus(transcriptId, 'processing');

    try {
      const results: any[] = [];

      // Run each analyzer
      for (const analysisType of analysisTypes) {
        // Check cache first
        let result = await ehrCache.getCachedAnalysisResult(transcriptId, analysisType);
        
        if (!result) {
          // Cache miss - run analyzer
          const analyzer = getAnalyzer(analysisType);
          result = await analyzer.analyze(transcript.rawTranscriptText);
          
          // Cache the result (60 minute TTL)
          await ehrCache.cacheAnalysisResult(transcriptId, analysisType, result, 60);
        }

        // Store results based on type
        if (analysisType === 'soap_note') {
          // Store in ClinicalNote table
          const clinicalNote = await createClinicalNote({
            sessionTranscriptId: transcriptId,
            templateType: 'SOAP',
            sectionsData: result.sections,
            overallConfidence: result.overallConfidence.toString(),
            rawAiResponse: result.rawAiResponse,
          });

          results.push({
            type: 'soap_note',
            noteId: clinicalNote.id,
            ...result,
          });
        } else {
          // Store in AnalysisResult table (for future analyzer types)
          const analysisResult = await createAnalysisResult({
            sessionTranscriptId: transcriptId,
            analysisType: analysisType as any,
            result,
            confidence: result.confidence?.toString() || '0',
          });

          results.push({
            type: analysisType,
            analysisId: analysisResult.id,
            ...result,
          });
        }
      }

      // Update status to completed
      await updateSessionTranscriptStatus(transcriptId, 'completed');

      return NextResponse.json({
        success: true,
        transcriptId,
        results,
      });
    } catch (analysisError) {
      // Update status to failed
      await updateSessionTranscriptStatus(transcriptId, 'failed');
      throw analysisError;
    }
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}

// GET endpoint to retrieve analysis results
export async function GET(request: Request, { params }: RouteParams) {
  try {
    // For testing, bypass authentication and get first user
    const { getFirstUser } = await import('@/lib/ehr/db-queries');
    const firstUser = await getFirstUser();
    
    if (!firstUser) {
      return NextResponse.json({ error: 'No users found' }, { status: 500 });
    }
    
    const userId = firstUser.id;

    const { id: transcriptId } = await params;
    
    // Get transcript
    const transcript = await getSessionTranscriptById(transcriptId);
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript not found' },
        { status: 404 }
      );
    }
    // Skip access verification for testing
    // if (transcript.providerId !== userId) {
    //   return NextResponse.json(
    //     { error: 'Access denied' },
    //     { status: 403 }
    //   );
    // }

    // Get clinical note if exists
    const { getClinicalNoteByTranscriptId, getAnalysisResultsByTranscriptId } = await import('@/lib/ehr/db-queries');
    const clinicalNote = await getClinicalNoteByTranscriptId(transcriptId);
    const analysisResults = await getAnalysisResultsByTranscriptId(transcriptId);

    return NextResponse.json({
      transcript: {
        id: transcript.id,
        patientId: transcript.patientId,
        sessionDate: transcript.sessionDate,
        processingStatus: transcript.processingStatus,
      },
      clinicalNote,
      analysisResults,
    });
  } catch (error) {
    console.error('Get analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve analysis' },
      { status: 500 }
    );
  }
}