/**
 * PREGUNTAS ESTRATÉGICAS FASE 2
 *
 * Campos adicionales para obtener más contexto y generar outputs más personalizados.
 * Estas preguntas se hacen DESPUÉS de las básicas, para no abrumar al usuario.
 */

export interface StrategicQuestions {
  // Unique Advantage
  uniqueAdvantage?: {
    what: string; // ¿Qué tienes que nadie más tiene?
    why: string; // ¿Por qué es difícil de copiar?
    evidence?: string; // Evidencia (patent, network effect, etc.)
  };

  // Go-to-Market Strategy
  goToMarket?: {
    firstTenCustomers: string; // ¿Cómo conseguirás tus primeros 10 clientes?
    acquisitionChannel: string; // Canal principal (SEO, ads, outbound, etc.)
    estimatedCAC: number; // Customer Acquisition Cost estimado
    timeToFirstSale: string; // Cuánto tiempo hasta primera venta
  };

  // Goals & Metrics
  goals?: {
    revenueGoalYear1: number; // Meta de ingresos Año 1
    customersGoalYear1: number; // Meta de clientes Año 1
    topOKRs: string[]; // Top 3 OKRs (Objectives & Key Results)
  };

  // Current Challenges
  challenges?: {
    biggestRisk: string; // Mayor riesgo/miedo
    resourceGaps: string[]; // Qué te falta (dinero, skills, tiempo, etc.)
    needHelpWith: string[]; // Multi-select: tech, marketing, sales, legal, etc.
  };

  // Tech Stack (for technical products)
  techStack?: {
    frontend?: string[]; // React, Vue, etc.
    backend?: string[]; // Node, Python, etc.
    infrastructure?: string[]; // AWS, Vercel, etc.
    tools?: string[]; // Stripe, Twilio, etc.
  };

  // Pricing Strategy
  pricingStrategy?: {
    pricingModel: 'value-based' | 'cost-plus' | 'competitor-based' | 'freemium';
    willingnessToPay: {
      min: number;
      max: number;
      ideal: number;
    };
    discountStrategy?: string; // Annual discount, volume discount, etc.
  };

  // Competitive Moat
  competitiveMoat?: {
    moatType: 'network-effect' | 'brand' | 'technology' | 'data' | 'cost' | 'switching-cost' | 'regulatory';
    description: string;
    timeToReplicate: string; // Cuánto tardaría un competidor en replicarte
  };
}

/**
 * Questions configuration for UI
 */
