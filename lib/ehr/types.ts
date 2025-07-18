// Core types for the EHR system

export interface AnalysisResult {
  content: string;
  confidence: number;
  status: 'success' | 'low_confidence' | 'failed';
}

export interface SOAPSection {
  subjective: AnalysisResult;
  objective: AnalysisResult;
  assessment: AnalysisResult;
  plan: AnalysisResult;
}

export interface ClinicalNoteResult {
  sections: SOAPSection;
  overallConfidence: number;
  templateType: 'SOAP';
  rawAiResponse?: string;
}

export interface TranscriptAnalysis {
  transcriptId: string;
  analysisType: 'soap_note' | 'billing_codes' | 'icd_codes' | 'risk_assessment';
  result: any;
  confidence: number;
  timestamp: Date;
}

export interface AnalyzerConfig {
  name: string;
  type: TranscriptAnalysis['analysisType'];
  description: string;
}

// Base analyzer interface for extensibility
export interface Analyzer {
  config: AnalyzerConfig;
  analyze(transcript: string, options?: any): Promise<TranscriptAnalysis['result']>;
}