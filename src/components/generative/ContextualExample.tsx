/**
 * CONTEXTUAL EXAMPLE
 *
 * Muestra ejemplos contextuales al lado de cada pregunta
 * Basado en industria detectada o tipo de negocio
 */

import React from 'react';
import { Lightbulb, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface Example {
  good?: string;
  bad?: string;
  tip?: string;
}

interface ContextualExampleProps {
  fieldType: string;
  industry?: string;
  businessType?: string;
}

const EXAMPLES: Record<string, Example> = {
  // Problem statements
  'problem-saas': {
    good: 'Los Product Managers en startups de 10-50 personas pierden 15 horas por semana haciendo roadmaps en Excel porque Jira es demasiado complejo para equipos pequeños',
    bad: 'Es difícil gestionar proyectos',
    tip: 'Incluye: quién sufre, cuánto tiempo pierden, por qué las soluciones actuales fallan',
  },
  'problem-ecommerce': {
    good: 'Tiendas Shopify con <$50K MRR pierden 30% de ventas porque checkout toma 4 pasos (promedio industria: 2 pasos)',
    bad: 'El checkout es lento',
    tip: 'Cuantifica el problema con números: % perdido, tiempo desperdiciado, dinero que cuesta',
  },
  'problem-service': {
    good: 'Diseñadores freelance gastan 20h/semana buscando clientes en Upwork/Fiverr donde la comisión es 20% y hay competencia de 100+ personas por proyecto',
    bad: 'Es difícil conseguir clientes',
    tip: 'Menciona plataformas actuales, sus problemas específicos (comisión, competencia), y impacto en tiempo/dinero',
  },

  // Business ideas
  'idea-saas': {
    good: 'Una herramienta de roadmapping con setup de 1 minuto que genera roadmaps automáticamente con IA, diseñada para equipos de 5-20 personas',
    bad: 'Una app de gestión de proyectos',
    tip: 'Especifica: qué hace único, para quién es, qué problema resuelve',
  },
  'idea-marketplace': {
    good: 'Un marketplace que conecta diseñadores freelance con empresas locales (50km radio) usando geolocalización, sin comisión en primeros 3 meses',
    bad: 'Una plataforma para freelancers',
    tip: 'Explica: qué conectas, cómo te diferencias, qué región/nicho atacas',
  },

  // Target customer
  'customer-b2b': {
    good: 'CTOs y VP Engineering en startups Series A-B (50-200 empleados) que usan Jira pero su equipo se queja de complejidad',
    bad: 'Startups que necesitan PM tools',
    tip: 'Sé específico: rol exacto, stage de empresa, tamaño, pain point actual',
  },
  'customer-b2c': {
    good: 'Diseñadores gráficos freelance de 25-35 años, con 2-5 años de experiencia, que usan Fiverr/Upwork y quieren clientes recurrentes locales',
    bad: 'Freelancers',
    tip: 'Incluye: edad, experiencia, herramientas actuales, qué buscan que no tienen',
  },

  // Monetization
  'monetization-saas': {
    good: 'Freemium: Free hasta 3 proyectos, $29/mo para equipos hasta 10 personas, $99/mo para 50+ (inspirado en Figma pricing)',
    bad: 'Vamos a cobrar una suscripción',
    tip: 'Define: free tier límites, precio de paid plans, por qué ese pricing (benchmark)',
  },
  'monetization-marketplace': {
    good: 'Comisión 10% en primeros 3 meses (vs 20% de Upwork), luego 5% si eres cliente recurrente. Freelancers pagan $0, empresas pagan comisión',
    bad: 'Comisión por transacción',
    tip: 'Especifica: % exacto, quién paga, incentivos (descuentos, loyalty)',
  },

  // Go-to-market
  'gtm-b2b': {
    good: 'Outreach directo en LinkedIn a 100 CTOs de startups Series A (filtro: company size 50-200, funded last 12mo). Mensaje: "Jira frustration?" + link a 2min demo video',
    bad: 'Marketing en redes sociales',
    tip: 'Sé táctico: canal exacto, target preciso, mensaje específico, volumen (ej: 100 alcances)',
  },
  'gtm-b2c': {
    good: 'Post en r/web_design (2.1M members) + r/freelance (500K) con título "Tired of Upwork 20% fees?" link a landing. Objetivo: 50 signups en 1 semana',
    bad: 'Postear en Reddit',
    tip: 'Define: subreddits exactos, headline del post, CTA, métrica de éxito',
  },
};

export function ContextualExample({ fieldType, industry, businessType }: ContextualExampleProps) {
  // Build example key based on field + context
  let exampleKey = fieldType;

  // Add industry context if available
  if (industry) {
    exampleKey = `${fieldType}-${industry.toLowerCase()}`;
  } else if (businessType) {
    exampleKey = `${fieldType}-${businessType.toLowerCase()}`;
  }

  const example = EXAMPLES[exampleKey] || EXAMPLES[fieldType];

  if (!example) return null;

  return (
    <div className="space-y-2 mt-2">
      {example.good && (
        <Alert className="bg-green-50 border-green-200">
          <Lightbulb className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-sm text-green-800">
            <span className="font-semibold">✅ Buen ejemplo:</span> {example.good}
          </AlertDescription>
        </Alert>
      )}

      {example.bad && (
        <Alert className="bg-red-50 border-red-200">
          <Info className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-sm text-red-800">
            <span className="font-semibold">❌ Evita:</span> {example.bad}
          </AlertDescription>
        </Alert>
      )}

      {example.tip && (
        <Alert className="bg-blue-50 border-blue-200">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-sm text-blue-800">
            <span className="font-semibold">💡 Tip:</span> {example.tip}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
