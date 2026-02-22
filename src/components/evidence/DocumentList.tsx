/**
 * Document List Component
 * Shows uploaded documents and allows search/delete
 */

import { useState, useEffect } from 'react';
import { FileText, Trash2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

interface Document {
  id: string;
  name: string;
  file_type: string;
  file_size_bytes: number;
  upload_date: string;
  pages_count?: number;
}

interface DocumentListProps {
  projectId: string;
  refreshTrigger?: number;
}

export function DocumentList({ projectId, refreshTrigger }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Document[]>([]);
  const [searching, setSearching] = useState(false);

  // Load documents
  useEffect(() => {
    loadDocuments();
  }, [projectId, refreshTrigger]);

  async function loadDocuments() {
    try {
      const { data, error } = await supabase
        .from('project_documents')
        .select('id, name, file_type, file_size_bytes, upload_date, pages_count')
        .eq('project_id', projectId)
        .order('upload_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error) {
      console.error('Failed to load documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }

  // Search documents
  async function handleSearch() {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_project_documents', {
        p_project_id: projectId,
        p_query: searchQuery,
        p_limit: 10,
      });

      if (error) throw error;
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search failed:', error);
      toast.error('Search failed');
    } finally {
      setSearching(false);
    }
  }

  // Delete document
  async function handleDelete(documentId: string, documentName: string) {
    if (!confirm(`Delete "${documentName}"?`)) return;

    try {
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', documentId);

      if (error) throw error;

      toast.success('Document deleted');
      loadDocuments();
      setSearchResults([]);
    } catch (error) {
      console.error('Delete failed:', error);
      toast.error('Failed to delete document');
    }
  }

  // Format file size
  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  // Get file icon color
  function getFileColor(fileType: string): string {
    switch (fileType) {
      case 'pdf':
        return 'text-red-500';
      case 'csv':
        return 'text-green-500';
      case 'xlsx':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  }

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-muted rounded w-1/4"></div>
          <div className="h-12 bg-muted rounded"></div>
          <div className="h-12 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      {documents.length > 0 && (
        <Card className="p-4">
          <div className="flex gap-2">
            <Input
              placeholder="Search in your documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} disabled={searching}>
              <Search className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">
                Found {searchResults.length} results
              </p>
              {searchResults.map((result) => (
                <div
                  key={result.document_id}
                  className="p-3 border rounded-lg space-y-1"
                >
                  <p className="text-sm font-medium">{result.document_name}</p>
                  <p
                    className="text-xs text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: result.matched_content }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Relevance: {(result.relevance_rank * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Document List */}
      <Card className="p-4">
        <h3 className="font-semibold mb-4">
          Your Documents ({documents.length})
        </h3>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No documents uploaded yet</p>
            <p className="text-xs mt-1">Upload documents to use as evidence sources</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <FileText className={`h-5 w-5 flex-shrink-0 ${getFileColor(doc.file_type)}`} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-sm truncate">{doc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.file_type.toUpperCase()} • {formatFileSize(doc.file_size_bytes)}
                      {doc.pages_count && ` • ${doc.pages_count} pages`} •{' '}
                      {formatDistanceToNow(new Date(doc.upload_date), { addSuffix: true })}
                    </p>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(doc.id, doc.name)}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
