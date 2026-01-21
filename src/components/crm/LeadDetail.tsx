import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  Loader2, Building2, Phone, Mail, Calendar, FileText, 
  User, Clock, History, X, Edit2, Save, ExternalLink, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PIPELINE_STAGES } from './LeadForm';
import { cn } from '@/lib/utils';

interface Lead {
  id: string;
  nombre: string;
  empresa: string | null;
  email: string | null;
  telefono: string | null;
  status: string;
  valor_potencial: number | null;
  notas: string | null;
  proxima_accion: string | null;
  proxima_accion_fecha: string | null;
  responsable_id: string | null;
  project_id: string;
  created_at: string;
  updated_at: string;
}

interface LeadDetailProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Array<{ id: string; nombre: string; color: string }>;
  projectName?: string;
  onCreateOBV?: (lead: Lead) => void;
}

export function LeadDetail({ lead, open, onOpenChange, members, projectName, onCreateOBV }: LeadDetailProps) {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Partial<Lead>>({});

  // Fetch lead history
  const { data: history = [] } = useQuery({
    queryKey: ['lead_history', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];
      
      const { data, error } = await supabase
        .from('lead_history')
        .select('*')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Get changer names
      const changerIds = [...new Set(data.map(h => h.changed_by).filter(Boolean))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nombre')
        .in('id', changerIds);
      
      const profilesMap = new Map(profiles?.map(p => [p.id, p.nombre]) || []);
      
      return data.map(h => ({
        ...h,
        changer_nombre: h.changed_by ? profilesMap.get(h.changed_by) || 'Desconocido' : 'Sistema',
      }));
    },
    enabled: !!lead?.id && open,
  });

  // Fetch linked OBVs
  const { data: linkedOBVs = [] } = useQuery({
    queryKey: ['lead_obvs', lead?.id],
    queryFn: async () => {
      if (!lead?.id) return [];
      
      const { data, error } = await supabase
        .from('obvs')
        .select('id, titulo, tipo, status, facturacion, created_at')
        .eq('lead_id', lead.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!lead?.id && open,
  });

  const startEditing = () => {
    if (lead) {
      setEditData({
        nombre: lead.nombre,
        empresa: lead.empresa,
        email: lead.email,
        telefono: lead.telefono,
        status: lead.status,
        valor_potencial: lead.valor_potencial,
        notas: lead.notas,
        proxima_accion: lead.proxima_accion,
        proxima_accion_fecha: lead.proxima_accion_fecha,
        responsable_id: lead.responsable_id,
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!lead || !profile?.id) return;

    setIsSaving(true);

    try {
      const { error } = await supabase
        .from('leads')
        .update({
          nombre: editData.nombre,
          empresa: editData.empresa,
          email: editData.email,
          telefono: editData.telefono,
          status: editData.status as any,
          valor_potencial: editData.valor_potencial,
          notas: editData.notas,
          proxima_accion: editData.proxima_accion,
          proxima_accion_fecha: editData.proxima_accion_fecha,
          responsable_id: editData.responsable_id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', lead.id);

      if (error) throw error;

      toast.success('Lead actualizado');
      queryClient.invalidateQueries({ queryKey: ['pipeline_global'] });
      queryClient.invalidateQueries({ queryKey: ['project_leads'] });
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating lead:', error);
      toast.error('Error al actualizar el lead');
    } finally {
      setIsSaving(false);
    }
  };

  const getResponsable = (id: string | null) => members.find(m => m.id === id);
  const getStage = (status: string) => PIPELINE_STAGES.find(s => s.id === status);

  if (!lead) return null;

  const responsable = getResponsable(lead.responsable_id);
  const stage = getStage(lead.status);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">{lead.nombre}</SheetTitle>
              {lead.empresa && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                  <Building2 size={14} />
                  {lead.empresa}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button variant="outline" size="sm" onClick={startEditing}>
                  <Edit2 size={14} className="mr-1" />
                  Editar
                </Button>
              ) : (
                <Button size="sm" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
                  Guardar
                </Button>
              )}
            </div>
          </div>

          {/* Status badge */}
          <div className="flex items-center gap-3 mt-3">
            {stage && (
              <Badge 
                variant="outline" 
                style={{ borderColor: stage.color, color: stage.color }}
              >
                {stage.label}
              </Badge>
            )}
            {lead.valor_potencial && lead.valor_potencial > 0 && (
              <span className="font-bold text-success">€{lead.valor_potencial.toLocaleString()}</span>
            )}
            {projectName && (
              <Badge variant="secondary">{projectName}</Badge>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Información</TabsTrigger>
            <TabsTrigger value="history">Historial</TabsTrigger>
            <TabsTrigger value="obvs">OBVs ({linkedOBVs.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-4 space-y-4">
            {isEditing ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Nombre</Label>
                    <Input
                      value={editData.nombre || ''}
                      onChange={(e) => setEditData({ ...editData, nombre: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Empresa</Label>
                    <Input
                      value={editData.empresa || ''}
                      onChange={(e) => setEditData({ ...editData, empresa: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editData.email || ''}
                      onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Teléfono</Label>
                    <Input
                      value={editData.telefono || ''}
                      onChange={(e) => setEditData({ ...editData, telefono: e.target.value })}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Estado</Label>
                    <Select 
                      value={editData.status} 
                      onValueChange={(v) => setEditData({ ...editData, status: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PIPELINE_STAGES.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Valor (€)</Label>
                    <Input
                      type="number"
                      value={editData.valor_potencial || ''}
                      onChange={(e) => setEditData({ ...editData, valor_potencial: parseFloat(e.target.value) || null })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Responsable</Label>
                  <Select 
                    value={editData.responsable_id || ''} 
                    onValueChange={(v) => setEditData({ ...editData, responsable_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((m) => (
                        <SelectItem key={m.id} value={m.id}>{m.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Próxima acción</Label>
                    <Input
                      value={editData.proxima_accion || ''}
                      onChange={(e) => setEditData({ ...editData, proxima_accion: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Fecha</Label>
                    <Input
                      type="date"
                      value={editData.proxima_accion_fecha || ''}
                      onChange={(e) => setEditData({ ...editData, proxima_accion_fecha: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label>Notas</Label>
                  <Textarea
                    value={editData.notas || ''}
                    onChange={(e) => setEditData({ ...editData, notas: e.target.value })}
                    rows={4}
                  />
                </div>
              </>
            ) : (
              <>
                {/* Contact info */}
                <div className="space-y-3">
                  {lead.email && (
                    <a 
                      href={`mailto:${lead.email}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Mail size={14} className="text-muted-foreground" />
                      {lead.email}
                    </a>
                  )}
                  {lead.telefono && (
                    <a 
                      href={`tel:${lead.telefono}`}
                      className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
                    >
                      <Phone size={14} className="text-muted-foreground" />
                      {lead.telefono}
                    </a>
                  )}
                </div>

                {/* Responsable */}
                {responsable && (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-xl">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: responsable.color }}
                    >
                      {responsable.nombre.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{responsable.nombre}</p>
                      <p className="text-xs text-muted-foreground">Responsable</p>
                    </div>
                  </div>
                )}

                {/* Próxima acción */}
                {(lead.proxima_accion || lead.proxima_accion_fecha) && (
                  <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <Calendar size={14} className="text-warning" />
                      Próxima acción
                    </p>
                    {lead.proxima_accion && (
                      <p className="text-sm mt-1">{lead.proxima_accion}</p>
                    )}
                    {lead.proxima_accion_fecha && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(lead.proxima_accion_fecha).toLocaleDateString('es-ES', {
                          weekday: 'long',
                          day: 'numeric',
                          month: 'long',
                        })}
                      </p>
                    )}
                  </div>
                )}

                {/* Notas */}
                {lead.notas && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <FileText size={14} />
                      Notas
                    </p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{lead.notas}</p>
                  </div>
                )}

                {/* Crear OBV button */}
                {onCreateOBV && (
                  <Button className="w-full" onClick={() => onCreateOBV(lead)}>
                    <Plus size={16} className="mr-2" />
                    Crear OBV desde este lead
                  </Button>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="history" className="mt-4">
            {history.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <History className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>Sin cambios de estado registrados</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((h: any) => {
                  const oldStage = PIPELINE_STAGES.find(s => s.id === h.old_status);
                  const newStage = PIPELINE_STAGES.find(s => s.id === h.new_status);
                  
                  return (
                    <div key={h.id} className="flex gap-3 p-3 bg-muted/50 rounded-xl">
                      <Clock size={16} className="mt-0.5 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="font-medium">{h.changer_nombre}</span> cambió el estado
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          {oldStage && (
                            <Badge variant="outline" style={{ borderColor: oldStage.color }}>
                              {oldStage.label}
                            </Badge>
                          )}
                          <span className="text-muted-foreground">→</span>
                          {newStage && (
                            <Badge variant="outline" style={{ borderColor: newStage.color }}>
                              {newStage.label}
                            </Badge>
                          )}
                        </div>
                        {h.notas && (
                          <p className="text-xs text-muted-foreground mt-2">{h.notas}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(h.created_at).toLocaleDateString('es-ES', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="obvs" className="mt-4">
            {linkedOBVs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No hay OBVs vinculadas a este lead</p>
                {onCreateOBV && (
                  <Button variant="outline" className="mt-4" onClick={() => onCreateOBV(lead)}>
                    <Plus size={16} className="mr-2" />
                    Crear OBV
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {linkedOBVs.map((obv: any) => (
                  <div key={obv.id} className="p-3 bg-card border border-border rounded-xl">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{obv.titulo}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="text-xs">
                            {obv.tipo}
                          </Badge>
                          <Badge 
                            variant={obv.status === 'validated' ? 'default' : 'outline'}
                            className="text-xs"
                          >
                            {obv.status}
                          </Badge>
                        </div>
                      </div>
                      {obv.facturacion && (
                        <span className="font-bold text-success">€{obv.facturacion}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(obv.created_at).toLocaleDateString('es-ES')}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
