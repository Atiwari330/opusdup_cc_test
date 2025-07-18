// EHR Upload Page - PDF transcript upload interface
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, AlertCircle, CheckCircle, X, Brain, Stethoscope } from 'lucide-react';

export default function EHRUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [patientId, setPatientId] = useState('99f7c236-be47-437e-87e9-b3d2ff574c34'); // Actual John Doe ID
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 16));
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showResultsModal, setShowResultsModal] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        setError('Please select a PDF file');
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError('File size must be under 10MB');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a PDF file');
      return;
    }

    setIsUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('patientId', patientId);
      
      // Convert datetime-local format to ISO string
      const isoSessionDate = new Date(sessionDate).toISOString();
      formData.append('sessionDate', isoSessionDate);

      const response = await fetch('/api/ehr/transcripts/upload-test', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        setUploadResult(result);
        setFile(null);
        // Reset form
        const fileInput = document.getElementById('file') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      } else {
        setError(result.error || 'Upload failed');
      }
    } catch (err) {
      setError('Upload failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    } finally {
      setIsUploading(false);
    }
  };

  const handleAnalyze = async (transcriptId: string) => {
    try {
      const response = await fetch(`/api/ehr/transcripts/${transcriptId}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisTypes: ['soap_note', 'cpt_codes', 'icd_codes'],
        }),
      });

      const result = await response.json();
      
      if (response.ok) {
        setUploadResult((prev: any) => ({
          ...prev,
          analysisResult: result,
        }));
      } else {
        setError('Analysis failed: ' + result.error);
      }
    } catch (err) {
      setError('Analysis failed: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Upload Session Transcript
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Upload PDF transcripts for AI analysis and clinical documentation
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              PDF Upload
            </CardTitle>
            <CardDescription>
              Select a therapy session transcript PDF for processing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="file">PDF File</Label>
              <Input
                id="file"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              {file && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="patientId">Patient ID</Label>
              <Input
                id="patientId"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                disabled={isUploading}
                placeholder="Patient UUID"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default: John Doe (demo patient)
              </p>
            </div>

            <div>
              <Label htmlFor="sessionDate">Session Date & Time</Label>
              <Input
                id="sessionDate"
                type="datetime-local"
                value={sessionDate}
                onChange={(e) => setSessionDate(e.target.value)}
                disabled={isUploading}
              />
            </div>

            <Button 
              onClick={handleUpload} 
              disabled={!file || isUploading}
              className="w-full"
            >
              {isUploading ? 'Uploading...' : 'Upload & Process PDF'}
            </Button>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Processing Results
            </CardTitle>
            <CardDescription>
              Upload status and AI analysis results
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!uploadResult && !isUploading && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Upload a PDF to see processing results
              </div>
            )}

            {isUploading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 dark:text-gray-400">Processing PDF...</p>
              </div>
            )}

            {uploadResult && (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    PDF uploaded successfully! Transcript ID: {uploadResult.transcript?.id}
                  </AlertDescription>
                </Alert>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h3 className="font-semibold mb-2">Transcript Details:</h3>
                  <ul className="text-sm space-y-1">
                    <li>Pages: {uploadResult.transcript?.pageCount}</li>
                    <li>Text Length: {uploadResult.transcript?.textLength} characters</li>
                    <li>Status: {uploadResult.transcript?.processingStatus}</li>
                    <li>Session Date: {new Date(uploadResult.transcript?.sessionDate).toLocaleString()}</li>
                  </ul>
                </div>

                {!uploadResult.analysisResult && (
                  <Button 
                    onClick={() => handleAnalyze(uploadResult.transcript.id)}
                    className="w-full"
                  >
                    Run AI Analysis (SOAP + CPT + ICD)
                  </Button>
                )}

                {uploadResult.analysisResult && (
                  <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                    <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                      ✅ AI Analysis Complete
                    </h3>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {uploadResult.analysisResult.results?.length} analysis types completed
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => setShowResultsModal(true)}
                    >
                      View Full Results
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Info Cards */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-blue-800 dark:text-blue-200">
              📄 PDF Processing
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Automatic text extraction and validation for therapy session transcripts
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-green-800 dark:text-green-200">
              🤖 AI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-green-700 dark:text-green-300">
              SOAP notes, CPT codes, and ICD-10 diagnoses generated with confidence scoring
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-purple-800 dark:text-purple-200">
              ⚡ Caching
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-purple-700 dark:text-purple-300">
              Redis-powered caching for faster repeat analysis and improved performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Results Modal */}
      {showResultsModal && uploadResult?.analysisResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-4 flex items-center justify-between">
              <h2 className="text-xl font-bold">AI Analysis Results</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowResultsModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="p-6 space-y-6">
              {uploadResult.analysisResult.results?.map((result: any, index: number) => (
                <Card key={index} className="border-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {result.type === 'soap_note' && <FileText className="w-5 h-5 text-green-600" />}
                      {result.type === 'cpt_codes' && <Stethoscope className="w-5 h-5 text-blue-600" />}
                      {result.type === 'icd_codes' && <Brain className="w-5 h-5 text-purple-600" />}
                      {result.type === 'soap_note' && 'SOAP Clinical Note'}
                      {result.type === 'cpt_codes' && 'CPT Billing Codes'}
                      {result.type === 'icd_codes' && 'ICD-10 Diagnosis Codes'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {/* SOAP Note Results */}
                    {result.type === 'soap_note' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <span className="font-medium">Overall Confidence:</span>
                            <span className="ml-2 text-green-600 font-bold">
                              {Math.round(result.overallConfidence * 100)}%
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Note ID:</span>
                            <span className="ml-2 text-gray-600 font-mono text-xs">
                              {result.noteId}
                            </span>
                          </div>
                        </div>
                        
                        {Object.entries(result.sections || {}).map(([section, data]: [string, any]) => (
                          <div key={section} className="border rounded-lg p-4">
                            <h4 className="font-semibold text-lg mb-2 capitalize">
                              {section} 
                              <span className="ml-2 text-sm text-gray-500">
                                ({Math.round(data.confidence * 100)}% confidence)
                              </span>
                            </h4>
                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {data.content}
                            </p>
                          </div>
                        ))}
                        
                        {result.disclaimerNote && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {result.disclaimerNote}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* CPT Code Results */}
                    {result.type === 'cpt_codes' && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Primary Code:</span>
                            <span className="ml-2 text-blue-600 font-bold">
                              {result.primaryCode}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Confidence:</span>
                            <span className="ml-2 text-blue-600 font-bold">
                              {Math.round(result.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold mb-2">Description:</h4>
                          <p className="text-gray-700 dark:text-gray-300">
                            {result.primaryCodeDescription}
                          </p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Session Type:</span>
                            <span className="ml-2 capitalize">{result.sessionType}</span>
                          </div>
                          <div>
                            <span className="font-medium">Duration:</span>
                            <span className="ml-2">{result.sessionDuration} minutes</span>
                          </div>
                        </div>
                        
                        {result.alternativeCodes?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Alternative Codes:</h4>
                            {result.alternativeCodes.map((alt: any, i: number) => (
                              <div key={i} className="border rounded p-3 mb-2">
                                <div className="font-medium">
                                  {alt.code} - {alt.description}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Confidence: {Math.round(alt.confidence * 100)}%
                                </div>
                                <div className="text-sm text-gray-600">
                                  {alt.reason}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {result.disclaimerNote && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {result.disclaimerNote}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}

                    {/* ICD-10 Code Results */}
                    {result.type === 'icd_codes' && (
                      <div className="space-y-4">
                        <div>
                          <h4 className="font-semibold mb-2">Primary Diagnosis:</h4>
                          <div className="border rounded p-3 bg-purple-50 dark:bg-purple-950/20">
                            <div className="font-medium">
                              {result.primaryDiagnosis?.code} - {result.primaryDiagnosis?.description}
                            </div>
                            <div className="text-sm text-purple-600 mt-1">
                              Confidence: {Math.round(result.primaryDiagnosis?.confidence * 100)}%
                            </div>
                          </div>
                        </div>
                        
                        {result.secondaryDiagnoses?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Secondary Diagnoses:</h4>
                            {result.secondaryDiagnoses.map((diag: any, i: number) => (
                              <div key={i} className="border rounded p-3 mb-2">
                                <div className="font-medium">
                                  {diag.code} - {diag.description}
                                </div>
                                <div className="text-sm text-gray-600 mt-1">
                                  Confidence: {Math.round(diag.confidence * 100)}%
                                </div>
                                <div className="text-sm text-gray-600">
                                  {diag.reasoning}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {result.diagnosticEvidence?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Diagnostic Evidence:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {result.diagnosticEvidence.map((evidence: string, i: number) => (
                                <li key={i} className="text-gray-700 dark:text-gray-300">
                                  {evidence}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {result.riskFactors?.length > 0 && (
                          <div>
                            <h4 className="font-semibold mb-2">Risk Factors:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm">
                              {result.riskFactors.map((factor: string, i: number) => (
                                <li key={i} className="text-orange-600 dark:text-orange-400">
                                  {factor}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {result.disclaimerNote && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription className="text-xs">
                              {result.disclaimerNote}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}