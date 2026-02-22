/**
 * 💰 SALES PLAYBOOK AI GENERATOR
 *
 * Generates a complete sales playbook including:
 * - Sales process/methodology
 * - Ideal customer profile (ICP)
 * - Key messaging & value props
 * - Objection handling
 * - Sales scripts & templates
 * - Pricing & packaging strategy
 */

export interface SalesPlaybook {
  // ICP Definition
  ideal_customer_profile: {
    company_size: string;
    industry: string[];
    decision_maker_role: string;
    budget_range: string;
    pain_points: string[];
    buying_signals: string[];
  };

  // Sales Process
  sales_process: {
    step_name: string;
    description: string;
    duration: string;
    key_activities: string[];
    success_metrics: string[];
  }[];

  // Messaging
  key_messaging: {
    elevator_pitch: string;
    value_propositions: string[];
    unique_differentiators: string[];
    proof_points: string[];
  };

  // Objection Handling
  objection_handling: {
    objection: string;
    response: string;
    follow_up: string;
  }[];

  // Sales Scripts
  scripts: {
    cold_email: string;
    discovery_questions: string[];
    demo_outline: string[];
    closing_questions: string[];
  };

  // Pricing Strategy
  pricing_strategy: {
    model: string;
    tiers: {
      name: string;
      price: string;
      target_segment: string;
      key_features: string[];
    }[];
    discount_policy: string;
    payment_terms: string;
  };

  // Sales Metrics & Goals
  targets: {
    avg_deal_size: string;
    sales_cycle_length: string;
    win_rate_target: string;
    monthly_quota: string;
  };

  // Metadata
  confidence_score: number;
  generated_at: string;
}

interface GeneratorInput {
  onboarding_type: 'generative' | 'idea' | 'existing';
  business_description?: string;
  value_proposition?: string;
  target_market?: string;
  industry?: string;
  pricing?: {
    model?: string;
    price_point?: string;
  };
  buyer_personas?: Record<string, unknown>[]; // From buyer persona generator
}

/**
 * Generate Sales Playbook
 */
export async function generateSalesPlaybook(
  input: GeneratorInput
): Promise<SalesPlaybook> {
  // Simulate AI processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // In production: Call OpenAI GPT-4
  // const response = await openai.chat.completions.create({
  //   model: "gpt-4",
  //   messages: [
  //     {
  //       role: "system",
  //       content: "You are a sales strategy expert. Generate a comprehensive sales playbook."
  //     },
  //     {
  //       role: "user",
  //       content: `Generate a sales playbook for: ${JSON.stringify(input)}`
  //     }
  //   ],
  //   response_format: { type: "json_object" }
  // });

  const playbook = getPlaybookTemplate(input);

  return {
    ...playbook,
    confidence_score: calculateConfidenceScore(input),
    generated_at: new Date().toISOString(),
  };
}

