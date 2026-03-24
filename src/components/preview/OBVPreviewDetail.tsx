/**
 * OBVPreviewDetail — V5.5.1
 * Detail view for a single OBV, extracted from OBVCenterPreviewModal
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from 'react-i18next';
import {
  ChevronLeft,
  Target,
  Users,
  Calendar,
  CheckCircle2,
  Eye,
  Paperclip,
  MessageSquare,
} from 'lucide-react';
import type { OBV } from '@/data/obvCenterDemoData';
import { getStatusColor, getStatusIcon } from './OBVPreviewList';

interface OBVPreviewDetailProps {
  obv: OBV;
  onBack: () => void;
}

export function OBVPreviewDetail({ obv, onBack }: OBVPreviewDetailProps) {
  const { t } = useTranslation();

  return (
    <div className="overflow-auto p-6">
      <div className="mb-6">
        <Button variant="ghost" size="sm" onClick={onBack} className="mb-4">
          <ChevronLeft className="h-4 w-4 mr-1" />
          {t('preview.volverAlGrid')}
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
              <Eye className="h-6 w-6 text-purple-600" />
              {obv.title}
            </h2>
            <p className="text-gray-600">{obv.id}</p>
          </div>
          <Badge className={`${getStatusColor(obv.status)} text-base px-4 py-1`}>
            {getStatusIcon(obv.status)}
            <span className="ml-2 capitalize">{obv.status.replace('-', ' ')}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
          <div className="text-sm text-purple-600 mb-1">{t('preview.progreso')}</div>
          <div className="text-3xl font-bold text-purple-700">{obv.progress}%</div>
          <div className="w-full bg-purple-200 rounded-full h-2 mt-2">
            <div className="bg-purple-600 h-2 rounded-full" style={{ width: `${obv.progress}%` }} />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
          <div className="text-sm text-green-600 mb-1">{t('preview.revenueImpact')}</div>
          <div className="text-3xl font-bold text-green-700">
            ${(obv.revenue / 1000).toFixed(0)}K
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-600 mb-1">{t('preview.impacto')}</div>
          <div className="text-3xl font-bold text-blue-700 capitalize">{obv.impact}</div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Target className="h-5 w-5 text-purple-600" />
          {t('preview.descripción')}
        </h3>
        <p className="text-gray-700">{obv.description}</p>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-600" />
            {t('preview.ownerTeam')}
          </h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center text-white font-bold">
              {obv.ownerAvatar}
            </div>
            <div>
              <div className="font-semibold">{obv.owner}</div>
              <div className="text-sm text-gray-500">{t('preview.owner')}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {obv.team.map((member, idx) => (
              <div
                key={idx}
                className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-white text-xs font-bold"
              >
                {member}
              </div>
            ))}
            <div className="text-sm text-gray-500">+{obv.team.length} miembros</div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5 text-purple-600" />
            {t('preview.timeline')}
          </h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Inicio:</span>
              <span className="font-semibold">{obv.startDate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Fin:</span>
              <span className="font-semibold">{obv.endDate}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Proyecto:</span>
              <Badge variant="outline">{obv.project}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          {t('preview.keyResults')}
        </h3>
        <div className="space-y-2">
          {obv.keyResults.map((kr, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700">{kr}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-blue-600 mb-1">{t('preview.evidencias')}</div>
              <div className="text-3xl font-bold text-blue-700">{obv.evidence}</div>
            </div>
            <Paperclip className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-purple-600 mb-1">{t('preview.comentarios')}</div>
              <div className="text-3xl font-bold text-purple-700">{obv.comments}</div>
            </div>
            <MessageSquare className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>
    </div>
  );
}
