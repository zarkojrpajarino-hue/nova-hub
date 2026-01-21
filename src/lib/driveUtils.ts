// Utilidades para validar y procesar URLs de Google Drive

export interface DriveUrlInfo {
  isValid: boolean;
  type: 'file' | 'folder' | 'doc' | 'sheet' | 'slide' | 'form' | 'unknown';
  fileId: string | null;
  previewUrl: string | null;
  embedUrl: string | null;
  errorMessage: string | null;
}

/**
 * Extrae información de una URL de Google Drive
 */
export function parseDriveUrl(url: string): DriveUrlInfo {
  if (!url || !url.trim()) {
    return {
      isValid: false,
      type: 'unknown',
      fileId: null,
      previewUrl: null,
      embedUrl: null,
      errorMessage: 'URL vacía',
    };
  }

  const trimmedUrl = url.trim();

  // Patrones de Google Drive/Docs
  const patterns = [
    // Google Drive file: drive.google.com/file/d/{fileId}/view
    { regex: /drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/, type: 'file' as const },
    // Google Drive folder: drive.google.com/drive/folders/{folderId}
    { regex: /drive\.google\.com\/drive\/folders\/([a-zA-Z0-9_-]+)/, type: 'folder' as const },
    // Google Drive open: drive.google.com/open?id={fileId}
    { regex: /drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/, type: 'file' as const },
    // Google Docs: docs.google.com/document/d/{docId}
    { regex: /docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/, type: 'doc' as const },
    // Google Sheets: docs.google.com/spreadsheets/d/{sheetId}
    { regex: /docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, type: 'sheet' as const },
    // Google Slides: docs.google.com/presentation/d/{slideId}
    { regex: /docs\.google\.com\/presentation\/d\/([a-zA-Z0-9_-]+)/, type: 'slide' as const },
    // Google Forms: docs.google.com/forms/d/{formId}
    { regex: /docs\.google\.com\/forms\/d\/([a-zA-Z0-9_-]+)/, type: 'form' as const },
  ];

  for (const pattern of patterns) {
    const match = trimmedUrl.match(pattern.regex);
    if (match && match[1]) {
      const fileId = match[1];
      return {
        isValid: true,
        type: pattern.type,
        fileId,
        previewUrl: getPreviewUrl(fileId, pattern.type),
        embedUrl: getEmbedUrl(fileId, pattern.type),
        errorMessage: null,
      };
    }
  }

  // Verificar si al menos es un dominio de Google
  if (trimmedUrl.includes('google.com') || trimmedUrl.includes('googleapis.com')) {
    return {
      isValid: false,
      type: 'unknown',
      fileId: null,
      previewUrl: null,
      embedUrl: null,
      errorMessage: 'URL de Google no reconocida. Usa el botón "Compartir" y copia el enlace.',
    };
  }

  return {
    isValid: false,
    type: 'unknown',
    fileId: null,
    previewUrl: null,
    embedUrl: null,
    errorMessage: 'No es una URL de Google Drive válida',
  };
}

function getPreviewUrl(fileId: string, type: DriveUrlInfo['type']): string {
  switch (type) {
    case 'file':
      return `https://drive.google.com/file/d/${fileId}/preview`;
    case 'doc':
      return `https://docs.google.com/document/d/${fileId}/preview`;
    case 'sheet':
      return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
    case 'slide':
      return `https://docs.google.com/presentation/d/${fileId}/preview`;
    case 'form':
      return `https://docs.google.com/forms/d/${fileId}/viewform?embedded=true`;
    default:
      return `https://drive.google.com/file/d/${fileId}/preview`;
  }
}

function getEmbedUrl(fileId: string, type: DriveUrlInfo['type']): string {
  switch (type) {
    case 'file':
      return `https://drive.google.com/file/d/${fileId}/preview`;
    case 'doc':
      return `https://docs.google.com/document/d/${fileId}/preview`;
    case 'sheet':
      return `https://docs.google.com/spreadsheets/d/${fileId}/preview`;
    case 'slide':
      return `https://docs.google.com/presentation/d/${fileId}/embed`;
    case 'form':
      return `https://docs.google.com/forms/d/${fileId}/viewform?embedded=true`;
    default:
      return `https://drive.google.com/file/d/${fileId}/preview`;
  }
}

/**
 * Obtiene el icono según el tipo de documento
 */
export function getDriveTypeIcon(type: DriveUrlInfo['type']): string {
  switch (type) {
    case 'doc': return '📄';
    case 'sheet': return '📊';
    case 'slide': return '📽️';
    case 'form': return '📝';
    case 'folder': return '📁';
    case 'file': return '📎';
    default: return '🔗';
  }
}

/**
 * Obtiene el nombre legible del tipo
 */
export function getDriveTypeName(type: DriveUrlInfo['type']): string {
  switch (type) {
    case 'doc': return 'Google Doc';
    case 'sheet': return 'Google Sheet';
    case 'slide': return 'Google Slides';
    case 'form': return 'Google Form';
    case 'folder': return 'Carpeta';
    case 'file': return 'Archivo';
    default: return 'Enlace';
  }
}
