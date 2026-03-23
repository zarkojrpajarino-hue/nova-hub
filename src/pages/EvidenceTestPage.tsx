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

import { useTranslation } from 'react-i18next';
export default function EvidenceTestPage() {
  const { t } = useTranslation();
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
        <h1 className="text-3xl font-bold">Evidence System Test</h1>
        <p className="text-muted-foreground mt-2">{t('evidenceTest.testTheCompleteAi')}</p>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('evidenceTest.currentProject')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono truncate">{projectId}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('evidenceTest.currentUser')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs font-mono truncate">{userId}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="documents" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="documents">Document Manager</TabsTrigger>
          <TabsTrigger value="generator">AI Generator</TabsTrigger>
        </TabsList>

        {/* Tab 1: Document Manager */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('evidenceTest.documentUploadManagement')}</CardTitle>
              <CardDescription>{t('evidenceTest.uploadPdfsCsvsXlsx')}</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentManager projectId={projectId} />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Test Checklist:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>{t('evidenceTest.clickUploadDocumentsTab')}</li>
                <li>Drag & drop a PDF or CSV file (or click t('evidenceTest.chooseFiles'))</li>
                <li>Watch the progress bar (uploading → extracting → indexing)</li>
                <li>{t('evidenceTest.switchToDocumentLibrary')}</li>
                <li>{t('evidenceTest.trySearchingForA')}</li>
                <li>{t('evidenceTest.youShouldSeeSearch')}</li>
              </ol>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: AI Generator */}
        <TabsContent value="generator" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('evidenceTest.aiGenerationWithEvidence')}</CardTitle>
              <CardDescription>{t('evidenceTest.testTheCompleteFlow')}</CardDescription>
            </CardHeader>
            <CardContent>
              <EvidenceAIGenerator
                functionName="financial-projections"
                projectId={projectId}
                userId={userId}
                buttonLabel="Test Evidence Generation"
                onGenerationComplete={(_result) => {
                  alert(t('evidenceTest.generationCompleteCheckConsole'));
                }}
              />
            </CardContent>
          </Card>

          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2">Test Checklist:</h3>
              <ol className="text-sm space-y-1 list-decimal list-inside">
                <li>{t('evidenceTest.clickTheTestEvidence')}</li>
                <li>{t('evidenceTest.aModalShouldOpen')}</li>
                <li>{t('evidenceTest.tryChangingEvidenceMode')}</li>
                <li>Toggle the source tiers (Your Documents, Official APIs, etc.)</li>
                <li>Click t('evidenceTest.searchGenerate')</li>
                <li>{t('evidenceTest.waitForSearchTo')}</li>
                <li>{t('evidenceTest.evidenceReportShouldAppear')}</li>
                <li>{t('evidenceTest.checkTheConsoleF12')}</li>
              </ol>
            </CardContent>
          </Card>

          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-2 text-yellow-800">Current Status:</h3>
              <p className="text-sm text-yellow-700">{t('evidenceTest.theAiGenerationIs')}<strong>mock data</strong>.
                To connect with real AI generation, you need to modify
                <code className="bg-yellow-100 px-1 mx-1 rounded">src/hooks/useEvidenceGeneration.ts</code>
                to call your actual Edge Function.
              </p>
              <p className="text-sm text-yellow-700 mt-2">{t('evidenceTest.butAllTheUi')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
