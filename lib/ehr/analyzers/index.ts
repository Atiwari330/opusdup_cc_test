// Export all analyzers
export { BaseAnalyzer } from './base-analyzer';
export { SOAPAnalyzer } from './soap-analyzer';
export { CPTAnalyzer } from './cpt-analyzer';
export { ICDAnalyzer } from './icd-analyzer';

// Future analyzers will be added here:
// export { RiskAssessmentAnalyzer } from './risk-assessment-analyzer';

// Analyzer registry for easy access
import { SOAPAnalyzer } from './soap-analyzer';
import { CPTAnalyzer } from './cpt-analyzer';
import { ICDAnalyzer } from './icd-analyzer';
import type { Analyzer } from '../types';

export const analyzerRegistry: Record<string, new () => Analyzer> = {
  soap_note: SOAPAnalyzer,
  cpt_codes: CPTAnalyzer,
  icd_codes: ICDAnalyzer,
  // Future: risk_assessment: RiskAssessmentAnalyzer,
};

export function getAnalyzer(type: string): Analyzer {
  const AnalyzerClass = analyzerRegistry[type];
  if (!AnalyzerClass) {
    throw new Error(`Unknown analyzer type: ${type}`);
  }
  return new AnalyzerClass();
}