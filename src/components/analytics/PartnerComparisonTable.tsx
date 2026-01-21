import { useState, useMemo } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MemberStats } from '@/hooks/useNovaData';

interface PartnerComparisonTableProps {
  members: MemberStats[];
  onSelectPartner: (id: string) => void;
  selectedPartners: string[];
}

type SortKey = 'nombre' | 'obvs' | 'lps' | 'bps' | 'cps' | 'facturacion' | 'margen';

export function PartnerComparisonTable({ 
  members, 
  onSelectPartner,
  selectedPartners 
}: PartnerComparisonTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('obvs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sortedMembers = useMemo(() => {
    return [...members].sort((a, b) => {
      const aVal = a[sortKey] ?? 0;
      const bVal = b[sortKey] ?? 0;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      const aNum = Number(aVal) || 0;
      const bNum = Number(bVal) || 0;
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum;
    });
  }, [members, sortKey, sortDir]);

  const SortHeader = ({ label, sortKeyName }: { label: string; sortKeyName: SortKey }) => (
    <TableHead 
      className="cursor-pointer hover:bg-muted/50 select-none"
      onClick={() => handleSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortKey === sortKeyName && (
          sortDir === 'asc' 
            ? <ChevronUp className="w-4 h-4" /> 
            : <ChevronDown className="w-4 h-4" />
        )}
      </div>
    </TableHead>
  );

  // Calculate team averages
  const averages = useMemo(() => ({
    obvs: members.reduce((sum, m) => sum + (Number(m.obvs) || 0), 0) / members.length,
    lps: members.reduce((sum, m) => sum + (Number(m.lps) || 0), 0) / members.length,
    bps: members.reduce((sum, m) => sum + (Number(m.bps) || 0), 0) / members.length,
    cps: members.reduce((sum, m) => sum + (Number(m.cps) || 0), 0) / members.length,
    facturacion: members.reduce((sum, m) => sum + (Number(m.facturacion) || 0), 0) / members.length,
    margen: members.reduce((sum, m) => sum + (Number(m.margen) || 0), 0) / members.length,
  }), [members]);

  const getComparison = (value: number, avg: number) => {
    if (value >= avg * 1.2) return 'text-green-600 font-medium';
    if (value <= avg * 0.8) return 'text-red-500';
    return '';
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <span className="sr-only">Seleccionar</span>
          </TableHead>
          <SortHeader label="Socio" sortKeyName="nombre" />
          <SortHeader label="OBVs" sortKeyName="obvs" />
          <SortHeader label="LPs" sortKeyName="lps" />
          <SortHeader label="BPs" sortKeyName="bps" />
          <SortHeader label="CPs" sortKeyName="cps" />
          <SortHeader label="Facturación" sortKeyName="facturacion" />
          <SortHeader label="Margen" sortKeyName="margen" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedMembers.map((member) => (
          <TableRow 
            key={member.id}
            className={cn(
              selectedPartners.includes(member.id || '') && "bg-primary/5"
            )}
          >
            <TableCell>
              <Checkbox 
                checked={selectedPartners.includes(member.id || '')}
                onCheckedChange={() => onSelectPartner(member.id || '')}
                disabled={!selectedPartners.includes(member.id || '') && selectedPartners.length >= 3}
              />
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold text-primary-foreground"
                  style={{ background: member.color || '#6366F1' }}
                >
                  {member.nombre?.charAt(0)}
                </div>
                <span className="font-medium">{member.nombre}</span>
              </div>
            </TableCell>
            <TableCell className={getComparison(Number(member.obvs) || 0, averages.obvs)}>
              {member.obvs || 0}
            </TableCell>
            <TableCell className={getComparison(Number(member.lps) || 0, averages.lps)}>
              {member.lps || 0}
            </TableCell>
            <TableCell className={getComparison(Number(member.bps) || 0, averages.bps)}>
              {member.bps || 0}
            </TableCell>
            <TableCell className={getComparison(Number(member.cps) || 0, averages.cps)}>
              {member.cps || 0}
            </TableCell>
            <TableCell className={getComparison(Number(member.facturacion) || 0, averages.facturacion)}>
              €{(Number(member.facturacion) || 0).toLocaleString()}
            </TableCell>
            <TableCell className={getComparison(Number(member.margen) || 0, averages.margen)}>
              €{(Number(member.margen) || 0).toLocaleString()}
            </TableCell>
          </TableRow>
        ))}
        {/* Average Row */}
        <TableRow className="bg-muted/30 font-medium">
          <TableCell />
          <TableCell>📊 Media del equipo</TableCell>
          <TableCell>{averages.obvs.toFixed(1)}</TableCell>
          <TableCell>{averages.lps.toFixed(1)}</TableCell>
          <TableCell>{averages.bps.toFixed(1)}</TableCell>
          <TableCell>{averages.cps.toFixed(1)}</TableCell>
          <TableCell>€{averages.facturacion.toLocaleString()}</TableCell>
          <TableCell>€{averages.margen.toLocaleString()}</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
