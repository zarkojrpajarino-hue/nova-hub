/**
 * BUSINESS IDEAS GENERATOR
 *
 * Genera 3 ideas de negocio personalizadas para el path generativo.
 *
 * O5.3b: generación de ideas con contexto del usuario (industria, skills,
 *         inversión, tiempo, ubicación, objetivo 90d).
 * O5.7:  doble filtro
 *   - Nivel 1 (pre-display, hard): ideas cuya inversión mínima supera la
 *     capacidad declarada del usuario → no se muestran.
 *   - Nivel 2 (at-selection, warning): avisos no bloqueantes sobre riesgos
 *     contextuales (alta dedicación, skills técnicos, mercado saturado).
 *
 * Implementación actual: mock determinista basado en plantillas por industria.
 * En producción: llamada a LLM con el contexto del usuario.
 */

// ── Public types ────────────────────────────────────────────────────────────

export interface BusinessIdeaEconomicProfile {
  inversion_inicial_estimada: string;
  mrr_potencial_6m: string;
  tiempo_primer_ingreso: string;
}

export interface BusinessIdeaFilter {
  /** Hard filter: false → idea no se muestra al usuario */
  nivel_1_pass: boolean;
  /** Avisos contextuales mostrados en la tarjeta (no bloqueantes) */
  nivel_2_flags: string[];
  /** 0–100. Usado para ordenar tarjetas y mostrar badge "Recomendada" */
  viability_score: number;
}

export interface BusinessIdea {
  id: string;
  nombre: string;
  descripcion_corta: string;
  cliente_objetivo: string;
  monetizacion: string;
  perfil_economico: BusinessIdeaEconomicProfile;
  riesgos_principales: string[];
  experimento_7_dias: string;
  filter: BusinessIdeaFilter;
}

export interface GenerateBusinessIdeasInput {
  project_id: string;
  industry: string;
  skills?: string;
  /** '0-5k' | '5k-25k' | '25k-100k' | '100k+' */
  investment_capacity?: string;
  /** 'part-time' | 'full-time' | 'side-project' */
  time_commitment?: string;
  location?: string;
  market_scope?: string;
  team_size?: number;
  goal_90d?: string;
}

// ── Internal template type ───────────────────────────────────────────────────

interface IdeaTemplate {
  nombre: string;
  descripcion_corta: string;
  cliente_objetivo: string;
  monetizacion: string;
  perfil_economico: BusinessIdeaEconomicProfile;
  riesgos_principales: string[];
  experimento_7_dias: string;
  _meta: {
    /** Inversión mínima requerida: 0=bootstrap, 1=5k-25k, 2=25k-100k, 3=100k+ */
    min_investment_tier: 0 | 1 | 2 | 3;
    /** Alta carga de trabajo sostenida (incompatible con side-project) */
    is_time_intensive: boolean;
    /** Requiere programar, datos o IA */
    requires_tech_skills: boolean;
    market_competition: 'low' | 'medium' | 'high';
    /** Viabilidad base antes de ajustes contextuales */
    base_viability: number;
  };
}

// ── Industry templates ───────────────────────────────────────────────────────

