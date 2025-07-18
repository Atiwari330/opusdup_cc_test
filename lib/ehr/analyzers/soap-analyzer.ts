// SOAP Note Analyzer
import { BaseAnalyzer } from './base-analyzer';
import type { SOAPSection, ClinicalNoteResult, AnalysisResult, AnalyzerConfig } from '../types';

export class SOAPAnalyzer extends BaseAnalyzer {
  config: AnalyzerConfig = {
    name: 'SOAP Note Analysis',
    description: 'Generates structured SOAP notes from therapy session transcripts',
    version: '1.1.0',
  };

  protected buildPrompt(transcript: string): string {
    return `You are a licensed mental health professional creating a clinical SOAP note from a therapy session transcript.

CRITICAL INSTRUCTIONS:
1. Extract information ONLY from content explicitly stated in the transcript
2. Do NOT add assumptions, clinical interpretations, or external knowledge
3. Maintain professional, clinical language appropriate for medical records
4. For each section, provide a confidence score (0.0-1.0) based on available information clarity
5. If insufficient information exists for a section, state this clearly and provide low confidence

SOAP SECTION GUIDELINES:

SUBJECTIVE (Patient's voice):
- Direct quotes of patient's reported symptoms, concerns, feelings
- Patient's description of their mental/emotional state
- Historical information provided by patient
- Patient's goals and expectations

OBJECTIVE (Clinical observations):
- Therapist's direct observations of patient behavior
- Mental status examination findings (appearance, speech, mood, affect, thought process)
- Observable interactions and responses during session
- Any measurable or quantifiable data

ASSESSMENT (Clinical formulation):
- Clinical impressions based on subjective and objective data
- Summary of patient's current mental health status
- Progress notes from previous sessions if mentioned
- Risk factors or protective factors observed
- Functional assessment if applicable

PLAN (Treatment direction):
- Specific therapeutic interventions discussed or planned
- Homework assignments or between-session tasks
- Follow-up plans and next session goals
- Referrals or additional resources mentioned
- Safety planning if applicable

FORMAT REQUIREMENT - Use this EXACT structure:

## SUBJECTIVE
[Clinical content based strictly on transcript]
Confidence: [0.0-1.0]

## OBJECTIVE
[Clinical observations from transcript]
Confidence: [0.0-1.0]

## ASSESSMENT
[Clinical formulation from available data]
Confidence: [0.0-1.0]

## PLAN
[Treatment plans mentioned in session]
Confidence: [0.0-1.0]

TRANSCRIPT TO ANALYZE:
${transcript}`;
  }

  protected parseResponse(aiResponse: string): ClinicalNoteResult {
    try {
      const sections: SOAPSection = {
        subjective: this.extractSection(aiResponse, 'SUBJECTIVE'),
        objective: this.extractSection(aiResponse, 'OBJECTIVE'),
        assessment: this.extractSection(aiResponse, 'ASSESSMENT'),
        plan: this.extractSection(aiResponse, 'PLAN'),
      };

      // Validate that at least some sections have content
      const sectionsWithContent = Object.values(sections).filter(
        section => section.content && section.content !== 'Section not found' && section.confidence > 0
      );

      if (sectionsWithContent.length === 0) {
        throw new Error('No valid SOAP sections could be extracted from the transcript');
      }

      const overallConfidence = this.calculateOverallConfidence(sections);

      return {
        sections,
        overallConfidence,
        templateType: 'SOAP',
        rawAiResponse: aiResponse,
        disclaimerNote: 'AI-generated SOAP note based on transcript analysis. Requires professional clinical review and validation before use in patient records.',
        generatedAt: new Date().toISOString(),
        qualityMetrics: {
          sectionsCompleted: sectionsWithContent.length,
          averageConfidence: overallConfidence,
          hasLowConfidenceSections: Object.values(sections).some(s => s.confidence < 0.5),
        },
      };
    } catch (error) {
      throw new Error(`Failed to parse SOAP note response: ${error instanceof Error ? error.message : 'Invalid format'}`);
    }
  }

