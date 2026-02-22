/**
 * BRANDING PREVIEW SELECTOR
 *
 * Muestra las 3 opciones de branding generadas por IA:
 * - Logo (DALL-E)
 * - Colores (primario, secundario, accent)
 * - Tipografía
 * - Tagline
 *
 * Usuario selecciona una → Click "Aplicar" → Se guarda en DB y se deploya website
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useGenerativeBusiness } from '@/hooks/useGenerativeBusiness';
import { CheckCircle2, Loader2, Sparkles, Rocket } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BrandingOption {
  option: number;
  company_name: string;
  tagline: string;
  color_primary: string;
  color_secondary: string;
  color_accent: string;
  font_heading: string;
  font_body: string;
  logo_url: string;
  logo_prompt_used: string;
}

interface BrandingPreviewSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewId: string;
  options: BrandingOption[];
  onApprove?: (websiteUrl?: string) => void;
}

export function BrandingPreviewSelector({
  open,
  onOpenChange,
  previewId,
  options,
  onApprove,
}: BrandingPreviewSelectorProps) {
  const [selectedOption, setSelectedOption] = useState<number>(1);
  const { approvePreview, isApprovingPreview } = useGenerativeBusiness();

  const handleApprove = () => {
    approvePreview(
      { previewId, selectedOption },
      {
        onSuccess: (data) => {
          onOpenChange(false);
          if (onApprove) onApprove(data.website_url);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <DialogTitle className="text-2xl">Elige tu Branding</DialogTitle>
              <DialogDescription>
                La IA generó 3 opciones. Selecciona la que más te guste.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-6">
          {options.map((option) => (
            <Card
              key={option.option}
              className={cn(
                'cursor-pointer transition-all hover:shadow-lg',
                selectedOption === option.option &&
                  'border-primary border-2 shadow-lg ring-2 ring-primary/20'
              )}
              onClick={() => setSelectedOption(option.option)}
            >
              <CardContent className="p-4 space-y-4">
                {/* Header with selection indicator */}
                <div className="flex items-center justify-between">
                  <Badge variant={selectedOption === option.option ? 'default' : 'secondary'}>
                    Opción {option.option}
                  </Badge>
                  {selectedOption === option.option && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </div>

                {/* Logo */}
                <div className="aspect-square rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                  {option.logo_url ? (
                    <img
                      src={option.logo_url}
                      alt={`Logo ${option.option}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl font-bold text-muted-foreground">
                      {option.company_name.charAt(0)}
                    </div>
                  )}
                </div>

                {/* Company Name */}
                <div className="text-center">
                  <h3
                    className="text-xl font-bold mb-1"
                    style={{ fontFamily: option.font_heading }}
                  >
                    {option.company_name}
                  </h3>
                  <p
                    className="text-sm text-muted-foreground"
                    style={{ fontFamily: option.font_body }}
                  >
                    {option.tagline}
                  </p>
                </div>

                {/* Colors */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground">Paleta de colores:</p>
                  <div className="flex gap-2">
                    <div
                      className="flex-1 h-10 rounded border"
                      style={{ backgroundColor: option.color_primary }}
                      title={`Primary: ${option.color_primary}`}
                    />
                    <div
                      className="flex-1 h-10 rounded border"
                      style={{ backgroundColor: option.color_secondary }}
                      title={`Secondary: ${option.color_secondary}`}
                    />
                    <div
                      className="flex-1 h-10 rounded border"
                      style={{ backgroundColor: option.color_accent }}
                      title={`Accent: ${option.color_accent}`}
                    />
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground">Tipografía:</p>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span>Títulos:</span>
                      <span className="font-semibold" style={{ fontFamily: option.font_heading }}>
                        {option.font_heading}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cuerpo:</span>
                      <span style={{ fontFamily: option.font_body }}>{option.font_body}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApprovingPreview}>
            Cancelar
          </Button>
          <Button onClick={handleApprove} disabled={isApprovingPreview} size="lg">
            {isApprovingPreview ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Aplicando y deployando...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Aplicar Opción {selectedOption}
              </>
            )}
          </Button>
        </DialogFooter>

        {isApprovingPreview && (
          <div className="mt-4 p-4 rounded-lg bg-primary/10 border border-primary/20">
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-semibold">Guardando en base de datos...</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-semibold">Generando website HTML...</span>
              </div>
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                <span className="font-semibold">Deployando a Vercel...</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Esto puede tomar 30-60 segundos. No cierres esta ventana.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
