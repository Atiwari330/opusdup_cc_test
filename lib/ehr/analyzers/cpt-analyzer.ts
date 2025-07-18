// CPT code analyzer for mental health sessions
import { BaseAnalyzer } from './base-analyzer';
import type { AnalyzerConfig, TranscriptAnalysis } from '../types';

interface CPTResult {
  primaryCode: string;
  primaryCodeDescription: string;
  confidence: number;
  sessionType: 'individual' | 'group' | 'family' | 'unknown';
  sessionDuration: number; // in minutes
  alternativeCodes: Array<{
    code: string;
    description: string;
    confidence: number;
    reason: string;
  }>;
  disclaimerNote: string;
}

export class CPTAnalyzer extends BaseAnalyzer {
  config: AnalyzerConfig = {
    name: 'CPT Code Analysis',
    description: 'Analyzes therapy sessions to suggest appropriate CPT billing codes',
    version: '1.0.0',
  };

  // Limited set of common mental health CPT codes for demo
  private static readonly CPT_CODES = {
    '90834': {
      description: 'Psychotherapy, 45 minutes',
      duration: 45,
      sessionType: 'individual',
      keywords: ['individual', 'therapy', 'psychotherapy', '45 minutes', 'one-on-one'],
    },
    '90837': {
      description: 'Psychotherapy, 60 minutes',
      duration: 60,
      sessionType: 'individual',
      keywords: ['individual', 'therapy', 'psychotherapy', '60 minutes', 'hour', 'one-on-one'],
    },
    '90847': {
      description: 'Family psychotherapy (with patient present), 50 minutes',
      duration: 50,
      sessionType: 'family',
      keywords: ['family', 'family therapy', 'with patient', 'relatives', 'parents'],
    },
    '90853': {
      description: 'Group psychotherapy (other than multifamily)',
      duration: 50,
      sessionType: 'group',
      keywords: ['group', 'group therapy', 'multiple patients', 'participants'],
    },
    '90791': {
      description: 'Psychiatric diagnostic evaluation',
      duration: 60,
      sessionType: 'individual',
      keywords: ['initial', 'assessment', 'intake', 'diagnostic', 'evaluation', 'first session'],
    },
  };

  protected buildPrompt(transcript: string): string {
    return `You are a mental health billing specialist analyzing a therapy session transcript to determine the most appropriate CPT code.

Available CPT codes (LIMITED SET FOR DEMO):
- 90834: Psychotherapy, 45 minutes (individual)
- 90837: Psychotherapy, 60 minutes (individual)  
- 90847: Family psychotherapy (with patient present), 50 minutes
- 90853: Group psychotherapy (other than multifamily)
- 90791: Psychiatric diagnostic evaluation

CRITICAL INSTRUCTIONS:
1. Analyze ONLY the session type, duration, and participants
2. Choose the MOST APPROPRIATE single CPT code from the limited list above
3. Estimate session duration based on content depth and any time indicators
4. Identify if this is individual, family, group, or initial assessment
5. Provide confidence score (0.0-1.0) for your selection
6. List up to 2 alternative codes with reasons if applicable

TRANSCRIPT TO ANALYZE:
${transcript}

Respond in this EXACT JSON format:
{
  "primaryCode": "90834",
  "sessionType": "individual",
  "estimatedDuration": 45,
  "confidence": 0.85,
  "reasoning": "Clear individual therapy session with moderate depth suggesting 45-minute duration",
  "alternativeCodes": [
    {
      "code": "90837",
      "reason": "Could be 60-minute session if more extensive than apparent",
      "confidence": 0.65
    }
  ],
  "sessionIndicators": ["one-on-one conversation", "individual therapy format", "moderate session depth"]
}`;
  }

  protected parseResponse(aiResponse: string): CPTResult {
    try {
      const parsed = JSON.parse(aiResponse);
      
      const cptInfo = CPTAnalyzer.CPT_CODES[parsed.primaryCode as keyof typeof CPTAnalyzer.CPT_CODES];
      if (!cptInfo) {
        throw new Error(`Invalid CPT code: ${parsed.primaryCode}`);
      }

      return {
        primaryCode: parsed.primaryCode,
        primaryCodeDescription: cptInfo.description,
        confidence: parsed.confidence || 0,
        sessionType: parsed.sessionType || 'unknown',
        sessionDuration: parsed.estimatedDuration || cptInfo.duration,
        alternativeCodes: (parsed.alternativeCodes || []).map((alt: any) => ({
          code: alt.code,
          description: CPTAnalyzer.CPT_CODES[alt.code as keyof typeof CPTAnalyzer.CPT_CODES]?.description || 'Unknown code',
          confidence: alt.confidence || 0,
          reason: alt.reason || '',
        })),
        disclaimerNote: 'AI-generated CPT code suggestion. Limited to 5 common codes for demo. Requires professional verification before billing.',
      };
    } catch (error) {
      throw new Error(`Failed to parse CPT analysis response: ${error instanceof Error ? error.message : 'Invalid JSON'}`);
    }
  }

  protected calculateConfidence(result: CPTResult, aiResponse: string): number {
    let confidence = result.confidence;
    
    // Boost confidence for clear session type indicators
    if (result.sessionType !== 'unknown') {
      confidence += 0.1;
    }
    
    // Reduce confidence for vague duration estimates
    if (result.sessionDuration === 0) {
      confidence -= 0.2;
    }
    
    // Boost confidence if alternative codes are provided (shows AI consideration)
    if (result.alternativeCodes.length > 0) {
      confidence += 0.05;
    }
    
    // Cap at 0.9 due to limited code set
    return Math.min(confidence, 0.9);
  }
}