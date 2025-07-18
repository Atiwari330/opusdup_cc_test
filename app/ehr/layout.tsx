// EHR section layout with navigation
import { ReactNode } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Home, FileText, Upload, Settings, Activity } from 'lucide-react';

interface EHRLayoutProps {
  children: ReactNode;
}

export default function EHRLayout({ children }: EHRLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                <Activity className="w-6 h-6 text-blue-600" />
                AI EHR Demo
              </Link>
              <Separator orientation="vertical" className="h-6" />
              <nav className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/ehr" className="flex items-center gap-2">
                    <Home className="w-4 h-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/ehr/upload" className="flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Upload
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/ehr/transcripts" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Transcripts
                  </Link>
                </Button>
              </nav>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/ehr/settings">
                  <Settings className="w-4 h-4" />
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href="/">
                  Back to Chat
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-16">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              AI-Powered EHR Beta Demo • Built with Next.js, TypeScript & OpenAI
            </div>
            <div className="flex items-center gap-4">
              <span>Version 1.0.0</span>
              <span>•</span>
              <span>Sprint 1 Implementation</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}