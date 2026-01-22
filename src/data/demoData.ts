// ============================================
// DATOS DEMO PROFESIONALES PARA CADA SECCIÓN
// ============================================

export interface DemoMember {
  id: string;
  nombre: string;
  email: string;
  color: string;
  avatar: string | null;
  lps: number;
  bps: number;
  obvs: number;
  cps: number;
  facturacion: number;
  margen: number;
  obvs_exploracion?: number;
  obvs_validacion?: number;
  obvs_venta?: number;
}

export interface DemoProject {
  id: string;
  nombre: string;
  icon: string;
  color: string;
  fase: string;
  tipo: string;
  descripcion: string;
  miembros: number;
  obvs: number;
  facturacion: number;
  num_members?: number;
  total_obvs?: number;
  total_leads?: number;
  leads_ganados?: number;
  margen?: number;
  onboarding_completed?: boolean;
}

export interface DemoOBV {
  id: string;
  titulo: string;
  descripcion: string;
  owner: string;
  owner_id?: string;
  proyecto: string;
  project_id?: string;
  tipo: 'exploracion' | 'validacion' | 'venta';
  fecha: string;
  status: 'pending' | 'validated' | 'rejected';
  facturacion?: number;
  margen?: number;
  evidence_url?: string;
}

export interface DemoTask {
  id: string;
  titulo: string;
  descripcion: string;
  proyecto: string;
  project_id?: string;
  assignee: string;
  assignee_id?: string;
  status: 'todo' | 'in_progress' | 'done';
  prioridad: number;
  fecha_limite: string;
  hasPlaybook: boolean;
  playbook?: object;
}

export interface DemoLead {
  id: string;
  nombre: string;
  empresa: string;
  status: 'frio' | 'tibio' | 'hot' | 'propuesta' | 'cerrado' | 'perdido';
  valor: number;
  proyecto: string;
  project_id?: string;
  responsable: string;
  responsable_id?: string;
  proxima_accion: string;
  proxima_accion_fecha?: string;
  email?: string;
  telefono?: string;
}

export interface DemoValidation {
  id: string;
  type: 'obv' | 'lp' | 'bp';
  titulo: string;
  owner: string;
  owner_id?: string;
  proyecto?: string;
  fecha: string;
  deadline: string;
  isLate: boolean;
}

export interface DemoNotification {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

export interface DemoFinancialMetric {
  project_id: string;
  project_name: string;
  project_color: string;
  month: string;
  facturacion: number;
  costes: number;
  margen: number;
  num_ventas: number;
  margen_percent: number;
  cobrado: number;
  pendiente_cobro: number;
}

export interface DemoRanking {
  id: string;
  user_id: string;
  user_name: string;
  role_name: string;
  project_id: string;
  project_name: string;
  ranking_position: number;
  previous_position: number | null;
  score: number;
  metrics?: object;
}

export interface DemoRotationRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_current_role: string;
  target_user_id: string;
  target_user_name: string;
  target_role: string;
  requester_project_id: string;
  target_project_id: string;
  status: 'pending' | 'approved' | 'completed' | 'rejected';
  reason: string;
  created_at: string;
}

export interface DemoRoleHistory {
  id: string;
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  old_role: string;
  new_role: string;
  change_type: string;
  created_at: string;
  notes?: string;
}

export interface DemoPerformance {
  user_id: string;
  user_name: string;
  project_id: string;
  project_name: string;
  role_name: string;
  performance_score: number;
  task_completion_rate: number;
  total_tasks: number;
  completed_tasks: number;
  total_obvs: number;
  validated_obvs: number;
  total_facturacion: number;
  total_leads: number;
  leads_ganados: number;
}

export interface DemoInsight {
  id: string;
  user_id: string;
  titulo: string;
  contenido: string;
  tipo: 'aprendizaje' | 'reflexion' | 'error' | 'exito' | 'idea';
  tags: string[];
  is_private: boolean;
  project_id?: string;
  role_context?: string;
  created_at: string;
}

export interface DemoPlaybook {
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
  ai_model: string;
  is_active: boolean;
  generated_at: string;
}

// ============================================
// MIEMBROS DEMO
// ============================================

export const DEMO_MEMBERS: DemoMember[] = [
  { id: '1', nombre: 'ZARKO', email: 'zarko@nova.com', color: '#8B5CF6', avatar: null, lps: 14, bps: 57, obvs: 126, cps: 49, facturacion: 10650, margen: 5090, obvs_exploracion: 42, obvs_validacion: 48, obvs_venta: 36 },
  { id: '2', nombre: 'FERNANDO S', email: 'fernando.s@nova.com', color: '#10B981', avatar: null, lps: 14, bps: 52, obvs: 136, cps: 43, facturacion: 65160, margen: 59560, obvs_exploracion: 38, obvs_validacion: 52, obvs_venta: 46 },
  { id: '3', nombre: 'ÁNGEL', email: 'angel@nova.com', color: '#F59E0B', avatar: null, lps: 13, bps: 54, obvs: 117, cps: 44, facturacion: 39340, margen: 30970, obvs_exploracion: 35, obvs_validacion: 45, obvs_venta: 37 },
  { id: '4', nombre: 'MIGUEL ÁNGEL', email: 'miguelangel@nova.com', color: '#3B82F6', avatar: null, lps: 12, bps: 52, obvs: 103, cps: 41, facturacion: 40140, margen: 24170, obvs_exploracion: 30, obvs_validacion: 40, obvs_venta: 33 },
  { id: '5', nombre: 'MANUEL', email: 'manuel@nova.com', color: '#EC4899', avatar: null, lps: 13, bps: 50, obvs: 100, cps: 45, facturacion: 10740, margen: 10350, obvs_exploracion: 35, obvs_validacion: 38, obvs_venta: 27 },
  { id: '6', nombre: 'FERNANDO G', email: 'fernando.g@nova.com', color: '#EF4444', avatar: null, lps: 13, bps: 52, obvs: 109, cps: 41, facturacion: 3100, margen: 1440, obvs_exploracion: 45, obvs_validacion: 42, obvs_venta: 22 },
  { id: '7', nombre: 'CARLA', email: 'carla@nova.com', color: '#F472B6', avatar: null, lps: 12, bps: 49, obvs: 87, cps: 49, facturacion: 3870, margen: 2840, obvs_exploracion: 32, obvs_validacion: 35, obvs_venta: 20 },
  { id: '8', nombre: 'DIEGO', email: 'diego@nova.com', color: '#84CC16', avatar: null, lps: 12, bps: 54, obvs: 102, cps: 42, facturacion: 12080, margen: 1950, obvs_exploracion: 38, obvs_validacion: 38, obvs_venta: 26 },
  { id: '9', nombre: 'LUIS', email: 'luis@nova.com', color: '#06B6D4', avatar: null, lps: 12, bps: 51, obvs: 86, cps: 44, facturacion: 11320, margen: 7030, obvs_exploracion: 28, obvs_validacion: 32, obvs_venta: 26 },
];

// ============================================
// PROYECTOS DEMO
// ============================================