export const STRATEGIC_QUESTIONS_CONFIG = {
  uniqueAdvantage: {
    label: 'Ventaja Única',
    description: '¿Qué tienes que tus competidores no tienen?',
    fields: [
      {
        name: 'what',
        label: '¿Cuál es tu ventaja única?',
        placeholder: 'Ej: Tenemos 10 años de datos de la industria que nadie más tiene',
        type: 'textarea' as const,
      },
      {
        name: 'why',
        label: '¿Por qué es difícil de copiar?',
        placeholder: 'Ej: Nuestros datos vienen de partnerships exclusivos con 500 empresas',
        type: 'textarea' as const,
      },
      {
        name: 'evidence',
        label: 'Evidencia (opcional)',
        placeholder: 'Ej: Patent US123456, Network effect con 10K usuarios',
        type: 'text' as const,
      },
    ],
  },

  goToMarket: {
    label: 'Go-to-Market',
    description: '¿Cómo conseguirás tus primeros clientes?',
    fields: [
      {
        name: 'firstTenCustomers',
        label: 'Estrategia para primeros 10 clientes',
        placeholder: 'Ej: Outreach directo en LinkedIn a CTOs de startups Series A',
        type: 'textarea' as const,
      },
      {
        name: 'acquisitionChannel',
        label: 'Canal de adquisición principal',
        type: 'select' as const,
        options: [
          'SEO / Content Marketing',
          'Google Ads / Paid Search',
          'Social Media Ads',
          'Outbound Sales',
          'Partnerships / Affiliates',
          'Product Hunt / Communities',
          'Word of Mouth / Referrals',
          'Cold Email',
          'Events / Conferences',
        ],
      },
      {
        name: 'estimatedCAC',
        label: 'CAC estimado (Customer Acquisition Cost)',
        placeholder: 'Ej: 50',
        type: 'number' as const,
        prefix: '$',
      },
      {
        name: 'timeToFirstSale',
        label: 'Tiempo estimado hasta primera venta',
        type: 'select' as const,
        options: ['<1 semana', '1-4 semanas', '1-3 meses', '3-6 meses', '6+ meses'],
      },
    ],
  },

  goals: {
    label: 'Metas & OKRs',
    description: 'Define tus objetivos para el primer año',
    fields: [
      {
        name: 'revenueGoalYear1',
        label: 'Meta de ingresos Año 1',
        placeholder: 'Ej: 100000',
        type: 'number' as const,
        prefix: '$',
      },
      {
        name: 'customersGoalYear1',
        label: 'Meta de clientes Año 1',
        placeholder: 'Ej: 50',
        type: 'number' as const,
      },
      {
        name: 'topOKRs',
        label: 'Top 3 OKRs (Objectives & Key Results)',
        placeholder: 'Ej: Launch MVP en Q1, conseguir 100 usuarios beta, $10K MRR en Q2',
        type: 'array' as const,
        maxItems: 3,
      },
    ],
  },

  challenges: {
    label: 'Desafíos & Riesgos',
    description: '¿Cuáles son tus mayores preocupaciones?',
    fields: [
      {
        name: 'biggestRisk',
        label: 'Mayor riesgo o miedo',
        placeholder: 'Ej: Que nadie esté dispuesto a pagar por esto',
        type: 'textarea' as const,
      },
      {
        name: 'resourceGaps',
        label: '¿Qué recursos te faltan?',
        type: 'multiselect' as const,
        options: [
          'Dinero / Capital',
          'Skills técnicos',
          'Skills de marketing',
          'Skills de ventas',
          'Tiempo',
          'Network / Contactos',
          'Conocimiento del mercado',
          'Co-founder',
        ],
      },
      {
        name: 'needHelpWith',
        label: '¿En qué necesitas ayuda?',
        type: 'multiselect' as const,
        options: [
          'Desarrollo técnico',
          'Diseño UI/UX',
          'Marketing digital',
          'SEO / Content',
          'Sales / Business Development',
          'Legal / Incorporación',
          'Fundraising',
          'Product-Market Fit',
        ],
      },
    ],
  },

  techStack: {
    label: 'Tech Stack',
    description: 'Tecnologías que usas o planeas usar',
    condition: (data: Record<string, unknown>) => {
      // Only show for technical products
      const businessType = data.businessType;
      if (typeof businessType !== 'string') return false;
      return businessType.includes('app') || businessType.includes('software');
    },
    fields: [
      {
        name: 'frontend',
        label: 'Frontend',
        type: 'multiselect' as const,
        options: ['React', 'Vue', 'Angular', 'Svelte', 'Next.js', 'HTML/CSS/JS', 'React Native', 'Flutter', 'Otro'],
      },
      {
        name: 'backend',
        label: 'Backend',
        type: 'multiselect' as const,
        options: ['Node.js', 'Python', 'Ruby', 'PHP', 'Java', 'Go', 'C#/.NET', 'Serverless', 'Otro'],
      },
      {
        name: 'infrastructure',
        label: 'Infraestructura',
        type: 'multiselect' as const,
        options: ['AWS', 'Google Cloud', 'Azure', 'Vercel', 'Netlify', 'Heroku', 'DigitalOcean', 'Supabase', 'Firebase', 'Otro'],
      },
      {
        name: 'tools',
        label: 'Herramientas / APIs',
        type: 'array' as const,
        placeholder: 'Ej: Stripe, Twilio, OpenAI, etc.',
      },
    ],
  },

  competitiveMoat: {
    label: 'Ventaja Competitiva (Moat)',
    description: '¿Cómo te defiendes de competidores?',
    fields: [
      {
        name: 'moatType',
        label: 'Tipo de ventaja competitiva',
        type: 'select' as const,
        options: [
          { value: 'network-effect', label: 'Network Effect (más usuarios = más valor)' },
          { value: 'brand', label: 'Brand (reconocimiento de marca)' },
          { value: 'technology', label: 'Technology (tech difícil de replicar)' },
          { value: 'data', label: 'Data (datos únicos)' },
          { value: 'cost', label: 'Cost Advantage (produces más barato)' },
          { value: 'switching-cost', label: 'Switching Cost (difícil migrar)' },
          { value: 'regulatory', label: 'Regulatory (licenses, compliance)' },
        ],
      },
      {
        name: 'description',
        label: 'Describe tu moat',
        placeholder: 'Ej: Cada usuario que invita a su equipo hace la plataforma más valiosa (network effect)',
        type: 'textarea' as const,
      },
      {
        name: 'timeToReplicate',
        label: '¿Cuánto tardaría un competidor en replicarte?',
        type: 'select' as const,
        options: ['<3 meses', '3-6 meses', '6-12 meses', '1-2 años', '2+ años'],
      },
    ],
  },
};

/**
 * Default values
 */
export const STRATEGIC_QUESTIONS_DEFAULTS: Partial<StrategicQuestions> = {
  goToMarket: {
    firstTenCustomers: '',
    acquisitionChannel: 'SEO / Content Marketing',
    estimatedCAC: 50,
    timeToFirstSale: '1-4 semanas',
  },
  pricingStrategy: {
    pricingModel: 'value-based',
    willingnessToPay: {
      min: 0,
      max: 100,
      ideal: 29,
    },
  },
};
