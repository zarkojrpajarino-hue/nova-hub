/**
 * CONTEXTUAL EXAMPLE
 *
 * Muestra ejemplos contextuales al lado de cada pregunta
 * Basado en industria detectada o tipo de negocio
 */

import React from 'react';
import { Lightbulb, Info } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { useTranslation } from 'react-i18next';
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
    good: t('generative.losProductManagersEn'),
    bad: t('generative.esDifícilGestionarProyectos'),
    tip: t('generative.incluyeQuiénSufreCuánto'),
  },
  'problem-ecommerce': {
    good: 'Tiendas Shopify con <$50K MRR pierden 30% de ventas porque checkout toma 4 pasos (promedio industria: 2 pasos)',
    bad: t('generative.elCheckoutEsLento'),
    tip: t('generative.cuantificaElProblemaCon'),
  },
  'problem-service': {
    good: t('generative.diseñadoresFreelanceGastan20hsemana'),
    bad: t('generative.esDifícilConseguirClientes'),
    tip: t('generative.mencionaPlataformasActualesSus'),
  },

  // Business ideas
  'idea-saas': {
    good: t('generative.unaHerramientaDeRoadmapping'),
    bad: t('generative.unaAppDeGestión'),
    tip: t('generative.especificaQuéHaceÚnico'),
  },
  'idea-marketplace': {
    good: t('generative.unMarketplaceQueConecta'),
    bad: t('generative.unaPlataformaParaFreelancers'),
    tip: t('generative.explicaQuéConectasCómo'),
  },

  // Target customer
  'customer-b2b': {
    good: t('generative.ctosYVpEngineering'),
    bad: t('generative.startupsQueNecesitanPm'),
    tip: t('generative.séEspecíficoRolExacto'),
  },
  'customer-b2c': {
    good: t('generative.diseñadoresGráficosFreelanceDe'),
    bad: t('generative.freelancers'),
    tip: t('generative.incluyeEdadExperienciaHerramientas'),
  },

  // Monetization
  'monetization-saas': {
    good: 'Freemium: Free hasta 3 proyectos, $29/mo para equipos hasta 10 personas, $99/mo para 50+ (inspirado en Figma pricing)',
    bad: t('generative.vamosACobrarUna'),
    tip: 'Define: free tier límites, precio de paid plans, por qué ese pricing (benchmark)',
  },
  'monetization-marketplace': {
    good: t('generative.comisión10EnPrimeros'),
    bad: t('generative.comisiónPorTransacción'),
    tip: 'Especifica: % exacto, quién paga, incentivos (descuentos, loyalty)',
  },

  // Go-to-market
  'gtm-b2b': {
    good: 'Outreach directo en LinkedIn a 100 CTOs de startups Series A (filtro: company size 50-200, funded last 12mo). Mensaje: Jira frustration? + link a 2min demo video',
    bad: t('generative.marketingEnRedesSociales'),
    tip: 'Sé táctico: canal exacto, target preciso, mensaje específico, volumen (ej: 100 alcances)',
  },
  'gtm-b2c': {
    good: 'Post en r/web_design (2.1M members) + r/freelance (500K) con título Tired of Upwork 20% fees? link a landing. Objetivo: 50 signups en 1 semana',
    bad: t('generative.postearEnReddit'),
    tip: t('generative.defineSubredditsExactosHeadline'),
  },
};

export function ContextualExample({ fieldType, industry, businessType }: ContextualExampleProps) {
  const { t } = useTranslation();
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