export const DEMO_PROJECTS: DemoProject[] = [
  { id: 'p1', nombre: 'Experea', icon: '🎓', color: '#8B5CF6', fase: 'venta', tipo: 'b2b', descripcion: 'Plataforma de experiencias educativas para colegios', miembros: 5, obvs: 45, facturacion: 28500, num_members: 5, total_obvs: 45, total_leads: 12, leads_ganados: 4, margen: 21400, onboarding_completed: true },
  { id: 'p2', nombre: 'Payo Sushi', icon: '🍣', color: '#10B981', fase: 'validacion', tipo: 'startup', descripcion: 'Restaurante de sushi artesanal y delivery premium', miembros: 4, obvs: 32, facturacion: 18200, num_members: 4, total_obvs: 32, total_leads: 8, leads_ganados: 3, margen: 12100, onboarding_completed: true },
  { id: 'p3', nombre: 'Academia Financiera', icon: '💰', color: '#F59E0B', fase: 'exploracion', tipo: 'b2c', descripcion: 'Formación en finanzas personales e inversión', miembros: 3, obvs: 28, facturacion: 13400, num_members: 3, total_obvs: 28, total_leads: 15, leads_ganados: 6, margen: 11200, onboarding_completed: true },
  { id: 'p4', nombre: 'TechNova Solutions', icon: '💻', color: '#3B82F6', fase: 'venta', tipo: 'b2b', descripcion: 'Consultoría de transformación digital y IA', miembros: 6, obvs: 67, facturacion: 85000, num_members: 6, total_obvs: 67, total_leads: 18, leads_ganados: 8, margen: 62400, onboarding_completed: true },
  { id: 'p5', nombre: 'EventPro', icon: '🎉', color: '#EC4899', fase: 'validacion', tipo: 'b2b', descripcion: 'Gestión y organización de eventos corporativos', miembros: 4, obvs: 38, facturacion: 17800, num_members: 4, total_obvs: 38, total_leads: 10, leads_ganados: 5, margen: 13200, onboarding_completed: true },
];

// ============================================
// OBVs DEMO
// ============================================

export const DEMO_OBVS: DemoOBV[] = [
  { id: 'o1', titulo: 'Reunión demo con Colegio San Patricio', descripcion: 'Presentación del producto a dirección y coordinadores', owner: 'Fernando S', owner_id: '2', proyecto: 'Experea', project_id: 'p1', tipo: 'venta', fecha: '2026-01-20', status: 'validated', facturacion: 4500, margen: 3600 },
  { id: 'o2', titulo: 'Validación de modelo de negocio con restauradores', descripcion: 'Entrevistas con 5 dueños de restaurantes para validar pricing', owner: 'Manuel', owner_id: '5', proyecto: 'Payo Sushi', project_id: 'p2', tipo: 'validacion', fecha: '2026-01-19', status: 'pending' },
  { id: 'o3', titulo: 'Primera venta de curso básico', descripcion: 'Venta de pack de 3 cursos a cliente particular', owner: 'Ángel', owner_id: '3', proyecto: 'Academia Financiera', project_id: 'p3', tipo: 'venta', fecha: '2026-01-18', status: 'validated', facturacion: 950, margen: 850 },
  { id: 'o4', titulo: 'Cierre contrato consultoría IA para PYME', descripcion: 'Proyecto de automatización para empresa de logística', owner: 'Zarko', owner_id: '1', proyecto: 'TechNova Solutions', project_id: 'p4', tipo: 'venta', fecha: '2026-01-17', status: 'validated', facturacion: 12500, margen: 9200 },
  { id: 'o5', titulo: 'Evento networking empresarial', descripcion: 'Organización de afterwork con 40 asistentes', owner: 'Carla', owner_id: '7', proyecto: 'EventPro', project_id: 'p5', tipo: 'exploracion', fecha: '2026-01-16', status: 'validated' },
  { id: 'o6', titulo: 'Piloto en instituto público', descripcion: 'Test gratuito de la plataforma en instituto de Málaga', owner: 'Diego', owner_id: '8', proyecto: 'Experea', project_id: 'p1', tipo: 'validacion', fecha: '2026-01-15', status: 'rejected' },
  { id: 'o7', titulo: 'Acuerdo con proveedor de pescado premium', descripcion: 'Negociación de precios especiales con proveedor local', owner: 'Luis', owner_id: '9', proyecto: 'Payo Sushi', project_id: 'p2', tipo: 'exploracion', fecha: '2026-01-14', status: 'validated' },
  { id: 'o8', titulo: 'Webinar gratuito de inversión', descripcion: 'Sesión online con 120 asistentes, captación de leads', owner: 'Miguel Ángel', owner_id: '4', proyecto: 'Academia Financiera', project_id: 'p3', tipo: 'exploracion', fecha: '2026-01-13', status: 'validated' },
  { id: 'o9', titulo: 'Propuesta consultoría para startup biotech', descripcion: 'Desarrollo de MVP y estrategia de producto', owner: 'Zarko', owner_id: '1', proyecto: 'TechNova Solutions', project_id: 'p4', tipo: 'venta', fecha: '2026-01-12', status: 'pending', facturacion: 8000, margen: 6000 },
  { id: 'o10', titulo: 'Organización gala benéfica', descripcion: 'Evento para 150 personas en hotel 5 estrellas', owner: 'Carla', owner_id: '7', proyecto: 'EventPro', project_id: 'p5', tipo: 'venta', fecha: '2026-01-11', status: 'validated', facturacion: 5500, margen: 4200 },
];

// ============================================
// TAREAS DEMO
// ============================================

export const DEMO_TASKS: DemoTask[] = [
  { id: 't1', titulo: 'Preparar propuesta para colegio Sagrada Familia', descripcion: 'Crear presentación personalizada y presupuesto detallado', proyecto: 'Experea', project_id: 'p1', assignee: 'Fernando S', assignee_id: '2', status: 'in_progress', prioridad: 1, fecha_limite: '2026-01-22', hasPlaybook: true, playbook: { steps: ['Análisis de necesidades', 'Propuesta de valor', 'Pricing'], tips: ['Mencionar casos de éxito'] } },
  { id: 't2', titulo: 'Diseñar menú degustación premium', descripcion: 'Crear menú especial para eventos corporativos con maridaje', proyecto: 'Payo Sushi', project_id: 'p2', assignee: 'Manuel', assignee_id: '5', status: 'todo', prioridad: 2, fecha_limite: '2026-01-25', hasPlaybook: true },
  { id: 't3', titulo: 'Grabar módulo 3 del curso de inversión', descripcion: 'Producir y editar vídeos del tercer módulo: ETFs y fondos indexados', proyecto: 'Academia Financiera', project_id: 'p3', assignee: 'Ángel', assignee_id: '3', status: 'in_progress', prioridad: 1, fecha_limite: '2026-01-21', hasPlaybook: false },
  { id: 't4', titulo: 'Desarrollar dashboard de métricas IA', descripcion: 'Implementar visualización de KPIs con predicciones ML para cliente', proyecto: 'TechNova Solutions', project_id: 'p4', assignee: 'Zarko', assignee_id: '1', status: 'done', prioridad: 1, fecha_limite: '2026-01-18', hasPlaybook: true },
  { id: 't5', titulo: 'Contactar sponsors para evento de febrero', descripcion: 'Llamar a 10 empresas potenciales patrocinadoras del networking', proyecto: 'EventPro', project_id: 'p5', assignee: 'Carla', assignee_id: '7', status: 'todo', prioridad: 2, fecha_limite: '2026-01-28', hasPlaybook: true },
  { id: 't6', titulo: 'Seguimiento de leads del webinar', descripcion: 'Enviar email de seguimiento personalizado a los 120 asistentes', proyecto: 'Academia Financiera', project_id: 'p3', assignee: 'Miguel Ángel', assignee_id: '4', status: 'in_progress', prioridad: 1, fecha_limite: '2026-01-20', hasPlaybook: false },
  { id: 't7', titulo: 'Integración con sistema de reservas', descripcion: 'Conectar plataforma con sistema de reservas de colegios', proyecto: 'Experea', project_id: 'p1', assignee: 'Diego', assignee_id: '8', status: 'todo', prioridad: 1, fecha_limite: '2026-01-24', hasPlaybook: true },
  { id: 't8', titulo: 'Análisis de competencia delivery', descripcion: 'Estudio de mercado de competidores en zona sur', proyecto: 'Payo Sushi', project_id: 'p2', assignee: 'Luis', assignee_id: '9', status: 'done', prioridad: 3, fecha_limite: '2026-01-15', hasPlaybook: false },
];

// ============================================
// LEADS DEMO
// ============================================