const TEMPLATES: Record<string, IdeaTemplate[]> = {
  saas: [
    {
      nombre: 'Micro-agencia de implementación SaaS',
      descripcion_corta:
        'Ayudas a pymes a configurar, integrar y sacar partido a sus herramientas SaaS (CRM, gestión de proyectos, automatización). Ofreces implementación rápida, formación y retainer de soporte.',
      cliente_objetivo: 'Pymes de 5–50 empleados sin equipo técnico interno',
      monetizacion: 'Proyecto fijo (€500–€3k) + retainer mensual de soporte (€200–€800/mes)',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€500',
        mrr_potencial_6m: '€2k–€6k',
        tiempo_primer_ingreso: '1–2 semanas',
      },
      riesgos_principales: [
        'Dependencia de plataformas de terceros',
        'Difícil escalar sin contratar',
        'Comoditización del servicio',
      ],
      experimento_7_dias:
        'Identifica 5 pymes locales con herramientas SaaS desconectadas. Ofrece una sesión de diagnóstico gratuita de 30 minutos y recoge su mayor dolor operativo.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'medium', base_viability: 76 },
    },
    {
      nombre: 'Micro-SaaS de automatización de nicho',
      descripcion_corta:
        'Herramienta SaaS muy específica que elimina un proceso manual repetitivo en un sector concreto: generación de informes, facturación especializada o integración entre dos herramientas populares.',
      cliente_objetivo: 'Equipos de 2–15 personas en un sector concreto (legal, marketing, contabilidad)',
      monetizacion: 'Suscripción mensual €29–€79/mes por empresa',
      perfil_economico: {
        inversion_inicial_estimada: '€1k–€5k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '4–8 semanas',
      },
      riesgos_principales: [
        'Product-market fit incierto hasta lanzar',
        'Ciclo de venta B2B más lento de lo esperado',
        'Grandes plataformas pueden replicar la función',
      ],
      experimento_7_dias:
        'Crea una landing page con formulario de lista de espera y compártela en 3 comunidades online de tu sector objetivo. Mide cuántos emails consigues en 7 días.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: true, market_competition: 'medium', base_viability: 71 },
    },
    {
      nombre: 'Agencia de growth para startups SaaS',
      descripcion_corta:
        'Agencia especializada en adquisición y crecimiento para SaaS B2B en fase early. Ofreces estrategia de contenido, outbound personalizado y experimentos de conversión.',
      cliente_objetivo: 'Startups SaaS con €5k–€50k MRR buscando acelerar crecimiento',
      monetizacion: 'Retainer mensual €2k–€6k/mes + bonus sobre incremento de revenue',
      perfil_economico: {
        inversion_inicial_estimada: '€500–€2k',
        mrr_potencial_6m: '€4k–€12k',
        tiempo_primer_ingreso: '2–3 semanas',
      },
      riesgos_principales: [
        'Debes demostrar resultados rápido para retener clientes',
        'Margen se comprime al contratar',
        'Mercado muy competitivo',
      ],
      experimento_7_dias:
        'Busca 3 SaaS B2B con menos de €20k MRR en Product Hunt o LinkedIn. Envía un análisis de 1 página con sus oportunidades de crecimiento y propón una llamada exploratoria.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'high', base_viability: 73 },
    },
    {
      nombre: 'Plataforma SaaS B2B con IA',
      descripcion_corta:
        'Plataforma que automatiza flujos de trabajo complejos en un sector usando IA. Mayor barrera de entrada y mayor potencial de ticket que el micro-SaaS.',
      cliente_objetivo: 'Medianas empresas (50–500 empleados) con procesos manuales costosos',
      monetizacion: 'Licencia mensual €300–€2k/mes por empresa + proyecto de implementación',
      perfil_economico: {
        inversion_inicial_estimada: '€15k–€50k',
        mrr_potencial_6m: '€3k–€15k',
        tiempo_primer_ingreso: '3–6 meses',
      },
      riesgos_principales: [
        'Alto capital requerido antes de primer ingreso',
        'Ciclo de venta enterprise de 3–6 meses',
        'Requiere equipo técnico senior',
      ],
      experimento_7_dias:
        'Entrevista a 5 responsables del área objetivo en empresas medianas. Pregunta cuánto tiempo dedican al proceso y cuánto les cuesta en horas/mes. Cuantifica el problema antes de construir.',
      _meta: { min_investment_tier: 2, is_time_intensive: true, requires_tech_skills: true, market_competition: 'medium', base_viability: 67 },
    },
  ],

  ecommerce: [
    {
      nombre: 'Tienda de nicho con marca propia',
      descripcion_corta:
        'Marca D2C en un nicho apasionado (mascotas, deporte específico, coleccionismo). Empiezas con dropshipping o pequeño stock, construyes comunidad y marca alrededor del producto.',
      cliente_objetivo: 'Consumidores apasionados de un nicho específico (25–45 años)',
      monetizacion: 'Venta directa online con margen 40–60% + upsells',
      perfil_economico: {
        inversion_inicial_estimada: '€500–€3k',
        mrr_potencial_6m: '€1k–€5k',
        tiempo_primer_ingreso: '2–4 semanas',
      },
      riesgos_principales: [
        'Alto costo de adquisición en publicidad pagada',
        'Logística y devoluciones consumen margen',
        'Competencia de Amazon y grandes retailers',
      ],
      experimento_7_dias:
        'Crea una página en Instagram o TikTok dedicada al nicho. Publica 5 posts sin producto todavía y mide el engagement. Si llegas a 100 seguidores en 7 días, hay audiencia real.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'high', base_viability: 68 },
    },
    {
      nombre: 'Plataforma de productos artesanales locales',
      descripcion_corta:
        'Marketplace local o regional que conecta artesanos y productores locales con compradores que valoran lo auténtico. Comisión por venta, tú aportas la visibilidad y logística.',
      cliente_objetivo: 'Artesanos y productores locales + consumidores que buscan productos únicos',
      monetizacion: 'Comisión del 15–25% por venta + plan de suscripción para vendedores (€30–€80/mes)',
      perfil_economico: {
        inversion_inicial_estimada: '€3k–€10k',
        mrr_potencial_6m: '€1k–€3k',
        tiempo_primer_ingreso: '4–8 semanas',
      },
      riesgos_principales: [
        'Problema del huevo y la gallina: necesitas vendedores y compradores a la vez',
        'Logística compleja con múltiples vendedores',
      ],
      experimento_7_dias:
        'Visita un mercado local o feria artesanal. Habla con 10 productores y pregunta si pagarían €30/mes por una plataforma online para vender sus productos. Recoge contactos.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: false, market_competition: 'low', base_viability: 70 },
    },
    {
      nombre: 'Servicio de suscripción de productos curados',
      descripcion_corta:
        'Box de suscripción mensual con productos curados en un nicho: café de especialidad, snacks saludables, productos de belleza natural. Recurrencia alta y margen controlable.',
      cliente_objetivo: 'Adultos urbanos 28–45 años con renta media-alta que valoran calidad y descubrimiento',
      monetizacion: 'Suscripción mensual €25–€60/mes por caja',
      perfil_economico: {
        inversion_inicial_estimada: '€2k–€8k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '4–6 semanas',
      },
      riesgos_principales: [
        'Alta tasa de cancelación si el valor percibido baja',
        'Gestión de inventario y stock mensual',
        'Logística de envío mensual consume margen',
      ],
      experimento_7_dias:
        'Crea una landing page de "lista de espera" para tu box de suscripción. Invierte €50 en anuncios segmentados y mide el costo por email recogido. Objetivo: menos de €3 por lead.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: false, market_competition: 'medium', base_viability: 69 },
    },
    {
      nombre: 'Plataforma de comercio B2B sectorial',
      descripcion_corta:
        'Marketplace B2B que digitaliza la cadena de suministro en un sector industrial específico. Conectas proveedores con compradores empresariales que hoy operan por teléfono o Excel.',
      cliente_objetivo: 'Empresas del sector que compran/venden materiales o servicios entre sí',
      monetizacion: 'Comisión por transacción (2–5%) + suscripción para acceso a catálogo premium',
      perfil_economico: {
        inversion_inicial_estimada: '€20k–€60k',
        mrr_potencial_6m: '€5k–€20k',
        tiempo_primer_ingreso: '3–5 meses',
      },
      riesgos_principales: [
        'Ciclo de ventas B2B largo',
        'Resistencia al cambio en sectores tradicionales',
        'Alto costo de desarrollo inicial',
      ],
      experimento_7_dias:
        'Identifica 3 empresas del sector que compren a 10+ proveedores regularmente. Entrevístalas: ¿cuánto tiempo pierden en pedidos manuales? ¿Cuánto pagarían por automatizarlo?',
      _meta: { min_investment_tier: 2, is_time_intensive: true, requires_tech_skills: true, market_competition: 'low', base_viability: 72 },
    },
  ],

  health: [
    {
      nombre: 'Coaching de bienestar y salud online',
      descripcion_corta:
        'Programa de coaching 1:1 o en grupo para ayudar a personas a mejorar hábitos de salud, nutrición o gestión del estrés. Combinas sesiones en vivo con recursos digitales.',
      cliente_objetivo: 'Adultos de 30–50 años con estrés laboral o quieren mejorar hábitos',
      monetizacion: 'Sesión individual €60–€150 + programa grupal de 8 semanas €300–€600',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€500',
        mrr_potencial_6m: '€2k–€5k',
        tiempo_primer_ingreso: '1–2 semanas',
      },
      riesgos_principales: [
        'Escalabilidad limitada con modelo 1:1',
        'Necesitas credenciales o reputación para generar confianza',
        'Alta competencia de coaches en redes sociales',
      ],
      experimento_7_dias:
        'Ofrece 5 sesiones de diagnóstico gratuitas de 30 minutos en tu red de contactos. Recoge el mayor problema de salud/hábito de cada uno y valida si pagarían por ayuda.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'high', base_viability: 72 },
    },
    {
      nombre: 'App de seguimiento de salud personalizada',
      descripcion_corta:
        'Aplicación móvil o web que ayuda a los usuarios a seguir métricas de salud específicas: glucosa, sueño, ciclo menstrual, recuperación deportiva. Freemium con funciones premium.',
      cliente_objetivo: 'Personas con condición crónica o deportistas que quieren datos accionables',
      monetizacion: 'Freemium + suscripción premium €7–€15/mes',
      perfil_economico: {
        inversion_inicial_estimada: '€5k–€20k',
        mrr_potencial_6m: '€1k–€5k',
        tiempo_primer_ingreso: '8–12 semanas',
      },
      riesgos_principales: [
        'Retención de usuarios difícil sin enganche diario',
        'Mercado de apps de salud muy saturado',
        'Requisitos regulatorios en datos de salud (GDPR)',
      ],
      experimento_7_dias:
        'Crea un grupo de WhatsApp o comunidad donde compartes tips de seguimiento de la métrica objetivo. Invita a 20 personas y observa quién hace las más preguntas y qué datos les falta tener.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: true, market_competition: 'high', base_viability: 63 },
    },
    {
      nombre: 'Plataforma de gestión para clínicas',
      descripcion_corta:
        'Software de gestión para clínicas pequeñas y medianas (fisioterapia, psicología, nutrición). Agenda, historial de pacientes, facturación y recordatorios automáticos en una sola herramienta.',
      cliente_objetivo: 'Clínicas independientes de 1–10 profesionales que usan Excel o papel',
      monetizacion: 'Suscripción mensual €49–€149/mes por clínica',
      perfil_economico: {
        inversion_inicial_estimada: '€8k–€25k',
        mrr_potencial_6m: '€2k–€8k',
        tiempo_primer_ingreso: '6–10 semanas',
      },
      riesgos_principales: [
        'Competencia de soluciones establecidas (Doctolink, etc.)',
        'Sector conservador: migración desde papel/Excel es lenta',
        'Requiere cumplimiento RGPD estricto',
      ],
      experimento_7_dias:
        'Visita o llama a 5 clínicas pequeñas. Pregunta cómo gestionan las citas y el historial. Si más de 3 de 5 usan papel o Excel, hay mercado real. Recoge su mayor queja operativa.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: true, market_competition: 'medium', base_viability: 74 },
    },
    {
      nombre: 'Red de telemedicina especializada',
      descripcion_corta:
        'Plataforma de teleconsulta para una especialidad médica con baja cobertura local (dermatología, psiquiatría, nutrición clínica). Conectas especialistas con pacientes en zonas mal servidas.',
      cliente_objetivo: 'Pacientes en zonas rurales o sin acceso rápido a especialista',
      monetizacion: 'Comisión por consulta (20–30%) + suscripción para profesionales',
      perfil_economico: {
        inversion_inicial_estimada: '€15k–€40k',
        mrr_potencial_6m: '€3k–€12k',
        tiempo_primer_ingreso: '3–5 meses',
      },
      riesgos_principales: [
        'Regulación sanitaria compleja según país',
        'Confianza del paciente más difícil online',
        'Alta inversión antes de masa crítica',
      ],
      experimento_7_dias:
        'Identifica la especialidad con mayor lista de espera en tu zona (fuente: datos públicos o encuesta). Habla con 3 especialistas sobre si estarían dispuestos a hacer teleconsultas y a qué precio.',
      _meta: { min_investment_tier: 2, is_time_intensive: true, requires_tech_skills: true, market_competition: 'low', base_viability: 69 },
    },
  ],

  education: [
    {
      nombre: 'Curso online de habilidad profesional',
      descripcion_corta:
        'Curso en vídeo + comunidad sobre una habilidad profesional demandada en tu área de expertise: Excel avanzado, copywriting, diseño UX, ventas B2B. Monetizas tu conocimiento de forma escalable.',
      cliente_objetivo: 'Profesionales de 25–40 años que quieren progresar o cambiar de carrera',
      monetizacion: 'Acceso de pago único €97–€297 + upsell de mentoría grupal',
      perfil_economico: {
        inversion_inicial_estimada: '€200–€1k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '3–6 semanas',
      },
      riesgos_principales: [
        'Alta competencia en plataformas como Udemy',
        'Necesitas audiencia previa para lanzar con tracción',
        'El contenido puede quedar obsoleto',
      ],
      experimento_7_dias:
        'Publica 5 posts en LinkedIn o X sobre el tema del curso. Mide impresiones y comentarios. Si generas 10+ comentarios de personas que preguntan cómo aprender más, hay demanda.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'high', base_viability: 70 },
    },
    {
      nombre: 'Academia online con membresía mensual',
      descripcion_corta:
        'Plataforma de membresía con acceso a biblioteca de cursos, sesiones en vivo mensuales y comunidad privada en un nicho específico. Ingresos recurrentes estables.',
      cliente_objetivo: 'Profesionales o emprendedores de un nicho que buscan aprendizaje continuo',
      monetizacion: 'Membresía mensual €19–€49/mes',
      perfil_economico: {
        inversion_inicial_estimada: '€300–€2k',
        mrr_potencial_6m: '€2k–€6k',
        tiempo_primer_ingreso: '4–8 semanas',
      },
      riesgos_principales: [
        'Alta producción continua de contenido para retener',
        'Churn si los miembros sienten que el contenido se repite',
        'Necesitas comunidad inicial activa',
      ],
      experimento_7_dias:
        'Crea un grupo gratuito en WhatsApp o Discord sobre el tema. Invita a 30 personas. Observa si participan activamente en 7 días. Si sí, hay comunidad que paga.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: false, market_competition: 'medium', base_viability: 73 },
    },
    {
      nombre: 'Plataforma de tutorías 1:1 en línea',
      descripcion_corta:
        'Marketplace que conecta tutores especializados con estudiantes o adultos en formación. Foco en una materia o idioma muy específico con calidad garantizada.',
      cliente_objetivo: 'Estudiantes universitarios, profesionales en reconversión o padres de alumnos',
      monetizacion: 'Comisión del 20–25% por sesión + plan de suscripción para tutores',
      perfil_economico: {
        inversion_inicial_estimada: '€3k–€12k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '4–6 semanas',
      },
      riesgos_principales: [
        'Problema del huevo y la gallina',
        'Competencia fuerte (Superprof, Classgap)',
        'Difícil controlar la calidad de los tutores',
      ],
      experimento_7_dias:
        'Recluta manualmente a 5 tutores de calidad en tu materia objetivo. Publica el servicio en grupos de Facebook, Reddit o foros de estudiantes y consigue la primera sesión pagada.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: false, market_competition: 'high', base_viability: 65 },
    },
    {
      nombre: 'Formación B2B para empresas',
      descripcion_corta:
        'Programas de formación online o mixtos para empleados de empresas en habilidades de alta demanda: liderazgo, datos, IA, idiomas, ventas. Contratos corporativos de mayor valor.',
      cliente_objetivo: 'Directores de RRHH y formación de empresas de 50–500 empleados',
      monetizacion: 'Contrato formativo anual €5k–€30k + precio por plaza (€200–€600/persona)',
      perfil_economico: {
        inversion_inicial_estimada: '€2k–€10k',
        mrr_potencial_6m: '€5k–€20k',
        tiempo_primer_ingreso: '4–8 semanas',
      },
      riesgos_principales: [
        'Ciclo de venta B2B largo (2–4 meses)',
        'Compras condicionadas al presupuesto anual de formación',
        'Alta competencia de consultoras de formación establecidas',
      ],
      experimento_7_dias:
        'Identifica 5 empresas de tu sector con planes de formación. Contacta al responsable de RRHH con una propuesta concreta de taller de 4 horas sobre la habilidad que enseñas.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'medium', base_viability: 77 },
    },
  ],

  fintech: [
    {
      nombre: 'Asesoría financiera personal online',
      descripcion_corta:
        'Servicio de asesoría financiera personalizada para personas que quieren ordenar sus finanzas, invertir por primera vez o planificar su jubilación. Modelo híbrido: diagnóstico online + sesiones en vivo.',
      cliente_objetivo: 'Profesionales de 30–50 años con ahorros sin optimizar',
      monetizacion: 'Sesión de diagnóstico €100–€200 + plan anual de seguimiento €500–€1.200',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€500',
        mrr_potencial_6m: '€2k–€5k',
        tiempo_primer_ingreso: '1–2 semanas',
      },
      riesgos_principales: [
        'Requiere habilitación regulatoria en muchos países (MIFID)',
        'Confianza difícil de construir sin historial',
        'Escalabilidad limitada con modelo de consultoría',
      ],
      experimento_7_dias:
        'Ofrece un diagnóstico financiero gratuito de 45 minutos a 5 personas de tu red. Analiza su situación real y presenta 3 acciones concretas. Pregunta si pagarían por un plan completo.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'medium', base_viability: 71 },
    },
    {
      nombre: 'App de ahorro e inversión para millenials',
      descripcion_corta:
        'Aplicación que automatiza el ahorro y la inversión en fondos indexados de bajo costo. Interfaz simple, educación financiera integrada y objetivos visuales.',
      cliente_objetivo: 'Adultos de 25–40 años con poco tiempo para gestionar su dinero',
      monetizacion: 'Comisión de gestión 0,5–1% anual sobre activos + suscripción premium €5–€10/mes',
      perfil_economico: {
        inversion_inicial_estimada: '€20k–€60k',
        mrr_potencial_6m: '€1k–€5k',
        tiempo_primer_ingreso: '6–12 meses',
      },
      riesgos_principales: [
        'Regulación financiera muy estricta (licencia de gestión)',
        'Alto costo de desarrollo y compliance antes de lanzar',
        'Competencia de neobancos y plataformas establecidas',
      ],
      experimento_7_dias:
        'Crea una encuesta de 5 preguntas sobre hábitos de ahorro. Compártela en 3 grupos de finanzas personales y recoge 50 respuestas. Identifica el mayor obstáculo para invertir.',
      _meta: { min_investment_tier: 2, is_time_intensive: true, requires_tech_skills: true, market_competition: 'high', base_viability: 58 },
    },
    {
      nombre: 'Herramienta de facturación y tesorería para autónomos',
      descripcion_corta:
        'Software simple de facturación, control de gastos y previsión de tesorería para autónomos y micropymes. Integrado con los bancos locales más usados.',
      cliente_objetivo: 'Autónomos y pymes de 1–5 personas que odian la administración financiera',
      monetizacion: 'Suscripción mensual €9–€29/mes',
      perfil_economico: {
        inversion_inicial_estimada: '€3k–€12k',
        mrr_potencial_6m: '€1k–€5k',
        tiempo_primer_ingreso: '6–10 semanas',
      },
      riesgos_principales: [
        'Mercado con competidores fuertes (Holded, Conta, Anfix)',
        'Churn alto si el usuario no crea el hábito',
        'Integraciones bancarias costosas de mantener',
      ],
      experimento_7_dias:
        'Entrevista a 5 autónomos de tu sector sobre cómo gestionan la facturación y el control de gastos. Pregunta cuánto tiempo pierden y qué herramienta usan. Identifica el gap.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: true, market_competition: 'high', base_viability: 67 },
    },
    {
      nombre: 'Plataforma de financiación alternativa para pymes',
      descripcion_corta:
        'Plataforma de crowdlending o confirming que conecta pymes que necesitan liquidez con inversores particulares o institucionales. Alternativa ágil a la banca tradicional.',
      cliente_objetivo: 'Pymes con buena facturación pero necesidades de liquidez a corto plazo',
      monetizacion: 'Comisión por operación (1–3% del capital financiado)',
      perfil_economico: {
        inversion_inicial_estimada: '€50k–€200k',
        mrr_potencial_6m: '€5k–€30k',
        tiempo_primer_ingreso: '6–12 meses',
      },
      riesgos_principales: [
        'Regulación de mercado de capitales muy exigente',
        'Riesgo de impago si la selección de pymes falla',
        'Necesita masa crítica de inversores y prestatarios',
      ],
      experimento_7_dias:
        'Habla con 5 dueños de pymes sobre sus últimas necesidades de liquidez. Pregunta cómo las resolvieron, qué tardó el banco y cuánto pagaron. Cuantifica el dolor.',
      _meta: { min_investment_tier: 3, is_time_intensive: true, requires_tech_skills: true, market_competition: 'low', base_viability: 61 },
    },
  ],

  marketplace: [
    {
      nombre: 'Directorio premium de proveedores de nicho',
      descripcion_corta:
        'Directorio curado y verificado de proveedores en un sector B2B donde la búsqueda actual es caótica (ferias, Excel, contactos personales). Monetizas con perfiles premium y leads.',
      cliente_objetivo: 'Empresas que buscan proveedores específicos en el sector + proveedores que quieren visibilidad',
      monetizacion: 'Perfil premium para proveedores €30–€150/mes + pago por leads cualificados',
      perfil_economico: {
        inversion_inicial_estimada: '€500–€3k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '3–6 semanas',
      },
      riesgos_principales: [
        'Difícil monetizar antes de tener tráfico',
        'LinkedIn puede cubrir parte de la necesidad',
        'Problema del huevo y la gallina',
      ],
      experimento_7_dias:
        'Construye un directorio manual en Notion o Airtable con 30 proveedores del sector. Compártelo gratis en grupos del sector y mide cuántas visitas y mensajes de agradecimiento recibes.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'low', base_viability: 74 },
    },
    {
      nombre: 'Marketplace de servicios profesionales de nicho',
      descripcion_corta:
        'Plataforma que conecta profesionales especializados (abogados de startup, traductores técnicos, consultores de un sector) con empresas que los necesitan puntualmente.',
      cliente_objetivo: 'Pymes y startups que necesitan expertise puntual sin contratar fijo',
      monetizacion: 'Comisión del 15–20% por transacción + suscripción para profesionales destacados',
      perfil_economico: {
        inversion_inicial_estimada: '€5k–€15k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '6–10 semanas',
      },
      riesgos_principales: [
        'Competencia directa con Fiverr, Upwork y LinkedIn',
        'Profesionales prefieren relaciones directas para evitar comisión',
        'Necesitas mass crítica en ambos lados',
      ],
      experimento_7_dias:
        'Consigue el primer match manual: contacta a 10 empresas con una necesidad específica y a 5 profesionales que puedan resolverla. Intermedia la primera transacción y cobra una comisión.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: false, market_competition: 'high', base_viability: 65 },
    },
    {
      nombre: 'Plataforma de economía circular sectorial',
      descripcion_corta:
        'Marketplace B2B donde empresas de un sector compran, venden o intercambian activos, maquinaria o excedentes usados. Más sostenible y económico que comprar nuevo.',
      cliente_objetivo: 'Empresas industriales, hostelería, retail con activos físicos infrautilizados',
      monetizacion: 'Comisión por transacción (5–10%) + publicación premium de activos',
      perfil_economico: {
        inversion_inicial_estimada: '€8k–€25k',
        mrr_potencial_6m: '€2k–€8k',
        tiempo_primer_ingreso: '2–3 meses',
      },
      riesgos_principales: [
        'Logística de activos físicos puede complicar el modelo',
        'Verificación de calidad de los activos en venta',
        'Ciclo de transacción lento en B2B',
      ],
      experimento_7_dias:
        'Busca grupos de Facebook o foros del sector donde ya se intercambia maquinaria usada. Cuantifica la actividad. Intermedia una compraventa manualmente y valida el proceso.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: false, market_competition: 'low', base_viability: 71 },
    },
    {
      nombre: 'Plataforma de intercambio de talento B2B',
      descripcion_corta:
        'Red donde empresas intercambian servicios y capacidades entre sí sin dinero (trueque empresarial estructurado) o con créditos propios de la plataforma.',
      cliente_objetivo: 'Pymes y startups con capacidades sobrantes y necesidad de servicios de otras empresas',
      monetizacion: 'Suscripción mensual €50–€200/mes para empresas activas',
      perfil_economico: {
        inversion_inicial_estimada: '€10k–€30k',
        mrr_potencial_6m: '€2k–€10k',
        tiempo_primer_ingreso: '3–5 meses',
      },
      riesgos_principales: [
        'Concepto nuevo que requiere mucha educación del mercado',
        'Difícil equilibrar los intercambios entre empresas',
        'Masa crítica necesaria antes de que el servicio funcione',
      ],
      experimento_7_dias:
        'Organiza un evento online de "intercambio de servicios" entre 10 empresas de tu red. Observa qué servicios se demandan más y si el concepto genera entusiasmo real.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: false, market_competition: 'low', base_viability: 63 },
    },
  ],

  food: [
    {
      nombre: 'Catering saludable para empresas',
      descripcion_corta:
        'Servicio de menús saludables y personalizables para empresas que quieren cuidar la alimentación de sus empleados. Entrega diaria o semanal con opciones para distintas dietas.',
      cliente_objetivo: 'Empresas de 20–200 empleados con oficina fija interesadas en wellness',
      monetizacion: 'Menú diario por persona €8–€15 + plan mensual con contrato',
      perfil_economico: {
        inversion_inicial_estimada: '€1k–€5k',
        mrr_potencial_6m: '€3k–€10k',
        tiempo_primer_ingreso: '2–3 semanas',
      },
      riesgos_principales: [
        'Logística de entrega muy operativa',
        'Márgenes ajustados en alimentación',
        'Dependencia de pocos clientes grandes',
      ],
      experimento_7_dias:
        'Habla con el responsable de RRHH o el office manager de 5 empresas locales. Pregunta si comen en la oficina, qué opciones tienen y si pagarían por un servicio saludable semanal.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: false, market_competition: 'medium', base_viability: 73 },
    },
    {
      nombre: 'Meal prep personalizado a domicilio',
      descripcion_corta:
        'Servicio semanal de preparación de comidas personalizadas según objetivo nutricional (pérdida de peso, muscle gain, dieta específica). Entrega en casa el domingo para toda la semana.',
      cliente_objetivo: 'Adultos 28–45 años que quieren comer sano pero no tienen tiempo de cocinar',
      monetizacion: 'Suscripción semanal €60–€120 por persona',
      perfil_economico: {
        inversion_inicial_estimada: '€500–€3k',
        mrr_potencial_6m: '€2k–€6k',
        tiempo_primer_ingreso: '1–3 semanas',
      },
      riesgos_principales: [
        'Logística de producción y entrega muy exigente',
        'Alta tasa de cancelación si la calidad baja',
        'Competencia de kits de cocina (HelloFresh) y apps de nutrición',
      ],
      experimento_7_dias:
        'Prepara 10 bandejas de meal prep para personas de tu entorno y entrégaselas gratis. Recoge feedback honesto sobre sabor, presentación y si pagarían. Calcula el costo real.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: false, market_competition: 'high', base_viability: 69 },
    },
    {
      nombre: 'Dark kitchen especializada',
      descripcion_corta:
        'Cocina de producción sin sala, enfocada en un concepto culinario muy específico (bowls, wraps proteicos, comida étnica auténtica) y distribuida por Glovo/Uber Eats.',
      cliente_objetivo: 'Consumidores urbanos de 20–40 años que piden comida a domicilio',
      monetizacion: 'Precio medio por pedido €10–€20 con margen del 30–40% post-plataforma',
      perfil_economico: {
        inversion_inicial_estimada: '€5k–€20k',
        mrr_potencial_6m: '€3k–€10k',
        tiempo_primer_ingreso: '4–8 semanas',
      },
      riesgos_principales: [
        'Comisiones altas de plataformas delivery (20–30%)',
        'Visibilidad dependiente del algoritmo de la plataforma',
        'Coste del alquiler de cocina compartida',
      ],
      experimento_7_dias:
        'Prepara 20 porciones de tu concepto y véndelas en tu barrio vía Instagram Stories a precio de costo. Mide la demanda y recoge feedback de producto antes de alquilar cocina.',
      _meta: { min_investment_tier: 1, is_time_intensive: true, requires_tech_skills: false, market_competition: 'high', base_viability: 66 },
    },
    {
      nombre: 'Tienda online de productos gourmet de origen',
      descripcion_corta:
        'E-commerce de productos alimentarios premium de productores locales o regionales: aceite de oliva virgen extra, vinos naturales, quesos artesanales. Con storytelling del origen.',
      cliente_objetivo: 'Consumidores urbanos de nivel adquisitivo medio-alto que valoran calidad y origen',
      monetizacion: 'Margen comercial 40–70% + modelo de suscripción de caja mensual',
      perfil_economico: {
        inversion_inicial_estimada: '€2k–€8k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '3–6 semanas',
      },
      riesgos_principales: [
        'Logística de perecederos compleja y costosa',
        'Dificultad de posicionamiento frente a tiendas gourmet establecidas',
        'Márgenes variables según productos y temporada',
      ],
      experimento_7_dias:
        'Selecciona 3 productores locales de calidad. Crea una landing page con 5 productos y compártela en grupos de gastronomía. Mide los clicks en "comprar" antes de tener stock.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'medium', base_viability: 67 },
    },
  ],

  services: [
    {
      nombre: 'Consultora de transformación digital para pymes',
      descripcion_corta:
        'Ayudas a pymes tradicionales a digitalizar sus procesos operativos: desde elegir herramientas hasta formarles en su uso. Combinas diagnóstico, implementación y acompañamiento.',
      cliente_objetivo: 'Pymes de 10–100 empleados en sectores tradicionales con procesos en papel',
      monetizacion: 'Proyecto de diagnóstico €1k–€3k + implementación €3k–€15k + retainer mensual',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€500',
        mrr_potencial_6m: '€3k–€10k',
        tiempo_primer_ingreso: '2–3 semanas',
      },
      riesgos_principales: [
        'Dependes de tu reputación y red de contactos inicial',
        'Ciclo de venta largo con decisores escépticos',
        'Escalabilidad limitada sin equipo',
      ],
      experimento_7_dias:
        'Identifica 3 sectores locales con digitalización baja (logística, construcción, retail). Visita a 5 empresas y ofrece un diagnóstico gratuito de su madurez digital. Cuantifica el ahorro potencial.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'medium', base_viability: 78 },
    },
    {
      nombre: 'Agencia de contenido y SEO',
      descripcion_corta:
        'Agencia especializada en contenido escrito, SEO técnico y distribución orgánica para empresas B2B que necesitan posicionarse en buscadores y generar leads entrantes.',
      cliente_objetivo: 'Empresas B2B con web que no aparece en Google y quieren leads orgánicos',
      monetizacion: 'Retainer mensual €1.500–€5k/mes + proyecto de auditoría inicial',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€1k',
        mrr_potencial_6m: '€3k–€9k',
        tiempo_primer_ingreso: '2–3 semanas',
      },
      riesgos_principales: [
        'Resultados SEO son lentos (3–6 meses) y el cliente puede impacientarse',
        'Mercado muy competitivo con muchas agencias',
        'Dependencia de los cambios de algoritmo de Google',
      ],
      experimento_7_dias:
        'Realiza una auditoría SEO gratuita de la web de 5 empresas B2B de tu entorno con una herramienta como Ahrefs o Semrush. Envía el informe con 3 acciones concretas y mide cuántas responden interesadas.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'high', base_viability: 74 },
    },
    {
      nombre: 'Servicio de automatización de procesos (BPA)',
      descripcion_corta:
        'Automatizas procesos manuales de empresas usando herramientas no-code/low-code (Zapier, Make, n8n, Notion). Cada automatización ahorra horas semanales al cliente.',
      cliente_objetivo: 'Empresas de 5–50 empleados con flujos manuales repetitivos entre herramientas',
      monetizacion: 'Proyecto de automatización €500–€3k + mantenimiento mensual €100–€500',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€300',
        mrr_potencial_6m: '€2k–€6k',
        tiempo_primer_ingreso: '1–2 semanas',
      },
      riesgos_principales: [
        'Clientes pueden aprender ellos mismos con tutoriales gratuitos',
        'Difícil justificar precio si el cliente no entiende el valor',
        'Las automatizaciones se rompen cuando cambian las APIs',
      ],
      experimento_7_dias:
        'Automatiza un proceso de una empresa de tu red (gratis). Documenta las horas ahorradas por semana. Usa ese caso real como argumento de venta con 5 empresas similares.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: true, market_competition: 'medium', base_viability: 76 },
    },
    {
      nombre: 'Agencia creativa especializada en un sector',
      descripcion_corta:
        'Agencia de diseño, branding y comunicación visual especializada en un único sector: restauración, salud, inmobiliaria, startups. La especialización justifica precio mayor y atrae clientes del nicho.',
      cliente_objetivo: 'Empresas del sector objetivo que necesitan actualizar identidad y comunicación',
      monetizacion: 'Proyecto de branding €2k–€10k + retainer de comunicación mensual €800–€2.500',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€1k',
        mrr_potencial_6m: '€3k–€8k',
        tiempo_primer_ingreso: '2–4 semanas',
      },
      riesgos_principales: [
        'Dependencia de skills creativas del fundador',
        'Proyectos únicos: necesitas pipeline constante de clientes nuevos',
        'Alta competencia de freelancers en Fiverr',
      ],
      experimento_7_dias:
        'Elige el sector y rediseña el logo de una empresa del sector gratis. Publica el antes/después en LinkedIn y mide las reacciones de empresas del mismo sector.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'high', base_viability: 71 },
    },
  ],

  other: [
    {
      nombre: 'Newsletter de nicho + comunidad de pago',
      descripcion_corta:
        'Newsletter semanal muy especializado en un tema profesional o de interés con alta densidad de valor. Monetizas con suscripción premium, patrocinios o comunidad de pago adjunta.',
      cliente_objetivo: 'Profesionales o entusiastas de un nicho que pagan por información curada de calidad',
      monetizacion: 'Suscripción premium €7–€20/mes + patrocinios de empresas del nicho',
      perfil_economico: {
        inversion_inicial_estimada: '€0–€300',
        mrr_potencial_6m: '€500–€3k',
        tiempo_primer_ingreso: '4–8 semanas',
      },
      riesgos_principales: [
        'Crecimiento orgánico lento (requiere 6–12 meses para masa crítica)',
        'Contenido de calidad requiere tiempo constante',
        'Difícil diferenciarse de newsletters gratuitas',
      ],
      experimento_7_dias:
        'Envía el primer número del newsletter a 50 contactos personales. Mide la tasa de apertura (>40% es buena señal) y pide a los que abran que te reenvíen a una persona que podría interesarle.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: false, market_competition: 'medium', base_viability: 67 },
    },
    {
      nombre: 'Agencia de eventos y experiencias corporativas',
      descripcion_corta:
        'Organización de eventos empresariales, team buildings, retreats y experiencias para empresas que quieren mejorar la cultura y la cohesión de equipo. Presenciales o híbridos.',
      cliente_objetivo: 'Directores de RRHH y CEOs de empresas de 50–500 empleados',
      monetizacion: 'Proyecto por evento €2k–€20k según tamaño + retainer anual de eventos',
      perfil_economico: {
        inversion_inicial_estimada: '€500–€2k',
        mrr_potencial_6m: '€3k–€10k',
        tiempo_primer_ingreso: '2–4 semanas',
      },
      riesgos_principales: [
        'Alta dependencia del presupuesto de bienestar empresarial',
        'Logística operativa compleja en cada proyecto',
        'Estacionalidad: más proyectos en Q2 y Q4',
      ],
      experimento_7_dias:
        'Propón un team building de medio día a una empresa de tu red. Preséntalo como piloto con precio especial. Si lo aceptan, ejecuta y recoge testimonial.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: false, market_competition: 'medium', base_viability: 72 },
    },
    {
      nombre: 'Plataforma de membresía y comunidad online',
      descripcion_corta:
        'Comunidad online de pago para un perfil profesional o de interés muy específico. Acceso a red de contactos, recursos exclusivos, sesiones mensuales con expertos y foro privado.',
      cliente_objetivo: 'Profesionales de un nicho que valoran la red de contactos y el aprendizaje peer-to-peer',
      monetizacion: 'Membresía mensual €19–€99/mes',
      perfil_economico: {
        inversion_inicial_estimada: '€500–€3k',
        mrr_potencial_6m: '€1k–€5k',
        tiempo_primer_ingreso: '4–8 semanas',
      },
      riesgos_principales: [
        'Comunidades tienden a morir sin activación constante',
        'Necesitas fundadores/miembros activos desde el día 1',
        'Competencia de LinkedIn, Slack y comunidades gratuitas',
      ],
      experimento_7_dias:
        'Crea un grupo gratuito de WhatsApp o Discord con 30 personas del nicho objetivo. Modera activamente durante 7 días. Mide si la conversación es orgánica o si eres el único que habla.',
      _meta: { min_investment_tier: 0, is_time_intensive: true, requires_tech_skills: false, market_competition: 'medium', base_viability: 68 },
    },
    {
      nombre: 'Servicio de suscripción de productos o experiencias',
      descripcion_corta:
        'Box mensual curada o servicio de suscripción en cualquier categoría con mercado apasionado: libros, vino, arte, experiencias de ocio. La recurrencia genera ingresos predecibles.',
      cliente_objetivo: 'Consumidores con un hobby o interés definido que valoran la curaduría',
      monetizacion: 'Suscripción mensual €25–€80 por box o experiencia',
      perfil_economico: {
        inversion_inicial_estimada: '€1k–€5k',
        mrr_potencial_6m: '€1k–€4k',
        tiempo_primer_ingreso: '3–6 semanas',
      },
      riesgos_principales: [
        'Alta tasa de cancelación si el valor percibido baja',
        'Gestión de inventario y logística mensual',
        'Costo de adquisición de cliente alto relativo al ticket',
      ],
      experimento_7_dias:
        'Crea una landing de pre-venta con 50 plazas para el primer mes. Compártela en comunidades del nicho. Si consigues 10 pre-ventas en 7 días, el concepto tiene tracción.',
      _meta: { min_investment_tier: 0, is_time_intensive: false, requires_tech_skills: false, market_competition: 'medium', base_viability: 66 },
    },
  ],
};