  private extractSection(text: string, sectionName: string): AnalysisResult {
    // Enhanced regex pattern to match section content and confidence
    const sectionPattern = new RegExp(
      `## ${sectionName}\\s*([\\s\\S]*?)(?:Confidence:\\s*(\\d*\\.?\\d+)|(?=## [A-Z]+)|$)`,
      'i'
    );
    
    const match = text.match(sectionPattern);
    
    if (!match) {
      return {
        content: `${sectionName} section not found in response`,
        confidence: 0,
        status: 'failed',
        errors: ['Section header not detected in AI response'],
      };
    }

    let content = match[1].trim();
    const confidenceStr = match[2];
    let confidence = confidenceStr ? parseFloat(confidenceStr) : 0.3;

    // Clean up content by removing confidence line if it appears in content
    content = content.replace(/\s*Confidence:\s*\d*\.?\d+\s*$/i, '').trim();

    // Validate confidence range
    confidence = Math.max(0, Math.min(1, confidence));

    // Enhanced content validation
    const isEmpty = !content || content.length < 10;
    const hasInsufficientInfo = content.toLowerCase().includes('insufficient information') ||
                                content.toLowerCase().includes('not available') ||
                                content.toLowerCase().includes('not provided');
    
    // Determine status with enhanced logic
    let status: AnalysisResult['status'] = 'success';
    const errors: string[] = [];

    if (isEmpty) {
      status = 'failed';
      errors.push('Section content is empty or too brief');
      confidence = 0;
    } else if (hasInsufficientInfo || confidence < 0.4) {
      status = 'low_confidence';
      if (hasInsufficientInfo) errors.push('AI indicated insufficient information');
      if (confidence < 0.4) errors.push('Low confidence score from AI analysis');
    } else if (confidence < 0.7) {
      status = 'moderate_confidence';
    }

    // Boost confidence for well-structured content
    if (content.length > 50 && !hasInsufficientInfo && status === 'success') {
      confidence = Math.min(1, confidence + 0.1);
    }

    return {
      content: content || `No ${sectionName.toLowerCase()} information available in transcript`,
      confidence,
      status,
      errors: errors.length > 0 ? errors : undefined,
      wordCount: content.split(/\s+/).length,
    };
  }

  protected calculateConfidence(result: any, aiResponse: string): number {
    // This method is required by base class but not used in our implementation
    return 0;
  }

  private calculateOverallConfidence(sections: SOAPSection): number {
    // Enhanced confidence calculation with dynamic weighting
    const baseWeights = {
      subjective: 0.3,   // Patient voice is crucial
      objective: 0.25,   // Clinical observations
      assessment: 0.25,  // Clinical formulation
      plan: 0.2,         // Treatment direction
    };

    let totalConfidence = 0;
    let totalWeight = 0;
    let sectionsWithContent = 0;

    // Calculate weighted average with adjustments
    Object.entries(baseWeights).forEach(([section, weight]) => {
      const sectionKey = section as keyof SOAPSection;
      const sectionData = sections[sectionKey];
      const sectionConfidence = sectionData.confidence;
      
      if (sectionConfidence > 0) {
        // Boost weight for high-quality sections
        let adjustedWeight = weight;
        if (sectionData.status === 'success' && sectionConfidence > 0.8) {
          adjustedWeight *= 1.1;
        } else if (sectionData.status === 'low_confidence') {
          adjustedWeight *= 0.8;
        }

        totalConfidence += sectionConfidence * adjustedWeight;
        totalWeight += adjustedWeight;
        sectionsWithContent++;
      }
    });

    // Base calculation
    let overallConfidence = totalWeight > 0 ? totalConfidence / totalWeight : 0;

    // Apply penalties and bonuses
    
    // Penalty for missing critical sections
    if (sectionsWithContent < 3) {
      overallConfidence *= 0.85; // Significant penalty for incomplete SOAP note
    }
    
    // Bonus for complete, high-quality note
    if (sectionsWithContent === 4 && overallConfidence > 0.7) {
      overallConfidence = Math.min(1, overallConfidence + 0.05);
    }

    // Check for consistency issues
    const confidenceRange = Math.max(...Object.values(sections).map(s => s.confidence)) - 
                           Math.min(...Object.values(sections).map(s => s.confidence));
    
    if (confidenceRange > 0.6) {
      // Large variance in section confidence suggests inconsistent quality
      overallConfidence *= 0.95;
    }

    // Final validation and capping
    overallConfidence = Math.max(0, Math.min(1, overallConfidence));
    
    // Round to 2 decimal places for cleaner presentation
    return Math.round(overallConfidence * 100) / 100;
  }
}