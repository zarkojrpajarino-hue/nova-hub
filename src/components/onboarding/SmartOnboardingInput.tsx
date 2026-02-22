/**
 * SMART ONBOARDING INPUT
 *
 * Input inteligente que extrae información de URLs con IA
 * y pre-rellena el formulario de onboarding
 */

import { useState } from 'react';
import { Sparkles, Link2, Loader2, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useAIOnboarding } from '@/hooks/useAIOnboarding';
import { ADAPTIVE_QUESTIONS, type ProjectPhase, type ContextType } from '@/types/ai-onboarding';
import { cn } from '@/lib/utils';

interface SmartOnboardingInputProps {
  projectPhase: ProjectPhase;
  onDataExtracted?: (data: any) => void;
  currentFormData?: any;
  className?: string;
}

export function SmartOnboardingInput({
  projectPhase,
  onDataExtracted,
  currentFormData = {},
  className,
}: SmartOnboardingInputProps) {
  const [url, setUrl] = useState('');
  const [contextType, setContextType] = useState<ContextType>('own_business');
  const { isLoading, isSuccess, isError, data, error, extractInfo, applyData } = useAIOnboarding();

  const config = ADAPTIVE_QUESTIONS[projectPhase];

  const handleExtract = () => {
    if (!url.trim()) return;

    extractInfo(url, projectPhase, contextType);
  };

  const handleApplyData = () => {
    if (!data) return;

    const mergedData = applyData(data, currentFormData);
    onDataExtracted?.(mergedData);
  };

  const isValidUrl = (str: string) => {
    try {
      new URL(str);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div className={cn('space-y-4 p-6 rounded-xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5', className)}>
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            Onboarding Inteligente con IA
            <Badge variant="secondary" className="text-xs">
              Beta
            </Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Pega una URL y la IA extraerá información automáticamente
          </p>
        </div>
      </div>

      {/* Context Type Selector */}
      <div className="space-y-2">
        <Label htmlFor="context-type">¿Qué tipo de información es?</Label>
        <Select value={contextType} onValueChange={(v) => setContextType(v as ContextType)}>
          <SelectTrigger id="context-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {config.contextOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex flex-col items-start">
                  <span className="font-medium">{option.label}</span>
                  <span className="text-xs text-muted-foreground">{option.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* URL Input */}
      <div className="space-y-2">
        <Label htmlFor="url-input">{config.urlLabel}</Label>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="url-input"
              type="url"
              placeholder={config.urlPlaceholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="pl-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isValidUrl(url)) {
                  handleExtract();
                }
              }}
            />
          </div>
          <Button
            onClick={handleExtract}
            disabled={isLoading || !isValidUrl(url)}
            className="gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analizando...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extraer
              </>
            )}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground flex items-start gap-1">
          <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {config.urlHint}
        </p>
      </div>

      {/* Loading State */}
      {isLoading && (
        <Alert className="border-blue-500/20 bg-blue-500/5">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <AlertDescription className="text-sm">
            Analizando la página web con IA... Esto puede tardar unos segundos.
          </AlertDescription>
        </Alert>
      )}

      {/* Error State */}
      {isError && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription className="text-sm">
            {error || 'No se pudo extraer información de esta URL'}
          </AlertDescription>
        </Alert>
      )}

      {/* Success State */}
      {isSuccess && data && (
        <div className="space-y-3">
          <Alert className="border-green-500/20 bg-green-500/5">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <AlertDescription className="text-sm">
              ¡Información extraída exitosamente! Revisa los campos sugeridos abajo.
            </AlertDescription>
          </Alert>

          {/* Extracted Data Preview */}
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm font-medium">Información detectada:</p>
            <div className="space-y-1 text-sm">
              {data.nombre_sugerido && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Nombre:</span>
                  <span className="font-medium">{data.nombre_sugerido}</span>
                </div>
              )}
              {data.industria && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Industria:</span>
                  <span className="font-medium">{data.industria}</span>
                </div>
              )}
              {data.modelo_negocio && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Modelo:</span>
                  <span className="font-medium">{data.modelo_negocio}</span>
                </div>
              )}
              {data.descripcion && (
                <div className="flex gap-2">
                  <span className="text-muted-foreground min-w-[100px]">Descripción:</span>
                  <span className="text-muted-foreground text-xs">{data.descripcion}</span>
                </div>
              )}
            </div>

            {/* AI Insights */}
            {data.insights && data.insights.length > 0 && (
              <div className="mt-3 pt-3 border-t space-y-2">
                <p className="text-sm font-medium flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Insights de la IA:
                </p>
                <ul className="space-y-1">
                  {data.insights.map((insight, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground flex gap-2">
                      <span className="text-primary">•</span>
                      <span>{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Apply Button */}
            <div className="pt-3">
              <Button
                onClick={handleApplyData}
                className="w-full gap-2"
                variant="default"
              >
                <CheckCircle className="w-4 h-4" />
                Aplicar Información al Formulario
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
