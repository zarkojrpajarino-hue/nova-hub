/**
 * Tier 1 Source Retriever: User Documents
 *
 * Searches user-uploaded PDFs, CSVs, XLSX files with full-text search
 * Returns EXACT quotes with precise locations (page, paragraph, row)
 *
 * CRITICAL: This is the HIGHEST priority source tier
 */

import { supabase } from '@/integrations/supabase/client';
import type {
  RealSource,
  Citation,
  CitationLocation,
  QuoteLevel,
} from '../types';

// =====================================================
// INTERFACES
// =====================================================

interface DocumentSearchResult {
  document_id: string;
  document_name: string;
  file_type: string;
  upload_date: string;
  relevance_rank: number;
  matched_content: string;
  page_number: number | null;
}

interface DocumentMetadata {
  id: string;
  name: string;
  file_type: string;
  raw_content: string | null;
  structured_data: any | null;
  pages_count: number | null;
  upload_date: string;
  authority_score: number;
}


// =====================================================
// SEARCH USER DOCUMENTS
// =====================================================

/**
 * Search user's uploaded documents for evidence
 *
 * @param query - Search query (e.g., "market size for SaaS in US")
 * @param userId - User ID
 * @param projectId - Project ID
 * @param limit - Maximum results to return
 * @returns Real sources from user documents
 */
export async function searchUserDocuments(
  query: string,
  userId: string,
  projectId: string,
  limit: number = 5
): Promise<RealSource[]> {
  try {
    // 1. Full-text search using database function
    const { data: searchResults, error: searchError } = await supabase
      .rpc('search_project_documents', {
        p_project_id: projectId,
        p_query: query,
        p_limit: limit,
      });

    if (searchError) {
      console.error('Error searching user documents:', searchError);
      return [];
    }

    if (!searchResults || searchResults.length === 0) {
      return [];
    }

    // 2. Get full document metadata for results
    const documentIds = searchResults.map((r: DocumentSearchResult) => r.document_id);

    const { data: documents, error: docError } = await supabase
      .from('project_documents')
      .select('id, name, file_type, raw_content, structured_data, pages_count, upload_date, authority_score')
      .in('id', documentIds);

    if (docError || !documents) {
      console.error('Error fetching document metadata:', docError);
      return [];
    }

    // 3. Build RealSource objects with citations
    const sources: RealSource[] = [];

    for (const result of searchResults as DocumentSearchResult[]) {
      const doc = documents.find((d: DocumentMetadata) => d.id === result.document_id);
      if (!doc) continue;

      // Extract quote from matched content
      const quote = extractQuoteFromHighlight(result.matched_content);

      sources.push({
        id: doc.id,
        name: doc.name,
        url: `#/document/${doc.id}`, // Internal reference
        type: 'user_document',

        title: doc.name,
        summary: quote,
        raw_content: doc.raw_content || undefined,

        domain: 'user_upload',
        country: undefined,
        language: undefined,

        published_date: doc.upload_date,
        last_updated: doc.upload_date,

        reliability_score: 100, // User docs always max reliability (user's own data)
        authority_score: doc.authority_score,

        file_type: doc.file_type as 'pdf' | 'csv' | 'xlsx' | 'txt',
        pages_count: doc.pages_count || undefined,
        upload_date: doc.upload_date,
      });
    }

    return sources;
  } catch (error) {
    console.error('Unexpected error in searchUserDocuments:', error);
    return [];
  }
}


// =====================================================
// EXTRACT CITATIONS
// =====================================================

/**
 * Extract precise citations from a user document
 *
 * @param source - The source document
 * @param query - Original search query
 * @returns Citations with exact locations
 */
export async function extractCitations(
  source: RealSource,
  query: string
): Promise<Citation[]> {
  if (source.type !== 'user_document') {
    throw new Error('extractCitations only works with user_document sources');
  }

  const citations: Citation[] = [];

  try {
    // Get full document
    const { data: doc, error } = await supabase
      .from('project_documents')
      .select('*')
      .eq('id', source.id)
      .single();

    if (error || !doc) {
      return citations;
    }

    // Different extraction based on file type
    switch (doc.file_type) {
      case 'pdf':
        return extractPDFCitations(doc, query);

      case 'csv':
      case 'xlsx':
        return extractSpreadsheetCitations(doc, query);

      case 'txt':
        return extractTextCitations(doc, query);

      default:
        return citations;
    }
  } catch (error) {
    console.error('Error extracting citations:', error);
    return citations;
  }
}


/**
 * Extract citations from PDF documents
 */
function extractPDFCitations(doc: any, query: string): Citation[] {
  const citations: Citation[] = [];

  if (!doc.raw_content) return citations;

  // Find all occurrences of query terms in the text
  const matches = findTextMatches(doc.raw_content, query);

  for (const match of matches.slice(0, 3)) {
    // Max 3 citations per source
    const location: CitationLocation = {
      type: 'pdf',
      page: estimatePageNumber(match.position, doc.raw_content, doc.pages_count || 1),
      paragraph: estimateParagraphNumber(match.position, doc.raw_content),
      start_char: match.position,
      end_char: match.position + match.text.length,
    };

    citations.push({
      source_id: doc.id,
      source_name: doc.name,
      source_type: 'user_document',
      url: `#/document/${doc.id}`,
      quote: match.text,
      quote_level: 'exact' as QuoteLevel,
      location,
      date_accessed: new Date().toISOString(),
      date_published: doc.upload_date,
      reliability_score: 100,
      relevance_score: match.relevance,
    });
  }

  return citations;
}


/**
 * Extract citations from spreadsheet documents (CSV, XLSX)
 */
