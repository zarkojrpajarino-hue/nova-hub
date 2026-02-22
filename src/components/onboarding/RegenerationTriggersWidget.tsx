/**
 * 🔄 REGENERATION TRIGGERS WIDGET
 *
 * Shows context accumulation progress and available regenerations
 * Displays when AI can improve artifacts with new data
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Sparkles,
  RefreshCw,
  TrendingUp,
  CheckCircle2,
  Clock,
  Zap,
} from 'lucide-react';
import { ContextAggregator, REGENERATION_TRIGGERS } from '@/lib/context-aggregator';
import { toast } from 'sonner';
import confetti from '@/lib/confetti';

interface RegenerationTriggersWidgetProps {
  projectId: string;
}

export function RegenerationTriggersWidget({ projectId }: RegenerationTriggersWidgetProps) {
  const [triggerProgress, setTriggerProgress] = useState<any[]>([]);
  const [qualityScore, setQualityScore] = useState(0);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTriggerData();
  }, [projectId]);

  const loadTriggerData = async () => {
    const aggregator = new ContextAggregator(projectId);
    const progress = await aggregator.getTriggerProgress();
    const score = await aggregator.getContextQualityScore();

    setTriggerProgress(progress);
    setQualityScore(score);
    setLoading(false);
  };

  const handleRegenerate = async (triggerId: string, artifactType: string) => {
    setIsRegenerating(true);

    try {
      // Simulate AI regeneration (in real implementation, call AI service)
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Mark as regenerated
      const aggregator = new ContextAggregator(projectId);
      await aggregator.markRegenerated(triggerId);

      // Show success
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });

      toast.success('Artifact regenerated!', {
        description: `${artifactType} updated with latest context`
      });

      // Reload data
      await loadTriggerData();
    } catch (error) {
      console.error('Error regenerating:', error);
      toast.error('Regeneration failed', {
        description: 'Please try again'
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  const readyTriggers = triggerProgress.filter(t => t.ready);
  const inProgressTriggers = triggerProgress.filter(t => !t.ready && t.percentage > 0);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-purple-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">AI Regeneration Opportunities</CardTitle>
              <CardDescription>
                Update your artifacts with accumulated real-world data
              </CardDescription>
            </div>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-purple-600">{qualityScore}%</div>
            <div className="text-xs text-gray-600">Context Quality</div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Ready Triggers */}
        {readyTriggers.length > 0 && (
          <div className="space-y-3">
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-900">
                <strong>{readyTriggers.length} regeneration{readyTriggers.length > 1 ? 's' : ''} available!</strong> Click to update with latest data.
              </AlertDescription>
            </Alert>

            {readyTriggers.map(({ trigger, current, threshold }) => (
              <Card key={trigger.id} className="border-2 border-green-300 bg-green-50/50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="text-3xl">{trigger.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{trigger.name}</h4>
                        <p className="text-sm text-gray-600">{trigger.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {current} / {threshold}
                          </Badge>
                          <Badge className="bg-green-600 gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Ready
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => handleRegenerate(trigger.id, trigger.artifact_type)}
                      disabled={isRegenerating}
                      className="gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                    >
                      {isRegenerating ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          Regenerating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4" />
                          Regenerate
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* In Progress Triggers */}
        {inProgressTriggers.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Building Context
            </h4>

            {inProgressTriggers.map(({ trigger, current, threshold, percentage }) => (
              <div key={trigger.id} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{trigger.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{trigger.name}</span>
                  </div>
                  <span className="text-xs text-gray-600">
                    {current} / {threshold}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <p className="text-xs text-gray-500 mt-1">{trigger.description}</p>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {readyTriggers.length === 0 && inProgressTriggers.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🎯</div>
            <h4 className="font-semibold text-gray-900 mb-2">Start Building Context</h4>
            <p className="text-sm text-gray-600 max-w-md mx-auto">
              As you conduct customer interviews, close deals, and gather data,
              AI will offer to regenerate your strategic documents with real insights.
            </p>
          </div>
        )}

        {/* Quality Score Info */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <span className="text-gray-700">Context Quality Score</span>
            </div>
            <div className="flex items-center gap-2">
              <Progress value={qualityScore} className="w-24 h-2" />
              <span className="font-semibold text-purple-600">{qualityScore}%</span>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Higher quality context = More accurate AI insights. Keep adding real data!
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
