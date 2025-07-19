'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface ProcessingStepProps {
  transcriptId: string | null;
  stepData: Record<string, any>;
  onComplete: (stepId: string, data?: any) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function ProcessingStep({ transcriptId, stepData, onComplete, onBack, canGoBack }: ProcessingStepProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<'processing' | 'completed' | 'failed'>('processing');
  const [message, setMessage] = useState('Initializing...');

  useEffect(() => {
    if (!transcriptId) {
      setStatus('failed');
      setMessage('No transcript ID found');
      return;
    }

    let pollInterval: NodeJS.Timeout | null = null;

    // Start processing by triggering the analysis
    const startAnalysis = async () => {
      try {
        setMessage('Starting AI analysis...');
        setProgress(10);

        console.log('Starting analysis for transcript:', transcriptId);

        const response = await fetch(`/api/ehr/transcripts/${transcriptId}/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            analysisTypes: ['soap_note', 'cpt_codes', 'icd_codes']
          })
        });

        console.log('Analysis start response:', response.status, response.statusText);

        if (!response.ok) {
          let errorData;
          try {
            errorData = await response.json();
          } catch (parseError) {
            errorData = { error: 'Failed to parse error response' };
          }
          // Only log as error if it's not a 409
          if (response.status !== 409) {
            console.error('Analysis start failed:', {
              status: response.status,
              statusText: response.statusText,
              errorData,
              url: response.url
            });
          }
          
          // If already processing, that's okay - just start polling
          if (response.status === 409) {
            console.log('Analysis already in progress, starting polling...');
            setProgress(25);
            setMessage('Analysis already in progress. Checking status...');
            pollInterval = startPolling();
            return;
          }
          
          const errorMessage = errorData?.error || response.statusText || `HTTP ${response.status}`;
          throw new Error(`Analysis failed to start: ${errorMessage}`);
        }

        const responseData = await response.json();
        console.log('Analysis start response data:', responseData);

        setProgress(25);
        setMessage('Analysis started. Processing transcript...');
        
        // Start polling for progress
        pollInterval = startPolling();
      } catch (error) {
        console.error('Error in startAnalysis:', error);
        setStatus('failed');
        setMessage(`Failed to start analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    };

    const startPolling = () => {
      let currentProgress = 25;
      
      const interval = setInterval(async () => {
        try {
          console.log('Polling progress for transcript:', transcriptId);
          const response = await fetch(`/api/ehr/transcripts/${transcriptId}/analyze`);
          const data = await response.json();

          console.log('Poll response:', response.status, 'Data:', data);

          if (response.ok) {
            const transcript = data.transcript;
            console.log('Transcript status:', transcript?.processingStatus);
            console.log('Clinical note exists:', !!data.clinicalNote);
            console.log('Analysis results count:', data.analysisResults?.length || 0);
            
            // Check if we have results even if status is still "processing"
            const hasResults = data.clinicalNote || (data.analysisResults && data.analysisResults.length > 0);
            
            if (transcript.processingStatus === 'completed' || hasResults) {
              setProgress(100);
              setStatus('completed');
              setMessage('Analysis completed successfully!');
              clearInterval(interval);
              
              // Auto-advance to review step after a brief delay
              setTimeout(() => {
                onComplete('processing', { analysisResult: data });
              }, 1000);
            } else if (transcript.processingStatus === 'failed') {
              setStatus('failed');
              setMessage('Analysis failed. Please try again.');
              clearInterval(interval);
            } else if (transcript.processingStatus === 'processing') {
              currentProgress = Math.min(currentProgress + 5, 90);
              setProgress(currentProgress);
              setMessage('Analyzing transcript with AI...');
            }
          } else {
            console.error('Poll failed:', response.status, data);
            setStatus('failed');
            setMessage('Failed to check progress');
            clearInterval(interval);
          }
        } catch (error) {
          console.error('Error in startPolling:', error);
          setStatus('failed');
          setMessage('Failed to check progress');
          clearInterval(interval);
        }
      }, 3000); // Poll every 3 seconds

      return interval;
    };

    startAnalysis();

    // Cleanup interval on unmount
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [transcriptId, onComplete]); // Removed 'progress' from dependencies

  const retry = () => {
    setStatus('processing');
    setProgress(0);
    setMessage('Retrying...');
    window.location.reload(); // Simple retry - reload the page
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mb-4">
          {status === 'processing' && (
            <Clock className="w-12 h-12 mx-auto text-blue-600 animate-pulse" />
          )}
          {status === 'completed' && (
            <CheckCircle className="w-12 h-12 mx-auto text-green-600" />
          )}
          {status === 'failed' && (
            <AlertCircle className="w-12 h-12 mx-auto text-red-600" />
          )}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {status === 'processing' && 'Processing Transcript'}
          {status === 'completed' && 'Analysis Complete'}
          {status === 'failed' && 'Processing Failed'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {message}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>Progress</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className={`${progress >= 25 ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Text Extraction
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {progress >= 25 ? 'Complete' : 'Pending'}
            </div>
          </CardContent>
        </Card>

        <Card className={`${progress >= 60 ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              AI Analysis
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {progress >= 60 ? 'Complete' : progress >= 25 ? 'Processing' : 'Pending'}
            </div>
          </CardContent>
        </Card>

        <Card className={`${progress >= 100 ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700'}`}>
          <CardContent className="p-4 text-center">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Results Ready
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {progress >= 100 ? 'Complete' : 'Pending'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Processing Info */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <strong>What's happening:</strong>
            <ul className="mt-2 space-y-1 text-xs">
              <li>• Extracting text from PDF transcript</li>
              <li>• Generating SOAP clinical notes</li>
              <li>• Analyzing CPT billing codes</li>
              <li>• Identifying ICD-10 diagnosis codes</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={!canGoBack || status === 'processing'}
        >
          Back
        </Button>
        
        <div className="space-x-2">
          {status === 'failed' && (
            <Button onClick={retry} variant="outline">
              Retry
            </Button>
          )}
          
          {status === 'completed' && (
            <Button onClick={() => onComplete('processing')}>
              Continue to Review
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}