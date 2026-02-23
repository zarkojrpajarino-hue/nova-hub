/**
 * Hook for uploading and processing documents (PDF, CSV, XLSX)
 * Extracts text and stores in project_documents table
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'extracting' | 'indexing' | 'complete' | 'error';
  error?: string;
}

interface DocumentMetadata {
  id: string;
  name: string;
  file_type: string;
  file_size_bytes: number;
  upload_date: string;
  pages_count?: number;
}

export function useDocumentUpload(projectId: string) {
  const [uploads, setUploads] = useState<Map<string, UploadProgress>>(new Map());
  const [isUploading, setIsUploading] = useState(false);

  /**
   * Extract text from PDF using pdf-parse
   */
  async function extractPDFText(file: File): Promise<{ text: string; pages: number }> {
    // For MVP, we'll use a simpler approach with FileReader
    // In production, use pdf-parse or PDF.js on server side

    // TODO: Implement server-side PDF extraction in Edge Function
    // For now, return placeholder
    return {
      text: `[PDF content from ${file.name}]\nThis is a placeholder. Implement server-side PDF extraction using pdf-parse in an Edge Function.`,
      pages: 1,
    };
  }

  /**
   * Extract data from CSV
   */
  async function extractCSVData(file: File): Promise<{ text: string; data: string[][] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const text = e.target?.result as string;

        // Simple CSV parsing
        const rows = text.split('\n').map(row =>
          row.split(',').map(cell => cell.trim())
        );

        // Convert to searchable text
        const searchableText = rows.map(row => row.join(' ')).join('\n');

        resolve({
          text: searchableText,
          data: rows,
        });
      };

      reader.onerror = () => reject(new Error('Failed to read CSV file'));
      reader.readAsText(file);
    });
  }

  /**
   * Extract data from XLSX (simplified - needs xlsx library)
   */
  async function extractXLSXData(file: File): Promise<{ text: string; data: Record<string, unknown> }> {
    // TODO: Implement XLSX parsing with xlsx library
    // For now, return placeholder
    return {
      text: `[XLSX content from ${file.name}]\nInstall xlsx library for full support.`,
      data: { sheets: [] },
    };
  }

  /**
   * Extract text from plain text file
   */
  async function extractTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error('Failed to read text file'));
      reader.readAsText(file);
    });
  }

  /**
   * Upload and process a document
   */
  async function uploadDocument(file: File): Promise<DocumentMetadata | null> {
    const fileId = `${file.name}-${Date.now()}`;

    // Update progress
    setUploads(prev => new Map(prev).set(fileId, {
      fileName: file.name,
      progress: 0,
      status: 'uploading',
    }));

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine file type
      const fileType = file.name.split('.').pop()?.toLowerCase() || 'unknown';

      if (!['pdf', 'csv', 'xlsx', 'txt'].includes(fileType)) {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Update: extracting
      setUploads(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        progress: 30,
        status: 'extracting',
      }));

      // Extract content based on file type
      let rawContent = '';
      let structuredData: Record<string, unknown> | null = null;
      let pagesCount: number | undefined;

      switch (fileType) {
        case 'pdf': {
          const pdfData = await extractPDFText(file);
          rawContent = pdfData.text;
          pagesCount = pdfData.pages;
          break;
        }

        case 'csv': {
          const csvData = await extractCSVData(file);
          rawContent = csvData.text;
          structuredData = { sheets: [{ name: 'Sheet1', rows: csvData.data }] };
          break;
        }

        case 'xlsx': {
          const xlsxData = await extractXLSXData(file);
          rawContent = xlsxData.text;
          structuredData = xlsxData.data;
          break;
        }

        case 'txt':
          rawContent = await extractTextFile(file);
          break;
      }

      // Update: indexing
      setUploads(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        progress: 70,
        status: 'indexing',
      }));

      // Insert into database
      const { data: document, error } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          user_id: user.id,
          name: file.name,
          file_type: fileType,
          file_size_bytes: file.size,
          raw_content: rawContent,
          structured_data: structuredData,
          pages_count: pagesCount,
        })
        .select()
        .single();

      if (error) throw error;

      // Update: complete
      setUploads(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        progress: 100,
        status: 'complete',
      }));

      toast.success(`Document uploaded: ${file.name}`);

      return {
        id: document.id,
        name: document.name,
        file_type: document.file_type,
        file_size_bytes: document.file_size_bytes,
        upload_date: document.upload_date,
        pages_count: document.pages_count,
      };

    } catch (_error) {

      setUploads(prev => new Map(prev).set(fileId, {
        fileName: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      }));

      toast.error(`Failed to upload ${file.name}`);
      return null;
    }
  }

  /**
   * Upload multiple documents
   */
  async function uploadDocuments(files: File[]): Promise<DocumentMetadata[]> {
    setIsUploading(true);
    const results: DocumentMetadata[] = [];

    for (const file of files) {
      const result = await uploadDocument(file);
      if (result) results.push(result);
    }

    setIsUploading(false);
    return results;
  }

  /**
   * Clear upload progress
   */
  function clearUploads() {
    setUploads(new Map());
  }

  return {
    uploads: Array.from(uploads.values()),
    isUploading,
    uploadDocument,
    uploadDocuments,
    clearUploads,
  };
}
