/**
 * 🎯 BUSINESS MODEL CANVAS AI GENERATOR
 *
 * Generates a complete Business Model Canvas based on:
 * - Onboarding type (generative, idea, existing)
 * - Business description/pitch
 * - Industry/vertical
 * - Extracted data from URLs/integrations
 */

export interface BusinessModelCanvas {
  // Left side
  key_partners: string[];
  key_activities: string[];
  key_resources: string[];

  // Center
  value_propositions: string[];

  // Right side
  customer_relationships: string[];
  channels: string[];
  customer_segments: string[];

  // Bottom
  cost_structure: string[];
  revenue_streams: string[];

  // Metadata
  confidence_score: number; // 0-100
  generated_at: string;
}

interface GeneratorInput {
  onboarding_type: 'generative' | 'idea' | 'existing';
  business_description?: string;
  industry?: string;
  extracted_data?: Record<string, unknown>;
  existing_metrics?: {
    mrr?: number;
    customers?: number;
    team_size?: number;
  };
}

/**
 * Generate Business Model Canvas
 *
 * In production: This would call OpenAI GPT-4 to generate the canvas
 * For now: Returns intelligent mock data based on inputs
 */
export async function generateBusinessModelCanvas(
  input: GeneratorInput
): Promise<BusinessModelCanvas> {
  // Simulate AI processing time
  await new Promise(resolve => setTimeout(resolve, 1500));

  // In production: Call OpenAI API
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     {
  //       role: "system",
  //       content: "You are a business strategy expert. Generate a detailed Business Model Canvas."
  //     },
  //     {
  //       role: "user",
  //       content: `Generate a Business Model Canvas for: ${JSON.stringify(input)}`
  //     }
  //   ]
  // });

  // Mock data based on onboarding type
  const canvas = getCanvasTemplate(input);

  return {
    ...canvas,
    confidence_score: calculateConfidenceScore(input),
    generated_at: new Date().toISOString(),
  };
}

function getCanvasTemplate(input: GeneratorInput): Omit<BusinessModelCanvas, 'confidence_score' | 'generated_at'> {
  const { onboarding_type, industry, business_description, existing_metrics } = input;

  // Base template - customize based on inputs
  if (onboarding_type === 'generative') {
    return getGenerativeTemplate(industry);
  } else if (onboarding_type === 'idea') {
    return getIdeaTemplate(business_description, industry);
  } else {
    return getExistingTemplate(existing_metrics);
  }
}

function getGenerativeTemplate(industry?: string): Omit<BusinessModelCanvas, 'confidence_score' | 'generated_at'> {
  // Example for SaaS industry
  if (industry?.toLowerCase().includes('saas') || industry?.toLowerCase().includes('software')) {
    return {
      key_partners: [
        'Cloud infrastructure providers (AWS, GCP)',
        'Payment processors (Stripe, PayPal)',
        'Marketing agencies for growth',
        'Technology partners for integrations'
      ],
      key_activities: [
        'Product development & engineering',
        'Customer onboarding & success',
        'Content marketing & SEO',
        'Sales & lead generation'
      ],
      key_resources: [
        'Engineering team (5-10 developers)',
        'Cloud infrastructure',
        'Proprietary technology & IP',
        'Customer data & insights'
      ],
      value_propositions: [
        'AI-powered automation saves 10+ hours/week',
        'Easy to use - no technical skills required',
        '99.9% uptime SLA',
        'Seamless integrations with 50+ tools'
      ],
      customer_relationships: [
        'Self-service onboarding with guided tutorials',
        '24/7 chat support',
        'Dedicated success manager for enterprise',
        'Community forum & knowledge base'
      ],
      channels: [
        'Website with free trial signup',
        'Content marketing (blog, SEO)',
        'Social media (LinkedIn, Twitter)',
        'Product Hunt & startup communities',
        'Referral program'
      ],
      customer_segments: [
        'Small businesses (10-50 employees)',
        'Solopreneurs & freelancers',
        'Startups in growth phase',
        'Remote-first teams'
      ],
      cost_structure: [
        'Engineering & product development (40%)',
        'Cloud infrastructure & hosting (15%)',
        'Sales & marketing (30%)',
        'Customer support (10%)',
        'Admin & operations (5%)'
      ],
      revenue_streams: [
        'Monthly subscription ($29-$99/mo)',
        'Annual plan with 20% discount',
        'Enterprise custom pricing',
        'Add-on features & integrations'
      ]
    };
  }

  // Default template for other industries
  return {
    key_partners: [
      'Strategic industry partners',
      'Technology providers',
      'Distribution channels',
      'Key suppliers'
    ],
    key_activities: [
      'Product/service delivery',
      'Marketing & sales',
      'Customer support',
      'Operations management'
    ],
    key_resources: [
      'Team & talent',
      'Technology & tools',
      'Brand & intellectual property',
      'Capital & funding'
    ],
    value_propositions: [
      'Solves key customer pain point',
      'Better quality than alternatives',
      'Competitive pricing',
      'Excellent customer experience'
    ],
    customer_relationships: [
      'Personalized service',
      'Self-service options',
      'Community building',
      'Customer success program'
    ],
    channels: [
      'Direct sales',
      'Online platform',
      'Partner network',
      'Social media & content'
    ],
    customer_segments: [
      'Primary target segment',
      'Secondary market',
      'Enterprise customers',
      'SMB market'
    ],
    cost_structure: [
      'Fixed costs (salaries, rent)',
      'Variable costs (production)',
      'Marketing & acquisition',
      'Technology & infrastructure'
    ],
    revenue_streams: [
      'Primary revenue model',
      'Secondary income stream',
      'Upsells & cross-sells',
      'Recurring revenue'
    ]
  };
}

function getIdeaTemplate(
  description?: string,
  industry?: string
): Omit<BusinessModelCanvas, 'confidence_score' | 'generated_at'> {
  // In production: Parse description with GPT-4 to customize
  // For now: Return intelligent defaults based on keywords

  const isMobile = description?.toLowerCase().includes('mobile') || description?.toLowerCase().includes('app');
  const isAI = description?.toLowerCase().includes('ai') || description?.toLowerCase().includes('machine learning');
  const isMarketplace = description?.toLowerCase().includes('marketplace') || description?.toLowerCase().includes('platform');

  if (isMobile) {
    return {
      key_partners: [
        'App stores (Apple, Google)',
        'Payment processors',
        'Push notification services',
        'Analytics providers'
      ],
      key_activities: [
        'Mobile app development',
        'User acquisition & retention',
        'App store optimization',
        'Feature development'
      ],
      key_resources: [
        'Mobile dev team',
        'Backend infrastructure',
        'User data & insights',
        'App store presence'
      ],
      value_propositions: [
        'Mobile-first experience',
        'Works offline',
        'Fast & intuitive',
        'Push notifications for engagement'
      ],
      customer_relationships: [
        'In-app messaging',
        'Push notifications',
        'Email support',
        'App store reviews'
      ],
      channels: [
        'App Store & Google Play',
        'Social media ads',
        'Influencer partnerships',
        'Word of mouth'
      ],
      customer_segments: [
        'Mobile-first users',
        'Gen Z & Millennials',
        'On-the-go professionals',
        'Early adopters'
      ],
      cost_structure: [
        'Mobile development (35%)',
        'Backend & hosting (20%)',
        'User acquisition (30%)',
        'Support & ops (15%)'
      ],
      revenue_streams: [
        'Freemium model',
        'In-app purchases',
        'Premium subscriptions',
        'Ads (optional)'
      ]
    };
  }

  // Default for idea stage
  return getGenerativeTemplate(industry);
}

function getExistingTemplate(
  metrics?: GeneratorInput['existing_metrics']
): Omit<BusinessModelCanvas, 'confidence_score' | 'generated_at'> {
  // Customize based on actual business metrics
  const isScaled = (metrics?.mrr || 0) > 10000;
  const hasTeam = (metrics?.team_size || 0) > 5;

  return {
    key_partners: [
      'Payment processor (Stripe)',
      isScaled ? 'Enterprise partners' : 'Early design partners',
      'Technology vendors',
      hasTeam ? 'Recruiting agencies' : 'Freelancer platforms'
    ],
    key_activities: [
      'Product development',
      'Customer acquisition',
      isScaled ? 'Customer success' : 'Customer onboarding',
      hasTeam ? 'Team management' : 'Hands-on operations'
    ],
    key_resources: [
      `Team of ${metrics?.team_size || 1}`,
      'Existing customer base',
      'Product & technology',
      'Revenue & cash flow'
    ],
    value_propositions: [
      'Proven solution with existing customers',
      `Serving ${metrics?.customers || 0} happy customers`,
      'Continuous improvement & updates',
      'Responsive support team'
    ],
    customer_relationships: [
      'Direct support',
      'Customer success check-ins',
      isScaled ? 'Account managers' : 'Founder-led support',
      'User community'
    ],
    channels: [
      'Website & SEO',
      'Customer referrals',
      isScaled ? 'Sales team' : 'Founder sales',
      'Content marketing'
    ],
    customer_segments: [
      'Current customer base',
      'Similar companies in same industry',
      isScaled ? 'Enterprise market' : 'SMB focus',
      'Expansion opportunities'
    ],
    cost_structure: [
      `Team salaries (${hasTeam ? '50%' : '30%'})`,
      'Infrastructure & tools (15%)',
      'Marketing & sales (20%)',
      'Operations (15%)'
    ],
    revenue_streams: [
      `Recurring revenue: $${(metrics?.mrr || 0).toLocaleString()}/mo`,
      'Subscription model',
      isScaled ? 'Enterprise contracts' : 'SMB subscriptions',
      'Potential upsells'
    ]
  };
}

function calculateConfidenceScore(input: GeneratorInput): number {
  let score = 60; // Base score

  // More data = higher confidence
  if (input.business_description && input.business_description.length > 50) score += 10;
  if (input.industry) score += 5;
  if (input.extracted_data) score += 15;
  if (input.existing_metrics?.mrr) score += 10;

  return Math.min(score, 95); // Cap at 95% (never 100% without human validation)
}
