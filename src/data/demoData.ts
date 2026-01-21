// ============================================
// DATOS DEMO PARA CADA SECCIÓN
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
}

export interface DemoOBV {
  id: string;
  titulo: string;
  descripcion: string;
  owner: string;
  proyecto: string;
  tipo: 'exploracion' | 'validacion' | 'venta';
  fecha: string;
  status: 'pendiente' | 'validado' | 'rechazado';
  facturacion?: number;
  margen?: number;
}

export interface DemoTask {
  id: string;
  titulo: string;
  descripcion: string;
  proyecto: string;
  assignee: string;
  status: 'todo' | 'in_progress' | 'done';
  prioridad: number;
  fecha_limite: string;
  hasPlaybook: boolean;
}

export interface DemoLead {
  id: string;
  nombre: string;
  empresa: string;
  status: 'frio' | 'tibio' | 'hot' | 'propuesta' | 'cerrado' | 'perdido';
  valor: number;
  proyecto: string;
  responsable: string;
  proxima_accion: string;
}

export interface DemoValidation {
  id: string;
  type: 'obv' | 'lp' | 'bp';
  titulo: string;
  owner: string;
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

// ============================================
// MIEMBROS DEMO
// ============================================

export const DEMO_MEMBERS: DemoMember[] = [
  { id: '1', nombre: 'ZARKO', email: 'zarko@nova.com', color: '#8B5CF6', avatar: null, lps: 14, bps: 57, obvs: 126, cps: 49, facturacion: 10650, margen: 5090 },
  { id: '2', nombre: 'FERNANDO S', email: 'fernando.s@nova.com', color: '#10B981', avatar: null, lps: 14, bps: 52, obvs: 136, cps: 43, facturacion: 65160, margen: 59560 },
  { id: '3', nombre: 'ÁNGEL', email: 'angel@nova.com', color: '#F59E0B', avatar: null, lps: 13, bps: 54, obvs: 117, cps: 44, facturacion: 39340, margen: 30970 },
  { id: '4', nombre: 'MIGUEL ÁNGEL', email: 'miguelangel@nova.com', color: '#3B82F6', avatar: null, lps: 12, bps: 52, obvs: 103, cps: 41, facturacion: 40140, margen: 24170 },
  { id: '5', nombre: 'MANUEL', email: 'manuel@nova.com', color: '#EC4899', avatar: null, lps: 13, bps: 50, obvs: 100, cps: 45, facturacion: 10740, margen: 10350 },
  { id: '6', nombre: 'FERNANDO G', email: 'fernando.g@nova.com', color: '#EF4444', avatar: null, lps: 13, bps: 52, obvs: 109, cps: 41, facturacion: 3100, margen: 1440 },
  { id: '7', nombre: 'CARLA', email: 'carla@nova.com', color: '#F472B6', avatar: null, lps: 12, bps: 49, obvs: 87, cps: 49, facturacion: 3870, margen: 2840 },
  { id: '8', nombre: 'DIEGO', email: 'diego@nova.com', color: '#84CC16', avatar: null, lps: 12, bps: 54, obvs: 102, cps: 42, facturacion: 12080, margen: 1950 },
  { id: '9', nombre: 'LUIS', email: 'luis@nova.com', color: '#06B6D4', avatar: null, lps: 12, bps: 51, obvs: 86, cps: 44, facturacion: 11320, margen: 7030 },
];

// ============================================
// PROYECTOS DEMO
// ============================================

export const DEMO_PROJECTS: DemoProject[] = [
  { id: 'p1', nombre: 'Experea', icon: '🎓', color: '#8B5CF6', fase: 'venta', tipo: 'b2b', descripcion: 'Plataforma de experiencias educativas para colegios', miembros: 5, obvs: 45, facturacion: 12500 },
  { id: 'p2', nombre: 'Payo Sushi', icon: '🍣', color: '#10B981', fase: 'validacion', tipo: 'startup', descripcion: 'Restaurante de sushi artesanal y delivery', miembros: 4, obvs: 32, facturacion: 8200 },
  { id: 'p3', nombre: 'Academia Financiera', icon: '💰', color: '#F59E0B', fase: 'exploracion', tipo: 'b2c', descripcion: 'Formación en finanzas personales e inversión', miembros: 3, obvs: 18, facturacion: 3400 },
  { id: 'p4', nombre: 'TechNova Solutions', icon: '💻', color: '#3B82F6', fase: 'venta', tipo: 'b2b', descripcion: 'Consultoría de transformación digital y IA', miembros: 6, obvs: 67, facturacion: 45000 },
  { id: 'p5', nombre: 'EventPro', icon: '🎉', color: '#EC4899', fase: 'validacion', tipo: 'b2b', descripcion: 'Gestión y organización de eventos corporativos', miembros: 4, obvs: 28, facturacion: 7800 },
];

// ============================================
// OBVs DEMO
// ============================================

export const DEMO_OBVS: DemoOBV[] = [
  { id: 'o1', titulo: 'Reunión demo con Colegio San Patricio', descripcion: 'Presentación del producto a dirección y coordinadores', owner: 'Fernando S', proyecto: 'Experea', tipo: 'venta', fecha: '2026-01-20', status: 'validado', facturacion: 2500, margen: 1800 },
  { id: 'o2', titulo: 'Validación de modelo de negocio con restauradores', descripcion: 'Entrevistas con 5 dueños de restaurantes para validar pricing', owner: 'Manuel', proyecto: 'Payo Sushi', tipo: 'validacion', fecha: '2026-01-19', status: 'pendiente' },
  { id: 'o3', titulo: 'Primera venta de curso básico', descripcion: 'Venta de pack de 3 cursos a cliente particular', owner: 'Ángel', proyecto: 'Academia Financiera', tipo: 'venta', fecha: '2026-01-18', status: 'validado', facturacion: 450, margen: 350 },
  { id: 'o4', titulo: 'Cierre contrato consultoría IA para PYME', descripcion: 'Proyecto de automatización para empresa de logística', owner: 'Zarko', proyecto: 'TechNova Solutions', tipo: 'venta', fecha: '2026-01-17', status: 'validado', facturacion: 8500, margen: 6200 },
  { id: 'o5', titulo: 'Evento networking empresarial', descripcion: 'Organización de afterwork con 40 asistentes', owner: 'Carla', proyecto: 'EventPro', tipo: 'exploracion', fecha: '2026-01-16', status: 'validado' },
  { id: 'o6', titulo: 'Piloto en instituto público', descripcion: 'Test gratuito de la plataforma en instituto de Málaga', owner: 'Diego', proyecto: 'Experea', tipo: 'validacion', fecha: '2026-01-15', status: 'rechazado' },
  { id: 'o7', titulo: 'Acuerdo con proveedor de pescado', descripcion: 'Negociación de precios especiales con proveedor local', owner: 'Luis', proyecto: 'Payo Sushi', tipo: 'exploracion', fecha: '2026-01-14', status: 'validado' },
  { id: 'o8', titulo: 'Webinar gratuito de introducción a inversión', descripcion: 'Sesión online con 120 asistentes, captación de leads', owner: 'Miguel Ángel', proyecto: 'Academia Financiera', tipo: 'exploracion', fecha: '2026-01-13', status: 'validado' },
];

// ============================================
// TAREAS DEMO
// ============================================

export const DEMO_TASKS: DemoTask[] = [
  { id: 't1', titulo: 'Preparar propuesta para colegio Sagrada Familia', descripcion: 'Crear presentación personalizada y presupuesto', proyecto: 'Experea', assignee: 'Fernando S', status: 'in_progress', prioridad: 1, fecha_limite: '2026-01-22', hasPlaybook: true },
  { id: 't2', titulo: 'Diseñar menú degustación', descripcion: 'Crear menú especial para eventos corporativos', proyecto: 'Payo Sushi', assignee: 'Manuel', status: 'todo', prioridad: 2, fecha_limite: '2026-01-25', hasPlaybook: true },
  { id: 't3', titulo: 'Grabar módulo 3 del curso de inversión', descripcion: 'Producir y editar vídeos del tercer módulo', proyecto: 'Academia Financiera', assignee: 'Ángel', status: 'in_progress', prioridad: 1, fecha_limite: '2026-01-21', hasPlaybook: false },
  { id: 't4', titulo: 'Desarrollar dashboard de métricas', descripcion: 'Implementar visualización de KPIs para cliente', proyecto: 'TechNova Solutions', assignee: 'Zarko', status: 'done', prioridad: 1, fecha_limite: '2026-01-18', hasPlaybook: true },
  { id: 't5', titulo: 'Contactar sponsors para evento de febrero', descripcion: 'Llamar a 10 empresas potenciales patrocinadoras', proyecto: 'EventPro', assignee: 'Carla', status: 'todo', prioridad: 2, fecha_limite: '2026-01-28', hasPlaybook: true },
  { id: 't6', titulo: 'Seguimiento de leads del webinar', descripcion: 'Enviar email de seguimiento a los 120 asistentes', proyecto: 'Academia Financiera', assignee: 'Miguel Ángel', status: 'todo', prioridad: 1, fecha_limite: '2026-01-20', hasPlaybook: false },
];

// ============================================
// LEADS DEMO
// ============================================

export const DEMO_LEADS: DemoLead[] = [
  { id: 'l1', nombre: 'Colegio Sagrada Familia', empresa: 'Educación privada', status: 'hot', valor: 4500, proyecto: 'Experea', responsable: 'Fernando S', proxima_accion: 'Enviar propuesta personalizada' },
  { id: 'l2', nombre: 'Ayuntamiento de Málaga', empresa: 'Administración pública', status: 'propuesta', valor: 12000, proyecto: 'Experea', responsable: 'Diego', proxima_accion: 'Presentación a concejal' },
  { id: 'l3', nombre: 'Restaurante El Puerto', empresa: 'Hostelería', status: 'tibio', valor: 0, proyecto: 'Payo Sushi', responsable: 'Manuel', proxima_accion: 'Llamada de seguimiento' },
  { id: 'l4', nombre: 'Hotel Miramar', empresa: 'Turismo', status: 'hot', valor: 3500, proyecto: 'EventPro', responsable: 'Carla', proxima_accion: 'Reunión presencial' },
  { id: 'l5', nombre: 'Empresa Logística Sur SL', empresa: 'Logística', status: 'cerrado', valor: 8500, proyecto: 'TechNova Solutions', responsable: 'Zarko', proxima_accion: 'Kick-off del proyecto' },
  { id: 'l6', nombre: 'Inversor particular Juan García', empresa: 'Particular', status: 'tibio', valor: 950, proyecto: 'Academia Financiera', responsable: 'Ángel', proxima_accion: 'Demo del curso' },
  { id: 'l7', nombre: 'Startup BioTech Innova', empresa: 'Biotecnología', status: 'frio', valor: 5000, proyecto: 'TechNova Solutions', responsable: 'Zarko', proxima_accion: 'Email de introducción' },
  { id: 'l8', nombre: 'Instituto Público Miraflores', empresa: 'Educación pública', status: 'propuesta', valor: 2000, proyecto: 'Experea', responsable: 'Fernando S', proxima_accion: 'Seguimiento de propuesta' },
];

// ============================================
// VALIDACIONES PENDIENTES DEMO
// ============================================

export const DEMO_VALIDATIONS: DemoValidation[] = [
  { id: 'v1', type: 'obv', titulo: 'Reunión demo con Colegio San José', owner: 'Fernando S', proyecto: 'Experea', fecha: '2026-01-19', deadline: '2026-01-22', isLate: false },
  { id: 'v2', type: 'bp', titulo: 'Lean Startup - Eric Ries (3 puntos)', owner: 'Carla', fecha: '2026-01-18', deadline: '2026-01-21', isLate: false },
  { id: 'v3', type: 'obv', titulo: 'Validación con 5 restauradores', owner: 'Manuel', proyecto: 'Payo Sushi', fecha: '2026-01-17', deadline: '2026-01-20', isLate: true },
  { id: 'v4', type: 'lp', titulo: 'Curso Google Analytics Avanzado', owner: 'Diego', fecha: '2026-01-16', deadline: '2026-01-19', isLate: true },
  { id: 'v5', type: 'obv', titulo: 'Cierre venta consultoría IA', owner: 'Zarko', proyecto: 'TechNova Solutions', fecha: '2026-01-20', deadline: '2026-01-23', isLate: false },
];

// ============================================
// NOTIFICACIONES DEMO
// ============================================

export const DEMO_NOTIFICATIONS: DemoNotification[] = [
  { id: 'n1', tipo: 'obv_aprobada', titulo: 'OBV aprobada', mensaje: 'Tu OBV "Cierre contrato consultoría IA" ha sido validada por 2 compañeros.', leida: false, fecha: '2026-01-21T10:30:00' },
  { id: 'n2', tipo: 'tarea_asignada', titulo: 'Nueva tarea asignada', mensaje: 'Se te ha asignado la tarea "Preparar propuesta colegio Sagrada Familia" en el proyecto Experea.', leida: false, fecha: '2026-01-21T09:15:00' },
  { id: 'n3', tipo: 'obv_nueva', titulo: 'OBV pendiente de validación', mensaje: 'Fernando S ha subido un OBV que necesita tu validación. Tienes 3 días.', leida: true, fecha: '2026-01-20T16:45:00' },
  { id: 'n4', tipo: 'lead_ganado', titulo: '¡Lead cerrado!', mensaje: 'El lead "Empresa Logística Sur SL" ha sido marcado como ganado. ¡Felicidades!', leida: true, fecha: '2026-01-19T14:00:00' },
  { id: 'n5', tipo: 'obv_rechazada', titulo: 'OBV necesita corrección', mensaje: 'Tu OBV "Piloto instituto público" ha sido rechazada. Revisa los comentarios.', leida: false, fecha: '2026-01-18T11:20:00' },
];

// ============================================
// DATOS FINANCIEROS DEMO
// ============================================

export const DEMO_FINANCIAL = {
  facturacion_total: 196400,
  margen_total: 143650,
  cobrado: 142000,
  pendiente_cobro: 54400,
  objetivo_facturacion: 135000,
  objetivo_margen: 67500,
  por_proyecto: [
    { proyecto: 'TechNova Solutions', facturacion: 45000, margen: 32400, porcentaje: 23 },
    { proyecto: 'Experea', facturacion: 12500, margen: 9100, porcentaje: 6 },
    { proyecto: 'Payo Sushi', facturacion: 8200, margen: 4100, porcentaje: 4 },
    { proyecto: 'EventPro', facturacion: 7800, margen: 5400, porcentaje: 4 },
    { proyecto: 'Academia Financiera', facturacion: 3400, margen: 2800, porcentaje: 2 },
  ],
  cobros_pendientes: [
    { cliente: 'Colegio Sagrada Familia', monto: 4500, fecha_esperada: '2026-02-15', proyecto: 'Experea' },
    { cliente: 'Ayuntamiento Málaga', monto: 12000, fecha_esperada: '2026-03-01', proyecto: 'Experea' },
    { cliente: 'Hotel Miramar', monto: 3500, fecha_esperada: '2026-02-10', proyecto: 'EventPro' },
  ],
};

// ============================================
// KPIs DEMO
// ============================================

export const DEMO_KPIS = {
  obvs: { actual: 880, objetivo: 1350, porcentaje: 65 },
  lps: { actual: 115, objetivo: 162, porcentaje: 71 },
  bps: { actual: 421, objetivo: 594, porcentaje: 71 },
  cps: { actual: 398, objetivo: 360, porcentaje: 110 },
  facturacion: { actual: 196400, objetivo: 135000, porcentaje: 145 },
  margen: { actual: 143650, objetivo: 67500, porcentaje: 213 },
};

// ============================================
// RANKINGS DEMO
// ============================================

export const DEMO_RANKINGS = {
  obvs: [
    { posicion: 1, nombre: 'FERNANDO S', valor: 136, cambio: 0 },
    { posicion: 2, nombre: 'ZARKO', valor: 126, cambio: 1 },
    { posicion: 3, nombre: 'ÁNGEL', valor: 117, cambio: -1 },
  ],
  margen: [
    { posicion: 1, nombre: 'FERNANDO S', valor: 59560, cambio: 0 },
    { posicion: 2, nombre: 'ÁNGEL', valor: 30970, cambio: 0 },
    { posicion: 3, nombre: 'MIGUEL ÁNGEL', valor: 24170, cambio: 2 },
  ],
  lps: [
    { posicion: 1, nombre: 'ZARKO', valor: 14, cambio: 0 },
    { posicion: 2, nombre: 'FERNANDO S', valor: 14, cambio: 0 },
    { posicion: 3, nombre: 'ÁNGEL', valor: 13, cambio: 0 },
  ],
};

// ============================================
// ACTIVIDAD RECIENTE DEMO
// ============================================

export const DEMO_ACTIVITY = [
  { id: 'a1', user: 'Fernando S', action: 'subió OBV de venta', target: 'Experea', time: 'hace 2h', amount: '€2,500' },
  { id: 'a2', user: 'Zarko', action: 'completó tarea', target: 'Dashboard de métricas', time: 'hace 3h' },
  { id: 'a3', user: 'Carla', action: 'validó OBV de', target: 'Manuel', time: 'hace 4h' },
  { id: 'a4', user: 'Ángel', action: 'cerró lead', target: 'Academia Financiera', time: 'hace 5h', amount: '€450' },
  { id: 'a5', user: 'Manuel', action: 'añadió lead en', target: 'Payo Sushi', time: 'hace 6h' },
  { id: 'a6', user: 'Diego', action: 'completó LP', target: 'Google Analytics', time: 'hace 8h' },
];

// ============================================
// MASTERS DEMO
// ============================================

export const DEMO_MASTERS = [
  { id: 'm1', rol: 'sales', nombre: 'FERNANDO S', nivel: 2, titulo: 'Master of Sales', defenses: 3, mentees: 2 },
  { id: 'm2', rol: 'ai_tech', nombre: 'ZARKO', nivel: 1, titulo: 'Tech Innovator', defenses: 1, mentees: 1 },
  { id: 'm3', rol: 'finance', nombre: 'ÁNGEL', nivel: 1, titulo: 'Financial Wizard', defenses: 2, mentees: 1 },
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
      };
    case 'mi-espacio':
      return {
        member: DEMO_MEMBERS[0],
        tasks: DEMO_TASKS.filter(t => t.assignee === 'Zarko'),
        obvs: DEMO_OBVS.filter(o => o.owner === 'Zarko'),
        validations: DEMO_VALIDATIONS.slice(0, 2),
      };
    case 'obvs':
      return {
        obvs: DEMO_OBVS,
        validations: DEMO_VALIDATIONS.filter(v => v.type === 'obv'),
      };
    case 'kpis':
      return {
        kpis: DEMO_KPIS,
        validations: DEMO_VALIDATIONS.filter(v => v.type !== 'obv'),
      };
    case 'crm':
      return {
        leads: DEMO_LEADS,
        projects: DEMO_PROJECTS,
      };
    case 'financiero':
      return DEMO_FINANCIAL;
    case 'analytics':
      return {
        members: DEMO_MEMBERS,
        projects: DEMO_PROJECTS,
        kpis: DEMO_KPIS,
      };
    case 'rankings':
      return {
        rankings: DEMO_RANKINGS,
        members: DEMO_MEMBERS,
      };
    case 'masters':
      return {
        masters: DEMO_MASTERS,
        members: DEMO_MEMBERS,
      };
    case 'rotacion':
      return {
        members: DEMO_MEMBERS,
        projects: DEMO_PROJECTS,
      };
    case 'proyectos':
      return {
        projects: DEMO_PROJECTS,
        members: DEMO_MEMBERS,
      };
    case 'notificaciones':
      return {
        notifications: DEMO_NOTIFICATIONS,
      };
    case 'mi-desarrollo':
      return {
        member: DEMO_MEMBERS[0],
        masters: DEMO_MASTERS,
      };
    case 'settings':
      return {
        member: DEMO_MEMBERS[0],
      };
    case 'roles-meeting':
      return {
        members: DEMO_MEMBERS,
        projects: DEMO_PROJECTS,
      };
    default:
      return null;
  }
}
