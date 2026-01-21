import { useState } from 'react';
import { Plus, BookOpen, Trophy, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KPIUploadForm } from './KPIUploadForm';
import { KPIList } from './KPIList';
import { KPIValidationList } from './KPIValidationList';

interface KPITabContentProps {
  type: 'lp' | 'bp' | 'cp';
}

const TYPE_CONFIG = {
  lp: {
    label: 'Learning Path',
    icon: BookOpen,
    color: 'text-warning',
    bgColor: 'bg-warning/20',
  },
  bp: {
    label: 'Book Point',
    icon: Trophy,
    color: 'text-success',
    bgColor: 'bg-success/20',
  },
  cp: {
    label: 'Community Point',
    icon: Users,
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/20',
  },
};

export function KPITabContent({ type }: KPITabContentProps) {
  const [showUploadForm, setShowUploadForm] = useState(false);
  const config = TYPE_CONFIG[type];
  const Icon = config.icon;

  return (
    <div className="space-y-6">
      {/* Header with upload button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl ${config.bgColor} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${config.color}`} />
          </div>
          <h3 className="text-lg font-semibold">{config.label}s</h3>
        </div>
        <Button onClick={() => setShowUploadForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Subir nuevo
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My KPIs */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="text-base font-semibold mb-4">📋 Mis {config.label}s</h4>
          <KPIList type={type} />
        </div>

        {/* Pending validation */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <h4 className="text-base font-semibold mb-4">✅ Pendientes de validar</h4>
          <KPIValidationList type={type} />
        </div>
      </div>

      {/* Upload form modal */}
      <KPIUploadForm
        type={type}
        open={showUploadForm}
        onOpenChange={setShowUploadForm}
      />
    </div>
  );
}
