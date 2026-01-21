import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// Types for development system
export interface RolePerformance {
  user_id: string;
  role_name: string;
  project_id: string;
  project_name: string;
  user_name: string;
  is_lead: boolean;
  role_accepted: boolean;
  performance_score: number;
  total_tasks: number;
  completed_tasks: number;
  task_completion_rate: number;
  total_obvs: number;
  validated_obvs: number;
  total_facturacion: number;
  total_leads: number;
  leads_ganados: number;
  lead_conversion_rate: number;
  joined_at: string;
}

export interface UserInsight {
  id: string;
  user_id: string;
  project_id: string | null;
  role_context: string | null;
  titulo: string;
  contenido: string;
  tipo: 'aprendizaje' | 'reflexion' | 'error' | 'exito' | 'idea';
  tags: string[];
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPlaybook {
  id: string;
  user_id: string;
  role_name: string;
  version: number;
  contenido: {
    sections: Array<{
      title: string;
      content: string;
      tips?: string[];
    }>;
  };
  fortalezas: string[];
  areas_mejora: string[];
  objetivos_sugeridos: Array<{
    objetivo: string;
    plazo: string;
    metricas: string[];
  }>;
  ai_model: string | null;
  generated_at: string;
  is_active: boolean;
  created_at: string;
}

export interface RoleRanking {
  id: string;
  role_name: string;
  user_id: string;
  project_id: string;
  ranking_position: number;
  score: number;
  previous_position: number | null;
  metrics: Record<string, number>;
  period_start: string;
  period_end: string;
  calculated_at: string;
}

// Hook for role performance data
export function useRolePerformance(userId?: string) {
  return useQuery({
    queryKey: ['role_performance', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_role_performance')
        .select('*');
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RolePerformance[];
    },
    enabled: true,
  });
}

// Hook for user insights
export function useInsights(userId?: string) {
  return useQuery({
    queryKey: ['user_insights', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_insights')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as UserInsight[];
    },
  });
}

// Hook to create insight
export function useCreateInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (insight: Omit<UserInsight, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('user_insights')
        .insert(insight)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_insights'] });
    },
  });
}

// Hook to update insight
export function useUpdateInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserInsight> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_insights')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_insights'] });
    },
  });
}

// Hook to delete insight
export function useDeleteInsight() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_insights')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_insights'] });
    },
  });
}

// Hook for user playbooks
export function usePlaybooks(userId?: string) {
  return useQuery({
    queryKey: ['user_playbooks', userId],
    queryFn: async () => {
      let query = supabase
        .from('user_playbooks')
        .select('*')
        .eq('is_active', true)
        .order('generated_at', { ascending: false });
      
      if (userId) {
        query = query.eq('user_id', userId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as UserPlaybook[];
    },
  });
}

// Hook to get playbook for a specific role
export function usePlaybookForRole(userId: string | undefined, roleName: string | undefined) {
  return useQuery({
    queryKey: ['user_playbook', userId, roleName],
    queryFn: async () => {
      if (!userId || !roleName) return null;
      
      const { data, error } = await supabase
        .from('user_playbooks')
        .select('*')
        .eq('user_id', userId)
        .eq('role_name', roleName)
        .eq('is_active', true)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as UserPlaybook | null;
    },
    enabled: !!userId && !!roleName,
  });
}

// Hook for role rankings
export function useRoleRankings(roleName?: string) {
  return useQuery({
    queryKey: ['role_rankings', roleName],
    queryFn: async () => {
      let query = supabase
        .from('role_rankings')
        .select('*')
        .order('ranking_position', { ascending: true });
      
      if (roleName) {
        query = query.eq('role_name', roleName);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as RoleRanking[];
    },
  });
}

// Hook to generate playbook - using local templates (no edge function needed)
export function useGeneratePlaybook() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ userId, roleName }: { userId: string; roleName: string }) => {
      // Get user data for context
      const { data: profile } = await supabase
        .from('profiles')
        .select('nombre, especialization')
        .eq('id', userId)
        .single();

      // Get performance data
      const { data: performance } = await supabase
        .from('user_role_performance')
        .select('*')
        .eq('user_id', userId)
        .eq('role_name', roleName as any)
        .maybeSingle();

      // Get recent insights
      const { data: insights } = await supabase
        .from('user_insights')
        .select('titulo, tipo')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // Build playbook content based on role and data
      const playbookContent = generateLocalPlaybook(roleName, {
        userName: profile?.nombre || 'Usuario',
        specialization: profile?.especialization,
        performance: performance || {},
        insights: insights || [],
      });

      // Get current version
      const { data: existingPlaybook } = await supabase
        .from('user_playbooks')
        .select('version')
        .eq('user_id', userId)
        .eq('role_name', roleName)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newVersion = (existingPlaybook?.version || 0) + 1;

      // Deactivate previous playbooks
      await supabase
        .from('user_playbooks')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_name', roleName);

      // Insert new playbook
      const { data: newPlaybook, error } = await supabase
        .from('user_playbooks')
        .insert({
          user_id: userId,
          role_name: roleName,
          version: newVersion,
          contenido: { sections: playbookContent.sections },
          fortalezas: playbookContent.fortalezas,
          areas_mejora: playbookContent.areas_mejora,
          objetivos_sugeridos: playbookContent.objetivos_sugeridos,
          ai_model: 'local-template',
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;
      return newPlaybook;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user_playbooks'] });
      queryClient.invalidateQueries({ queryKey: ['user_playbook'] });
    },
  });
}

