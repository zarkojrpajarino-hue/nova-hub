import { ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { getDriveTypeName, type DriveUrlInfo } from '@/lib/driveUtils';

interface EvidencePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  embedUrl: string;
  type: DriveUrlInfo['type'];
  originalUrl?: string;
}

export function EvidencePreviewModal({ 
  open, 
  onOpenChange, 
  embedUrl, 
  type,
  originalUrl 
}: EvidencePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-border flex flex-row items-center justify-between">
          <DialogTitle className="text-base">
            Vista previa - {getDriveTypeName(type)}
          </DialogTitle>
          {originalUrl && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(originalUrl, '_blank')}
            >
              <ExternalLink className="w-3 h-3 mr-1" />
              Abrir en Drive
            </Button>
          )}
        </DialogHeader>
        
        <div className="flex-1 bg-muted">
          <iframe
            src={embedUrl}
            className="w-full h-full border-0"
            allow="autoplay"
            title="Vista previa del documento"
          />
        </div>

        {/* Mensaje de fallback */}
        <div className="p-3 bg-muted/50 text-center text-xs text-muted-foreground border-t border-border">
          Si no ves el contenido, verifica que el documento esté compartido como "Cualquier persona con el enlace"
        </div>
      </DialogContent>
    </Dialog>
  );
}
