import { Crown, Shield, Star, Swords, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ROLE_CONFIG } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface MasterCardProps {
  master: {
    id: string;
    user_id: string;
    role_name: string;
    level: number;
    title: string | null;
    appointed_at: string;
    total_mentees: number;
    successful_defenses: number;
    userName: string;
    userAvatar: string | null;
    userColor: string;
  };
  canChallenge?: boolean;
  onChallenge?: () => void;
}

const LEVEL_CONFIG = {
  1: { label: 'Master', icon: Crown, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  2: { label: 'Senior Master', icon: Shield, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  3: { label: 'Grand Master', icon: Star, color: 'text-rose-500', bg: 'bg-rose-500/10' },
};

export function MasterCard({ master, canChallenge, onChallenge }: MasterCardProps) {
  const roleConfig = ROLE_CONFIG[master.role_name];
  const levelConfig = LEVEL_CONFIG[master.level as keyof typeof LEVEL_CONFIG] || LEVEL_CONFIG[1];
  const LevelIcon = levelConfig.icon;

  return (
    <Card className="overflow-hidden hover:border-primary/30 transition-all">
      <div 
        className="h-1.5"
        style={{ background: roleConfig?.color || '#6366F1' }}
      />
      
      <CardContent className="p-4">
        <div className="flex items-start gap-3 mb-4">
          <Avatar className="w-14 h-14 border-2" style={{ borderColor: master.userColor }}>
            <AvatarImage src={master.userAvatar || undefined} />
            <AvatarFallback 
              style={{ background: master.userColor }}
              className="text-lg font-bold text-white"
            >
              {master.userName.charAt(0)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-bold truncate">{master.userName}</h4>
              <LevelIcon size={16} className={levelConfig.color} />
            </div>
            
            <Badge 
              variant="secondary"
              className={`${levelConfig.bg} ${levelConfig.color} border-0`}
            >
              {levelConfig.label}
            </Badge>
          </div>
        </div>
        
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rol</span>
            <Badge variant="outline" style={{ borderColor: roleConfig?.color, color: roleConfig?.color }}>
              {roleConfig?.label || master.role_name}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Desde hace</span>
            <span className="font-medium">
              {formatDistanceToNow(new Date(master.appointed_at), { locale: es })}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Users size={14} />
              Mentees
            </span>
            <span className="font-medium">{master.total_mentees}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Shield size={14} />
              Defensas
            </span>
            <span className="font-medium text-success">{master.successful_defenses}</span>
          </div>
        </div>
        
        {canChallenge && (
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={onChallenge}
          >
            <Swords size={14} />
            Desafiar
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
