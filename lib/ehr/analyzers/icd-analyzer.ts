// ICD-10 code analyzer for mental health diagnoses
import { BaseAnalyzer } from './base-analyzer';
import type { AnalyzerConfig, TranscriptAnalysis } from '../types';

interface ICDResult {
  primaryDiagnosis: {
    code: string;
    description: string;
    confidence: number;
  };
  secondaryDiagnoses: Array<{
    code: string;
    description: string;
    confidence: number;
    reasoning: string;
  }>;
  riskFactors: string[];
  disclaimerNote: string;
  diagnosticEvidence: string[];
}

export class ICDAnalyzer extends BaseAnalyzer {
  config: AnalyzerConfig = {
    name: 'ICD-10 Code Analysis',
    description: 'Analyzes therapy sessions to suggest appropriate ICD-10 diagnosis codes',
    version: '1.0.0',
  };

  // Limited set of common mental health ICD-10 codes for demo
  private static readonly ICD_CODES = {
    'F32.0': 'Major depressive disorder, single episode, mild',
    'F32.1': 'Major depressive disorder, single episode, moderate',
    'F32.2': 'Major depressive disorder, single episode, severe without psychotic features',
    'F33.0': 'Major depressive disorder, recurrent, mild',
    'F33.1': 'Major depressive disorder, recurrent, moderate',
    'F33.2': 'Major depressive disorder, recurrent severe without psychotic features',
    'F41.0': 'Panic disorder [episodic paroxysmal anxiety]',
    'F41.1': 'Generalized anxiety disorder',
    'F41.2': 'Mixed anxiety and depressive disorder',
    'F41.9': 'Anxiety disorder, unspecified',
    'F43.10': 'Post-traumatic stress disorder, unspecified',
    'F43.12': 'Post-traumatic stress disorder, chronic',
    'F43.20': 'Adjustment disorders, unspecified',
    'F43.21': 'Adjustment disorder with depressed mood',
    'F43.22': 'Adjustment disorder with anxiety',
  };

  protected buildPrompt(transcript: string): string {
    const codeList = Object.entries(ICDAnalyzer.ICD_CODES)
      .map(([code, desc]) => `- ${code}: ${desc}`)
      .join('\n');

    return `You are a licensed mental health professional analyzing a therapy session transcript to suggest appropriate ICD-10 diagnosis codes.

AVAILABLE ICD-10 CODES (LIMITED SET FOR DEMO):
${codeList}

CRITICAL INSTRUCTIONS:
1. Analyze symptoms, mood patterns, and clinical presentation described in the transcript
2. Select ONE primary diagnosis code from the limited list above
3. Identify up to 3 secondary/comorbid diagnoses if clearly supported by evidence
4. Provide confidence scores (0.0-1.0) based on symptom clarity and diagnostic criteria
5. List specific evidence from transcript supporting each diagnosis
6. Note any risk factors mentioned
7. Be conservative - only suggest diagnoses with clear evidence

TRANSCRIPT TO ANALYZE:
${transcript}

Respond in this EXACT JSON format:
{
  "primaryDiagnosis": {
    "code": "F33.1",
    "confidence": 0.75,
    "reasoning": "Clear evidence of recurrent depressive episodes with moderate severity"
  },
  "secondaryDiagnoses": [
    {
      "code": "F41.1",
      "confidence": 0.60,
      "reasoning": "Patient reports persistent worry and anxiety symptoms"
    }
  ],
  "diagnosticEvidence": [
    "Patient reports feeling depressed for several weeks",
    "Mentions previous depressive episodes",
    "Sleep disturbances and appetite changes noted"
  ],
  "riskFactors": [
    "Social isolation",
    "Recent life stressor"
  ],
  "severityAssessment": "moderate",
  "recommendedFollowUp": "Continue individual therapy, consider psychiatric evaluation"
}`;
  }

  protected parseResponse(aiResponse: string): ICDResult {
    try {
      const parsed = JSON.parse(aiResponse);
      
      // Validate primary diagnosis code
      const primaryCode = parsed.primaryDiagnosis?.code;
      if (!primaryCode || !ICDAnalyzer.ICD_CODES[primaryCode as keyof typeof ICDAnalyzer.ICD_CODES]) {
        throw new Error(`Invalid primary ICD-10 code: ${primaryCode}`);
      }

      // Validate secondary diagnosis codes
      const validSecondaryDiagnoses = (parsed.secondaryDiagnoses || [])
        .filter((diag: any) => ICDAnalyzer.ICD_CODES[diag.code as keyof typeof ICDAnalyzer.ICD_CODES])
        .map((diag: any) => ({
          code: diag.code,
          description: ICDAnalyzer.ICD_CODES[diag.code as keyof typeof ICDAnalyzer.ICD_CODES],
          confidence: diag.confidence || 0,
          reasoning: diag.reasoning || '',
        }));

      return {
        primaryDiagnosis: {
          code: primaryCode,
          description: ICDAnalyzer.ICD_CODES[primaryCode as keyof typeof ICDAnalyzer.ICD_CODES],
          confidence: parsed.primaryDiagnosis.confidence || 0,
        },
        secondaryDiagnoses: validSecondaryDiagnoses,
        riskFactors: parsed.riskFactors || [],
        diagnosticEvidence: parsed.diagnosticEvidence || [],
        disclaimerNote: 'AI-generated ICD-10 diagnosis suggestions. Limited to 15 common codes for demo. Professional clinical judgment required. Not for billing or treatment decisions.',
      };
    } catch (error) {
      throw new Error(`Failed to parse ICD-10 analysis response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  protected calculateConfidence(result: ICDResult, aiResponse: string): number {
    let confidence = result.primaryDiagnosis.confidence;
    
    // Boost confidence if diagnostic evidence is provided
    if (result.diagnosticEvidence.length >= 3) {
      confidence += 0.1;
    }
    
    // Reduce confidence if too many secondary diagnoses (suggests uncertainty)
    if (result.secondaryDiagnoses.length > 2) {
      confidence -= 0.1;
    }
    
    // Boost confidence if risk factors are identified
    if (result.riskFactors.length > 0) {
      confidence += 0.05;
    }
    
    // Cap at 0.85 due to limited code set and nature of transcript-based diagnosis
    return Math.min(confidence, 0.85);
  }
}