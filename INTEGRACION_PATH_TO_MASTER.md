# 🚀 INTEGRACIÓN: PATH TO MASTER

## Paso 1: Agregar PathToMaster a ExplorationDashboard

### Archivo: `src/pages/views/ExplorationDashboard.tsx`

```typescript
import { PathToMaster } from '@/components/exploration/PathToMaster';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

// Agregar estado
const [currentRoles, setCurrentRoles] = useState<string[]>([]);
const [allRoles] = useState<string[]>([
  'sales',
  'finance',
  'ai_tech',
  'marketing',
  'operations',
  'strategy',
  'customer'
]);

// Cargar roles actuales del usuario
useEffect(() => {
  if (user?.id) {
    loadCurrentRoles();
  }
}, [user]);

const loadCurrentRoles = async () => {
  // Obtener member_id
  const { data: member } = await supabase
    .from('members')
    .select('id')
    .eq('auth_id', user!.id)
    .single();

  if (!member) return;

  // Obtener roles actuales (Fase 3)
  const { data: progress } = await supabase
    .from('member_phase_progress')
    .select('star_role, secondary_role')
    .eq('member_id', member.id)
    .single();

  if (progress) {
    const roles = [progress.star_role, progress.secondary_role].filter(Boolean);
    setCurrentRoles(roles);
  }
};

// Handler para iniciar exploración
const handleStartExploration = async (role: string) => {
  try {
    // Obtener member_id
    const { data: member } = await supabase
      .from('members')
      .select('id')
      .eq('auth_id', user!.id)
      .single();

    if (!member) throw new Error('Usuario no encontrado');

    // Llamar a la función SQL
    const { data, error } = await supabase.rpc('start_path_to_master', {
      p_member_id: member.id,
      p_role: role,
      p_project_id: null // Se asignará automáticamente
    });

    if (error) throw error;

    // Mostrar éxito
    toast({
      title: '🚀 ¡Exploración iniciada!',
      description: `Has comenzado tu camino hacia Master de ${role}`,
      variant: 'success'
    });

    // Recargar datos
    loadCurrentRoles();
    loadExplorations(); // Recargar tus exploraciones activas

  } catch (error: any) {
    toast({
      title: 'Error',
      description: error.message || 'No se pudo iniciar la exploración',
      variant: 'destructive'
    });
  }
};

// En el render, agregar nuevo tab
<Tabs defaultValue="overview" className="space-y-4">
  <TabsList>
    <TabsTrigger value="overview">Vista General</TabsTrigger>
    <TabsTrigger value="timeline">Mi Progreso</TabsTrigger>
    <TabsTrigger value="path-to-master" className="gap-2">
      <Rocket size={16} />
      Camino a Master
    </TabsTrigger>
  </TabsList>

  {/* Otros tabs... */}

  <TabsContent value="path-to-master">
    <PathToMaster
      currentRoles={currentRoles}
      allRoles={allRoles}
      onStartExploration={handleStartExploration}
    />
  </TabsContent>
</Tabs>
```

---

## Paso 2: Crear componente para ver si puedes desafiar

### Archivo: `src/components/exploration/ChallengeChecker.tsx`