export const DEMO_LEADS: DemoLead[] = [
  { id: 'l1', nombre: 'Colegio Sagrada Familia', empresa: 'Educación privada', status: 'hot', valor: 6500, proyecto: 'Experea', project_id: 'p1', responsable: 'Fernando S', responsable_id: '2', proxima_accion: 'Enviar propuesta personalizada', proxima_accion_fecha: '2026-01-23', email: 'direccion@sagradafamilia.edu', telefono: '+34 952 123 456' },
  { id: 'l2', nombre: 'Ayuntamiento de Málaga', empresa: 'Administración pública', status: 'propuesta', valor: 18000, proyecto: 'Experea', project_id: 'p1', responsable: 'Diego', responsable_id: '8', proxima_accion: 'Presentación a concejal de educación', proxima_accion_fecha: '2026-01-28', email: 'educacion@malaga.es' },
  { id: 'l3', nombre: 'Restaurante El Puerto', empresa: 'Hostelería', status: 'tibio', valor: 0, proyecto: 'Payo Sushi', project_id: 'p2', responsable: 'Manuel', responsable_id: '5', proxima_accion: 'Llamada de seguimiento', proxima_accion_fecha: '2026-01-22' },
  { id: 'l4', nombre: 'Hotel Miramar 5*', empresa: 'Turismo premium', status: 'hot', valor: 8500, proyecto: 'EventPro', project_id: 'p5', responsable: 'Carla', responsable_id: '7', proxima_accion: 'Reunión presencial para cerrar', proxima_accion_fecha: '2026-01-24', email: 'eventos@hotelmiramar.com' },
  { id: 'l5', nombre: 'Empresa Logística Sur SL', empresa: 'Logística', status: 'cerrado', valor: 12500, proyecto: 'TechNova Solutions', project_id: 'p4', responsable: 'Zarko', responsable_id: '1', proxima_accion: 'Kick-off del proyecto', proxima_accion_fecha: '2026-01-25' },
  { id: 'l6', nombre: 'Inversor particular Juan García', empresa: 'Particular', status: 'tibio', valor: 1450, proyecto: 'Academia Financiera', project_id: 'p3', responsable: 'Ángel', responsable_id: '3', proxima_accion: 'Demo personalizada del curso', proxima_accion_fecha: '2026-01-21' },
  { id: 'l7', nombre: 'Startup BioTech Innova', empresa: 'Biotecnología', status: 'propuesta', valor: 15000, proyecto: 'TechNova Solutions', project_id: 'p4', responsable: 'Zarko', responsable_id: '1', proxima_accion: 'Seguimiento propuesta MVP', proxima_accion_fecha: '2026-01-26' },
  { id: 'l8', nombre: 'Instituto Público Miraflores', empresa: 'Educación pública', status: 'propuesta', valor: 3500, proyecto: 'Experea', project_id: 'p1', responsable: 'Fernando S', responsable_id: '2', proxima_accion: 'Seguimiento de propuesta', proxima_accion_fecha: '2026-01-27' },
  { id: 'l9', nombre: 'Cadena Hoteles Costa', empresa: 'Hostelería', status: 'frio', valor: 25000, proyecto: 'EventPro', project_id: 'p5', responsable: 'Carla', responsable_id: '7', proxima_accion: 'Email de introducción', proxima_accion_fecha: '2026-01-30' },
  { id: 'l10', nombre: 'Grupo Empresarial Andaluz', empresa: 'Holding', status: 'hot', valor: 22000, proyecto: 'TechNova Solutions', project_id: 'p4', responsable: 'Miguel Ángel', responsable_id: '4', proxima_accion: 'Presentación a dirección', proxima_accion_fecha: '2026-01-23' },
];

// ============================================
// VALIDACIONES PENDIENTES DEMO
// ============================================

export const DEMO_VALIDATIONS: DemoValidation[] = [
  { id: 'v1', type: 'obv', titulo: 'Reunión demo con Colegio San José', owner: 'Fernando S', owner_id: '2', proyecto: 'Experea', fecha: '2026-01-19', deadline: '2026-01-22', isLate: false },
  { id: 'v2', type: 'bp', titulo: 'Lean Startup - Eric Ries (3 puntos)', owner: 'Carla', owner_id: '7', fecha: '2026-01-18', deadline: '2026-01-21', isLate: false },
  { id: 'v3', type: 'obv', titulo: 'Validación con 5 restauradores', owner: 'Manuel', owner_id: '5', proyecto: 'Payo Sushi', fecha: '2026-01-17', deadline: '2026-01-20', isLate: true },
  { id: 'v4', type: 'lp', titulo: 'Curso Google Analytics Avanzado', owner: 'Diego', owner_id: '8', fecha: '2026-01-16', deadline: '2026-01-19', isLate: true },
  { id: 'v5', type: 'obv', titulo: 'Cierre venta consultoría IA', owner: 'Zarko', owner_id: '1', proyecto: 'TechNova Solutions', fecha: '2026-01-20', deadline: '2026-01-23', isLate: false },
  { id: 'v6', type: 'bp', titulo: 'Zero to One - Peter Thiel', owner: 'Miguel Ángel', owner_id: '4', fecha: '2026-01-19', deadline: '2026-01-22', isLate: false },
];

// ============================================
// NOTIFICACIONES DEMO
// ============================================

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: 'n1', tipo: 'obv_aprobada', titulo: 'OBV aprobada', mensaje: 'Tu OBV "Cierre contrato consultoría IA" ha sido validada por 2 compañeros.', leida: false, fecha: '2026-01-21T10:30:00' },
  { id: 'n2', tipo: 'tarea_asignada', titulo: 'Nueva tarea asignada', mensaje: 'Se te ha asignado la tarea "Preparar propuesta colegio Sagrada Familia" en el proyecto Experea.', leida: false, fecha: '2026-01-21T09:15:00' },
  { id: 'n3', tipo: 'obv_nueva', titulo: 'OBV pendiente de validación', mensaje: 'Fernando S ha subido un OBV que necesita tu validación. Tienes 3 días.', leida: true, fecha: '2026-01-20T16:45:00' },
  { id: 'n4', tipo: 'lead_ganado', titulo: '¡Lead cerrado!', mensaje: 'El lead "Empresa Logística Sur SL" ha sido marcado como ganado. ¡Felicidades Zarko!', leida: true, fecha: '2026-01-19T14:00:00' },
  { id: 'n5', tipo: 'obv_rechazada', titulo: 'OBV necesita corrección', mensaje: 'Tu OBV "Piloto instituto público" ha sido rechazada. Revisa los comentarios.', leida: false, fecha: '2026-01-18T11:20:00' },
  { id: 'n6', tipo: 'ranking', titulo: '¡Has subido en el ranking!', mensaje: 'Ahora eres #2 en el ranking de OBVs del rol Sales. ¡Sigue así!', leida: true, fecha: '2026-01-17T18:00:00' },
  { id: 'n7', tipo: 'master', titulo: 'Nuevo Master de Sales', mensaje: 'Fernando S ha sido nombrado Master de Sales. ¡Enhorabuena!', leida: true, fecha: '2026-01-16T10:00:00' },
];

// ============================================
// DATOS FINANCIEROS DEMO - EVOLUCIÓN MENSUAL
// ============================================

