/**
 * OptimusFeedback — P8.V2.3
 *
 * Thumbs up/down + categoría opcional para recomendaciones de Optimus.
 * Diseñado para vivir al pie de cualquier card que muestre output de Optimus.
 *
 * Flujo:
 *   1. Founder pulsa 👍 o 👎 → voto registrado inmediatamente.
 *   2. Si 👎 → aparece selector de categoría (opcional, dismissible).
 *   3. Feedback enviado a optimus_feedback_events via Supabase.
 *
 * Props mínimas: projectId, userId, primaryAction
 * Props opcionales: primaryBlock, optimusMode, confidence (contexto del output)
 */

import { useState } from 'react';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

import { useTranslation } from 'react-i18next';
interface OptimusFeedbackProps {
  projectId: string;
  userId: string;
  primaryAction: string;
  primaryBlock?: string | null;
  optimusMode?: string | null;
  confidence?: string | null;
  /** Callback opcional tras envío exitoso */
  onSubmit?: (vote: 'up' | 'down') => void;
}

function getDOWN_CATEGORIES(t: (k: string) => string) {
  return [
  { id: 'too_obvious',     label: t('project.yaLoSé') },
  { id: 'wrong_context',   label: t('project.noAplicaAMi') },
  { id: 'not_actionable',  label: t('project.noPuedoActuarSobre') },
  { id: 'disagree',        label: t('project.noEstoyDeAcuerdo') },
  { id: 'other',           label: t('project.otro') },
];
}

export function OptimusFeedback({
  projectId,
  userId,
  primaryAction,
  primaryBlock,
  optimusMode,
  confidence,
  onSubmit,
}: OptimusFeedbackProps) {
  const { t } = useTranslation();
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const [_category, setCategory] = useState<string | null>(null);
  const [showCategories, setShowCategories] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (v: 'up' | 'down', cat?: string | null) => {
    if (submitted || loading) return;
    setLoading(true);
    try {
      await supabase.from('optimus_feedback_events').insert({
        project_id:    projectId,
        user_id:       userId,
        primary_action: primaryAction,
        primary_block: primaryBlock ?? null,
        optimus_mode:  optimusMode ?? null,
        confidence:    confidence ?? null,
        vote:          v,
        category:      cat ?? null,
      });
      setSubmitted(true);
      onSubmit?.(v);
    } catch {
      // silencioso — feedback no es crítico
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (v: 'up' | 'down') => {
    setVote(v);
    if (v === 'up') {
      await submit(v);
    } else {
      // Mostrar categorías antes de guardar el voto negativo
      setShowCategories(true);
    }
  };

  const handleCategory = async (cat: string) => {
    setCategory(cat);
    setShowCategories(false);
    await submit('down', cat);
  };

  const handleSkipCategory = async () => {
    setShowCategories(false);
    await submit('down', null);
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        {vote === 'up'
          ? <ThumbsUp size={12} className="text-green-500" />
          : <ThumbsDown size={12} className="text-amber-500" />
        }
        <span>{t('project.graciasPorElFeedback')}</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Vote buttons */}
      <div className="flex items-center gap-2">
        <span className="text-[11px] text-muted-foreground">{t('project.útil')}</span>
        <button
          onClick={() => handleVote('up')}
          disabled={loading}
          className={cn(
            'p-1 rounded transition-colors',
            vote === 'up'
              ? 'text-green-600 bg-green-500/10'
              : 'text-muted-foreground hover:text-green-600 hover:bg-green-500/10',
          )}
          aria-label={t('project.útil0')}
        >
          <ThumbsUp size={14} />
        </button>
        <button
          onClick={() => handleVote('down')}
          disabled={loading}
          className={cn(
            'p-1 rounded transition-colors',
            vote === 'down' && !showCategories
              ? 'text-amber-600 bg-amber-500/10'
              : 'text-muted-foreground hover:text-amber-600 hover:bg-amber-500/10',
          )}
          aria-label={t('project.noÚtil')}
        >
          <ThumbsDown size={14} />
        </button>
      </div>

      {/* Category picker — solo cuando vote='down' */}
      {showCategories && (
        <div className="rounded-lg border border-border bg-background p-3 space-y-2 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground font-medium">{t('project.porQuéNoFue')}</span>
            <button
              onClick={handleSkipCategory}
              className="text-muted-foreground hover:text-foreground"
              aria-label={t('project.omitir')}
            >
              <X size={12} />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {getDOWN_CATEGORIES(t).map(cat => (
              <Button
                key={cat.id}
                variant="outline"
                size="sm"
                className="h-6 px-2 text-[11px]"
                onClick={() => handleCategory(cat.id)}
                disabled={loading}
              >
                {cat.label}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
