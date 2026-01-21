import { 
  Target, Wallet, Brain, Megaphone, Cog, Compass, 
  LucideIcon 
} from 'lucide-react';

export interface Member {
  id: string;
  nombre: string;
  email: string;
  color: string;
  lps: number;
  bps: number;
  obvs: number;
  cps: number;
  exploracion: number;
  validacion: number;
  venta: number;
  facturacion: number;
  margen: number;
  avatar: string | null;
  especialization?: string;
}

export interface Project {
  id: string;
  nombre: string;
  icon: string;
  color: string;
  fase: string;
  tipo: string;
  onboarding_completed: boolean;
  members: string[];
}

export interface ProjectRole {
  project_id: string;
  member_id: string;
  role: string;
}

export interface RoleConfig {
  icon: LucideIcon;
  label: string;
  color: string;
  desc: string;
}

export interface Validation {
  id: string;
  type: 'obv' | 'bp' | 'lp';
  titulo: string;
  owner: string;
  project?: string;
  fecha: string;
  tipo?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  amount?: string;
}

export interface Lead {
  id: string;
  nombre: string;
  empresa: string;
  status: string;
  valor: number;
  proyecto: string;
  responsable: string;
}

export const MEMBERS: Member[] = [
  { id: '1', nombre: 'ZARKO', email: 'zarko@nova.com', color: '#8B5CF6', lps: 14, bps: 57, obvs: 126, cps: 49, exploracion: 18, validacion: 12, venta: 10, facturacion: 1065, margen: 509, avatar: null, especialization: 'ai_tech' },
  { id: '2', nombre: 'FERNANDO S', email: 'fernandoS@nova.com', color: '#10B981', lps: 14, bps: 52, obvs: 136, cps: 43, exploracion: 23, validacion: 14, venta: 4, facturacion: 6516, margen: 5956, avatar: null },
  { id: '3', nombre: 'ÁNGEL', email: 'angel@nova.com', color: '#F59E0B', lps: 13, bps: 54, obvs: 117, cps: 44, exploracion: 18, validacion: 5, venta: 18, facturacion: 3934, margen: 3097, avatar: null },
  { id: '4', nombre: 'MIGUEL ÁNGEL', email: 'miguelangel@nova.com', color: '#3B82F6', lps: 12, bps: 52, obvs: 103, cps: 41, exploracion: 25, validacion: 3, venta: 13, facturacion: 4014, margen: 2417, avatar: null },
  { id: '5', nombre: 'MANUEL', email: 'manuel@nova.com', color: '#EC4899', lps: 13, bps: 50, obvs: 100, cps: 45, exploracion: 19, validacion: 2, venta: 20, facturacion: 1074, margen: 1035, avatar: null },
  { id: '6', nombre: 'FERNANDO G', email: 'fernandoG@nova.com', color: '#EF4444', lps: 13, bps: 52, obvs: 109, cps: 41, exploracion: 15, validacion: 9, venta: 17, facturacion: 310, margen: 144, avatar: null },
  { id: '7', nombre: 'CARLA', email: 'carla@nova.com', color: '#F472B6', lps: 12, bps: 49, obvs: 87, cps: 49, exploracion: 24, validacion: 7, venta: 10, facturacion: 387, margen: 284, avatar: null },
  { id: '8', nombre: 'DIEGO', email: 'diego@nova.com', color: '#84CC16', lps: 12, bps: 54, obvs: 102, cps: 42, exploracion: 10, validacion: 12, venta: 19, facturacion: 1208, margen: 195, avatar: null },
  { id: '9', nombre: 'LUIS', email: 'luis@nova.com', color: '#06B6D4', lps: 12, bps: 51, obvs: 86, cps: 44, exploracion: 15, validacion: 14, venta: 11, facturacion: 1132, margen: 703, avatar: null },
];

export const PROJECTS: Project[] = [
  { id: 'p1', nombre: 'Payo Sushi', icon: '🍣', color: '#EF4444', fase: 'idea', tipo: 'validacion', onboarding_completed: true, members: ['5', '1', '8'] },
  { id: 'p2', nombre: 'Experea', icon: '🎓', color: '#22C55E', fase: 'crecimiento', tipo: 'operacion', onboarding_completed: false, members: ['2', '3', '6'] },
  { id: 'p3', nombre: 'Apadrina tu Olivo', icon: '🫒', color: '#84CC16', fase: 'idea', tipo: 'validacion', onboarding_completed: false, members: ['2', '4', '7'] },
  { id: 'p4', nombre: 'Experiencia Selecta', icon: '💎', color: '#A855F7', fase: 'idea', tipo: 'validacion', onboarding_completed: false, members: ['9', '3', '1'] },
  { id: 'p5', nombre: 'Web y SaaS', icon: '💻', color: '#6366F1', fase: 'idea', tipo: 'validacion', onboarding_completed: false, members: ['1', '6', '7'] },
  { id: 'p6', nombre: 'Souvenirs Online', icon: '🎁', color: '#F59E0B', fase: 'idea', tipo: 'validacion', onboarding_completed: false, members: ['8', '3', '5'] },
  { id: 'p7', nombre: 'Academia Financiera', icon: '📊', color: '#06B6D4', fase: 'idea', tipo: 'validacion', onboarding_completed: false, members: ['6', '9', '4'] },
];

