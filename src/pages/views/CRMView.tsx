import { Plus } from 'lucide-react';
import { NovaHeader } from '@/components/nova/NovaHeader';
import { SAMPLE_LEADS } from '@/data/mockData';

const PIPELINE_STAGES = [
  { id: 'frio', label: 'Frío', color: '#64748B' },
  { id: 'tibio', label: 'Tibio', color: '#F59E0B' },
  { id: 'hot', label: 'Hot', color: '#EF4444' },
  { id: 'propuesta', label: 'Propuesta', color: '#A855F7' },
  { id: 'negociacion', label: 'Negociación', color: '#3B82F6' },
  { id: 'cerrado_ganado', label: 'Cerrado', color: '#22C55E' },
];

interface CRMViewProps {
  onNewOBV?: () => void;
}

export function CRMView({ onNewOBV }: CRMViewProps) {
  return (
    <>
      <NovaHeader 
        title="CRM Global" 
        subtitle="Pipeline de todos los proyectos" 
        onNewOBV={onNewOBV} 
      />
      
      <div className="p-8">
        <div className="grid grid-cols-6 gap-4 overflow-x-auto pb-4">
          {PIPELINE_STAGES.map((stage, i) => {
            const leads = SAMPLE_LEADS.filter(l => l.status === stage.id);
            
            return (
              <div 
                key={stage.id} 
                className="min-w-[240px] animate-fade-in"
                style={{ opacity: 0, animationDelay: `${i * 0.05}s` }}
              >
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
                    {leads.length}
                  </span>
                </div>

                {/* Cards Container */}
                <div className="bg-background rounded-b-xl p-2 min-h-[200px] space-y-2">
                  {leads.map(lead => (
                    <div 
                      key={lead.id}
                      className="bg-card border border-border rounded-lg p-4 cursor-pointer hover:border-muted-foreground/30 transition-all"
                    >
                      <p className="font-semibold text-sm mb-1">{lead.nombre}</p>
                      <p className="text-xs text-muted-foreground mb-3">{lead.empresa}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-success">
                          {lead.valor > 0 ? `€${lead.valor}` : '-'}
                        </span>
                        <span className="text-[11px] bg-muted px-2 py-1 rounded-md">
                          {lead.proyecto}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {/* Add Lead Button */}
                  <button className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm text-muted-foreground hover:border-muted-foreground/50 hover:text-foreground transition-colors flex items-center justify-center gap-2">
                    <Plus size={16} />
                    Añadir lead
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
