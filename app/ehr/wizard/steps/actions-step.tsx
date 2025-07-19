'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  Download, 
  Copy, 
  FileText, 
  Stethoscope, 
  Brain,
  AlertCircle,
  ExternalLink
} from 'lucide-react';

interface ActionsStepProps {
  transcriptId: string | null;
  stepData: Record<string, any>;
  onComplete: (stepId: string, data?: any) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function ActionsStep({ transcriptId, stepData, onComplete, onBack, canGoBack }: ActionsStepProps) {
  const [approvalStatus, setApprovalStatus] = useState<'pending' | 'approved' | 'needs_review'>('pending');
  const [copySuccess, setCopySuccess] = useState<string | null>(null);

  const handleApprove = async () => {
    // In a real implementation, this would update the transcript status
    setApprovalStatus('approved');
    // For now, just mark as approved locally
    console.log('Transcript approved for clinical use');
  };

  const handleNeedsReview = () => {
    setApprovalStatus('needs_review');
    console.log('Transcript flagged for additional review');
  };

  const copyToClipboard = async (data: any, type: string) => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopySuccess(type);
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const exportFullReport = async () => {
    const reportData = {
      transcriptId,
      timestamp: new Date().toISOString(),
      patientInfo: {
        patientId: stepData.upload?.patientId,
        sessionDate: stepData.upload?.sessionDate,
      },
      soapNote: stepData.review?.analysisData?.clinicalNote,
      cptCodes: stepData.review?.analysisData?.analysisResults?.find((r: any) => r.analysisType === 'cpt_codes'),
      icdCodes: stepData.review?.analysisData?.analysisResults?.find((r: any) => r.analysisType === 'icd_codes'),
      approvalStatus,
      generatedBy: 'AI-Powered EHR System v1.0'
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(reportData, null, 2));
      setCopySuccess('full_report');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (error) {
      console.error('Failed to copy full report:', error);
    }
  };

  const getSoapData = () => {
    return stepData.review?.analysisData?.clinicalNote || 
           stepData.processing?.analysisResult?.results?.find((r: any) => r.type === 'soap_note');
  };

  const getCptData = () => {
    return stepData.review?.analysisData?.analysisResults?.find((r: any) => r.analysisType === 'cpt_codes')?.result ||
           stepData.processing?.analysisResult?.results?.find((r: any) => r.type === 'cpt_codes');
  };

  const getIcdData = () => {
    return stepData.review?.analysisData?.analysisResults?.find((r: any) => r.analysisType === 'icd_codes')?.result ||
           stepData.processing?.analysisResult?.results?.find((r: any) => r.type === 'icd_codes');
  };

  const startNewAnalysis = () => {
    // Navigate back to upload step
    window.location.href = '/ehr/wizard?step=upload';
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <CheckCircle className="w-12 h-12 mx-auto text-green-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Review Complete
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Choose your next action for this clinical analysis
        </p>
      </div>

      {/* Approval Section */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="text-lg">Clinical Review & Approval</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              As the reviewing clinician, please indicate your assessment of the AI-generated analysis:
            </p>
            
            <div className="flex gap-3">
              <Button 
                onClick={handleApprove}
                variant={approvalStatus === 'approved' ? 'default' : 'outline'}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve for Clinical Use
              </Button>
              
              <Button 
                onClick={handleNeedsReview}
                variant={approvalStatus === 'needs_review' ? 'default' : 'outline'}
                className="flex-1"
              >
                <AlertCircle className="w-4 h-4 mr-2" />
                Needs Additional Review
              </Button>
            </div>

            {approvalStatus === 'approved' && (
              <Alert className="bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-800 dark:text-green-200">
                  Analysis approved for clinical documentation. Ready for export to EHR system.
                </AlertDescription>
              </Alert>
            )}

            {approvalStatus === 'needs_review' && (
              <Alert className="bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                  Analysis flagged for additional review. Consider manual corrections before clinical use.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Export Options</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Individual Exports */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Individual Components</h4>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => copyToClipboard(getSoapData(), 'soap')}
              >
                <FileText className="w-4 h-4 mr-2" />
                {copySuccess === 'soap' ? 'Copied!' : 'Copy SOAP Note'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => copyToClipboard(getCptData(), 'cpt')}
              >
                <Stethoscope className="w-4 h-4 mr-2" />
                {copySuccess === 'cpt' ? 'Copied!' : 'Copy CPT Codes'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={() => copyToClipboard(getIcdData(), 'icd')}
              >
                <Brain className="w-4 h-4 mr-2" />
                {copySuccess === 'icd' ? 'Copied!' : 'Copy ICD-10 Codes'}
              </Button>
            </div>

            {/* Full Report */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-gray-700 dark:text-gray-300">Complete Report</h4>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                onClick={exportFullReport}
              >
                <Download className="w-4 h-4 mr-2" />
                {copySuccess === 'full_report' ? 'Copied!' : 'Copy Full Report'}
              </Button>
              
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full justify-start"
                disabled
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Export to EHR (Coming Soon)
              </Button>
            </div>
          </div>

          {copySuccess && (
            <Alert className="mt-4 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800">
              <Copy className="h-4 w-4" />
              <AlertDescription className="text-blue-800 dark:text-blue-200">
                Content copied to clipboard successfully!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card className="bg-gray-50 dark:bg-gray-800">
        <CardHeader>
          <CardTitle className="text-lg">Analysis Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {getSoapData()?.overallConfidence ? 
                  Math.round(getSoapData().overallConfidence * 100) + '%' : 
                  'N/A'
                }
              </div>
              <div className="text-gray-600 dark:text-gray-400">SOAP Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {getCptData()?.confidence ? 
                  Math.round(getCptData().confidence * 100) + '%' : 
                  'N/A'
                }
              </div>
              <div className="text-gray-600 dark:text-gray-400">CPT Confidence</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {getIcdData()?.confidence || getIcdData()?.primaryDiagnosis?.confidence ? 
                  Math.round((getIcdData().confidence || getIcdData().primaryDiagnosis.confidence) * 100) + '%' : 
                  'N/A'
                }
              </div>
              <div className="text-gray-600 dark:text-gray-400">ICD-10 Confidence</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Disclaimer */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          <strong>Professional Disclaimer:</strong> All AI-generated content must be reviewed and validated by licensed healthcare professionals before use in patient care or billing. This system is designed to assist, not replace, clinical judgment.
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack}
        >
          Back to Review
        </Button>
        
        <div className="space-x-2">
          <Button 
            variant="outline" 
            onClick={startNewAnalysis}
          >
            Analyze Another Transcript
          </Button>
          
          <Button 
            onClick={() => onComplete('actions', { approvalStatus })}
            disabled={approvalStatus === 'pending'}
          >
            Complete Workflow
          </Button>
        </div>
      </div>
    </div>
  );
}