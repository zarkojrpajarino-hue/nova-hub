import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Activity } from '@/data/mockData';

const DOT_COLORS = ['#6366F1', '#22C55E', '#F59E0B', '#EC4899', '#3B82F6'];

interface ActivityCardProps {
  activities: Activity[];
  delay?: number;
}

export function ActivityCard({ activities, delay = 4 }: ActivityCardProps) {
  return (
    <section
      className={cn(
        "bg-card border border-border rounded-2xl overflow-hidden animate-fade-in",
        `delay-${delay}`
      )}
      style={{ opacity: 0 }}
      aria-label="Actividad reciente del equipo"
    >
      <div className="p-5 border-b border-border flex items-center gap-2.5">
        <Zap size={18} className="text-warning" aria-hidden="true" />
        <h3 className="font-semibold">Actividad Reciente</h3>
      </div>

      <div className="p-3">
        <ul className="space-y-1" role="feed" aria-label="Feed de actividades recientes">
          {activities.map((activity, i) => (
            <li
              key={activity.id}
              className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted/50 transition-colors"
              role="article"
              aria-label={`${activity.user} ${activity.action} ${activity.target}${activity.amount ? ` ${activity.amount}` : ''} hace ${activity.time}`}
            >
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: DOT_COLORS[i % DOT_COLORS.length] }}
                aria-hidden="true"
              />

              <div className="flex-1 text-sm">
                <span className="font-semibold">{activity.user}</span>
                <span className="text-muted-foreground"> {activity.action} </span>
                <span className="text-primary font-medium">{activity.target}</span>
                {activity.amount && (
                  <span className="text-success font-bold"> {activity.amount}</span>
                )}
              </div>

              <time className="text-xs text-muted-foreground" dateTime={activity.time}>{activity.time}</time>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
