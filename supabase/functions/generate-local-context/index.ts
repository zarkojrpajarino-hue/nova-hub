/**
 * GENERATE LOCAL CONTEXT EDGE FUNCTION
 *
 * Generates geo-personalized context based on city/country
 *
 * Returns different data based on onboarding type:
 * - generative: Pre-seed investors, accelerators, events
 * - idea: Seed investors, validation resources, beta tester communities
 * - existing: Series A+ investors, hiring costs, regulations for scaling
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    const { city, country, onboarding_type } = await req.json();

    if (!city || !country) {
      return new Response(
        JSON.stringify({ success: false, error: 'City and country required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // In production, this would:
    // 1. Call a database of investors, accelerators, costs by location
    // 2. Use GPT-4 to generate personalized context
    // 3. Return location-specific data

    const localContext = await generateContext(city, country, onboarding_type);

    return new Response(
      JSON.stringify({
        success: true,
        data: localContext,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error generating local context:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function generateContext(city: string, country: string, type: string) {
  // TODO: Implement actual database lookup + GPT-4 generation
  // 1. Lookup investors/accelerators in this location
  // 2. Get salary data for this city
  // 3. Get regulations for this country
  // 4. Generate personalized recommendations

  // Mock data structure
  const isSpain = country.toLowerCase().includes('spain') || country.toLowerCase().includes('españa');
  const isMadrid = city.toLowerCase().includes('madrid');

  if (isSpain) {
    return {
      investors: getInvestorsForLocation('spain', type),
      accelerators: [
        {
          name: 'Lanzadera',
          focus: 'Early-stage startups',
          website: 'lanzadera.es',
        },
        {
          name: 'Demium Startups',
          focus: 'Idea → MVP',
          website: 'demium.com',
        },
      ],
      costs: {
        dev_salary_range: '€45K-€70K/año',
        office_coworking: isMadrid ? '€300-€600/mes' : '€200-€400/mes',
        avg_burn_rate: '€12K-€18K/mes (team of 3-4)',
      },
      grants: [
        {
          name: 'ENISA',
          amount: 'Hasta €300K',
          eligibility: 'Startups innovadoras con tracción',
        },
        {
          name: 'CDTI',
          amount: 'Hasta €200K',
          eligibility: 'Proyectos de I+D+i',
        },
      ],
      regulations: [
        {
          area: 'Legal Structure',
          description: 'SL (Sociedad Limitada) con €3K capital mínimo',
        },
        {
          area: 'GDPR',
          description: 'Obligatorio si manejas datos de usuarios EU',
        },
      ],
      events: [
        {
          name: 'South Summit',
          type: 'Conference (anual)',
        },
        {
          name: 'Startup Grind Madrid',
          type: 'Monthly meetups',
        },
      ],
    };
  }

  // Default: US data
  return {
    investors: getInvestorsForLocation('usa', type),
    accelerators: [
      {
        name: 'Y Combinator',
        focus: 'World-class accelerator',
        website: 'ycombinator.com',
      },
      {
        name: 'Techstars',
        focus: 'Mentorship-driven',
        website: 'techstars.com',
      },
    ],
    costs: {
      dev_salary_range: '$100K-$180K/year',
      office_coworking: '$400-$800/month',
      avg_burn_rate: '$25K-$40K/month (team of 3-4)',
    },
    grants: [
      {
        name: 'SBIR/STTR',
        amount: 'Up to $1.5M',
        eligibility: 'Tech R&D companies',
      },
    ],
    regulations: [
      {
        area: 'Legal Structure',
        description: 'Delaware C-Corp for VC-backed startups',
      },
      {
        area: 'Privacy',
        description: 'CCPA compliance for California users',
      },
    ],
    events: [
      {
        name: 'TechCrunch Disrupt',
        type: 'Conference (annual)',
      },
    ],
  };
}

function getInvestorsForLocation(location: string, type: string) {
  // Returns different investors based on onboarding type
  if (location === 'spain') {
    if (type === 'generative' || type === 'idea') {
      return [
        {
          name: 'K Fund',
          type: 'VC',
          focus: 'Pre-seed, Seed (€500K-€3M)',
          website: 'kfund.vc',
        },
        {
          name: 'Samaipata',
          type: 'VC',
          focus: 'Seed (€1M-€5M)',
          website: 'samaipata.vc',
        },
      ];
    } else {
      // existing
      return [
        {
          name: 'Seaya Ventures',
          type: 'VC',
          focus: 'Series A-B (€5M-€20M)',
          website: 'seaya.vc',
        },
        {
          name: 'Point Nine Capital',
          type: 'VC',
          focus: 'Series A SaaS (€3M-€10M)',
          website: 'pointnine.com',
        },
      ];
    }
  }

  // USA
  if (type === 'generative' || type === 'idea') {
    return [
      {
        name: 'Y Combinator',
        type: 'Accelerator + VC',
        focus: 'Pre-seed ($500K)',
        website: 'ycombinator.com',
      },
      {
        name: 'First Round Capital',
        type: 'VC',
        focus: 'Seed ($1M-$3M)',
        website: 'firstround.com',
      },
    ];
  } else {
    // existing
    return [
      {
        name: 'Sequoia Capital',
        type: 'VC',
        focus: 'Series A+ ($10M-$50M+)',
        website: 'sequoiacap.com',
      },
      {
        name: 'Andreessen Horowitz',
        type: 'VC',
        focus: 'Series A-B ($10M-$100M)',
        website: 'a16z.com',
      },
    ];
  }
}