export const DEMO_FINANCIAL_METRICS: DemoFinancialMetric[] = [
  // TechNova Solutions
  { project_id: 'p4', project_name: 'TechNova Solutions', project_color: '#3B82F6', month: '2025-08-01', facturacion: 12000, costes: 4800, margen: 7200, num_ventas: 2, margen_percent: 60, cobrado: 12000, pendiente_cobro: 0 },
  { project_id: 'p4', project_name: 'TechNova Solutions', project_color: '#3B82F6', month: '2025-09-01', facturacion: 15500, costes: 5400, margen: 10100, num_ventas: 3, margen_percent: 65, cobrado: 15500, pendiente_cobro: 0 },
  { project_id: 'p4', project_name: 'TechNova Solutions', project_color: '#3B82F6', month: '2025-10-01', facturacion: 18000, costes: 6300, margen: 11700, num_ventas: 3, margen_percent: 65, cobrado: 18000, pendiente_cobro: 0 },
  { project_id: 'p4', project_name: 'TechNova Solutions', project_color: '#3B82F6', month: '2025-11-01', facturacion: 22000, costes: 7700, margen: 14300, num_ventas: 4, margen_percent: 65, cobrado: 22000, pendiente_cobro: 0 },
  { project_id: 'p4', project_name: 'TechNova Solutions', project_color: '#3B82F6', month: '2025-12-01', facturacion: 28500, costes: 9975, margen: 18525, num_ventas: 5, margen_percent: 65, cobrado: 20000, pendiente_cobro: 8500 },
  { project_id: 'p4', project_name: 'TechNova Solutions', project_color: '#3B82F6', month: '2026-01-01', facturacion: 32000, costes: 11200, margen: 20800, num_ventas: 6, margen_percent: 65, cobrado: 12000, pendiente_cobro: 20000 },
  
  // Experea
  { project_id: 'p1', project_name: 'Experea', project_color: '#8B5CF6', month: '2025-08-01', facturacion: 3200, costes: 960, margen: 2240, num_ventas: 1, margen_percent: 70, cobrado: 3200, pendiente_cobro: 0 },
  { project_id: 'p1', project_name: 'Experea', project_color: '#8B5CF6', month: '2025-09-01', facturacion: 4500, costes: 1350, margen: 3150, num_ventas: 2, margen_percent: 70, cobrado: 4500, pendiente_cobro: 0 },
  { project_id: 'p1', project_name: 'Experea', project_color: '#8B5CF6', month: '2025-10-01', facturacion: 5800, costes: 1740, margen: 4060, num_ventas: 2, margen_percent: 70, cobrado: 5800, pendiente_cobro: 0 },
  { project_id: 'p1', project_name: 'Experea', project_color: '#8B5CF6', month: '2025-11-01', facturacion: 7200, costes: 2160, margen: 5040, num_ventas: 3, margen_percent: 70, cobrado: 7200, pendiente_cobro: 0 },
  { project_id: 'p1', project_name: 'Experea', project_color: '#8B5CF6', month: '2025-12-01', facturacion: 8500, costes: 2550, margen: 5950, num_ventas: 3, margen_percent: 70, cobrado: 5000, pendiente_cobro: 3500 },
  { project_id: 'p1', project_name: 'Experea', project_color: '#8B5CF6', month: '2026-01-01', facturacion: 9800, costes: 2940, margen: 6860, num_ventas: 4, margen_percent: 70, cobrado: 3000, pendiente_cobro: 6800 },

  // Payo Sushi
  { project_id: 'p2', project_name: 'Payo Sushi', project_color: '#10B981', month: '2025-09-01', facturacion: 2800, costes: 1400, margen: 1400, num_ventas: 8, margen_percent: 50, cobrado: 2800, pendiente_cobro: 0 },
  { project_id: 'p2', project_name: 'Payo Sushi', project_color: '#10B981', month: '2025-10-01', facturacion: 3500, costes: 1750, margen: 1750, num_ventas: 10, margen_percent: 50, cobrado: 3500, pendiente_cobro: 0 },
  { project_id: 'p2', project_name: 'Payo Sushi', project_color: '#10B981', month: '2025-11-01', facturacion: 4200, costes: 2100, margen: 2100, num_ventas: 12, margen_percent: 50, cobrado: 4200, pendiente_cobro: 0 },
  { project_id: 'p2', project_name: 'Payo Sushi', project_color: '#10B981', month: '2025-12-01', facturacion: 5100, costes: 2550, margen: 2550, num_ventas: 15, margen_percent: 50, cobrado: 5100, pendiente_cobro: 0 },
  { project_id: 'p2', project_name: 'Payo Sushi', project_color: '#10B981', month: '2026-01-01', facturacion: 5800, costes: 2900, margen: 2900, num_ventas: 18, margen_percent: 50, cobrado: 4000, pendiente_cobro: 1800 },

  // EventPro
  { project_id: 'p5', project_name: 'EventPro', project_color: '#EC4899', month: '2025-10-01', facturacion: 3500, costes: 1225, margen: 2275, num_ventas: 2, margen_percent: 65, cobrado: 3500, pendiente_cobro: 0 },
  { project_id: 'p5', project_name: 'EventPro', project_color: '#EC4899', month: '2025-11-01', facturacion: 5200, costes: 1820, margen: 3380, num_ventas: 3, margen_percent: 65, cobrado: 5200, pendiente_cobro: 0 },
  { project_id: 'p5', project_name: 'EventPro', project_color: '#EC4899', month: '2025-12-01', facturacion: 6800, costes: 2380, margen: 4420, num_ventas: 4, margen_percent: 65, cobrado: 4500, pendiente_cobro: 2300 },
  { project_id: 'p5', project_name: 'EventPro', project_color: '#EC4899', month: '2026-01-01', facturacion: 7500, costes: 2625, margen: 4875, num_ventas: 4, margen_percent: 65, cobrado: 2000, pendiente_cobro: 5500 },

  // Academia Financiera
  { project_id: 'p3', project_name: 'Academia Financiera', project_color: '#F59E0B', month: '2025-09-01', facturacion: 1800, costes: 360, margen: 1440, num_ventas: 4, margen_percent: 80, cobrado: 1800, pendiente_cobro: 0 },
  { project_id: 'p3', project_name: 'Academia Financiera', project_color: '#F59E0B', month: '2025-10-01', facturacion: 2400, costes: 480, margen: 1920, num_ventas: 6, margen_percent: 80, cobrado: 2400, pendiente_cobro: 0 },
  { project_id: 'p3', project_name: 'Academia Financiera', project_color: '#F59E0B', month: '2025-11-01', facturacion: 3200, costes: 640, margen: 2560, num_ventas: 8, margen_percent: 80, cobrado: 3200, pendiente_cobro: 0 },
  { project_id: 'p3', project_name: 'Academia Financiera', project_color: '#F59E0B', month: '2025-12-01', facturacion: 4100, costes: 820, margen: 3280, num_ventas: 10, margen_percent: 80, cobrado: 4100, pendiente_cobro: 0 },
  { project_id: 'p3', project_name: 'Academia Financiera', project_color: '#F59E0B', month: '2026-01-01', facturacion: 4800, costes: 960, margen: 3840, num_ventas: 12, margen_percent: 80, cobrado: 3500, pendiente_cobro: 1300 },
];

// ============================================
// COBROS PENDIENTES DEMO
// ============================================

export const DEMO_PENDING_PAYMENTS = [
  { id: 'pp1', titulo: 'Factura F-2026-001', cliente: 'Colegio San Patricio', cliente_empresa: 'Educación privada', importe: 4500, fecha_venta: '2026-01-05', fecha_cobro_esperada: '2026-02-05', estado_cobro: 'pendiente', importe_cobrado: 0, pendiente: 4500, dias_vencido: 0, numero_factura: 'F-2026-001', proyecto_nombre: 'Experea', proyecto_color: '#8B5CF6', responsable_nombre: 'Fernando S', responsable_id: '2' },
  { id: 'pp2', titulo: 'Factura F-2026-002', cliente: 'Empresa Logística Sur SL', cliente_empresa: 'Logística', importe: 12500, fecha_venta: '2026-01-10', fecha_cobro_esperada: '2026-02-10', estado_cobro: 'pendiente', importe_cobrado: 0, pendiente: 12500, dias_vencido: 0, numero_factura: 'F-2026-002', proyecto_nombre: 'TechNova Solutions', proyecto_color: '#3B82F6', responsable_nombre: 'Zarko', responsable_id: '1' },
  { id: 'pp3', titulo: 'Factura F-2025-089', cliente: 'Hotel Miramar', cliente_empresa: 'Turismo', importe: 5500, fecha_venta: '2025-12-15', fecha_cobro_esperada: '2026-01-15', estado_cobro: 'pendiente', importe_cobrado: 0, pendiente: 5500, dias_vencido: 6, numero_factura: 'F-2025-089', proyecto_nombre: 'EventPro', proyecto_color: '#EC4899', responsable_nombre: 'Carla', responsable_id: '7' },
  { id: 'pp4', titulo: 'Factura F-2025-092', cliente: 'Consultora ABC', cliente_empresa: 'Consultoría', importe: 8000, fecha_venta: '2025-12-20', fecha_cobro_esperada: '2026-01-10', estado_cobro: 'parcial', importe_cobrado: 4000, pendiente: 4000, dias_vencido: 11, numero_factura: 'F-2025-092', proyecto_nombre: 'TechNova Solutions', proyecto_color: '#3B82F6', responsable_nombre: 'Zarko', responsable_id: '1' },
  { id: 'pp5', titulo: 'Factura F-2026-003', cliente: 'Academia Invest', cliente_empresa: 'Formación', importe: 1300, fecha_venta: '2026-01-08', fecha_cobro_esperada: '2026-02-08', estado_cobro: 'pendiente', importe_cobrado: 0, pendiente: 1300, dias_vencido: 0, numero_factura: 'F-2026-003', proyecto_nombre: 'Academia Financiera', proyecto_color: '#F59E0B', responsable_nombre: 'Ángel', responsable_id: '3' },
];

