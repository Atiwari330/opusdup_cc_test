'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Step components (we'll create these)
import { UploadStep } from './steps/upload-step';
import { ProcessingStep } from './steps/processing-step';
import { ReviewStep } from './steps/review-step';
import { ActionsStep } from './steps/actions-step';

const STEPS = [
  { id: 'upload', label: 'Upload', component: UploadStep },
  { id: 'processing', label: 'Processing', component: ProcessingStep },
  { id: 'review', label: 'Review', component: ReviewStep },
  { id: 'actions', label: 'Actions', component: ActionsStep },
];

export default function WizardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get current step from URL or default to first step
  const currentStepId = searchParams.get('step') || 'upload';
  const transcriptId = searchParams.get('t') || null;
  
  const currentStepIndex = STEPS.findIndex(step => step.id === currentStepId);
  const currentStep = STEPS[currentStepIndex] || STEPS[0];

  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [stepData, setStepData] = useState<Record<string, any>>({});

  const updateUrl = (stepId: string, transcriptId?: string) => {
    const params = new URLSearchParams();
    params.set('step', stepId);
    if (transcriptId) params.set('t', transcriptId);
    router.push(`/ehr/wizard?${params.toString()}`);
  };

  const goToStep = (stepId: string) => {
    // Only allow backward navigation or to completed steps
    const targetIndex = STEPS.findIndex(step => step.id === stepId);
    if (targetIndex <= currentStepIndex || completedSteps.includes(stepId)) {
      updateUrl(stepId, transcriptId);
    }
  };

  const completeStep = (stepId: string, data?: any) => {
    setCompletedSteps(prev => [...prev.filter(id => id !== stepId), stepId]);
    if (data) {
      setStepData(prev => ({ ...prev, [stepId]: data }));
    }
    
    // Auto-advance to next step
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < STEPS.length) {
      // Use transcript ID from step data if available, otherwise use current transcript ID
      const newTranscriptId = data?.transcriptId || transcriptId;
      updateUrl(STEPS[nextIndex].id, newTranscriptId);
    }
  };

  const goBack = () => {
    if (currentStepIndex > 0) {
      updateUrl(STEPS[currentStepIndex - 1].id, transcriptId);
    }
  };

  const StepComponent = currentStep.component;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            AI Clinical Documentation
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Upload and analyze therapy session transcripts
          </p>
        </div>

        {/* Breadcrumb Navigation */}
        <div className="mb-8">
          <nav className="flex items-center space-x-2 text-sm">
            {STEPS.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <button
                  onClick={() => goToStep(step.id)}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    step.id === currentStepId
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                      : completedSteps.includes(step.id)
                      ? 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                      : index <= currentStepIndex
                      ? 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                      : 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                  }`}
                  disabled={index > currentStepIndex && !completedSteps.includes(step.id)}
                >
                  {step.label}
                </button>
                {index < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 mx-1 text-gray-400" />
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Main Wizard Card */}
        <Card className="shadow-lg">
          <CardContent className="p-8">
            <StepComponent
              transcriptId={transcriptId}
              stepData={stepData}
              onComplete={completeStep}
              onBack={goBack}
              canGoBack={currentStepIndex > 0}
            />
          </CardContent>
        </Card>

        {/* Progress Indicator */}
        <div className="mt-6 text-center text-sm text-gray-500">
          Step {currentStepIndex + 1} of {STEPS.length}
        </div>
      </div>
    </div>
  );
}