import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useCanUpload } from '@/hooks/useValidationSystem';
import { cn } from '@/lib/utils';
import { useOBVFormLogic } from './useOBVFormLogic';
import { OBVStep1Type } from './OBVStep1Type';
import { OBVStep2Project } from './OBVStep2Project';
import { OBVStep3BasicInfo } from './OBVStep3BasicInfo';
import { OBVStep4Lead } from './OBVStep4Lead';
import { OBVStep5SaleDetails } from './OBVStep5SaleDetails';
import { OBVStep6Evidence } from './OBVStep6Evidence';
import { useMemberStats, useProjects } from '@/hooks/useNovaDataOptimized';
import { toast } from 'sonner';

import { useTranslation } from 'react-i18next';
interface OBVFormContainerProps {
  onCancel: () => void;
  onSuccess: () => void;
}

const OBV_DRAFT_KEY = 'optimus_obv_form_draft';

export function OBVFormContainer({ onCancel, onSuccess }: OBVFormContainerProps) {
  const { t } = useTranslation();
  const { isBlocked } = useCanUpload();
  const { data: members = [] } = useMemberStats();
  const { data: projects = [] } = useProjects();

  const {
    step,
    isSubmitting,
    formData,
    setFormData,
    isVenta,
    totalSteps,
    userProjects,
    projectLeads,
    projectMembersList,
    updateSaleCalculations,
    canProceed,
    handleNext,
    handleBack,
    addParticipant,
    removeParticipant,
    updateParticipantPercentage,
    handleSubmit: originalHandleSubmit,
  } = useOBVFormLogic(() => {
    // Clear draft on success
    localStorage.removeItem(OBV_DRAFT_KEY);
    onSuccess();
  });

  // V5.4.1 — Track if form has been modified (dirty check)
  const initialFormRef = useRef(JSON.stringify(formData));
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isFormDirty = useCallback(() => {
    return JSON.stringify(formData) !== initialFormRef.current;
  }, [formData]);

  // V5.4.1 — Persist form state to localStorage on each step change
  useEffect(() => {
    localStorage.setItem(OBV_DRAFT_KEY, JSON.stringify({ formData, step }));
  }, [step, formData]);

  // V5.4.1 — Recover draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(OBV_DRAFT_KEY);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.formData) {
          setFormData(draft.formData);
          toast.info(t('obvForm.draftRecovered'));
        }
      }
    } catch {
      // Ignore invalid draft
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // V5.4.1 — Cancel with confirmation if dirty
  const handleCancel = () => {
    if (isFormDirty()) {
      setShowCancelConfirm(true);
    } else {
      localStorage.removeItem(OBV_DRAFT_KEY);
      onCancel();
    }
  };

  const confirmCancel = () => {
    localStorage.removeItem(OBV_DRAFT_KEY);
    setShowCancelConfirm(false);
    onCancel();
  };

  // V5.4.2 — Step validation errors tracking
  const [stepErrors, setStepErrors] = useState<Set<number>>(new Set());

  // V5.4.2 — Re-validate current step when trying to move next
  const handleNextWithValidation = () => {
    if (!canProceed()) {
      setStepErrors(prev => new Set(prev).add(step));
      return;
    }
    // Clear error for current step if it passes
    setStepErrors(prev => {
      const next = new Set(prev);
      next.delete(step);
      return next;
    });
    handleNext();
  };

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
      <div className="p-5 border-b border-border">
        <h3 className="font-semibold">Nueva OBV</h3>
      </div>

      <div className="p-6">
        {/* Blocked warning */}
        {isBlocked && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('obv.estásBloqueado')}</AlertTitle>
            <AlertDescription>{t('obv.noPuedesSubirObvs')}</AlertDescription>
          </Alert>
        )}

        {/* Steps indicator — V5.4.2: show error badge on step */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-all relative",
                s === step ? "bg-primary text-primary-foreground" :
                  s < step ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
              )}>
                {s < step ? <Check size={16} /> : s}
                {/* V5.4.2 — Error badge */}
                {stepErrors.has(s) && (
                  <span
                    className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-destructive border border-card"
                    title={t('obvForm.stepHasErrors')}
                  />
                )}
              </div>
              {i < totalSteps - 1 && (
                <div className={cn("w-10 h-0.5", s < step ? "bg-success" : "bg-border")} />
              )}
            </div>
          ))}
        </div>

        {/* Step Content */}
        {step === 1 && (
          <OBVStep1Type
            formData={formData}
            onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          />
        )}

        {step === 2 && (
          <OBVStep2Project
            formData={formData}
            userProjects={userProjects}
            onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          />
        )}

        {step === 3 && (
          <OBVStep3BasicInfo
            formData={formData}
            onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          />
        )}

        {step === 4 && (
          <OBVStep4Lead
            formData={formData}
            projectLeads={projectLeads}
            onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          />
        )}

        {step === 5 && isVenta && (
          <OBVStep5SaleDetails
            formData={formData}
            members={members}
            projectMembersList={projectMembersList}
            onUpdateSaleCalculations={updateSaleCalculations}
            onAddParticipant={addParticipant}
            onRemoveParticipant={removeParticipant}
            onUpdateParticipantPercentage={updateParticipantPercentage}
          />
        )}

        {((step === 5 && !isVenta) || (step === 6 && isVenta)) && (
          <OBVStep6Evidence
            step={step}
            formData={formData}
            projects={projects}
            isVenta={isVenta}
            onUpdate={(updates) => setFormData(prev => ({ ...prev, ...updates }))}
          />
        )}

        {/* Actions */}
        <div className="flex justify-center gap-3 pt-4 border-t border-border mt-6">
          {step === 1 ? (
            <Button variant="outline" size="lg" onClick={handleCancel} className="min-w-[120px]">{t('obv.cancelar')}</Button>
          ) : (
            <Button variant="outline" size="lg" onClick={handleBack} className="min-w-[120px]">
              <ChevronLeft size={18} className="mr-1" />{t('obv.atrás')}</Button>
          )}

          {step < totalSteps ? (
            <Button
              size="lg"
              className="optimus-gradient min-w-[140px]"
              onClick={handleNextWithValidation}
              disabled={!canProceed()}
            >{t('obv.siguiente')}<ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="optimus-gradient min-w-[160px]"
              onClick={originalHandleSubmit}
              disabled={isSubmitting || isBlocked}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="mr-2 animate-spin" />{t('obv.guardando')}</>
              ) : isBlocked ? (
                <>{t('obv.bloqueado')}</>
              ) : (
                <>Enviar OBV <Check size={18} className="ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* V5.4.1 — Cancel confirmation dialog */}
      <ConfirmDialog
        open={showCancelConfirm}
        onOpenChange={setShowCancelConfirm}
        title={t('obvForm.cancelConfirmTitle')}
        description={t('obvForm.cancelConfirmDescription')}
        confirmLabel={t('obvForm.cancelConfirmDiscard')}
        cancelLabel={t('obvForm.cancelConfirmKeep')}
        variant="destructive"
        onConfirm={confirmCancel}
      />
    </div>
  );
}
