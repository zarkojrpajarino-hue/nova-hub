import { useState } from 'react';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const PIPELINE_STAGES = [
  { id: 'frio', label: 'Frío', color: '#64748B' },
  { id: 'tibio', label: 'Tibio', color: '#F59E0B' },
  { id: 'hot', label: 'Hot', color: '#EF4444' },
  { id: 'propuesta', label: 'Propuesta', color: '#A855F7' },
  { id: 'negociacion', label: 'Negociación', color: '#3B82F6' },
  { id: 'cerrado_ganado', label: 'Cerrado', color: '#22C55E' },
];

interface ProjectCRMTabProps {
  projectId: string;
  leads: any[];
}

export function ProjectCRMTab({ projectId, leads }: ProjectCRMTabProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [newLead, setNewLead] = useState({
    nombre: '',
    empresa: '',
    email: '',
    telefono: '',
    status: 'frio',
    valor_potencial: 0,
  });

  const handleAddLead = async () => {
    if (!newLead.nombre || !profile?.id) return;

    try {
      const { error } = await supabase
        .from('leads')
        .insert({
          project_id: projectId,
          nombre: newLead.nombre,
          empresa: newLead.empresa || null,
          email: newLead.email || null,
          telefono: newLead.telefono || null,
          status: newLead.status as any,
          valor_potencial: newLead.valor_potencial || null,
          responsable_id: profile.id,
        });

      if (error) throw error;

      toast.success('Lead añadido');
      setIsAdding(false);
      setNewLead({ nombre: '', empresa: '', email: '', telefono: '', status: 'frio', valor_potencial: 0 });
      queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
    } catch (error) {
      console.error('Error adding lead:', error);
      toast.error('Error al añadir lead');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Pipeline de Leads</h3>
        <Dialog open={isAdding} onOpenChange={setIsAdding}>
          <DialogTrigger asChild>
            <Button>
              <Plus size={16} className="mr-2" />
              Añadir Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nuevo Lead</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Nombre del contacto *</Label>
                <Input
                  value={newLead.nombre}
                  onChange={e => setNewLead(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Juan García"
                />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input
                  value={newLead.empresa}
                  onChange={e => setNewLead(prev => ({ ...prev, empresa: e.target.value }))}
                  placeholder="Empresa S.L."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={e => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Teléfono</Label>
                  <Input
                    value={newLead.telefono}
                    onChange={e => setNewLead(prev => ({ ...prev, telefono: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Estado</Label>
                  <Select
                    value={newLead.status}
                    onValueChange={v => setNewLead(prev => ({ ...prev, status: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PIPELINE_STAGES.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Valor Potencial (€)</Label>
                  <Input
                    type="number"
                    value={newLead.valor_potencial}
                    onChange={e => setNewLead(prev => ({ ...prev, valor_potencial: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>
              <Button onClick={handleAddLead} className="w-full">
                Añadir Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
        {PIPELINE_STAGES.map(stage => {
          const stageLeads = leads.filter(l => l.status === stage.id);
          
          return (
            <div key={stage.id} className="min-w-[220px]">
              {/* Column Header */}
              <div 
                className="flex items-center justify-between px-4 py-3 rounded-t-xl mb-2"
                style={{ 
                  background: 'hsl(var(--muted))',
                  borderTop: `3px solid ${stage.color}` 
                }}
              >
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <span 
                    className="w-2 h-2 rounded-full"
                    style={{ background: stage.color }}
                  />
                  {stage.label}
                </div>
                <span className="w-6 h-6 rounded-lg bg-background flex items-center justify-center text-xs font-semibold">
                  {stageLeads.length}
                </span>
              </div>

              {/* Cards */}
              <div className="bg-background rounded-b-xl p-2 min-h-[200px] space-y-2">
                {stageLeads.map(lead => (
                  <div 
                    key={lead.id}
                    className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-muted-foreground/30 transition-all"
                  >
                    <p className="font-semibold text-sm mb-1">{lead.nombre}</p>
                    <p className="text-xs text-muted-foreground mb-3">{lead.empresa || '-'}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-success">
                        {lead.valor_potencial && lead.valor_potencial > 0 ? `€${lead.valor_potencial}` : '-'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
