import { ChevronRight, ChevronLeft, Loader2, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useCanUpload } from '@/hooks/useValidationSystem';
import { cn } from '@/lib/utils';
import { useOBVFormLogic } from './useOBVFormLogic';
import { OBVStep1Type } from './OBVStep1Type';
import { OBVStep2Project } from './OBVStep2Project';
import { OBVStep3BasicInfo } from './OBVStep3BasicInfo';
import { OBVStep4Lead } from './OBVStep4Lead';
import { OBVStep5SaleDetails } from './OBVStep5SaleDetails';
import { OBVStep6Evidence } from './OBVStep6Evidence';
import { useMemberStats } from '@/hooks/useNovaData';
import { useProjects } from '@/hooks/useNovaData';

interface OBVFormContainerProps {
  onCancel: () => void;
  onSuccess: () => void;
}

export function OBVFormContainer({ onCancel, onSuccess }: OBVFormContainerProps) {
  const { canUpload, isBlocked } = useCanUpload();
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
    handleSubmit,
  } = useOBVFormLogic(onSuccess);

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
            <AlertTitle>Estás bloqueado</AlertTitle>
            <AlertDescription>
              No puedes subir OBVs hasta que valides tus pendientes. Ve a validar para desbloquear.
            </AlertDescription>
          </Alert>
        )}

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold transition-all",
                s === step ? "bg-primary text-primary-foreground" :
                  s < step ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground"
              )}>
                {s < step ? <Check size={16} /> : s}
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
            <Button variant="outline" size="lg" onClick={onCancel} className="min-w-[120px]">
              Cancelar
            </Button>
          ) : (
            <Button variant="outline" size="lg" onClick={handleBack} className="min-w-[120px]">
              <ChevronLeft size={18} className="mr-1" /> Atrás
            </Button>
          )}

          {step < totalSteps ? (
            <Button
              size="lg"
              className="nova-gradient min-w-[140px]"
              onClick={handleNext}
              disabled={!canProceed()}
            >
              Siguiente <ChevronRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button
              size="lg"
              className="nova-gradient min-w-[160px]"
              onClick={handleSubmit}
              disabled={isSubmitting || isBlocked}
            >
              {isSubmitting ? (
                <><Loader2 size={18} className="mr-2 animate-spin" /> Guardando...</>
              ) : isBlocked ? (
                <>Bloqueado</>
              ) : (
                <>Enviar OBV <Check size={18} className="ml-1" /></>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
