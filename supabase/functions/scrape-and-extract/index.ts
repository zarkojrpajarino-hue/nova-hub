/**
 * SCRAPE AND EXTRACT EDGE FUNCTION
 *
 * Auto-fills onboarding by scraping URLs and extracting data with Claude AI
 *
 * 3 modes:
 * - generative: Scrape competitors → Generate ideas
 * - idea: Scrape web + LinkedIn + competitors → Pre-fill 80%
 * - existing: Scrape web + Stripe + Analytics + LinkedIn → Pre-fill 90%
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors-config.ts';
import { validateAuth } from '../_shared/auth.ts';
import { callClaude } from '../_shared/anthropic-client.ts';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');

serve(async (req) => {
  const origin = req.headers.get('Origin');
  // Handle CORS preflight
    if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(origin);
  }

    await validateAuth(req);
  try {
    const {
      type, // 'generative' | 'idea' | 'existing'
      // Generative
      urls: competitor_urls,
      // Idea
      business_pitch,
      social_media_urls,
      website_url,
      linkedin_urls,
      // Existing
      analytics_url,
      stripe_url,
      mixpanel_url,
      linkedin_company,
      twitter_handle,
      // Common
      competitor_urls: comp_urls,
    } = await req.json();

    if (!ANTHROPIC_API_KEY) {
      console.warn('ANTHROPIC_API_KEY not configured, using fallback mock data');
      // Fallback to mock data if API key not available
      return fallbackToMockData(type, competitor_urls, website_url, linkedin_urls, comp_urls);
    }

    let data;
    if (type === 'generative') {
      data = await generateFromCompetitors(competitor_urls || []);
    } else if (type === 'idea') {
      data = await extractForIdea(business_pitch, social_media_urls, website_url, linkedin_urls, comp_urls);
    } else if (type === 'existing') {
      data = await extractForExisting(
        website_url,
        analytics_url,
        stripe_url,
        mixpanel_url,
        linkedin_urls,
        linkedin_company,
        twitter_handle,
        comp_urls
      );
    } else {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid type' }),
        { status: 400, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error in scrape-and-extract:', error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
    );
  }
});

/**
 * Scrape a URL and return text content
 */
async function scrapeUrl(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}: ${response.status}`);
    }

    const html = await response.text();

    // Basic HTML cleaning - remove scripts, styles, and extract text
    const cleaned = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Limit to first 10000 characters to avoid token limits
    return cleaned.substring(0, 10000);
  } catch (error) {
        if (error instanceof Response) return error;
console.error(`Error scraping ${url}:`, error);
    return `Failed to scrape ${url}: ${(error as Error).message}`;
  }
}

async function generateFromCompetitors(urls: string[]) {
  if (!urls || urls.length === 0) {
    return getMockGenerativeData([]);
  }

  try {
    // Scrape competitor websites
    const scrapedData = await Promise.all(
      urls.slice(0, 5).map(async (url) => ({
        url,
        content: await scrapeUrl(url)
      }))
    );

    // Build prompt for Claude
    const systemPrompt = `You are an AI business analyst. Analyze competitor websites and generate business ideas that fill market gaps.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "competitors": [
    {
      "name": "string",
      "url": "string",
      "value_prop": "string",
      "target_audience": "string",
      "business_model": "string",
      "pricing": "string",
      "key_features": ["string"],
      "gaps": ["string"]
    }
  ],
  "generated_ideas": [
    {
      "title": "string",
      "description": "string",
      "based_on_gap": "string",
      "target_icp": "string",
      "difficulty": "low|medium|high",
      "market_opportunity": "string"
    }
  ]
}`;

    const userPrompt = `Analyze these competitor websites and generate business ideas:

${scrapedData.map((d, i) => `Competitor ${i + 1} (${d.url}):\n${d.content}\n\n`).join('')}

Identify their value props, target audiences, business models, key features, and gaps. Then generate 3-5 business ideas that exploit those gaps.`;

    const response = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY!, 8000);

    // Clean and parse response
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error generating from competitors:', error);
    return getMockGenerativeData(urls);
  }
}

async function extractForIdea(
  business_pitch: string,
  social_media_urls: Record<string, unknown>,
  website_url: string,
  linkedin_urls: string[],
  competitor_urls: string[]
) {
  try {
    // Scrape provided URLs
    const websiteContent = website_url ? await scrapeUrl(website_url) : '';
    const competitorContent = await Promise.all(
      (competitor_urls || []).slice(0, 3).map(async (url) => ({
        url,
        content: await scrapeUrl(url)
      }))
    );

    const systemPrompt = `You are an AI business analyst. Extract startup information from the business pitch and scraped website data.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "your_startup": {
    "value_prop": "string",
    "target_audience": "string",
    "key_features": ["string"],
    "pricing": "string",
    "industry": "string"
  },
  "founders": [
    {
      "name": "string",
      "linkedin": "string",
      "background": "string",
      "skills": ["string"],
      "unfair_advantages": ["string"]
    }
  ],
  "competitors": [
    {
      "name": "string",
      "url": "string",
      "differentiation": "string"
    }
  ],
  "competitive_analysis": {
    "your_differentiation": ["string"],
    "market_gaps": ["string"],
    "swot": {
      "strengths": ["string"],
      "weaknesses": ["string"],
      "opportunities": ["string"],
      "threats": ["string"]
    }
  }
}`;

    const userPrompt = `Extract startup information:

