/**
 * Document Upload Component
 * Drag & drop interface for uploading PDF, CSV, XLSX files
 */

import { useState, useCallback } from 'react';
import { Upload, FileText, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useDocumentUpload } from '@/hooks/useDocumentUpload';
import { cn } from '@/lib/utils';

interface DocumentUploadProps {
  projectId: string;
  onUploadComplete?: () => void;
}

export function DocumentUpload({ projectId, onUploadComplete }: DocumentUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const { uploads, isUploading, uploadDocuments, clearUploads } = useDocumentUpload(projectId);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      const validFiles = files.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ['pdf', 'csv', 'xlsx', 'txt'].includes(ext || '');
      });

      if (validFiles.length === 0) {
        return;
      }

      await uploadDocuments(validFiles);
      onUploadComplete?.();
    },
    [uploadDocuments, onUploadComplete]
  );

  const handleFileInput = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      await uploadDocuments(files);
      onUploadComplete?.();

      // Reset input
      e.target.value = '';
    },
    [uploadDocuments, onUploadComplete]
  );

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={cn(
          'border-2 border-dashed p-8 transition-colors',
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center text-center space-y-4">
          <div
            className={cn(
              'rounded-full p-4 transition-colors',
              isDragging ? 'bg-primary text-primary-foreground' : 'bg-muted'
            )}
          >
            <Upload className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold">
              {isDragging ? 'Drop files here' : 'Upload Documents'}
            </h3>
            <p className="text-sm text-muted-foreground">
              Drag & drop your documents or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supported: PDF, CSV, XLSX, TXT (max 10MB each)
            </p>
          </div>

          <input
            type="file"
            id="file-upload"
            className="hidden"
            multiple
            accept=".pdf,.csv,.xlsx,.txt"
            onChange={handleFileInput}
            disabled={isUploading}
          />

          <Button
            variant="outline"
            disabled={isUploading}
            onClick={() => document.getElementById('file-upload')?.click()}
          >
            <FileText className="mr-2 h-4 w-4" />
            Choose Files
          </Button>
        </div>
      </Card>

      {/* Upload Progress */}
      {uploads.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-sm">Uploading Documents</h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearUploads}
              disabled={isUploading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-3">
            {uploads.map((upload, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    {upload.status === 'complete' && (
                      <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                    )}
                    {upload.status === 'error' && (
                      <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                    )}
                    {!['complete', 'error'].includes(upload.status) && (
                      <div className="h-4 w-4 flex-shrink-0 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    )}
                    <span className="truncate font-medium">{upload.fileName}</span>
                  </div>

                  <span className="text-xs text-muted-foreground capitalize ml-2">
                    {upload.status === 'uploading' && 'Uploading...'}
                    {upload.status === 'extracting' && 'Extracting text...'}
                    {upload.status === 'indexing' && 'Indexing...'}
                    {upload.status === 'complete' && 'Complete'}
                    {upload.status === 'error' && 'Failed'}
                  </span>
                </div>

                {upload.status !== 'error' && (
                  <Progress value={upload.progress} className="h-1" />
                )}

                {upload.error && (
                  <p className="text-xs text-destructive">{upload.error}</p>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Info */}
      <div className="text-xs text-muted-foreground space-y-1">
        <p>
          <strong>Tier 1 Sources:</strong> Your uploaded documents are the highest priority
          evidence sources (reliability: 100)
        </p>
        <p>
          Documents are indexed with full-text search for instant retrieval during AI
          generation
        </p>
      </div>
    </div>
  );
}