// ============================================
// DATOS FINANCIEROS AGREGADOS DEMO
// ============================================

export const DEMO_FINANCIAL = {
  facturacion_total: 196400,
  margen_total: 143650,
  cobrado: 142000,
  pendiente_cobro: 54400,
  objetivo_facturacion: 250000,
  objetivo_margen: 175000,
  crecimiento_mensual: 15.8,
  por_proyecto: [
    { proyecto: 'TechNova Solutions', facturacion: 85000, margen: 62400, porcentaje: 43, color: '#3B82F6' },
    { proyecto: 'Experea', facturacion: 28500, margen: 21400, porcentaje: 15, color: '#8B5CF6' },
    { proyecto: 'Payo Sushi', facturacion: 18200, margen: 12100, porcentaje: 9, color: '#10B981' },
    { proyecto: 'EventPro', facturacion: 17800, margen: 13200, porcentaje: 9, color: '#EC4899' },
    { proyecto: 'Academia Financiera', facturacion: 13400, margen: 11200, porcentaje: 7, color: '#F59E0B' },
  ],
  cobros_pendientes: DEMO_PENDING_PAYMENTS,
};

// ============================================
// KPIs DEMO
// ============================================

export const DEMO_KPIS = {
  obvs: { actual: 880, objetivo: 1350, porcentaje: 65 },
  lps: { actual: 115, objetivo: 162, porcentaje: 71 },
  bps: { actual: 421, objetivo: 594, porcentaje: 71 },
  cps: { actual: 398, objetivo: 360, porcentaje: 110 },
  facturacion: { actual: 196400, objetivo: 250000, porcentaje: 79 },
  margen: { actual: 143650, objetivo: 175000, porcentaje: 82 },
};

// ============================================
// RANKINGS DEMO
// ============================================

export const DEMO_ROLE_RANKINGS: DemoRanking[] = [
  // Sales rankings
  { id: 'r1', user_id: '2', user_name: 'FERNANDO S', role_name: 'sales', project_id: 'p1', project_name: 'Experea', ranking_position: 1, previous_position: 1, score: 92 },
  { id: 'r2', user_id: '1', user_name: 'ZARKO', role_name: 'sales', project_id: 'p4', project_name: 'TechNova Solutions', ranking_position: 2, previous_position: 3, score: 88 },
  { id: 'r3', user_id: '3', user_name: 'ÁNGEL', role_name: 'sales', project_id: 'p3', project_name: 'Academia Financiera', ranking_position: 3, previous_position: 2, score: 85 },
  { id: 'r4', user_id: '7', user_name: 'CARLA', role_name: 'sales', project_id: 'p5', project_name: 'EventPro', ranking_position: 4, previous_position: 5, score: 78 },
  
  // AI Tech rankings
  { id: 'r5', user_id: '1', user_name: 'ZARKO', role_name: 'ai_tech', project_id: 'p4', project_name: 'TechNova Solutions', ranking_position: 1, previous_position: 1, score: 95 },
  { id: 'r6', user_id: '8', user_name: 'DIEGO', role_name: 'ai_tech', project_id: 'p1', project_name: 'Experea', ranking_position: 2, previous_position: 2, score: 82 },
  
  // Finance rankings
  { id: 'r7', user_id: '3', user_name: 'ÁNGEL', role_name: 'finance', project_id: 'p3', project_name: 'Academia Financiera', ranking_position: 1, previous_position: 1, score: 90 },
  { id: 'r8', user_id: '4', user_name: 'MIGUEL ÁNGEL', role_name: 'finance', project_id: 'p4', project_name: 'TechNova Solutions', ranking_position: 2, previous_position: 3, score: 84 },
  
  // Operations rankings
  { id: 'r9', user_id: '5', user_name: 'MANUEL', role_name: 'operations', project_id: 'p2', project_name: 'Payo Sushi', ranking_position: 1, previous_position: 1, score: 88 },
  { id: 'r10', user_id: '9', user_name: 'LUIS', role_name: 'operations', project_id: 'p2', project_name: 'Payo Sushi', ranking_position: 2, previous_position: 2, score: 80 },
  
  // Marketing rankings
  { id: 'r11', user_id: '6', user_name: 'FERNANDO G', role_name: 'marketing', project_id: 'p3', project_name: 'Academia Financiera', ranking_position: 1, previous_position: 2, score: 86 },
  { id: 'r12', user_id: '7', user_name: 'CARLA', role_name: 'marketing', project_id: 'p5', project_name: 'EventPro', ranking_position: 2, previous_position: 1, score: 84 },
];

export const DEMO_RANKINGS = {
  obvs: [
    { posicion: 1, nombre: 'FERNANDO S', valor: 136, cambio: 0, color: '#10B981' },
    { posicion: 2, nombre: 'ZARKO', valor: 126, cambio: 1, color: '#8B5CF6' },
    { posicion: 3, nombre: 'ÁNGEL', valor: 117, cambio: -1, color: '#F59E0B' },
    { posicion: 4, nombre: 'FERNANDO G', valor: 109, cambio: 0, color: '#EF4444' },
    { posicion: 5, nombre: 'MIGUEL ÁNGEL', valor: 103, cambio: 2, color: '#3B82F6' },
  ],
  margen: [
    { posicion: 1, nombre: 'FERNANDO S', valor: 59560, cambio: 0, color: '#10B981' },
    { posicion: 2, nombre: 'ÁNGEL', valor: 30970, cambio: 0, color: '#F59E0B' },
    { posicion: 3, nombre: 'MIGUEL ÁNGEL', valor: 24170, cambio: 2, color: '#3B82F6' },
    { posicion: 4, nombre: 'MANUEL', valor: 10350, cambio: -1, color: '#EC4899' },
    { posicion: 5, nombre: 'LUIS', valor: 7030, cambio: 1, color: '#06B6D4' },
  ],
  lps: [
    { posicion: 1, nombre: 'ZARKO', valor: 14, cambio: 0, color: '#8B5CF6' },
    { posicion: 2, nombre: 'FERNANDO S', valor: 14, cambio: 0, color: '#10B981' },
    { posicion: 3, nombre: 'ÁNGEL', valor: 13, cambio: 0, color: '#F59E0B' },
    { posicion: 4, nombre: 'MANUEL', valor: 13, cambio: 1, color: '#EC4899' },
    { posicion: 5, nombre: 'FERNANDO G', valor: 13, cambio: -1, color: '#EF4444' },
  ],
};

// ============================================
// ACTIVIDAD RECIENTE DEMO
// ============================================