export const PROJECT_ROLES: ProjectRole[] = [
  { project_id: 'p1', member_id: '5', role: 'operations' },
  { project_id: 'p1', member_id: '1', role: 'ai_tech' },
  { project_id: 'p1', member_id: '8', role: 'marketing' },
  { project_id: 'p2', member_id: '2', role: 'sales' },
  { project_id: 'p2', member_id: '3', role: 'marketing' },
  { project_id: 'p2', member_id: '6', role: 'operations' },
  { project_id: 'p3', member_id: '2', role: 'operations' },
  { project_id: 'p3', member_id: '4', role: 'strategy' },
  { project_id: 'p3', member_id: '7', role: 'sales' },
  { project_id: 'p4', member_id: '9', role: 'finance' },
  { project_id: 'p4', member_id: '3', role: 'strategy' },
  { project_id: 'p4', member_id: '1', role: 'ai_tech' },
  { project_id: 'p5', member_id: '1', role: 'ai_tech' },
  { project_id: 'p5', member_id: '6', role: 'strategy' },
  { project_id: 'p5', member_id: '7', role: 'marketing' },
  { project_id: 'p6', member_id: '8', role: 'operations' },
  { project_id: 'p6', member_id: '3', role: 'finance' },
  { project_id: 'p6', member_id: '5', role: 'sales' },
  { project_id: 'p7', member_id: '6', role: 'finance' },
  { project_id: 'p7', member_id: '9', role: 'sales' },
  { project_id: 'p7', member_id: '4', role: 'marketing' },
];

export const OBJECTIVES = { 
  obvs: 150, 
  lps: 18, 
  bps: 66, 
  cps: 40, 
  facturacion: 15000, 
  margen: 7500 
};

export const ROLE_CONFIG: Record<string, RoleConfig> = {
  sales: { icon: Target, label: 'Sales', color: '#EF4444', desc: 'Prospección, cierre, relación cliente' },
  finance: { icon: Wallet, label: 'Finance', color: '#F59E0B', desc: 'Presupuestos, pricing, márgenes' },
  ai_tech: { icon: Brain, label: 'AI/Tech', color: '#6366F1', desc: 'Tecnología, automatización, herramientas' },
  marketing: { icon: Megaphone, label: 'Marketing', color: '#EC4899', desc: 'Redes, contenido, marca' },
  operations: { icon: Cog, label: 'Operations', color: '#22C55E', desc: 'Ejecución, procesos, entregas' },
  strategy: { icon: Compass, label: 'Strategy', color: '#A855F7', desc: 'Visión, roadmap, decisiones' },
};

export const PENDING_VALIDATIONS: Validation[] = [
  { id: 'v1', type: 'obv', titulo: 'Reunión con proveedor de arroz', owner: 'Manuel', project: 'Payo Sushi', fecha: '2025-01-20', tipo: 'validacion' },
  { id: 'v2', type: 'bp', titulo: 'Lean Startup - Eric Ries', owner: 'Carla', fecha: '2025-01-19' },
  { id: 'v3', type: 'obv', titulo: 'Demo producto a cliente', owner: 'Fernando S', project: 'Experea', fecha: '2025-01-20', tipo: 'validacion' },
  { id: 'v4', type: 'lp', titulo: 'Metodología OKRs', owner: 'Diego', fecha: '2025-01-18' },
];

export const RECENT_ACTIVITY: Activity[] = [
  { id: 'a1', user: 'Fernando S', action: 'subió OBV de venta', target: 'Experea', time: 'hace 2h', amount: '€1,200' },
  { id: 'a2', user: 'Ángel', action: 'completó tarea', target: 'Diseñar landing page', time: 'hace 3h' },
  { id: 'a3', user: 'Zarko', action: 'validó BP de', target: 'Carla', time: 'hace 4h' },
  { id: 'a4', user: 'Manuel', action: 'añadió lead en', target: 'Payo Sushi', time: 'hace 5h' },
  { id: 'a5', user: 'Casti', action: 'completó onboarding de', target: 'Academia Financiera', time: 'hace 6h' },
];

export const SAMPLE_LEADS: Lead[] = [
  { id: 'l1', nombre: 'Colegio San José', empresa: 'Educación', status: 'hot', valor: 2500, proyecto: 'Experea', responsable: 'Fernando S' },
  { id: 'l2', nombre: 'Ayto. Málaga', empresa: 'Gobierno', status: 'propuesta', valor: 5000, proyecto: 'Experea', responsable: 'Ángel' },
  { id: 'l3', nombre: 'Food Truck Málaga', empresa: 'Proveedor', status: 'tibio', valor: 0, proyecto: 'Payo Sushi', responsable: 'Manuel' },
  { id: 'l4', nombre: 'Hotel Miramar', empresa: 'Hostelería', status: 'frio', valor: 1500, proyecto: 'Experiencia Selecta', responsable: 'Diego' },
];
