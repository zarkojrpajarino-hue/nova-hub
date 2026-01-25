import { describe, it, expect } from 'vitest';
import { parseDriveUrl, getDriveTypeIcon, getDriveTypeName } from './driveUtils';

describe('driveUtils', () => {
  describe('parseDriveUrl', () => {
    it('parses Google Drive file URL', () => {
      const result = parseDriveUrl('https://drive.google.com/file/d/abc123/view');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('file');
      expect(result.fileId).toBe('abc123');
    });

    it('parses Google Docs URL', () => {
      const result = parseDriveUrl('https://docs.google.com/document/d/doc123/edit');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('doc');
      expect(result.fileId).toBe('doc123');
    });

    it('parses Google Sheets URL', () => {
      const result = parseDriveUrl('https://docs.google.com/spreadsheets/d/sheet123/edit');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('sheet');
      expect(result.fileId).toBe('sheet123');
    });

    it('parses Google Slides URL', () => {
      const result = parseDriveUrl('https://docs.google.com/presentation/d/slide123/edit');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('slide');
      expect(result.fileId).toBe('slide123');
    });

    it('parses Google Forms URL', () => {
      const result = parseDriveUrl('https://docs.google.com/forms/d/form123/edit');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('form');
      expect(result.fileId).toBe('form123');
    });

    it('parses Google Drive folder URL', () => {
      const result = parseDriveUrl('https://drive.google.com/drive/folders/folder123');
      expect(result.isValid).toBe(true);
      expect(result.type).toBe('folder');
      expect(result.fileId).toBe('folder123');
    });

    it('returns error for empty URL', () => {
      const result = parseDriveUrl('');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('URL vacía');
    });

    it('returns error for non-Google URL', () => {
      const result = parseDriveUrl('https://example.com');
      expect(result.isValid).toBe(false);
      expect(result.errorMessage).toBe('No es una URL de Google Drive válida');
    });

    it('generates preview URL for files', () => {
      const result = parseDriveUrl('https://drive.google.com/file/d/abc123/view');
      expect(result.previewUrl).toContain('preview');
    });

    it('generates embed URL for files', () => {
      const result = parseDriveUrl('https://drive.google.com/file/d/abc123/view');
      expect(result.embedUrl).toContain('preview');
    });
  });

  describe('getDriveTypeIcon', () => {
    it('returns correct icon for doc', () => {
      expect(getDriveTypeIcon('doc')).toBe('📄');
    });

    it('returns correct icon for sheet', () => {
      expect(getDriveTypeIcon('sheet')).toBe('📊');
    });

    it('returns correct icon for slide', () => {
      expect(getDriveTypeIcon('slide')).toBe('📽️');
    });

    it('returns correct icon for form', () => {
      expect(getDriveTypeIcon('form')).toBe('📝');
    });

    it('returns correct icon for folder', () => {
      expect(getDriveTypeIcon('folder')).toBe('📁');
    });

    it('returns correct icon for file', () => {
      expect(getDriveTypeIcon('file')).toBe('📎');
    });

    it('returns default icon for unknown', () => {
      expect(getDriveTypeIcon('unknown')).toBe('🔗');
    });
  });

  describe('getDriveTypeName', () => {
    it('returns correct name for doc', () => {
      expect(getDriveTypeName('doc')).toBe('Google Doc');
    });

    it('returns correct name for sheet', () => {
      expect(getDriveTypeName('sheet')).toBe('Google Sheet');
    });

    it('returns correct name for slide', () => {
      expect(getDriveTypeName('slide')).toBe('Google Slides');
    });

    it('returns correct name for form', () => {
      expect(getDriveTypeName('form')).toBe('Google Form');
    });

    it('returns correct name for folder', () => {
      expect(getDriveTypeName('folder')).toBe('Carpeta');
    });

    it('returns correct name for file', () => {
      expect(getDriveTypeName('file')).toBe('Archivo');
    });

    it('returns default name for unknown', () => {
      expect(getDriveTypeName('unknown')).toBe('Enlace');
    });
  });
});
