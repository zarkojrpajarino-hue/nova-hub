import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, History, Plus, Users, TrendingUp, Clock } from 'lucide-react';
import { useRotationRequests, useRoleHistory, useMyRotationRequests } from '@/hooks/useRoleRotation';
import { RotationRequestsList } from '@/components/rotation/RotationRequestsList';
import { RoleHistoryList } from '@/components/rotation/RoleHistoryList';
import { CreateRotationDialog } from '@/components/rotation/CreateRotationDialog';
import { MyRotationRequests } from '@/components/rotation/MyRotationRequests';
import { AIRotationSuggestions } from '@/components/rotation/AIRotationSuggestions';
import { HelpWidget } from '@/components/ui/section-help';
import { HowItWorks } from '@/components/ui/how-it-works';
import { useNavigation } from '@/contexts/NavigationContext';
import { BackButton } from '@/components/navigation/BackButton';
import { RoleRotationPreviewModal } from '@/components/preview/RoleRotationPreviewModal';

import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { useProjectEngineData, useProjectMembers } from '@/hooks/useNovaDataOptimized';

export default function RoleRotationView() {
  const { t } = useTranslation();
  const { goBack, canGoBack } = useNavigation();
  const { projectId } = useParams<{ projectId: string }>();
  const { data: engineData } = useProjectEngineData(projectId);
  const { data: projectMembers = [] } = useProjectMembers();
  const currentPhase = engineData?.phaseState?.current_phase ?? 0;
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Only real data - no demo mode
  const { data: allRequests = [] } = useRotationRequests();
  const { data: myRequests = [] } = useMyRotationRequests();
  const { data: history = [] } = useRoleHistory();

  const pendingRequests = allRequests.filter(r => r.status === 'pending');
  const completedRotations = allRequests.filter(r => r.status === 'completed');
  const myPendingRequests = myRequests.filter(r => r.status === 'pending');

  // Runtime guard: Rotation requires Phase 4 + team
  if (currentPhase < 4 || projectMembers.length < 2) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center max-w-md">
          <ArrowLeftRight className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t('rotation.notAvailableYet', 'No disponible aún')}</h2>
          <p className="text-sm text-muted-foreground">{t('rotation.requiresTeamAndPhase4', 'La rotación de roles requiere Fase 4 y equipo de 2+ miembros.')}</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="space-y-6 p-8">
      {/* Back Button */}
      {canGoBack && (
        <BackButton onClick={goBack} />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('roleRotation.rotaciónDeRoles')}</h1>
          <p className="text-muted-foreground">{t('roleRotation.sistemaDeIntercambioDe')}</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />{t('roleRotation.nuevaSolicitud')}</Button>
      </div>

      {/* How it works */}
      <HowItWorks
        title={t('roleRotation.cómoFunciona')}
        description={t('roleRotation.programaVoluntarioParaRotar')}
        whatIsIt={t('roleRotation.sistemaDeIntercambioDe0')}
        dataInputs={[
          {
            from: t('roleRotation.exploraciónDeRoles'),
            items: [
              t('roleRotation.tuFitScoreEn'),
              t('roleRotation.performanceHistóricaEnRoles'),
            ],
          },
          {
            from: t('roleRotation.equipo'),
            items: [
              t('roleRotation.disponibilidadDeOtrosMiembros'),
              t('roleRotation.compatibilidadTuSkillSet'),
            ],
          },
        ]}
        dataOutputs={[
          {
            to: t('roleRotation.nuevaExperiencia'),
            items: [
              t('roleRotation.trabajas24SemanasEn'),
              t('roleRotation.aprendesSkillsCrossfuncionales'),
              t('roleRotation.generasEmpatíaConOtros'),
            ],
          },
          {
            to: t('roleRotation.miDesarrollo'),
            items: [
              t('roleRotation.nuevoFitScoreCalculado'),
              t('roleRotation.siTeGustaPuedes'),
              t('roleRotation.playbooksDelNuevoRol'),
            ],
          },
          {
            to: t('roleRotation.insights'),
            items: [
              t('roleRotation.quéAprendisteDelNuevo'),
              t('roleRotation.recomendaciónIaDeberíasQuedarte'),
              t('roleRotation.impactoEnTuPerfil'),
            ],
          },
        ]}
        nextStep={{
          action: t('roleRotation.solicitaRotaciónEsperaAprobación'),
          destination: t('roleRotation.iaSugiereRotacionesInteligentes'),
        }}
        onViewPreview={() => setShowPreviewModal(true)}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('roleRotation.solicitudesPendientes')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingRequests.length}</div>
            <p className="text-xs text-muted-foreground">
              {myPendingRequests.length} te involucran
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('roleRotation.rotacionesCompletadas')}</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRotations.length}</div>
            <p className="text-xs text-muted-foreground">{t('roleRotation.estePeríodo')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('roleRotation.cambiosDeRol')}</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history.length}</div>
            <p className="text-xs text-muted-foreground">{t('roleRotation.enElHistorial')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('roleRotation.tasaDeÉxito')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allRequests.length > 0 
                ? Math.round((completedRotations.length / allRequests.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">{t('roleRotation.deSolicitudes')}</p>
          </CardContent>
        </Card>
      </div>

      {/* AI Suggestions */}
      <AIRotationSuggestions />

      {/* Tabs */}
      <Tabs defaultValue="my-requests" className="space-y-4">
        <TabsList>
          <TabsTrigger value="my-requests" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Mis Solicitudes
            {myPendingRequests.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {myPendingRequests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="all-requests" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />{t('roleRotation.todasLasSolicitudes')}</TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />{t('roleRotation.historial')}</TabsTrigger>
        </TabsList>

        <TabsContent value="my-requests">
          <MyRotationRequests requests={myRequests} />
        </TabsContent>

        <TabsContent value="all-requests">
          <RotationRequestsList requests={allRequests} />
        </TabsContent>

        <TabsContent value="history">
          <RoleHistoryList history={history} />
        </TabsContent>
      </Tabs>

      {/* Create Dialog */}
      <CreateRotationDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {/* Preview Modal */}
      <RoleRotationPreviewModal
        open={showPreviewModal}
        onOpenChange={setShowPreviewModal}
      />
    </div>

    <HelpWidget section="rotacion" />
    </>
  );
}
