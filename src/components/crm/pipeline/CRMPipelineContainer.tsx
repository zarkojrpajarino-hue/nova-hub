import { Plus, Loader2, LayoutGrid, List, Table as TableIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCRMPipeline } from '@/hooks/useCRMPipeline';
import { KanbanView } from './KanbanView';
import { ListView } from './ListView';
import { TableView } from './TableView';
import { LeadForm } from '../LeadForm';
import { LeadDetail } from '../LeadDetail';
import type { Lead, ViewMode } from '@/hooks/useCRMPipeline';

interface Project {
  id: string;
  nombre: string;
  icon: string;
  color: string;
}

interface Member {
  id: string;
  nombre: string;
  color: string;
}

interface CRMPipelineContainerProps {
  projectId?: string;
  leads: Lead[];
  projects: Project[];
  members: Member[];
  isLoading: boolean;
  defaultView?: ViewMode;
}

export function CRMPipelineContainer({
  projectId,
  leads,
  projects,
  members,
  isLoading,
  defaultView = 'kanban'
}: CRMPipelineContainerProps) {
  const {
    showForm,
    setShowForm,
    selectedLead,
    setSelectedLead,
    initialStatus,
    viewMode,
    setViewMode,
    searchTerm,
    setSearchTerm,
    filteredLeads,
    stageTotals,
    getMember,
    getProject,
    getStage,
    handleDragEnd,
    handleAddLead,
  } = useCRMPipeline(leads, projects, members, defaultView);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold">Pipeline de Leads</h3>
          <p className="text-sm text-muted-foreground">
            {filteredLeads.length} leads • €{filteredLeads.reduce((s, l) => s + (l.valor_potencial || 0), 0).toLocaleString()} valor total
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* View Mode Toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'kanban' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
              title="Vista Kanban"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'list' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
              title="Vista Lista"
            >
              <List size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={cn(
                "p-2 rounded-md transition-all",
                viewMode === 'table' ? "bg-background shadow-sm" : "hover:bg-background/50"
              )}
              title="Vista Tabla"
            >
              <TableIcon size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 sm:w-60">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <Button onClick={() => handleAddLead()}>
            <Plus size={16} className="mr-2" />
            <span className="hidden sm:inline">Añadir Lead</span>
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'kanban' && (
        <KanbanView
          filteredLeads={filteredLeads}
          stageTotals={stageTotals}
          projectId={projectId}
          getMember={getMember}
          getProject={getProject}
          onDragEnd={handleDragEnd}
          onLeadClick={setSelectedLead}
          onAddLead={handleAddLead}
        />
      )}

      {viewMode === 'list' && (
        <ListView
          filteredLeads={filteredLeads}
          projectId={projectId}
          getMember={getMember}
          getProject={getProject}
          getStage={getStage}
          onLeadClick={setSelectedLead}
        />
      )}

      {viewMode === 'table' && (
        <TableView
          filteredLeads={filteredLeads}
          projectId={projectId}
          getMember={getMember}
          getProject={getProject}
          getStage={getStage}
          onLeadClick={setSelectedLead}
        />
      )}

      {/* Dialogs */}
      <LeadForm
        projectId={projectId}
        projects={projects}
        members={members}
        open={showForm}
        onOpenChange={setShowForm}
        initialStatus={initialStatus}
      />

      <LeadDetail
        lead={selectedLead}
        open={!!selectedLead}
        onOpenChange={(open) => !open && setSelectedLead(null)}
        members={members}
        projectName={selectedLead ? getProject(selectedLead.project_id)?.nombre : undefined}
      />
    </div>
  );
}
