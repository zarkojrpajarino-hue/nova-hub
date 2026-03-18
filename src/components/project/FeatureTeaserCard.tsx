import { Lock } from 'lucide-react';
import type { FeatureTeaser } from '@/lib/teasers';

interface FeatureTeaserCardProps {
  teaser: FeatureTeaser;
}

export function FeatureTeaserCard({ teaser }: FeatureTeaserCardProps) {
  return (
    <div className="rounded-xl bg-muted/30 border border-border px-3 py-2.5">
      <div className="flex items-center gap-2 mb-1">
        <Lock size={13} className="text-muted-foreground shrink-0" />
        <span className="text-sm font-medium flex-1 leading-tight">{teaser.title}</span>
        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-md shrink-0">
          Pendiente
        </span>
      </div>
      <p className="text-xs text-muted-foreground leading-snug mb-1">{teaser.description}</p>
      <p className="text-xs text-muted-foreground/70 leading-snug">
        Se desbloquea cuando: {teaser.unlockCondition.toLowerCase()}
      </p>
    </div>
  );
}
