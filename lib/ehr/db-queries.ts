// Database queries for EHR functionality
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Create database connection (same as in lib/db/queries.ts)
const client = postgres(process.env.POSTGRES_URL!);
const db = drizzle(client);
import { 
  patient, 
  sessionTranscript, 
  clinicalNote, 
  analysisResult,
  analysisCorrection,
  user,
  type Patient,
  type SessionTranscript,
  type ClinicalNote,
  type AnalysisResult,
  type AnalysisCorrection,
  type User
} from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

// User queries
export async function getFirstUser(): Promise<User | null> {
  const result = await db
    .select()
    .from(user)
    .limit(1);
  
  return result[0] || null;
}

// Patient queries
export async function getPatientById(patientId: string): Promise<Patient | null> {
  const result = await db
    .select()
    .from(patient)
    .where(eq(patient.id, patientId))
    .limit(1);
  
  return result[0] || null;
}

export async function getPatientsByProviderId(providerId: string): Promise<Patient[]> {
  return await db
    .select()
    .from(patient)
    .where(eq(patient.userId, providerId))
    .orderBy(desc(patient.createdAt));
}

// Session transcript queries
export async function createSessionTranscript(data: {
  patientId: string;
  providerId: string;
  sessionDate: Date;
  originalPdfUrl?: string;
  rawTranscriptText: string;
}): Promise<SessionTranscript> {
  const result = await db
    .insert(sessionTranscript)
    .values({
      ...data,
      processingStatus: 'pending',
      createdAt: new Date(),
    })
    .returning();
  
  return result[0];
}

export async function updateSessionTranscriptStatus(
  transcriptId: string,
  status: SessionTranscript['processingStatus']
): Promise<void> {
  await db
    .update(sessionTranscript)
    .set({ processingStatus: status })
    .where(eq(sessionTranscript.id, transcriptId));
}

export async function getSessionTranscriptById(
  transcriptId: string
): Promise<SessionTranscript | null> {
  const result = await db
    .select()
    .from(sessionTranscript)
    .where(eq(sessionTranscript.id, transcriptId))
    .limit(1);
  
  return result[0] || null;
}

// Clinical note queries
export async function createClinicalNote(data: {
  sessionTranscriptId: string;
  templateType: string;
  sectionsData: any;
  overallConfidence: string;
  rawAiResponse?: string;
}): Promise<ClinicalNote> {
  const result = await db
    .insert(clinicalNote)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();
  
  return result[0];
}

export async function getClinicalNoteByTranscriptId(
  transcriptId: string
): Promise<ClinicalNote | null> {
  const result = await db
    .select()
    .from(clinicalNote)
    .where(eq(clinicalNote.sessionTranscriptId, transcriptId))
    .orderBy(desc(clinicalNote.createdAt))
    .limit(1);
  
  return result[0] || null;
}

// Analysis result queries (for future analyzers)
export async function createAnalysisResult(data: {
  sessionTranscriptId: string;
  analysisType: AnalysisResult['analysisType'];
  result: any;
  confidence: string;
}): Promise<AnalysisResult> {
  const result = await db
    .insert(analysisResult)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();
  
  return result[0];
}

export async function getAnalysisResultsByTranscriptId(
  transcriptId: string
): Promise<AnalysisResult[]> {
  return await db
    .select()
    .from(analysisResult)
    .where(eq(analysisResult.sessionTranscriptId, transcriptId))
    .orderBy(desc(analysisResult.createdAt));
}

// Analysis correction queries (for feedback capture)
export async function createAnalysisCorrection(data: {
  clinicalNoteId?: string;
  analysisResultId?: string;
  correctionType: AnalysisCorrection['correctionType'];
  fieldName?: string;
  originalValue: string;
  correctedValue: string;
  correctionNotes?: string;
  correctedByProviderId: string;
}): Promise<AnalysisCorrection> {
  const result = await db
    .insert(analysisCorrection)
    .values({
      ...data,
      createdAt: new Date(),
    })
    .returning();
  
  return result[0];
}

export async function getCorrectionsByClinicalNoteId(
  clinicalNoteId: string
): Promise<AnalysisCorrection[]> {
  return await db
    .select()
    .from(analysisCorrection)
    .where(eq(analysisCorrection.clinicalNoteId, clinicalNoteId))
    .orderBy(desc(analysisCorrection.createdAt));
}

export async function getCorrectionsByAnalysisResultId(
  analysisResultId: string
): Promise<AnalysisCorrection[]> {
  return await db
    .select()
    .from(analysisCorrection)
    .where(eq(analysisCorrection.analysisResultId, analysisResultId))
    .orderBy(desc(analysisCorrection.createdAt));
}