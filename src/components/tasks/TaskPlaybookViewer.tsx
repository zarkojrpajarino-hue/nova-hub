import { useState } from 'react';
import { 
  BookOpen, CheckSquare, Wrench, FileText, MessageSquare, 
  Clock, AlertTriangle, Lightbulb, ExternalLink, Copy, Check,
  ChevronRight, Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Playbook {
  resumen_ejecutivo: string;
  preparacion: {
    antes_de_empezar: string[];
    materiales_necesarios: string[];
    conocimientos_previos: string[];
  };
  pasos: Array<{
    numero: number;
    titulo: string;
    descripcion: string;
    tiempo_estimado: string;
    tips: string[];
    errores_comunes: string[];
  }>;
  herramientas: Array<{
    nombre: string;
    url?: string;
    para_que: string;
    alternativa?: string;
  }>;
  recursos: Array<{
    tipo: string;
    titulo: string;
    descripcion: string;
    contenido?: string;
    url?: string;
  }>;
  script_sugerido?: string;
  preguntas_clave?: string[];
  checklist_final: string[];
  siguiente_paso: string;
}

interface TaskPlaybookViewerProps {
  playbook: Playbook;
  taskTitle: string;
  onClose?: () => void;
}

export function TaskPlaybookViewer({ playbook, taskTitle, onClose }: TaskPlaybookViewerProps) {
  const [copiedScript, setCopiedScript] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const toggleStep = (stepNum: number) => {
    setCompletedSteps(prev => 
      prev.includes(stepNum) 
        ? prev.filter(n => n !== stepNum)
        : [...prev, stepNum]
    );
  };

  const toggleChecklist = (index: number) => {
    setCheckedItems(prev =>
      prev.includes(index)
        ? prev.filter(n => n !== index)
        : [...prev, index]
    );
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado al portapapeles`);
  };

  const copyScript = () => {
    if (playbook.script_sugerido) {
      navigator.clipboard.writeText(playbook.script_sugerido);
      setCopiedScript(true);
      toast.success('Script copiado al portapapeles');
      setTimeout(() => setCopiedScript(false), 2000);
    }
  };

  const progress = playbook.pasos.length > 0 
    ? Math.round((completedSteps.length / playbook.pasos.length) * 100)
    : 0;
  
  const checklistProgress = playbook.checklist_final.length > 0
    ? Math.round((checkedItems.length / playbook.checklist_final.length) * 100)
    : 0;

  return (
    <Card className="w-full">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg truncate">Playbook: {taskTitle}</CardTitle>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {playbook.resumen_ejecutivo}
            </p>
          </div>
          <Badge variant="outline" className="shrink-0">
            {progress}% completado
          </Badge>
        </div>
        
        {/* Progress Bar */}
        <Progress value={progress} className="h-2 mt-3" />
      </CardHeader>

      <CardContent className="pt-0">
        <Tabs defaultValue="pasos" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-4">
            <TabsTrigger value="preparacion" className="text-xs">Preparación</TabsTrigger>
            <TabsTrigger value="pasos" className="text-xs">Pasos</TabsTrigger>
            <TabsTrigger value="herramientas" className="text-xs">Herramientas</TabsTrigger>
            <TabsTrigger value="recursos" className="text-xs">Recursos</TabsTrigger>
            <TabsTrigger value="checklist" className="text-xs">Checklist</TabsTrigger>
          </TabsList>

          {/* Preparación */}
          <TabsContent value="preparacion" className="space-y-4">
            <Accordion type="multiple" defaultValue={['antes', 'materiales']}>
              <AccordionItem value="antes">
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Antes de empezar
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {playbook.preparacion.antes_de_empezar.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="materiales">
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    Materiales necesarios
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {playbook.preparacion.materiales_necesarios.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckSquare className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem value="conocimientos">
                <AccordionTrigger className="text-sm font-medium">
                  <span className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-yellow-500" />
                    Conocimientos previos
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <ul className="space-y-2">
                    {playbook.preparacion.conocimientos_previos.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <Lightbulb className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </TabsContent>

          {/* Pasos */}
          <TabsContent value="pasos" className="space-y-3">
            <Accordion type="single" collapsible className="w-full">
              {playbook.pasos.map((paso) => (
                <AccordionItem key={paso.numero} value={`paso-${paso.numero}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStep(paso.numero);
                        }}
                        className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors shrink-0",
                          completedSteps.includes(paso.numero)
                            ? "bg-green-500 text-white"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {completedSteps.includes(paso.numero) ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          paso.numero
                        )}
                      </button>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm">{paso.titulo}</p>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {paso.tiempo_estimado}
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pl-11">
                    <p className="text-sm text-muted-foreground mb-4">{paso.descripcion}</p>
                    
                    <div className="grid gap-4 md:grid-cols-2">
                      {paso.tips.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-green-600">
                            <Lightbulb className="w-4 h-4" />
                            Tips
                          </div>
                          <ul className="space-y-1">
                            {paso.tips.map((tip, i) => (
                              <li key={i} className="text-xs text-muted-foreground">• {tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {paso.errores_comunes.length > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm font-medium text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                            Errores comunes
                          </div>
                          <ul className="space-y-1">
                            {paso.errores_comunes.map((error, i) => (
                              <li key={i} className="text-xs text-muted-foreground">• {error}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </TabsContent>

          {/* Herramientas */}
          <TabsContent value="herramientas">
            <div className="grid gap-3">
              {playbook.herramientas.map((tool, i) => (
                <Card key={i} className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-medium text-sm">{tool.nombre}</span>
                    </div>
                    {tool.url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2"
                        onClick={() => window.open(tool.url, '_blank')}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 ml-6">{tool.para_que}</p>
                  {tool.alternativa && (
                    <p className="text-xs text-muted-foreground mt-1 ml-6">
                      <span className="font-medium">Alternativa:</span> {tool.alternativa}
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Recursos */}
          <TabsContent value="recursos" className="space-y-3">
            {playbook.recursos.map((recurso, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <Badge variant="secondary" className="text-xs mb-1">
                        {recurso.tipo}
                      </Badge>
                      <CardTitle className="text-sm">{recurso.titulo}</CardTitle>
                    </div>
                    {recurso.contenido && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(recurso.contenido!, recurso.titulo)}
                      >
                        <Copy className="w-3 h-3 mr-1" />
                        Copiar
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-muted-foreground">{recurso.descripcion}</p>
                  {recurso.contenido && (
                    <pre className="mt-2 p-3 bg-muted rounded-md text-xs whitespace-pre-wrap overflow-x-auto max-h-40">
                      {recurso.contenido}
                    </pre>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Script sugerido */}
            {playbook.script_sugerido && (
              <Card className="overflow-hidden">
                <CardHeader className="p-3 pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-primary" />
                      <CardTitle className="text-sm">Script Sugerido</CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" onClick={copyScript}>
                      {copiedScript ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      {copiedScript ? 'Copiado' : 'Copiar'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <pre className="p-3 bg-muted rounded-md text-xs whitespace-pre-wrap max-h-60 overflow-y-auto">
                    {playbook.script_sugerido}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Preguntas clave */}
            {playbook.preguntas_clave && playbook.preguntas_clave.length > 0 && (
              <Card>
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm">Preguntas Clave</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <ul className="space-y-2">
                    {playbook.preguntas_clave.map((pregunta, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs shrink-0">
                          ?
                        </span>
                        {pregunta}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Checklist */}
          <TabsContent value="checklist">
            <Card>
              <CardHeader className="p-3 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Checklist Final</CardTitle>
                  <Badge variant="outline">{checklistProgress}%</Badge>
                </div>
                <Progress value={checklistProgress} className="h-1.5 mt-2" />
              </CardHeader>
              <CardContent className="p-3 pt-2">
                <div className="space-y-2">
                  {playbook.checklist_final.map((item, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleChecklist(i)}
                      className={cn(
                        "w-full p-3 rounded-lg text-left flex items-center gap-3 transition-colors text-sm",
                        checkedItems.includes(i)
                          ? "bg-green-500/10 text-green-700 dark:text-green-400"
                          : "bg-muted hover:bg-muted/80"
                      )}
                    >
                      <div className={cn(
                        "w-5 h-5 rounded border-2 flex items-center justify-center shrink-0",
                        checkedItems.includes(i)
                          ? "bg-green-500 border-green-500"
                          : "border-muted-foreground/30"
                      )}>
                        {checkedItems.includes(i) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      {item.replace(/^☐\s*/, '')}
                    </button>
                  ))}
                </div>

                {/* Siguiente paso */}
                <div className="mt-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-medium text-primary uppercase tracking-wide mb-1">
                    Siguiente Paso
                  </p>
                  <p className="text-sm">{playbook.siguiente_paso}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
