import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { ValidationCard } from '@/components/nova/ValidationCard';
import { PENDING_VALIDATIONS } from '@/data/mockData';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'subir', label: '📤 Subir OBV' },
  { id: 'validar', label: '✅ Validar' },
  { id: 'mis-obvs', label: '📋 Mis OBVs' },
  { id: 'todas', label: '📊 Todas' },
];

const OBV_TYPES = [
  { id: 'exploracion', icon: '🔍', title: 'Exploración', desc: 'Primer contacto, investigación de mercado, networking', color: '#6366F1' },
  { id: 'validacion', icon: '✅', title: 'Validación', desc: 'Reunión, demo, propuesta enviada, seguimiento', color: '#F59E0B' },
  { id: 'venta', icon: '💰', title: 'Venta', desc: 'Cierre confirmado con transacción económica', color: '#22C55E' },
];

interface OBVCenterViewProps {
  onNewOBV?: () => void;
}

export function OBVCenterView({ onNewOBV }: OBVCenterViewProps) {
  const [activeTab, setActiveTab] = useState('subir');
  const [selectedType, setSelectedType] = useState('validacion');

  return (
    <>
      <NovaHeader 
        title="Centro de OBVs" 
        subtitle="Gestiona tus OBVs y validaciones" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        {/* Tabs */}
        <div className="flex gap-1 bg-background p-1 rounded-xl mb-6 w-fit">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-5 py-2.5 rounded-lg text-sm font-medium transition-all",
                activeTab === tab.id
                  ? "bg-card text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Subir OBV */}
        {activeTab === 'subir' && (
          <div className="bg-card border border-border rounded-2xl overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-border">
              <h3 className="font-semibold">Nueva OBV</h3>
            </div>
            
            <div className="p-6">
              {/* Steps */}
              <div className="flex items-center justify-center gap-2 mb-8">
                {[1, 2, 3, 4, 5, 6].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold",
                      step === 1 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {step}
                    </div>
                    {i < 5 && (
                      <div className="w-10 h-0.5 bg-border" />
                    )}
                  </div>
                ))}
              </div>

              <h4 className="text-lg font-semibold text-center mb-6">
                Paso 1: Selecciona el tipo de OBV
              </h4>

              {/* OBV Types */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                {OBV_TYPES.map(type => (
                  <div
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={cn(
                      "bg-background border-2 rounded-2xl p-6 cursor-pointer transition-all text-center",
                      selectedType === type.id
                        ? "border-primary nova-gradient-subtle"
                        : "border-border hover:border-muted-foreground/50"
                    )}
                  >
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                      style={{ background: `${type.color}15` }}
                    >
                      {type.icon}
                    </div>
                    <h5 className="font-bold text-base mb-2">{type.title}</h5>
                    <p className="text-sm text-muted-foreground">{type.desc}</p>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex justify-center gap-3">
                <Button variant="outline">Cancelar</Button>
                <Button className="nova-gradient">
                  Siguiente <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Validar */}
        {activeTab === 'validar' && (
          <ValidationCard validations={PENDING_VALIDATIONS} delay={1} />
        )}
      </div>
    </>
  );
}
