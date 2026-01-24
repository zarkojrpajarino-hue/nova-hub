import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, History, Plus, Users, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useRotationRequests, useRoleHistory, useMyRotationRequests, type RoleRotationRequest, type RoleHistory } from '@/hooks/useRoleRotation';
import { RotationRequestsList } from '@/components/rotation/RotationRequestsList';
import { RoleHistoryList } from '@/components/rotation/RoleHistoryList';
import { CreateRotationDialog } from '@/components/rotation/CreateRotationDialog';
import { MyRotationRequests } from '@/components/rotation/MyRotationRequests';
import { AIRotationSuggestions } from '@/components/rotation/AIRotationSuggestions';
import { SectionHelp, HelpWidget } from '@/components/ui/section-help';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { DEMO_ROTATION_REQUESTS, DEMO_ROLE_HISTORY } from '@/data/demoData';

export default function RoleRotationView() {
  const { isDemoMode } = useDemoMode();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: realRequests = [] } = useRotationRequests();
  const { data: realMyRequests = [] } = useMyRotationRequests();
  const { data: realHistory = [] } = useRoleHistory();

  // Use demo data when in demo mode
  const allRequests: RoleRotationRequest[] = isDemoMode ? DEMO_ROTATION_REQUESTS.map(r => ({
    id: r.id,
    requester_id: r.requester_id,
    requester_current_role: r.requester_current_role,
    target_user_id: r.target_user_id,
    target_role: r.target_role,
    requester_project_id: r.requester_project_id,
    target_project_id: r.target_project_id,
    status: r.status,
    reason: r.reason,
    created_at: r.created_at,
    requester_name: r.requester_name,
    target_user_name: r.target_user_name,
    request_type: 'swap' as const,
    compatibility_score: 85,
    compatibility_analysis: {},
    requester_accepted: true,
    target_accepted: r.status === 'approved' || r.status === 'completed',
    admin_approved: r.status === 'approved' || r.status === 'completed',
    approved_by: null,
    completed_at: r.status === 'completed' ? r.created_at : null,
    updated_at: r.created_at,
  })) : realRequests;

  const myRequests: RoleRotationRequest[] = isDemoMode ? [] : realMyRequests;

  const history: RoleHistory[] = isDemoMode ? DEMO_ROLE_HISTORY.map(h => ({
    id: h.id,
    user_id: h.user_id,
    project_id: h.project_id,
    old_role: h.old_role,
    new_role: h.new_role,
    change_type: h.change_type,
    created_at: h.created_at,
    notes: h.notes,
    rotation_request_id: null,
    previous_performance_score: null,
  })) : realHistory;

  const pendingRequests = allRequests.filter(r => r.status === 'pending');
  const completedRotations = allRequests.filter(r => r.status === 'completed');
  const myPendingRequests = myRequests.filter(r => r.status === 'pending');

  return (
    <>
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Rotación de Roles</h1>
          <p className="text-muted-foreground">
            Intercambia roles con otros miembros para desarrollar nuevas habilidades
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      <SectionHelp section="rotacion" variant="inline" />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Solicitudes Pendientes</CardTitle>
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
            <CardTitle className="text-sm font-medium">Rotaciones Completadas</CardTitle>
            <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedRotations.length}</div>
            <p className="text-xs text-muted-foreground">Este período</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cambios de Rol</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{history.length}</div>
            <p className="text-xs text-muted-foreground">En el historial</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tasa de Éxito</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {allRequests.length > 0 
                ? Math.round((completedRotations.length / allRequests.length) * 100)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">De solicitudes</p>
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
            <ArrowLeftRight className="h-4 w-4" />
            Todas las Solicitudes
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
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
    </div>

    <HelpWidget section="rotacion" />
    </>
  );
}