// Local playbook generator based on role templates
function generateLocalPlaybook(roleName: string, context: {
  userName: string;
  specialization?: string | null;
  performance: any;
  insights: any[];
}) {
  const roleTemplates: Record<string, {
    sections: Array<{ title: string; content: string; tips: string[] }>;
    fortalezas: string[];
    areas_mejora: string[];
    objetivos_sugeridos: Array<{ objetivo: string; plazo: string; metricas: string[] }>;
  }> = {
    sales: {
      sections: [
        {
          title: 'Responsabilidades del Comercial',
          content: 'Como Comercial, eres responsable de gestionar las relaciones con clientes, liderar procesos de venta y asegurar la satisfacción del cliente.',
          tips: [
            'Mantén un pipeline de leads actualizado diariamente',
            'Responde a leads en menos de 24 horas',
            'Documenta todas las interacciones con clientes',
          ],
        },
        {
          title: 'Proceso de Ventas',
          content: 'Sigue el proceso de ventas estructurado: Prospección → Calificación → Propuesta → Negociación → Cierre.',
          tips: [
            'Califica leads antes de invertir tiempo',
            'Personaliza cada propuesta según necesidades',
            'Haz seguimiento sistemático cada 3-5 días',
          ],
        },
        {
          title: 'Métricas Clave',
          content: 'Tus KPIs principales son: tasa de conversión, ticket promedio, tiempo de ciclo de venta y NPS de clientes.',
          tips: [
            'Revisa tu pipeline semanalmente',
            'Analiza qué leads convierten mejor',
            'Pide feedback a clientes cerrados',
          ],
        },
      ],
      fortalezas: context.performance?.lead_conversion_rate > 20 
        ? ['Alta conversión de leads', 'Buen cierre de ventas']
        : ['Persistencia', 'Orientación a resultados'],
      areas_mejora: context.performance?.lead_conversion_rate < 15
        ? ['Mejorar tasa de conversión', 'Calificación de leads']
        : ['Aumentar ticket promedio', 'Reducir ciclo de venta'],
      objetivos_sugeridos: [
        { objetivo: 'Mejorar tasa de conversión un 10%', plazo: '1 mes', metricas: ['Leads calificados', 'Propuestas enviadas', 'Cierres'] },
        { objetivo: 'Documentar proceso de venta exitoso', plazo: '2 semanas', metricas: ['Playbook completado', 'Equipo capacitado'] },
      ],
    },
    marketing: {
      sections: [
        {
          title: 'Responsabilidades de Marketing',
          content: 'Como Marketing, generas visibilidad, atraes leads cualificados y construyes la marca del proyecto.',
          tips: [
            'Publica contenido mínimo 3 veces por semana',
            'Mide el engagement de cada publicación',
            'Experimenta con diferentes formatos',
          ],
        },
        {
          title: 'Generación de Contenido',
          content: 'Crea contenido que eduque, entretenga y convierta. Usa el framework AIDA: Atención, Interés, Deseo, Acción.',
          tips: [
            'Estudia qué contenido funciona en tu nicho',
            'Reutiliza contenido en múltiples formatos',
            'Incluye siempre un CTA claro',
          ],
        },
        {
          title: 'Métricas Clave',
          content: 'Tus KPIs: alcance, engagement, leads generados, coste por lead y conversión de campañas.',
          tips: [
            'Trackea de dónde vienen los leads',
            'A/B testea mensajes y creativos',
            'Optimiza según datos, no intuición',
          ],
        },
      ],
      fortalezas: ['Creatividad', 'Comunicación'],
      areas_mejora: ['Análisis de datos', 'Optimización de conversión'],
      objetivos_sugeridos: [
        { objetivo: 'Generar 10 leads cualificados', plazo: '1 mes', metricas: ['Leads generados', 'Coste por lead', 'Tasa de conversión'] },
      ],
    },
    operations: {
      sections: [
        {
          title: 'Responsabilidades de Operaciones',
          content: 'Como Operations, aseguras que los procesos funcionen eficientemente y el equipo tenga lo necesario para ejecutar.',
          tips: [
            'Documenta todos los procesos críticos',
            'Automatiza tareas repetitivas',
            'Mantén la información organizada y accesible',
          ],
        },
        {
          title: 'Gestión de Procesos',
          content: 'Mapea, optimiza y escala los procesos del proyecto. Identifica cuellos de botella y propón mejoras.',
          tips: [
            'Usa checklists para procesos recurrentes',
            'Revisa procesos mensualmente',
            'Mide tiempos de cada etapa',
          ],
        },
        {
          title: 'Métricas Clave',
          content: 'Tus KPIs: eficiencia operativa, tiempo de respuesta, satisfacción del equipo y coste operativo.',
          tips: [
            'Reduce fricción en procesos',
            'Anticipa necesidades del equipo',
            'Mantén un backlog de mejoras',
          ],
        },
      ],
      fortalezas: ['Organización', 'Atención al detalle'],
      areas_mejora: ['Visión estratégica', 'Priorización'],
      objetivos_sugeridos: [
        { objetivo: 'Documentar 3 procesos críticos', plazo: '2 semanas', metricas: ['Procesos documentados', 'Equipo capacitado'] },
      ],
    },
    finance: {
      sections: [
        {
          title: 'Responsabilidades de Finanzas',
          content: 'Como Finanzas, gestionas la salud económica del proyecto: presupuestos, cobros, análisis de rentabilidad.',
          tips: [
            'Actualiza las métricas financieras semanalmente',
            'Haz seguimiento de cobros pendientes',
            'Mantén un forecast actualizado',
          ],
        },
        {
          title: 'Gestión de Cobros',
          content: 'Asegura el flujo de caja gestionando cobros de manera proactiva y manteniendo relaciones sanas con clientes.',
          tips: [
            'Envía facturas inmediatamente tras la venta',
            'Haz seguimiento a los 7 y 14 días',
            'Mantén comunicación clara sobre plazos',
          ],
        },
        {
          title: 'Métricas Clave',
          content: 'Tus KPIs: margen bruto, cash flow, DSO (días de cobro), y rentabilidad por proyecto.',
          tips: [
            'Analiza rentabilidad por cliente/producto',
            'Identifica costes que se pueden optimizar',
            'Reporta semanalmente al equipo',
          ],
        },
      ],
      fortalezas: ['Análisis', 'Precisión'],
      areas_mejora: ['Comunicación', 'Visión comercial'],
      objetivos_sugeridos: [
        { objetivo: 'Reducir DSO a menos de 30 días', plazo: '1 mes', metricas: ['Días promedio de cobro', 'Cobros pendientes'] },
      ],
    },
    ai_tech: {
      sections: [
        {
          title: 'Responsabilidades de AI/Tech',
          content: 'Como AI/Tech, lideras la implementación tecnológica y buscas oportunidades de automatización e IA.',
          tips: [
            'Identifica tareas repetitivas para automatizar',
            'Mantente actualizado en tendencias de IA',
            'Documenta todas las soluciones técnicas',
          ],
        },
        {
          title: 'Desarrollo de Soluciones',
          content: 'Crea soluciones técnicas que multipliquen la capacidad del equipo. Prioriza impacto sobre perfección.',
          tips: [
            'Empieza con MVPs y itera',
            'Involucra al equipo en el diseño',
            'Mide el impacto de cada solución',
          ],
        },
        {
          title: 'Métricas Clave',
          content: 'Tus KPIs: tiempo ahorrado por automatización, adopción de herramientas, y mejoras en eficiencia.',
          tips: [
            'Cuantifica el impacto de cada herramienta',
            'Capacita al equipo en nuevas soluciones',
            'Mantén un backlog de mejoras tech',
          ],
        },
      ],
      fortalezas: ['Innovación', 'Resolución de problemas'],
      areas_mejora: ['Comunicación no-técnica', 'Priorización de negocio'],
      objetivos_sugeridos: [
        { objetivo: 'Automatizar 2 procesos clave', plazo: '1 mes', metricas: ['Horas ahorradas', 'Adopción del equipo'] },
      ],
    },
    strategy: {
      sections: [
        {
          title: 'Responsabilidades de Estrategia',
          content: 'Como Strategy, defines la dirección del proyecto y aseguras que todas las acciones estén alineadas con los objetivos.',
          tips: [
            'Define OKRs claros trimestralmente',
            'Revisa el progreso semanalmente',
            'Comunica la visión constantemente',
          ],
        },
        {
          title: 'Toma de Decisiones',
          content: 'Facilita la toma de decisiones estratégicas basándote en datos y alineando al equipo.',
          tips: [
            'Usa frameworks para decisiones importantes',
            'Involucra a stakeholders relevantes',
            'Documenta las decisiones y su contexto',
          ],
        },
        {
          title: 'Métricas Clave',
          content: 'Tus KPIs: progreso en OKRs, alineamiento del equipo, y velocidad de ejecución.',
          tips: [
            'Mide lo que importa, no todo',
            'Celebra los logros del equipo',
            'Aprende de los fracasos rápidamente',
          ],
        },
      ],
      fortalezas: ['Visión', 'Liderazgo'],
      areas_mejora: ['Ejecución', 'Delegación'],
      objetivos_sugeridos: [
        { objetivo: 'Definir OKRs del trimestre', plazo: '1 semana', metricas: ['OKRs definidos', 'Equipo alineado'] },
      ],
    },
  };

  // Default template for unknown roles
  const defaultTemplate = {
    sections: [
      {
        title: `Responsabilidades del ${roleName}`,
        content: `Como ${roleName}, contribuyes al éxito del proyecto con tus habilidades y compromiso.`,
        tips: [
          'Comunica proactivamente tu progreso',
          'Pide ayuda cuando la necesites',
          'Documenta tu trabajo',
        ],
      },
      {
        title: 'Desarrollo Profesional',
        content: 'Identifica áreas de mejora y trabaja en ellas sistemáticamente.',
        tips: [
          'Define objetivos claros',
          'Busca feedback regularmente',
          'Aprende de los errores',
        ],
      },
    ],
    fortalezas: ['Compromiso', 'Trabajo en equipo'],
    areas_mejora: ['Definir áreas específicas'],
    objetivos_sugeridos: [
      { objetivo: 'Completar primeras tareas exitosamente', plazo: '2 semanas', metricas: ['Tareas completadas', 'Feedback recibido'] },
    ],
  };

  return roleTemplates[roleName.toLowerCase()] || defaultTemplate;
}
