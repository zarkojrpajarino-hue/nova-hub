/**
 * OBVPreviewList — V5.5.1
 * Grid/list rendering of OBVs extracted from OBVCenterPreviewModal
 */

import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  DollarSign,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import type { OBV, OBVStatus } from '@/data/obvCenterDemoData';

export function getStatusIcon(status: OBVStatus) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="h-4 w-4" />;
    case 'in-progress':
      return <Clock className="h-4 w-4" />;
    case 'pending':
      return <AlertCircle className="h-4 w-4" />;
    case 'at-risk':
      return <AlertCircle className="h-4 w-4" />;
  }
}

export function getStatusColor(status: OBVStatus) {
  switch (status) {
    case 'completed':
      return 'bg-green-500/10 text-green-700 border-green-500/20';
    case 'in-progress':
      return 'bg-blue-500/10 text-blue-700 border-blue-500/20';
    case 'pending':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
    case 'at-risk':
      return 'bg-red-500/10 text-red-700 border-red-500/20';
  }
}

export function getImpactColor(impact: string) {
  switch (impact) {
    case 'high':
      return 'bg-purple-500/10 text-purple-700 border-purple-500/20';
    case 'medium':
      return 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20';
    case 'low':
      return 'bg-gray-500/10 text-gray-700 border-gray-500/20';
  }
}

interface OBVPreviewListProps {
  obvs: OBV[];
  hoveredOBV: string | null;
  onHover: (id: string | null) => void;
  onSelect: (obv: OBV) => void;
  maxItems?: number;
  layout?: 'grid' | 'list';
}

export function OBVPreviewList({
  obvs,
  hoveredOBV,
  onHover,
  onSelect,
  maxItems = 8,
  layout = 'grid',
}: OBVPreviewListProps) {
  const items = obvs.slice(0, maxItems);

  if (layout === 'list') {
    return (
      <div className="grid grid-cols-1 gap-3">
        {items.map((obv) => (
          <div
            key={obv.id}
            className="p-4 rounded-lg border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all cursor-pointer"
            onClick={() => onSelect(obv)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                  {obv.ownerAvatar}
                </div>
                <div>
                  <div className="font-semibold">{obv.title}</div>
                  <div className="text-sm text-gray-500">
                    {obv.owner} &bull; {obv.project}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getImpactColor(obv.impact)}>{obv.impact}</Badge>
                <Badge className={getStatusColor(obv.status)}>
                  {getStatusIcon(obv.status)}
                </Badge>
                <div className="text-sm font-semibold text-gray-700">{obv.progress}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.map((obv) => (
        <div
          key={obv.id}
          className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
            hoveredOBV === obv.id
              ? 'border-purple-400 shadow-lg scale-105'
              : 'border-gray-200 hover:border-purple-300'
          }`}
          onMouseEnter={() => onHover(obv.id)}
          onMouseLeave={() => onHover(null)}
          onClick={() => onSelect(obv)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {obv.ownerAvatar}
              </div>
              <div>
                <div className="font-semibold text-sm">{obv.title}</div>
                <div className="text-xs text-gray-500">{obv.id}</div>
              </div>
            </div>
            <Badge className={`${getStatusColor(obv.status)} flex items-center gap-1`}>
              {getStatusIcon(obv.status)}
              <span className="capitalize text-xs">{obv.status.replace('-', ' ')}</span>
            </Badge>
          </div>

          <div className="mb-3">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">Progreso</span>
              <span className="font-semibold">{obv.progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-purple-500 to-blue-500 h-2 rounded-full transition-all"
                style={{ width: `${obv.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-gray-500">
              <div className="flex items-center gap-1">
                <Paperclip className="h-3 w-3" />
                {obv.evidence}
              </div>
              <div className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {obv.comments}
              </div>
            </div>
            {obv.revenue > 0 && (
              <Badge className={getImpactColor(obv.impact)}>
                <DollarSign className="h-3 w-3" />
                {obv.impact}
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
