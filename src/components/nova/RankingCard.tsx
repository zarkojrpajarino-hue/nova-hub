import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Member } from '@/data/mockData';

interface RankingCardProps {
  title: string;
  icon: LucideIcon;
  iconColor: string;
  members: Member[];
  valueKey: keyof Member;
  formatValue?: (value: number) => string;
  objective: number;
  delay?: number;
}

export function RankingCard({
  title,
  icon: Icon,
  iconColor,
  members,
  valueKey,
  formatValue = (v) => String(v),
  objective,
  delay = 2
}: RankingCardProps) {
  return (
    <section
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden animate-fade-in",
        `delay-${delay}`
      )}
      style={{ opacity: 0 }}
      aria-label={`Ranking de ${title}`}
    >
      <div className="p-5 border-b border-border flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2.5">
          <Icon size={18} style={{ color: iconColor }} aria-hidden="true" />
          {title}
        </h3>
      </div>

      <div className="p-4">
        <ol className="space-y-2" aria-label="Lista de ranking">
          {members.slice(0, 5).map((member, i) => {
            const value = member[valueKey] as number;
            const progress = (value / objective) * 100;

            return (
              <li
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-background hover:bg-muted/50 transition-colors cursor-pointer"
                aria-label={`Posición ${i + 1}: ${member.nombre} con ${formatValue(value)}, ${progress.toFixed(0)}% del objetivo`}
              >
                {/* Position */}
                <div
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center font-bold text-sm",
                    i === 0 && "bg-gradient-to-br from-yellow-400 to-amber-500 text-black",
                    i === 1 && "bg-gradient-to-br from-slate-300 to-slate-400 text-black",
                    i === 2 && "bg-gradient-to-br from-amber-600 to-amber-700 text-white",
                    i > 2 && "bg-muted text-muted-foreground"
                  )}
                  aria-label={`Posición ${i + 1}`}
                >
                  {i + 1}
                </div>

                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm text-white"
                  style={{ background: member.color }}
                  aria-label={`Avatar de ${member.nombre}`}
                >
                  {member.nombre.charAt(0)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{member.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {progress.toFixed(0)}% del objetivo
                  </p>
                </div>

                {/* Value */}
                <p className="font-bold text-base" aria-label={`Valor: ${formatValue(value)}`}>{formatValue(value)}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