```typescript
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trophy, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ChallengeCheckerProps {
  memberId: string;
  role: string;
}

interface ChallengeEligibility {
  can_challenge: boolean;
  reasons: string[];
  your_fit_score: number | null;
  your_ranking: number | null;
  weeks_explored: number;
  master_id: string | null;
  master_name: string | null;
  master_fit_score: number | null;
  last_challenge_date: string | null;
}

export function ChallengeChecker({ memberId, role }: ChallengeCheckerProps) {
  const [eligibility, setEligibility] = useState<ChallengeEligibility | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEligibility();
  }, [memberId, role]);

  const checkEligibility = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('can_challenge_master', {
        p_member_id: memberId,
        p_role: role
      });

      if (error) throw error;
      setEligibility(data);
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Verificando elegibilidad...</div>;
  }

  if (!eligibility) {
    return <div>No se pudo verificar elegibilidad</div>;
  }

  return (
    <Card className={eligibility.can_challenge ? 'border-primary' : 'border-muted'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="text-amber-500" />
          Desafío al Master de {role}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Estado */}
        <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
          {eligibility.can_challenge ? (
            <CheckCircle className="text-green-500" size={24} />
          ) : (
            <AlertCircle className="text-amber-500" size={24} />
          )}
          <div className="flex-1">
            <p className="font-semibold">
              {eligibility.can_challenge
                ? '✅ ¡Puedes desafiar al Master!'
                : '⏳ Aún no cumples los requisitos'}
            </p>
            <p className="text-sm text-muted-foreground">
              {eligibility.reasons.join(' • ')}
            </p>
          </div>
        </div>

        {/* Tus stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">
              {eligibility.your_fit_score?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-xs text-muted-foreground">Tu Fit Score</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">#{eligibility.your_ranking || '?'}</p>
            <p className="text-xs text-muted-foreground">Ranking</p>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/30">
            <p className="text-2xl font-bold">{eligibility.weeks_explored}</p>
            <p className="text-xs text-muted-foreground">Semanas</p>
          </div>
        </div>

        {/* Master actual */}
        {eligibility.master_id && (
          <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <p className="font-semibold text-amber-700 dark:text-amber-300 mb-2">
              👑 Master Actual
            </p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{eligibility.master_name}</p>
                <p className="text-sm text-muted-foreground">
                  Fit Score: {eligibility.master_fit_score?.toFixed(1)}
                </p>
              </div>
              {eligibility.last_challenge_date && (
                <Badge variant="outline" className="text-xs">
                  Último desafío:{' '}
                  {new Date(eligibility.last_challenge_date).toLocaleDateString()}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Botón de desafío */}
        {eligibility.can_challenge && (
          <Button className="w-full gap-2" size="lg">
            <Trophy size={16} />
            Crear Desafío al Master
          </Button>
        )}

        {/* Requisitos faltantes */}
        {!eligibility.can_challenge && (
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 text-sm">
            <p className="font-semibold text-blue-700 dark:text-blue-300 mb-2">
              💡 Para desafiar necesitas AL MENOS UNO de estos:
            </p>
            <ul className="space-y-1 text-blue-600 dark:text-blue-400">
              <li>
                • Estar en Top 5 del ranking{' '}
                {eligibility.your_ranking && eligibility.your_ranking <= 5 ? '✅' : '❌'}
              </li>
              <li>
                • Fit score 3.5+{' '}
                {eligibility.your_fit_score && eligibility.your_fit_score >= 3.5
                  ? '✅'
                  : '❌'}
              </li>
              <li>
                • 2+ semanas explorando el rol{' '}
                {eligibility.weeks_explored >= 2 ? '✅' : '❌'}
              </li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Paso 3: Agregar botón flotante "Camino a Master"

### Opción A: Badge permanente en el sidebar

Edita `src/components/Sidebar.tsx`:

```typescript
// Agregar al final del sidebar
<div className="mt-auto p-4 border-t">
  <Button
    variant="default"
    className="w-full gap-2"
    onClick={() => navigate('/exploration?tab=path-to-master')}
  >
    <Rocket size={16} />
    🚀 Camino a Master
  </Button>
</div>
```

### Opción B: Floating Action Button (FAB)

Crear `src/components/PathToMasterFAB.tsx`:

```typescript
import { Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export function PathToMasterFAB() {
  const navigate = useNavigate();

  return (
    <Button
      size="lg"
      className="fixed bottom-6 right-6 rounded-full h-14 w-14 shadow-lg hover:shadow-xl transition-all z-50"
      onClick={() => navigate('/exploration?tab=path-to-master')}
    >
      <Rocket size={24} />
    </Button>
  );
}
```

Agregar en `src/App.tsx`:

```typescript
import { PathToMasterFAB } from '@/components/PathToMasterFAB';

// En el render
<div className="app">
  {/* ... resto de la app */}
  <PathToMasterFAB />
</div>
```

---

## Paso 4: Ejecutar SQL

```sql
-- En Supabase SQL Editor:
\i SQL_CAMINO_A_MASTER.sql
```

O copiar y pegar el contenido del archivo.

---

## Paso 5: Probar el flujo completo

1. **Iniciar exploración:**
   - Ir a "Camino a Master"
   - Seleccionar un rol nuevo
   - Click "Iniciar Camino"

2. **Verificar notificación:**
   - Debería aparecer notificación "🚀 Camino a Master Iniciado"

3. **Completar tareas:**
   - Trabajar en el rol durante 2-4 semanas
   - Completar tareas, recibir feedback

4. **Verificar elegibilidad:**
   - Ver si puedes desafiar al Master
   - Verificar fit score, ranking, semanas

5. **Crear desafío:**
   - Si cumples requisitos, crear desafío al Master

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Ejecutar `SQL_CAMINO_A_MASTER.sql`
- [ ] Integrar `PathToMaster` en `ExplorationDashboard`
- [ ] Crear `ChallengeChecker` component
- [ ] Agregar botón flotante o badge en sidebar
- [ ] Probar flujo: iniciar exploración → recibir notificación
- [ ] Verificar que la vista `path_to_master_active` muestra datos
- [ ] Probar función `can_challenge_master`
- [ ] Verificar RLS policies (todos pueden ver todo)

---

## 🎉 RESULTADO

Ahora tienes un sistema donde:
- ✅ **SIEMPRE** puedes explorar nuevos roles
- ✅ No te limitas a 2 roles después de Fase 3
- ✅ Requisitos accesibles para desafiar (3.5+ en vez de 4.0)
- ✅ Más competencia = más profesional
- ✅ Aprendizaje continuo incentivado