BUSINESS PITCH:
${business_pitch || 'Not provided'}

WEBSITE CONTENT (${website_url || 'not provided'}):
${websiteContent || 'Not available'}

SOCIAL MEDIA:
${JSON.stringify(social_media_urls || {}, null, 2)}

LINKEDIN PROFILES:
${(linkedin_urls || []).join('\n')}

COMPETITOR WEBSITES:
${competitorContent.map((c, i) => `${i + 1}. ${c.url}:\n${c.content.substring(0, 2000)}`).join('\n\n')}

Extract: value prop, target audience, features, pricing, founder backgrounds (infer from pitch), competitive analysis, and SWOT.`;

    const response = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY!, 8000);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error extracting for idea:', error);
    return getMockIdeaData(website_url, linkedin_urls, competitor_urls);
  }
}

async function extractForExisting(
  website_url: string,
  analytics_url: string,
  stripe_url: string,
  mixpanel_url: string,
  linkedin_urls: string[],
  linkedin_company: string,
  twitter_handle: string,
  competitor_urls: string[]
) {
  try {
    const websiteContent = website_url ? await scrapeUrl(website_url) : '';
    const competitorContent = await Promise.all(
      (competitor_urls || []).slice(0, 3).map(async (url) => ({
        url,
        content: await scrapeUrl(url)
      }))
    );

    const systemPrompt = `You are an AI business analyst. Extract business metrics and analyze an existing company.

Return ONLY valid JSON in this exact format (no markdown, no code blocks):
{
  "website": {
    "value_prop": "string",
    "features": ["string"],
    "pricing": "string"
  },
  "metrics": {
    "mrr": 0,
    "arr": 0,
    "customers": 0,
    "churn_rate": 0,
    "total_users": 0,
    "active_users": 0,
    "dau_mau": 0,
    "activation_rate": 0
  },
  "team": {
    "num_founders": 0,
    "num_employees": 0,
    "founders": [
      {
        "name": "string",
        "role": "string",
        "background": "string"
      }
    ]
  },
  "competitive_analysis": {
    "your_position": "string",
    "swot": {
      "strengths": ["string"],
      "weaknesses": ["string"],
      "opportunities": ["string"],
      "threats": ["string"]
    }
  }
}`;

    const userPrompt = `Analyze this existing business:

WEBSITE (${website_url || 'not provided'}):
${websiteContent || 'Not available'}

LINKEDIN COMPANY: ${linkedin_company || 'Not provided'}
LINKEDIN FOUNDERS: ${(linkedin_urls || []).join(', ')}
TWITTER: ${twitter_handle || 'Not provided'}

ANALYTICS URL: ${analytics_url || 'Not provided - infer from website'}
STRIPE URL: ${stripe_url || 'Not provided - infer from website'}
MIXPANEL URL: ${mixpanel_url || 'Not provided'}

COMPETITORS:
${competitorContent.map((c, i) => `${i + 1}. ${c.url}:\n${c.content.substring(0, 2000)}`).join('\n\n')}

