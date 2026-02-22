/**
 * VALIDACIÓN EN TIEMPO REAL
 *
 * Funciones para validar inputs del onboarding mientras el usuario escribe
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
  suggestion?: string;
}

/**
 * Valida URL
 */
export function validateUrl(url: string): ValidationResult {
  if (!url) {
    return { isValid: true }; // Optional field
  }

  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return {
        isValid: false,
        error: 'La URL debe comenzar con http:// o https://',
      };
    }
    return { isValid: true };
  } catch {
    return {
      isValid: false,
      error: 'URL inválida. Ejemplo: https://ejemplo.com',
    };
  }
}

/**
 * Valida email
 */
export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { isValid: true }; // Optional field
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: 'Email inválido',
    };
  }

  return { isValid: true };
}

/**
 * Valida problema/frustración
 */
export function validateProblemStatement(problem: string): ValidationResult {
  if (!problem || problem.trim().length === 0) {
    return {
      isValid: false,
      error: 'Este campo es requerido',
    };
  }

  const wordCount = problem.trim().split(/\s+/).length;

  if (wordCount < 5) {
    return {
      isValid: false,
      error: 'Sé más específico (mínimo 5 palabras)',
      suggestion: 'Ejemplo: "Los diseñadores freelance pierden 20 horas por semana buscando clientes en plataformas saturadas"',
    };
  }

  if (wordCount > 100) {
    return {
      isValid: false,
      error: 'Demasiado largo. Resume en 1-2 frases.',
    };
  }

  // Check for vague terms
  const vagueTerms = ['problema', 'difícil', 'complicado', 'mejorar', 'optimizar'];
  const hasVagueTerms = vagueTerms.some((term) => problem.toLowerCase().includes(term));

  if (hasVagueTerms && wordCount < 15) {
    return {
      isValid: true,
      warning: 'Sé más específico. Menciona números o ejemplos concretos.',
      suggestion: 'En vez de "es difícil", di "pierdo 10 horas por semana en..."',
    };
  }

  return { isValid: true };
}

/**
 * Valida idea de negocio
 */
export function validateBusinessIdea(idea: string): ValidationResult {
  if (!idea || idea.trim().length === 0) {
    return {
      isValid: false,
      error: 'Este campo es requerido',
    };
  }

  const wordCount = idea.trim().split(/\s+/).length;

  if (wordCount < 3) {
    return {
      isValid: false,
      error: 'Describe tu idea con más detalle (mínimo 3 palabras)',
    };
  }

  if (wordCount > 50) {
    return {
      isValid: false,
      warning: 'Demasiado largo. Resume en 1 frase clara.',
    };
  }

  // Check if it's actually describing a solution
  const solutionKeywords = ['app', 'plataforma', 'herramienta', 'servicio', 'sistema', 'software'];
  const hasSolutionKeyword = solutionKeywords.some((kw) => idea.toLowerCase().includes(kw));

  if (!hasSolutionKeyword && wordCount < 10) {
    return {
      isValid: true,
      suggestion: 'Ejemplo: "Una app para que diseñadores freelance encuentren clientes locales"',
    };
  }

  return { isValid: true };
}

/**
 * Valida target customer
 */
export function validateTargetCustomer(target: string): ValidationResult {
  if (!target || target.trim().length === 0) {
    return {
      isValid: false,
      error: 'Este campo es requerido',
    };
  }

  const wordCount = target.trim().split(/\s+/).length;

  if (wordCount < 3) {
    return {
      isValid: false,
      error: 'Sé más específico sobre tu cliente ideal',
      suggestion: 'Ejemplo: "Diseñadores freelance de 25-35 años que usan Fiverr"',
    };
  }

  // Check for vague descriptions
  const vagueDescriptions = ['personas', 'gente', 'usuarios', 'clientes', 'emprendedores'];
  const isVague = vagueDescriptions.some((desc) => target.toLowerCase() === desc || target.toLowerCase().startsWith(desc + ' '));

  if (isVague) {
    return {
      isValid: false,
      error: '¿Qué TIPO de personas? Sé específico',
      suggestion: 'Incluye: edad, profesión, o situación específica. Ejemplo: "Product Managers en startups de 10-50 empleados"',
    };
  }

  return { isValid: true };
}

/**
 * Valida pricing
 */
export function validatePricing(price: number | string): ValidationResult {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;

  if (isNaN(numPrice) || numPrice < 0) {
    return {
      isValid: false,
      error: 'Precio debe ser un número positivo',
    };
  }

  if (numPrice === 0) {
    return {
      isValid: true,
      warning: 'Gratis puede atraer usuarios pero dificulta monetización',
      suggestion: 'Considera un precio bajo ($5-10) para validar willingness to pay',
    };
  }

  if (numPrice > 1000) {
    return {
      isValid: true,
      warning: 'Precio alto. Asegúrate de que el valor lo justifique',
    };
  }

  return { isValid: true };
}

/**
 * Valida timeframe/deadlines
 */
export function validateTimeframe(timeframe: string): ValidationResult {
  if (!timeframe) {
    return { isValid: true }; // Optional
  }

  const validFormats = /(\d+)\s*(day|week|month|año|día|semana|mes)/i;

  if (!validFormats.test(timeframe)) {
    return {
      isValid: false,
      error: 'Formato inválido',
      suggestion: 'Ejemplo: "2 semanas", "3 meses", "6 weeks"',
    };
  }

  return { isValid: true };
}

/**
 * Valida budget
 */
export function validateBudget(budget: number | string): ValidationResult {
  const numBudget = typeof budget === 'string' ? parseFloat(budget) : budget;

  if (isNaN(numBudget) || numBudget < 0) {
    return {
      isValid: false,
      error: 'Budget debe ser un número positivo',
    };
  }

  if (numBudget === 0) {
    return {
      isValid: true,
      suggestion: 'Sin budget, enfócate en estrategias orgánicas (SEO, content, communities)',
    };
  }

  if (numBudget < 100) {
    return {
      isValid: true,
      suggestion: 'Budget bajo. Prioriza canales orgánicos antes que ads',
    };
  }

  return { isValid: true };
}

/**
 * Valida array (ej: frustraciones, OKRs)
 */
export function validateArray(
  items: string[],
  minItems: number,
  maxItems: number,
  fieldName: string
): ValidationResult {
  if (items.length < minItems) {
    return {
      isValid: false,
      error: `Añade al menos ${minItems} ${fieldName}`,
    };
  }

  if (items.length > maxItems) {
    return {
      isValid: false,
      error: `Máximo ${maxItems} ${fieldName}`,
    };
  }

  // Check if items are too short
  const tooShort = items.some((item) => item.trim().split(/\s+/).length < 3);
  if (tooShort) {
    return {
      isValid: true,
      warning: 'Algunos items son muy cortos. Sé más específico.',
    };
  }

  return { isValid: true };
}
