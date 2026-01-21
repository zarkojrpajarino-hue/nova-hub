import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeftRight, History, Plus, Users, TrendingUp, Clock, Sparkles } from 'lucide-react';
import { useRotationRequests, useRoleHistory, useMyRotationRequests } from '@/hooks/useRoleRotation';
import { RotationRequestsList } from '@/components/rotation/RotationRequestsList';
import { RoleHistoryList } from '@/components/rotation/RoleHistoryList';
import { CreateRotationDialog } from '@/components/rotation/CreateRotationDialog';
import { MyRotationRequests } from '@/components/rotation/MyRotationRequests';
import { AIRotationSuggestions } from '@/components/rotation/AIRotationSuggestions';

export default function RoleRotationView() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: allRequests = [] } = useRotationRequests();
  const { data: myRequests = [] } = useMyRotationRequests();
  const { data: history = [] } = useRoleHistory();

  const pendingRequests = allRequests.filter(r => r.status === 'pending');
  const completedRotations = allRequests.filter(r => r.status === 'completed');
  const myPendingRequests = myRequests.filter(r => r.status === 'pending');

  return (
    <div className="space-y-6">
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
  );
}