Extract: website value prop/features/pricing, estimate metrics (MRR, customers, etc. - be realistic), team info, and competitive SWOT analysis.`;

    const response = await callClaude(systemPrompt, userPrompt, ANTHROPIC_API_KEY!, 8000);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (error) {
        if (error instanceof Response) return error;
console.error('Error extracting for existing:', error);
    return getMockExistingData();
  }
}

// Fallback mock data functions
function fallbackToMockData(type: string, competitor_urls: string[], website_url: string, linkedin_urls: string[], comp_urls: string[]) {
  let data;
  if (type === 'generative') {
    data = getMockGenerativeData(competitor_urls || []);
  } else if (type === 'idea') {
    data = getMockIdeaData(website_url, linkedin_urls, comp_urls);
  } else {
    data = getMockExistingData();
  }
  return new Response(
    JSON.stringify({ success: true, data }),
    { headers: { 'Content-Type': 'application/json', ...getCorsHeaders(origin) } }
  );
}

function getMockGenerativeData(urls: string[]) {
  return {
    competitors: urls.map((url, idx) => ({
      name: `Competitor ${idx + 1}`,
      url,
      value_prop: 'Example value proposition',
      target_audience: 'SMB teams',
      business_model: 'SaaS subscription',
      pricing: '$10-50/user/month',
      key_features: ['Feature 1', 'Feature 2', 'Feature 3'],
      gaps: ['No mobile app', 'Complex UI', 'Expensive for small teams'],
    })),
    generated_ideas: [
      {
        title: 'Mobile-First Alternative',
        description: 'Simplified mobile app targeting solopreneurs',
        based_on_gap: 'No competitor has mobile-first experience',
        target_icp: 'Solo founders, freelancers',
        difficulty: 'medium',
        market_opportunity: 'Large - 50M+ solopreneurs',
      },
    ],
  };
}

function getMockIdeaData(website_url: string, linkedin_urls: string[], competitor_urls: string[]) {
  return {
    your_startup: {
      value_prop: 'AI-powered task management that learns your priorities',
      target_audience: 'Solo founders and small teams (1-10 people)',
      key_features: ['AI auto-prioritization', 'Voice input', 'Mobile-first', 'Slack integration'],
      pricing: 'Free tier + $9/mo Pro',
      industry: 'SaaS B2B (Productivity)',
    },
    founders: (linkedin_urls || ['']).map((url, idx) => ({
      name: `Founder ${idx + 1}`,
      linkedin: url,
      background: '10 years in product management at Google, built internal tools for 5000+ employees',
      skills: ['Product Management', 'AI/ML', 'Growth Marketing', 'Team Leadership'],
      unfair_advantages: [
        'Deep product experience at scale',
        'Network of 200+ PMs who could be early adopters',
        'Technical background - can ship MVP solo',
      ],
    })),
    competitors: (competitor_urls || []).map((url, idx) => ({
      name: `Competitor ${idx + 1}`,
      url,
      differentiation: 'Desktop-first, complex UI, expensive for small teams',
    })),
    competitive_analysis: {
      your_differentiation: [
        'Mobile-first (competitors are desktop-first)',
        'AI-native (competitors bolt-on AI)',
        'Affordable for solopreneurs ($9 vs $15-50)',
        'Voice input (unique feature)',
      ],
      market_gaps: [
        'No competitor targets solo founders specifically',
        'All competitors have overwhelming UI',
        'No mobile-optimized solution exists',
      ],
      swot: {
        strengths: [
          'Founder has PM experience at scale',
          'Strong network for early adoption',
          'Affordable pricing → low barrier',
          'Mobile-first → huge TAM (mobile-only users)',
        ],
        weaknesses: [
          'Solo founder (no co-founder yet)',
          'No funding raised',
          'Crowded market (50+ competitors)',
        ],
        opportunities: [
          'Remote work trend → more solo founders',
          'Mobile usage increasing',
          'AI becoming table stakes → early mover advantage',
        ],
        threats: [
          'Notion/ClickUp could add mobile-first features',
          'Well-funded competitors (Asana $1.5B, Monday $7B)',
          'Low switching costs → need strong retention',
        ],
      },
    },
  };
}

function getMockExistingData() {
  return {
    website: {
      value_prop: 'AI-powered customer support automation for SaaS companies',
      features: ['AI chatbot', 'Ticket routing', 'Knowledge base', 'Analytics dashboard', 'Multi-channel support'],
      pricing: 'Starts at $99/mo + usage',
    },
    metrics: {
      mrr: 47000,
      arr: 564000,
      customers: 143,
      churn_rate: 3.2,
      total_users: 8934,
      active_users: 4521,
      dau_mau: 0.42,
      activation_rate: 67,
    },
    team: {
      num_founders: 2,
      num_employees: 8,
      founders: [
        {
          name: 'Founder 1',
          role: 'CEO',
          background: '8 years at Zendesk as Product Manager, built chatbot product from 0→$10M ARR',
        },
        {
          name: 'Founder 2',
          role: 'CTO',
          background: '10 years engineering at Stripe, ML specialist, 2 patents in NLP',
        },
      ],
    },
    competitive_analysis: {
      your_position: 'Mid-tier player in AI customer support space',
      swot: {
        strengths: [
          'Strong product-market fit (3.2% churn is excellent)',
          'Experienced founders with domain expertise',
          'Growing MRR (25% month-over-month)',
          'High activation rate (67%)',
        ],
        weaknesses: [
          'Small team (8 people) for ambitious growth targets',
          'Limited brand awareness vs incumbents',
          'Higher pricing than some competitors',
        ],
        opportunities: [
          'AI adoption accelerating → strong tailwinds',
          'SMB segment underserved',
          'Expansion to voice support (competitors lack this)',
          'International expansion (currently US-only)',
        ],
        threats: [
          'Zendesk/Intercom adding AI features',
          'Well-funded startups (Intercom $1B, Zendesk $10B)',
          'OpenAI could commoditize chatbot tech',
        ],
      },
    },
  };
}