export const DEMO_ACTIVITY = [
  { id: 'a1', user: 'Fernando S', user_id: '2', action: 'cerró venta de', target: '€4,500 en Experea', time: 'hace 1h', type: 'venta', color: '#10B981' },
  { id: 'a2', user: 'Zarko', user_id: '1', action: 'completó tarea', target: 'Dashboard de métricas IA', time: 'hace 2h', type: 'tarea', color: '#8B5CF6' },
  { id: 'a3', user: 'Carla', user_id: '7', action: 'validó OBV de', target: 'Manuel en Payo Sushi', time: 'hace 3h', type: 'validacion', color: '#F472B6' },
  { id: 'a4', user: 'Ángel', user_id: '3', action: 'subió nuevo curso', target: 'Módulo 3: ETFs', time: 'hace 4h', type: 'kpi', color: '#F59E0B' },
  { id: 'a5', user: 'Manuel', user_id: '5', action: 'añadió lead', target: 'Restaurante El Puerto', time: 'hace 5h', type: 'lead', color: '#EC4899' },
  { id: 'a6', user: 'Diego', user_id: '8', action: 'completó LP', target: 'Google Analytics Avanzado', time: 'hace 6h', type: 'lp', color: '#84CC16' },
  { id: 'a7', user: 'Miguel Ángel', user_id: '4', action: 'movió lead a Hot', target: 'Grupo Empresarial Andaluz', time: 'hace 8h', type: 'lead', color: '#3B82F6' },
  { id: 'a8', user: 'Luis', user_id: '9', action: 'finalizó análisis', target: 'Competencia delivery zona sur', time: 'hace 10h', type: 'tarea', color: '#06B6D4' },
];

// ============================================
// MASTERS DEMO
// ============================================

export const DEMO_MASTERS = [
  { id: 'm1', user_id: '2', role_name: 'sales', userName: 'FERNANDO S', userColor: '#10B981', nivel: 2, title: 'Master of Sales', successful_defenses: 3, total_mentees: 2, is_active: true, appointed_at: '2025-09-15' },
  { id: 'm2', user_id: '1', role_name: 'ai_tech', userName: 'ZARKO', userColor: '#8B5CF6', nivel: 1, title: 'Tech Innovator', successful_defenses: 1, total_mentees: 1, is_active: true, appointed_at: '2025-11-01' },
  { id: 'm3', user_id: '3', role_name: 'finance', userName: 'ÁNGEL', userColor: '#F59E0B', nivel: 1, title: 'Financial Wizard', successful_defenses: 2, total_mentees: 1, is_active: true, appointed_at: '2025-10-10' },
  { id: 'm4', user_id: '5', role_name: 'operations', userName: 'MANUEL', userColor: '#EC4899', nivel: 1, title: 'Operations Expert', successful_defenses: 1, total_mentees: 2, is_active: true, appointed_at: '2025-12-01' },
];

export const DEMO_MASTER_APPLICATIONS = [
  { id: 'ma1', user_id: '7', user_name: 'CARLA', role_name: 'marketing', motivation: 'Quiero compartir mi experiencia en estrategias de eventos y networking', status: 'voting', votes_for: 4, votes_against: 1, votes_required: 5, voting_deadline: '2026-01-25', created_at: '2026-01-18' },
  { id: 'ma2', user_id: '8', user_name: 'DIEGO', role_name: 'ai_tech', motivation: 'He desarrollado múltiples integraciones de IA y quiero mentorizar a otros', status: 'voting', votes_for: 3, votes_against: 0, votes_required: 5, voting_deadline: '2026-01-27', created_at: '2026-01-20' },
];

export const DEMO_MASTER_CHALLENGES = [
  { id: 'mc1', master_id: 'm1', challenger_id: '4', challenger_name: 'MIGUEL ÁNGEL', role_name: 'sales', status: 'in_progress', description: 'Desafío para demostrar habilidades de cierre de ventas B2B', deadline: '2026-02-01', created_at: '2026-01-15' },
];

// ============================================
// ROTACIÓN DE ROLES DEMO
// ============================================

export const DEMO_ROTATION_REQUESTS: DemoRotationRequest[] = [
  { id: 'rr1', requester_id: '6', requester_name: 'FERNANDO G', requester_current_role: 'marketing', target_user_id: '7', target_user_name: 'CARLA', target_role: 'sales', requester_project_id: 'p3', target_project_id: 'p5', status: 'pending', reason: 'Quiero desarrollar habilidades comerciales directas', created_at: '2026-01-18' },
  { id: 'rr2', requester_id: '9', requester_name: 'LUIS', requester_current_role: 'operations', target_user_id: '5', target_user_name: 'MANUEL', target_role: 'operations', requester_project_id: 'p2', target_project_id: 'p2', status: 'approved', reason: 'Intercambio temporal para aprender gestión de delivery', created_at: '2026-01-10' },
  { id: 'rr3', requester_id: '8', requester_name: 'DIEGO', requester_current_role: 'ai_tech', target_user_id: '1', target_user_name: 'ZARKO', target_role: 'ai_tech', requester_project_id: 'p1', target_project_id: 'p4', status: 'completed', reason: 'Rotación para conocer proyectos más complejos de IA', created_at: '2025-12-15' },
];

export const DEMO_ROLE_HISTORY: DemoRoleHistory[] = [
  { id: 'rh1', user_id: '8', user_name: 'DIEGO', project_id: 'p4', project_name: 'TechNova Solutions', old_role: 'ai_tech', new_role: 'ai_tech', change_type: 'rotation', created_at: '2026-01-01', notes: 'Rotación temporal completada exitosamente' },
  { id: 'rh2', user_id: '7', user_name: 'CARLA', project_id: 'p5', project_name: 'EventPro', old_role: 'marketing', new_role: 'sales', change_type: 'promotion', created_at: '2025-11-15', notes: 'Promoción a rol de ventas por excelente desempeño' },
  { id: 'rh3', user_id: '4', user_name: 'MIGUEL ÁNGEL', project_id: 'p4', project_name: 'TechNova Solutions', old_role: 'sales', new_role: 'finance', change_type: 'rotation', created_at: '2025-10-01', notes: 'Cambio de rol para diversificar experiencia' },
];

// ============================================
// RENDIMIENTO POR ROL DEMO
// ============================================

export const DEMO_PERFORMANCES: DemoPerformance[] = [
  { user_id: '1', user_name: 'ZARKO', project_id: 'p4', project_name: 'TechNova Solutions', role_name: 'ai_tech', performance_score: 95, task_completion_rate: 92, total_tasks: 25, completed_tasks: 23, total_obvs: 45, validated_obvs: 42, total_facturacion: 32000, total_leads: 8, leads_ganados: 5 },
  { user_id: '1', user_name: 'ZARKO', project_id: 'p4', project_name: 'TechNova Solutions', role_name: 'sales', performance_score: 88, task_completion_rate: 85, total_tasks: 18, completed_tasks: 15, total_obvs: 28, validated_obvs: 24, total_facturacion: 28000, total_leads: 12, leads_ganados: 6 },
  { user_id: '2', user_name: 'FERNANDO S', project_id: 'p1', project_name: 'Experea', role_name: 'sales', performance_score: 92, task_completion_rate: 88, total_tasks: 22, completed_tasks: 19, total_obvs: 52, validated_obvs: 48, total_facturacion: 45000, total_leads: 15, leads_ganados: 8 },
  { user_id: '3', user_name: 'ÁNGEL', project_id: 'p3', project_name: 'Academia Financiera', role_name: 'finance', performance_score: 90, task_completion_rate: 95, total_tasks: 20, completed_tasks: 19, total_obvs: 38, validated_obvs: 35, total_facturacion: 22000, total_leads: 10, leads_ganados: 6 },
  { user_id: '5', user_name: 'MANUEL', project_id: 'p2', project_name: 'Payo Sushi', role_name: 'operations', performance_score: 88, task_completion_rate: 90, total_tasks: 30, completed_tasks: 27, total_obvs: 35, validated_obvs: 32, total_facturacion: 8500, total_leads: 5, leads_ganados: 3 },
  { user_id: '7', user_name: 'CARLA', project_id: 'p5', project_name: 'EventPro', role_name: 'sales', performance_score: 85, task_completion_rate: 82, total_tasks: 18, completed_tasks: 15, total_obvs: 28, validated_obvs: 25, total_facturacion: 15000, total_leads: 8, leads_ganados: 4 },
];

