import { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PIPELINE_STAGES } from './LeadForm';

interface CRMFiltersProps {
  projects: Array<{ id: string; nombre: string; icon: string }>;
  members: Array<{ id: string; nombre: string; color: string }>;
  filters: {
    project: string;
    responsable: string;
    status: string;
    minValue: string;
    maxValue: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function CRMFilters({ projects, members, filters, onFiltersChange }: CRMFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const activeFiltersCount = [
    filters.project !== 'all',
    filters.responsable !== 'all',
    filters.status !== 'all',
    filters.minValue,
    filters.maxValue,
  ].filter(Boolean).length;

  const clearFilters = () => {
    onFiltersChange({
      project: 'all',
      responsable: 'all',
      status: 'all',
      minValue: '',
      maxValue: '',
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Button 
          variant={isExpanded ? "default" : "outline"} 
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Filter size={14} className="mr-2" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-2 h-5 px-1.5">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>

        {activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X size={14} className="mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      {isExpanded && (
        <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-xl animate-fade-in">
          {/* Project filter */}
          <div className="w-[180px]">
            <Select 
              value={filters.project} 
              onValueChange={(v) => onFiltersChange({ ...filters, project: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Proyecto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los proyectos</SelectItem>
                {projects.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.icon} {p.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Responsable filter */}
          <div className="w-[180px]">
            <Select 
              value={filters.responsable} 
              onValueChange={(v) => onFiltersChange({ ...filters, responsable: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Responsable" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {members.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: m.color }}
                      />
                      {m.nombre}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Status filter */}
          <div className="w-[180px]">
            <Select 
              value={filters.status} 
              onValueChange={(v) => onFiltersChange({ ...filters, status: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {PIPELINE_STAGES.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Value range */}
          <div className="flex items-center gap-2">
            <Input
              type="number"
              placeholder="Min €"
              value={filters.minValue}
              onChange={(e) => onFiltersChange({ ...filters, minValue: e.target.value })}
              className="w-[100px]"
            />
            <span className="text-muted-foreground">-</span>
            <Input
              type="number"
              placeholder="Max €"
              value={filters.maxValue}
              onChange={(e) => onFiltersChange({ ...filters, maxValue: e.target.value })}
              className="w-[100px]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