function extractSpreadsheetCitations(doc: any, query: string): Citation[] {
  const citations: Citation[] = [];

  if (!doc.structured_data) return citations;

  // structured_data format: { sheets: [{ name: string, rows: any[][] }] }
  const data = doc.structured_data;

  if (data.sheets && Array.isArray(data.sheets)) {
    for (const sheet of data.sheets) {
      const matches = findRowMatches(sheet.rows, query);

      for (const match of matches.slice(0, 3)) {
        const location: CitationLocation = {
          type: 'spreadsheet',
          sheet: sheet.name || 'Sheet1',
          row: match.rowIndex + 1, // 1-indexed for user display
          column: match.columnLetter,
        };

        citations.push({
          source_id: doc.id,
          source_name: doc.name,
          source_type: 'user_document',
          url: `#/document/${doc.id}`,
          quote: match.text,
          quote_level: 'exact' as QuoteLevel,
          location,
          date_accessed: new Date().toISOString(),
          date_published: doc.upload_date,
          reliability_score: 100,
          relevance_score: match.relevance,
        });
      }
    }
  }

  return citations;
}


/**
 * Extract citations from plain text documents
 */
function extractTextCitations(doc: any, query: string): Citation[] {
  const citations: Citation[] = [];

  if (!doc.raw_content) return citations;

  const matches = findTextMatches(doc.raw_content, query);

  for (const match of matches.slice(0, 3)) {
    const location: CitationLocation = {
      type: 'document',
      paragraph: estimateParagraphNumber(match.position, doc.raw_content),
      line: estimateLineNumber(match.position, doc.raw_content),
      start_char: match.position,
      end_char: match.position + match.text.length,
    };

    citations.push({
      source_id: doc.id,
      source_name: doc.name,
      source_type: 'user_document',
      url: `#/document/${doc.id}`,
      quote: match.text,
      quote_level: 'exact' as QuoteLevel,
      location,
      date_accessed: new Date().toISOString(),
      date_published: doc.upload_date,
      reliability_score: 100,
      relevance_score: match.relevance,
    });
  }

  return citations;
}


// =====================================================
// HELPER FUNCTIONS
// =====================================================

interface TextMatch {
  text: string;
  position: number;
  relevance: number;
}

/**
 * Find text matches in content
 */
function findTextMatches(content: string, query: string): TextMatch[] {
  const matches: TextMatch[] = [];
  const terms = query.toLowerCase().split(/\s+/);

  // Simple sliding window approach
  const sentences = content.split(/[.!?]+/);

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i].trim();
    const lowerSentence = sentence.toLowerCase();

    // Count matching terms
    let matchCount = 0;
    for (const term of terms) {
      if (lowerSentence.includes(term)) {
        matchCount++;
      }
    }

    if (matchCount > 0) {
      // Calculate position
      const position = content.indexOf(sentence);

      // Include context (previous and next sentence)
      const context = [
        i > 0 ? sentences[i - 1].trim() : '',
        sentence,
        i < sentences.length - 1 ? sentences[i + 1].trim() : '',
      ]
        .filter(Boolean)
        .join('. ');

      matches.push({
        text: context,
        position,
        relevance: Math.round((matchCount / terms.length) * 100),
      });
    }
  }

  // Sort by relevance
  return matches.sort((a, b) => b.relevance - a.relevance);
}


interface RowMatch {
  text: string;
  rowIndex: number;
  columnLetter: string;
  relevance: number;
}

/**
 * Find matches in spreadsheet rows
 */
function findRowMatches(rows: any[][], query: string): RowMatch[] {
  const matches: RowMatch[] = [];
  const terms = query.toLowerCase().split(/\s+/);

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    for (let j = 0; j < row.length; j++) {
      const cell = String(row[j] || '');
      const lowerCell = cell.toLowerCase();

      let matchCount = 0;
      for (const term of terms) {
        if (lowerCell.includes(term)) {
          matchCount++;
        }
      }

      if (matchCount > 0) {
        matches.push({
          text: cell,
          rowIndex: i,
          columnLetter: getColumnLetter(j),
          relevance: Math.round((matchCount / terms.length) * 100),
        });
      }
    }
  }

  return matches.sort((a, b) => b.relevance - a.relevance);
}


/**
 * Estimate page number from character position
 */
function estimatePageNumber(position: number, content: string, totalPages: number): number {
  const ratio = position / content.length;
  return Math.max(1, Math.min(totalPages, Math.ceil(ratio * totalPages)));
}


/**
 * Estimate paragraph number from character position
 */
function estimateParagraphNumber(position: number, content: string): number {
  const beforeText = content.substring(0, position);
  const paragraphs = beforeText.split(/\n\n+/);
  return paragraphs.length;
}


/**
 * Estimate line number from character position
 */
function estimateLineNumber(position: number, content: string): number {
  const beforeText = content.substring(0, position);
  const lines = beforeText.split(/\n/);
  return lines.length;
}


/**
 * Convert column index to Excel-style letter (0 = A, 25 = Z, 26 = AA)
 */
function getColumnLetter(index: number): string {
  let letter = '';
  let num = index;

  while (num >= 0) {
    letter = String.fromCharCode((num % 26) + 65) + letter;
    num = Math.floor(num / 26) - 1;
  }

  return letter;
}


/**
 * Extract clean quote from PostgreSQL ts_headline output
 */
function extractQuoteFromHighlight(highlight: string): string {
  // ts_headline returns text with <b>...</b> tags around matches
  // Remove HTML tags and get first meaningful sentence
  const cleaned = highlight.replace(/<\/?b>/g, '');
  const sentences = cleaned.split(/[.!?]+/);

  return sentences[0]?.trim() || cleaned.substring(0, 200);
}
