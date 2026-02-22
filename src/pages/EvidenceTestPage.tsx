/**
 * Evidence System Test Page
 * Use this to test the complete evidence system
 */

import { useState } from 'react';
import { DocumentManager } from '@/components/evidence';
import { EvidenceAIGenerator } from '@/components/evidence';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';

export default function EvidenceTestPage() {
  const [projectId, setProjectId] = useState<string>('');
  const [userId, setUserId] = useState<string>('');

  // Get current user and first project on mount
  useState(() => {
    async function init() {
      // Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);

        // Get first project
        const { data: projects } = await supabase
          .from('projects')
          .select('id')
          .eq('owner_id', user.id)
          .limit(1);

        if (projects && projects.length > 0) {
          setProjectId(projects[0].id);
        }
      }
    }
    init();
  });

  if (!userId || !projectId) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Loading... (Getting your user and project)
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🧪 Evidence System Test</h1>
        <p className="text-muted-foreground mt-2">
          Test the complete AI Evidence System here
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current Project</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono truncate">{projectId}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Current User</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono truncate">{userId}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">📄 Document Manager</TabsTrigger>
          <TabsTrigger value="generator">🤖 AI Generator</TabsTrigger>
        </TabsList>

        {/* Tab 1: Document Manager */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Upload & Management</CardTitle>
              <CardDescription>
                Upload PDFs, CSVs, XLSX files and they'll be indexed for evidence search
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentManager projectId={projectId} />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">✅ Test Checklist:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Click "Upload Documents" tab above</li>
                <li>Drag & drop a PDF or CSV file (or click "Choose Files")</li>
                <li>Watch the progress bar (uploading → extracting → indexing)</li>
                <li>Switch to "Document Library" tab to see your uploaded doc</li>
                <li>Try searching for a word that's in your document</li>
                <li>You should see search results with highlights</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: AI Generator */}
        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Generation with Evidence</CardTitle>
              <CardDescription>
                Test the complete flow: Pre-modal → Search → Generate → Evidence Report
              </CardDescription>
            </CardHeader>
            <CardContent>
              <EvidenceAIGenerator
                functionName="financial-projections"
                projectId={projectId}
                userId={userId}
                buttonLabel="🚀 Test Evidence Generation"
                onGenerationComplete={(result) => {
                  console.log('✅ Generation complete:', result);
                  alert('Generation complete! Check console (F12) for full result');
                }}
              />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">✅ Test Checklist:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>Click the "Test Evidence Generation" button above</li>
                <li>A modal should open with "Simple" and "Advanced" tabs</li>
                <li>Try changing Evidence Mode: Strict / Balanced / Hypothesis</li>
                <li>Toggle the source tiers (Your Documents, Official APIs, etc.)</li>
                <li>Click "Search & Generate"</li>
                <li>Wait for search to complete</li>
                <li>Evidence Report should appear below the button</li>
                <li>Check the console (F12) for the full result object</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-yellow-800">⚠️ Current Status:</h3>
              <p className="text-sm text-yellow-700">
                The AI generation is currently using <strong>mock data</strong>.
                To connect with real AI generation, you need to modify
                <code className="bg-yellow-100 px-1 mx-1 rounded">src/hooks/useEvidenceGeneration.ts</code>
                to call your actual Edge Function.
              </p>
              <p className="text-sm text-yellow-700 mt-2">
                But all the UI, document upload, search, and evidence reporting works perfectly!
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