// ── Helper functions ─────────────────────────────────────────────────────────

function investmentTierIndex(capacity: string | undefined): number {
  switch (capacity) {
    case '0-5k':     return 0;
    case '5k-25k':   return 1;
    case '25k-100k': return 2;
    case '100k+':    return 3;
    default:         return 1; // conservative default
  }
}

function hasTechSkills(skills?: string): boolean {
  if (!skills || skills.trim().length === 0) return false;
  const keywords = ['tech', 'engineer', 'developer', 'software', 'código', 'programación',
    'data', 'ia', 'ai', 'backend', 'frontend', 'devops', 'ml', 'python', 'javascript'];
  const lower = skills.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

function computeFilter(
  template: IdeaTemplate,
  input: GenerateBusinessIdeasInput,
): BusinessIdeaFilter {
  const userTier = investmentTierIndex(input.investment_capacity);
  const nivel_1_pass = template._meta.min_investment_tier <= userTier;

  const flags: string[] = [];

  if (template._meta.is_time_intensive && input.time_commitment === 'side-project') {
    flags.push('Requiere más dedicación de la que indicaste');
  }
  if (template._meta.requires_tech_skills && !hasTechSkills(input.skills)) {
    flags.push('Requiere habilidades técnicas o socio técnico');
  }
  if (template._meta.market_competition === 'high') {
    flags.push('Mercado muy competitivo');
  }

  // Viability: base + contextual adjustments
  let score = template._meta.base_viability;
  if (template._meta.requires_tech_skills && hasTechSkills(input.skills)) score += 5;
  if (template._meta.is_time_intensive && input.time_commitment === 'full-time') score += 3;
  if (template._meta.is_time_intensive && input.time_commitment === 'side-project') score -= 8;
  if (template._meta.market_competition === 'high') score -= 5;
  if (template._meta.market_competition === 'low') score += 4;
  if (input.goal_90d?.includes('clientes') && template._meta.base_viability >= 70) score += 3;

  return {
    nivel_1_pass,
    nivel_2_flags: flags,
    viability_score: Math.max(40, Math.min(95, score)),
  };
}

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Genera hasta 3 ideas de negocio pasando el filtro Nivel 1.
 * Las ideas se ordenan por viability_score descendente.
 */
export async function generateBusinessIdeas(
  input: GenerateBusinessIdeasInput,
): Promise<BusinessIdea[]> {
  // Simulate AI generation latency
  await new Promise(resolve => setTimeout(resolve, 2200));

  const key = input.industry?.toLowerCase() ?? 'other';
  const templates = TEMPLATES[key] ?? TEMPLATES['other'];

  const ideas: BusinessIdea[] = templates.map((t, idx) => {
    const filter = computeFilter(t, input);
    return {
      id: `idea_${idx + 1}`,
      nombre: t.nombre,
      descripcion_corta: t.descripcion_corta,
      cliente_objetivo: t.cliente_objetivo,
      monetizacion: t.monetizacion,
      perfil_economico: t.perfil_economico,
      riesgos_principales: t.riesgos_principales,
      experimento_7_dias: t.experimento_7_dias,
      filter,
    };
  });

  // Nivel 1: discard ideas the user cannot pursue given investment capacity
  const passing = ideas.filter(i => i.filter.nivel_1_pass);

  // Sort by viability descending, return top 3
  return passing
    .sort((a, b) => b.filter.viability_score - a.filter.viability_score)
    .slice(0, 3);
}
