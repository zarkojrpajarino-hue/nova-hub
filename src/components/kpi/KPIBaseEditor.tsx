import { useState, useEffect } from 'react';
import { Edit2, Save, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface KPIBaseEditorProps {
  memberId: string;
  memberName: string;
  currentStats: {
    obvs: number;
    lps: number;
    bps: number;
    cps: number;
    facturacion: number;
    margen: number;
  };
}

export function KPIBaseEditor({ memberId, memberName, currentStats }: KPIBaseEditorProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [values, setValues] = useState(currentStats);

  useEffect(() => {
    if (open) {
      setValues(currentStats);
    }
  }, [open, currentStats]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('member_kpi_base')
        .upsert({
          member_id: memberId,
          obvs: values.obvs,
          lps: values.lps,
          bps: values.bps,
          cps: values.cps,
          facturacion: values.facturacion,
          margen: values.margen,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'member_id' });

      if (error) throw error;

      toast.success('KPIs actualizados correctamente');
      await queryClient.invalidateQueries({ queryKey: ['member_stats'] });
      await queryClient.refetchQueries({ queryKey: ['member_stats'] });
      setOpen(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al actualizar KPIs');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit2 size={14} className="mr-1" />
          Editar KPIs
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar KPIs de {memberName}</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 py-4">
          <div>
            <Label>OBVs</Label>
            <Input
              type="number"
              value={values.obvs}
              onChange={(e) => setValues({ ...values, obvs: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Learning Paths</Label>
            <Input
              type="number"
              value={values.lps}
              onChange={(e) => setValues({ ...values, lps: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Book Points</Label>
            <Input
              type="number"
              value={values.bps}
              onChange={(e) => setValues({ ...values, bps: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Community Points</Label>
            <Input
              type="number"
              value={values.cps}
              onChange={(e) => setValues({ ...values, cps: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Facturación (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={values.facturacion}
              onChange={(e) => setValues({ ...values, facturacion: parseFloat(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label>Margen (€)</Label>
            <Input
              type="number"
              step="0.01"
              value={values.margen}
              onChange={(e) => setValues({ ...values, margen: parseFloat(e.target.value) || 0 })}
            />
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => setOpen(false)}>
            <X size={14} className="mr-1" />
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Save size={14} className="mr-1" />}
            Guardar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