function getPlaybookTemplate(input: GeneratorInput): Omit<SalesPlaybook, 'confidence_score' | 'generated_at'> {
  const { onboarding_type: _onboarding_type, industry, value_proposition, pricing } = input;

  // B2B SaaS Playbook
  if (industry?.toLowerCase().includes('saas') || industry?.toLowerCase().includes('b2b')) {
    return {
      ideal_customer_profile: {
        company_size: '10-500 employees',
        industry: ['Technology', 'Professional Services', 'E-commerce'],
        decision_maker_role: 'Head of Product, VP of Engineering, CTO',
        budget_range: '$5k-$50k annual contract',
        pain_points: [
          'Manual processes eating up time',
          'Team using disconnected tools',
          'No visibility into key metrics',
          'Scaling challenges'
        ],
        buying_signals: [
          'Currently evaluating alternatives',
          'Recently raised funding',
          'Hiring for relevant roles',
          'Complaining about current tool on social media'
        ]
      },

      sales_process: [
        {
          step_name: '1. Prospecting & Outreach',
          description: 'Identify and reach out to qualified leads',
          duration: '1-3 days',
          key_activities: [
            'Research target company & decision maker',
            'Send personalized cold email',
            'LinkedIn connection + warm message',
            'Follow up 2-3 times if no response'
          ],
          success_metrics: [
            '30%+ open rate on emails',
            '10%+ response rate',
            'Book 5 discovery calls per week'
          ]
        },
        {
          step_name: '2. Discovery Call',
          description: 'Understand needs and qualify opportunity',
          duration: '30 minutes',
          key_activities: [
            'Ask discovery questions (see scripts)',
            'Identify pain points & budget',
            'Introduce solution at high level',
            'Book demo if qualified'
          ],
          success_metrics: [
            '60%+ show rate',
            '50%+ convert to demo',
            'BANT criteria confirmed'
          ]
        },
        {
          step_name: '3. Product Demo',
          description: 'Show how we solve their specific problems',
          duration: '45 minutes',
          key_activities: [
            'Recap their pain points',
            'Show relevant features only',
            'Use their data in demo if possible',
            'Leave time for Q&A'
          ],
          success_metrics: [
            '70%+ positive feedback',
            '40%+ request trial/POC',
            'Multi-stakeholder attendance'
          ]
        },
        {
          step_name: '4. Free Trial / POC',
          description: 'Let them experience value hands-on',
          duration: '14 days',
          key_activities: [
            'Onboard within 24 hours',
            'Check-in on day 3, 7, 10',
            'Share best practices & tips',
            'Schedule review call before end'
          ],
          success_metrics: [
            '80%+ activation rate',
            '60%+ achieve aha moment',
            '40%+ convert to paid'
          ]
        },
        {
          step_name: '5. Proposal & Negotiation',
          description: 'Present pricing and close the deal',
          duration: '3-7 days',
          key_activities: [
            'Send custom proposal',
            'Address objections proactively',
            'Offer small discount if needed',
            'Get verbal commitment'
          ],
          success_metrics: [
            '50%+ win rate',
            '$10k+ average deal size',
            '30-day avg sales cycle'
          ]
        },
        {
          step_name: '6. Closing & Onboarding',
          description: 'Sign contract and ensure smooth start',
          duration: '5-10 days',
          key_activities: [
            'Send contract via DocuSign',
            'Coordinate with CS team',
            'Schedule kickoff call',
            'Send welcome email with resources'
          ],
          success_metrics: [
            '100% contracts signed within 5 days',
            '90%+ customer satisfaction',
            '< 10% churn in first 90 days'
          ]
        }
      ],

      key_messaging: {
        elevator_pitch: value_proposition || 'We help product teams ship faster by automating busywork and connecting their tools. Companies using our platform save 10+ hours per week and ship 2x more features.',
        value_propositions: [
          'Save 10+ hours per week on manual tasks',
          'One tool replaces 3-4 disconnected tools',
          'Set up in 5 minutes, not 5 days',
          'Trusted by 10,000+ teams worldwide'
        ],
        unique_differentiators: [
          'AI-powered automation (competitors are manual)',
          'Built for remote teams (competitors are office-first)',
          'Startup-friendly pricing (competitors target enterprise)',
          'Modern, beautiful UI (competitors look outdated)'
        ],
        proof_points: [
          '10,000+ active teams',
          '4.8/5 stars on G2 (500+ reviews)',
          'Used by Shopify, Stripe, Linear',
          'SOC 2 Type II certified',
          '99.9% uptime SLA'
        ]
      },

      objection_handling: [
        {
          objection: '"We already use [Competitor]"',
          response: 'That\'s great - many of our customers switched from [Competitor]. What made you take this call? (Let them share frustrations). The main reasons teams switch to us are: [list 2-3 key differentiators relevant to their pain].',
          follow_up: 'Would it make sense to do a side-by-side comparison during a quick demo?'
        },
        {
          objection: '"We don\'t have budget right now"',
          response: 'I totally understand - budget timing can be tricky. When does your new budget cycle start? (Qualify: Is this a timing issue or a priority issue?). Many teams start with our free trial to prove ROI first, then get budget approved once they see results.',
          follow_up: 'What if we could show you how to save more than our cost in the first month? Would that change the equation?'
        },
        {
          objection: '"It\'s too expensive"',
          response: 'I appreciate you being direct about pricing. Can I ask - compared to what? (Understand their frame of reference). When you factor in the 10+ hours saved per team member per week at $X per hour, most teams see 10x ROI in month one. Plus, you\'re replacing [2-3 tools] that each cost $Y/month.',
          follow_up: 'Would it help if I showed you a quick ROI calculator based on your team size?'
        },
        {
          objection: '"We need to think about it"',
          response: 'Of course - this is an important decision. Can I ask what specifically you need to think about? (Uncover real objection). Is it the pricing, the features, getting buy-in from your team, or something else?',
          follow_up: 'What would need to happen for you to feel confident moving forward? Let\'s tackle those items together.'
        },
        {
          objection: '"Our team won\'t adopt another tool"',
          response: 'That\'s a super valid concern - we hear that a lot. The good news is our onboarding is designed to get your team value in the first 5 minutes, not 5 days. Plus, it replaces tools they\'re already using, so it\'s actually reducing tool sprawl.',
          follow_up: 'What if we did a team trial where I personally onboard your key users? That way you can see adoption firsthand.'
        }
      ],

      scripts: {
        cold_email: `Subject: Quick question about [their product/team]

Hi [Name],

I came across [Company] and was impressed by [specific thing - product launch, funding, growth metric].

I'm reaching out because I work with [similar companies in their space] who struggle with [specific pain point]. We built [Your Product] to help teams like yours [key benefit].

Would it make sense to chat for 15 minutes next week? I'd love to learn more about how [their team/product] operates and share how we've helped companies like [Social Proof] achieve [specific result].

Best,
[Your Name]

P.S. - Here's a 2-min demo video if you want to see what it looks like: [link]`,

        discovery_questions: [
          'Walk me through how your team currently handles [their workflow] - what does a typical day look like?',
          'What\'s working well with your current setup? What\'s frustrating?',
          'If you could wave a magic wand and fix one thing about [their process], what would it be?',
          'How much time does your team spend on [manual task] per week?',
          'Who else is involved in this decision? What are their top priorities?',
          'What\'s the cost of not solving this problem - in time, money, or opportunity?',
          'What\'s your timeline for making a change? What\'s driving that?',
          'Have you looked at other solutions? What did you like/not like about them?',
          'If we could [solve specific pain point], what would that mean for your team/business?',
          'What budget have you allocated for solving this problem?'
        ],

        demo_outline: [
          'Quick intro (1 min) - "Today I want to show you exactly how we solve [their pain point]"',
          'Recap their situation (2 min) - Show you listened in discovery',
          'Core workflow demo (20 min) - Focus on THEIR use case, not every feature',
          'Show quick win (5 min) - "Here\'s how you\'d get value in the first 5 minutes"',
          'Address concerns (5 min) - Tackle objections proactively',
          'Social proof (3 min) - "[Similar company] saw [specific result] in [timeframe]"',
          'Next steps (4 min) - Clear CTA: "Let\'s get you started with a trial"',
          'Q&A (10 min) - Answer questions, book follow-up'
        ],

        closing_questions: [
          '"Based on what you\'ve seen, does this solve the problem you described?"',
          '"What would success look like for you in the first 30/60/90 days?"',
          '"Is there anything holding you back from moving forward?"',
          '"Who else needs to be involved before we can get started?"',
          '"What happens if you don\'t solve this problem in the next 3-6 months?"',
          '"If pricing works, are you ready to move forward today?"',
          '"On a scale of 1-10, how confident are you this is the right solution? What would make it a 10?"'
        ]
      },

      pricing_strategy: {
        model: pricing?.model || 'Subscription (SaaS)',
        tiers: [
          {
            name: 'Starter',
            price: '$29/user/month (billed annually)',
            target_segment: 'Solopreneurs, freelancers, 1-5 person teams',
            key_features: [
              'Core features',
              'Up to 5 users',
              'Email support',
              '5 integrations',
              '30-day money-back guarantee'
            ]
          },
          {
            name: 'Professional',
            price: '$79/user/month (billed annually)',
            target_segment: 'Growing teams, 5-50 people',
            key_features: [
              'Everything in Starter',
              'Unlimited users',
              'Priority support',
              'Unlimited integrations',
              'Advanced analytics',
              'Custom branding'
            ]
          },
          {
            name: 'Enterprise',
            price: 'Custom pricing (starts at $30k/year)',
            target_segment: 'Large companies, 50+ people',
            key_features: [
              'Everything in Professional',
              'Dedicated account manager',
              'SSO & advanced security',
              'Custom integrations',
              'SLA guarantees',
              '24/7 phone support',
              'Onboarding & training'
            ]
          }
        ],
        discount_policy: 'Up to 20% discount for annual pre-pay. No discounts for monthly plans. Enterprise deals negotiable.',
        payment_terms: 'Net 30 for annual contracts. Immediate for monthly. Credit card or ACH.'
      },

      targets: {
        avg_deal_size: '$5,000 ARR (Professional tier)',
        sales_cycle_length: '30 days from first touch to close',
        win_rate_target: '25% from discovery call',
        monthly_quota: '$50k in new ARR (10 deals)'
      }
    };
  }

  // Default playbook for other industries
  return {
    ideal_customer_profile: {
      company_size: 'Varies by business',
      industry: [industry || 'Various'],
      decision_maker_role: 'Key stakeholder',
      budget_range: '$1k-$10k',
      pain_points: ['Problem 1', 'Problem 2', 'Problem 3'],
      buying_signals: ['Signal 1', 'Signal 2']
    },
    sales_process: [
      {
        step_name: 'Prospecting',
        description: 'Find and qualify leads',
        duration: '1-5 days',
        key_activities: ['Research', 'Outreach', 'Qualify'],
        success_metrics: ['Response rate', 'Qualification rate']
      },
      {
        step_name: 'Discovery',
        description: 'Understand needs',
        duration: '1-2 days',
        key_activities: ['Ask questions', 'Identify pain', 'Build rapport'],
        success_metrics: ['Conversion to next step']
      },
      {
        step_name: 'Proposal',
        description: 'Present solution',
        duration: '3-7 days',
        key_activities: ['Create proposal', 'Present value', 'Address concerns'],
        success_metrics: ['Win rate', 'Deal size']
      },
      {
        step_name: 'Closing',
        description: 'Finalize agreement',
        duration: '5-10 days',
        key_activities: ['Negotiate', 'Handle objections', 'Sign contract'],
        success_metrics: ['Close rate', 'Time to close']
      }
    ],
    key_messaging: {
      elevator_pitch: value_proposition || 'We help customers achieve [outcome] by [method].',
      value_propositions: ['Value prop 1', 'Value prop 2', 'Value prop 3'],
      unique_differentiators: ['Differentiator 1', 'Differentiator 2'],
      proof_points: ['Social proof 1', 'Social proof 2']
    },
    objection_handling: [
      {
        objection: '"It\'s too expensive"',
        response: 'I understand. Let me show you the ROI...',
        follow_up: 'Would a payment plan help?'
      },
      {
        objection: '"We need to think about it"',
        response: 'Of course. What specifically do you need to consider?',
        follow_up: 'Let\'s address those concerns together.'
      }
    ],
    scripts: {
      cold_email: 'Hi [Name],\n\nQuick question about [topic]...',
      discovery_questions: [
        'What challenges are you facing?',
        'What have you tried so far?',
        'What would success look like?'
      ],
      demo_outline: ['Intro', 'Demo core features', 'Q&A', 'Next steps'],
      closing_questions: [
        'Does this solve your problem?',
        'What\'s holding you back?',
        'Are you ready to move forward?'
      ]
    },
    pricing_strategy: {
      model: pricing?.model || 'Subscription',
      tiers: [
        {
          name: 'Basic',
          price: '$49/month',
          target_segment: 'Individuals',
          key_features: ['Feature 1', 'Feature 2']
        },
        {
          name: 'Pro',
          price: '$99/month',
          target_segment: 'Small teams',
          key_features: ['All Basic features', 'Feature 3', 'Feature 4']
        }
      ],
      discount_policy: '10-20% for annual pre-pay',
      payment_terms: 'Net 30'
    },
    targets: {
      avg_deal_size: '$2,000',
      sales_cycle_length: '30 days',
      win_rate_target: '20%',
      monthly_quota: '$20k'
    }
  };
}

function calculateConfidenceScore(input: GeneratorInput): number {
  let score = 65;

  if (input.value_proposition) score += 10;
  if (input.target_market) score += 10;
  if (input.buyer_personas && input.buyer_personas.length > 0) score += 10;
  if (input.pricing?.price_point) score += 5;

  return Math.min(score, 92);
}
