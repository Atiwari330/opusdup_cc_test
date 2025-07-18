// EHR Dashboard - Basic UI skeleton for demo
import { redirect } from 'next/navigation';
import { auth } from '@/app/(auth)/auth';
import { Suspense } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Brain, Stethoscope, Upload, BarChart3 } from 'lucide-react';

export default async function EHRDashboard() {
  const session = await auth();

  if (!session) {
    redirect('/login');
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          AI-Powered EHR Dashboard
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Mental Health Outpatient Services - Beta Demo
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {/* Upload Card */}
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800 dark:text-blue-200">
              <Upload className="w-5 h-5" />
              Upload Transcript
            </CardTitle>
            <CardDescription>
              Upload PDF session transcripts for AI analysis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" variant="default">
              Upload New PDF
            </Button>
          </CardContent>
        </Card>

        {/* SOAP Notes Card */}
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-800 dark:text-green-200">
              <FileText className="w-5 h-5" />
              SOAP Notes
            </CardTitle>
            <CardDescription>
              AI-generated clinical documentation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-green-700 dark:text-green-300">
                ✓ Subjective findings
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                ✓ Objective observations
              </div>
              <div className="text-sm text-green-700 dark:text-green-300">
                ✓ Assessment & Plan
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical Coding Card */}
        <Card className="border-purple-200 bg-purple-50 dark:bg-purple-950/20 dark:border-purple-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-800 dark:text-purple-200">
              <Stethoscope className="w-5 h-5" />
              Medical Coding
            </CardTitle>
            <CardDescription>
              CPT & ICD-10 code suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm text-purple-700 dark:text-purple-300">
                🔢 CPT billing codes
              </div>
              <div className="text-sm text-purple-700 dark:text-purple-300">
                🏥 ICD-10 diagnoses
              </div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
                Limited demo set
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-8" />

      {/* AI Features Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Brain className="w-6 h-6 text-blue-600" />
          AI Analysis Features
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Automated Documentation</CardTitle>
              <CardDescription>
                Transform session transcripts into structured clinical notes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  SOAP note generation with confidence scoring
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  PDF processing and text extraction
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  Intelligent content validation
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Billing & Diagnosis Support</CardTitle>
              <CardDescription>
                AI-assisted medical coding with professional oversight
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  CPT code suggestions (5 common codes)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  ICD-10 diagnosis codes (15 mental health codes)
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  Confidence scoring and disclaimers
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>

      <Separator className="my-8" />

      {/* System Status */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          System Status
        </h2>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Infrastructure Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border rounded-lg bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="text-2xl font-bold text-green-600">✓</div>
                <div className="text-sm font-medium">Database</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">PostgreSQL Online</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                <div className="text-2xl font-bold text-blue-600">⚡</div>
                <div className="text-sm font-medium">Redis Cache</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Performance Ready</div>
              </div>
              <div className="text-center p-4 border rounded-lg bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
                <div className="text-2xl font-bold text-purple-600">🤖</div>
                <div className="text-sm font-medium">AI Analyzers</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">3 Active Models</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Disclaimer */}
      <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 dark:border-yellow-800">
        <CardHeader>
          <CardTitle className="text-yellow-800 dark:text-yellow-200 text-lg">
            ⚠️ Demo Disclaimer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            This is a <strong>proof-of-concept demo</strong> with limited functionality. 
            AI-generated content requires professional verification. Not intended for production 
            clinical use without additional validation and oversight.
          </p>
          <div className="mt-3 text-xs text-yellow-700 dark:text-yellow-300">
            • Limited to 5 CPT codes and 15 ICD-10 codes
            • Beta software - expect updates and changes
            • Professional clinical judgment always required
          </div>
        </CardContent>
      </Card>

      {/* Footer Actions */}
      <div className="mt-8 flex justify-center gap-4">
        <Button variant="outline" size="sm">
          View API Documentation
        </Button>
        <Button variant="outline" size="sm">
          System Health Check
        </Button>
        <Button variant="outline" size="sm">
          Export Demo Data
        </Button>
      </div>
    </div>
  );
}