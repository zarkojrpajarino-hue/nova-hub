/**
 * 👤 BUYER PERSONA AI GENERATOR
 *
 * Generates 2-3 detailed buyer personas based on:
 * - Target market description
 * - Industry vertical
 * - Existing customer data
 * - Competitive analysis
 */

export interface BuyerPersona {
  name: string;
  role: string;
  age: string;
  location: string;
  company_size?: string;
  industry?: string;

  // Demographics
  demographics: {
    income_range?: string;
    education?: string;
    family_status?: string;
  };

  // Psychographics
  goals: string[];
  pain_points: string[];
  motivations: string[];
  frustrations: string[];

  // Behavioral
  buying_behavior: {
    decision_making_process: string;
    budget_authority: string;
    research_channels: string[];
    preferred_communication: string[];
  };

  // Product fit
  how_we_help: string[];
  key_messaging: string[];
  objections: string[];

  // Metadata
  persona_type: 'primary' | 'secondary' | 'tertiary';
  confidence_score: number;
}

interface GeneratorInput {
  onboarding_type: 'generative' | 'idea' | 'existing';
  business_description?: string;
  target_market?: string;
  industry?: string;
  customer_data?: {
    existing_customers?: number;
    top_segments?: string[];
    common_use_cases?: string[];
  };
}

/**
 * Generate 2-3 buyer personas
 */
export async function generateBuyerPersonas(
  input: GeneratorInput
): Promise<BuyerPersona[]> {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 1800));

  // In production: Call OpenAI GPT-4
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     {
  //       role: "system",
  //       content: "You are an expert in customer research and buyer persona development."
  //     },
  //     {
  //       role: "user",
  //       content: `Generate 2-3 detailed buyer personas for: ${JSON.stringify(input)}`
  //     }
  //   ],
  //   response_format: { type: "json_object" }
  // });

  // Generate personas based on input
  return getPersonasForType(input);
}

