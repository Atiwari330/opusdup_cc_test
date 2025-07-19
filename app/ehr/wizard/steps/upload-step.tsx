'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle } from 'lucide-react';

interface UploadFormData {
  file: FileList;
  patientId: string;
  sessionDate: string;
}

interface UploadStepProps {
  transcriptId: string | null;
  stepData: Record<string, any>;
  onComplete: (stepId: string, data?: any) => void;
  onBack: () => void;
  canGoBack: boolean;
}

export function UploadStep({ transcriptId, stepData, onComplete, onBack, canGoBack }: UploadStepProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid }
  } = useForm<UploadFormData>({
    defaultValues: {
      patientId: stepData.upload?.patientId || '99f7c236-be47-437e-87e9-b3d2ff574c34',
      sessionDate: stepData.upload?.sessionDate || new Date().toISOString().slice(0, 16)
    }
  });

  const selectedFile = watch('file')?.[0];

  const onSubmit = async (data: UploadFormData) => {
    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', data.file[0]);
      formData.append('patientId', data.patientId);
      
      // Convert datetime-local format to ISO string
      const isoSessionDate = new Date(data.sessionDate).toISOString();
      formData.append('sessionDate', isoSessionDate);

      const response = await fetch('/api/ehr/transcripts/upload-test', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        // Complete the upload step with the result data
        const stepData = {
          ...data,
          transcriptId: result.transcript.id,
          uploadResult: result
        };
        
        // Call onComplete with the new transcript ID so the wizard can update the URL
        onComplete('upload', stepData);
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Upload className="w-12 h-12 mx-auto text-blue-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Upload Session Transcript
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Select a PDF transcript to begin AI analysis
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* File Upload */}
        <div>
          <Label htmlFor="file" className="text-base font-medium">
            PDF Transcript
          </Label>
          <Input
            id="file"
            type="file"
            accept=".pdf"
            className="mt-2"
            disabled={isUploading}
            {...register('file', { 
              required: 'Please select a PDF file',
              validate: {
                fileType: (files) => {
                  if (!files?.[0]) return 'Please select a file';
                  return files[0].type === 'application/pdf' || 'Please select a PDF file';
                },
                fileSize: (files) => {
                  if (!files?.[0]) return 'Please select a file';
                  const maxSize = 10 * 1024 * 1024; // 10MB
                  return files[0].size <= maxSize || 'File size must be under 10MB';
                }
              }
            })}
          />
          {errors.file && (
            <p className="text-red-500 text-sm mt-1">{errors.file.message}</p>
          )}
          {selectedFile && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          )}
        </div>

        {/* Patient ID */}
        <div>
          <Label htmlFor="patientId" className="text-base font-medium">
            Patient ID
          </Label>
          <Input
            id="patientId"
            className="mt-2"
            disabled={isUploading}
            placeholder="Patient UUID"
            {...register('patientId', { required: 'Patient ID is required' })}
          />
          {errors.patientId && (
            <p className="text-red-500 text-sm mt-1">{errors.patientId.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Default: John Doe (demo patient)
          </p>
        </div>

        {/* Session Date */}
        <div>
          <Label htmlFor="sessionDate" className="text-base font-medium">
            Session Date & Time
          </Label>
          <Input
            id="sessionDate"
            type="datetime-local"
            className="mt-2"
            disabled={isUploading}
            {...register('sessionDate', { required: 'Session date is required' })}
          />
          {errors.sessionDate && (
            <p className="text-red-500 text-sm mt-1">{errors.sessionDate.message}</p>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={!canGoBack}
            className={!canGoBack ? 'invisible' : ''}
          >
            Back
          </Button>
          
          <Button
            type="submit"
            disabled={!isValid || isUploading}
            className="min-w-32"
          >
            {isUploading ? 'Uploading...' : 'Upload & Process'}
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm text-blue-800 dark:text-blue-200 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Upload Requirements
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <ul className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
            <li>• PDF format only</li>
            <li>• Maximum file size: 10MB</li>
            <li>• Therapy session transcripts</li>
            <li>• Clear, readable text content</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}