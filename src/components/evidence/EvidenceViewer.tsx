import { useState } from 'react';
import { ExternalLink, Eye, AlertTriangle, FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { parseDriveUrl, getDriveTypeIcon, getDriveTypeName } from '@/lib/driveUtils';
import { EvidencePreviewModal } from './EvidencePreviewModal';

import { useTranslation } from 'react-i18next';
interface EvidenceViewerProps {
  url: string | null;
  compact?: boolean;
}

export function EvidenceViewer({ url, compact = false }: EvidenceViewerProps) {
  const { t } = useTranslation();
  const [showPreview, setShowPreview] = useState(false);

  if (!url) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FileQuestion className="w-4 h-4" />
        <span>{t('evidence.sinEvidenciaAdjunta')}</span>
      </div>
    );
  }

  const urlInfo = parseDriveUrl(url);

  if (!urlInfo.isValid) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
        >
          <AlertTriangle className="w-4 h-4 text-warning" />
          Ver enlace (formato no reconocido)
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(true)}
        >
          <span className="mr-1">{getDriveTypeIcon(urlInfo.type)}</span>{t('evidence.verEvidencia')}</Button>
        
        <EvidencePreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          embedUrl={urlInfo.embedUrl!}
          type={urlInfo.type}
          originalUrl={url}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Info del documento */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-lg">{getDriveTypeIcon(urlInfo.type)}</span>
        <span className="text-muted-foreground">{getDriveTypeName(urlInfo.type)}</span>
      </div>

      {/* Botones de acción */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowPreview(true)}
        >
          <Eye className="w-4 h-4 mr-1" />{t('evidence.vistaPrevia')}</Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.open(url, '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-1" />{t('evidence.abrirEnDrive')}</Button>
      </div>

      {/* Modal */}
      <EvidencePreviewModal
        open={showPreview}
        onOpenChange={setShowPreview}
        embedUrl={urlInfo.embedUrl!}
        type={urlInfo.type}
        originalUrl={url}
      />
    </div>
  );
}
