'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Stethoscope, 
  Brain, 
  ChevronDown, 
  ChevronRight, 
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';

interface ReviewStepProps {
  transcriptId: string | null;
  stepData: Record<string, any>;
  onComplete: (stepId: string, data?: any) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function ReviewStep({ transcriptId, stepData, onComplete, onBack, canGoBack }: ReviewStepProps) {
  const [activeTab, setActiveTab] = useState<'soap' | 'cpt' | 'icd'>('soap');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalysisData = async () => {
      if (!transcriptId) return;

      try {
        const response = await fetch(`/api/ehr/transcripts/${transcriptId}/analyze`);
        const data = await response.json();
        
        if (response.ok) {
          setAnalysisData(data);
        }
      } catch (error) {
        console.error('Failed to fetch analysis data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysisData();
  }, [transcriptId]);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
    if (confidence >= 0.6) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
  };

  const getSOAPResults = () => {
    return analysisData?.clinicalNote || stepData.processing?.analysisResult?.results?.find((r: any) => r.type === 'soap_note');
  };

  const getCPTResults = () => {
    return analysisData?.analysisResults?.find((r: any) => r.analysisType === 'cpt_codes')?.result ||
           stepData.processing?.analysisResult?.results?.find((r: any) => r.type === 'cpt_codes');
  };

  const getICDResults = () => {
    return analysisData?.analysisResults?.find((r: any) => r.analysisType === 'icd_codes')?.result ||
           stepData.processing?.analysisResult?.results?.find((r: any) => r.type === 'icd_codes');
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading analysis results...</p>
      </div>
    );
  }

  const soapResults = getSOAPResults();
  const cptResults = getCPTResults();
  const icdResults = getICDResults();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Review AI Analysis
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review the generated clinical documentation
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('soap')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'soap'
              ? 'border-green-500 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-2" />
          SOAP Notes
        </button>
        <button
          onClick={() => setActiveTab('cpt')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'cpt'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Stethoscope className="w-4 h-4 inline mr-2" />
          CPT Codes
        </button>
        <button
          onClick={() => setActiveTab('icd')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'icd'
              ? 'border-purple-500 text-purple-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <Brain className="w-4 h-4 inline mr-2" />
          ICD-10 Codes
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {/* SOAP Notes Tab */}
        {activeTab === 'soap' && soapResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Clinical SOAP Note</h3>
              <Badge className={getConfidenceColor(soapResults.overallConfidence || 0)}>
                {Math.round((soapResults.overallConfidence || 0) * 100)}% Confidence
              </Badge>
            </div>

            {Object.entries(soapResults.sectionsData || soapResults.sections || {}).map(([section, data]: [string, any]) => (
              <Card key={section} className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base capitalize flex items-center gap-2">
                      <button
                        onClick={() => toggleSection(`soap-${section}`)}
                        className="flex items-center gap-2 hover:text-green-600"
                      >
                        {expandedSections[`soap-${section}`] ? 
                          <ChevronDown className="w-4 h-4" /> : 
                          <ChevronRight className="w-4 h-4" />
                        }
                        {section}
                      </button>
                    </CardTitle>
                    <Badge variant="outline" className={getConfidenceColor(data.confidence || 0)}>
                      {Math.round((data.confidence || 0) * 100)}%
                    </Badge>
                  </div>
                </CardHeader>
                {expandedSections[`soap-${section}`] && (
                  <CardContent>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                      {data.content || 'No content available'}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}

            {soapResults.disclaimerNote && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {soapResults.disclaimerNote}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* CPT Codes Tab */}
        {activeTab === 'cpt' && cptResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">CPT Billing Codes</h3>
              <Badge className={getConfidenceColor(cptResults.confidence || 0)}>
                {Math.round((cptResults.confidence || 0) * 100)}% Confidence
              </Badge>
            </div>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="text-base">Primary Code</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg text-blue-600">
                      {cptResults.primaryCode}
                    </span>
                    <Badge variant="outline">Primary</Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {cptResults.primaryCodeDescription}
                  </p>
                  <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                    <div>
                      <span className="font-medium">Session Type:</span>
                      <span className="ml-2 capitalize">{cptResults.sessionType}</span>
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span>
                      <span className="ml-2">{cptResults.sessionDuration} minutes</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {cptResults.alternativeCodes?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Alternative Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {cptResults.alternativeCodes.map((alt: any, i: number) => (
                      <div key={i} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-blue-600">{alt.code}</span>
                          <Badge variant="outline">
                            {Math.round((alt.confidence || 0) * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          {alt.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {alt.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {cptResults.disclaimerNote && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {cptResults.disclaimerNote}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* ICD-10 Codes Tab */}
        {activeTab === 'icd' && icdResults && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">ICD-10 Diagnosis Codes</h3>
              <Badge className={getConfidenceColor(icdResults.confidence || icdResults.primaryDiagnosis?.confidence || 0)}>
                {Math.round((icdResults.confidence || icdResults.primaryDiagnosis?.confidence || 0) * 100)}% Confidence
              </Badge>
            </div>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="text-base">Primary Diagnosis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg text-purple-600">
                      {icdResults.primaryDiagnosis?.code}
                    </span>
                    <Badge variant="outline">Primary</Badge>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">
                    {icdResults.primaryDiagnosis?.description}
                  </p>
                </div>
              </CardContent>
            </Card>

            {icdResults.secondaryDiagnoses?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Secondary Diagnoses</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {icdResults.secondaryDiagnoses.map((diag: any, i: number) => (
                      <div key={i} className="border rounded p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-purple-600">{diag.code}</span>
                          <Badge variant="outline">
                            {Math.round((diag.confidence || 0) * 100)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">
                          {diag.description}
                        </p>
                        <p className="text-xs text-gray-500">
                          {diag.reasoning}
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {icdResults.diagnosticEvidence?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Diagnostic Evidence</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {icdResults.diagnosticEvidence.map((evidence: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <Info className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {icdResults.riskFactors?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Risk Factors</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-1 text-sm">
                    {icdResults.riskFactors.map((factor: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-3 h-3 text-orange-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700 dark:text-gray-300">{factor}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {icdResults.disclaimerNote && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  {icdResults.disclaimerNote}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
        >
          Back
        </Button>
        
        <Button onClick={() => onComplete('review', { analysisData })}>
          Continue to Actions
        </Button>
      </div>
    </div>
  );
}