// ============================================
// PROJECT MEMBERS DEMO
// ============================================

export const DEMO_PROJECT_MEMBERS = [
  { id: 'pm1', member_id: '1', project_id: 'p4', role: 'ai_tech', is_lead: true, performance_score: 95, role_accepted: true },
  { id: 'pm2', member_id: '1', project_id: 'p4', role: 'sales', is_lead: false, performance_score: 88, role_accepted: true },
  { id: 'pm3', member_id: '2', project_id: 'p1', role: 'sales', is_lead: true, performance_score: 92, role_accepted: true },
  { id: 'pm4', member_id: '3', project_id: 'p3', role: 'finance', is_lead: true, performance_score: 90, role_accepted: true },
  { id: 'pm5', member_id: '4', project_id: 'p4', role: 'finance', is_lead: false, performance_score: 84, role_accepted: true },
  { id: 'pm6', member_id: '5', project_id: 'p2', role: 'operations', is_lead: true, performance_score: 88, role_accepted: true },
  { id: 'pm7', member_id: '6', project_id: 'p3', role: 'marketing', is_lead: false, performance_score: 86, role_accepted: true },
  { id: 'pm8', member_id: '7', project_id: 'p5', role: 'sales', is_lead: true, performance_score: 85, role_accepted: true },
  { id: 'pm9', member_id: '8', project_id: 'p1', role: 'ai_tech', is_lead: false, performance_score: 82, role_accepted: true },
  { id: 'pm10', member_id: '9', project_id: 'p2', role: 'operations', is_lead: false, performance_score: 80, role_accepted: true },
];

// ============================================
// INSIGHTS DEMO (Mi Desarrollo)
// ============================================

export const DEMO_INSIGHTS: DemoInsight[] = [
  {
    id: 'ins1',
    user_id: '1',
    titulo: 'Automatización con IA mejora conversión en 35%',
    contenido: 'Al implementar el chatbot con IA en TechNova Solutions, descubrimos que los leads respondían mucho mejor cuando el bot personalizaba las respuestas según el sector del cliente. La tasa de conversión subió del 12% al 35% en el primer mes.',
    tipo: 'exito',
    tags: ['ia', 'ventas', 'automatización', 'chatbot'],
    is_private: false,
    project_id: 'p4',
    role_context: 'ai_tech',
    created_at: '2026-01-20T14:30:00Z'
  },
  {
    id: 'ins2',
    user_id: '1',
    titulo: 'Error crítico: No validar datos antes de ML pipeline',
    contenido: 'Lancé un modelo de predicción de churn sin validar correctamente los datos de entrada. El modelo daba predicciones erróneas porque había outliers no tratados. Lección: siempre incluir paso de data quality antes de entrenar.',
    tipo: 'error',
    tags: ['machine-learning', 'data-quality', 'lección'],
    is_private: false,
    project_id: 'p4',
    role_context: 'ai_tech',
    created_at: '2026-01-18T10:15:00Z'
  },
  {
    id: 'ins3',
    user_id: '1',
    titulo: 'Framework MEDDIC para calificar leads B2B',
    contenido: 'He aprendido a usar el framework MEDDIC (Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion) para calificar leads enterprise. Ayuda muchísimo a priorizar y no perder tiempo con leads que no van a cerrar.',
    tipo: 'aprendizaje',
    tags: ['ventas', 'b2b', 'metodología', 'meddic'],
    is_private: false,
    role_context: 'sales',
    created_at: '2026-01-15T16:45:00Z'
  },
  {
    id: 'ins4',
    user_id: '1',
    titulo: 'Reflexión: Equilibrio entre perfeccionismo y velocidad',
    contenido: 'Me doy cuenta de que a veces paso demasiado tiempo perfeccionando una solución cuando el cliente necesita algo funcional rápido. Debo aplicar más el principio 80/20 y entregar MVPs iterativos.',
    tipo: 'reflexion',
    tags: ['productividad', 'mindset', 'mvp'],
    is_private: true,
    created_at: '2026-01-12T09:00:00Z'
  },
  {
    id: 'ins5',
    user_id: '1',
    titulo: 'Idea: Dashboard predictivo para rotación de roles',
    contenido: 'Podríamos crear un dashboard que use los datos históricos de rendimiento para sugerir automáticamente cuándo una persona debería rotar de rol. Incluiría métricas como tiempo en rol, curva de aprendizaje y satisfacción.',
    tipo: 'idea',
    tags: ['producto', 'analytics', 'rotación', 'predicción'],
    is_private: false,
    project_id: 'p4',
    role_context: 'ai_tech',
    created_at: '2026-01-10T11:30:00Z'
  },
  {
    id: 'ins6',
    user_id: '1',
    titulo: 'Primera venta enterprise cerrada autónomamente',
    contenido: 'He cerrado mi primera venta de +10K€ sin ayuda del equipo senior. Clave: entender profundamente el dolor del cliente antes de presentar la solución. El proceso tomó 3 reuniones pero valió la pena.',
    tipo: 'exito',
    tags: ['ventas', 'enterprise', 'milestone'],
    is_private: false,
    project_id: 'p4',
    role_context: 'sales',
    created_at: '2026-01-08T17:20:00Z'
  },
  {
    id: 'ins7',
    user_id: '1',
    titulo: 'Documentación técnica como herramienta de venta',
    contenido: 'Crear documentación técnica clara y visual (diagramas de arquitectura, flujos de datos) genera mucha confianza en clientes técnicos. He empezado a incluirla en todas las propuestas B2B.',
    tipo: 'aprendizaje',
    tags: ['documentación', 'ventas', 'b2b', 'técnico'],
    is_private: false,
    role_context: 'ai_tech',
    created_at: '2026-01-05T14:00:00Z'
  },
];

// ============================================
// PLAYBOOKS DEMO (Mi Desarrollo)
// ============================================

