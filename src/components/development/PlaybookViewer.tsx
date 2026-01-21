import { useState } from 'react';
import { BookOpen, Sparkles, Target, TrendingUp, AlertCircle, Loader2, RefreshCw, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { usePlaybookForRole, useGeneratePlaybook, type UserPlaybook } from '@/hooks/useDevelopment';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface PlaybookViewerProps {
  roleName: string;
}

export function PlaybookViewer({ roleName }: PlaybookViewerProps) {
  const { profile } = useAuth();
  const { data: playbook, isLoading } = usePlaybookForRole(profile?.id, roleName);
  const generatePlaybook = useGeneratePlaybook();
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!profile?.id) return;
    
    setGenerating(true);
    try {
      await generatePlaybook.mutateAsync({
        userId: profile.id,
        roleName,
      });
      toast.success('Playbook generado con éxito');
    } catch (error) {
      toast.error('Error al generar el playbook');
    } finally {
      setGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!playbook) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-10 text-center">
          <BookOpen size={48} className="mx-auto text-muted-foreground/50 mb-4" />
          <h3 className="font-semibold mb-2">Sin Playbook para {roleName}</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Genera un playbook personalizado basado en tu rendimiento y experiencia
          </p>
          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Generar con IA
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen className="text-primary" size={24} />
          </div>
          <div>
            <h3 className="font-bold text-lg">Playbook: {playbook.role_name}</h3>
            <p className="text-sm text-muted-foreground">
              Versión {playbook.version} • Generado{' '}
              {formatDistanceToNow(new Date(playbook.generated_at), { addSuffix: true, locale: es })}
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          <span className="ml-2">Regenerar</span>
        </Button>
      </div>

      {/* Strengths & Areas for Improvement */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-success">
              <CheckCircle size={16} />
              Fortalezas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {playbook.fortalezas.map((f, i) => (
                <Badge key={i} variant="secondary" className="bg-success/10 text-success border-success/20">
                  {f}
                </Badge>
              ))}
              {playbook.fortalezas.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-500">
              <AlertCircle size={16} />
              Áreas de Mejora
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {playbook.areas_mejora.map((a, i) => (
                <Badge key={i} variant="secondary" className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                  {a}
                </Badge>
              ))}
              {playbook.areas_mejora.length === 0 && (
                <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Sections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target size={18} />
            Guía del Rol
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {playbook.contenido.sections?.map((section, index) => (
              <AccordionItem key={index} value={`section-${index}`}>
                <AccordionTrigger className="text-left">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="prose prose-sm max-w-none text-muted-foreground">
                    <p>{section.content}</p>
                    {section.tips && section.tips.length > 0 && (
                      <div className="mt-3">
                        <p className="font-medium text-foreground text-sm mb-2">Tips:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          {section.tips.map((tip, i) => (
                            <li key={i}>{tip}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )) || (
              <p className="text-muted-foreground text-sm">Sin contenido disponible</p>
            )}
          </Accordion>
        </CardContent>
      </Card>

      {/* Suggested Objectives */}
      {playbook.objetivos_sugeridos && playbook.objetivos_sugeridos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={18} />
              Objetivos Sugeridos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {playbook.objetivos_sugeridos.map((obj, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{obj.objetivo}</span>
                    <Badge variant="outline">{obj.plazo}</Badge>
                  </div>
                  {obj.metricas && (
                    <div className="flex gap-2 flex-wrap">
                      {obj.metricas.map((m, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Model Info */}
      {playbook.ai_model && (
        <p className="text-xs text-muted-foreground text-center">
          Generado con {playbook.ai_model}
        </p>
      )}
    </div>
  );
}
