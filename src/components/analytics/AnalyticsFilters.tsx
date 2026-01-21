import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { MemberStats } from '@/hooks/useNovaData';

interface AnalyticsFiltersProps {
  members: MemberStats[];
  selectedPartners: string[];
  onPartnersChange: (partners: string[]) => void;
}

export function AnalyticsFilters({ 
  members, 
  selectedPartners, 
  onPartnersChange 
}: AnalyticsFiltersProps) {
  const togglePartner = (id: string) => {
    if (selectedPartners.includes(id)) {
      onPartnersChange(selectedPartners.filter(p => p !== id));
    } else {
      onPartnersChange([...selectedPartners, id]);
    }
  };

  const selectAll = () => {
    onPartnersChange(members.map(m => m.id || '').filter(Boolean));
  };

  const clearAll = () => {
    onPartnersChange([]);
  };

  return (
    <div className="mt-4 pt-4 border-t">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-medium">Filtrar por socios:</Label>
        <div className="flex gap-2">
          <button 
            onClick={selectAll}
            className="text-xs text-primary hover:underline"
          >
            Seleccionar todos
          </button>
          <span className="text-muted-foreground">|</span>
          <button 
            onClick={clearAll}
            className="text-xs text-primary hover:underline"
          >
            Limpiar
          </button>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-4">
        {members.map(member => (
          <div key={member.id} className="flex items-center gap-2">
            <Checkbox 
              id={`filter-${member.id}`}
              checked={selectedPartners.includes(member.id || '')}
              onCheckedChange={() => togglePartner(member.id || '')}
            />
            <label 
              htmlFor={`filter-${member.id}`}
              className="flex items-center gap-2 text-sm cursor-pointer"
            >
              <div 
                className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-semibold text-primary-foreground"
                style={{ background: member.color || '#6366F1' }}
              >
                {member.nombre?.charAt(0)}
              </div>
              {member.nombre}
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}
