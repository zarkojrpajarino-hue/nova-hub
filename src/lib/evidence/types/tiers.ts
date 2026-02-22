/**
 * 🎯 EVIDENCE TIERS - Definición Formal
 *
 * Define EXACTAMENTE qué significa cada tier de evidencia.
 * Orden de confiabilidad: Tier 1 > Tier 2 > Tier 3 > Tier 4
 */

export type EvidenceTier = 'user_docs' | 'official_apis' | 'internal_data' | 'web_news';

/**
 * Tier 1: USER DOCUMENTS (Más confiable para el contexto del usuario)
 * - PDFs, CSVs, XLSX subidos por el usuario
 * - Documentos del proyecto específico
 * - Planes, reportes, análisis propios
 *
 * Confiabilidad: ⭐⭐⭐⭐⭐ (específico del usuario)
 * Ejemplos:
 * - plan_financiero_2025.pdf
 * - ventas_q4.csv
 * - analisis_competencia.docx
 */
export const TIER_USER_DOCS: EvidenceTier = 'user_docs';

/**
 * Tier 2: OFFICIAL APIs & VERIFIED SOURCES (Más confiable objetivamente)
 * - APIs oficiales (gobierno, instituciones)
 * - Bases de datos verificadas (Bloomberg, Statista)
 * - Fuentes first-party (APIs de plataformas reconocidas)
 *
 * Confiabilidad: ⭐⭐⭐⭐ (verificado externamente)
 * Ejemplos:
 * - API del Banco Central
 * - LinkedIn API
 * - Google Analytics API
 * - Stripe API
 */
export const TIER_OFFICIAL_APIS: EvidenceTier = 'official_apis';

/**
 * Tier 3: INTERNAL PRODUCT DATA (Data del sistema)
 * - CRM data (leads, contacts, deals)
 * - Usage data (analytics interno)
 * - Pipeline data (sales, tasks, OKRs)
 * - Performance metrics del producto
 *
 * Confiabilidad: ⭐⭐⭐ (específico pero generado por sistema)
 * Ejemplos:
 * - Datos de la tabla `leads`
 * - Datos de la tabla `tasks`
 * - Métricas de uso del producto
 */
export const TIER_INTERNAL_DATA: EvidenceTier = 'internal_data';

/**
 * Tier 4: WEB & NEWS (Menos confiable, más genérico)
 * - Web scraping de sitios públicos
 * - Artículos de news
 * - Blogs, foros
 * - Social media trends
 *
 * Confiabilidad: ⭐⭐ (puede ser sesgado/desactualizado)
 * Ejemplos:
 * - TechCrunch articles
 * - Competitor websites
 * - Industry blogs
 */
export const TIER_WEB_NEWS: EvidenceTier = 'web_news';

/**
 * Map de tiers a números (para backward compatibility)
 */
export const TIER_TO_NUMBER: Record<EvidenceTier, number> = {
  user_docs: 1,
  official_apis: 2,
  internal_data: 3,
  web_news: 4,
};

/**
 * Map de números a tiers
 */
export const NUMBER_TO_TIER: Record<number, EvidenceTier> = {
  1: 'user_docs',
  2: 'official_apis',
  3: 'internal_data',
  4: 'web_news',
};

/**
 * Nombres user-friendly para mostrar en UI
 */
export const TIER_DISPLAY_NAMES: Record<EvidenceTier, string> = {
  user_docs: 'Tus documentos del proyecto',
  official_apis: 'Datos oficiales y bases de datos verificadas',
  internal_data: 'Datos internos del sistema (CRM, tareas, métricas)',
  web_news: 'Web y noticias del sector',
};

/**
 * Descripciones para el modal de configuración
 */
export const TIER_DESCRIPTIONS: Record<EvidenceTier, string> = {
  user_docs: 'PDFs, CSVs y documentos que has subido al proyecto',
  official_apis: 'APIs gubernamentales, institucionales y bases de datos verificadas',
  internal_data: 'Leads, tareas, clientes y métricas de tu cuenta',
  web_news: 'Artículos, análisis de mercado y tendencias del sector',
};
