import { useState, useMemo } from 'react';
import { ChevronRight, ChevronLeft, Loader2, Plus, Check, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/hooks/useAuth';
import { useProjects, useProjectMembers, useMemberStats, usePipelineGlobal } from '@/hooks/useNovaData';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { EvidenceUrlInput } from '@/components/evidence/EvidenceUrlInput';
import { useCanUpload } from '@/hooks/useValidationSystem';

const OBV_TYPES = [
  { id: 'exploracion', icon: '🔍', title: 'Exploración', desc: 'Primer contacto, investigación de mercado, networking', color: '#6366F1' },
  { id: 'validacion', icon: '✅', title: 'Validación', desc: 'Reunión, demo, propuesta enviada, seguimiento', color: '#F59E0B' },
  { id: 'venta', icon: '💰', title: 'Venta', desc: 'Cierre confirmado con transacción económica', color: '#22C55E' },
];

const LEAD_STATUS_OPTIONS = [
  { value: 'frio', label: 'Frío' },
  { value: 'tibio', label: 'Tibio' },
  { value: 'hot', label: 'Hot' },
  { value: 'propuesta', label: 'Propuesta' },
  { value: 'negociacion', label: 'Negociación' },
  { value: 'cerrado_ganado', label: 'Cerrado Ganado' },
];

interface Participant {
  memberId: string;
  porcentaje: number;
}

interface OBVFormData {
  tipo: string;
  projectId: string;
  titulo: string;
  descripcion: string;
  fecha: string;
  leadOption: 'existing' | 'new' | 'none';
  leadId: string;
  leadNombre: string;
  leadEmpresa: string;
  leadEmail: string;
  leadStatus: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  facturacion: number;
  costes: number;
  margen: number;
  participants: Participant[];
  evidenceUrl: string;
}

export function OBVForm({ onCancel, onSuccess }: { onCancel: () => void; onSuccess: () => void }) {
  const { profile } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: projectMembers = [] } = useProjectMembers();
  const { data: members = [] } = useMemberStats();
  const { data: leads = [] } = usePipelineGlobal();
  const { canUpload, isBlocked } = useCanUpload();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<OBVFormData>({
    tipo: 'validacion',
    projectId: '',
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    leadOption: 'none',
    leadId: '',
    leadNombre: '',
    leadEmpresa: '',
    leadEmail: '',
    leadStatus: 'frio',
    producto: '',
    cantidad: 1,
    precioUnitario: 0,
    facturacion: 0,
    costes: 0,
    margen: 0,
    participants: [],
    evidenceUrl: '',
  });

  // Get user's projects
  const userProjectIds = projectMembers
    .filter(pm => pm.member_id === profile?.id)
    .map(pm => pm.project_id);

  const userProjects = projects.filter(p => userProjectIds.includes(p.id));

  // Get project leads
  const projectLeads = leads.filter(l => l.project_id === formData.projectId);

  // Get project members for participants
  const projectMembersList = useMemo(() => {
    if (!formData.projectId) return [];
    return projectMembers
      .filter(pm => pm.project_id === formData.projectId && pm.member_id !== profile?.id)
      .map(pm => {
        const member = members.find(m => m.id === pm.member_id);
        return member ? { id: member.id, nombre: member.nombre, color: member.color } : null;
      })
      .filter(Boolean);
  }, [formData.projectId, projectMembers, members, profile?.id]);

  // Auto-calculate facturacion and margen
  const updateSaleCalculations = (updates: Partial<OBVFormData>) => {
    const cantidad = updates.cantidad ?? formData.cantidad;
    const precioUnitario = updates.precioUnitario ?? formData.precioUnitario;
    const costes = updates.costes ?? formData.costes;
    const facturacion = cantidad * precioUnitario;
    const margen = facturacion - costes;
    
    setFormData(prev => ({
      ...prev,
      ...updates,
      facturacion,
      margen,
    }));
  };

  const isVenta = formData.tipo === 'venta';
  const totalSteps = isVenta ? 6 : 5;

  const canProceed = () => {
    switch (step) {
      case 1: return !!formData.tipo;
      case 2: return !!formData.projectId;
      case 3: return !!formData.titulo && !!formData.fecha;
      case 4: return formData.leadOption === 'none' || 
                     formData.leadOption === 'existing' && !!formData.leadId ||
                     formData.leadOption === 'new' && !!formData.leadNombre;
      case 5: 
        if (isVenta) {
          return !!formData.producto && formData.facturacion > 0;
        }
        return true; // Evidence step for non-venta
      case 6: return true;
      default: return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSubmit = async () => {
    if (!profile?.id) {
      toast.error('Debes iniciar sesión');
      return;
    }

    setIsSubmitting(true);

    try {
      let leadId = formData.leadId || null;

      // Create new lead if needed
      if (formData.leadOption === 'new' && formData.leadNombre) {
        const { data: newLead, error: leadError } = await supabase
          .from('leads')
          .insert({
            project_id: formData.projectId,
            nombre: formData.leadNombre,
            empresa: formData.leadEmpresa || null,
            email: formData.leadEmail || null,
            status: formData.leadStatus as any,
            responsable_id: profile.id,
            valor_potencial: isVenta ? formData.facturacion : null,
          })
          .select('id')
          .single();

        if (leadError) throw leadError;
        leadId = newLead.id;
      }

      // Create OBV
      const { data: newOBV, error: obvError } = await supabase
        .from('obvs')
        .insert({
          owner_id: profile.id,
          project_id: formData.projectId,
          lead_id: leadId,
          titulo: formData.titulo,
          descripcion: formData.descripcion || null,
          fecha: formData.fecha,
          tipo: formData.tipo as any,
          status: 'pending',
          es_venta: isVenta,
          producto: isVenta ? formData.producto : null,
          cantidad: isVenta ? formData.cantidad : null,
          precio_unitario: isVenta ? formData.precioUnitario : null,
          facturacion: isVenta ? formData.facturacion : null,
          costes: isVenta ? formData.costes : null,
          margen: isVenta ? formData.margen : null,
          evidence_url: formData.evidenceUrl || null,
        })
        .select('id')
        .single();

      if (obvError) throw obvError;

      // Add owner as participant with remaining percentage
      const participantsTotal = formData.participants.reduce((sum, p) => sum + p.porcentaje, 0);
      const ownerPercentage = 100 - participantsTotal;

      const allParticipants = [
        { obv_id: newOBV.id, member_id: profile.id, porcentaje: ownerPercentage },
        ...formData.participants.map(p => ({
          obv_id: newOBV.id,
          member_id: p.memberId,
          porcentaje: p.porcentaje,
        })),
      ];

      if (allParticipants.length > 0) {
        const { error: partError } = await supabase
          .from('obv_participantes')
          .insert(allParticipants);

        if (partError) throw partError;
      }

      // Notifications are now handled automatically by database triggers (notify_new_obv)
      // This ensures proper access control and respects user notification preferences

      toast.success('OBV creada correctamente');
      onSuccess();
    } catch (error) {
      console.error('Error creating OBV:', error);
      toast.error('Error al crear la OBV');
    } finally {
      setIsSubmitting(false);
    }
  };

  const addParticipant = (memberId: string) => {
    if (formData.participants.find(p => p.memberId === memberId)) return;
    setFormData(prev => ({
      ...prev,
      participants: [...prev.participants, { memberId, porcentaje: 10 }],
    }));
  };

  const removeParticipant = (memberId: string) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.filter(p => p.memberId !== memberId),
    }));
  };

  const updateParticipantPercentage = (memberId: string, porcentaje: number) => {
    setFormData(prev => ({
      ...prev,
      participants: prev.participants.map(p =>
        p.memberId === memberId ? { ...p, porcentaje } : p
      ),
    }));
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

        {/* Step 1: Type */}
        {step === 1 && (
          <>
            <h4 className="text-lg font-semibold text-center mb-6">
              ¿Qué tipo de actividad registras?
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {OBV_TYPES.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, tipo: type.id }))}
                  className={cn(
                    "p-6 rounded-xl border-2 text-left transition-all duration-200 active:scale-95",
                    "hover:shadow-lg hover:border-primary/50",
                    formData.tipo === type.id 
                      ? "border-primary bg-primary/5 shadow-md ring-2 ring-primary/20" 
                      : "border-border bg-card hover:bg-muted/50"
                  )}
                >
                  <div 
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4"
                    style={{ background: `${type.color}15` }}
                  >
                    {type.icon}
                  </div>
                  <h5 className="font-bold text-base mb-2">{type.title}</h5>
                  <p className="text-sm text-muted-foreground">{type.desc}</p>
                  {formData.tipo === type.id && (
                    <div className="mt-3 flex items-center gap-1.5 text-primary text-sm font-medium">
                      <Check size={14} />
                      Seleccionado
                    </div>
                  )}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Step 2: Project */}
        {step === 2 && (
          <>
            <h4 className="text-lg font-semibold text-center mb-6">
              Paso 2: Selecciona el proyecto
            </h4>
            <div className="max-w-md mx-auto space-y-4 mb-8">
              {userProjects.length === 0 ? (
                <p className="text-center text-muted-foreground">No estás asignado a ningún proyecto</p>
              ) : (
                <div className="grid gap-3">
                  {userProjects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => setFormData(prev => ({ ...prev, projectId: project.id }))}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        formData.projectId === project.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-muted-foreground/50"
                      )}
                    >
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ background: `${project.color}20` }}
                      >
                        {project.icon}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{project.nombre}</p>
                        <p className="text-sm text-muted-foreground">
                          {project.fase} • {project.tipo}
                        </p>
                      </div>
                      {formData.projectId === project.id && (
                        <Check size={20} className="text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 3: Basic Info */}
        {step === 3 && (
          <>
            <h4 className="text-lg font-semibold text-center mb-6">
              Paso 3: Información básica
            </h4>
            <div className="max-w-lg mx-auto space-y-4 mb-8">
              <div>
                <Label htmlFor="titulo">Título *</Label>
                <Input
                  id="titulo"
                  placeholder="Ej: Reunión con proveedor de logística"
                  value={formData.titulo}
                  onChange={e => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="descripcion">Descripción</Label>
                <Textarea
                  id="descripcion"
                  placeholder="Describe brevemente la actividad..."
                  value={formData.descripcion}
                  onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                />
              </div>
            </div>
          </>
        )}

        {/* Step 4: Lead */}
        {step === 4 && (
          <>
            <h4 className="text-lg font-semibold text-center mb-6">
              Paso 4: Datos del Lead
            </h4>
            <div className="max-w-lg mx-auto space-y-4 mb-8">
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'none', label: 'Sin Lead' },
                  { id: 'existing', label: 'Lead Existente' },
                  { id: 'new', label: 'Nuevo Lead' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => setFormData(prev => ({ ...prev, leadOption: opt.id as any }))}
                    className={cn(
                      "p-3 rounded-xl border-2 text-sm font-medium transition-all",
                      formData.leadOption === opt.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {formData.leadOption === 'existing' && (
                <div>
                  <Label>Seleccionar Lead</Label>
                  <Select
                    value={formData.leadId}
                    onValueChange={v => setFormData(prev => ({ ...prev, leadId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un lead..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectLeads.map(lead => (
                        <SelectItem key={lead.id} value={lead.id!}>
                          {lead.nombre} - {lead.empresa || 'Sin empresa'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {formData.leadOption === 'new' && (
                <>
                  <div>
                    <Label htmlFor="leadNombre">Nombre del contacto *</Label>
                    <Input
                      id="leadNombre"
                      placeholder="Juan García"
                      value={formData.leadNombre}
                      onChange={e => setFormData(prev => ({ ...prev, leadNombre: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadEmpresa">Empresa</Label>
                    <Input
                      id="leadEmpresa"
                      placeholder="Empresa S.L."
                      value={formData.leadEmpresa}
                      onChange={e => setFormData(prev => ({ ...prev, leadEmpresa: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="leadEmail">Email</Label>
                    <Input
                      id="leadEmail"
                      type="email"
                      placeholder="contacto@empresa.com"
                      value={formData.leadEmail}
                      onChange={e => setFormData(prev => ({ ...prev, leadEmail: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Estado del Lead</Label>
                    <Select
                      value={formData.leadStatus}
                      onValueChange={v => setFormData(prev => ({ ...prev, leadStatus: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LEAD_STATUS_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Step 5: Sale Details (only for venta) */}
        {step === 5 && isVenta && (
          <>
            <h4 className="text-lg font-semibold text-center mb-6">
              Paso 5: Detalles de la Venta
            </h4>
            <div className="max-w-lg mx-auto space-y-4 mb-8">
              <div>
                <Label htmlFor="producto">Producto/Servicio *</Label>
                <Input
                  id="producto"
                  placeholder="Ej: Pack de menús premium"
                  value={formData.producto}
                  onChange={e => setFormData(prev => ({ ...prev, producto: e.target.value }))}
                  className="h-12 text-base"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="cantidad">Cantidad</Label>
                  <Input
                    id="cantidad"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.cantidad}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '');
                      updateSaleCalculations({ cantidad: parseInt(val) || 0 });
                    }}
                    className="h-12 text-base text-center font-semibold"
                  />
                </div>
                <div>
                  <Label htmlFor="precioUnitario">Precio Unitario (€)</Label>
                  <Input
                    id="precioUnitario"
                    inputMode="decimal"
                    value={formData.precioUnitario}
                    onChange={e => {
                      const val = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                      updateSaleCalculations({ precioUnitario: parseFloat(val) || 0 });
                    }}
                    className="h-12 text-base text-center font-semibold"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Facturación Total</Label>
                  <div className="h-12 px-3 flex items-center justify-center bg-muted rounded-md">
                    <span className="text-lg font-bold text-primary">
                      €{formData.facturacion.toFixed(2)}
                    </span>
                  </div>
                </div>
                <div>
                  <Label htmlFor="costes">Costes (€)</Label>
                  <Input
                    id="costes"
                    inputMode="decimal"
                    value={formData.costes}
                    onChange={e => {
                      const val = e.target.value.replace(/[^\d.,]/g, '').replace(',', '.');
                      updateSaleCalculations({ costes: parseFloat(val) || 0 });
                    }}
                    className="h-12 text-base text-center font-semibold"
                  />
                </div>
              </div>
              
              {/* Margen con mejor visualización */}
              <div className="p-4 bg-success/10 rounded-xl border border-success/20">
                <p className="text-sm text-muted-foreground mb-1">Margen Bruto</p>
                <p className={cn(
                  "text-2xl font-bold",
                  formData.margen >= 0 ? "text-success" : "text-destructive"
                )}>
                  €{formData.margen.toFixed(2)}
                </p>
              </div>
              {/* Participants */}
              <div>
                <Label>Participantes (opcional)</Label>
                <p className="text-xs text-muted-foreground mb-3">
                  Añade otros socios que participaron en esta venta
                </p>
                <div className="space-y-2">
                  {formData.participants.map(p => {
                    const member = members.find(m => m.id === p.memberId);
                    return (
                      <div key={p.memberId} className="flex items-center gap-3 p-2 bg-background rounded-lg">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-semibold"
                          style={{ background: member?.color || '#6366F1' }}
                        >
                          {member?.nombre.charAt(0)}
                        </div>
                        <span className="flex-1 text-sm font-medium">{member?.nombre}</span>
                        <Input
                          type="number"
                          min={1}
                          max={99}
                          value={p.porcentaje}
                          onChange={e => updateParticipantPercentage(p.memberId, parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        <span className="text-sm text-muted-foreground">%</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParticipant(p.memberId)}
                          className="text-destructive"
                        >
                          ×
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {projectMembersList.length > formData.participants.length && (
                  <Select onValueChange={addParticipant}>
                    <SelectTrigger className="mt-2">
                      <Plus size={14} className="mr-2" />
                      <SelectValue placeholder="Añadir participante..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectMembersList
                        .filter(m => m && !formData.participants.find(p => p.memberId === m.id))
                        .map(m => m && (
                          <SelectItem key={m.id} value={m.id}>
                            {m.nombre}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>
          </>
        )}

        {/* Step 5/6: Evidence */}
        {((step === 5 && !isVenta) || (step === 6 && isVenta)) && (
          <>
            <h4 className="text-lg font-semibold text-center mb-6">
              Paso {step}: Evidencia
            </h4>
            <div className="max-w-lg mx-auto space-y-4 mb-8">
              <EvidenceUrlInput
                value={formData.evidenceUrl}
                onChange={(value) => setFormData(prev => ({ ...prev, evidenceUrl: value }))}
                label="Evidencia (URL Google Drive)"
              />

              {/* Summary */}
              <div className="p-4 bg-muted rounded-xl space-y-2">
                <h5 className="font-semibold">Resumen</h5>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Tipo:</span>
                  <span className="font-medium capitalize">{formData.tipo}</span>
                  <span className="text-muted-foreground">Proyecto:</span>
                  <span className="font-medium">{projects.find(p => p.id === formData.projectId)?.nombre}</span>
                  <span className="text-muted-foreground">Título:</span>
                  <span className="font-medium">{formData.titulo}</span>
                  {isVenta && (
                    <>
                      <span className="text-muted-foreground">Facturación:</span>
                      <span className="font-medium text-success">€{formData.facturacion}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Actions - Fixed at bottom for mobile */}
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
