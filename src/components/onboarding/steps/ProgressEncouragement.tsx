/**
 * PROGRESS ENCOURAGEMENT
 * Mensajes motivacionales basados en progreso
 */

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, Sparkles, TrendingUp, Heart } from 'lucide-react';

interface ProgressEncouragementProps {
  completionPercentage: number;
  currentStep: number;
  totalSteps: number;
}

export function ProgressEncouragement({
  completionPercentage,
  currentStep,
  totalSteps
}: ProgressEncouragementProps) {
  const getMessage = () => {
    if (completionPercentage >= 100) {
      return {
        icon: CheckCircle2,
        color: 'from-green-500 to-emerald-600',
        title: '🎉 ¡Completado!',
        message: 'Has completado el onboarding más profundo que existe. Ahora tienes un roadmap personalizado ultra-específico para tu situación.',
        emoji: '🚀'
      };
    }

    if (completionPercentage >= 75) {
      return {
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-600',
        title: '🔥 Casi listo!',
        message: `Solo ${totalSteps - currentStep} pasos más. Ya casi tienes tu roadmap personalizado completo.`,
        emoji: '💪'
      };
    }

    if (completionPercentage >= 50) {
      return {
        icon: Sparkles,
        color: 'from-blue-500 to-cyan-600',
        title: '✨ Mitad del camino!',
        message: 'Vas excelente. La información que estás compartiendo nos permite crear recomendaciones ultra-específicas.',
        emoji: '📊'
      };
    }

    if (completionPercentage >= 25) {
      return {
        icon: Heart,
        color: 'from-orange-500 to-yellow-600',
        title: '🌟 Buen progreso!',
        message: 'Cada respuesta nos ayuda a entender mejor tu contexto único y personalizar el roadmap.',
        emoji: '🎯'
      };
    }

    return {
      icon: Heart,
      color: 'from-blue-500 to-purple-600',
      title: '👋 Bienvenid@!',
      message: 'Este onboarding es profundo pero vale la pena. Al final tendrás clarity total sobre tu próximos pasos.',
      emoji: '💡'
    };
  };

  const { icon: Icon, color, title, message, emoji } = getMessage();

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="text-5xl">{emoji}</div>
          <div className="flex-1">
            <div className={`inline-block px-4 py-2 rounded-full bg-gradient-to-r ${color} text-white font-bold mb-3 shadow-lg`}>
              {title}
            </div>
            <p className="text-gray-700 font-medium leading-relaxed">
              {message}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-gray-600">
              <Icon className="h-4 w-4" />
              <span>Paso {currentStep} de {totalSteps} • {completionPercentage.toFixed(0)}% completado</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
