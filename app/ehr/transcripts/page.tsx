// EHR Transcripts Page - List and manage session transcripts
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, User, Brain, Download, ExternalLink } from 'lucide-react';

interface Transcript {
  id: string;
  patientId: string;
  sessionDate: string;
  processingStatus: 'pending' | 'processing' | 'completed' | 'failed';
  pageCount?: number;
  textLength?: number;
}

export default function TranscriptsPage() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Mock data for demo - in real app this would fetch from API
    setTimeout(() => {
      setTranscripts([
        {
          id: 'd4b24576-3d9b-4bd0-959b-ca6b148263a9',
          patientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          sessionDate: '2024-01-15T14:30:00Z',
          processingStatus: 'completed',
          pageCount: 3,
          textLength: 2847,
        },
        {
          id: 'f8e7d6c5-b4a3-9281-7654-321098765432',
          patientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          sessionDate: '2024-01-08T10:00:00Z',
          processingStatus: 'completed',
          pageCount: 2,
          textLength: 1923,
        },
        {
          id: '12345678-90ab-cdef-1234-567890abcdef',
          patientId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          sessionDate: '2024-01-01T15:45:00Z',
          processingStatus: 'pending',
          pageCount: 4,
          textLength: 3156,
        },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading transcripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Session Transcripts
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage and analyze therapy session transcripts
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{transcripts.length}</div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Transcripts</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {transcripts.filter(t => t.processingStatus === 'completed').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-600">
              {transcripts.filter(t => t.processingStatus === 'pending').length}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">
              {transcripts.reduce((sum, t) => sum + (t.pageCount || 0), 0)}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Pages</p>
          </CardContent>
        </Card>
      </div>

      {/* Transcripts List */}
      <div className="space-y-4">
        {transcripts.map((transcript) => (
          <Card key={transcript.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <CardTitle className="text-lg">
                      Session Transcript
                    </CardTitle>
                    <CardDescription className="flex items-center gap-4 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(transcript.sessionDate)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        John Doe (Demo Patient)
                      </span>
                    </CardDescription>
                  </div>
                </div>
                <Badge className={getStatusColor(transcript.processingStatus)}>
                  {transcript.processingStatus}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div className="text-sm">
                  <span className="font-medium">Transcript ID:</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                    {transcript.id.slice(0, 8)}...
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Pages:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {transcript.pageCount || 'N/A'}
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Text Length:</span>
                  <p className="text-gray-600 dark:text-gray-400">
                    {transcript.textLength?.toLocaleString() || 'N/A'} chars
                  </p>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Patient ID:</span>
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                    {transcript.patientId.slice(0, 8)}...
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {transcript.processingStatus === 'completed' && (
                  <>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Brain className="w-3 h-3" />
                      View Analysis
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <Download className="w-3 h-3" />
                      Download SOAP
                    </Button>
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="w-3 h-3" />
                      View Codes
                    </Button>
                  </>
                )}
                
                {transcript.processingStatus === 'pending' && (
                  <Button size="sm" className="gap-1">
                    <Brain className="w-3 h-3" />
                    Run Analysis
                  </Button>
                )}
                
                {transcript.processingStatus === 'failed' && (
                  <Button size="sm" variant="destructive" className="gap-1">
                    Retry Processing
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {transcripts.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
              No transcripts yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Upload your first therapy session transcript to get started
            </p>
            <Button asChild>
              <a href="/ehr/upload">Upload Transcript</a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}