export const DEMO_PLAYBOOKS: DemoPlaybook[] = [
  {
    id: 'pb1',
    user_id: '1',
    role_name: 'ai_tech',
    version: 3,
    contenido: {
      sections: [
        {
          title: 'Responsabilidades Clave del AI Tech Lead',
          content: 'Como AI Tech en TechNova Solutions, tu función principal es liderar el desarrollo e implementación de soluciones basadas en inteligencia artificial. Esto incluye desde el diseño de arquitecturas ML hasta la puesta en producción y monitoreo de modelos.',
          tips: [
            'Mantén un backlog técnico priorizado por impacto de negocio',
            'Documenta todos los experimentos y sus resultados',
            'Programa revisiones semanales de métricas de modelos en producción'
          ]
        },
        {
          title: 'Mejores Prácticas Basadas en tu Rendimiento',
          content: 'Tu tasa de completitud del 92% indica excelente ejecución. Para mantener este nivel, enfócate en la planificación semanal y evita el scope creep en proyectos técnicos.',
          tips: [
            'Divide tareas complejas en subtareas de máximo 4 horas',
            'Usa timeboxing para investigación y experimentación',
            'Involucra al cliente en demos tempranas para validar dirección'
          ]
        },
        {
          title: 'Desarrollo de Habilidades Prioritarias',
          content: 'Basado en el contexto del proyecto y tendencias del mercado, las áreas de desarrollo más relevantes son: MLOps para automatizar pipelines, y comunicación técnica para presentar a stakeholders no técnicos.',
          tips: [
            'Dedica 2h semanales a formación en MLOps/DevOps',
            'Practica explicar conceptos técnicos con analogías simples',
            'Participa en demos con clientes para ganar exposición'
          ]
        }
      ]
    },
    fortalezas: [
      'Ejecución técnica excelente',
      'Alta tasa de OBVs validadas',
      'Capacidad de cerrar proyectos complejos',
      'Documentación clara'
    ],
    areas_mejora: [
      'Delegación de tareas técnicas',
      'Estimación de tiempos',
      'Comunicación proactiva de bloqueos'
    ],
    objetivos_sugeridos: [
      {
        objetivo: 'Implementar pipeline CI/CD para modelos ML',
        plazo: '3 semanas',
        metricas: ['Tiempo de deploy reducido 50%', 'Zero downtime en releases']
      },
      {
        objetivo: 'Mentorizar a 1 junior en técnicas de ML',
        plazo: '2 meses',
        metricas: ['Junior completa 2 proyectos autónomos', 'Feedback positivo']
      },
      {
        objetivo: 'Presentar caso de éxito en meetup local',
        plazo: '1 mes',
        metricas: ['Presentación realizada', '3 leads generados']
      }
    ],
    ai_model: 'google/gemini-2.5-flash',
    is_active: true,
    generated_at: '2026-01-19T10:00:00Z'
  },
  {
    id: 'pb2',
    user_id: '1',
    role_name: 'sales',
    version: 2,
    contenido: {
      sections: [
        {
          title: 'Estrategia de Ventas B2B Tech',
          content: 'En ventas de consultoría tecnológica, el ciclo es largo y consultivo. Tu rol es identificar dolor, educar al cliente sobre posibles soluciones, y construir confianza antes de presentar propuesta.',
          tips: [
            'Usa framework MEDDIC para calificar leads',
            'Prepara casos de éxito relevantes para cada industria',
            'Nunca hables de precio antes de establecer valor'
          ]
        },
        {
          title: 'Proceso de Venta Consultiva',
          content: 'Sigue el proceso: Discovery (entender dolor) → Demo (mostrar posibilidad) → Propuesta (valor + precio) → Negociación → Cierre. Cada fase tiene objetivos claros.',
          tips: [
            'En discovery, escucha 70% y habla 30%',
            'Personaliza cada demo al contexto del cliente',
            'Incluye ROI estimado en todas las propuestas'
          ]
        },
        {
          title: 'Gestión de Pipeline y Forecast',
          content: 'Mantén tu pipeline actualizado diariamente. Usa probabilidades realistas: Tibio (20%), Hot (50%), Propuesta (70%), Negociación (90%).',
          tips: [
            'Revisa pipeline cada lunes para priorizar semana',
            'Mueve leads a perdido si no hay respuesta en 3 seguimientos',
            'Documenta razón de pérdida para mejorar'
          ]
        }
      ]
    },
    fortalezas: [
      'Conocimiento técnico diferenciador',
      'Capacidad de generar confianza rápido',
      'Buen ratio de cierre en enterprise'
    ],
    areas_mejora: [
      'Volumen de prospección',
      'Seguimiento sistemático',
      'Negociación de precios'
    ],
    objetivos_sugeridos: [
      {
        objetivo: 'Alcanzar 20 leads activos en pipeline',
        plazo: '4 semanas',
        metricas: ['20 leads en CRM', '5 en fase propuesta']
      },
      {
        objetivo: 'Implementar secuencia de seguimiento automatizada',
        plazo: '2 semanas',
        metricas: ['Secuencia creada', 'Tasa respuesta +15%']
      }
    ],
    ai_model: 'google/gemini-2.5-flash',
    is_active: true,
    generated_at: '2026-01-15T14:30:00Z'
  }
];

// ============================================
// FUNCIÓN HELPER PARA OBTENER DATOS DEMO
// ============================================

export type DemoDataSection = 
  | 'dashboard' 
  | 'mi-espacio' 
  | 'obvs' 
  | 'kpis' 
  | 'crm' 
  | 'financiero' 
  | 'analytics' 
  | 'rankings' 
  | 'masters' 
  | 'rotacion' 
  | 'proyectos' 
  | 'notificaciones'
  | 'mi-desarrollo'
  | 'settings'
  | 'roles-meeting';

export function getDemoData(section: DemoDataSection) {
  switch (section) {
    case 'dashboard':
      return {
        members: DEMO_MEMBERS,
        kpis: DEMO_KPIS,
        rankings: DEMO_RANKINGS,
        activity: DEMO_ACTIVITY,
        validations: DEMO_VALIDATIONS,
        projects: DEMO_PROJECTS,
      };
    case 'mi-espacio':
      return {
        member: DEMO_MEMBERS[0], // Zarko como usuario demo
        tasks: DEMO_TASKS.filter(t => t.assignee_id === '1'),
        obvs: DEMO_OBVS.filter(o => o.owner_id === '1'),
        validations: DEMO_VALIDATIONS.slice(0, 3),
        projects: DEMO_PROJECTS.filter(p => ['p4'].includes(p.id)),
        projectMembers: DEMO_PROJECT_MEMBERS.filter(pm => pm.member_id === '1'),
        performances: DEMO_PERFORMANCES.filter(p => p.user_id === '1'),
      };
    case 'obvs':
      return {
        obvs: DEMO_OBVS,
        validations: DEMO_VALIDATIONS.filter(v => v.type === 'obv'),
        projects: DEMO_PROJECTS,
      };
    case 'kpis':
      return {
        kpis: DEMO_KPIS,
        validations: DEMO_VALIDATIONS.filter(v => v.type !== 'obv'),
        members: DEMO_MEMBERS,
      };
    case 'crm':
      return {
        leads: DEMO_LEADS,
        projects: DEMO_PROJECTS,
        members: DEMO_MEMBERS,
      };
    case 'financiero':
      return {
        ...DEMO_FINANCIAL,
        financialMetrics: DEMO_FINANCIAL_METRICS,
        pendingPayments: DEMO_PENDING_PAYMENTS,
        members: DEMO_MEMBERS,
      };
    case 'analytics':
      return {
        members: DEMO_MEMBERS,
        projects: DEMO_PROJECTS,
        projectStats: DEMO_PROJECTS,
        kpis: DEMO_KPIS,
        financialMetrics: DEMO_FINANCIAL_METRICS,
      };
    case 'rankings':
      return {
        rankings: DEMO_ROLE_RANKINGS,
        simpleRankings: DEMO_RANKINGS,
        members: DEMO_MEMBERS,
        projects: DEMO_PROJECTS,
        performances: DEMO_PERFORMANCES,
      };
    case 'masters':
      return {
        masters: DEMO_MASTERS,
        applications: DEMO_MASTER_APPLICATIONS,
        challenges: DEMO_MASTER_CHALLENGES,
        members: DEMO_MEMBERS,
        profiles: DEMO_MEMBERS,
      };
    case 'rotacion':
      return {
        requests: DEMO_ROTATION_REQUESTS,
        history: DEMO_ROLE_HISTORY,
        members: DEMO_MEMBERS,
        projects: DEMO_PROJECTS,
        projectMembers: DEMO_PROJECT_MEMBERS,
      };
    case 'proyectos':
      return {
        projects: DEMO_PROJECTS,
        members: DEMO_MEMBERS,
        projectMembers: DEMO_PROJECT_MEMBERS,
      };
    case 'notificaciones':
      return {
        notifications: DEMO_NOTIFICATIONS,
      };
    case 'mi-desarrollo':
      return {
        member: DEMO_MEMBERS[0],
        performances: DEMO_PERFORMANCES.filter(p => p.user_id === '1'),
        rankings: DEMO_ROLE_RANKINGS.filter(r => r.user_id === '1'),
        masters: DEMO_MASTERS,
        projectMembers: DEMO_PROJECT_MEMBERS.filter(pm => pm.member_id === '1'),
        insights: DEMO_INSIGHTS.filter(i => i.user_id === '1'),
        playbooks: DEMO_PLAYBOOKS.filter(p => p.user_id === '1'),
      };
    case 'settings':
      return {
        member: DEMO_MEMBERS[0],
      };
    case 'roles-meeting':
      return {
        members: DEMO_MEMBERS,
        projects: DEMO_PROJECTS,
        projectMembers: DEMO_PROJECT_MEMBERS,
      };
    default:
      return null;
  }
}
