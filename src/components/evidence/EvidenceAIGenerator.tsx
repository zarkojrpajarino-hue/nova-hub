/**
 * Evidence AI Generator
 *
 * Complete integration: Pre-modal → Search → Generate → Report → Strict Mode
 * Main component for AI generation with evidence system
 *
 * OPTIMIZED: Soporta Evidence Profiles para personalización por dominio
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PreGenerationModal, type GenerationConfig } from './PreGenerationModal';
import { EvidenceReport } from './EvidenceReport';
import { StrictModeExitDialog } from './StrictModeExitDialog';
import { useEvidenceGeneration } from '@/hooks/useEvidenceGeneration';
import { Loader2, Sparkles } from 'lucide-react';
import { type EvidenceProfileType, inferProfileFromFunction } from '@/lib/evidence/profiles';
import type { AIOutputWithEvidence } from '@/lib/evidence/types';

interface EvidenceAIGeneratorProps {
  /** Nombre de la función edge que se llamará */
  functionName: string;

  /** ID del proyecto actual */
  projectId: string;

  /** ID del usuario actual */
  userId: string;

  /** Texto del botón de generación */
  buttonLabel?: string;

  /** Evidence profile a usar (auto-detectado si no se provee) */
  evidenceProfile?: EvidenceProfileType;

  /** Parámetros adicionales para pasar al Edge Function */
  additionalParams?: Record<string, unknown>;

  /** Callback cuando la generación completa */
  onGenerationComplete?: (result: AIOutputWithEvidence) => void;

  /** Callback si hay un error */
  onError?: (error: Error) => void;

  /** Tamaño del botón */
  buttonSize?: 'sm' | 'default' | 'lg';

  /** Variante del botón */
  buttonVariant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'link';

  /** Clase CSS adicional para el botón */
  buttonClassName?: string;
}

export function EvidenceAIGenerator({
  functionName,
  projectId,
  userId,
  buttonLabel = 'Generate with AI',
  evidenceProfile,
  additionalParams,
  onGenerationComplete,
  onError,
  buttonSize = 'default',
  buttonVariant = 'default',
  buttonClassName,
}: EvidenceAIGeneratorProps) {
  const [showPreModal, setShowPreModal] = useState(false);
  const [showReport, setShowReport] = useState(false);

  // Auto-detect profile if not provided
  const activeProfile = evidenceProfile || inferProfileFromFunction(functionName);

  const {
    defaultEvidenceMode,
    isSearching,
    isGenerating,
    generationResult,
    strictModeBlocked,
    exitOptions,
    generateWithEvidence,
    handleStrictModeExit,
  } = useEvidenceGeneration({
    functionName,
    projectId,
    userId,
    evidenceProfile: activeProfile,
  });

  async function handleGenerate(config: GenerationConfig) {
    setShowPreModal(false);

    try {
      const result = await generateWithEvidence(config, additionalParams);

      if (result) {
        setShowReport(true);
        onGenerationComplete?.(result);
      }
    } catch (error) {
      console.error('[EvidenceAIGenerator] Error:', error);
      onError?.(error as Error);
    }
  }

  async function handleStrictExit(action: 'search_more' | 'continue_as_hypothesis' | 'cancel') {
    const result = await handleStrictModeExit(action);

    if (result) {
      setShowReport(true);
      onGenerationComplete?.(result);
    }
  }

  return (
    <div>
      {/* Trigger Button */}
      <Button
        onClick={() => setShowPreModal(true)}
        disabled={isSearching || isGenerating}
        size={buttonSize}
        variant={buttonVariant}
        className={buttonClassName || 'w-full'}
      >
        {(isSearching || isGenerating) ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isSearching ? 'Buscando evidencias...' : 'Generando...'}
          </>
        ) : (
          <>
            <Sparkles className="mr-2 h-4 w-4" />
            {buttonLabel}
          </>
        )}
      </Button>

      {/* Pre-Generation Modal */}
      <PreGenerationModal
        open={showPreModal}
        onOpenChange={setShowPreModal}
        functionName={functionName}
        evidenceMode={defaultEvidenceMode}
        onGenerate={handleGenerate}
      />

      {/* Strict Mode Exit Dialog */}
      {strictModeBlocked && exitOptions && (
        <StrictModeExitDialog
          open={strictModeBlocked}
          options={exitOptions}
          onAction={handleStrictExit}
        />
      )}

      {/* Evidence Report */}
      {showReport && generationResult && (
        <div className="mt-6">
          <EvidenceReport
            generationId={generationResult.generation_id}
            functionName={generationResult.function_name}
            sourcesPlanned={generationResult.sources_planned}
            sourcesFound={generationResult.sources_found}
            sources={generationResult.sources_used}
            claims={generationResult.claims}
            evidenceStatus={generationResult.evidence_status}
            coveragePercentage={generationResult.coverage_percentage}
            conflicts={generationResult.conflicts}
            searchDurationMs={generationResult.search_duration_ms}
          />
        </div>
      )}
    </div>
  );
}
