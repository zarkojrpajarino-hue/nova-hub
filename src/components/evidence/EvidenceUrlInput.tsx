import { useState, useEffect } from 'react';
import { Check, AlertCircle, ExternalLink, Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { parseDriveUrl, getDriveTypeIcon, getDriveTypeName, type DriveUrlInfo } from '@/lib/driveUtils';
import { cn } from '@/lib/utils';
import { EvidencePreviewModal } from './EvidencePreviewModal';

interface EvidenceUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export function EvidenceUrlInput({ 
  value, 
  onChange, 
  label = 'Evidencia (URL Google Drive)',
  required = false 
}: EvidenceUrlInputProps) {
  const [urlInfo, setUrlInfo] = useState<DriveUrlInfo | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (value) {
      const info = parseDriveUrl(value);
      setUrlInfo(info);
    } else {
      setUrlInfo(null);
    }
  }, [value]);

  const hasValue = value.trim().length > 0;
  const isValid = urlInfo?.isValid ?? false;

  return (
    <div className="space-y-2">
      <Label className="flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      
      <div className="relative">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://drive.google.com/file/d/... o https://docs.google.com/..."
          className={cn(
            "pr-10",
            hasValue && isValid && "border-success focus-visible:ring-success",
            hasValue && !isValid && "border-destructive focus-visible:ring-destructive"
          )}
        />
        
        {/* Indicador de estado */}
        {hasValue && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {isValid ? (
              <Check className="w-4 h-4 text-success" />
            ) : (
              <AlertCircle className="w-4 h-4 text-destructive" />
            )}
          </div>
        )}
      </div>

      {/* Mensaje de error o información del tipo */}
      {hasValue && (
        <div className={cn(
          "text-xs flex items-center gap-2",
          isValid ? "text-success" : "text-destructive"
        )}>
          {isValid ? (
            <>
              <span>{getDriveTypeIcon(urlInfo!.type)}</span>
              <span>{getDriveTypeName(urlInfo!.type)} detectado</span>
            </>
          ) : (
            <span>{urlInfo?.errorMessage}</span>
          )}
        </div>
      )}

      {/* Acciones cuando es válido */}
      {hasValue && isValid && urlInfo?.previewUrl && (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(true)}
          >
            <Eye className="w-3 h-3 mr-1" />
            Vista previa
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.open(value, '_blank')}
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Abrir en Drive
          </Button>
        </div>
      )}

      {/* Ayuda */}
      {!hasValue && (
        <p className="text-xs text-muted-foreground">
          Sube tu evidencia a Google Drive, haz clic en "Compartir" → "Cualquier persona con el enlace" y pega aquí
        </p>
      )}

      {/* Modal de preview */}
      {urlInfo?.embedUrl && (
        <EvidencePreviewModal
          open={showPreview}
          onOpenChange={setShowPreview}
          embedUrl={urlInfo.embedUrl}
          type={urlInfo.type}
          originalUrl={value}
        />
      )}
    </div>
  );
}
