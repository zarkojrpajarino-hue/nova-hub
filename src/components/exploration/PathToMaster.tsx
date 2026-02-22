/**
 * PATH TO MASTER
 *
 * Componente siempre visible que permite explorar nuevos roles
 * en cualquier momento, incluso si ya estás en Fase 3
 */

import { useState } from 'react';
import { Rocket, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
// import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PathToMasterProps {
  currentRoles: string[]; // Roles actuales del usuario (estrella + secundario)
  allRoles: string[]; // Todos los roles disponibles
  onStartExploration: (role: string) => Promise<void>;
}

const ROLE_INFO = {
  sales: {
    name: 'Sales',
    icon: '💰',
    description: 'Ventas, captación de clientes, negociación',
    difficulty: 'Media',
    duration: '2-4 semanas',
  },
  finance: {
    name: 'Finance',
    icon: '📊',
    description: 'Finanzas, presupuestos, análisis económico',
    difficulty: 'Alta',
    duration: '3-4 semanas',
  },
  ai_tech: {
    name: 'AI & Tech',
    icon: '🤖',
    description: 'Tecnología, automatización, desarrollo',
    difficulty: 'Alta',
    duration: '3-5 semanas',
  },
  marketing: {
    name: 'Marketing',
    icon: '📱',
    description: 'Marketing digital, contenido, branding',
    difficulty: 'Media',
    duration: '2-3 semanas',
  },
  operations: {
    name: 'Operations',
    icon: '⚙️',
    description: 'Operaciones, procesos, logística',
    difficulty: 'Media',
    duration: '2-3 semanas',
  },
  strategy: {
    name: 'Strategy',
    icon: '🎯',
    description: 'Estrategia, planificación, visión',
    difficulty: 'Alta',
    duration: '3-4 semanas',
  },
  customer: {
    name: 'Customer Success',
    icon: '💬',
    description: 'Atención al cliente, soporte, éxito',
    difficulty: 'Baja',
    duration: '2 semanas',
  },
};

export function PathToMaster({ currentRoles, allRoles, onStartExploration }: PathToMasterProps) {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Roles disponibles (que no son actuales)
  const availableRoles = allRoles.filter((role) => !currentRoles.includes(role));

  // Roles ya dominados
  const masteredRoles = currentRoles;

  const handleStartPath = async () => {
    if (!selectedRole) return;

    setIsStarting(true);
    try {
      await onStartExploration(selectedRole);
      setSelectedRole(null);
    } finally {
      setIsStarting(false);
    }
  };

  return (
    <>
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-purple-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
              <Rocket className="text-primary-foreground" size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold">🚀 Camino a Master</h3>
              <p className="text-sm text-muted-foreground font-normal">
                Explora y domina nuevos roles en cualquier momento
              </p>
            </div>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {availableRoles.length} disponibles
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Current Roles */}
          {masteredRoles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-muted-foreground">Tus Roles Actuales</h4>
              <div className="flex gap-2">
                {masteredRoles.map((role, index) => {
                  const info = ROLE_INFO[role as keyof typeof ROLE_INFO];
                  return (
                    <Badge key={role} variant="default" className="text-sm px-3 py-1">
                      {info?.icon} {info?.name}
                      {index === 0 && ' ⭐'}
                      {index === 1 && ' 🥈'}
                    </Badge>
                  );
                })}
              </div>
            </div>
          )}

          {/* Available Roles */}
          <div className="space-y-3">
            <h4 className="font-semibold">Explora un Nuevo Rol</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableRoles.map((role) => {
                const info = ROLE_INFO[role as keyof typeof ROLE_INFO];
                if (!info) return null;

                return (
                  <Card
                    key={role}
                    className={cn(
                      'cursor-pointer transition-all hover:border-primary hover:shadow-md',
                      selectedRole === role && 'border-primary bg-primary/5'
                    )}
                    onClick={() => setSelectedRole(role)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{info.icon}</div>
                        <div className="flex-1 min-w-0">
                          <h5 className="font-semibold mb-1">{info.name}</h5>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                            {info.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs">
                            <Badge variant="outline" className="text-xs">
                              {info.difficulty}
                            </Badge>
                            <span className="text-muted-foreground">{info.duration}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Start Button */}
          {selectedRole && (
            <div className="flex items-center gap-4 p-4 rounded-lg bg-primary/10 border-2 border-primary">
              <Star className="text-primary" size={32} />
              <div className="flex-1">
                <p className="font-semibold">
                  Seleccionaste: {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  Comenzarás una exploración de{' '}
                  {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.duration}
                </p>
              </div>
              <Button size="lg" onClick={() => setSelectedRole(selectedRole)}>
                Iniciar Camino
              </Button>
            </div>
          )}

          {/* Info Box */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
            <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
              💡 ¿Cómo funciona?
            </p>
            <ul className="space-y-1 text-blue-600 dark:text-blue-400">
              <li>
                • <strong>Semana 1-2:</strong> Exploración del rol (completa tareas, recibe
                feedback)
              </li>
              <li>
                • <strong>Semana 3-4:</strong> Especialización (sube tu fit score)
              </li>
              <li>
                • <strong>Después:</strong> Puedes desafiar al Master actual del rol
              </li>
              <li>
                • <strong>Requisito:</strong> Fit score mínimo de 3.5 para desafiar
              </li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={!!selectedRole} onOpenChange={(open) => !open && setSelectedRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Rocket className="text-primary" />
              Iniciar Camino a Master:{' '}
              {selectedRole && ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.name}
            </DialogTitle>
            <DialogDescription>
              Comenzarás una exploración de este rol desde cero. ¿Estás listo?
            </DialogDescription>
          </DialogHeader>

          {selectedRole && (
            <div className="space-y-4">
              {/* Role Info */}
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3 mb-3">
                  <div className="text-4xl">
                    {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.icon}
                  </div>
                  <div>
                    <h4 className="font-bold">
                      {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.name}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.description}
                    </p>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Dificultad:</span>
                    <Badge variant="outline">
                      {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.difficulty}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Duración estimada:</span>
                    <span className="font-medium">
                      {ROLE_INFO[selectedRole as keyof typeof ROLE_INFO]?.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Tu Camino:</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">
                      1
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Exploración (1-2 semanas)</p>
                      <p className="text-xs text-muted-foreground">
                        Completa tareas, recibe feedback
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Especialización (1-2 semanas)</p>
                      <p className="text-xs text-muted-foreground">Sube tu fit score</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Desafío al Master</p>
                      <p className="text-xs text-muted-foreground">
                        Si alcanzas fit score 3.5+
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setSelectedRole(null)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={handleStartPath} disabled={isStarting} className="flex-1 gap-2">
                  {isStarting ? (
                    <>Iniciando...</>
                  ) : (
                    <>
                      <Rocket size={16} />
                      Comenzar Ahora
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
