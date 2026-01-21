import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plane, Target, Flag, Lightbulb, Plus, X } from 'lucide-react';
import { useState } from 'react';
import type { ValidacionData, ContextoCoreaData } from '../types';
import { defaultContextoCorea } from '../types';

interface CoreaEspanaStepProps {
  data: ValidacionData;
  onChange: (partial: Partial<ValidacionData>) => void;
  errors: Record<string, string>;
}

export function CoreaEspanaStep({ data, onChange, errors }: CoreaEspanaStepProps) {
  const [newItem, setNewItem] = useState('');
  
  // Initialize contexto_corea if not present
  const contexto = data.contexto_corea || defaultContextoCorea;

  const updateContexto = (partial: Partial<ContextoCoreaData>) => {
    onChange({
      contexto_corea: { ...contexto, ...partial },
    });
  };

  const toggleCheckbox = (index: number) => {
    const updated = [...contexto.que_validar_desde_corea];
    updated[index] = { ...updated[index], checked: !updated[index].checked };
    updateContexto({ que_validar_desde_corea: updated });
  };

  const addItem = () => {
    if (!newItem.trim()) return;
    const updated = [...contexto.que_validar_desde_corea, { item: newItem.trim(), checked: false }];
    updateContexto({ que_validar_desde_corea: updated });
    setNewItem('');
  };

  const removeItem = (index: number) => {
    const updated = contexto.que_validar_desde_corea.filter((_, i) => i !== index);
    updateContexto({ que_validar_desde_corea: updated });
  };

  const updateHipotesisMes = (mesIndex: number, field: 'hipotesis' | 'metrica_exito', value: string) => {
    const updated = [...contexto.hipotesis_mes];
    updated[mesIndex] = { ...updated[mesIndex], [field]: value };
    updateContexto({ hipotesis_mes: updated });
  };

  const updatePlanEspana = (field: keyof ContextoCoreaData['plan_espana'], value: string) => {
    updateContexto({
      plan_espana: { ...contexto.plan_espana, [field]: value },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-4 mb-4">
          <span className="text-4xl">🇰🇷</span>
          <Plane className="w-8 h-8 text-primary animate-pulse" />
          <span className="text-4xl">🇪🇸</span>
        </div>
        <h2 className="text-2xl font-bold">Plan Corea → España</h2>
        <p className="text-muted-foreground mt-2">
          Define qué validar durante el viaje y cómo aplicarlo al volver
        </p>
      </div>

      {/* Qué validar desde Corea */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="w-5 h-5 text-blue-500" />
            ¿Qué puedes validar DESDE Corea?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {contexto.que_validar_desde_corea.map((item, index) => (
            <div key={index} className="flex items-center gap-3 group">
              <Checkbox
                checked={item.checked}
                onCheckedChange={() => toggleCheckbox(index)}
              />
              <Label className="cursor-pointer flex-1">{item.item}</Label>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeItem(index)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </Button>
            </div>
          ))}
          
          <div className="flex items-center gap-2 mt-4 pt-4 border-t">
            <Input
              placeholder="Añadir otro elemento..."
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addItem();
                }
              }}
            />
            <Button type="button" variant="outline" size="icon" onClick={addItem}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground mt-2">
            ✅ {contexto.que_validar_desde_corea.filter(i => i.checked).length} de {contexto.que_validar_desde_corea.length} seleccionados
          </p>
        </CardContent>
      </Card>

      {/* Hipótesis por mes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="w-5 h-5 text-amber-500" />
            Hipótesis por Mes (máx 3)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[0, 1, 2].map((mesIndex) => (
            <div key={mesIndex} className="p-4 border rounded-lg space-y-3 bg-muted/30">
              <Badge variant="outline" className="bg-background">
                Mes {mesIndex + 1}
              </Badge>
              <div>
                <Label className="text-sm font-medium">Hipótesis a validar</Label>
                <Textarea
                  value={contexto.hipotesis_mes[mesIndex]?.hipotesis || ''}
                  onChange={(e) => updateHipotesisMes(mesIndex, 'hipotesis', e.target.value)}
                  placeholder={`¿Qué quieres validar en el mes ${mesIndex + 1}?`}
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Métrica de éxito</Label>
                <Input
                  value={contexto.hipotesis_mes[mesIndex]?.metrica_exito || ''}
                  onChange={(e) => updateHipotesisMes(mesIndex, 'metrica_exito', e.target.value)}
                  placeholder="¿Cómo sabrás que lo validaste?"
                  className="mt-1"
                />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Plan España */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Flag className="w-5 h-5 text-red-500" />
            Plan para España
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">¿Qué tienes que tener listo al volver?</Label>
            <Textarea
              value={contexto.plan_espana.que_tener_listo}
              onChange={(e) => updatePlanEspana('que_tener_listo', e.target.value)}
              placeholder="MVP validado, 10 clientes potenciales, modelo de negocio..."
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Mercado objetivo en España</Label>
            <Textarea
              value={contexto.plan_espana.mercado_objetivo}
              onChange={(e) => updatePlanEspana('mercado_objetivo', e.target.value)}
              placeholder="Define tu mercado objetivo al volver..."
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Aprendizajes a aplicar</Label>
            <Textarea
              value={contexto.plan_espana.aprendizajes_aplicar}
              onChange={(e) => updatePlanEspana('aprendizajes_aplicar', e.target.value)}
              placeholder="¿Qué aprendizajes de Corea aplicarás?"
              rows={2}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm font-medium">Primeros pasos al aterrizar</Label>
            <Textarea
              value={contexto.plan_espana.primeros_pasos}
              onChange={(e) => updatePlanEspana('primeros_pasos', e.target.value)}
              placeholder="Primeras 3 acciones al volver a España..."
              rows={2}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
