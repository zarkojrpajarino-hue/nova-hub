/**
 * COMPLETION SUMMARY
 * Resumen final y preview de lo que recibirán
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  Target,
  TrendingUp,
  FileText,
  Lightbulb,
  Users,
  DollarSign,
  Calendar,
  ArrowRight
} from 'lucide-react';

interface CompletionSummaryProps {
  onComplete: () => void;
  isGenerating?: boolean;
}

export function CompletionSummary({ onComplete, isGenerating }: CompletionSummaryProps) {
  const deliverables = [
    {
      icon: Target,
      title: 'Roadmap Personalizado',
      description: 'Plan paso-a-paso específico para tu situación, goals y constraints',
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Financial Projections',
      description: 'Proyecciones realistas basadas en tu modelo de negocio',
      color: 'green'
    },
    {
      icon: FileText,
      title: 'SWOT Analysis',
      description: 'Análisis competitivo con tus ventajas y amenazas específicas',
      color: 'purple'
    },
    {
      icon: Lightbulb,
      title: 'Strategic Recommendations',
      description: 'Prioridades y quick wins basados en tu contexto',
      color: 'orange'
    },
    {
      icon: Users,
      title: 'Team & Hiring Plan',
      description: 'Cuándo y a quién contratar según tu growth',
      color: 'pink'
    },
    {
      icon: DollarSign,
      title: 'Funding Strategy',
      description: 'Bootstrap vs raise, timing, y pitch deck outline',
      color: 'cyan'
    },
    {
      icon: Calendar,
      title: '12-Month Milestones',
      description: 'Objetivos concretos mes a mes',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      orange: { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'text-orange-600' },
      pink: { bg: 'bg-pink-50', text: 'text-pink-700', icon: 'text-pink-600' },
      cyan: { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: 'text-cyan-600' },
      indigo: { bg: 'bg-indigo-50', text: 'text-indigo-700', icon: 'text-indigo-600' },
    };
    return colors[color] || colors.blue;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 mb-6 shadow-2xl">
          <CheckCircle2 className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
          ¡Onboarding Completado!
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Has compartido información ultra-valiosa. Ahora la IA generará tu roadmap personalizado.
        </p>
      </div>

      {/* What You'll Receive */}
      <Card className="border-2 border-green-200">
        <CardHeader>
          <CardTitle className="text-2xl">🎁 Lo Que Recibirás</CardTitle>
          <CardDescription className="text-base">
            Basado en tus respuestas, generaremos:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {deliverables.map((item, idx) => {
              const Icon = item.icon;
              const colors = getColorClasses(item.color);

              return (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border-2 ${colors.bg} border-${item.color}-200 hover:shadow-lg transition-shadow`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${colors.icon} mt-1`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <div className="font-bold mb-1">{item.title}</div>
                      <div className={`text-sm ${colors.text}`}>
                        {item.description}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Generation Time */}
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="text-4xl">⏱️</div>
            <div>
              <div className="font-bold text-lg mb-1">Tiempo de Generación</div>
              <p className="text-gray-700">
                La IA procesará toda tu información en <strong>2-3 minutos</strong>.
                Recibirás notificación cuando esté listo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Next Steps Preview */}
      <Card className="border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🚀 Próximos Pasos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Badge className="bg-purple-600">1</Badge>
              <span className="font-medium">IA genera tu roadmap personalizado</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Badge className="bg-purple-600">2</Badge>
              <span className="font-medium">Revisas resultados en tu Startup OS Dashboard</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Badge className="bg-purple-600">3</Badge>
              <span className="font-medium">Recibes tareas prioritizadas para empezar HOY</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Badge className="bg-purple-600">4</Badge>
              <span className="font-medium">IA te guía semana a semana con recomendaciones</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={onComplete}
          disabled={isGenerating}
          size="lg"
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white text-lg px-12 py-6 shadow-xl hover:shadow-2xl transition-all"
        >
          {isGenerating ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
              Generando Roadmap...
            </>
          ) : (
            <>
              Generar Mi Roadmap
              <ArrowRight className="ml-2 h-5 w-5" />
            </>
          )}
        </Button>
      </div>

      {/* Fine Print */}
      <div className="text-center text-sm text-gray-700">
        <p>
          💡 Tip: Puedes volver a completar el onboarding cuando cambien tus circunstancias.
          El roadmap se actualizará automáticamente.
        </p>
      </div>
    </div>
  );
}
