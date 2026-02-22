/**
 * Document Manager
 * Combined upload + list interface
 */

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';

interface DocumentManagerProps {
  projectId: string;
}

export function DocumentManager({ projectId }: DocumentManagerProps) {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  function handleUploadComplete() {
    setRefreshTrigger(prev => prev + 1);
  }

  return (
    <Tabs defaultValue="upload" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="upload">Upload Documents</TabsTrigger>
        <TabsTrigger value="library">Document Library</TabsTrigger>
      </TabsList>

      <TabsContent value="upload" className="mt-4">
        <DocumentUpload
          projectId={projectId}
          onUploadComplete={handleUploadComplete}
        />
      </TabsContent>

      <TabsContent value="library" className="mt-4">
        <DocumentList projectId={projectId} refreshTrigger={refreshTrigger} />
      </TabsContent>
    </Tabs>
  );
}