function getPersonasForType(input: GeneratorInput): BuyerPersona[] {
  const { onboarding_type, industry, target_market, customer_data } = input;

  // B2B SaaS personas
  if (industry?.toLowerCase().includes('saas') || industry?.toLowerCase().includes('b2b')) {
    return [
      {
        name: 'Sarah - The Product Manager',
        role: 'Senior Product Manager',
        age: '32-38',
        location: 'Urban tech hub (SF, NYC, London)',
        company_size: '50-500 employees',
        industry: 'Tech/SaaS',
        demographics: {
          income_range: '$120k-$180k',
          education: 'Bachelor\'s or Master\'s in Business/CS',
          family_status: 'Married, 1-2 kids'
        },
        goals: [
          'Ship features faster without sacrificing quality',
          'Improve team productivity and collaboration',
          'Get promoted to Director/VP of Product',
          'Reduce time spent on manual tasks'
        ],
        pain_points: [
          'Too many tools, nothing talks to each other',
          'Wasting 10+ hours/week on manual work',
          'Hard to get buy-in from stakeholders',
          'Team constantly context-switching'
        ],
        motivations: [
          'Career advancement',
          'Making measurable impact',
          'Learning new skills',
          'Work-life balance'
        ],
        frustrations: [
          'Bloated software with features they don\'t need',
          'Long implementation times',
          'Poor customer support',
          'Unexpected price increases'
        ],
        buying_behavior: {
          decision_making_process: 'Research online → Trial → Team feedback → Manager approval → Purchase',
          budget_authority: 'Can approve up to $5k, needs VP approval for more',
          research_channels: [
            'Google search',
            'Product Hunt',
            'Peer recommendations',
            'LinkedIn',
            'Industry blogs'
          ],
          preferred_communication: [
            'Email',
            'Slack',
            'Video calls',
            'In-app messaging'
          ]
        },
        how_we_help: [
          'Save 10+ hours/week with automation',
          'One tool replaces 3-4 separate tools',
          'Free trial with instant value',
          'Integrates with their existing stack'
        ],
        key_messaging: [
          '"Spend less time on busywork, more time shipping"',
          '"Used by 10,000+ product teams"',
          '"Setup in 5 minutes, not 5 days"'
        ],
        objections: [
          '"We already have too many tools"',
          '"Our team won\'t adopt another tool"',
          '"It\'s too expensive"'
        ],
        persona_type: 'primary',
        confidence_score: 85
      },
      {
        name: 'Mike - The Founder',
        role: 'Founder/CEO',
        age: '28-35',
        location: 'Anywhere (remote-first)',
        company_size: '1-10 employees',
        industry: 'Startup/Early-stage',
        demographics: {
          income_range: '$0-$80k (pre-funding)',
          education: 'College dropout or Bachelor\'s',
          family_status: 'Single or married, no kids yet'
        },
        goals: [
          'Reach product-market fit',
          'Raise seed/Series A funding',
          'Grow to $10k MRR',
          'Build a remote team'
        ],
        pain_points: [
          'Wearing too many hats',
          'Limited budget for tools',
          'Need to move fast with small team',
          'Hard to compete with funded competitors'
        ],
        motivations: [
          'Building something meaningful',
          'Financial independence',
          'Solving a problem they experienced',
          'Proving doubters wrong'
        ],
        frustrations: [
          'Enterprise sales cycles',
          'Tools designed for big companies',
          'Vendor lock-in',
          'Hidden fees and price increases'
        ],
        buying_behavior: {
          decision_making_process: 'Quick trial → If it works, buy immediately',
          budget_authority: 'Full authority, but limited budget',
          research_channels: [
            'Indie Hackers',
            'Twitter',
            'Product Hunt',
            'Founder communities',
            'Reddit'
          ],
          preferred_communication: [
            'Twitter DM',
            'Email',
            'Quick video calls'
          ]
        },
        how_we_help: [
          'Startup-friendly pricing ($29/mo)',
          'No credit card required for trial',
          'Built by founders, for founders',
          'One person can do the work of three'
        ],
        key_messaging: [
          '"From idea to launch in weeks, not months"',
          '"Used by 1,000+ bootstrapped startups"',
          '"Cancel anytime, no questions asked"'
        ],
        objections: [
          '"I\'ll build it myself"',
          '"I don\'t have budget right now"',
          '"Too early for us"'
        ],
        persona_type: 'secondary',
        confidence_score: 80
      },
      {
        name: 'Jessica - The Operations Lead',
        role: 'Head of Operations',
        age: '35-45',
        location: 'Major cities',
        company_size: '100-1000 employees',
        industry: 'Various (growth-stage companies)',
        demographics: {
          income_range: '$140k-$200k',
          education: 'MBA or equivalent',
          family_status: 'Married, 2-3 kids'
        },
        goals: [
          'Streamline operations across departments',
          'Reduce operational costs by 20%',
          'Enable team to scale without headcount',
          'Implement data-driven processes'
        ],
        pain_points: [
          'Siloed tools across departments',
          'No single source of truth for data',
          'Manual reporting takes days',
          'Hard to get executive buy-in'
        ],
        motivations: [
          'Efficiency and optimization',
          'Data-driven decision making',
          'Building scalable systems',
          'Career stability'
        ],
        frustrations: [
          'Lack of integrations',
          'Poor vendor support',
          'Long implementation cycles',
          'Tools that don\'t scale'
        ],
        buying_behavior: {
          decision_making_process: 'RFP → Vendor demos → Pilot program → Executive approval → Procurement',
          budget_authority: 'Influences budget, CFO approves',
          research_channels: [
            'G2/Capterra reviews',
            'Peer networks',
            'Industry conferences',
            'LinkedIn',
            'Vendor demos'
          ],
          preferred_communication: [
            'Email',
            'Scheduled calls',
            'Slack for quick questions'
          ]
        },
        how_we_help: [
          'Enterprise-grade security & compliance',
          'Dedicated account manager',
          'Custom integrations available',
          'ROI calculator shows cost savings'
        ],
        key_messaging: [
          '"Trusted by Fortune 500 companies"',
          '"SOC 2 Type II certified"',
          '"Average 10x ROI in first year"'
        ],
        objections: [
          '"We need on-premise deployment"',
          '"Our compliance team needs to review"',
          '"We have a contract with current vendor"'
        ],
        persona_type: 'tertiary',
        confidence_score: 75
      }
    ];
  }

  // E-commerce personas
  if (industry?.toLowerCase().includes('ecommerce') || industry?.toLowerCase().includes('retail')) {
    return [
      {
        name: 'Emma - The Online Shopper',
        role: 'Marketing Manager (day job)',
        age: '28-35',
        location: 'Suburban/Urban',
        demographics: {
          income_range: '$60k-$90k',
          education: 'Bachelor\'s degree',
          family_status: 'Single or married, no kids'
        },
        goals: [
          'Find unique products not available in stores',
          'Get best value for money',
          'Shop conveniently from home',
          'Discover new brands'
        ],
        pain_points: [
          'Shipping takes too long',
          'Returns are complicated',
          'Can\'t trust product reviews',
          'Too many options, decision fatigue'
        ],
        motivations: [
          'Convenience',
          'Social proof (influencer recommendations)',
          'Exclusive deals',
          'Fast shipping'
        ],
        frustrations: [
          'Hidden fees at checkout',
          'Poor mobile experience',
          'No customer service',
          'Product doesn\'t match photos'
        ],
        buying_behavior: {
          decision_making_process: 'Instagram/TikTok discovery → Research reviews → Add to cart → Wait for sale → Purchase',
          budget_authority: 'Full (personal purchase)',
          research_channels: [
            'Instagram',
            'TikTok',
            'Google reviews',
            'YouTube unboxings',
            'Friends recommendations'
          ],
          preferred_communication: [
            'Instagram DM',
            'Email',
            'Live chat'
          ]
        },
        how_we_help: [
          'Free shipping over $50',
          'Easy 30-day returns',
          'Real customer photos & reviews',
          'Fast checkout (Apple Pay, Shop Pay)'
        ],
        key_messaging: [
          '"10,000+ 5-star reviews"',
          '"Ships same day before 2pm"',
          '"Love it or return it free"'
        ],
        objections: [
          '"I\'ve never heard of this brand"',
          '"Shipping is too expensive"',
          '"I can get it cheaper on Amazon"'
        ],
        persona_type: 'primary',
        confidence_score: 82
      }
    ];
  }

  // Default fallback personas
  return [
    {
      name: 'Alex - The Early Adopter',
      role: 'Professional',
      age: '30-40',
      location: 'Urban areas',
      demographics: {
        income_range: '$80k-$150k',
        education: 'College educated',
        family_status: 'Varies'
      },
      goals: [
        'Stay ahead of the curve',
        'Improve productivity',
        'Learn new skills',
        'Network with peers'
      ],
      pain_points: [
        'Current solution is outdated',
        'Missing key features',
        'Poor user experience',
        'No mobile support'
      ],
      motivations: [
        'Innovation',
        'Efficiency',
        'Status',
        'Problem-solving'
      ],
      frustrations: [
        'Slow customer support',
        'Lack of updates',
        'Poor documentation',
        'Expensive pricing'
      ],
      buying_behavior: {
        decision_making_process: 'Research → Trial → Purchase',
        budget_authority: 'Medium',
        research_channels: [
          'Online reviews',
          'Social media',
          'Peer recommendations',
          'Industry blogs'
        ],
        preferred_communication: [
          'Email',
          'Chat',
          'Phone'
        ]
      },
      how_we_help: [
        'Modern solution',
        'Great UX',
        'Regular updates',
        'Responsive support'
      ],
      key_messaging: [
        '"Built for modern professionals"',
        '"Try free for 14 days"',
        '"Used by 10,000+ customers"'
      ],
      objections: [
        '"Too expensive"',
        '"Too complicated"',
        '"We\'re happy with current solution"'
      ],
      persona_type: 'primary',
      confidence_score: 70
    }
  ];
}
